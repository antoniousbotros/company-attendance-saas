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

  const a = Math.sin(dp/2) * Math.sin(dp/2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

const getMainMenu = (enableGeofencing: boolean, lang: string = 'en') => {
  if (lang === 'ar') {
    if (enableGeofencing) {
      return Markup.keyboard([
        [Markup.button.locationRequest("📍 إرسال الموقع")],
        ["📊 تقرير حضوري", "📝 مهامي"],
        ["ℹ️ مساعدة"]
      ]).resize();
    }
    return Markup.keyboard([
      ["✅ تسجيل حضور", "🚪 تسجيل انصراف"],
      ["📊 تقرير حضوري", "📝 مهامي"],
      ["ℹ️ مساعدة"]
    ]).resize();
  }

  // English fallback
  if (enableGeofencing) {
    return Markup.keyboard([
      [Markup.button.locationRequest("📍 Send Location (Check In / Out)")],
      ["📊 My Attendance", "📝 My Tasks"],
      ["ℹ️ Help"]
    ]).resize();
  }
  return Markup.keyboard([
    ["✅ Check In", "🚪 Check Out"],
    ["📊 My Attendance", "📝 My Tasks"],
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
      
      const { data: employee } = await supabaseAdmin
        .from("employees")
        .select("*, companies(*)")
        .eq("telegram_user_id", telegramUserId)
        .single();

      if (employee) {
        const lang = (employee.companies as any).bot_language || 'en';
        const msg = lang === 'ar'
          ? `مرحباً بعودتك يا ${employee.name}! نحن سعداء بوجودك كفرد من عائلة ${employee.companies.name}.\n\nاستخدم الأزرار بالأسفل لتسجيل حالتك.`
          : `Welcome back, ${employee.name}! We are happy to have you as one of the ${employee.companies.name} family.\n\nUse the buttons below to log your status.`;
        
        return ctx.reply(msg, getMainMenu(employee.companies.enable_geofencing, lang));
      }

      // Default start (unknown user, don't know company yet, default English/Arabic mix)
      return ctx.reply(
        "Welcome to the Attendance Bot (مرحباً بك)! To get started, please share your contact so we can link your account.",
        Markup.keyboard([
          Markup.button.contactRequest("📱 Share Contact (مشاركة جهة الاتصال)")
        ]).oneTime().resize()
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

      const { data: employees, error } = await supabaseAdmin
        .from("employees")
        .select("*, companies(*)")
        .ilike("phone", `%${last9digits}`);

      const employee = employees?.[0];

      if (error || !employee) {
        return ctx.reply(`Sorry, your phone number (ending in ${last9digits}) is not registered in our system.\n\nPlease ask your administrator to add your phone number.`);
      }

      const lang = (employee.companies as any).bot_language || 'en';

      await supabaseAdmin
        .from("employees")
        .update({ telegram_user_id: telegramUserId })
        .eq("id", employee.id);

      const successMsg = lang === 'ar'
        ? `تم بنجاح! حسابك الآن مربوط بـ ${employee.companies.name}.\n\nيمكنك الآن استخدام أزرار الحضور والانصراف.`
        : `Success! Your account is now linked to ${employee.companies.name}.\n\nYou can now use the check-in and check-out buttons.`;

      return ctx.reply(successMsg, getMainMenu(employee.companies.enable_geofencing, lang));
    });

    const processAttendance = async (ctx: any, employee: any, explicitlyLocation: boolean = false) => {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const company = (employee.companies as any);
      const lang = company.bot_language || 'en';

      const { data: attendance } = await supabaseAdmin
        .from("attendance")
        .select("*")
        .eq("employee_id", employee.id)
        .eq("date", today)
        .single();

      // If we are checking in:
      if (!attendance || !attendance.check_in) {
        let isLate = false;
        let lateMins = 0;
        if (company.work_start_time) {
          const [startH, startM] = company.work_start_time.split(':').map(Number);
          const thresholdMin = employee.allowed_late_minutes !== null ? employee.allowed_late_minutes : (company.late_threshold || 15);
          
          const workStart = new Date(now);
          workStart.setHours(startH, startM, 0, 0); // Exact start time
          
          if (now > workStart) {
            const diffMs = now.getTime() - workStart.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMins > thresholdMin) {
              isLate = true;
              lateMins = diffMins; // log correct exact late minutes
            }
          }
        }
        
        const status = isLate ? "late" : "present";
        const { error } = await supabaseAdmin
          .from("attendance")
          .upsert({
            employee_id: employee.id,
            company_id: employee.company_id,
            date: today,
            check_in: now.toISOString(),
            status: status,
            late_minutes: lateMins
          });

        if (error) return ctx.reply(lang === 'ar' ? "حدث خطأ. يرجى المحاولة." : "Error recording attendance. Please try again.");
        
        const timeStr = now.toLocaleTimeString("en-US", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hour12: true });

        const inMsg = lang === 'ar'
          ? `✅ تم تسجيل الحضور الساعة ${timeStr}.${isLate ? `\n⚠️ لقد تأخرت ${lateMins} دقيقة.` : ""}`
          : `✅ Checked In at ${timeStr}.${isLate ? `\n⚠️ You are ${lateMins} minutes late.` : ""}`;
        
        return ctx.reply(inMsg);
      }

      // If checked in, but not checked out:
      if (!attendance.check_out) {
        const checkIn = new Date(attendance.check_in);
        const diffMs = now.getTime() - checkIn.getTime();
        const diffHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

        const { error } = await supabaseAdmin
          .from("attendance")
          .update({
            check_out: now.toISOString(),
            working_hours: diffHours
          })
          .eq("id", attendance.id);

        if (error) return ctx.reply(lang === 'ar' ? "حدث خطأ. يرجى المحاولة." : "Error recording checkout. Please try again.");
        
        const timeStr = now.toLocaleTimeString("en-US", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hour12: true });

        const outMsg = lang === 'ar'
          ? `🚪 تم تسجيل الانصراف الساعة ${timeStr}.\nإجمالي الساعات: ${diffHours}h`
          : `🚪 Checked Out at ${timeStr}.\nTotal hours: ${diffHours}h`;

        return ctx.reply(outMsg);
      }

      return ctx.reply(lang === 'ar' ? "لقد أتممت ورديتك اليوم بالفعل!" : "You have already completed your shift today!");
    };

    bot.on("location", async (ctx) => {
      const userId = ctx.from.id;
      const { latitude, longitude } = ctx.message.location;

      const { data: employee } = await supabaseAdmin
        .from("employees")
        .select("*, companies(*)")
        .eq("telegram_user_id", userId)
        .single();

      if (!employee) return ctx.reply("Please /start and link your account first.");

      const company = (employee.companies as any);
      const lang = company.bot_language || 'en';

      if (company.enable_geofencing) {
        if (!company.office_lat || !company.office_lng) {
           return ctx.reply(lang === 'ar' ? "⚠️ الإدارة اشترطت التواجد لكن لم يتم إضافة موقع المقر." : "⚠️ Geofencing is enabled, but your company has not set up their office GPS coordinates yet.");
        }

        const distance = getDistance(latitude, longitude, company.office_lat, company.office_lng);

        if (distance > (company.office_radius || 200)) {
           const distMsg = lang === 'ar' 
             ? `❌ تم رفض الإجراء. أنت تبعد ${Math.round(distance)} متراً عن المقر.\nالنطاق المسموح: ${company.office_radius || 200} متر.`
             : `❌ Check in rejected. You are ${Math.round(distance)} meters away from the office.\nAllowed radius: ${company.office_radius || 200} meters.`;
           return ctx.reply(distMsg);
        }
      }

      await processAttendance(ctx, employee, true);
    });

    bot.hears(["✅ Check In", "✅ تسجيل حضور"], async (ctx) => {
      const userId = ctx.from.id;
      const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", userId).single();
      
      if (!employee) return ctx.reply("Please /start and link your account first.");
      const lang = employee.companies.bot_language || 'en';

      if (employee.companies.enable_geofencing) {
        const strictGpsMsg = lang === 'ar' 
          ? "⚠️ الإدارة تشترط التحقق من GPS. يرجى إرسال الموقع '📍 إرسال الموقع'."
          : "⚠️ Your company strictly requires GPS Location verification. Please use the '📍 Send Location' button.";
        return ctx.reply(strictGpsMsg, getMainMenu(true, lang));
      }

      const today = new Date().toISOString().split("T")[0];
      const { data: attendance } = await supabaseAdmin.from("attendance").select("*").eq("employee_id", employee.id).eq("date", today).single();
      if (attendance && attendance.check_in) {
        const timeStr = new Date(attendance.check_in).toLocaleTimeString("en-US", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hour12: true });
        return ctx.reply(lang === 'ar' 
          ? `لقد سجلت الحضور اليوم الساعة ${timeStr}.`
          : `You already checked in today at ${timeStr}.`);
      }

      await processAttendance(ctx, employee);
    });

    bot.hears(["🚪 Check Out", "🚪 تسجيل انصراف"], async (ctx) => {
      const userId = ctx.from.id;
      const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", userId).single();
      
      if (!employee) return ctx.reply("Please /start and link your account first.");
      const lang = employee.companies.bot_language || 'en';

      if (employee.companies.enable_geofencing) {
        const strictGpsMsg = lang === 'ar' 
          ? "⚠️ الإدارة تشترط التحقق من GPS. يرجى إرسال الموقع '📍 إرسال الموقع'."
          : "⚠️ Your company strictly requires GPS Location verification. Please use the '📍 Send Location' button.";
        return ctx.reply(strictGpsMsg, getMainMenu(true, lang));
      }

      const today = new Date().toISOString().split("T")[0];
      const { data: attendance } = await supabaseAdmin.from("attendance").select("*").eq("employee_id", employee.id).eq("date", today).single();
      
      if (!attendance || !attendance.check_in) return ctx.reply(lang === 'ar' ? "لم تقم بتسجيل الحضور بعد!" : "You haven't checked in yet today!");
      if (attendance.check_out) {
        const timeStr = new Date(attendance.check_out).toLocaleTimeString("en-US", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hour12: true });
        return ctx.reply(lang === 'ar' 
          ? `لقد سجلت الانصراف مسبقاً الساعة ${timeStr}.`
          : `You already checked out today at ${timeStr}.`);
      }

      await processAttendance(ctx, employee);
    });

    bot.hears(["📍 Send Location (Check In / Out)", "📍 إرسال الموقع"], async (ctx) => {
      return ctx.reply("⚠️ Your device does not support automatic location buttons (common on Desktop/Web Telegram).\n\nPlease click the 📎 Paperclip icon next to the chat box and send your 'Location' manually.\n\n(جهازك لا يدعم أزرار الموقع التلقائية. اضغط على أيقونة الإرفاق 📎 وأرسل الموقع)");
    });

    bot.hears(["📊 My Attendance", "📊 تقرير حضوري"], async (ctx) => {
      const userId = ctx.from.id;
      
      const { data: employee } = await supabaseAdmin
        .from("employees")
        .select("*, companies(*)")
        .eq("telegram_user_id", userId)
        .single();

      if (!employee) return ctx.reply("Please link your account first.");
      const lang = (employee.companies as any).bot_language || 'en';

      const { data: logs } = await supabaseAdmin
        .from("attendance")
        .select("*")
        .eq("employee_id", employee.id)
        .order("date", { ascending: false })
        .limit(5);

      if (!logs || logs.length === 0) return ctx.reply(lang === 'ar' ? "لم نعثر على سجلات حضور." : "No attendance records found.");

      const formatTime = (iso: string | null) => {
        if (!iso) return " -   ";
        const d = new Date(iso);
        return d.toLocaleTimeString("en-US", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hour12: false });
      };

      const formatStatus = (s: string) => {
        if (s === "present") return lang === 'ar' ? "حضور" : "Pres.";
        if (s === "absent") return lang === 'ar' ? "غياب" : "Absn.";
        if (s === "holiday") return lang === 'ar' ? "عطلة" : "Holi.";
        return lang === 'ar' ? "تأخير" : "Late ";
      };

      let table = lang === 'ar' ? "📅 <b>حضورك وانصرافك مؤخراً</b>\n\n<pre>" : "📅 <b>Your Recent Attendance</b>\n\n<pre>";
      table += lang === 'ar' ? "تاريخ  |حالة |حضور |انصراف\n------+-----+----+-----\n" : "Date  |Status| In  | Out \n------+------+-----+-----\n";
      
      logs.forEach(log => {
        const d = new Date(log.date);
        const dateStr = `${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getDate().toString().padStart(2,"0")}`;
        const statusStr = formatStatus(log.status);
        const inStr = formatTime(log.check_in);
        const outStr = formatTime(log.check_out);
        
        table += `${dateStr} |${statusStr}|${inStr}|${outStr}\n`;
      });
      table += "</pre>";

      return ctx.replyWithHTML(table, getMainMenu(employee.companies.enable_geofencing, lang));
    });

    bot.hears(["📝 My Tasks", "📝 مهامي"], async (ctx) => {
      const userId = ctx.from.id;
      const { data: employee } = await supabaseAdmin
        .from("employees")
        .select("*, companies(*)")
        .eq("telegram_user_id", userId)
        .single();

      if (!employee) return ctx.reply("Please link your account first.");
      const lang = employee.companies.bot_language || 'en';

      const { data: tasks } = await supabaseAdmin
        .from("tasks")
        .select("*")
        .eq("employee_id", employee.id)
        .in("status", ["pending", "late"])
        .order("due_date", { ascending: true });

      if (!tasks || tasks.length === 0) {
        return ctx.reply(lang === 'ar' ? "🎉 ليس لديك مهام معلقة! عمل رائع." : "🎉 You have no pending tasks! Great job.", getMainMenu(employee.companies.enable_geofencing, lang));
      }

      await ctx.reply(lang === 'ar' ? `لديك ${tasks.length} مهام نشطة:` : `You have ${tasks.length} active tasks:`);

      for (const task of tasks) {
        const buttons = [];
        if (task.link) {
          buttons.push(Markup.button.url(lang === 'ar' ? "🔗 افتح الرابط" : "🔗 Open Link", task.link));
        }
        buttons.push(Markup.button.callback(lang === 'ar' ? "✅ تم الإنجاز" : "✅ Mark as Done", `task_done_${task.id}`));

        const dueDate = new Date(task.due_date).toDateString();
        const statLabel = task.status === "late" 
           ? (lang === 'ar' ? "🔴 متأخرة" : "🔴 LATE")
           : (lang === 'ar' ? "🟡 قيد التنفيذ" : "🟡 PENDING");

        const msg = `📌 <b>${task.title}</b>\n\n${task.description ? task.description + "\n\n" : ""}⏳ ${lang === 'ar' ? 'التسليم' : 'Due'}: ${dueDate}\n⚠️ ${lang === 'ar' ? 'الحالة' : 'Status'}: ${statLabel}`;
        
        await ctx.replyWithHTML(msg, Markup.inlineKeyboard([buttons]));
      }
    });

    bot.on("callback_query", async (ctx: any) => {
      const cbq = ctx.callbackQuery;
      const data = cbq.data;

      if (data && data.startsWith("task_done_")) {
        const taskId = data.replace("task_done_", "");
        const userId = ctx.from.id;
        
        const { data: employee } = await supabaseAdmin.from("employees").select("id, companies(*)").eq("telegram_user_id", userId).single();
        if(!employee) return ctx.answerCbQuery("Not authorized.");
        
        const lang = (employee.companies as any).bot_language || 'en';

        // verify ownership & mark done
        const { data: task } = await supabaseAdmin.from("tasks").select("*").eq("id", taskId).eq("employee_id", employee.id).single();
        if (!task) return ctx.answerCbQuery(lang === 'ar' ? "المهمة غير موجودة." : "Task not found or not yours.");

        if (task.status === "completed") {
           return ctx.answerCbQuery(lang === 'ar' ? "تم إنجازها مسبقاً!" : "Task already completed!");
        }

        await ctx.answerCbQuery();
        
        const noteMsg = lang === 'ar' 
          ? `📝 يرجى الرد على هذه الرسالة مع أي إضافات أو روابط.\n\nTask UUID: ${task.id}\n\n(اكتب "تم" للتخطي)`
          : `📝 Please reply to this exact message with any notes or links for your work.\n\nTask UUID: ${task.id}\n\n(If you have no notes, just type "done")`;

        await ctx.reply(noteMsg, {
          reply_markup: { force_reply: true }
        });
      }
    });

    bot.on("text", async (ctx) => {
      const telegramUserId = ctx.from.id;
      
      const replyToMsg = ctx.message.reply_to_message;
      if (replyToMsg && "text" in replyToMsg && replyToMsg.text && replyToMsg.text.includes("Task UUID: ")) {
        const match = replyToMsg.text.match(/Task UUID:\s*([a-f0-9\-]{36})/);
        if (match) {
          const taskId = match[1];
          const text = ctx.message.text.trim().toLowerCase();
          const userNote = (text === "done" || text === "تم" || text === "skip") ? null : ctx.message.text;

          const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", telegramUserId).single();
          if(!employee) return ctx.reply("Not authorized.");
          
          const lang = (employee.companies as any).bot_language || 'en';

          const { data: task } = await supabaseAdmin.from("tasks").select("*").eq("id", taskId).eq("employee_id", employee.id).single();
          
          if (!task) return ctx.reply(lang === 'ar' ? "المهمة غير موجودة." : "Task not found or not yours.");
          if (task.status === "completed") return ctx.reply(lang === 'ar' ? "تم إنجازها مسبقاً!" : "Task is already completed!");

          await supabaseAdmin
            .from("tasks")
            .update({ status: "completed", completed_at: new Date().toISOString(), employee_submission: userNote })
            .eq("id", taskId);

          return ctx.reply(`✅ <b>${lang === 'ar' ? 'اكتملت:' : 'COMPLETED:'}</b> ${task.title}\n${userNote ? `<i>${lang === 'ar' ? 'ملاحظتك:' : 'Note attached:'} ${userNote}</i>` : (lang === 'ar' ? 'عمل رائع!' : 'Good work!')}`, { parse_mode: "HTML" });
        }
      }

      const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", telegramUserId).single();

      if (!employee) {
        return ctx.reply(
          "⚠️ For security reasons, we do not accept manually typed phone numbers. Please tap the '📱 Share Contact' button.",
          Markup.keyboard([Markup.button.contactRequest("📱 Share Contact (مشاركة جهة الاتصال)")]).oneTime().resize()
        );
      }

      const lang = (employee.companies as any).bot_language || 'en';
      ctx.reply(lang === 'ar' ? "استخدم أزرار القائمة أسفل الشاشة لتسجيل الحضور." : "Please use the menu buttons to log your attendance.", getMainMenu(employee.companies.enable_geofencing, lang));
    });

    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
    
  } catch (err) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
