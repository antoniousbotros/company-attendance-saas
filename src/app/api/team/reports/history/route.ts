import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getTeamSession } from "../../_helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getTeamSession(req);
    if (!session) return NextResponse.json({ ok: false }, { status: 401 });

    // My reports with field values
    const { data: reports } = await supabaseAdmin
      .from("reports")
      .select("id, date, location_lat, location_lng, notes, status, created_at, report_values(field_id, value)")
      .eq("employee_id", session.employee_id)
      .eq("company_id", session.company_id)
      .eq("status", "completed")
      .order("date", { ascending: false })
      .limit(50);

    // Get field labels for this employee's team
    const { data: membership } = await supabaseAdmin
      .from("team_members")
      .select("team_id")
      .eq("employee_id", session.employee_id)
      .limit(1)
      .single();

    let fields: any[] = [];
    if (membership) {
      const { data: f } = await supabaseAdmin
        .from("custom_fields")
        .select("id, label, field_type")
        .eq("team_id", membership.team_id)
        .order("order_index", { ascending: true });
      fields = f || [];
    }

    // Check if user is a team leader
    let isLeader = false;
    let teamReports: any[] = [];
    if (membership) {
      const { data: memberInfo } = await supabaseAdmin
        .from("team_members")
        .select("role")
        .eq("employee_id", session.employee_id)
        .eq("team_id", membership.team_id)
        .single();

      isLeader = memberInfo?.role === "leader";

      if (isLeader) {
        const { data: tReports } = await supabaseAdmin
          .from("reports")
          .select("id, date, location_lat, location_lng, notes, status, created_at, employee_id, report_values(field_id, value)")
          .eq("team_id", membership.team_id)
          .eq("company_id", session.company_id)
          .eq("status", "completed")
          .order("date", { ascending: false })
          .limit(100);

        // Get employee names
        const empIds = [...new Set((tReports || []).map((r) => r.employee_id))];
        let empMap: Record<string, string> = {};
        if (empIds.length > 0) {
          const { data: emps } = await supabaseAdmin
            .from("employees")
            .select("id, name")
            .in("id", empIds);
          empMap = Object.fromEntries((emps || []).map((e) => [e.id, e.name]));
        }

        teamReports = (tReports || []).map((r) => ({
          ...r,
          employee_name: empMap[r.employee_id] || "Unknown",
        }));
      }
    }

    return NextResponse.json({
      ok: true,
      reports: reports || [],
      fields,
      isLeader,
      teamReports,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
