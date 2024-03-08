const express = require('express');
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const User = require('./model/UserModel')
require("dotenv").config();

const app = express()
app.use(cors())

mongoose.connect(process.env.DB_CONNECTION_STRING,{
    useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error",(error)=>{
    console.error("mongodb connection error",error);
})

db.once("open",()=>{
    console.log("connected to mongodb");
})

const PORT = process.env.PORT || 4000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}))

// Registration Route
app.post("/signup", async (req, res) => {
  try {
    const { email, phoneNumber, password, fullName, userName } = req.body;

    // Check if the email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.json({ success: false, message: "Email already exists" });
    }

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with the updated model
    const newUser = await User.create({
      email,
      phoneNumber,
      password: hashedPassword,
      fullName,
      userName,
    });

    // Generate and send a JWT token upon successful registration with expiration time (e.g., 1 day)
    const token = jwt.sign({ userId: newUser._id }, process.env.SECRET_KEY, {
      expiresIn: "2w",
    });

    res.json({
      success: true,
      token,
      message: "Registration successful",
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key violation for email or username
      res.json({ success: false, message: "Email or username already exists" });
    } else {
      console.error(error);
      res.status(500).json("Internal Server Error");
    }
  }
});

app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`);
})