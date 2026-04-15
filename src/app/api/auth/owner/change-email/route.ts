import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { current_email, code, new_email } = await req.json();
    if (!current_email || !code || !new_email) {
      return NextResponse.json({ ok: false, error: "All fields required" }, { status: 400 });
    }

    // Verify OTP (sent to new_email)
    const { data: otp } = await supabaseAdmin
      .from("owner_otp")
      .select("id, new_email")
      .eq("email", current_email.toLowerCase())
      .eq("code", code)
      .eq("purpose", "change_email")
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!otp || otp.new_email?.toLowerCase() !== new_email.toLowerCase()) {
      return NextResponse.json({ ok: false, error: "Invalid or expired code" }, { status: 401 });
    }

    // Mark OTP used
    await supabaseAdmin.from("owner_otp").update({ used: true }).eq("id", otp.id);

    // Find user
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const user = users.find((u) => u.email?.toLowerCase() === current_email.toLowerCase());
    if (!user) return NextResponse.json({ ok: false, error: "Account not found" }, { status: 404 });

    // Update email
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { email: new_email.toLowerCase() });
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong" }, { status: 500 });
  }
}
