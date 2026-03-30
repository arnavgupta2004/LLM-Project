"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import FeedbackCard, { type AiFeedback } from "./FeedbackCard";

interface EnrolledCourse {
  id: string;
  name: string;
  code: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  studentId: string;
  enrolledCourses: EnrolledCourse[];
}

type Step = "form" | "processing" | "result";

export default function SubmitAssignmentDialog({
  open,
  onOpenChange,
  studentId,
  enrolledCourses,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("form");
  const [courseId, setCourseId] = useState(enrolledCourses[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [phaseMsg, setPhaseMsg] = useState("");
  const [feedback, setFeedback] = useState<AiFeedback | null>(null);
  const [error, setError] = useState("");

  function handleClose(v: boolean) {
    if (!v && step !== "processing") {
      setStep("form");
      setTitle("");
      setFile(null);
      setFeedback(null);
      setError("");
      setCourseId(enrolledCourses[0]?.id ?? "");
    }
    if (step !== "processing") onOpenChange(v);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !courseId || !title.trim()) return;
    setError("");
    setStep("processing");

    try {
      // ── 1. Upload to Supabase Storage ──────────────────────────────────
      setPhaseMsg("Uploading submission…");
      const path = `${studentId}/${Date.now()}_${file.name}`;

      // Ensure bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.find((b) => b.name === "submissions")) {
        // bucket created server-side; proceed anyway — admin creates it on first evaluate
      }

      const { error: uploadErr } = await supabase.storage
        .from("submissions")
        .upload(path, file, { contentType: "application/pdf", upsert: false });

      if (uploadErr) throw new Error(uploadErr.message);

      // ── 2. Insert into submissions table ───────────────────────────────
      setPhaseMsg("Saving submission record…");
      const { data: submission, error: insertErr } = await supabase
        .from("submissions")
        .insert({
          course_id: courseId,
          student_id: studentId,
          title: title.trim(),
          file_path: path,
          status: "pending",
        })
        .select("id")
        .single();

      if (insertErr || !submission) throw new Error(insertErr?.message ?? "Insert failed");

      // ── 3. Auto-trigger evaluation ─────────────────────────────────────
      setPhaseMsg("Evaluating with Gemini AI… (this may take 20–30 s)");
      const res = await fetch("/api/submissions/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: submission.id }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Evaluation failed");

      setFeedback(json.feedback as AiFeedback);
      setStep("result");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStep("form");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="p-0 gap-0 overflow-hidden"
        style={{ maxWidth: 580, width: "95vw", maxHeight: "90vh" }}
      >
        <DialogHeader className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#e5eaf5" }}>
          <DialogTitle className="text-base font-bold" style={{ color: "#1a2b5e" }}>
            {step === "result" ? "Submission Evaluated ✓" : "Submit Assignment"}
          </DialogTitle>
        </DialogHeader>

        {/* FORM */}
        {step === "form" && (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Course selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Course
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#dde3f0", background: "#fafbff" }}
              >
                {enrolledCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Assignment Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Assignment 2 — Neural Networks"
                required
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all"
                style={{ borderColor: "#dde3f0", background: "#fafbff" }}
                onFocus={(e) => (e.target.style.borderColor = "#1a2b5e")}
                onBlur={(e) => (e.target.style.borderColor = "#dde3f0")}
              />
            </div>

            {/* File upload */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                PDF File
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all"
                style={{
                  borderColor: file ? "#1a2b5e" : "#c9d3ea",
                  background: file ? "#eef1f9" : "#fafbff",
                }}
              >
                <span className="text-2xl">{file ? "📄" : "📂"}</span>
                <div className="flex-1 min-w-0">
                  {file ? (
                    <>
                      <p className="text-sm font-semibold truncate" style={{ color: "#1a2b5e" }}>
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">Click to select a PDF file</p>
                  )}
                </div>
                {file && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ borderColor: "#dde3f0", color: "#6b7280" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!file || !title.trim() || !courseId}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: "#1a2b5e" }}
              >
                Submit &amp; Evaluate
              </button>
            </div>
          </form>
        )}

        {/* PROCESSING */}
        {step === "processing" && (
          <div className="px-6 py-12 flex flex-col items-center gap-4">
            <div
              className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: "#1a2b5e", borderTopColor: "transparent" }}
            />
            <p className="text-sm font-semibold text-center" style={{ color: "#1a2b5e" }}>
              {phaseMsg}
            </p>
            <p className="text-xs text-gray-400 text-center max-w-xs">
              Gemini is reading your submission and scoring it against the course rubric.
            </p>
          </div>
        )}

        {/* RESULT */}
        {step === "result" && feedback && (
          <>
            <ScrollArea style={{ maxHeight: "calc(90vh - 120px)" }}>
              <div className="px-6 py-5">
                <FeedbackCard feedback={feedback} isPreliminary />
              </div>
            </ScrollArea>
            <div className="px-6 py-4 border-t" style={{ borderColor: "#e5eaf5" }}>
              <button
                onClick={() => handleClose(false)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#1a2b5e" }}
              >
                Done
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
