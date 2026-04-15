import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateToken, matchPhone } from "../../_helpers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { phone, code, company_id } = await req.json();
    if (!phone || !code) {
      return NextResponse.json({ ok: false, error: "Phone and code required" }, { status: 400 });
    }

    const last9 = matchPhone(phone);

    // Find employee
    let query = supabaseAdmin
      .from("employees")
      .select("id, company_id")
      .ilike("phone", `%${last9}`);

    if (company_id) {
      query = query.eq("company_id", company_id);
    }

    const { data: employees } = await query;
    const employee = employees?.[0];

    if (!employee) {
      return NextResponse.json({ ok: false, error: "Invalid code" }, { status: 401 });
    }

    // Verify OTP
    const { data: otp } = await supabaseAdmin
      .from("employee_otp")
      .select("id")
      .eq("employee_id", employee.id)
      .eq("code", code)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!otp) {
      return NextResponse.json({ ok: false, error: "Invalid or expired code" }, { status: 401 });
    }

    // Mark OTP as used
    await supabaseAdmin.from("employee_otp").update({ used: true }).eq("id", otp.id);

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
