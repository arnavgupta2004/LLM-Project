import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { redirect } from "next/navigation";
import CalendarAgenda from "@/components/shared/CalendarAgenda";
import CreateCalendarEventDialog from "@/components/professor/CreateCalendarEventDialog";
import InterviewRequestsPanel from "@/components/professor/InterviewRequestsPanel";
import PageChatbot from "@/components/shared/PageChatbot";
import { CalendarEventItem } from "@/lib/calendar";

function firstJoin<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export default async function ProfessorCalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: courses } = await supabase
    .from("courses")
    .select("id, name, code")
    .eq("prof_id", user.id)
    .order("created_at", { ascending: false });

  const courseIds = (courses ?? []).map((course) => course.id);

  const [assessmentsResult, eventsResult, interviewsResult] = await Promise.all([
    courseIds.length
      ? supabaseAdmin
          .from("assessments")
          .select("id, title, type, due_date, total_marks, description, course_id")
          .in("course_id", courseIds)
          .not("due_date", "is", null)
      : { data: [], error: null },
    supabaseAdmin
      .from("calendar_events")
      .select("id, title, description, event_type, start_at, end_at, location, course_id, courses(name, code)")
      .eq("prof_id", user.id)
      .order("start_at", { ascending: true }),
    supabaseAdmin
      .from("interview_requests")
      .select("id, title, agenda, preferred_start, preferred_end, status, response_note, courses(name, code), profiles!student_id(full_name, email)")
      .eq("prof_id", user.id)
      .order("preferred_start", { ascending: true }),
  ]);

  const courseMap = new Map((courses ?? []).map((course) => [course.id, course]));

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
    const profile = firstJoin(
      item.profiles as
        | { full_name: string | null; email: string | null }
        | { full_name: string | null; email: string | null }[]
        | null
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
      subtitle: profile?.full_name ?? profile?.email ?? "Student",
    };
  });

  const allEvents = [...assessmentEvents, ...calendarEvents, ...interviewEvents];

  const interviewRequests = (interviewsResult.data ?? []).map((item) => {
    const course = firstJoin(
      item.courses as { name: string; code: string } | { name: string; code: string }[] | null
    );
    const profile = firstJoin(
      item.profiles as
        | { full_name: string | null; email: string | null }
        | { full_name: string | null; email: string | null }[]
        | null
    );

    return {
      id: item.id,
      title: item.title,
      agenda: item.agenda,
      preferred_start: item.preferred_start,
      preferred_end: item.preferred_end,
      status: item.status,
      response_note: item.response_note,
      courses: course,
      profiles: profile,
    };
  });

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: "#1a2b5e" }}>
            Calendar
          </h1>
          <p className="text-gray-400 text-sm">
            Manage classes, meetings, office hours, deadlines, and student interview requests
          </p>
        </div>
        <CreateCalendarEventDialog courses={courses ?? []} />
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6 max-w-3xl">
        {[
          { label: "All Items", value: allEvents.length, bg: "#eef1f9", color: "#1a2b5e" },
          { label: "Your Events", value: calendarEvents.length, bg: "#dbeafe", color: "#1d4ed8" },
          { label: "Assessments", value: assessmentEvents.length, bg: "#fef3c7", color: "#92400e" },
          { label: "Interviews", value: interviewEvents.length, bg: "#ede9fe", color: "#6d28d9" },
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

      <div className="grid grid-cols-[1.4fr_0.9fr] gap-6">
        <CalendarAgenda
          events={allEvents}
          emptyTitle="No scheduled events yet"
          emptyBody="Add a class, office hour, or meeting to start using the calendar."
        />
        <InterviewRequestsPanel requests={interviewRequests} />
      </div>

      <PageChatbot
        scope="prof_analytics"
        title="Professor Calendar"
        subtitle="Ask about upcoming classes, deadlines, and interview requests."
        placeholder="Ask about your calendar..."
        instructions="Answer only using the professor's calendar events, assessments, and interview requests."
        suggestedPrompts={[
          "What do I have coming up this week?",
          "Which interview requests need attention?",
          "Which course has the most upcoming deadlines?",
        ]}
        context={{
          events: allEvents,
          interviewRequests,
          courses,
        }}
      />
    </div>
  );
}
