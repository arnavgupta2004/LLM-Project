"use client";

import { useState } from "react";
import MaterialsSection from "./MaterialsSection";
import ProfSubmissionsTab from "./ProfSubmissionsTab";
import type { AiFeedback } from "@/components/student/FeedbackCard";

interface Material {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
  indexed: boolean;
  created_at: string;
}

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
  courseId: string;
  materials: Material[];
  submissions: Submission[];
}

type Tab = "materials" | "submissions";

export default function CourseDetailClient({ courseId, materials, submissions }: Props) {
  const [tab, setTab] = useState<Tab>("materials");

  return (
    <div>
      {/* Tab bar */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-5"
        style={{ background: "#f0f3fb", width: "fit-content" }}
      >
        {(["materials", "submissions"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
            style={
              tab === t
                ? { background: "#1a2b5e", color: "#ffffff" }
                : { color: "#6b7280" }
            }
          >
            {t === "materials" ? "📁 Materials" : "📋 Submissions"}
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
        {tab === "submissions" && (
          <ProfSubmissionsTab initialSubmissions={submissions} />
        )}
      </div>
    </div>
  );
}
