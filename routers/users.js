require("dotenv").config();

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const nodemailer = require("nodemailer");

const User = require("../models/user");
const Group = require("../models/Group");

//this router is for creating a new user
router.post("/signup", body("email").trim().isEmail(), async (req, res) => {
  try {
    const result = validationResult(req);
    if (result.isEmpty()) {
      const { username, password, email } = req.body;
      const userExists = await User.findOne({ username });
      //check if user exists
      if (userExists) {
        return res.status(400).json({ error: "User already exists" });
      } else {
        //hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        //create new user
        const newUser = new User({
          username,
          password: hashedPassword,
          email,
        });
        //save user
        await newUser.save();
        res.json(newUser);
      }
    } else {
      res.send({ errors: result.array() });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

//this router is for logging in a user and generating a token
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "User does not exist" });
    }
    //check if password is correct
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        res.status(403).json({ error: "Incorrect password" });
      }
      if (isMatch) {
        jwt.sign({ user }, "secretkey", (err, token) => {
          const userId = user._id;
          res.json({
            token,
            userId,
          });
        });
      } else {
        res.status(403).json({ error: "Incorrect password" });
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

//get user info
router.get("/:UserId", verifyToken, async (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      try {
        const user = await User.findById(req.params.UserId);
        res.json(user);
        console.log("user", user);
      } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
      }
    }
  });
});

//get all groups for a user
router.get("/:UserId/groups", verifyToken, async (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    console.log("Request", req.token);
    if (err) {
      res.sendStatus(403);
    } else {
      try {
        const user = await User.findById(req.params.UserId);
        const groups = user.groups;
        console.log("groups", groups);

        const groupNames = await Promise.all(
          groups.map(async (group) => {
            const groupDoc = await Group.findById(group);
            return { name: groupDoc.name, id: groupDoc._id };
          })
        );

        console.log("groupNames", groupNames);
        res.json({ groupNames, authData });
      } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
      }
    }
  });
});

//router for resetting a password
router.post("/reset", async (req, res) => {
  const email = req.body.email;
  const user = await User.findOne({ email });
  if (!user) {
    res.status(400).json({ error: "Email does not exist" });
  } else {
    jwt.sign({ user }, "secretkey", (err, token) => {
      //send email
      const url = `https://movie-groups.com/reset-password/${token}`;
      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      var mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: "One-Time Password Reset Link",
        text: "Please click the link below to reset your password" + url,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          res.status(500).json({ error: "Internal server error" });
        } else {
          res.status(200).json({ message: "Email sent" });
        }
      });
    });
  }
});
//router got getting user reset link
router.get("/reset/:userId/:token", verifyResetToken, async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    res.status(400).json({ error: "User does not exist" });
  } else {
    jwt.verify(req.token, "secretkey", (err, authData) => {
      if (err) {
        res.sendStatus(403);
      } else {
        res.status(200).json({ user });
      }
    });
  }
});

//verifies the token sent by the client
function verifyToken(req, res, next) {
  //get auth header
  const bearerHeader = req.headers["authorization"];
  console.log(bearerHeader);

  if (typeof bearerHeader !== "undefined") {
    //split header
    const bearer = bearerHeader.split(" ");
    //get token
    const bearerToken = bearer[1];
    //set token
    req.token = bearerToken;
    //next middleware
    next();
  } else {
    res.sendStatus(403);
  }
}
//verifies the reset token sent by the client from the params
function verifyResetToken(req, res, next) {
  //get auth header
  const bearerToken = req.params.token;

  if (typeof bearerToken !== "undefined") {
    //set token
    req.token = bearerToken;
    //next middleware
    next();
  } else {
    res.sendStatus(403);
  }
}

module.exports = router;
