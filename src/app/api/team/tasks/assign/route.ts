import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getTeamSession } from "../../_helpers";
import { Telegraf } from "telegraf";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getTeamSession(req);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const { assigned_to, title, deadline } = await req.json();
    if (!assigned_to || !title) {
      return NextResponse.json({ ok: false, error: "Title and assignee required" }, { status: 400 });
    }

    // Verify assignee is in same company and get their telegram_user_id
    const { data: assignee } = await supabaseAdmin
      .from("employees")
      .select("id, company_id, telegram_user_id")
      .eq("id", assigned_to)
      .eq("company_id", session.company_id)
      .single();

    if (!assignee) {
      return NextResponse.json({ ok: false, error: "Invalid assignee" }, { status: 400 });
    }

    const { data: task, error } = await supabaseAdmin.from("tasks").insert({
      company_id: session.company_id,
      assigned_by: session.employee_id,
      assigned_to,
      title,
      deadline: deadline || null,
      status: "pending",
    }).select("id").single();

    if (error) throw error;

    // Notify assignee via Telegram
    if (assignee.telegram_user_id) {
      const [assignerRes, companyRes] = await Promise.all([
        supabaseAdmin.from("employees").select("name").eq("id", session.employee_id).single(),
        supabaseAdmin.from("companies").select("telegram_token, bot_language").eq("id", session.company_id).single(),
      ]);

      const assignerName = assignerRes.data?.name || "Someone";
      const token = companyRes.data?.telegram_token || process.env.TELEGRAM_BOT_TOKEN;
      const lang = companyRes.data?.bot_language || "en";

      if (token) {
        const bot = new Telegraf(token);
        const deadlineStr = deadline ? `\n📅 ${deadline}` : "";
        const msg = lang === "ar"
          ? `📌 <b>مهمة جديدة!</b>\n\nمن: ${assignerName}\nالمهمة: <b>${title}</b>${deadlineStr}`
          : `📌 <b>New Task Assigned!</b>\n\nFrom: ${assignerName}\nTask: <b>${title}</b>${deadlineStr}`;

        bot.telegram.sendMessage(assignee.telegram_user_id.toString(), msg, { parse_mode: "HTML" }).catch(console.error);
      }
    }

    return NextResponse.json({ ok: true, task_id: task?.id });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
