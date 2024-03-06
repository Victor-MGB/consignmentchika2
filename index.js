const express = require('express');
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
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

app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`);
})