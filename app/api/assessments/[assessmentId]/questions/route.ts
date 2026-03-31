import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  const { assessmentId } = await params;
  // Deliberately exclude correct_answer — students must not see it
  const { data, error } = await supabaseAdmin
    .from("quiz_questions")
    .select("id, question_number, question_text, question_type, options, marks")
    .eq("assessment_id", assessmentId)
    .order("question_number");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ questions: data ?? [] });
}
