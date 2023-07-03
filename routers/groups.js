const express = require("express");
const router = express.Router();
const Group = require("../models/Group");

router.get("/:id", async (req, res) => {
  const group = await Group.findById(req.params.id);
  res.json(group);
});

router.get("/:id/activeusers", async (req, res) => {
  const group = await Group.findById(req.params.id);
  res.json(group.activeUsers);
});

module.exports = router;
