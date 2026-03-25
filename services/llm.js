// services/llm.js
import dotenv from "dotenv";

import { GoogleGenerativeAI } from "@google/generative-ai";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function streamLLM(prompt, res) {
  const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
  });

  const result = await model.generateContentStream(prompt);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    res.write(text);
  }

  res.end();
}