"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────

interface Material {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  indexed: boolean;
  uploaded_at: string;
}

interface UploadState {
  fileName: string;
  progress: number;     // 0–100
  message: string;
  status: "uploading" | "done" | "error";
  errorMsg?: string;
}

interface Props {
  courseId: string;
  initialMaterials: Material[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const ACCEPTED = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
};

function fileIcon(mimeType: string) {
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("word")) return "📝";
  if (mimeType.includes("presentation")) return "📊";
  return "📎";
}

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function humanDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── SSE stream reader ──────────────────────────────────────────────────────

async function* readSSE(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    const blocks = buf.split("\n\n");
    buf = blocks.pop() ?? "";

    for (const block of blocks) {
      if (!block.trim()) continue;
      const lines = block.split("\n");
      const eventLine = lines.find((l) => l.startsWith("event:"));
      const dataLine = lines.find((l) => l.startsWith("data:"));
      if (!eventLine || !dataLine) continue;
      yield {
        event: eventLine.slice(6).trim(),
        data: JSON.parse(dataLine.slice(5).trim()),
      };
    }
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export default function MaterialsSection({ courseId, initialMaterials }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [materials] = useState<Material[]>(initialMaterials);
  const [fileError, setFileError] = useState("");

  const processFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED[file.type as keyof typeof ACCEPTED]) {
        setFileError("Only PDF, DOCX, and PPTX files are supported.");
        return;
      }
      setFileError("");

      setUpload({
        fileName: file.name,
        progress: 0,
        message: "Starting…",
        status: "uploading",
      });

      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("courseId", courseId);

        const res = await fetch("/api/materials/upload", {
          method: "POST",
          body: fd,
        });

        if (!res.body) throw new Error("No response stream.");

        for await (const { event, data } of readSSE(res.body)) {
          if (event === "progress") {
            setUpload((u) =>
              u ? { ...u, progress: data.progress, message: data.message } : u
            );
          } else if (event === "done") {
            setUpload((u) =>
              u ? { ...u, progress: 100, message: "Indexed ✓", status: "done" } : u
            );
            // Optimistically add the new material to the list then re-fetch
            router.refresh();
          } else if (event === "error") {
            throw new Error(data.error);
          }
        }
      } catch (err) {
        setUpload((u) =>
          u
            ? {
                ...u,
                status: "error",
                message: "Failed",
                errorMsg: err instanceof Error ? err.message : "Unknown error",
              }
            : u
        );
      }
    },
    [courseId, router]
  );

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }

  const isUploading = upload?.status === "uploading";

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold" style={{ color: "#1a2b5e" }}>
          Course Materials
        </h2>
        <span className="text-xs text-gray-400">PDF · DOCX · PPTX</span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isUploading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={isUploading ? (e) => e.preventDefault() : onDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-10 px-6 transition-all select-none mb-5"
        style={{
          borderColor: dragging ? "#1a2b5e" : "#c9d3ea",
          background: dragging ? "#eef1f9" : "#fafbff",
          cursor: isUploading ? "not-allowed" : "pointer",
          opacity: isUploading ? 0.6 : 1,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.pptx"
          className="hidden"
          onChange={onFileInput}
          disabled={isUploading}
        />
        <div className="text-4xl mb-3">📂</div>
        <p className="text-sm font-semibold mb-1" style={{ color: "#1a2b5e" }}>
          Drop a file here to upload
        </p>
        <p className="text-xs text-gray-400">
          Gemini will extract and index the content for student Q&amp;A
        </p>
      </div>

      {fileError && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-4">
          {fileError}
        </p>
      )}

      {/* Active upload progress */}
      {upload && (
        <div
          className="rounded-xl border p-4 mb-5"
          style={{
            borderColor:
              upload.status === "error"
                ? "#fecaca"
                : upload.status === "done"
                ? "#bbf7d0"
                : "#e5eaf5",
            background:
              upload.status === "error"
                ? "#fff5f5"
                : upload.status === "done"
                ? "#f0fdf4"
                : "#fafbff",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">
                {upload.status === "done" ? "✅" : upload.status === "error" ? "❌" : "⏳"}
              </span>
              <span
                className="text-sm font-semibold truncate"
                style={{ color: "#1a2b5e" }}
              >
                {upload.fileName}
              </span>
            </div>
            <span
              className="text-xs font-medium ml-3 shrink-0"
              style={{
                color:
                  upload.status === "error"
                    ? "#dc2626"
                    : upload.status === "done"
                    ? "#16a34a"
                    : "#6b7280",
              }}
            >
              {upload.status === "done"
                ? "Indexed ✓"
                : upload.status === "error"
                ? "Failed"
                : `${upload.progress}%`}
            </span>
          </div>

          {/* Progress bar */}
          {upload.status !== "error" && (
            <div
              className="w-full rounded-full h-1.5 mb-2 overflow-hidden"
              style={{ background: "#e5eaf5" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${upload.progress}%`,
                  background:
                    upload.status === "done" ? "#16a34a" : "#1a2b5e",
                }}
              />
            </div>
          )}

          <p
            className="text-xs"
            style={{
              color:
                upload.status === "error" ? "#dc2626" : "#6b7280",
            }}
          >
            {upload.status === "error" ? upload.errorMsg : upload.message}
          </p>
        </div>
      )}

      {/* Materials list */}
      {materials.length === 0 && !upload ? (
        <p className="text-sm text-gray-400 text-center py-6">
          No materials uploaded yet.
        </p>
      ) : (
        <div className="space-y-2">
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-white"
              style={{ borderColor: "#e5eaf5" }}
            >
              <span className="text-xl shrink-0">{fileIcon(mat.file_type)}</span>

              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: "#1a2b5e" }}
                >
                  {mat.file_name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {humanSize(mat.file_size)} · {humanDate(mat.uploaded_at)}
                </p>
              </div>

              {/* Indexed badge */}
              <span
                className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={
                  mat.indexed
                    ? { background: "#dcfce7", color: "#15803d" }
                    : { background: "#fef9c3", color: "#854d0e" }
                }
              >
                {mat.indexed ? "Indexed ✓" : "Pending…"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
