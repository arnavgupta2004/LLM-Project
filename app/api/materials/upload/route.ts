import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { embedText } from "@/lib/gemini";
import { extractText, chunkText, ACCEPTED_TYPES } from "@/lib/doc-processor";

export const runtime = "nodejs";
// Increase max body size for file uploads
export const maxDuration = 300; // 5 min — needed for large PDFs with many chunks

// ── SSE helpers ─────────────────────────────────────────────────────────────

function makeEmitter(writer: WritableStreamDefaultWriter<Uint8Array>) {
  const encoder = new TextEncoder();
  return async (event: string, data: object) => {
    const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    await writer.write(encoder.encode(msg));
  };
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const emit = makeEmitter(writer);

  // Kick off the pipeline; the Response streams back in parallel
  (async () => {
    try {
      // ── 1. Parse form data ────────────────────────────────────────────────
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const courseId = formData.get("courseId") as string | null;

      if (!file || !courseId) {
        await emit("error", { error: "Missing file or courseId." });
        return;
      }
      if (!ACCEPTED_TYPES[file.type]) {
        await emit("error", { error: "Unsupported file type. Upload PDF, DOCX, or PPTX." });
        return;
      }

      await emit("progress", { progress: 5, message: "Reading file…" });

      const buffer = Buffer.from(await file.arrayBuffer());

      // ── 2. Ensure storage bucket exists ───────────────────────────────────
      const BUCKET = "course-materials";
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      const bucketExists = buckets?.some((b) => b.name === BUCKET);
      if (!bucketExists) {
        await supabaseAdmin.storage.createBucket(BUCKET, { public: false });
      }

      // ── 3. Upload file to Supabase Storage ────────────────────────────────
      const storagePath = `${courseId}/${Date.now()}_${file.name}`;
      const { error: storageErr } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(storagePath, buffer, { contentType: file.type, upsert: false });

      if (storageErr) throw new Error(`Storage upload failed: ${storageErr.message}`);
      await emit("progress", { progress: 20, message: "Uploaded to storage." });

      // ── 4. Save record to course_materials ────────────────────────────────
      const { data: material, error: matErr } = await supabaseAdmin
        .from("course_materials")
        .insert({
          course_id: courseId,
          file_name: file.name,
          file_path: storagePath,
          file_type: file.type,
          file_size: file.size,
          indexed: false,
        })
        .select("id")
        .single();

      if (matErr) throw new Error(`DB insert failed: ${matErr.message}`);
      await emit("progress", { progress: 30, message: "Record saved." });

      // ── 5. Extract text ───────────────────────────────────────────────────
      await emit("progress", { progress: 35, message: "Extracting text…" });
      const rawText = await extractText(buffer, file.type);

      if (!rawText.trim()) {
        throw new Error("No text could be extracted. The file may be image-based.");
      }
      await emit("progress", { progress: 48, message: "Text extracted." });

      // ── 6. Chunk ──────────────────────────────────────────────────────────
      const chunks = chunkText(rawText);
      await emit("progress", {
        progress: 55,
        message: `Split into ${chunks.length} chunk${chunks.length !== 1 ? "s" : ""}.`,
      });

      // ── 7. Embed each chunk and batch-insert ──────────────────────────────
      const BATCH = 5; // embed 5 chunks in parallel per round
      const allRows: { course_id: string; material_id: string; content: string; embedding: number[] }[] = [];

      for (let i = 0; i < chunks.length; i += BATCH) {
        const slice = chunks.slice(i, i + BATCH);

        const embeddings = await Promise.all(slice.map((c) => embedText(c)));

        for (let j = 0; j < slice.length; j++) {
          allRows.push({
            course_id: courseId,
            material_id: material.id,
            content: slice[j],
            embedding: embeddings[j],
          });
        }

        const done = Math.min(i + BATCH, chunks.length);
        const progress = 55 + Math.round((done / chunks.length) * 38);
        await emit("progress", {
          progress,
          message: `Embedding chunk ${done} / ${chunks.length}…`,
        });
      }

      // Batch insert all embeddings at once
      const { error: embErr } = await supabaseAdmin
        .from("course_embeddings")
        .insert(allRows);

      if (embErr) throw new Error(`Embedding insert failed: ${embErr.message}`);

      // ── 8. Mark as indexed ────────────────────────────────────────────────
      await supabaseAdmin
        .from("course_materials")
        .update({ indexed: true })
        .eq("id", material.id);

      await emit("done", {
        materialId: material.id,
        chunkCount: chunks.length,
      });
    } catch (err) {
      await emit("error", {
        error: err instanceof Error ? err.message : "Unknown error during processing.",
      });
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
