import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail, otpEmailHtml } from "@/lib/emailit";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Generates a 6-digit OTP, stores it, and sends it via Emailit.
// purpose: 'reset_password' | 'change_email'
// For change_email: pass new_email as well.
export async function POST(req: NextRequest) {
  try {
    const { email, purpose = "reset_password", new_email } = await req.json();
    if (!email) return NextResponse.json({ ok: false, error: "Email required" }, { status: 400 });

    // Verify the email belongs to an existing owner (for reset_password)
    if (purpose === "reset_password") {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (!user) {
        // Don't reveal whether the account exists — return ok anyway
        return NextResponse.json({ ok: true });
      }
    }

    // Invalidate any previous unused OTPs for this email+purpose
    await supabaseAdmin
      .from("owner_otp")
      .update({ used: true })
      .eq("email", email.toLowerCase())
      .eq("purpose", purpose)
      .eq("used", false);

    // Generate OTP
    const code = crypto.randomInt(100000, 999999).toString();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabaseAdmin.from("owner_otp").insert({
      email: email.toLowerCase(),
      code,
      purpose,
      new_email: new_email?.toLowerCase() || null,
      expires_at,
    });

    // Detect language from email domain (basic heuristic — default ar)
    const lang = "ar";
    const subject =
      purpose === "reset_password"
        ? lang === "ar" ? "رمز إعادة تعيين كلمة المرور - يومي" : "Password Reset Code — Yawmy"
        : lang === "ar" ? "رمز تغيير البريد الإلكتروني - يومي" : "Email Change Code — Yawmy";

    await sendEmail(
      purpose === "change_email" && new_email ? new_email : email,
      subject,
      otpEmailHtml(code, lang)
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong" }, { status: 500 });
  }
}
