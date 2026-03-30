import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { redirect } from "next/navigation";
import ProgressClient from "@/components/student/ProgressClient";

export default async function MyProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // ── Struggle topics ──────────────────────────────────────────────────────
  const { data: struggles } = await supabase
    .from("student_topic_struggles")
    .select("topic, count")
    .eq("student_id", user.id)
    .gte("count", 3)
    .order("count", { ascending: false });

  // ── Activity timeline: chat messages per day over last 14 days ───────────
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const { data: recentMessages } = await supabase
    .from("chat_messages")
    .select("created_at")
    .eq("student_id", user.id)
    .eq("role", "user")
    .gte("created_at", since.toISOString());

  // Build a bucket for each of the last 14 days
  const dayMap: Record<string, number> = {};
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    dayMap[d.toISOString().slice(0, 10)] = 0;
  }
  for (const msg of recentMessages ?? []) {
    const day = (msg.created_at as string).slice(0, 10);
    if (day in dayMap) dayMap[day]++;
  }
  const timeline = Object.entries(dayMap).map(([date, count]) => ({ date, count }));

  // ── Class standing percentile ────────────────────────────────────────────
  let percentile = 50;

  const { data: myEnrollments } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("student_id", user.id);

  if (myEnrollments?.length) {
    const courseIds = myEnrollments.map((e) => e.course_id);

    const { data: peers } = await supabaseAdmin
      .from("enrollments")
      .select("student_id")
      .in("course_id", courseIds);

    const peerIds = Array.from(new Set((peers ?? []).map((e) => e.student_id)));

    if (peerIds.length > 1) {
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

      const scores = peerIds.map((id) => {
        const interactions = interactionMap[id] ?? 0;
        const avgScore = scoreMap[id]?.length
          ? scoreMap[id].reduce((a, b) => a + b, 0) / scoreMap[id].length
          : 50;
        return { id, combined: interactions * 0.5 + avgScore };
      });

      const myScore = scores.find((s) => s.id === user.id)?.combined ?? 0;
      const countBelow = scores.filter((s) => s.combined < myScore).length;
      percentile = Math.round((countBelow / (peerIds.length - 1)) * 100);
    }
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <h1 className="text-2xl font-extrabold mb-1" style={{ color: "#1a2b5e" }}>
        My Progress
      </h1>
      <p className="text-gray-400 text-sm mb-6">
        Track your learning activity and areas for improvement
      </p>
      <ProgressClient
        struggles={struggles ?? []}
        percentile={percentile}
        timeline={timeline}
      />
    </div>
  );
}
