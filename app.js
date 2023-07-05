require("dotenv").config();
const mongoose = require("mongoose");
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
const User = require("./models/user");
const Post = require("./models/Post");

const app = express();
const PORT = 3000;

const groupsRouter = require("./routers/groups");
const usersRouter = require("./routers/users");

mongoose.connect(process.env.MONGODB_PASSWORD);

app.use(cors());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.listen(PORT, (error) => {
  if (!error) {
    console.log(
      "Server is Successfully Running, and App is listening on port " + PORT
    );
  } else {
    console.log("Error occurred, server can't start", error);
  }
});

app.use("/groups", groupsRouter);
app.use("/users", usersRouter);
