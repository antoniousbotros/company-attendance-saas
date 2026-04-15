import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, code, new_password } = await req.json();
    if (!email || !code || !new_password) {
      return NextResponse.json({ ok: false, error: "All fields required" }, { status: 400 });
    }
    if (new_password.length < 8) {
      return NextResponse.json({ ok: false, error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Verify OTP
    const { data: otp } = await supabaseAdmin
      .from("owner_otp")
      .select("id")
      .eq("email", email.toLowerCase())
      .eq("code", code)
      .eq("purpose", "reset_password")
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!otp) {
      return NextResponse.json({ ok: false, error: "Invalid or expired code" }, { status: 401 });
    }

    // Mark OTP used
    await supabaseAdmin.from("owner_otp").update({ used: true }).eq("id", otp.id);

    // Find user
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) return NextResponse.json({ ok: false, error: "Account not found" }, { status: 404 });

    // Update password
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: new_password });
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong" }, { status: 500 });
  }
}
