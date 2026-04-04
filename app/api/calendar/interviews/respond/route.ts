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
      interviewId: string;
      status: "approved" | "declined";
      responseNote?: string | null;
    };

    const { error } = await supabaseAdmin
      .from("interview_requests")
      .update({
        status: body.status,
        response_note: body.responseNote ?? null,
      })
      .eq("id", body.interviewId)
      .eq("prof_id", user.id);

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
      { error: error instanceof Error ? error.message : "Failed to respond to interview request" },
      { status: 500 }
    );
  }
}
