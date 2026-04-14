import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ ok: false, error: "Token is required" }, { status: 400 });
    }

    // Determine the host dynamically so it works in both dev (localhost) and prod (Vercel)
    const host = req.headers.get("host") || "company-attendance-saas.vercel.app";
    const protocol = host.includes("localhost") ? "http" : "https";
    
    // Construct the unique webhook URL for this specific bot
    const webhookUrl = `${protocol}://${host}/api/telegram/webhook?token=${token}`;

    // Call Telegram API to register the webhook
    const tgUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
    
    const res = await fetch(tgUrl);
    const data = await res.json();

    if (!data.ok) {
      console.error("Telegram API Error:", data.description);
      return NextResponse.json({ ok: false, error: data.description }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Webhook successfully registered", details: data });
  } catch (err: any) {
    console.error("Webhook Registration Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
