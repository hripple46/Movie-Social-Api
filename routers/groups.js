const express = require("express");
const router = express.Router();
const Group = require("../models/Group");
const jwt = require("jsonwebtoken");
const Post = require("../models/Post");

//this router is for pulling a specific group
router.get("/:id", async (req, res) => {
  const group = await Group.findById(req.params.id);
  res.json(group);
});

//this router is for pulling a list of active users
router.get("/:groupId/activeusers", async (req, res) => {
  const group = await Group.findById(req.params.groupId);
  res.json(group.activeUsers);
});

//this router is for adding a user to a group
router.post("/:groupId/activeusers/:userId", async (req, res) => {
  const group = await Group.findById(req.params.groupId);

  //check if user is already in group
  const checkIfExists = group.activeUsers.includes(req.params.userId);
  if (checkIfExists) {
    return res.status(400).send("User Already Belongs to Group");
  }
  //remove user from pending list and add to active list
  const index = group.pendingUsers.indexOf(req.params.userId);
  group.pendingUsers.splice(index, 1);
  await group.activeUsers.push(req.params.userId);
  await group.save();
  res.json(group.activeUsers);
});

//this router is for pulling list of pending users
router.get("/:groupId/pendingusers", async (req, res) => {
  const group = await Group.findById(req.params.groupId);
  return res.json(group.pendingUsers);
});

//this router adds a user to the pending list
router.post("/:groupName/pendingusers/:userId", async (req, res) => {
  const group = await Group.findOne({ name: req.params.groupName });
  //check if group exists
  if (!group || !group.activeUsers) {
    return res.status(500).send("Server error");
  }
  //check if user is already in group
  const checkIfExists = group.activeUsers.includes(req.params.userId);
  if (checkIfExists) {
    return res.status(400).send("User Already Belongs to Group");
  }
  //add user to pending list
  await group.pendingUsers.push(req.params.userId);
  await group.save();
  res.json(group.pendingUsers);
});

//this router gets all posts for a group
router.get("/:groupId/posts", verifyToken, async (req, res) => {
  //verify token
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    console.log("Request", req.token);
    if (err) {
      res.sendStatus(403);
    } else {
      try {
        //check if user is in group
        const group = await Group.findById(req.params.groupId);
        //if user is in group, return posts
        if (group.activeUsers.includes(authData.user._id)) {
          const posts = group.posts;
          //get all posts
          const groupPosts = [];
          for (let i = 0; i < posts.length; i++) {
            const post = await Post.findById(posts[i]);
            groupPosts.push(post);
          }
          console.log("posts", posts);
          //return posts
          res.json({ groupPosts, authData });
        } else {
          res.status(403).send("User not in group");
        }
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
