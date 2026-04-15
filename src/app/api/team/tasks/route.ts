import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getTeamSession } from "../_helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getTeamSession(req);
    if (!session) return NextResponse.json({ ok: false }, { status: 401 });

    const all = req.nextUrl.searchParams.get("all") === "true";

    // Default window: last 30 days. ?all=true loads everything.
    const since = all
      ? null
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // ── Tasks assigned TO me ────────────────────────────────────────────────
    let myTasksQuery = supabaseAdmin
      .from("tasks")
      .select("id, title, description, status, deadline, created_at, completed_at, assigned_by, assigned_to")
      .eq("assigned_to", session.employee_id)
      .eq("company_id", session.company_id)
      .order("created_at", { ascending: false });

    if (since) {
      // Always show pending/in-progress regardless of age; limit completed to window
      myTasksQuery = myTasksQuery.or(`status.neq.done,created_at.gte.${since}`);
    }

    const { data: myTasks } = await myTasksQuery;

    // ── Tasks I assigned to others ─────────────────────────────────────────
    let assignedByMeQuery = supabaseAdmin
      .from("tasks")
      .select("id, title, description, status, deadline, created_at, completed_at, assigned_by, assigned_to")
      .eq("assigned_by", session.employee_id)
      .eq(  "company_id", session.company_id)
      .neq("assigned_to", session.employee_id) // exclude self-tasks (already in myTasks)
      .order("created_at", { ascending: false });

    if (since) {
      assignedByMeQuery = assignedByMeQuery.or(`status.neq.done,created_at.gte.${since}`);
    }

    const { data: assignedByMe } = await assignedByMeQuery;

    // ── Check whether there are older tasks (for "Load older" button) ──────
    let hasOlder = false;
    if (since) {
      const { count } = await supabaseAdmin
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("company_id", session.company_id)
        .or(`assigned_to.eq.${session.employee_id},assigned_by.eq.${session.employee_id}`)
        .lt("created_at", since);
      hasOlder = (count ?? 0) > 0;
    }

    // ── Name resolution ────────────────────────────────────────────────────
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
        is_self: t.assigned_by === t.assigned_to,
      }));

    return NextResponse.json({
      ok: true,
      tasks: enrich(myTasks || []),
      assigned_by_me: enrich(assignedByMe || []),
      has_older: hasOlder,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
