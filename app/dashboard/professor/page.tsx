import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import CoursesGrid from "@/components/professor/CoursesGrid";

export default async function ProfessorCoursesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: rawCourses } = await supabase
    .from("courses")
    .select("id, name, code, credits, difficulty_level")
    .eq("prof_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch enrollment counts separately (no FK needed)
  const courseIds = (rawCourses ?? []).map((c) => c.id);
  let enrollmentCounts: Record<string, number> = {};
  if (courseIds.length > 0) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("course_id")
      .in("course_id", courseIds);
    for (const e of enrollments ?? []) {
      enrollmentCounts[e.course_id] = (enrollmentCounts[e.course_id] ?? 0) + 1;
    }
  }

  const courses = (rawCourses ?? []).map((c) => ({
    ...c,
    enrollments: [{ count: enrollmentCounts[c.id] ?? 0 }],
  }));

  return (
    <div className="p-8">
      <CoursesGrid courses={courses ?? []} professorId={user.id} />
    </div>
  );
}
