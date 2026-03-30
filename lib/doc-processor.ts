/**
 * Text extraction + chunking utilities for PDF, DOCX, and PPTX files.
 * All functions run in Node.js (not edge) environments.
 */

// ── MIME type constants ─────────────────────────────────────────────────────

export const ACCEPTED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
};

// ── Text extraction ─────────────────────────────────────────────────────────

export async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  const type = ACCEPTED_TYPES[mimeType];

  if (type === "pdf") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse/lib/pdf-parse");
    const parsed = await pdfParse(buffer);
    return parsed.text as string;
  }

  if (type === "docx") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value as string;
  }

  if (type === "pptx") {
    return extractPptxText(buffer);
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}

async function extractPptxText(buffer: Buffer): Promise<string> {
  // PPTX is a ZIP archive — slide text lives in ppt/slides/slide*.xml
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const JSZip = require("jszip");
  const zip = await JSZip.loadAsync(buffer);

  const slideNames: string[] = Object.keys(zip.files)
    .filter((name: string) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a: string, b: string) => {
      const numA = parseInt(a.match(/\d+/)?.[0] ?? "0");
      const numB = parseInt(b.match(/\d+/)?.[0] ?? "0");
      return numA - numB;
    });

  const slideTexts: string[] = [];

  for (const name of slideNames) {
    const xml: string = await zip.files[name].async("string");
    // Extract all <a:t> (text run) contents from DrawingML XML
    const re = /<a:t[^>]*>([^<]*)<\/a:t>/g;
    const matches: RegExpExecArray[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) !== null) matches.push(m);
    const slideText = matches
      .map((m) => m[1].trim())
      .filter(Boolean)
      .join(" ");
    if (slideText) slideTexts.push(slideText);
  }

  return slideTexts.join("\n\n");
}

// ── Text chunking ───────────────────────────────────────────────────────────

/**
 * Splits `text` into overlapping chunks that respect paragraph boundaries.
 *
 * @param maxChars   ~500 tokens × 4 chars/token = 2000 chars
 * @param overlapChars  ~50 tokens × 4 chars/token = 200 chars
 */
export function chunkText(
  text: string,
  maxChars = 2000,
  overlapChars = 200
): string[] {
  // Normalise whitespace and split into paragraphs
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0);

  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    const candidate = current ? current + "\n\n" + para : para;

    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      // Flush current chunk if it has content
      if (current.trim()) {
        chunks.push(current.trim());
        // Carry forward the overlap tail of the flushed chunk
        const overlap = current.slice(-overlapChars);
        current = overlap + "\n\n" + para;
      } else {
        // Single paragraph exceeds maxChars — split mid-paragraph by sentences
        const sentences = para.match(/[^.!?]+[.!?]+/g) ?? [para];
        for (const sent of sentences) {
          const c2 = current ? current + " " + sent : sent;
          if (c2.length <= maxChars) {
            current = c2;
          } else {
            if (current.trim()) chunks.push(current.trim());
            current = current.slice(-overlapChars) + " " + sent;
          }
        }
      }
    }
  }

  if (current.trim()) chunks.push(current.trim());

  return chunks;
}
