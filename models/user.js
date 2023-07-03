const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String, required: true, max: 100 },
  password: { type: String, required: true },
  groups: [{ type: Schema.Types.ObjectId, ref: "Group" }],
  admin: [{ type: Schema.Types.ObjectId, ref: "Group" }],
  posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
});

module.exports = mongoose.model("User", UserSchema);
