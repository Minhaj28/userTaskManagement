const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const User = require("../../models/User");
const Task = require("../../models/Task");
const jwt = require("jsonwebtoken");
const authenticateToken = require("../../middleware/auth");

const router = express.Router();

router.post(
  "/",
  [
    authenticateToken,
    [
        body("title", "title is required").notEmpty(),
    ],
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
    const id = req.user.id;
      const taskObj = {
        title: req.body.title,
        desc: req.body.desc ?? "",
        userId: id,
      };
      const task = new Task(taskObj);
      await task.save();
      res.status(201).json(task);
    } catch (error) {
      console.error(error);
      res.status(500).json({ massage: "Something is wrong with the server" });
    }
  }
);

router.get("/", authenticateToken, async (req, res) => {
  try {
    const id = req.user.id;
    const tasks = await Task.find({userId: id});
    res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ massage: "Something is wrong with the server" });
  }
});

router.get("/:id", authenticateToken, async (req, res) => {
    try {
      const id = req.params.id;
      const userId = req.user.id;
      const task = await Task.findOne({userId: userId, _id: id});
      if (task) {
        res.status(200).json(task);
      } else {
        res.status(404).json({ message: "task not found" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ massage: "Something is wrong with the server" });
    }
  });

router.put(
    "/status/:id",
    [
      authenticateToken,
      body("status", "status is invalid").isIn(['to-do','in-progress','done']),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        const id = req.params.id;
        const body = req.body;
        const userId = req.user.id;

        const task = await Task.findOneAndUpdate({userId: userId, _id: id}, body, { new: true });
        if (task) {
          res.status(200).json(task);
        } else {
          res.status(404).json({ message: "task not found" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ massage: "Something is wrong with the server" });
      }
    }
  );

  router.put(
    "/:id",
    [
      authenticateToken,
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        const id = req.params.id;
        const body = req.body;
        const userId = req.user.id;

        const task = await Task.findOneAndUpdate({userId: userId, _id: id}, body, { new: true });
        if (task) {
          res.status(200).json(task);
        } else {
          res.status(404).json({ message: "task not found" });
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
    const userId = req.user.id;

    const task = await Task.findOneAndDelete({userId: userId, _id: id});
    if (task) {
      res.status(200).json([task, { massage: "task deleted" }]);
    } else {
      res.status(404).json({ message: "task not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ massage: "Something is wrong with the server" });
  }
});

module.exports = router;

