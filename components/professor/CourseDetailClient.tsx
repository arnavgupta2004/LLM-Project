"use client";

import { useState } from "react";
import MaterialsSection from "./MaterialsSection";
import ProfAssessmentsTab from "./ProfAssessmentsTab";

interface Material {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  indexed: boolean;
  uploaded_at: string;
  signedUrl: string | null;
}

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
  materials: Material[];
  assessments: Assessment[];
}

type Tab = "materials" | "assessments";

export default function CourseDetailClient({
  courseId,
  profId,
  materials,
  assessments,
}: Props) {
  const [tab, setTab] = useState<Tab>("materials");

  const TAB_LABELS: Record<Tab, string> = {
    materials: "📁 Materials",
    assessments: "🧩 Quizzes & Requests",
  };

  return (
    <div>
      {/* Tab bar */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-5"
        style={{ background: "#f0f3fb", width: "fit-content" }}
      >
        {(["materials", "assessments"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={
              tab === t
                ? { background: "#1a2b5e", color: "#ffffff" }
                : { color: "#6b7280" }
            }
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        className="rounded-2xl border p-6"
        style={{ borderColor: "#e5eaf5", background: "#ffffff" }}
      >
        {tab === "materials" && (
          <MaterialsSection courseId={courseId} initialMaterials={materials} />
        )}
        {tab === "assessments" && (
          <ProfAssessmentsTab
            courseId={courseId}
            profId={profId}
            assessments={assessments}
          />
        )}
      </div>
    </div>
  );
}
