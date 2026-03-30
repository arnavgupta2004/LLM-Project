import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get courses this student is enrolled in
  const { data: myEnrollments } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("student_id", user.id);

  if (!myEnrollments?.length) return NextResponse.json({ percentile: 50 });

  const courseIds = myEnrollments.map((e) => e.course_id);

  // Get all students enrolled in the same courses
  const { data: peers } = await supabaseAdmin
    .from("enrollments")
    .select("student_id")
    .in("course_id", courseIds);

  const peerIds = Array.from(new Set((peers ?? []).map((e) => e.student_id)));
  if (peerIds.length <= 1) return NextResponse.json({ percentile: 50 });

  // Interaction counts (student messages only)
  const { data: chatRows } = await supabaseAdmin
    .from("chat_messages")
    .select("student_id")
    .in("course_id", courseIds)
    .in("student_id", peerIds)
    .eq("role", "user");

  const interactionMap: Record<string, number> = {};
  for (const row of chatRows ?? []) {
    interactionMap[row.student_id] = (interactionMap[row.student_id] ?? 0) + 1;
  }

  // Average submission scores
  const { data: subRows } = await supabaseAdmin
    .from("submissions")
    .select("student_id, overall_score")
    .in("course_id", courseIds)
    .in("student_id", peerIds)
    .not("overall_score", "is", null);

  const scoreMap: Record<string, number[]> = {};
  for (const row of subRows ?? []) {
    if (!scoreMap[row.student_id]) scoreMap[row.student_id] = [];
    scoreMap[row.student_id].push(row.overall_score as number);
  }

  // Combined score: 0.5 * interactions + avg_submission_score
  const scores = peerIds.map((id) => {
    const interactions = interactionMap[id] ?? 0;
    const avgScore =
      scoreMap[id]?.length
        ? scoreMap[id].reduce((a, b) => a + b, 0) / scoreMap[id].length
        : 50;
    return { id, combined: interactions * 0.5 + avgScore };
  });

  const myScore = scores.find((s) => s.id === user.id)?.combined ?? 0;
  const countBelow = scores.filter((s) => s.combined < myScore).length;
  const percentile = Math.round((countBelow / (peerIds.length - 1)) * 100);

  return NextResponse.json({ percentile });
}
