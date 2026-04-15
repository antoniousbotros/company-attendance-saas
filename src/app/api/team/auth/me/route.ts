import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getTeamSession } from "../../_helpers";

export async function GET(req: NextRequest) {
  try {
    const session = await getTeamSession(req);
    if (!session) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: employee } = await supabaseAdmin
      .from("employees")
      .select("id, name, phone, department, company_id, companies(name, enable_geofencing, office_lat, office_lng, office_radius, work_start_time, late_threshold, sales_tracking_enabled, bot_language)")
      .eq("id", session.employee_id)
      .eq("company_id", session.company_id)
      .single();

    if (!employee) {
      return NextResponse.json({ ok: false, error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, employee });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
