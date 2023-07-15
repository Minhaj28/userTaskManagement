require("dotenv").config();
const express = require("express");
const app = express();

const mongoose = require("mongoose");

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
    age: Number,
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.json({ msg: "I am connected" });
});

app.post("/users", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ massage: "Something is wrong with the server" });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ massage: "Something is wrong with the server" });
  }
});

app.get("/users/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "user not found"});
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
  const user = await User.findByIdAndUpdate(id,body,{new:true});
  if (user) {
    res.json(user);
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
    res.json([user,{massage: 'user deleted'}]);
  } else {
    res.status(404).json({ message: "user not found" });
  }
  } catch (error) {
    console.error(error);
    res.status(500).json({ massage: "Something is wrong with the server" });
  }
});

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`I am running on port ${port}`);
});
