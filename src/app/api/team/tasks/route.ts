import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getTeamSession } from "../_helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getTeamSession(req);
    if (!session) return NextResponse.json({ ok: false }, { status: 401 });

    const { data: tasks } = await supabaseAdmin
      .from("tasks")
      .select("id, title, description, status, deadline, created_at, completed_at, assigned_by, assigned_to")
      .eq("assigned_to", session.employee_id)
      .eq("company_id", session.company_id)
      .in("status", ["pending", "in_progress", "late"])
      .order("created_at", { ascending: false });

    // Get assigner names scoped to same company
    const assignerIds = [...new Set((tasks || []).map((t) => t.assigned_by).filter(Boolean))];
    let assignerMap: Record<string, string> = {};
    if (assignerIds.length > 0) {
      const { data: assigners } = await supabaseAdmin
        .from("employees")
        .select("id, name")
        .eq("company_id", session.company_id)
        .in("id", assignerIds);
      assignerMap = Object.fromEntries((assigners || []).map((a) => [a.id, a.name]));
    }

    const enriched = (tasks || []).map((t) => ({
      ...t,
      assigned_by_name: assignerMap[t.assigned_by] || "Unknown",
    }));

    return NextResponse.json({ ok: true, tasks: enriched });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
