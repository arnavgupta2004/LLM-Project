"use client";

import { useState } from "react";
import CreateAssessmentDialog from "./CreateAssessmentDialog";

interface AssessmentSubmission {
  id: string;
  ai_score: number | null;
  total_marks: number | null;
  rank: number | null;
  total_students: number | null;
  status: string;
  submitted_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
}

interface Assessment {
  id: string;
  title: string;
  type: "quiz" | "assignment";
  due_date: string | null;
  total_marks: number;
  created_at: string;
  submissions: AssessmentSubmission[];
}

interface Props {
  courseId: string;
  profId: string;
  assessments: Assessment[];
}

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProfAssessmentsTab({ courseId, profId, assessments }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold" style={{ color: "#1a2b5e" }}>
            Assessments
          </h3>
          <p className="text-xs text-gray-400">
            {assessments.length} assessment{assessments.length !== 1 ? "s" : ""} created
          </p>
        </div>
        <CreateAssessmentDialog courseId={courseId} profId={profId} />
      </div>

      {assessments.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🧩</p>
          <p className="text-sm font-semibold text-gray-500">No assessments yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Create a quiz or assignment for your students.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map((a) => {
            const isOpen = expanded.has(a.id);
            const avgScore =
              a.submissions.length > 0
                ? Math.round(
                    a.submissions
                      .filter((s) => s.ai_score !== null)
                      .reduce((sum, s) => sum + (s.ai_score ?? 0), 0) /
                      (a.submissions.filter((s) => s.ai_score !== null).length || 1)
                  )
                : null;

            return (
              <div
                key={a.id}
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: "#e5eaf5" }}
              >
                {/* Assessment header */}
                <button
                  onClick={() => toggle(a.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  style={{ background: isOpen ? "#eef1f9" : "#fafbff" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="text-xs font-bold px-2 py-1 rounded-full shrink-0"
                      style={
                        a.type === "quiz"
                          ? { background: "#dbeafe", color: "#1d4ed8" }
                          : { background: "#fef3c7", color: "#92400e" }
                      }
                    >
                      {a.type === "quiz" ? "🧩 Quiz" : "📎 Assignment"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "#1a2b5e" }}>
                        {a.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {a.due_date ? `Due: ${formatDate(a.due_date)}` : "No due date"} ·{" "}
                        {a.total_marks} marks
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 ml-3">
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: "#1a2b5e" }}>
                        {a.submissions.length}
                      </p>
                      <p className="text-[10px] text-gray-400">submissions</p>
                    </div>
                    {avgScore !== null && (
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: "#16a34a" }}>
                          {avgScore}/{a.total_marks}
                        </p>
                        <p className="text-[10px] text-gray-400">avg score</p>
                      </div>
                    )}
                    <span className="text-gray-400">{isOpen ? "▲" : "▼"}</span>
                  </div>
                </button>

                {/* Submissions list */}
                {isOpen && (
                  <div style={{ borderTop: "1px solid #e5eaf5" }}>
                    {a.submissions.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">
                        No submissions yet.
                      </p>
                    ) : (
                      <div>
                        {/* Table header */}
                        <div
                          className="grid grid-cols-4 px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400"
                          style={{ background: "#f8f9ff" }}
                        >
                          <span>Student</span>
                          <span className="text-center">Score</span>
                          <span className="text-center">Rank</span>
                          <span className="text-right">Submitted</span>
                        </div>
                        {a.submissions.map((sub) => (
                          <div
                            key={sub.id}
                            className="grid grid-cols-4 px-5 py-3 items-center border-t"
                            style={{ borderColor: "#f0f3fb" }}
                          >
                            <div>
                              <p className="text-sm font-medium" style={{ color: "#1a2b5e" }}>
                                {sub.profiles?.full_name ?? "Unknown"}
                              </p>
                              <p className="text-xs text-gray-400">
                                {sub.profiles?.email ?? ""}
                              </p>
                            </div>
                            <div className="text-center">
                              {sub.ai_score !== null ? (
                                <span
                                  className="text-sm font-bold px-2 py-0.5 rounded-full"
                                  style={{
                                    background:
                                      (sub.ai_score / (sub.total_marks ?? 100)) >= 0.8
                                        ? "#dcfce7"
                                        : (sub.ai_score / (sub.total_marks ?? 100)) >= 0.5
                                        ? "#fef3c7"
                                        : "#fee2e2",
                                    color:
                                      (sub.ai_score / (sub.total_marks ?? 100)) >= 0.8
                                        ? "#15803d"
                                        : (sub.ai_score / (sub.total_marks ?? 100)) >= 0.5
                                        ? "#92400e"
                                        : "#b91c1c",
                                  }}
                                >
                                  {sub.ai_score}/{sub.total_marks ?? a.total_marks}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">Evaluating…</span>
                              )}
                            </div>
                            <div className="text-center">
                              {sub.rank !== null ? (
                                <span className="text-sm font-bold" style={{ color: "#1a2b5e" }}>
                                  #{sub.rank}
                                  <span className="text-xs text-gray-400 font-normal">
                                    /{sub.total_students}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </div>
                            <div className="text-right text-xs text-gray-400">
                              {new Date(sub.submitted_at).toLocaleDateString("en", {
                                day: "numeric",
                                month: "short",
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
