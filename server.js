const express = require("express");
const app = express();

require("dotenv").config(); 
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
app.use(bodyParser.json());
connectDB();

app.get("/", (req, res) => {
  res.status(200).json({ msg: "I am connected" });
});

app.use('/api/users', require('./routes/api/users'));
app.use('/api/tasks', require('./routes/api/tasks'));


const port = process.env.PORT;
app.listen(port, () => {
  console.log(`I am running on port ${port}`);
});

