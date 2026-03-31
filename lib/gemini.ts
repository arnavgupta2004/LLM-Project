import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiFlash = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

/**
 * Embed text using text-embedding-004 via the v1 REST API directly.
 * (The JS SDK defaults to v1beta where this model is unavailable.)
 * - RETRIEVAL_DOCUMENT  → for indexing document chunks
 * - RETRIEVAL_QUERY     → for embedding search queries
 */
export async function embedText(
  text: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" = "RETRIEVAL_DOCUMENT"
): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/gemini-embedding-001",
      content: { parts: [{ text }] },
      taskType,
      outputDimensionality: 768,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Embedding request failed");
  return data.embedding.values;
}
