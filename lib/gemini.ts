import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// gemini-1.5-flash for evaluation / content generation
export const geminiFlash = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

// text-embedding-004 is the current stable alias for embedding-001
export const geminiEmbedding = genAI.getGenerativeModel({
  model: "text-embedding-004",
});

/**
 * Embed a single string and return the float array.
 */
export async function embedText(text: string): Promise<number[]> {
  const result = await geminiEmbedding.embedContent(text);
  return result.embedding.values;
}
