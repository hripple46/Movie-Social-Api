const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const User = require("./user");

const GroupSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  admin: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
  pendingUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  activeUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

module.exports = mongoose.model("Group", GroupSchema);
