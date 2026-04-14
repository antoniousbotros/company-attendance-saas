import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { Telegraf, Markup } from "telegraf";

export const dynamic = 'force-dynamic';

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const getMainMenu = (enableGeofencing: boolean, lang: string = 'en') => {
  if (lang === 'ar') {
    if (enableGeofencing) {
      return Markup.keyboard([
        [Markup.button.locationRequest("📍 إرسال الموقع")],
        ["📊 تقرير حضوري", "📝 مهامي"],
        ["📌 مهمة جديدة", "📢 التعميمات"],
        ["ℹ️ مساعدة"]
      ]).resize();
    }
    return Markup.keyboard([
      ["✅ تسجيل حضور", "🚪 تسجيل انصراف"],
      ["📊 تقرير حضوري", "📝 مهامي"],
      ["📌 مهمة جديدة", "📢 التعميمات"],
      ["ℹ️ مساعدة"]
    ]).resize();
  }

  if (enableGeofencing) {
    return Markup.keyboard([
      [Markup.button.locationRequest("📍 Send Location (Check In / Out)")],
      ["📊 My Attendance", "📝 My Tasks"],
      ["📌 New Task", "📢 Announcements"],
      ["ℹ️ Help"]
    ]).resize();
  }
  return Markup.keyboard([
    ["✅ Check In", "🚪 Check Out"],
    ["📊 My Attendance", "📝 My Tasks"],
    ["📌 New Task", "📢 Announcements"],
    ["ℹ️ Help"]
  ]).resize();
};

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      console.error("No token provided");
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const bot = new Telegraf(token);

    bot.start(async (ctx) => {
      const telegramUserId = ctx.from.id;
      const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", telegramUserId).single();

      if (employee) {
        const lang = (employee.companies as any).bot_language || 'en';
        const msg = lang === 'ar'
          ? `مرحباً بعودتك يا ${employee.name}! نحن سعداء بوجودك كفرد من عائلة ${employee.companies.name}.\n\nاستخدم الأزرار بالأسفل للتبديل بين خدمات يومي.`
          : `Welcome back, ${employee.name}! We are happy to have you as one of the ${employee.companies.name} family.\n\nUse the buttons below to log your status.`;
        return ctx.reply(msg, getMainMenu(employee.companies.enable_geofencing, lang));
      }

      return ctx.reply(
        "Welcome to the Attendance Bot (مرحباً بك)! To get started, please share your contact so we can link your account.",
        Markup.keyboard([Markup.button.contactRequest("📱 Share Contact (مشاركة جهة الاتصال)")]).oneTime().resize()
      );
    });

    bot.on("contact", async (ctx) => {
      const contact = ctx.message.contact;
      const telegramUserId = ctx.from.id;
      
      if (!contact || contact.user_id !== telegramUserId) {
        return ctx.reply("Please share YOUR OWN contact. (يرجى مشاركة جهة اتصالك أنت)");
      }

      const fullPhone = contact.phone_number.replace(/\D/g, "");
      const last9digits = fullPhone.slice(-9);

      const { data: employees, error } = await supabaseAdmin.from("employees").select("*, companies(*)").ilike("phone", `%${last9digits}`);
      const employee = employees?.[0];

      if (error || !employee) {
        return ctx.reply(`Sorry, your phone number (ending in ${last9digits}) is not registered in our system.\n\nPlease ask your administrator to add your phone number.`);
      }

      const lang = (employee.companies as any).bot_language || 'en';
      await supabaseAdmin.from("employees").update({ telegram_user_id: telegramUserId }).eq("id", employee.id);

      const successMsg = lang === 'ar'
        ? `تم بنجاح! حسابك الآن مربوط بـ ${employee.companies.name}.`
        : `Success! Your account is now linked to ${employee.companies.name}.`;
      return ctx.reply(successMsg, getMainMenu(employee.companies.enable_geofencing, lang));
    });

    const processAttendance = async (ctx: any, employee: any, explicitlyLocation: boolean = false) => {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const company = (employee.companies as any);
      const lang = company.bot_language || 'en';

      const { data: attendance } = await supabaseAdmin.from("attendance").select("*").eq("employee_id", employee.id).eq("date", today).single();

      if (!attendance || !attendance.check_in) {
        let isLate = false;
        let lateMins = 0;
        if (company.work_start_time) {
          const [startH, startM] = company.work_start_time.split(':').map(Number);
          const thresholdMin = employee.allowed_late_minutes !== null ? employee.allowed_late_minutes : (company.late_threshold || 15);
          const workStart = new Date(now);
          workStart.setHours(startH, startM, 0, 0); 
          if (now > workStart) {
            const diffMs = now.getTime() - workStart.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins > thresholdMin) { isLate = true; lateMins = diffMins; }
          }
        }
        
        const status = isLate ? "late" : "present";
        await supabaseAdmin.from("attendance").upsert({ employee_id: employee.id, company_id: employee.company_id, date: today, check_in: now.toISOString(), status: status, late_minutes: lateMins });
        
        const timeStr = now.toLocaleTimeString("en-US", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hour12: true });
        const inMsg = lang === 'ar' ? `✅ تم تسجيل الحضور الساعة ${timeStr}.${isLate ? `\n⚠️ لقد تأخرت ${lateMins} دقيقة.` : ""}` : `✅ Checked In at ${timeStr}.${isLate ? `\n⚠️ You are ${lateMins} minutes late.` : ""}`;
        return ctx.reply(inMsg);
      }

      if (!attendance.check_out) {
        const checkIn = new Date(attendance.check_in);
        const diffMs = now.getTime() - checkIn.getTime();
        const diffHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
        await supabaseAdmin.from("attendance").update({ check_out: now.toISOString(), working_hours: diffHours }).eq("id", attendance.id);
        const timeStr = now.toLocaleTimeString("en-US", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hour12: true });
        const outMsg = lang === 'ar' ? `🚪 تم تسجيل الانصراف الساعة ${timeStr}.\nإجمالي الساعات: ${diffHours}h` : `🚪 Checked Out at ${timeStr}.\nTotal hours: ${diffHours}h`;
        return ctx.reply(outMsg);
      }

      return ctx.reply(lang === 'ar' ? "لقد أتممت ورديتك اليوم بالفعل!" : "You have already completed your shift today!");
    };

    bot.on("location", async (ctx) => {
      const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", ctx.from.id).single();
      if (!employee) return;
      const company = (employee.companies as any);
      if (company.enable_geofencing) {
        if (!company.office_lat || !company.office_lng) return;
        const dist = getDistance(ctx.message.location.latitude, ctx.message.location.longitude, company.office_lat, company.office_lng);
        if (dist > (company.office_radius || 200)) {
           return ctx.reply(company.bot_language === 'ar' ? `❌ أنت تبعد ${Math.round(dist)} متراً.` : `❌ You are ${Math.round(dist)}m away.`);
        }
      }
      await processAttendance(ctx, employee, true);
    });

    bot.hears(["✅ Check In", "✅ تسجيل حضور", "🚪 Check Out", "🚪 تسجيل انصراف"], async (ctx) => {
      const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", ctx.from.id).single();
      if (!employee) return ctx.reply("Please /start and link your account first.");
      const lang = employee.companies.bot_language || 'en';
      if (employee.companies.enable_geofencing) {
        return ctx.reply(lang === 'ar' ? "⚠️ يرجى إرسال الموقع '📍 إرسال الموقع'." : "⚠️ Please use the '📍 Send Location' button.", getMainMenu(true, lang));
      }
      await processAttendance(ctx, employee);
    });

    bot.hears(["📊 My Attendance", "📊 تقرير حضوري"], async (ctx) => {
      const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", ctx.from.id).single();
      if (!employee) return;
      const lang = (employee.companies as any).bot_language || 'en';
      const { data: logs } = await supabaseAdmin.from("attendance").select("*").eq("employee_id", employee.id).order("date", { ascending: false }).limit(5);
      if (!logs || logs.length === 0) return ctx.reply(lang === 'ar' ? "لم نعثر على سجلات حضور." : "No attendance records found.");
      const fT = (iso: string|null) => iso ? new Date(iso).toLocaleTimeString("en-US", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hour12: false }) : " -   ";
      let table = lang === 'ar' ? "📅 <b>حضورك وانصرافك مؤخراً</b>\n\n<pre>تاريخ  |حالة |حضور |انصراف\n------+-----+----+-----\n" : "📅 <b>Your Recent Attendance</b>\n\n<pre>Date  |Status| In  | Out \n------+------+-----+-----\n";
      logs.forEach(log => table += `${`${new Date(log.date).getMonth()+1}`.padStart(2,"0")}/${`${new Date(log.date).getDate()}`.padStart(2,"0")} |${log.status.substring(0,4)} |${fT(log.check_in)}|${fT(log.check_out)}\n`);
      return ctx.replyWithHTML(table + "</pre>");
    });
    // ANNOUNCEMENTS HOOK
    bot.hears(["📢 Announcements", "📢 التعميمات"], async (ctx) => {
      const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", ctx.from.id).single();
      if (!employee) return;
      
      const lang = (employee.companies as any).bot_language || 'en';

      const { data: announcements, error } = await supabaseAdmin.from("announcements")
        .select(`*, announcement_targets(department, employee_id)`)
        .eq("company_id", employee.company_id)
        .eq("is_active", true);

      if (error || !announcements || announcements.length === 0) {
         return ctx.reply(lang === 'ar' ? "🎉 لا توجد تعميمات نشطة حالياً." : "🎉 No active announcements at the moment.");
      }

      const activeAnnouncements = announcements.filter(a => {
         if (new Date(a.expire_at) < new Date()) return false;
         if (a.target_type === 'all') return true;
         if (a.target_type === 'specific') {
             return a.announcement_targets.some((t: any) => t.employee_id === employee.id);
         }
         if (a.target_type === 'department') {
             return a.announcement_targets.some((t: any) => t.department === employee.department);
         }
         return false;
      });

      if (activeAnnouncements.length === 0) {
         return ctx.reply(lang === 'ar' ? "🎉 لا توجد تعميمات نشطة حالياً." : "🎉 No active announcements at the moment.");
      }

      await ctx.reply(lang === 'ar' ? `لديك ${activeAnnouncements.length} تعميمات نشطة:` : `You have ${activeAnnouncements.length} active announcements:`);

      for (const a of activeAnnouncements) {
         const msg = `📢 <b>${a.title}</b>\n\n${a.message}\n\n<i>${lang === 'ar' ? 'ينتهي في' : 'Expires'}: ${new Date(a.expire_at).toDateString()}</i>`;
         await ctx.replyWithHTML(msg);
      }
    });

    // P2P TASK ASSIGNMENTS - NEW MODULE
    bot.hears(["📌 New Task", "📌 مهمة جديدة"], async (ctx) => {
      const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", ctx.from.id).single();
      if (!employee) return;
      
      const lang = (employee.companies as any).bot_language || 'en';

      // Fetch coworkers
      const { data: coworkers } = await supabaseAdmin.from("employees").select("id, name").eq("company_id", employee.company_id).neq("id", employee.id);
      
      if (!coworkers || coworkers.length === 0) {
        return ctx.reply(lang === 'ar' ? "لم يتم العثور على موظفين لتكليفهم بمهام." : "No teammates found to assign tasks to.");
      }

      // Generate Inline Keyboard matching Coworkers
      const buttons = coworkers.map(cw => Markup.button.callback(`👤 ${cw.name}`, `assign_task_to_${cw.id}`));
      // Chunk buttons into rows of 2
      const rows = [];
      for (let i = 0; i < buttons.length; i += 2) rows.push(buttons.slice(i, i + 2));

      await ctx.reply(lang === 'ar' ? "لمن تريد إسناد المهمة؟ 👇" : "Who do you want to assign the task to? 👇", Markup.inlineKeyboard(rows));
    });

    // Task Read Mechanics
    bot.hears(["📝 My Tasks", "📝 مهامي"], async (ctx) => {
      const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", ctx.from.id).single();
      if (!employee) return;
      const lang = employee.companies.bot_language || 'en';

      const { data: tasks } = await supabaseAdmin.from("tasks").select("*, assigner:employees!assigned_by(name)").eq("assigned_to", employee.id).in("status", ["pending", "in_progress", "late"]).order("created_at", { ascending: true });

      if (!tasks || tasks.length === 0) {
        return ctx.reply(lang === 'ar' ? "🎉 ليس لديك مهام معلقة! عمل رائع." : "🎉 You have no pending tasks! Great job.");
      }

      for (const task of tasks) {
        const buttons = [];
        if (task.status === "pending" || task.status === "late") {
           buttons.push(Markup.button.callback(lang === 'ar' ? "⏳ قيد التنفيذ" : "⏳ Start Progress", `start_task_${task.id}`));
        }
        buttons.push(Markup.button.callback(lang === 'ar' ? "✅ تم الإنجاز" : "✅ Mark as Done", `task_done_${task.id}`));

        const msg = `📌 <b>${task.title}</b>\n\n👤 ${lang === 'ar' ? 'بواسطة' : 'Assigned By'}: ${task.assigner?.name || 'Admin'}\n⏳ ${lang === 'ar' ? 'التسليم' : 'Deadline'}: ${task.deadline || 'N/A'}\n⚠️ ${lang === 'ar' ? 'الحالة' : 'Status'}: ${task.status.toUpperCase()}`;
        await ctx.replyWithHTML(msg, Markup.inlineKeyboard([buttons]));
      }
    });

    bot.on("callback_query", async (ctx: any) => {
      const data = ctx.callbackQuery.data;
      const telegramUserId = ctx.from.id;
      
      // TASK ASSIGNMENT HOOK (Step 1 -> 2)
      if (data && data.startsWith("assign_task_to_")) {
        const assigneeId = data.replace("assign_task_to_", "");
        const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", telegramUserId).single();
        if(!employee) return;
        const lang = (employee.companies as any).bot_language || 'en';

        await ctx.answerCbQuery();
        return ctx.reply(lang === 'ar' 
          ? `يرجى الرد على هذه الرسالة بوصف المهمة المطلوبة:\n\n[Assignee UUID: ${assigneeId}]`
          : `Please reply directly to this message with the Task Title/Description:\n\n[Assignee UUID: ${assigneeId}]`, 
          { reply_markup: { force_reply: true } }
        );
      }

      // START TASK HOOK
      if (data && data.startsWith("start_task_")) {
         const taskId = data.replace("start_task_", "");
         await supabaseAdmin.from("tasks").update({ status: "in_progress" }).eq("id", taskId);
         await ctx.answerCbQuery("Task marked as in progress!");
         return ctx.editMessageReplyMarkup(Markup.inlineKeyboard([
             [Markup.button.callback("✅ Mark as Done", `task_done_${taskId}`)]
         ]).reply_markup);
      }

      // COMPLETE TASK HOOK
      if (data && data.startsWith("task_done_")) {
        const taskId = data.replace("task_done_", "");
        const { data: employee } = await supabaseAdmin.from("employees").select("id, companies(*)").eq("telegram_user_id", telegramUserId).single();
        if(!employee) return;
        
        await supabaseAdmin.from("tasks").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", taskId);
        await ctx.answerCbQuery("Completed!");
        
        return ctx.editMessageText(`✅ <b>COMPLETED</b>`, { parse_mode: "HTML" });
      }
    });

    bot.on("text", async (ctx) => {
      const telegramUserId = ctx.from.id;
      const replyToMsg = ctx.message.reply_to_message;
      
      // TASK ASSIGNMENT HOOK (Step 2 -> 3)
      if (replyToMsg && "text" in replyToMsg && replyToMsg.text && replyToMsg.text.includes("[Assignee UUID:")) {
          const match = replyToMsg.text.match(/\[Assignee UUID:\s*([a-f0-9\-]{36})\]/);
          if (match) {
             const assigneeId = match[1];
             const taskTitle = ctx.message.text.trim();
             const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", telegramUserId).single();
             if(!employee) return;
             const lang = (employee.companies as any).bot_language || 'en';

             return ctx.reply(lang === 'ar'
               ? `ممتاز. قم بالرد على هذه الرسالة بتاريخ التسليم بصيغة (YYYY-MM-DD) أو اكتب "لا" لتخطي التسليم.\n\n[Draft Assignee: ${assigneeId}]\n[Draft Title: ${taskTitle}]`
               : `Great. Reply to this exact message with a Deadline (YYYY-MM-DD) or type "Skip".\n\n[Draft Assignee: ${assigneeId}]\n[Draft Title: ${taskTitle}]`,
               { reply_markup: { force_reply: true } }
             );
          }
      }

      // TASK ASSIGNMENT HOOK (Step 3 -> Commit)
      if (replyToMsg && "text" in replyToMsg && replyToMsg.text && replyToMsg.text.includes("[Draft Assignee:")) {
          const assigneeMatch = replyToMsg.text.match(/\[Draft Assignee:\s*([a-f0-9\-]{36})\]/);
          const titleMatch = replyToMsg.text.match(/\[Draft Title:\s*(.*?)\]/);
          
          if (assigneeMatch && titleMatch) {
             const assigneeId = assigneeMatch[1];
             const taskTitle = titleMatch[1];
             const text = ctx.message.text.trim().toLowerCase();
             const deadline = (text === "skip" || text === "لا" || text === "no") ? null : ctx.message.text.trim();

             const { data: executer } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", telegramUserId).single();
             if(!executer) return;
             const lang = (executer.companies as any).bot_language || 'en';

             // Insert the task
             const { data: inserted, error: taskError } = await supabaseAdmin.from("tasks").insert({
                company_id: executer.company_id,
                assigned_by: executer.id,
                assigned_to: assigneeId,
                title: taskTitle,
                deadline: deadline || null,
                status: 'pending'
             }).select("id").single();

             if (taskError) {
                console.error("Task Insert Error:", taskError);
                return ctx.reply(lang === 'ar' ? "تعذر إنشاء المهمة. راجع تنسيق التاريخ (مثال: 2026-10-15)." : "Failed to create task. Check date format format (YYYY-MM-DD).");
             }

             // Successfully created! Notify the executer 
             await ctx.reply(lang === 'ar' ? `✅ تم إرسال المهمة بنجاح!` : `✅ Task successfully assigned!`);

             // Ping the Assignee dynamically!
             const { data: targetEmployee } = await supabaseAdmin.from("employees").select("telegram_user_id").eq("id", assigneeId).single();
             if (targetEmployee && targetEmployee.telegram_user_id) {
                const notifyMsg = lang === 'ar' 
                  ? `🔔 <b>مهمة جديدة أُسندت إليك!</b>\n\n👤 بواسطة: ${executer.name}\n📌 المهمة: ${taskTitle}\n⏳ التسليم: ${deadline || 'غير محدد'}`
                  : `🔔 <b>New Task Assigned!</b>\n\n👤 By: ${executer.name}\n📌 Task: ${taskTitle}\n⏳ Deadline: ${deadline || 'N/A'}`;
                
                await bot.telegram.sendMessage(targetEmployee.telegram_user_id, notifyMsg, {
                   parse_mode: "HTML",
                   reply_markup: {
                      inline_keyboard: [[
                         Markup.button.callback(lang === 'ar' ? "⏳ قيد التنفيذ" : "⏳ Start Progress", `start_task_${inserted.id}`),
                         Markup.button.callback(lang === 'ar' ? "✅ تم الإنجاز" : "✅ Mark as Done", `task_done_${inserted.id}`)
                      ]]
                   }
                }).catch(e => console.error("Could not notify assigned user:", e));
             }
             return;
          }
      }

      // Default Menu Handler for unknown inputs
      const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", telegramUserId).single();
      if (!employee) return;
      const lang = (employee.companies as any).bot_language || 'en';
      ctx.reply(lang === 'ar' ? "استخدم الحوار أعلاه لتعيين المهام، أو الأزرار للحضور." : "Please use the inline dialog to assign tasks, or menu buttons for attendance.", getMainMenu(employee.companies.enable_geofencing, lang));
    });

    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
    
  } catch (err) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
