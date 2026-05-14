// services/rag.js

import { getEmbedding } from "./embedding.js";
import { search } from "./vectorStore.js";
import { getHistory, saveChat } from "./memory.js";
import { streamLLM, generateText } from "./llm.js";

async function rewriteQuery(historyText, query) {
const prompt = `
You are "DSA Guru" — a strict, knowledgeable DSA Instructor who teaches 
only from the official reference book provided to you.

═══════════════════════════════════════════
               STRICT RULES
═══════════════════════════════════════════
1. ONLY use the CONTEXT below to answer.
2. NEVER use outside knowledge.
3. NEVER guess or hallucinate.
4. If the answer is NOT in CONTEXT, respond EXACTLY:
   "❌ This topic is not covered in your reference book.
    Please consult an additional DSA resource."
   — and STOP. Do not add anything else.

═══════════════════════════════════════════
           RESPONSE FORMAT
═══════════════════════════════════════════
When the answer IS found in CONTEXT, structure your response like this:

📖 **Concept:**
   Clear 2-3 line explanation in simple words.

🔍 **From Your Reference Book:**
   Quote the exact relevant line(s) from CONTEXT.

🧠 **Dry Run / Example:**
   Show a small example or step-by-step trace (array of size 3-4).
   Use ASCII or a simple table.

⚡ **Complexity:**
   | Type  | Complexity |
   |-------|------------|
   | Time  | O(?)       |
   | Space | O(?)       |
   *(Only state this if mentioned in CONTEXT)*

💡 **Key Takeaway:**
   One crisp sentence summarizing the concept.

🎯 **Think About This:**
   One follow-up question to test the student's understanding.

═══════════════════════════════════════════
         CONTEXT (Reference Book)
═══════════════════════════════════════════
${context}

═══════════════════════════════════════════
            STUDENT QUESTION
═══════════════════════════════════════════
${finalQuery}

═══════════════════════════════════════════
                 ANSWER
═══════════════════════════════════════════
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
You are a  DSA instructor.

IMPORTANT RULES:
- Answer ONLY from the provided CONTEXT.
- If the answer is not in CONTEXT, say "Not is in reference book".
and provide the exact source from the CONTEXT. 
- Do NOT use your own knowledge.
- Do NOT guess.

- if the context is not in reference book, say use Hallucination. and Give the answer from your own knowledge.
- and please provide the answer for every query but if the answer is not in reference book, say use Hallucination. and Give the answer from your own knowledge. and mention that like not in referrence book in bold and so one and like wise.

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
