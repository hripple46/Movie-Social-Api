const express = require("express");
const router = express.Router();
const Group = require("../models/Group");

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
  const checkIfExists = group.activeUsers.includes(req.params.userId);
  if (checkIfExists) {
    return res.status(400).send("User Already Belongs to Group");
  }
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

//this router gets all posts for a group
router.get("/:groupId/posts", async (req, res) => {});

module.exports = router;
