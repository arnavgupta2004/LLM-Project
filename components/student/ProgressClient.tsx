"use client";

interface StruggleTopic {
  topic: string;
  count: number;
}

interface TimelineDay {
  date: string;
  count: number;
}

interface Props {
  struggles: StruggleTopic[];
  percentile: number;
  timeline: TimelineDay[];
}

export default function ProgressClient({ struggles, percentile, timeline }: Props) {
  const maxCount = Math.max(...timeline.map((d) => d.count), 1);

  const percentileColor =
    percentile >= 70 ? "#16a34a" : percentile >= 40 ? "#d97706" : "#dc2626";
  const percentileLabel =
    percentile >= 70 ? "Top Performer" : percentile >= 40 ? "On Track" : "Needs Attention";

  // Circumference of circle r=40: 2π*40 ≈ 251.3
  const CIRC = 251.3;
  const strokeDash = (percentile / 100) * CIRC;

  function dayLabel(dateStr: string) {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en", { weekday: "short" }).slice(0, 1);
  }

  function formatDateFull(dateStr: string) {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en", { month: "short", day: "numeric" });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Row 1: Struggle Topics + Class Standing */}
      <div className="grid grid-cols-2 gap-6">
        {/* Struggle Topics */}
        <div
          className="rounded-2xl border p-5"
          style={{ borderColor: "#e5eaf5", background: "#fafbff" }}
        >
          <h2 className="text-base font-bold mb-0.5" style={{ color: "#1a2b5e" }}>
            Struggle Topics
          </h2>
          <p className="text-xs text-gray-400 mb-4">Asked 3+ times — review recommended</p>
          {struggles.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No struggle topics yet. Great work!
            </p>
          ) : (
            <div className="space-y-2">
              {struggles.map((s) => (
                <div
                  key={s.topic}
                  className="flex items-center justify-between gap-2 rounded-lg px-3 py-2"
                  style={{ background: "rgba(220,38,38,0.07)" }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-red-500 text-xs shrink-0">⚠</span>
                    <span className="text-sm font-medium text-red-700 truncate">{s.topic}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-bold text-red-600">{s.count}×</span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: "rgba(220,38,38,0.15)", color: "#b91c1c" }}
                    >
                      Review
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Class Standing */}
        <div
          className="rounded-2xl border p-5"
          style={{ borderColor: "#e5eaf5", background: "#fafbff" }}
        >
          <h2 className="text-base font-bold mb-0.5" style={{ color: "#1a2b5e" }}>
            Class Standing
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Based on engagement &amp; submission scores
          </p>
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#e5eaf5"
                  strokeWidth="10"
                />
                {/* Progress */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={percentileColor}
                  strokeWidth="10"
                  strokeDasharray={`${strokeDash} ${CIRC}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-2xl font-extrabold leading-none"
                  style={{ color: percentileColor }}
                >
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
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: "#e5eaf5", background: "#fafbff" }}
      >
        <h2 className="text-base font-bold mb-0.5" style={{ color: "#1a2b5e" }}>
          Activity Timeline
        </h2>
        <p className="text-xs text-gray-400 mb-5">Chat messages per day — last 14 days</p>

        <div className="flex items-end gap-1.5 h-28">
          {timeline.map((day) => {
            const heightPct =
              day.count === 0 ? 0 : Math.max((day.count / maxCount) * 100, 8);
            const isToday = day.date === today;
            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-1 group relative"
              >
                {/* Hover tooltip */}
                <div className="absolute bottom-full mb-1.5 hidden group-hover:flex justify-center z-10 pointer-events-none w-max left-1/2 -translate-x-1/2">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap">
                    {formatDateFull(day.date)}: {day.count} msg
                    {day.count !== 1 ? "s" : ""}
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
                <span className="text-[9px] text-gray-400 leading-none">
                  {dayLabel(day.date)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-400">
            {formatDateFull(timeline[0]?.date ?? "")}
          </span>
          <span className="text-[10px] text-gray-400">Today</span>
        </div>
      </div>
    </div>
  );
}
