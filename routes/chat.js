// routes/chat.js

import express from "express";
import { handleQuery } from "../services/rag.js";

const router = express.Router();

router.post("/ask", async (req, res) => {
  const { userId, query } = req.body;

  res.setHeader("Content-Type", "text/plain");

  await handleQuery(userId, query, res);
});

export default router;