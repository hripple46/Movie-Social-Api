const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  text: String,
  user: { type: Schema.Types.ObjectId, ref: "User" },
  group: { type: Schema.Types.ObjectId, ref: "Group" },
});

module.exports = mongoose.model("Message", MessageSchema);
