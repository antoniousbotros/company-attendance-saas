import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    // Ideally validate this against an Environment Variable
    // Using a hardcoded fallback for setup purposes
    const GOD_PASSWORD = process.env.SADMIN_PASSWORD || "GodMode2026!";

    if (password === GOD_PASSWORD) {
      const res = NextResponse.json({ ok: true });
      // Set an HTTP-only secure cookie for Sadmin session
      res.cookies.set("sadmin_session", "authorized", {
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
