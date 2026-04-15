import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { matchPhone } from "../../_helpers";

export const dynamic = "force-dynamic";

// Returns the auth mode for the company this employee belongs to.
// Used by the login page to decide which second step to show.
export async function POST(req: NextRequest) {
  try {
    const { phone, company_id } = await req.json();
    if (!phone) return NextResponse.json({ ok: false, error: "Phone required" }, { status: 400 });

    const last9 = matchPhone(phone);

    let query = supabaseAdmin
      .from("employees")
      .select("id, company_id, companies(id, name, auth_mode)")
      .ilike("phone", `%${last9}`);

    if (company_id) query = query.eq("company_id", company_id);

    const { data: employees } = await query;

    if (!employees || employees.length === 0) {
      // Don't reveal whether the phone exists — return telegram mode as default
      return NextResponse.json({ ok: true, mode: "telegram" });
    }

    // Multiple companies
    if (employees.length > 1 && !company_id) {
      const companies = employees.map((e) => ({
        company_id: e.company_id,
        company_name: (e.companies as any)?.name || "Unknown",
      }));
      return NextResponse.json({ ok: true, mode: "select_company", companies });
    }

    const emp = employees[0];
    const mode = (emp.companies as any)?.auth_mode || "telegram";

    return NextResponse.json({ ok: true, mode });
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong" }, { status: 500 });
  }
}
