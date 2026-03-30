import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import SubmissionsList from "@/components/student/SubmissionsList";

export default async function SubmissionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // Fetch all submissions for this student with course info
  const { data: rawSubmissions } = await supabase
    .from("submissions")
    .select("id, title, status, overall_score, professor_score, ai_feedback, created_at, courses(name, code)")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch enrolled courses for the submit dialog dropdown
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("courses(id, name, code)")
    .eq("student_id", user.id);

  type CourseRow = { id: string; name: string; code: string };
  const enrolledCourses: CourseRow[] = (enrollments ?? [])
    .flatMap((e) => (Array.isArray(e.courses) ? e.courses : [e.courses]))
    .filter((c): c is CourseRow => c !== null && typeof c === "object");

  // Normalise Supabase join shape
  const submissions = (rawSubmissions ?? []).map((s) => ({
    ...s,
    courses: Array.isArray(s.courses) ? s.courses[0] ?? null : s.courses,
  }));

  return (
    <div className="h-full overflow-y-auto p-8">
      <SubmissionsList
        submissions={submissions as Parameters<typeof SubmissionsList>[0]["submissions"]}
        studentId={user.id}
        enrolledCourses={enrolledCourses}
      />
    </div>
  );
}
