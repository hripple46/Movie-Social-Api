const express = require("express");
const router = express.Router();
const Group = require("../models/Group");

router.get("/:id", async (req, res) => {
  const group = await Group.findById(req.params.id);
  res.json(group);
});

router.get("/:groupId/activeusers", async (req, res) => {
  const group = await Group.findById(req.params.groupId);
  res.json(group.activeUsers);
});

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

router.get("/:groupId/pendingusers", async (req, res) => {
  const group = await Group.findById(req.params.groupId);
  return res.json(group.pendingUsers);
});

module.exports = router;
