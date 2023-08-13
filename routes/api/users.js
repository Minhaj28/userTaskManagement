const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const User = require("../../models/User");
const jwt = require("jsonwebtoken");
const authenticateToken = require("../../middleware/auth");

const router = express.Router();

router.post(
  "/",
  [
    authenticateToken,
    body("fname", "fname is required").notEmpty(),
    body("lname", "lname is required").notEmpty(),
    body("email", "please enter a valid email").notEmpty().isEmail(),
    body("age", "age is required").optional().isNumeric(),
    body(
      "password",
      "please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
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
  }
);

/**
  * @author Md Minhaj Uddin
  * @desc Login a user
  * @param {email, password, type, refreshToken}
  * @return {accessToken , refreshToken , user}
*/

router.post(
  "/login",
  [
    body("type", "type must be email or refresh").isIn(["email", "refresh"]),
    body("email", "please enter a valid email").notEmpty().isEmail(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { email, password, type, refreshToken } = req.body;

      if (type == "email") {
        await handleEmailLogin(email, res, password);
      } else {
        handleRefreshLogin(refreshToken, res);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ massage: "Something is wrong with the server" });
    }
  }
);

router.get("/profile", authenticateToken, async (req, res) => {
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

router.get("/", authenticateToken, async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ massage: "Something is wrong with the server" });
  }
});

router.get("/:id", authenticateToken, async (req, res) => {
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

router.put(
  "/:id",
  [
    authenticateToken,
    body("fname", "fname is required").notEmpty(),
    body("lname", "lname is required").notEmpty(),
    body("email", "please enter a valid email").notEmpty().isEmail(),
    body("age", "age is required").optional().isNumeric(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
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
  }
);

router.delete("/:id", authenticateToken, async (req, res) => {
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

module.exports = router;

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

/**
  * @author Md Minhaj Uddin
  * @desc Handle email login
  * @param email, password
  * @return accessToken , refreshToken , user
*/

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
