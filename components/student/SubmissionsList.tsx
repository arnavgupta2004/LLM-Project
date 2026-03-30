"use client";

import { useState } from "react";
import SubmitAssignmentDialog from "./SubmitAssignmentDialog";
import FeedbackCard, { type AiFeedback } from "./FeedbackCard";

interface Submission {
  id: string;
  title: string;
  status: string;
  overall_score: number | null;
  professor_score: number | null;
  ai_feedback: AiFeedback | null;
  created_at: string;
  courses: { name: string; code: string } | null;
}

interface EnrolledCourse {
  id: string;
  name: string;
  code: string;
}

interface Props {
  submissions: Submission[];
  studentId: string;
  enrolledCourses: EnrolledCourse[];
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

export default function SubmissionsList({ submissions, studentId, enrolledCourses }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "#1a2b5e" }}>
            Submissions
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {submissions.length} submission{submissions.length !== 1 ? "s" : ""} across all courses
          </p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          disabled={enrolledCourses.length === 0}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: "#1a2b5e" }}
        >
          + Submit Assignment
        </button>
      </div>

      {/* Empty state */}
      {submissions.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed"
          style={{ borderColor: "#c9d3ea", background: "#fafbff" }}
        >
          <div className="text-5xl mb-3">📋</div>
          <p className="font-bold text-base mb-1" style={{ color: "#1a2b5e" }}>
            No submissions yet
          </p>
          <p className="text-sm text-gray-400 mb-5">
            Submit your first assignment to get AI-powered feedback instantly.
          </p>
          <button
            onClick={() => setDialogOpen(true)}
            disabled={enrolledCourses.length === 0}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: "#1a2b5e" }}
          >
            + Submit Assignment
          </button>
          {enrolledCourses.length === 0 && (
            <p className="text-xs text-gray-400 mt-2">Enroll in a course first.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => {
            const badge = statusBadge(sub.status);
            const expanded = expandedId === sub.id;
            const displayScore =
              sub.professor_score != null ? sub.professor_score : sub.overall_score;
            const isConfirmed = sub.status === "grade_confirmed";

            return (
              <div
                key={sub.id}
                className="rounded-2xl border bg-white overflow-hidden"
                style={{ borderColor: "#e5eaf5" }}
              >
                {/* Row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Score circle */}
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
                      {sub.courses && (
                        <span className="text-xs text-gray-400">
                          {sub.courses.code}
                        </span>
                      )}
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{formatDate(sub.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: badge.bg, color: badge.color }}
                    >
                      {badge.label}
                    </span>
                    {!isConfirmed && sub.overall_score != null && (
                      <span className="text-[11px] text-gray-400">(Preliminary)</span>
                    )}
                    {sub.ai_feedback && (
                      <button
                        onClick={() => setExpandedId(expanded ? null : sub.id)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        style={{
                          background: expanded ? "#eef1f9" : "transparent",
                          color: "#1a2b5e",
                          border: "1px solid #dde3f0",
                        }}
                      >
                        {expanded ? "Hide" : "View Feedback"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded feedback */}
                {expanded && sub.ai_feedback && (
                  <div
                    className="px-5 pb-5 pt-1 border-t"
                    style={{ borderColor: "#e5eaf5" }}
                  >
                    <FeedbackCard
                      feedback={sub.ai_feedback}
                      isPreliminary={!isConfirmed}
                      professorScore={sub.professor_score}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <SubmitAssignmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        studentId={studentId}
        enrolledCourses={enrolledCourses}
      />
    </div>
  );
}
