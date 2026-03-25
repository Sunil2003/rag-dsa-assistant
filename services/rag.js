// services/rag.js

import { getEmbedding } from "./embedding.js";
import { search } from "./vectorStore.js";
import { getHistory, saveChat } from "./memory.js";
import { streamLLM } from "./llm.js";

export async function handleQuery(userId, query, res) {

  const history = await getHistory(userId);

  const historyText = history
    .map(h => `User: ${h.query}\nAssistant: ${h.response}`)
    .join("\n");

  const queryEmbedding = await getEmbedding(query);

  const docs = await search(queryEmbedding);

  const context = docs.join("\n\n");

  const prompt = `
  You are an DSA instructor.

CONTEXT:
${context}

---

---

USER QUESTION:
${query}

---

ANSWER:
`;

  let fullResponse = "";

  await streamLLM(prompt, {
    write: (chunk) => {
      fullResponse += chunk;
      res.write(chunk);
    },
    end: async () => {
      await saveChat(userId, query, fullResponse);
      res.end();
    }
  });
}