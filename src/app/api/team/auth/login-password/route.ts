import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { hashPassword, matchPhone, generateToken } from "../../_helpers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { phone, password, company_id } = await req.json();
    if (!phone || !password) {
      return NextResponse.json({ ok: false, error: "Phone and password required" }, { status: 400 });
    }

    const last9 = matchPhone(phone);

    let query = supabaseAdmin
      .from("employees")
      .select("id, company_id, login_password, companies(auth_mode)")
      .ilike("phone", `%${last9}`);

    if (company_id) query = query.eq("company_id", company_id);

    const { data: employees } = await query;
    const employee = employees?.[0];

    if (!employee) {
      return NextResponse.json({ ok: false, error: "Invalid phone or password" }, { status: 401 });
    }

    // Ensure company is in password mode
    const mode = (employee.companies as any)?.auth_mode;
    if (mode !== "password") {
      return NextResponse.json({ ok: false, error: "This company uses Telegram login" }, { status: 400 });
    }

    // Check password
    if (!employee.login_password || employee.login_password !== hashPassword(password)) {
      return NextResponse.json({ ok: false, error: "Invalid phone or password" }, { status: 401 });
    }

    // Create session
    const token = generateToken();
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await supabaseAdmin.from("employee_sessions").insert({
      employee_id: employee.id,
      company_id: employee.company_id,
      token,
      expires_at,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set("team_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong" }, { status: 500 });
  }
}
