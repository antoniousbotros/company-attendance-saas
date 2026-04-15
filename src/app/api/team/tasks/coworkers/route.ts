import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getTeamSession } from "../../_helpers";

export async function GET(req: NextRequest) {
  try {
    const session = await getTeamSession(req);
    if (!session) return NextResponse.json({ ok: false }, { status: 401 });

    const { data } = await supabaseAdmin
      .from("employees")
      .select("id, name, department")
      .eq("company_id", session.company_id)
      .neq("id", session.employee_id)
      .order("name");

    return NextResponse.json({ ok: true, employees: data || [] });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
