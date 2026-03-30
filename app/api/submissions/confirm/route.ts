import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { submissionId, overrideScore, notes } = await req.json();
    if (!submissionId) {
      return NextResponse.json({ error: "submissionId required" }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {
      status: "grade_confirmed",
      professor_notes: notes ?? null,
    };

    if (overrideScore !== undefined && overrideScore !== null && overrideScore !== "") {
      updatePayload.professor_score = Number(overrideScore);
    }

    const { data, error } = await supabaseAdmin
      .from("submissions")
      .update(updatePayload)
      .eq("id", submissionId)
      .select("id, status, professor_score, professor_notes")
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ submission: data });
  } catch (err) {
    console.error("[confirm]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Confirmation failed" },
      { status: 500 }
    );
  }
}
