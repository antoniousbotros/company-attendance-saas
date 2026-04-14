import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { Telegraf } from "telegraf";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company_id, created_by, title, message, target_type, targets, expire_at } = body;

    if (!company_id || !title || !message || !target_type || !expire_at) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Create the Announcement record
    const { data: announcement, error: insertError } = await supabaseAdmin
      .from("announcements")
      .insert({
        company_id,
        title,
        message,
        target_type,
        expire_at,
        created_by: created_by || null,
        is_active: true
      })
      .select("id")
      .single();

    if (insertError || !announcement) {
       console.error("Announcement DB Error:", insertError);
       return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
    }

    // 2. Fetch the Company Bot Language
    const { data: company } = await supabaseAdmin.from("companies").select("bot_language").eq("id", company_id).single();
    const lang = company?.bot_language || 'en';

    // 3. Resolve target users and build target relation inserts
    let targetRows: any[] = [];
    let telegramIdsToNotify: bigint[] = [];

    if (target_type === "all") {
       const { data: emps } = await supabaseAdmin.from("employees").select("id, telegram_user_id").eq("company_id", company_id);
       if (emps) {
          telegramIdsToNotify = emps.map(e => e.telegram_user_id).filter(id => id !== null);
       }
    } else if (target_type === "department") {
       // 'targets' is an array of department strings
       for (const deptString of targets) {
          targetRows.push({ announcement_id: announcement.id, department: deptString });
          const { data: emps } = await supabaseAdmin.from("employees").select("telegram_user_id").eq("company_id", company_id).eq("department", deptString);
          if (emps) {
             telegramIdsToNotify.push(...emps.map(e => e.telegram_user_id).filter(id => id !== null));
          }
       }
    } else if (target_type === "specific") {
       // 'targets' is an array of employee UUIDs
       for (const empUuid of targets) {
          targetRows.push({ announcement_id: announcement.id, employee_id: empUuid });
          const { data: emp } = await supabaseAdmin.from("employees").select("telegram_user_id").eq("id", empUuid).single();
          if (emp && emp.telegram_user_id) {
             telegramIdsToNotify.push(emp.telegram_user_id);
          }
       }
    }

    // Insert relational targets
    if (targetRows.length > 0) {
       await supabaseAdmin.from("announcement_targets").insert(targetRows);
    }

    // 4. Fire Telegram Messages Async without blocking the response!
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (token && telegramIdsToNotify.length > 0) {
       const bot = new Telegraf(token);
       const alertMsg = lang === 'ar'
         ? `📢 <b>إعلان جديد!</b>\n\n<b>${title}</b>\n\n${message}`
         : `📢 <b>New Announcement!</b>\n\n<b>${title}</b>\n\n${message}`;

       // De-duplicate array
       const uniqueIds = Array.from(new Set(telegramIdsToNotify));

       // Fire and forget mechanism to avoid Vercel timeouts for large arrays
       Promise.allSettled(
         uniqueIds.map(tid => 
            bot.telegram.sendMessage(tid.toString(), alertMsg, { parse_mode: "HTML" })
         )
       ).catch(console.error);
    }

    return NextResponse.json({ success: true, id: announcement.id, total_notified: telegramIdsToNotify.length });

  } catch (err: any) {
    console.error("API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
