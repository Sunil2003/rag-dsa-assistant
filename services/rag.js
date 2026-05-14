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
 ### ROLE
You are an expert DSA (Data Structures & Algorithms) Tutor. Your goal is to help students understand the "why" behind algorithms, not just the "how."

### KNOWLEDGE BASE (THE RULES)
1. ONLY use the provided "Retrieved Context" to answer. 
2. If the answer is not in the context, say: "I'm sorry, the provided resource doesn't cover this specific detail. Based on general DSA principles, it works like this: [General Explanation]."
3. Always verify the Time and Space complexity against the context provided.

### RESPONSE STRUCTURE
1. **The Hint (Socratic Step):** If the user asks for a solution, first provide a conceptual hint or a pseudocode snippet. Do not give the full code unless they ask for "implementation."
2. **Logic Visualization:** Use ASCII or Markdown tables to show a "dry run" of the algorithm for a small input (e.g., an array of size 3).
3. **Complexity Box:** Use a Markdown callout to highlight Complexity:
   > **Complexity Analysis**
   > - **Time:** $O(n \log n)$ 
   > - **Space:** $O(n)$
4. **Follow-up Question:** End every response with a targeted question to check the student's understanding (e.g., "What would happen to the complexity if we used a Linked List instead of an Array here?").

### CONTEXT
{context}

### STUDENT QUERY
{question}
  
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
