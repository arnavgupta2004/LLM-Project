"use client";

import { useState } from "react";

interface Student {
  studentId: string;
  fullName: string;
  email: string;
  interactionCount: number;
  avgScore: number | null;
  topStruggles: string[];
}

interface CourseData {
  id: string;
  name: string;
  code: string;
  students: Student[];
  aggregateTopics: [string, number][];
}

interface Props {
  courses: CourseData[];
}

export default function AnalyticsClient({ courses }: Props) {
  const [openCourse, setOpenCourse] = useState<string>(courses[0]?.id ?? "");

  function scoreColor(score: number) {
    if (score >= 70) return "#16a34a";
    if (score >= 50) return "#d97706";
    return "#dc2626";
  }

  return (
    <div className="space-y-4 max-w-5xl">
      {courses.map((course) => {
        const isOpen = openCourse === course.id;
        const sorted = [...course.students].sort(
          (a, b) => b.interactionCount - a.interactionCount
        );

        return (
          <div
            key={course.id}
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: "#e5eaf5" }}
          >
            {/* Accordion header */}
            <button
              onClick={() => setOpenCourse(isOpen ? "" : course.id)}
              className="w-full flex items-center justify-between p-5 text-left transition-colors"
              style={{ background: isOpen ? "#f0f4ff" : "#fafbff" }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(201,168,76,0.15)", color: "#92400e" }}
                >
                  {course.code}
                </span>
                <span className="font-bold" style={{ color: "#1a2b5e" }}>
                  {course.name}
                </span>
                <span className="text-sm text-gray-400">
                  {course.students.length} student{course.students.length !== 1 ? "s" : ""}
                </span>
              </div>
              <span className="text-gray-400 text-xs">{isOpen ? "▲" : "▼"}</span>
            </button>

            {isOpen && (
              <div className="p-5 border-t" style={{ borderColor: "#e5eaf5" }}>
                {course.students.length === 0 ? (
                  <p className="text-sm text-gray-400">No enrolled students yet.</p>
                ) : (
                  <>
                    {/* Student table */}
                    <div className="overflow-x-auto mb-6">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b" style={{ borderColor: "#e5eaf5" }}>
                            <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-400 whitespace-nowrap">
                              Student
                            </th>
                            <th className="text-center py-2 px-4 text-xs font-semibold text-gray-400 whitespace-nowrap">
                              Interactions
                            </th>
                            <th className="text-center py-2 px-4 text-xs font-semibold text-gray-400 whitespace-nowrap">
                              Avg AI Score
                            </th>
                            <th className="text-left py-2 pl-4 text-xs font-semibold text-gray-400">
                              Top Struggle Topics
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sorted.map((student) => (
                            <tr
                              key={student.studentId}
                              className="border-b last:border-0"
                              style={{ borderColor: "#f1f5f9" }}
                            >
                              <td className="py-3 pr-4">
                                <p className="font-medium" style={{ color: "#1a2b5e" }}>
                                  {student.fullName}
                                </p>
                                <p className="text-xs text-gray-400">{student.email}</p>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="font-bold" style={{ color: "#1a2b5e" }}>
                                  {student.interactionCount}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                {student.avgScore !== null ? (
                                  <span
                                    className="font-bold"
                                    style={{ color: scoreColor(student.avgScore) }}
                                  >
                                    {student.avgScore}%
                                  </span>
                                ) : (
                                  <span className="text-gray-300 text-xs">—</span>
                                )}
                              </td>
                              <td className="py-3 pl-4">
                                {student.topStruggles.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {student.topStruggles.map((t) => (
                                      <span
                                        key={t}
                                        className="text-xs px-2 py-0.5 rounded-full"
                                        style={{
                                          background: "rgba(220,38,38,0.08)",
                                          color: "#b91c1c",
                                        }}
                                      >
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-300 text-xs">None yet</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Class-wide aggregate topics */}
                    {course.aggregateTopics.length > 0 && (
                      <div>
                        <p
                          className="text-xs font-semibold uppercase tracking-wider mb-3"
                          style={{ color: "#94a3b8" }}
                        >
                          Class-wide Struggle Topics
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {course.aggregateTopics.map(([topic, freq]) => (
                            <div
                              key={topic}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
                              style={{ background: "#eef1f9" }}
                            >
                              <span style={{ color: "#1a2b5e" }} className="font-medium">
                                {topic}
                              </span>
                              <span
                                className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                                style={{ background: "#1a2b5e", color: "white" }}
                              >
                                {freq}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
