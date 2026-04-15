import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getTeamSession } from "../../_helpers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getTeamSession(req);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const { team_id, location_lat, location_lng, field_values, notes } = await req.json();

    if (!team_id) {
      return NextResponse.json({ ok: false, error: "Team required" }, { status: 400 });
    }

    // Validate team belongs to employee's company
    const { data: team } = await supabaseAdmin
      .from("teams")
      .select("id")
      .eq("id", team_id)
      .eq("company_id", session.company_id)
      .single();

    if (!team) {
      return NextResponse.json({ ok: false, error: "Invalid team" }, { status: 403 });
    }

    // Validate field_ids belong to this team
    if (field_values && Array.isArray(field_values) && field_values.length > 0) {
      const fieldIds = field_values.map((fv: any) => fv.field_id).filter(Boolean);
      if (fieldIds.length > 0) {
        const { data: validFields } = await supabaseAdmin
          .from("custom_fields")
          .select("id")
          .eq("team_id", team_id)
          .in("id", fieldIds);
        const validIds = new Set((validFields || []).map((f) => f.id));
        const hasInvalid = fieldIds.some((id: string) => !validIds.has(id));
        if (hasInvalid) {
          return NextResponse.json({ ok: false, error: "Invalid field" }, { status: 400 });
        }
      }
    }

    const today = new Date().toISOString().split("T")[0];

    const { data: report, error: reportErr } = await supabaseAdmin
      .from("reports")
      .insert({
        company_id: session.company_id,
        team_id,
        employee_id: session.employee_id,
        date: today,
        location_lat: location_lat || null,
        location_lng: location_lng || null,
        notes: notes || null,
        status: "completed",
      })
      .select("id")
      .single();

    if (reportErr) throw reportErr;

    if (report && field_values && Array.isArray(field_values)) {
      const rows = field_values
        .filter((fv: any) => fv.field_id && fv.value !== undefined)
        .map((fv: any) => ({
          report_id: report.id,
          field_id: fv.field_id,
          value: String(fv.value),
        }));

      if (rows.length > 0) {
        await supabaseAdmin.from("report_values").insert(rows);
      }
    }

    return NextResponse.json({ ok: true, report_id: report?.id });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
