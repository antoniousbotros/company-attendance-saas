import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getTeamSession } from "../../_helpers";

export async function GET(req: NextRequest) {
  try {
    const session = await getTeamSession(req);
    if (!session) return NextResponse.json({ ok: false }, { status: 401 });

    const { data: reports } = await supabaseAdmin
      .from("reports")
      .select("id, date, location_lat, location_lng, notes, status, created_at")
      .eq("employee_id", session.employee_id)
      .eq("company_id", session.company_id)
      .eq("status", "completed")
      .order("date", { ascending: false })
      .limit(30);

    return NextResponse.json({ ok: true, reports: reports || [] });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
