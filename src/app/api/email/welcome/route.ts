import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Connect to EmailIT using the provided API Key
    const apiKey = process.env.EMAILIT_API_KEY || "secret_5l5tfJjjzd9DVC6AGNsXk1mNaFy7dpu3";
    
    // We send the welcome payload
    const response = await fetch("https://api.emailit.com/v1/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: "welcome@yawmy.app",
        to: email,
        subject: `أهلاً بك في يومي يا ${name || 'صديقي'}! 🎉`,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 16px; border: 1px solid #eee;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #111; margin: 0;">Yawmy يومي</h1>
            </div>
            
            <h2 style="color: #111; font-size: 24px;">أهلاً بك في يومي! 🚀</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              نحن سعداء جداً بانضمامك. يومي هو الحل الأسهل والأذكى لإدارة حضور ورواتب فريقك عبر تليجرام، بدون أجهزة وبدون تعقيدات.
            </p>
            
            <div style="background: #fff1e8; border-right: 4px solid #ff5a00; padding: 20px; margin: 30px 0; border-radius: 8px;">
              <p style="color: #e04f00; margin: 0; font-weight: bold; font-size: 15px;">
                خطوتك التالية: قم بإنشاء شركتك، أضف الأقسام، وشارك رابط البوت مع موظفيك لتبدأ تسجيل الحضور فوراً!
              </p>
            </div>
            
            <a href="https://yawmy.app/login" style="display: inline-block; background: #ff5a00; color: #fff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
              الدخول لإنشاء شركتك الآن
            </a>
            
            <p style="color: #9ca3af; font-size: 12px; margin-top: 40px; text-align: center;">
              إذا لم تقم بالتسجيل في هذه الخدمة، يمكنك تجاهل هذا البريد.
              <br>© 2026 Yawmy Platform
            </p>
          </div>
        `
      })
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("EmailIt API Error:", result);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Welcome Email Logic Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
