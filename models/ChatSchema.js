// models/Chat.js

import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  userId: String,
  query: String,
  response: String
}, { timestamps: true });

export default mongoose.model("Chat", chatSchema);