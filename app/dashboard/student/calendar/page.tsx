import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { redirect } from "next/navigation";
import CalendarAgenda from "@/components/shared/CalendarAgenda";
import RequestInterviewDialog from "@/components/student/RequestInterviewDialog";
import PageChatbot from "@/components/shared/PageChatbot";
import { CalendarEventItem } from "@/lib/calendar";

function firstJoin<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export default async function StudentCalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("student_id", user.id);

  const courseIds = (enrollments ?? []).map((item) => item.course_id).filter(Boolean);

  const { data: courseRows } = courseIds.length
    ? await supabaseAdmin
        .from("courses")
        .select("id, name, code, prof_id, faculty_name")
        .in("id", courseIds)
    : { data: [] };

  const courses = courseRows ?? [];
  const profIds = Array.from(new Set(courses.map((course) => course.prof_id).filter(Boolean)));

  const [assessmentsResult, eventsResult, interviewsResult] = await Promise.all([
    courseIds.length
      ? supabaseAdmin
          .from("assessments")
          .select("id, title, type, due_date, total_marks, description, course_id")
          .in("course_id", courseIds)
          .not("due_date", "is", null)
      : { data: [], error: null },
    profIds.length
      ? supabaseAdmin
          .from("calendar_events")
          .select("id, title, description, event_type, start_at, end_at, location, course_id, courses(name, code)")
          .or(`course_id.in.(${courseIds.join(",")}),and(course_id.is.null,prof_id.in.(${profIds.join(",")}))`)
      : { data: [], error: null },
    supabaseAdmin
      .from("interview_requests")
      .select("id, title, agenda, preferred_start, preferred_end, status, response_note, course_id, courses(name, code)")
      .eq("student_id", user.id)
      .order("preferred_start", { ascending: true }),
  ]);

  const courseMap = new Map(courses.map((course) => [course.id, course]));

  const assessmentEvents: CalendarEventItem[] = (assessmentsResult.data ?? []).map((item) => ({
    id: `assessment-${item.id}`,
    title: item.title,
    description: item.description,
    type: item.type === "assignment" ? "assignment" : "quiz",
    startAt: item.due_date as string,
    courseName: courseMap.get(item.course_id)?.name ?? "Course",
    courseCode: courseMap.get(item.course_id)?.code ?? "",
    subtitle: `${item.total_marks} marks`,
  }));

  const calendarEvents: CalendarEventItem[] = (eventsResult.data ?? []).map((item) => {
    const course = firstJoin(
      item.courses as { name: string; code: string } | { name: string; code: string }[] | null
    );

    return {
      id: `event-${item.id}`,
      title: item.title,
      description: item.description,
      type:
        item.event_type === "class" ||
        item.event_type === "meeting" ||
        item.event_type === "office_hour"
          ? item.event_type
          : "custom",
      startAt: item.start_at,
      endAt: item.end_at,
      location: item.location,
      courseName: course?.name,
      courseCode: course?.code,
    };
  });

  const interviewEvents: CalendarEventItem[] = (interviewsResult.data ?? []).map((item) => {
    const course = firstJoin(
      item.courses as { name: string; code: string } | { name: string; code: string }[] | null
    );

    return {
      id: `interview-${item.id}`,
      title: item.title,
      description: item.agenda,
      type: "interview",
      startAt: item.preferred_start,
      endAt: item.preferred_end,
      status: item.status,
      courseName: course?.name,
      courseCode: course?.code,
      subtitle: item.response_note ?? undefined,
    };
  });

  const allEvents = [...assessmentEvents, ...calendarEvents, ...interviewEvents];

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: "#1a2b5e" }}>
            Calendar
          </h1>
          <p className="text-gray-400 text-sm">
            Track quizzes, assignments, classes, and interview requests in one place
          </p>
        </div>
        <RequestInterviewDialog
          courses={courses.map((course) => ({
            id: course.id,
            name: course.name,
            code: course.code,
            prof_id: course.prof_id,
            faculty_name: course.faculty_name,
          }))}
        />
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6 max-w-3xl">
        {[
          { label: "Scheduled Items", value: allEvents.length, bg: "#eef1f9", color: "#1a2b5e" },
          { label: "Assessments", value: assessmentEvents.length, bg: "#fef3c7", color: "#92400e" },
          { label: "Classes & Events", value: calendarEvents.length, bg: "#dbeafe", color: "#1d4ed8" },
          { label: "Interview Requests", value: interviewEvents.length, bg: "#ede9fe", color: "#6d28d9" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl p-4" style={{ background: item.bg }}>
            <p className="text-2xl font-extrabold leading-none" style={{ color: item.color }}>
              {item.value}
            </p>
            <p className="text-[11px] font-semibold mt-1" style={{ color: item.color }}>
              {item.label}
            </p>
          </div>
        ))}
      </div>

      <CalendarAgenda
        events={allEvents}
        emptyTitle="No calendar items yet"
        emptyBody="When professors schedule classes, office hours, or assessments, they will appear here."
      />

      <PageChatbot
        scope="student_courses"
        title="Calendar"
        subtitle="Ask about your upcoming assessments, events, and interview plans."
        placeholder="Ask about your schedule..."
        instructions="Answer only using the student's calendar data, assessments, classes, and interview requests."
        suggestedPrompts={[
          "What is coming up next for me?",
          "Which assignment or test is most urgent?",
          "Do I have any pending interview requests?",
        ]}
        context={{
          events: allEvents,
          courses,
        }}
      />
    </div>
  );
}
