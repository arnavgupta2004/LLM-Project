import { geminiFlash } from "./gemini";
import { supabaseAdmin } from "./supabase-admin";

/**
 * Extract a topic phrase from any student struggle text and upsert it into
 * student_topic_struggles. Called from chat, quiz wrong answers, and assignment mistakes.
 */
export async function tagStruggleTopic(
  courseId: string,
  studentId: string,
  text: string
): Promise<void> {
  try {
    const result = await geminiFlash.generateContent(
      `Given this student struggle: "${text.slice(0, 300)}"
Return ONLY a single 2–5 word topic phrase (e.g. "neural network backpropagation"). No explanation, punctuation, or quotes. Just the phrase.`
    );
    const topic = result.response.text().trim().toLowerCase().replace(/[".']/g, "");
    if (!topic || topic.length > 80) return;

    const { data: existing } = await supabaseAdmin
      .from("student_topic_struggles")
      .select("id, count")
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .eq("topic", topic)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from("student_topic_struggles")
        .update({ count: (existing.count ?? 0) + 1, last_seen_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabaseAdmin.from("student_topic_struggles").insert({
        student_id: studentId,
        course_id: courseId,
        topic,
        count: 1,
        last_seen_at: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.error("[tagStruggleTopic]", e);
  }
}
