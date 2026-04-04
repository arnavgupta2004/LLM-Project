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

  if (profile?.role !== "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await req.json()) as {
      courseId: string;
      profId: string;
      title: string;
      agenda: string;
      preferredStart: string;
      preferredEnd?: string | null;
    };

    const { error } = await supabaseAdmin.from("interview_requests").insert({
      course_id: body.courseId,
      prof_id: body.profId,
      student_id: user.id,
      title: body.title,
      agenda: body.agenda,
      preferred_start: body.preferredStart,
      preferred_end: body.preferredEnd ?? null,
      status: "pending",
    });

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message.includes("interview_requests")
              ? "Calendar tables are not set up yet. Please create the calendar SQL tables first."
              : error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to request interview" },
      { status: 500 }
    );
  }
}
