import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getTeamSession } from "../../_helpers";

export async function GET(req: NextRequest) {
  try {
    const session = await getTeamSession(req);
    if (!session) return NextResponse.json({ ok: false }, { status: 401 });

    const { data: membership } = await supabaseAdmin
      .from("team_members")
      .select("team_id, role, teams(id, name, show_notes, require_notes)")
      .eq("employee_id", session.employee_id)
      .limit(1)
      .single();

    if (!membership) {
      return NextResponse.json({ ok: true, team: null, fields: [] });
    }

    // Verify team belongs to employee's company
    const { data: team } = await supabaseAdmin
      .from("teams")
      .select("id")
      .eq("id", membership.team_id)
      .eq("company_id", session.company_id)
      .single();

    if (!team) {
      return NextResponse.json({ ok: true, team: null, fields: [] });
    }

    const { data: fields } = await supabaseAdmin
      .from("custom_fields")
      .select("id, label, field_type, options, is_required, order_index")
      .eq("team_id", membership.team_id)
      .order("order_index", { ascending: true });

    return NextResponse.json({
      ok: true,
      team: membership.teams,
      fields: fields || [],
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
