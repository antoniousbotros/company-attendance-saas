import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getTeamSession } from "../../_helpers";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const session = await getTeamSession(req);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const { task_id, action } = await req.json();
    if (!task_id || !["start", "done", "undo"].includes(action)) {
      return NextResponse.json({ ok: false, error: "Invalid params" }, { status: 400 });
    }

    // Get full task with assigner info
    const { data: task } = await supabaseAdmin
      .from("tasks")
      .select("id, title, assigned_to, assigned_by")
      .eq("id", task_id)
      .eq("assigned_to", session.employee_id)
      .eq("company_id", session.company_id)
      .single();

    if (!task) {
      return NextResponse.json({ ok: false, error: "Task not found" }, { status: 404 });
    }

    if (action === "start") {
      await supabaseAdmin.from("tasks").update({ status: "in_progress" }).eq("id", task_id);
    } else if (action === "undo") {
      await supabaseAdmin.from("tasks").update({ status: "pending", completed_at: null }).eq("id", task_id);
    } else {
      await supabaseAdmin
        .from("tasks")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", task_id);
    }

    // Notify assigner via Telegram (same as bot webhook does)
    if (task.assigned_by) {
      const [assignerRes, assigneeRes, companyRes] = await Promise.all([
        supabaseAdmin.from("employees").select("telegram_user_id").eq("id", task.assigned_by).single(),
        supabaseAdmin.from("employees").select("name").eq("id", session.employee_id).single(),
        supabaseAdmin.from("companies").select("telegram_token, bot_language").eq("id", session.company_id).single(),
      ]);

      const assignerTgId = assignerRes.data?.telegram_user_id;
      const assigneeName = assigneeRes.data?.name || "Someone";
      const token = companyRes.data?.telegram_token || process.env.TELEGRAM_BOT_TOKEN;
      const lang = companyRes.data?.bot_language || "en";

      if (assignerTgId && token) {
        const { Telegraf } = await import("telegraf");
        const bot = new Telegraf(token as string);
        const msg = action === "start"
          ? (lang === "ar"
            ? `⏳ ${assigneeName} بدأ العمل على: <b>${task.title}</b>`
            : `⏳ ${assigneeName} started working on: <b>${task.title}</b>`)
          : (lang === "ar"
            ? `✅ ${assigneeName} أنهى المهمة: <b>${task.title}</b>`
            : `✅ ${assigneeName} completed: <b>${task.title}</b>`);

        bot.telegram.sendMessage(assignerTgId.toString(), msg, { parse_mode: "HTML" }).catch(console.error);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
