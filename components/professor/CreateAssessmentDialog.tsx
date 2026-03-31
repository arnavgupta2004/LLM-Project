"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Question {
  id: string; // local only
  question_text: string;
  question_type: "mcq" | "short_answer";
  options: [string, string, string, string];
  correct_answer: string;
  marks: number;
}

interface Props {
  courseId: string;
  profId: string;
}

const emptyQuestion = (): Question => ({
  id: Math.random().toString(36).slice(2),
  question_text: "",
  question_type: "mcq",
  options: ["", "", "", ""],
  correct_answer: "A",
  marks: 1,
});

export default function CreateAssessmentDialog({ courseId, profId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"quiz" | "assignment">("quiz");
  const [dueDate, setDueDate] = useState("");
  const [totalMarks, setTotalMarks] = useState(100);

  // Step 2 fields (quiz only)
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);

  function reset() {
    setStep(1);
    setTitle("");
    setDescription("");
    setType("quiz");
    setDueDate("");
    setTotalMarks(100);
    setQuestions([emptyQuestion()]);
    setError("");
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, emptyQuestion()]);
  }

  function removeQuestion(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function updateQuestion(id: string, patch: Partial<Question>) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function updateOption(qId: string, idx: number, value: string) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const opts = [...q.options] as [string, string, string, string];
        opts[idx] = value;
        return { ...q, options: opts };
      })
    );
  }

  async function handleSubmit() {
    setError("");
    if (!title.trim()) { setError("Title is required."); return; }
    if (type === "quiz") {
      for (const q of questions) {
        if (!q.question_text.trim()) { setError("All questions must have text."); return; }
        if (q.question_type === "mcq") {
          if (q.options.some((o) => !o.trim())) {
            setError("All MCQ options must be filled."); return;
          }
        } else {
          if (!q.correct_answer.trim()) {
            setError("Short answer questions need a model answer."); return;
          }
        }
      }
    }

    setLoading(true);
    try {
      const payload = {
        courseId,
        profId,
        title: title.trim(),
        description: description.trim(),
        type,
        dueDate: dueDate || null,
        totalMarks,
        questions:
          type === "quiz"
            ? questions.map((q) => ({
                question_text: q.question_text.trim(),
                question_type: q.question_type,
                options: q.question_type === "mcq" ? q.options : undefined,
                correct_answer:
                  q.question_type === "mcq"
                    ? q.options[["A", "B", "C", "D"].indexOf(q.correct_answer)]
                    : q.correct_answer.trim(),
                marks: q.marks,
              }))
            : undefined,
      };

      const res = await fetch("/api/assessments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create."); return; }

      setOpen(false);
      reset();
      router.refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  const LABEL_STYLE = "text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-1.5";
  const INPUT_STYLE =
    "w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all";
  const INPUT_COLORS = { borderColor: "#dde3f0", background: "#fafbff" } as React.CSSProperties;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        style={{ background: "#1a2b5e", color: "#ffffff" }}
      >
        + Create Assessment
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(10,20,55,0.45)" }}
        onClick={() => { setOpen(false); reset(); }}
      />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-7"
        style={{ background: "#ffffff" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-extrabold" style={{ color: "#1a2b5e" }}>
              Create Assessment
            </h2>
            <p className="text-sm text-gray-400">
              {step === 1 ? "Set up the basic details" : "Add quiz questions"}
            </p>
          </div>
          <button
            onClick={() => { setOpen(false); reset(); }}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Step 1: Basic info */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Type selector */}
            <div>
              <label className={LABEL_STYLE}>Type</label>
              <div className="grid grid-cols-2 gap-3">
                {(["quiz", "assignment"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className="py-3 rounded-xl border-2 text-sm font-semibold transition-all"
                    style={
                      type === t
                        ? { borderColor: "#1a2b5e", background: "#eef1f9", color: "#1a2b5e" }
                        : { borderColor: "#e5e7eb", background: "#fff", color: "#6b7280" }
                    }
                  >
                    {t === "quiz" ? "🧩 Quiz (on-website)" : "📎 Assignment (PDF upload)"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={LABEL_STYLE}>Title *</label>
              <input
                type="text"
                placeholder="e.g. Unit 2 Quiz"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={INPUT_STYLE}
                style={INPUT_COLORS}
              />
            </div>

            <div>
              <label className={LABEL_STYLE}>Description (optional)</label>
              <textarea
                placeholder="Instructions or topic coverage..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className={INPUT_STYLE}
                style={INPUT_COLORS}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL_STYLE}>Due Date (optional)</label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={INPUT_STYLE}
                  style={INPUT_COLORS}
                />
              </div>
              <div>
                <label className={LABEL_STYLE}>Total Marks</label>
                <input
                  type="number"
                  min={1}
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(Number(e.target.value))}
                  className={INPUT_STYLE}
                  style={INPUT_COLORS}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setOpen(false); reset(); }}
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold"
                style={{ borderColor: "#e5eaf5", color: "#6b7280" }}
              >
                Cancel
              </button>
              {type === "quiz" ? (
                <button
                  onClick={() => {
                    if (!title.trim()) { setError("Title is required."); return; }
                    setError("");
                    setStep(2);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "#1a2b5e", color: "#fff" }}
                >
                  Next: Add Questions →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "#1a2b5e", color: "#fff" }}
                >
                  {loading ? "Creating…" : "Create Assignment"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Questions */}
        {step === 2 && (
          <div className="space-y-5">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="rounded-xl border p-4 space-y-3"
                style={{ borderColor: "#e5eaf5" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold" style={{ color: "#1a2b5e" }}>
                    Q{idx + 1}
                  </span>
                  <div className="flex items-center gap-3">
                    {/* Type toggle */}
                    <div
                      className="flex rounded-lg p-0.5"
                      style={{ background: "#f0f3fb" }}
                    >
                      {(["mcq", "short_answer"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => updateQuestion(q.id, { question_type: t })}
                          className="px-3 py-1 rounded-md text-xs font-semibold transition-all"
                          style={
                            q.question_type === t
                              ? { background: "#1a2b5e", color: "#fff" }
                              : { color: "#6b7280" }
                          }
                        >
                          {t === "mcq" ? "MCQ" : "Short Answer"}
                        </button>
                      ))}
                    </div>
                    {questions.length > 1 && (
                      <button
                        onClick={() => removeQuestion(q.id)}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Question text…"
                  value={q.question_text}
                  onChange={(e) => updateQuestion(q.id, { question_text: e.target.value })}
                  className={INPUT_STYLE}
                  style={INPUT_COLORS}
                />

                {q.question_type === "mcq" ? (
                  <div className="space-y-2">
                    {(["A", "B", "C", "D"] as const).map((letter, i) => (
                      <div key={letter} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={q.correct_answer === letter}
                          onChange={() => updateQuestion(q.id, { correct_answer: letter })}
                          className="shrink-0"
                        />
                        <span
                          className="text-xs font-bold shrink-0 w-5"
                          style={{ color: "#1a2b5e" }}
                        >
                          {letter}
                        </span>
                        <input
                          type="text"
                          placeholder={`Option ${letter}`}
                          value={q.options[i]}
                          onChange={(e) => updateOption(q.id, i, e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                          style={INPUT_COLORS}
                        />
                      </div>
                    ))}
                    <p className="text-xs text-gray-400">
                      Select the radio button next to the correct answer.
                    </p>
                  </div>
                ) : (
                  <textarea
                    placeholder="Model / expected answer…"
                    value={q.correct_answer}
                    onChange={(e) => updateQuestion(q.id, { correct_answer: e.target.value })}
                    rows={2}
                    className={INPUT_STYLE}
                    style={INPUT_COLORS}
                  />
                )}

                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Marks:</label>
                  <input
                    type="number"
                    min={1}
                    value={q.marks}
                    onChange={(e) => updateQuestion(q.id, { marks: Number(e.target.value) })}
                    className="w-16 px-2 py-1.5 rounded-lg border text-sm outline-none"
                    style={INPUT_COLORS}
                  />
                </div>
              </div>
            ))}

            <button
              onClick={addQuestion}
              className="w-full py-2.5 rounded-xl border-2 border-dashed text-sm font-semibold transition-colors"
              style={{ borderColor: "#c9a84c", color: "#c9a84c" }}
            >
              + Add Question
            </button>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold"
                style={{ borderColor: "#e5eaf5", color: "#6b7280" }}
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "#1a2b5e", color: "#fff" }}
              >
                {loading ? "Creating…" : `Create Quiz (${questions.length} question${questions.length !== 1 ? "s" : ""})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
