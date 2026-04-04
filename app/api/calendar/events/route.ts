import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "professor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await req.json()) as {
      title: string;
      description?: string | null;
      eventType: "class" | "meeting" | "office_hour" | "custom";
      courseId?: string | null;
      startAt: string;
      endAt?: string | null;
      location?: string | null;
    };

    const { error } = await supabaseAdmin.from("calendar_events").insert({
      prof_id: user.id,
      course_id: body.courseId ?? null,
      title: body.title,
      description: body.description ?? null,
      event_type: body.eventType,
      start_at: body.startAt,
      end_at: body.endAt ?? null,
      location: body.location ?? null,
    });

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message.includes("calendar_events")
              ? "Calendar tables are not set up yet. Please create the calendar SQL tables first."
              : error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create event" },
      { status: 500 }
    );
  }
}
