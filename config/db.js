const mongoose = require("mongoose");
const uri = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    mongoose.connect(
        uri, 
        { useNewUrlParser: true }
    )
    console.log("Mongose Connection Open");
  } catch (error) {
    console.log(error.massage);
  }
};

module.exports = connectDB;
