require("dotenv").config();
const express = require("express");
const app = express();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const uri = process.env.MONGODB_URI;

mongoose
  .connect(uri, { useNewUrlParser: true })
  .then(() => console.log("Connected!"))
  .catch(() => console.log("Not connected"));

const bodyParser = require("body-parser");
app.use(bodyParser.json());

const userSchema = new mongoose.Schema(
  {
    fname: String,
    lname: String,
    email: String,
    password: String,
    age: Number,
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.status(200).json({ msg: "I am connected" });
});

app.post("/users", async (req, res) => {
  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);
    const password = hash;
    const userObj = {
      fname: req.body.fname,
      lname: req.body.lname,
      email: req.body.email,
      age: req.body.age,
      password: password,
    };
    const user = new User(userObj);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ massage: "Something is wrong with the server" });
  }
});
app.post("/users/login", async (req, res) => {
  try {
    const { email, password, type, refreshToken } = req.body;
    if (!type) {
      res.status(404).json({ message: "Type is not defined" });
    } else {
      if (type == "email") {
        await handleEmailLogin(email, res, password);
      }else {
        handleRefreshLogin(refreshToken, res);
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ massage: "Something is wrong with the server" });
  }
});

//? middleware to authenticate JWT access token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  } else {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        res.status(401).json({ message: "Unauthorized" });
      } else {
        req.user = user;
        next();
      }
    });
  }
};

app.get("/users/profile", authenticateToken, async (req, res) => {
  try {
    const id = req.user.id;
    const user = await User.findById(id);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: "user not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ massage: "Something is wrong with the server" });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ massage: "Something is wrong with the server" });
  }
});

app.get("/users/:id", authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: "user not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ massage: "Something is wrong with the server" });
  }
});

app.put("/users/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body;
    const user = await User.findByIdAndUpdate(id, body, { new: true });
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: "user not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ massage: "Something is wrong with the server" });
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findByIdAndDelete(id);
    if (user) {
      res.status(200).json([user, { massage: "user deleted" }]);
    } else {
      res.status(404).json({ message: "user not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ massage: "Something is wrong with the server" });
  }
});

function handleRefreshLogin(refreshToken, res) {
  if (!refreshToken) {
    res.status(401).json({ message: "RefreshToken is not defined" });
  } else {
    jwt.verify(refreshToken, process.env.JWT_SECRET, async (err, payload) => {
      if (err) {
        res.status(401).json({ message: "Unauthorized" });
      } else {
        const id = payload.id;
        const user = await User.findById(id);
        if (!user) {
          res.status(401).json({ message: "Unauthorized" });
        } else {
          getUserTokens(user, res);
        }
      }
    });
  }
}

async function handleEmailLogin(email, res, password) {
  const user = await User.findOne({ email: email });
  if (!user) {
    res.status(404).json({ message: "user not found" });
  } else {
    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ message: "wrong password" });
    } else {
      getUserTokens(user, res);
    }
  }
}

function getUserTokens(user, res) {
  const accessToken = jwt.sign(
    { email: user.email, id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "1m" }
  );
  const refreshToken = jwt.sign(
    { email: user.email, id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "50m" }
  );
  const userObj = user.toJSON();
  userObj["accessToken"] = accessToken;
  userObj["refreshToken"] = refreshToken;
  res.status(200).json(userObj);
}


const port = process.env.PORT;
app.listen(port, () => {
  console.log(`I am running on port ${port}`);
});

