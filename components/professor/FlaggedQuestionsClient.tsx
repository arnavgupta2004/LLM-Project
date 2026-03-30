"use client";

import { useState } from "react";

export interface FlaggedQuestion {
  id: string;
  course_id: string;
  student_id: string;
  question: string;
  ai_response: string | null;
  prof_answer: string | null;
  answered_at: string | null;
  created_at: string;
  courses: { name: string; code: string } | null;
  profiles: { full_name: string | null; email: string | null } | null;
}

interface Props {
  questions: FlaggedQuestion[];
}

export default function FlaggedQuestionsClient({ questions }: Props) {
  const [tab, setTab] = useState<"unanswered" | "resolved">("unanswered");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [localQuestions, setLocalQuestions] = useState(questions);

  const unanswered = localQuestions.filter((q) => !q.prof_answer);
  const resolved = localQuestions.filter((q) => !!q.prof_answer);
  const current = tab === "unanswered" ? unanswered : resolved;

  async function submitAnswer(questionId: string) {
    const answer = answers[questionId]?.trim();
    if (!answer) return;
    setSubmitting((s) => ({ ...s, [questionId]: true }));
    try {
      const res = await fetch("/api/flagged/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flaggedQuestionId: questionId, answer }),
      });
      if (res.ok) {
        setLocalQuestions((qs) =>
          qs.map((q) =>
            q.id === questionId
              ? { ...q, prof_answer: answer, answered_at: new Date().toISOString() }
              : q
          )
        );
        setAnswers((a) => {
          const copy = { ...a };
          delete copy[questionId];
          return copy;
        });
      }
    } finally {
      setSubmitting((s) => ({ ...s, [questionId]: false }));
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div>
      {/* Tab switcher */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
        style={{ background: "#eef1f9" }}
      >
        {(["unanswered", "resolved"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
            style={
              tab === t
                ? {
                    background: "#ffffff",
                    color: "#1a2b5e",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  }
                : { color: "#64748b" }
            }
          >
            {t === "unanswered"
              ? `Unanswered (${unanswered.length})`
              : `Resolved (${resolved.length})`}
          </button>
        ))}
      </div>

      {current.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          {tab === "unanswered"
            ? "No pending questions — all caught up!"
            : "No resolved questions yet."}
        </div>
      ) : (
        <div className="space-y-4">
          {current.map((q) => (
            <div
              key={q.id}
              className="rounded-2xl border p-5"
              style={{ borderColor: "#e5eaf5", background: "#fafbff" }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(201,168,76,0.15)", color: "#92400e" }}
                    >
                      {q.courses?.code ?? "—"}
                    </span>
                    <span className="text-xs text-gray-400">{q.courses?.name}</span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "#1a2b5e" }}>
                    {q.profiles?.full_name ?? "Unknown Student"}
                  </p>
                  <p className="text-xs text-gray-400">{q.profiles?.email}</p>
                </div>
                <p className="text-xs text-gray-400 shrink-0">{formatDate(q.created_at)}</p>
              </div>

              {/* Student's question */}
              <div className="rounded-xl p-3 mb-3" style={{ background: "#f0f4ff" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "#1a2b5e" }}>
                  Student&apos;s Question
                </p>
                <p className="text-sm" style={{ color: "#1a2b5e" }}>
                  {q.question}
                </p>
              </div>

              {/* AI's attempted answer */}
              {q.ai_response && (
                <div className="rounded-xl p-3 mb-3 border" style={{ background: "#fffbf0", borderColor: "#fde68a" }}>
                  <p className="text-xs font-semibold mb-1 text-amber-700">AI&apos;s Response (Uncertain)</p>
                  <p className="text-sm text-amber-900 line-clamp-3">{q.ai_response}</p>
                </div>
              )}

              {/* Professor answer or reply form */}
              {q.prof_answer ? (
                <div
                  className="rounded-xl p-3 border"
                  style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}
                >
                  <p className="text-xs font-semibold text-green-700 mb-1">Your Answer</p>
                  <p className="text-sm text-green-900">{q.prof_answer}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Type your answer for the student..."
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: "#e5eaf5" }}
                  />
                  <button
                    onClick={() => submitAnswer(q.id)}
                    disabled={!answers[q.id]?.trim() || submitting[q.id]}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
                    style={{ background: "#1a2b5e" }}
                  >
                    {submitting[q.id] ? "Submitting…" : "Submit Answer"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
