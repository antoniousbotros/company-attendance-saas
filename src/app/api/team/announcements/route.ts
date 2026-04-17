import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getTeamSession } from "../_helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getTeamSession(req);
    if (!session) return NextResponse.json({ ok: false }, { status: 401 });

    const { data: employee } = await supabaseAdmin
      .from("employees")
      .select("department")
      .eq("id", session.employee_id)
      .eq("company_id", session.company_id)
      .single();

    const { data: announcements } = await supabaseAdmin
      .from("announcements")
      .select("id, title, message, target_type, expire_at, created_at")
      .eq("company_id", session.company_id)
      .eq("is_active", true)
      .gt("expire_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    const currentMonth = new Date().getMonth() + 1;
    const { data: allEmployees } = await supabaseAdmin
      .from("employees")
      .select("id, name, department, birth_date")
      .eq("company_id", session.company_id)
      .not("birth_date", "is", null);

    const birthdays = (allEmployees || []).filter(e => {
      if (!e.birth_date) return false;
      const d = new Date(e.birth_date);
      return (d.getMonth() + 1) === currentMonth;
    }).sort((a, b) => new Date(a.birth_date).getDate() - new Date(b.birth_date).getDate());

    const visible: typeof announcements = [];
    for (const ann of announcements || []) {
      if (ann.target_type === "all") {
        visible.push(ann);
        continue;
      }

      const { data: targets } = await supabaseAdmin
        .from("announcement_targets")
        .select("employee_id, department")
        .eq("announcement_id", ann.id);

      if (ann.target_type === "specific") {
        if (targets?.some((t) => t.employee_id === session.employee_id)) {
          visible.push(ann);
        }
      } else if (ann.target_type === "department") {
        if (targets?.some((t) => t.department === employee?.department)) {
          visible.push(ann);
        }
      }
    }

    return NextResponse.json({ ok: true, announcements: visible, birthdays });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
