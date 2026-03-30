"use client";

interface CriterionScore {
  criterion: string;
  score: number;
  max_score: number;
  feedback: string;
}

export interface AiFeedback {
  overall_score: number;
  criteria_scores: CriterionScore[];
  strengths: string[];
  areas_for_improvement: string[];
  summary: string;
  extra_knowledge_noted: string;
}

interface Props {
  feedback: AiFeedback;
  isPreliminary?: boolean;
  professorScore?: number | null;
}

function scoreColor(pct: number): string {
  if (pct >= 70) return "#16a34a";
  if (pct >= 50) return "#f59e0b";
  return "#dc2626";
}

function ScoreGauge({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = scoreColor(score);

  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      <circle cx="44" cy="44" r={r} fill="none" stroke="#e5eaf5" strokeWidth="7" />
      <circle
        cx="44" cy="44" r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 44 44)"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x="44" y="44" textAnchor="middle" dy="0.35em" fontSize="17" fontWeight="800" fill="#1a2b5e">
        {score}
      </text>
    </svg>
  );
}

export default function FeedbackCard({ feedback, isPreliminary = true, professorScore }: Props) {
  const displayScore = professorScore != null ? professorScore : feedback.overall_score;
  const color = scoreColor(displayScore);

  return (
    <div className="space-y-5">
      {/* Score header */}
      <div
        className="flex items-center gap-5 p-4 rounded-2xl"
        style={{ background: "#f8faff", border: "1px solid #e5eaf5" }}
      >
        <ScoreGauge score={displayScore} />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-2xl font-extrabold" style={{ color }}>
              {displayScore}
              <span className="text-sm font-semibold text-gray-400"> / 100</span>
            </span>
            {isPreliminary && professorScore == null && (
              <span
                className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                style={{ background: "rgba(201,168,76,0.18)", color: "#92400e" }}
              >
                Preliminary
              </span>
            )}
            {professorScore != null && (
              <span
                className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                style={{ background: "#dcfce7", color: "#15803d" }}
              >
                Grade Confirmed
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{feedback.summary}</p>
          {feedback.extra_knowledge_noted && (
            <p
              className="text-xs mt-1.5 px-2 py-1 rounded-lg"
              style={{ background: "rgba(99,102,241,0.08)", color: "#4f46e5" }}
            >
              ✨ {feedback.extra_knowledge_noted}
            </p>
          )}
        </div>
      </div>

      {/* Criteria breakdown */}
      {feedback.criteria_scores?.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2.5" style={{ color: "#1a2b5e" }}>
            Criteria Breakdown
          </p>
          <div className="space-y-3">
            {feedback.criteria_scores.map((c, i) => {
              const pct = c.max_score > 0 ? (c.score / c.max_score) * 100 : 0;
              const col = scoreColor(pct);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold" style={{ color: "#1a2b5e" }}>
                      {c.criterion}
                    </span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: col }}>
                      {c.score} / {c.max_score}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#e5eaf5" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: col }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{c.feedback}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Strengths & Improvements side-by-side */}
      <div className="grid grid-cols-2 gap-3">
        {feedback.strengths?.length > 0 && (
          <div className="rounded-xl p-3" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#15803d" }}>
              Strengths
            </p>
            <ul className="space-y-1">
              {feedback.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                  <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {feedback.areas_for_improvement?.length > 0 && (
          <div className="rounded-xl p-3" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#92400e" }}>
              To Improve
            </p>
            <ul className="space-y-1">
              {feedback.areas_for_improvement.map((a, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                  <span className="text-amber-500 mt-0.5 shrink-0">→</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
