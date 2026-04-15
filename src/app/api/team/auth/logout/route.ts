import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("team_session")?.value;
  if (token) {
    await supabaseAdmin.from("employee_sessions").delete().eq("token", token);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("team_session", "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
