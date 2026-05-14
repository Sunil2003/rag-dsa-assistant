// routes/chat.js

import express from "express";
import { handleQuery } from "../services/rag.js";

const router = express.Router();

// router.post("/ask", async (req, res) => {
//   const { userId, query } = req.body;

//   res.setHeader("Content-Type", "text/plain");

//   await handleQuery(userId, query, res);
// });

router.post("/ask", async (req, res) => {
  const { userId, query } = req.body;

  if (!userId || !query) {
    return res.status(400).send("userId and query are required.");
  }

  res.setHeader("Content-Type", "text/plain");

  try {
    await handleQuery(userId, query, res);
  } catch (err) {
    console.error("❌ handleQuery error:", err.message);
    if (!res.headersSent) {
      res.status(500).send("Server error: " + err.message);
    }
  }
});

export default router;
