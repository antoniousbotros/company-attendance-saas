import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getTeamSession } from "../../_helpers";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const session = await getTeamSession(req);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const { task_id, title, deadline } = await req.json();
    if (!task_id || !title?.trim()) {
      return NextResponse.json({ ok: false, error: "task_id and title required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("tasks")
      .update({ title: title.trim(), deadline: deadline || null })
      .eq("id", task_id)
      .eq("company_id", session.company_id)
      .or(`assigned_to.eq.${session.employee_id},assigned_by.eq.${session.employee_id}`);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
