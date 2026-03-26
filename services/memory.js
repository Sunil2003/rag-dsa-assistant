// services/memory.js

import Chat from "../models/ChatSchema.js";

export async function saveChat(userId, query, response) {
  await Chat.create({ userId, query, response });
}

export async function getHistory(userId) {
  return await Chat.find({ userId })
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();
}