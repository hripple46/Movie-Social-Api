const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../models/user");
const Group = require("../models/Group");

//this router is for creating a new user
router.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
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
      });
      //save user
      await newUser.save();
      res.json(newUser);
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

module.exports = router;
