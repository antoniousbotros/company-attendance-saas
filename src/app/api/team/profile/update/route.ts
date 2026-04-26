import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getTeamSession } from "../../_helpers";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getTeamSession(req);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const formData = await req.formData();
    const birthDate = formData.get("birth_date") as string;
    const image = formData.get("avatar") as File;

    let updateData: any = {};

    if (birthDate) {
      updateData.birth_date = birthDate;
    }

    if (image) {
      if (!image.type.startsWith("image/")) {
        return NextResponse.json({ ok: false, error: "File must be an image" }, { status: 400 });
      }
      if (image.size > 2 * 1024 * 1024) {
        return NextResponse.json({ ok: false, error: "Image must be under 2MB" }, { status: 400 });
      }

      const ext = image.name.split(".").pop() || "jpg";
      const filePath = `${session.company_id}/avatars/${session.employee_id}.${ext}`;
      const buffer = Buffer.from(await image.arrayBuffer());

      // Use 'task-attachments' bucket with 'avatars' folder to reuse existing bucket
      const { error: uploadError } = await supabaseAdmin.storage
        .from("task-attachments")
        .upload(filePath, buffer, {
          contentType: image.type,
          upsert: true,
        });

      if (uploadError) {
        console.error("Avatar upload error:", uploadError);
        return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 500 });
      }

      const { data: urlData } = supabaseAdmin.storage
        .from("task-attachments")
        .getPublicUrl(filePath);

      updateData.avatar_url = urlData.publicUrl;
    }

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("employees")
        .update(updateData)
        .eq("id", session.employee_id)
        .eq("company_id", session.company_id);

      if (updateError) {
        console.error("Profile update error:", updateError);
        return NextResponse.json({ ok: false, error: "Update failed" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Profile update catch error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
