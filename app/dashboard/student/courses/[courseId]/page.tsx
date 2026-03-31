import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { redirect, notFound } from "next/navigation";
import ChatInterface from "@/components/student/ChatInterface";
import CourseInfoPanel from "@/components/student/CourseInfoPanel";

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function StudentCourseDetailPage({ params }: Props) {
  const { courseId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // Verify enrollment
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("student_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (!enrollment) notFound();

  // Fetch course details
  const { data: course } = await supabase
    .from("courses")
    .select(
      "id, name, code, credits, difficulty_level, faculty_name, assessment_weights"
    )
    .eq("id", courseId)
    .single();

  if (!course) notFound();

  // Fetch units, materials, and chat history in parallel
  const [unitsResult, materialsResult, historyResult] = await Promise.all([
    supabase
      .from("course_units")
      .select("id, unit_number, title, hours, topics")
      .eq("course_id", courseId)
      .order("unit_number"),

    supabase
      .from("course_materials")
      .select("id, file_name, file_type, file_path, indexed")
      .eq("course_id", courseId)
      .eq("indexed", true)
      .order("uploaded_at"),

    supabase
      .from("chat_messages")
      .select("id, role, content, flagged_for_prof")
      .eq("course_id", courseId)
      .eq("student_id", user.id)
      .order("created_at")
      .limit(100),
  ]);

  const units = unitsResult.data ?? [];
  const rawMaterials = materialsResult.data ?? [];

  // Generate signed URLs for each material (1 hour expiry)
  const materials = await Promise.all(
    rawMaterials.map(async (mat) => {
      const { data } = await supabaseAdmin.storage
        .from("course-materials")
        .createSignedUrl(mat.file_path ?? "", 3600);
      return { ...mat, signedUrl: data?.signedUrl ?? null };
    })
  );
  const rawHistory = historyResult.data ?? [];

  const chatHistory = rawHistory.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    flagged: m.flagged_for_prof ?? false,
  }));

  return (
    // Override student layout's overflow-y-auto — this page manages its own scroll
    <div className="flex h-full overflow-hidden">
      {/* LEFT: Chat */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ChatInterface
          courseId={courseId}
          studentId={user.id}
          courseName={course.name}
          difficultyLevel={course.difficulty_level ?? "undergraduate"}
          history={chatHistory}
        />
      </div>

      {/* RIGHT: Course info panel */}
      <CourseInfoPanel
        course={course}
        units={units}
        materials={materials}
      />
    </div>
  );
}
