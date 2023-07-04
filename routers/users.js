const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const User = require("../models/user");

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "User does not exist" });
    }
    if (password !== user.password) {
      return res.status(401).json({ error: "Incorrect password" });
    } else {
      jwt.sign({ user }, "secretkey", (err, token) => {
        res.json({
          token,
        });
      });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

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
