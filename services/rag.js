// services/rag.js

import { getEmbedding } from "./embedding.js";
import { search } from "./vectorStore.js";
import { getHistory, saveChat } from "./memory.js";
import { streamLLM, generateText } from "./llm.js";

// Rewrite query using conversation history
async function rewriteQuery(historyText, query) {
  try {
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

    return rewritten?.trim() || query;
  } catch (error) {
    console.error("Rewrite query error:", error.message);
    return query; // fallback
  }
}

export async function handleQuery(userId, query, res) {
  try {
    // 1. Get chat history
    const history = await getHistory(userId);

    const historyText = history
      .map(h => `User: ${h.query}\nAssistant: ${h.response}`)
      .join("\n");

    // 2. Rewrite query
    const finalQuery = await rewriteQuery(historyText, query);

    console.log("Final Query:", finalQuery);

    // 3. Generate embedding
    const queryEmbedding = await getEmbedding(finalQuery);

    if (!queryEmbedding) {
      throw new Error("Embedding generation failed");
    }

    // 4. Search relevant chunks
    const docs = await search(queryEmbedding);

    console.log("Retrieved docs:", docs?.length || 0);

    const context =
      docs && docs.length > 0
        ? docs.join("\n\n")
        : "No relevant context found.";

    // 5. Build final prompt
    const prompt = `
You are a DSA instructor.

IMPORTANT RULES:
- Use only the provided context.
- Do not hallucinate.
- If the answer is not in the context, say:
  "I don't have enough information in my reference material to answer that."

CONTEXT:
${context}

QUESTION:
${finalQuery}

ANSWER:
`;

    let fullResponse = "";

    // Set streaming headers
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    // 6. Stream response
    await streamLLM(prompt, {
      write: (chunk) => {
        fullResponse += chunk;
        res.write(chunk);
      },

      end: async () => {
        try {
          await saveChat(userId, query, fullResponse);
        } catch (err) {
          console.error("Save chat error:", err.message);
        }

        res.end();
      }
    });

  } catch (error) {
    console.error("RAG Error:", error);

    if (!res.headersSent) {
      res.status(500).send(`Server Error: ${error.message}`);
    } else {
      res.end();
    }
  }
}
