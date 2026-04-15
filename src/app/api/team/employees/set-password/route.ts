import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { hashPassword } from "../../_helpers";

export const dynamic = "force-dynamic";

// Called by the owner dashboard to set/reset an employee's login password.
export async function POST(req: NextRequest) {
  try {
    const { employee_id, password } = await req.json();
    if (!employee_id || !password?.trim()) {
      return NextResponse.json({ ok: false, error: "employee_id and password required" }, { status: 400 });
    }

    const hashed = hashPassword(password.trim());

    const { error } = await supabaseAdmin
      .from("employees")
      .update({ login_password: hashed })
      .eq("id", employee_id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to set password" }, { status: 500 });
  }
}
