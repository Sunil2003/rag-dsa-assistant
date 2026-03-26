// services/rag.js

import { getEmbedding } from "./embedding.js";
import { search } from "./vectorStore.js";
import { getHistory, saveChat } from "./memory.js";
import { streamLLM, generateText } from "./llm.js";

async function rewriteQuery(historyText, query) {
  const prompt = `
You are an AI assistant.

Convert the user's question into a standalone question using chat history.

CHAT HISTORY:
${historyText}

QUESTION:
${query}

Standalone question:
`;

  const rewritten = await generateText(prompt);

  return rewritten.trim() || query;
}




export async function handleQuery(userId, query, res) {

  // 1. Get history
  const history = await getHistory(userId);

  const historyText = history
    .map(h => `User: ${h.query}\nAssistant: ${h.response}`)
    .join("\n");

  // 2. Rewrite query ( key step)
  const finalQuery = await rewriteQuery(historyText, query);

  // 3. Embedding
  const queryEmbedding = await getEmbedding(finalQuery);

  // 4. Search
  const docs = await search(queryEmbedding);

  const context = docs.join("\n\n");

  // 5. FINAL PROMPT ( improved)
 const prompt = `
You are a strict DSA instructor.

IMPORTANT RULES:
- Answer ONLY from the provided CONTEXT.
- If the answer is not in CONTEXT, say "I don't know".
- Do NOT use your own knowledge.
- Do NOT guess.

---

CONTEXT:
${context}

---

QUESTION:
${finalQuery}

---

ANSWER:
`;

  let fullResponse = "";

  // 6. Streaming
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