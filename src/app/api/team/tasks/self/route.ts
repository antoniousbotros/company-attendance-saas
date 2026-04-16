import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getTeamSession } from "../../_helpers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getTeamSession(req);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const { title, deadline, link } = await req.json();
    if (!title?.trim()) {
      return NextResponse.json({ ok: false, error: "Title required" }, { status: 400 });
    }

    const { data: task, error } = await supabaseAdmin
      .from("tasks")
      .insert({
        company_id: session.company_id,
        assigned_by: session.employee_id,
        assigned_to: session.employee_id,
        title: title.trim(),
        deadline: deadline || null,
        link: link || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, task_id: task?.id });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
