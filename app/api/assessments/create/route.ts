import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

interface Question {
  question_text: string;
  question_type: "mcq" | "short_answer";
  options?: string[];
  correct_answer?: string;
  marks: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { courseId, profId, title, description, type, dueDate, totalMarks, questions } =
      body as {
        courseId: string;
        profId: string;
        title: string;
        description: string;
        type: "quiz" | "assignment";
        dueDate: string | null;
        totalMarks: number;
        questions?: Question[];
      };

    const { data: assessment, error } = await supabaseAdmin
      .from("assessments")
      .insert({
        course_id: courseId,
        prof_id: profId,
        title,
        description: description || null,
        type,
        due_date: dueDate || null,
        total_marks: totalMarks ?? 100,
      })
      .select("id")
      .single();

    if (error || !assessment) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create assessment" },
        { status: 500 }
      );
    }

    if (type === "quiz" && questions?.length) {
      const qRows = questions.map((q, i) => ({
        assessment_id: assessment.id,
        question_number: i + 1,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options ?? null,
        correct_answer: q.correct_answer ?? null,
        marks: q.marks ?? 1,
      }));
      const { error: qErr } = await supabaseAdmin.from("quiz_questions").insert(qRows);
      if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });
    }

    return NextResponse.json({ id: assessment.id });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
