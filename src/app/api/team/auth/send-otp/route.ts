import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateOTP, matchPhone } from "../../_helpers";
import { Telegraf } from "telegraf";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { phone, company_id } = await req.json();
    if (!phone) {
      return NextResponse.json({ ok: false, error: "Phone required" }, { status: 400 });
    }

    const last9 = matchPhone(phone);

    // Find employees matching this phone
    let query = supabaseAdmin
      .from("employees")
      .select("id, name, company_id, telegram_user_id, companies(id, name, telegram_token)")
      .ilike("phone", `%${last9}`);

    if (company_id) {
      query = query.eq("company_id", company_id);
    }

    const { data: employees, error } = await query;

    if (error || !employees || employees.length === 0) {
      // Don't reveal if phone exists or not
      return NextResponse.json({ ok: true, step: "otp_sent" });
    }

    // Multiple companies — return list for selection
    if (employees.length > 1 && !company_id) {
      const companies = employees.map((e) => ({
        company_id: e.company_id,
        company_name: (e.companies as any)?.name || "Unknown",
      }));
      return NextResponse.json({ ok: true, step: "select_company", companies });
    }

    const employee = employees[0];

    if (!employee.telegram_user_id) {
      return NextResponse.json(
        { ok: false, error: "Please link your Telegram account first via the bot" },
        { status: 400 }
      );
    }

    // Generate and store OTP
    const code = generateOTP();
    const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error: otpError } = await supabaseAdmin.from("employee_otp").insert({
      employee_id: employee.id,
      company_id: employee.company_id,
      code,
      expires_at,
    });
    if (otpError) {
      console.error("OTP insert error:", otpError.message);
      return NextResponse.json({ ok: false, error: "Failed to generate code. Please try again." }, { status: 500 });
    }

    // Send OTP via Telegram
    const token = (employee.companies as any)?.telegram_token || process.env.TELEGRAM_BOT_TOKEN;
    if (token) {
      const bot = new Telegraf(token);
      await bot.telegram.sendMessage(
        employee.telegram_user_id.toString(),
        `🔐 Your login code: <b>${code}</b>\n\nThis code expires in 5 minutes. Do not share it.`,
        { parse_mode: "HTML" }
      );
    }

    return NextResponse.json({ ok: true, step: "otp_sent" });
  } catch (e: unknown) {
    console.error("send-otp error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "Something went wrong" }, { status: 500 });
  }
}
