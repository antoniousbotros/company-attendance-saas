import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

function signToken(secret: string): string {
  const payload = `sadmin:${Date.now()}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64")}.${sig}`;
}

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!process.env.SADMIN_PASSWORD) {
      console.error("CRITICAL: SADMIN_PASSWORD environment variable is not set!");
      return NextResponse.json({ ok: false, error: "System misconfiguration" }, { status: 500 });
    }

    if (password === process.env.SADMIN_PASSWORD) {
      const secret = process.env.SADMIN_PASSWORD;
      const sessionToken = signToken(secret);

      const res = NextResponse.json({ ok: true });
      res.cookies.set("sadmin_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
      });
      return res;
    }

    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
