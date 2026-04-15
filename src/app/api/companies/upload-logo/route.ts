import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Auth check via Supabase session
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return req.cookies.get(name)?.value; },
          set() {},
          remove() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!company) {
      return NextResponse.json({ ok: false, error: "Company not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("logo") as File;

    if (!file) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ ok: false, error: "File must be an image" }, { status: 400 });
    }

    // Max 2MB
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "File must be under 2MB" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "png";
    const filePath = `${company.id}/logo.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("company-logos")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ ok: false, error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("company-logos")
      .getPublicUrl(filePath);

    const logoUrl = urlData.publicUrl;

    // Update company record
    await supabaseAdmin
      .from("companies")
      .update({ logo_url: logoUrl })
      .eq("id", company.id);

    return NextResponse.json({ ok: true, logo_url: logoUrl });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
