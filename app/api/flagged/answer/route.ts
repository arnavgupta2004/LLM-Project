import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify professor role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "professor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { flaggedQuestionId, answer } = await req.json();
  if (!flaggedQuestionId || !answer?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Fetch the flagged question
  const { data: fq, error: fqError } = await supabaseAdmin
    .from("flagged_questions")
    .select("id, course_id, student_id, question")
    .eq("id", flaggedQuestionId)
    .single();

  if (fqError || !fq) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Save answer to flagged_questions
  await supabaseAdmin
    .from("flagged_questions")
    .update({
      prof_answer: answer.trim(),
      answered_at: new Date().toISOString(),
    })
    .eq("id", flaggedQuestionId);

  // Insert professor's reply as an assistant message so the student sees it in chat
  await supabaseAdmin.from("chat_messages").insert({
    course_id: fq.course_id,
    student_id: fq.student_id,
    role: "assistant",
    content: `**Professor's Answer:** ${answer.trim()}`,
    flagged_for_prof: false,
  });

  return NextResponse.json({ ok: true });
}
