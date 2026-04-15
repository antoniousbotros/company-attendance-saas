import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getTeamSession } from "../_helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getTeamSession(req);
    if (!session) return NextResponse.json({ ok: false }, { status: 401 });

    // Tasks assigned TO me (active)
    const { data: myTasks } = await supabaseAdmin
      .from("tasks")
      .select("id, title, description, status, deadline, created_at, completed_at, assigned_by, assigned_to")
      .eq("assigned_to", session.employee_id)
      .eq("company_id", session.company_id)
      .order("created_at", { ascending: false });

    // Tasks I assigned to others
    const { data: assignedByMe } = await supabaseAdmin
      .from("tasks")
      .select("id, title, description, status, deadline, created_at, completed_at, assigned_by, assigned_to")
      .eq("assigned_by", session.employee_id)
      .eq("company_id", session.company_id)
      .order("created_at", { ascending: false });

    // Collect all employee IDs for name resolution
    const allTasks = [...(myTasks || []), ...(assignedByMe || [])];
    const employeeIds = [...new Set(allTasks.flatMap((t) => [t.assigned_by, t.assigned_to]).filter(Boolean))];

    let nameMap: Record<string, string> = {};
    if (employeeIds.length > 0) {
      const { data: employees } = await supabaseAdmin
        .from("employees")
        .select("id, name")
        .eq("company_id", session.company_id)
        .in("id", employeeIds);
      nameMap = Object.fromEntries((employees || []).map((e) => [e.id, e.name]));
    }

    const enrich = (tasks: any[]) =>
      tasks.map((t) => ({
        ...t,
        assigned_by_name: nameMap[t.assigned_by] || "Unknown",
        assigned_to_name: nameMap[t.assigned_to] || "Unknown",
      }));

    return NextResponse.json({
      ok: true,
      tasks: enrich(myTasks || []),
      assigned_by_me: enrich(assignedByMe || []),
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
