import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const BUCKET = "profile-avatars";
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please choose an image file." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, and WEBP images are supported." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image is too large. Please upload a file under 5 MB." },
        { status: 400 }
      );
    }

    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some((bucket) => bucket.name === BUCKET);

    if (!bucketExists) {
      const { error: bucketError } = await supabaseAdmin.storage.createBucket(BUCKET, {
        public: true,
      });

      if (bucketError && !bucketError.message.toLowerCase().includes("already exists")) {
        throw bucketError;
      }
    }

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filePath = `${user.id}/${Date.now()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath);

    return NextResponse.json({
      avatarUrl: publicUrlData.publicUrl,
      filePath,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload profile photo.",
      },
      { status: 500 }
    );
  }
}
