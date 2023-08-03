const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    fname:{
        type: String
    },
    lname:{
        type: String
    },
    email:{
        type: String
    },
    password:{
        type: String
    },
   age:{
        type: Number
    }
  },
  {
    timestamps: true,
  }
);

module.exports = User = mongoose.model("User", UserSchema);
