import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const client = new MongoClient(process.env.MONGO_URI);

let collection;

async function connect() {
  if (!collection) {
    await client.connect();

    const db = client.db();
    collection = db.collection("embeddings");

    console.log("MongoDB connected (vectorStore)");
  }
}

export async function addVector(id, embedding, text) {
  await connect();

  await collection.insertOne({
    id,
    embedding,
    text,
    createdAt: new Date()
  });
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function search(queryEmbedding, topK = 3) {
  await connect();

  const docs = await collection.find().toArray();

  const scored = docs.map(doc => ({
    text: doc.text,
    score: cosineSimilarity(queryEmbedding, doc.embedding)
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(d => d.text);
}


export async function closeDB() {
  if (client) {
    await client.close();
    console.log("MongoDB closed");
  }
}