import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getTeamSession } from "../../_helpers";

export async function GET(req: NextRequest) {
  try {
    const session = await getTeamSession(req);
    if (!session) return NextResponse.json({ ok: false }, { status: 401 });

    const { data: records } = await supabaseAdmin
      .from("attendance")
      .select("id, date, check_in, check_out, status, late_minutes, working_hours")
      .eq("employee_id", session.employee_id)
      .eq("company_id", session.company_id)
      .order("date", { ascending: false })
      .limit(30);

    return NextResponse.json({ ok: true, records: records || [] });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
