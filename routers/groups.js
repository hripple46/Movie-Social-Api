const express = require("express");
const router = express.Router();
const Group = require("../models/Group");
const User = require("../models/user");
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
  const checkIfExists = group.activeUsers
    .map((user) => user.toString())
    .includes(req.params.userId.toString());
  if (checkIfExists) {
    return res.status(400).send("User Already Belongs to Group");
  }
  //remove user from pending list and add to active list
  const index = group.pendingUsers.indexOf(req.params.userId);
  group.pendingUsers.splice(index, 1);
  await group.activeUsers.push(req.params.userId);
  await group.save();
  //add group to users list of groups
  const user = await User.findById(req.params.userId);
  await user.groups.push(req.params.groupId);
  await user.save();

  res.json(group.activeUsers);
});

//router for denying a user from a group
router.delete("/:groupId/pendingusers/:userId", async (req, res) => {
  const group = await Group.findById(req.params.groupId);
  //check if user is in pending list
  const checkIfExists = group.pendingUsers.includes(req.params.userId);
  if (!checkIfExists) {
    return res.status(400).send("User Not in Pending List");
  }
  //remove user from pending list
  const index = group.pendingUsers.indexOf(req.params.userId);
  group.pendingUsers.splice(index, 1);
  await group.save();
  res.json(group.pendingUsers);
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
  console.log("userId", req.params.userId);
  const checkIfExists = group.activeUsers.includes(req.params.userId);
  if (checkIfExists) {
    return res.status(400).send("User Already Belongs to Group");
  }
  //add user to pending list
  await group.pendingUsers.push(req.params.userId);
  await group.save();
  res.json(group.pendingUsers);
});

router.get("/:groupId/posts", verifyToken, async (req, res) => {
  //verify token
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    console.log("Request", req.token);
    if (err) {
      res.sendStatus(403);
    } else {
      try {
        //check if user is in group
        const group = await Group.findById(req.params.groupId).populate({
          path: "posts",
          populate: {
            path: "user",
            model: "User",
          },
        });
        //if user is in group, return posts
        if (group.activeUsers.includes(authData.user._id)) {
          const groupPosts = group.posts.map((post) => {
            if (post.user) {
              return { post, user: post.user };
            } else {
              return { post };
            }
          });
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

//this router adds a post to a group
router.post("/:groupId/posts", verifyToken, async (req, res) => {
  //verify token
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    console.log("Request", req.token);
    if (err) {
      res.sendStatus(403);
    } else {
      try {
        const group = await Group.findById(req.params.groupId);
        const post = new Post({
          movie: req.body.movie,
          group: req.body.group.id,
          user: req.body.user._id,
          recommends: req.body.recommends,
        });
        await post.save();
        await group.posts.push(post._id);
        await group.save();
        res.json(post);
      } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
      }
    }
  });
});

//router for creating a new group
router.post("/", verifyToken, async (req, res) => {
  console.log("Body", req.body);
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    //check if group exists
    const groupExists = await Group.findOne({ name: req.body.name });
    //get user
    const user = await User.findById(req.body.admin._id);
    if (groupExists) {
      return res.status(400).send("Group already exists");
    } else {
      const group = new Group({
        name: req.body.name,
        //set admin to user id
        admin: req.body.admin._id,
        posts: [],
        pendingUsers: [],
        //add admin to active users
        activeUsers: [req.body.admin._id],
      });
      try {
        await group.save();
        user.groups.push(group._id);
        //add group to users admin list
        user.admin.push(group._id);
        await user.save();

        res.json(group);
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
