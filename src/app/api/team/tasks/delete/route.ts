import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getTeamSession } from "../../_helpers";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest) {
  const session = await getTeamSession(req);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const { task_id } = await req.json();
    if (!task_id) return NextResponse.json({ ok: false, error: "task_id required" }, { status: 400 });

    // Only allow deleting tasks assigned to this employee (personal or assigned)
    const { error } = await supabaseAdmin
      .from("tasks")
      .delete()
      .eq("id", task_id)
      .eq("company_id", session.company_id)
      .or(`assigned_to.eq.${session.employee_id},assigned_by.eq.${session.employee_id}`);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
