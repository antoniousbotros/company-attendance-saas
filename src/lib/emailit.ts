const EMAILIT_API_KEY = process.env.EMAILIT_API_KEY || "secret_5l5tfJjjzd9DVC6AGNsXk1mNaFy7dpu3";
const FROM = "noreply@yawmy.app";

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.emailit.com/v1/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${EMAILIT_API_KEY}`,
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function otpEmailHtml(code: string, lang: "ar" | "en" = "ar"): string {
  const isAr = lang === "ar";
  return `
    <div dir="${isAr ? "rtl" : "ltr"}" style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;padding:40px;border-radius:16px;border:1px solid #eee">
      <div style="text-align:center;margin-bottom:32px">
        <div style="display:inline-block;background:#ff5a00;color:#fff;font-weight:900;font-size:20px;padding:10px 22px;border-radius:12px;letter-spacing:1px">Yawmy</div>
      </div>
      <h2 style="color:#111;font-size:22px;margin:0 0 12px">${isAr ? "رمز التحقق الخاص بك" : "Your verification code"}</h2>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 32px">
        ${isAr ? "استخدم الرمز أدناه لإتمام عملية تغيير حسابك. صالح لمدة 10 دقائق." : "Use the code below to complete your account change. Valid for 10 minutes."}
      </p>
      <div style="background:#f9fafb;border:2px dashed #e5e7eb;border-radius:12px;padding:28px;text-align:center;margin-bottom:32px">
        <span style="font-size:42px;font-weight:900;letter-spacing:10px;color:#111;font-family:monospace">${code}</span>
      </div>
      <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0">
        ${isAr ? "إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة بأمان." : "If you didn't request this code, you can safely ignore this email."}
        <br>© 2026 Yawmy Platform
      </p>
    </div>
  `;
}
