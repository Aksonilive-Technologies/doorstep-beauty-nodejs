const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const fs = require('fs');
const path = require('path');
const dotenv = require("dotenv");
dotenv.config();

const app = express();

const port = 5000;
const AppError = require("./utility/appError");
app.use(express.json());
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "100mb" }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));

 
const multer = require("multer");
const storage = multer.memoryStorage();
const crypto = require("crypto");

 
// Connect to MongoDB
mongoose.connect(process.env.db_url);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});
 


app.get("/", (req, res) => {
  return res.send("Hello Beauty!");
});
 

app.all('*', async (request, response, next) => {
  next(new AppError(`Can't find ${request.originalUrl} on this server`, 404));
});

// Register SIGINT event listener
process.on('SIGINT', async () => {
  process.exit();
});
 


app.listen(process.env.PORT, () => {
  console.log(`Example app listening at http://localhost:${process.env.PORT}`);
});
 
