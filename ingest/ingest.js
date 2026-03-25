import { createRequire } from "module";
import { closeDB } from "../services/vectorStore.js";
const require = createRequire(import.meta.url);

const { loadPDF } = require("../utils/pdfLoader.cjs");

import { getEmbedding } from "../services/embedding.js";
import { addVector } from "../services/vectorStore.js";
import { v4 as uuidv4 } from "uuid";

// BETTER CHUNKING FUNCTION
function chunkText(text, chunkSize = 500, overlap = 100) {
  const chunks = [];

  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  return chunks;
}

async function ingest() {
  const text = await loadPDF("data/dsa_notes.pdf");

  const chunks = chunkText(text);

  console.log(`Total chunks: ${chunks.length}`);

  for (const chunk of chunks) {
    const embedding = await getEmbedding(chunk);

    await addVector(uuidv4(), embedding, chunk); 
  }

  console.log("Ingestion Done");

  await closeDB();
  process.exit(0); 
}

ingest();