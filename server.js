require('dotenv').config()
const express = require("express");
const app = express();

const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI

mongoose.connect(uri , {useNewUrlParser: true})
  .then(() => console.log('Connected!'))
  .catch(() => console.log('Not connected'))

const bodyParser = require("body-parser")
app.use(bodyParser.json());

const userSchema = new mongoose.Schema({
  fname: String,
  lname: String,
  email: String,
  age: Number
});

const User = mongoose.model('User', userSchema);

app.get("/", (req, res) => {
  res.json({ msg: "I am connected" })
});

const users = [];
let id = 0;
app.post("/users", (req, res) => {
  const user = req.body;
  user.id = ++id;
  users.push(user);
  res.json(users);
});

app.get("/users", (req, res) => {
  res.json(users);
});
app.get("/users/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const user = users.find((user) => user.id === id);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: "user missing" })
  } 
});

app.put('/users/:id', (req,res) => {
  const id = req.params.id
  const body = req.body

  const user = users.find((u) => u.id == id)
  if (user) {
    user.fname = body.fname
    user.lname = body.lname
    res.json(user);
  } else {
    res.status(404).json({ message: "user missing" });
  } 

})

app.delete('/users/:id', (req,res) => {
  const id = req.params.id
  const userIndex = users.findIndex((u) => u.id == id)
  if (userIndex) {
    users.splice(userIndex,1)
    res.json({massage: "user deleted"});
  } else {
    res.status(404).json({ message: "user missing" });
  } 

})

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`I am running on port ${port}`);
});
 