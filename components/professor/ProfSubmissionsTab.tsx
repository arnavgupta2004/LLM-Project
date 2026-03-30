"use client";

import { useState } from "react";
import FeedbackCard, { type AiFeedback } from "@/components/student/FeedbackCard";

interface Submission {
  id: string;
  title: string;
  status: string;
  overall_score: number | null;
  professor_score: number | null;
  professor_notes: string | null;
  ai_feedback: AiFeedback | null;
  created_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
}

interface Props {
  initialSubmissions: Submission[];
}

function statusBadge(status: string) {
  if (status === "grade_confirmed")
    return { label: "Grade Confirmed", bg: "#dcfce7", color: "#15803d" };
  if (status === "ai_evaluated")
    return { label: "AI Evaluated", bg: "#eef1f9", color: "#1a2b5e" };
  return { label: "Pending", bg: "#fef9c3", color: "#854d0e" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function ProfSubmissionsTab({ initialSubmissions }: Props) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [overrideScore, setOverrideScore] = useState("");
  const [notes, setNotes] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  function openConfirm(sub: Submission) {
    setConfirmingId(sub.id);
    setOverrideScore(
      sub.overall_score != null ? String(sub.overall_score) : ""
    );
    setNotes("");
    setConfirmError("");
  }

  async function handleConfirm(submissionId: string) {
    setConfirming(true);
    setConfirmError("");
    try {
      const res = await fetch("/api/submissions/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          overrideScore: overrideScore !== "" ? overrideScore : undefined,
          notes: notes || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Confirmation failed");

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? {
                ...s,
                status: "grade_confirmed",
                professor_score: json.submission.professor_score,
                professor_notes: json.submission.professor_notes,
              }
            : s
        )
      );
      setConfirmingId(null);
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : "Error confirming grade");
    } finally {
      setConfirming(false);
    }
  }

  if (submissions.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed"
        style={{ borderColor: "#c9d3ea", background: "#fafbff" }}
      >
        <div className="text-4xl mb-3">📋</div>
        <p className="font-bold" style={{ color: "#1a2b5e" }}>
          No submissions yet
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Student submissions for this course will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {submissions.map((sub) => {
        const badge = statusBadge(sub.status);
        const isExpanded = expandedId === sub.id;
        const isConfirming = confirmingId === sub.id;
        const isConfirmed = sub.status === "grade_confirmed";
        const displayScore =
          sub.professor_score != null ? sub.professor_score : sub.overall_score;

        return (
          <div
            key={sub.id}
            className="rounded-2xl border bg-white overflow-hidden"
            style={{ borderColor: "#e5eaf5" }}
          >
            {/* Main row */}
            <div className="flex items-center gap-4 px-5 py-4">
              {/* Score */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0"
                style={{
                  background:
                    displayScore == null
                      ? "#e5eaf5"
                      : displayScore >= 70
                      ? "#dcfce7"
                      : displayScore >= 50
                      ? "#fef9c3"
                      : "#fee2e2",
                  color:
                    displayScore == null
                      ? "#9ca3af"
                      : displayScore >= 70
                      ? "#15803d"
                      : displayScore >= 50
                      ? "#92400e"
                      : "#dc2626",
                }}
              >
                {displayScore != null ? displayScore : "—"}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "#1a2b5e" }}>
                  {sub.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">
                    {sub.profiles?.full_name ?? sub.profiles?.email ?? "Unknown student"}
                  </span>
                  <span className="text-gray-300 text-xs">·</span>
                  <span className="text-xs text-gray-400">{formatDate(sub.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: badge.bg, color: badge.color }}
                >
                  {badge.label}
                </span>

                {sub.ai_feedback && (
                  <button
                    onClick={() => {
                      setExpandedId(isExpanded ? null : sub.id);
                      if (isExpanded) setConfirmingId(null);
                    }}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
                    style={{
                      background: isExpanded ? "#eef1f9" : "transparent",
                      color: "#1a2b5e",
                      borderColor: "#dde3f0",
                    }}
                  >
                    {isExpanded ? "Collapse" : "View Feedback"}
                  </button>
                )}

                {!isConfirmed && sub.status === "ai_evaluated" && (
                  <button
                    onClick={() => openConfirm(sub)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                    style={{ background: "#c9a84c" }}
                  >
                    Confirm Grade
                  </button>
                )}
              </div>
            </div>

            {/* Expanded feedback */}
            {isExpanded && sub.ai_feedback && (
              <div className="px-5 pb-5 pt-2 border-t space-y-5" style={{ borderColor: "#e5eaf5" }}>
                <FeedbackCard
                  feedback={sub.ai_feedback}
                  isPreliminary={!isConfirmed}
                  professorScore={sub.professor_score}
                />

                {/* Confirm grade inline form */}
                {isConfirming && !isConfirmed && (
                  <div
                    className="rounded-xl border p-4 space-y-3"
                    style={{ borderColor: "#dde3f0", background: "#fafbff" }}
                  >
                    <p className="text-sm font-bold" style={{ color: "#1a2b5e" }}>
                      Confirm Final Grade
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                          Final Score (override optional)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={overrideScore}
                          onChange={(e) => setOverrideScore(e.target.value)}
                          placeholder={`AI: ${sub.overall_score ?? "—"}`}
                          className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                          style={{ borderColor: "#dde3f0" }}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                          Notes (optional)
                        </label>
                        <input
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add a comment…"
                          className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                          style={{ borderColor: "#dde3f0" }}
                        />
                      </div>
                    </div>

                    {confirmError && (
                      <p className="text-sm text-red-500">{confirmError}</p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmingId(null)}
                        className="flex-1 py-2 rounded-lg text-sm font-semibold border"
                        style={{ borderColor: "#dde3f0", color: "#6b7280" }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleConfirm(sub.id)}
                        disabled={confirming}
                        className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                        style={{ background: "#1a2b5e" }}
                      >
                        {confirming ? "Confirming…" : "Confirm Grade"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
