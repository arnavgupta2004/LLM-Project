import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { geminiFlash } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { courseId, studentId } = await req.json();

    const { data: struggles, error: strugglesError } = await supabaseAdmin
      .from("student_topic_struggles")
      .select("topic")
      .eq("course_id", courseId)
      .eq("student_id", studentId)
      .order("count", { ascending: false })
      .limit(2);

    if (strugglesError || !struggles) {
      return NextResponse.json({ error: strugglesError?.message }, { status: 500 });
    }

    const topics = struggles.map(s => s.topic).join(", ") || "General concepts from course material";

    const prompt = `Generate a 3-question Multiple Choice quiz based on the following topics: ${topics}.
Format the output STRICTLY as a JSON array of objects, with NO Markdown wrapping or backticks.
Your output must look exactly like this:
[
  {
    "question": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A"
  }
]
Important: "answer" must be exactly the string from "options".`;

    const result = await geminiFlash.generateContent(prompt);
    const rawText = result.response.text().trim();
    
    let generatedQuestions;
    try {
      // Find the first '[' and last ']' to extract just the array
      const startIndex = rawText.indexOf('[');
      const endIndex = rawText.lastIndexOf(']');
      
      if (startIndex === -1 || endIndex === -1) {
        throw new Error("No JSON array found in response");
      }
      
      const jsonStr = rawText.substring(startIndex, endIndex + 1);
      generatedQuestions = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse Gemini output. Raw text:", rawText);
      throw new Error("AI returned invalid JSON format.");
    }

    // Insert assessment
    const { data: assessment, error: assessmentError } = await supabaseAdmin
      .from("assessments")
      .insert({
        course_id: courseId,
        title: "Daily Adaptive Micro-Quiz",
        description: `Topics: ${topics}`,
        type: "quiz",
        total_marks: 3,
      })
      .select()
      .single();

    if (assessmentError || !assessment) throw assessmentError;

    // Insert questions
    const qInserts = generatedQuestions.map((q: { question: string; options: string[]; answer: string }, i: number) => ({
      assessment_id: assessment.id,
      question_number: i + 1,
      question_text: q.question,
      question_type: "mcq",
      options: q.options,
      correct_answer: q.answer,
      marks: 1
    }));

    await supabaseAdmin.from("quiz_questions").insert(qInserts);

    return NextResponse.json({ success: true, assessment_id: assessment.id });
  } catch (error) {
    console.error("[MicroQuiz]", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
