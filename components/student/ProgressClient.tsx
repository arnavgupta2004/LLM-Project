"use client";

interface StruggleTopic {
  topic: string;
  count: number;
}

interface TimelineDay {
  date: string;
  count: number;
}

interface AssessmentScore {
  title: string;
  type: string;
  courseName: string;
  courseCode: string;
  ai_score: number;
  total_marks: number;
  rank: number | null;
  total_students: number | null;
  submitted_at: string;
}

interface CoursePerformance {
  courseId: string;
  courseName: string;
  courseCode: string;
  submitted: number;
  total: number;
  avgPct: number | null;
}

interface ScoreTrendItem {
  label: string;
  pct: number;
  date: string;
  type: string;
}

interface OverviewStats {
  avgScorePct: number | null;
  bestScorePct: number | null;
  totalDone: number;
  totalAvailable: number;
  completionRate: number;
  totalChats: number;
}

interface Props {
  struggles: StruggleTopic[];
  percentile: number;
  timeline: TimelineDay[];
  assessmentScores: AssessmentScore[];
  coursePerformance: CoursePerformance[];
  scoreTrend: ScoreTrendItem[];
  overviewStats: OverviewStats;
}

function pctColor(p: number) {
  return p >= 80 ? "#16a34a" : p >= 50 ? "#d97706" : "#dc2626";
}
function pctBg(p: number) {
  return p >= 80 ? "#dcfce7" : p >= 50 ? "#fef3c7" : "#fee2e2";
}

export default function ProgressClient({
  struggles,
  percentile,
  timeline,
  assessmentScores,
  coursePerformance,
  scoreTrend,
  overviewStats,
}: Props) {
  const maxTimelineCount = Math.max(...timeline.map((d) => d.count), 1);
  const percentileColor =
    percentile >= 70 ? "#16a34a" : percentile >= 40 ? "#d97706" : "#dc2626";
  const percentileLabel =
    percentile >= 70 ? "Top Performer" : percentile >= 40 ? "On Track" : "Needs Attention";

  const CIRC = 251.3;
  const strokeDash = (percentile / 100) * CIRC;

  function dayLabel(dateStr: string) {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("en", { weekday: "short" }).slice(0, 1);
  }
  function formatDateFull(dateStr: string) {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("en", { month: "short", day: "numeric" });
  }

  const today = new Date().toISOString().slice(0, 10);

  const CARD = "rounded-2xl border p-5";
  const CARD_STYLE = { borderColor: "#e5eaf5", background: "#fafbff" };

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Overview Stats ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: "Avg Score",
            value: overviewStats.avgScorePct !== null ? `${overviewStats.avgScorePct}%` : "—",
            sub: "across all assessments",
            color: overviewStats.avgScorePct !== null ? pctColor(overviewStats.avgScorePct) : "#94a3b8",
            bg: overviewStats.avgScorePct !== null ? pctBg(overviewStats.avgScorePct) : "#f8fafc",
          },
          {
            label: "Best Score",
            value: overviewStats.bestScorePct !== null ? `${overviewStats.bestScorePct}%` : "—",
            sub: "personal best",
            color: overviewStats.bestScorePct !== null ? pctColor(overviewStats.bestScorePct) : "#94a3b8",
            bg: overviewStats.bestScorePct !== null ? pctBg(overviewStats.bestScorePct) : "#f8fafc",
          },
          {
            label: "Done",
            value: String(overviewStats.totalDone),
            sub: `of ${overviewStats.totalAvailable} assessments`,
            color: "#1a2b5e",
            bg: "#eef1f9",
          },
          {
            label: "Completion",
            value: `${overviewStats.completionRate}%`,
            sub: "tasks completed",
            color: pctColor(overviewStats.completionRate),
            bg: pctBg(overviewStats.completionRate),
          },
          {
            label: "Struggle Topics",
            value: String(struggles.length),
            sub: "topics to review",
            color: struggles.length > 5 ? "#b91c1c" : struggles.length > 2 ? "#d97706" : "#15803d",
            bg: struggles.length > 5 ? "#fee2e2" : struggles.length > 2 ? "#fef3c7" : "#dcfce7",
          },
          {
            label: "AI Chats",
            value: String(overviewStats.totalChats),
            sub: "questions asked",
            color: "#6d28d9",
            bg: "#ede9fe",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-4 flex flex-col"
            style={{ background: s.bg, border: "1px solid transparent" }}
          >
            <p className="text-2xl font-extrabold leading-none" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-[11px] font-bold mt-1" style={{ color: s.color }}>
              {s.label}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Score Trend ────────────────────────────────────────── */}
      {scoreTrend.length > 0 && (
        <div className={CARD} style={CARD_STYLE}>
          <h2 className="text-base font-bold mb-0.5" style={{ color: "#1a2b5e" }}>Score Trend</h2>
          <p className="text-xs text-gray-400 mb-5">Your last {scoreTrend.length} assessment scores</p>
          <div className="flex items-end gap-2 h-32">
            {scoreTrend.map((s, i) => {
              const heightPct = Math.max((s.pct / 100) * 100, 4);
              const color = pctColor(s.pct);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex justify-center z-10 pointer-events-none w-max left-1/2 -translate-x-1/2">
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1.5 whitespace-nowrap text-center">
                      <p className="font-semibold">{s.label}</p>
                      <p>{s.pct}%</p>
                    </div>
                  </div>
                  <div
                    className="w-full rounded-t-lg transition-all"
                    style={{ height: `${heightPct}%`, background: color, opacity: 0.85 }}
                  />
                  <span className="text-[9px] text-gray-400 truncate w-full text-center leading-none">
                    {s.label.slice(0, 6)}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Y axis labels */}
          <div className="flex justify-between mt-1 px-0.5">
            <span className="text-[10px] text-gray-400">0%</span>
            <span className="text-[10px] text-gray-400">50%</span>
            <span className="text-[10px] text-gray-400">100%</span>
          </div>
        </div>
      )}

      {/* ── Course Performance ─────────────────────────────────── */}
      {coursePerformance.length > 0 && (
        <div className={CARD} style={CARD_STYLE}>
          <h2 className="text-base font-bold mb-0.5" style={{ color: "#1a2b5e" }}>Course Performance</h2>
          <p className="text-xs text-gray-400 mb-4">Average score and completion per course</p>
          <div className="space-y-4">
            {coursePerformance.map((c) => (
              <div key={c.courseId}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: "rgba(201,168,76,0.15)", color: "#92400e" }}
                    >
                      {c.courseCode}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: "#1a2b5e" }}>
                      {c.courseName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-400">
                      {c.submitted}/{c.total} done
                    </span>
                    {c.avgPct !== null && (
                      <span
                        className="font-bold px-2 py-0.5 rounded-full"
                        style={{ background: pctBg(c.avgPct), color: pctColor(c.avgPct) }}
                      >
                        {c.avgPct}%
                      </span>
                    )}
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "#e5eaf5" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${c.total > 0 ? (c.submitted / c.total) * 100 : 0}%`,
                      background: c.avgPct !== null ? pctColor(c.avgPct) : "#1a2b5e",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Struggle Topics + Class Standing ──────────────────── */}
      <div className="grid grid-cols-2 gap-6">
        {/* Struggle Topics */}
        <div className={CARD} style={CARD_STYLE}>
          <h2 className="text-base font-bold mb-0.5" style={{ color: "#1a2b5e" }}>Struggle Topics</h2>
          <p className="text-xs text-gray-400 mb-4">From chats, quizzes &amp; assignments</p>
          {struggles.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No struggle topics yet. Great work!</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {struggles.map((s) => (
                <div
                  key={s.topic}
                  className="flex items-center justify-between gap-2 rounded-lg px-3 py-2"
                  style={{ background: s.count >= 3 ? "rgba(220,38,38,0.07)" : "rgba(251,191,36,0.08)" }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs shrink-0 ${s.count >= 3 ? "text-red-500" : "text-amber-500"}`}>
                      {s.count >= 3 ? "⚠" : "•"}
                    </span>
                    <span
                      className="text-sm font-medium truncate capitalize"
                      style={{ color: s.count >= 3 ? "#b91c1c" : "#92400e" }}
                    >
                      {s.topic}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className="text-xs font-bold"
                      style={{ color: s.count >= 3 ? "#b91c1c" : "#d97706" }}
                    >
                      {s.count}×
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={
                        s.count >= 3
                          ? { background: "rgba(220,38,38,0.15)", color: "#b91c1c" }
                          : { background: "rgba(245,158,11,0.15)", color: "#d97706" }
                      }
                    >
                      {s.count >= 3 ? "Review" : "Watch"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Class Standing */}
        <div className={CARD} style={CARD_STYLE}>
          <h2 className="text-base font-bold mb-0.5" style={{ color: "#1a2b5e" }}>Class Standing</h2>
          <p className="text-xs text-gray-400 mb-4">Based on scores &amp; engagement</p>
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5eaf5" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={percentileColor} strokeWidth="10"
                  strokeDasharray={`${strokeDash} ${CIRC}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold leading-none" style={{ color: percentileColor }}>
                  {percentile}
                </span>
                <span className="text-[10px] text-gray-400 mt-0.5">percentile</span>
              </div>
            </div>
            <span
              className="mt-3 text-sm font-semibold px-3 py-1 rounded-full"
              style={{ background: `${percentileColor}1a`, color: percentileColor }}
            >
              {percentileLabel}
            </span>
            <p className="text-xs text-gray-400 mt-2 text-center">
              You score better than {percentile}% of your peers
            </p>
          </div>
        </div>
      </div>

      {/* ── Activity Timeline ──────────────────────────────────── */}
      <div className={CARD} style={CARD_STYLE}>
        <h2 className="text-base font-bold mb-0.5" style={{ color: "#1a2b5e" }}>Activity Timeline</h2>
        <p className="text-xs text-gray-400 mb-5">Chat messages per day — last 14 days</p>
        <div className="flex items-end gap-1.5 h-28">
          {timeline.map((day) => {
            const heightPct = day.count === 0 ? 0 : Math.max((day.count / maxTimelineCount) * 100, 8);
            const isToday = day.date === today;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="absolute bottom-full mb-1.5 hidden group-hover:flex justify-center z-10 pointer-events-none w-max left-1/2 -translate-x-1/2">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap">
                    {formatDateFull(day.date)}: {day.count} msg{day.count !== 1 ? "s" : ""}
                  </div>
                </div>
                <div
                  className="w-full rounded-t-md transition-all duration-200"
                  style={{
                    height: `${heightPct}%`,
                    minHeight: day.count > 0 ? "4px" : "0px",
                    background: isToday ? "#c9a84c" : "#1a2b5e",
                    opacity: day.count === 0 ? 0.12 : isToday ? 1 : 0.75,
                  }}
                />
                <span className="text-[9px] text-gray-400 leading-none">{dayLabel(day.date)}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-400">{formatDateFull(timeline[0]?.date ?? "")}</span>
          <span className="text-[10px] text-gray-400">Today</span>
        </div>
      </div>

      {/* ── Assessment Scores ──────────────────────────────────── */}
      <div className={CARD} style={CARD_STYLE}>
        <h2 className="text-base font-bold mb-0.5" style={{ color: "#1a2b5e" }}>All Assessment Scores</h2>
        <p className="text-xs text-gray-400 mb-4">Every quiz and assignment across your courses</p>
        {assessmentScores.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No assessments submitted yet.</p>
        ) : (
          <div className="space-y-2">
            {assessmentScores.map((a, i) => {
              const pct = a.total_marks > 0 ? Math.round((a.ai_score / a.total_marks) * 100) : 0;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 border"
                  style={{ borderColor: "#e5eaf5", background: "#ffffff" }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={
                          a.type === "quiz"
                            ? { background: "#dbeafe", color: "#1d4ed8" }
                            : { background: "#fef3c7", color: "#92400e" }
                        }
                      >
                        {a.type === "quiz" ? "Quiz" : "Assignment"}
                      </span>
                      <span className="text-[10px] text-gray-400 truncate">{a.courseName}</span>
                    </div>
                    <p className="text-sm font-semibold truncate" style={{ color: "#1a2b5e" }}>{a.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(a.submitted_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {a.rank !== null && (
                      <div className="text-right">
                        <p className="text-xs font-bold" style={{ color: "#1a2b5e" }}>
                          #{a.rank}<span className="text-gray-400 font-normal">/{a.total_students}</span>
                        </p>
                        <p className="text-[10px] text-gray-400">rank</p>
                      </div>
                    )}
                    <div className="text-right">
                      <span
                        className="text-sm font-extrabold px-2.5 py-1 rounded-full"
                        style={{ background: pctBg(pct), color: pctColor(pct) }}
                      >
                        {a.ai_score}/{a.total_marks}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-0.5 text-center">{pct}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
