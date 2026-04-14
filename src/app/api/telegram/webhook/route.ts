import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { Telegraf, Markup } from "telegraf";
import ExcelJS from "exceljs";

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

const getMainMenu = (company: any) => {
  const lang = company?.bot_language || 'en';
  const geofencing = company?.enable_geofencing;
  const salesEnabled = company?.sales_tracking_enabled;

  const row2 = lang === 'ar' ? ["📊 تقرير حضوري", "📝 مهامي"] : ["📊 My Attendance", "📝 My Tasks"];
  const row3 = lang === 'ar' ? ["📌 مهمة جديدة", "📢 إعلانات الشركة"] : ["📌 New Task", "📢 Announcements"];
  
  const bottomRow = salesEnabled 
    ? (lang === 'ar' ? ["📈 تقرير مبيعات", "📂 تقاريري", "📊 تقارير فريقي"] : ["📈 Submit Report", "📂 My Reports", "📊 Team Reports"])
    : (lang === 'ar' ? ["ℹ️ مساعدة"] : ["ℹ️ Help"]);

  if (geofencing) {
    return Markup.keyboard([
      [Markup.button.locationRequest(lang === 'ar' ? "📍 إرسال الموقع" : "📍 Send Location (Check In / Out)")],
      row2,
      row3,
      bottomRow
    ]).resize();
  }

  return Markup.keyboard([
    lang === 'ar' ? ["✅ تسجيل حضور", "🚪 تسجيل انصراف"] : ["✅ Check In", "🚪 Check Out"],
    row2,
    row3,
    bottomRow
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

    const { data: botCompany } = await supabaseAdmin.from("companies").select("id").eq("telegram_token", token).single();
    if (!botCompany && token !== process.env.TELEGRAM_BOT_TOKEN) {
       console.error("Unknown bot token");
       return NextResponse.json({ ok: false }, { status: 400 });
    }
    const currentCompanyId = botCompany ? botCompany.id : null;
    
    const bot = new Telegraf(token);

    bot.start(async (ctx) => {
      const telegramUserId = ctx.from.id;
      const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", telegramUserId).eq("company_id", currentCompanyId).limit(1).single();

      if (employee) {
        const lang = (employee.companies as any).bot_language || 'en';
        const msg = lang === 'ar'
          ? `مرحباً بعودتك يا ${employee.name}! نحن سعداء بوجودك كفرد من عائلة ${employee.companies.name}.\n\nاستخدم الأزرار بالأسفل للتبديل بين خدمات يومي.`
          : `Welcome back, ${employee.name}! We are happy to have you as one of the ${employee.companies.name} family.\n\nUse the buttons below to log your status.`;
        return ctx.reply(msg, getMainMenu(employee.companies));
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

      const { data: employees, error } = await supabaseAdmin.from("employees")
        .select("*, companies(*)")
        .ilike("phone", `%${last9digits}`)
        .eq("company_id", currentCompanyId);
      
      const employee = employees?.[0];

      if (error || !employee) {
        return ctx.reply(`Sorry, your phone number (ending in ${last9digits}) is not registered in our system.\n\nPlease ask your administrator to add your phone number.`);
      }

      const lang = (employee.companies as any).bot_language || 'en';
      await supabaseAdmin.from("employees").update({ telegram_user_id: telegramUserId }).eq("id", employee.id);

      const successMsg = lang === 'ar'
        ? `تم بنجاح! حسابك الآن مربوط بـ ${employee.companies.name}.`
        : `Success! Your account is now linked to ${employee.companies.name}.`;
      return ctx.reply(successMsg, getMainMenu(employee.companies));
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

    const runNextReportStep = async (ctx: any, employee: any, draftReport: any) => {
        const lang = employee.companies.bot_language || 'en';
        
        // Get all custom fields
        const { data: fields } = await supabaseAdmin.from("custom_fields").select("*").eq("team_id", draftReport.team_id).order("order_index", { ascending: true });
        
        // Get filled values
        const { data: filledValues } = await supabaseAdmin.from("report_values").select("field_id").eq("report_id", draftReport.id);
        const filledIds = filledValues?.map(v => v.field_id) || [];

        // Find first unfilled field
        const nextField = fields?.find(f => !filledIds.includes(f.id));

        const { data: team } = await supabaseAdmin.from("teams").select("show_notes, require_notes").eq("id", draftReport.team_id).single();
        
        if (nextField) {
            if (nextField.field_type === 'select' && nextField.options && nextField.options.length > 0) {
                // Generate Inline Keyboard
                const optionButtons = nextField.options.map((opt: string, idx: number) => [
                    Markup.button.callback(opt, `ropt_${draftReport.id.substring(0,8)}_${nextField.id.substring(0,8)}_${idx}`)
                ]);
                return ctx.reply(lang === 'ar'
                    ? `يرجى إختيار: ${nextField.label} 👇`
                    : `Please select: ${nextField.label} 👇`,
                    Markup.inlineKeyboard(optionButtons)
                );
            }
            
            return ctx.reply(lang === 'ar'
                ? `يرجى إدخال: ${nextField.label} (${nextField.field_type === 'number' ? 'أرقام فقط' : 'نص'})\n\n[Report: ${draftReport.id.substring(0,8)}_${nextField.id.substring(0,8)}]`
                : `Please enter: ${nextField.label} (${nextField.field_type})\n\n[Report: ${draftReport.id.substring(0,8)}_${nextField.id.substring(0,8)}]`,
                { reply_markup: { force_reply: true } }
            );
        }

        // All fields filled, ask for notes if enabled
        if (team && team.show_notes === false) {
             await supabaseAdmin.from("reports").update({ status: 'completed' }).eq("id", draftReport.id);
             return ctx.reply(lang === 'ar' ? "✅ تم تسجيل تقريرك الميداني بنجاح! شكراً لك." : "✅ Field report submitted successfully! Thank you.", getMainMenu((employee as any).companies));
        }

        return ctx.reply(lang === 'ar' 
            ? `📝 أخيراً، أرسل أي ملاحظات لزيارتك${team?.require_notes ? ' (إجباري)' : ' (أو أرسل "لا")'} 👇\n\n[Report: ${draftReport.id.substring(0,8)}_notes]`
            : `📝 Finally, any notes regarding your visit${team?.require_notes ? ' (Required)' : ' (or type "no")'} 👇\n\n[Report: ${draftReport.id.substring(0,8)}_notes]`,
            { reply_markup: { force_reply: true } }
        );
    };

    bot.on("location", async (ctx) => {
      const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", ctx.from.id).eq("company_id", currentCompanyId).limit(1).single();
      if (!employee) return;
      const company = (employee.companies as any);

      // Check if location is intended for a Sales Draft
      const { data: draftReport } = await supabaseAdmin.from("reports").select("id, team_id, location_lat, location_lng").eq("employee_id", employee.id).eq("status", "draft").single();
      if (draftReport && company.sales_tracking_enabled) {
          // Location for sales report! (Update it and proceed to the next step)
          await supabaseAdmin.from("reports").update({ 
             location_lat: ctx.message.location.latitude,
             location_lng: ctx.message.location.longitude
          }).eq("id", draftReport.id);
          
          return runNextReportStep(ctx, employee, Object.assign({}, draftReport, {
             location_lat: ctx.message.location.latitude,
             location_lng: ctx.message.location.longitude
          }));
      }

      // Fallback: Attendance flow
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
      const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", ctx.from.id).eq("company_id", currentCompanyId).limit(1).single();
      if (!employee) return ctx.reply("Please /start and link your account first.");
      const lang = employee.companies.bot_language || 'en';
      if (employee.companies.enable_geofencing) {
        return ctx.reply(lang === 'ar' ? "⚠️ يرجى إرسال الموقع '📍 إرسال الموقع'." : "⚠️ Please use the '📍 Send Location' button.", getMainMenu(employee.companies));
      }
      await processAttendance(ctx, employee);
    });

    bot.hears(["📊 My Attendance", "📊 تقرير حضوري"], async (ctx) => {
      const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", ctx.from.id).eq("company_id", currentCompanyId).limit(1).single();
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
    bot.hears(["📢 Announcements", "📢 إعلانات الشركة"], async (ctx) => {
      const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", ctx.from.id).eq("company_id", currentCompanyId).limit(1).single();
      if (!employee) return;
      
      const lang = (employee.companies as any).bot_language || 'en';

      const { data: announcements, error } = await supabaseAdmin.from("announcements")
        .select(`*, announcement_targets(department, employee_id)`)
        .eq("company_id", employee.company_id)
        .eq("is_active", true);

      if (error || !announcements || announcements.length === 0) {
         return ctx.reply(lang === 'ar' ? "🎉 لا توجد إعلانات نشطة حالياً." : "🎉 No active announcements at the moment.");
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
         return ctx.reply(lang === 'ar' ? "🎉 لا توجد إعلانات نشطة حالياً." : "🎉 No active announcements at the moment.");
      }

      await ctx.reply(lang === 'ar' ? `لديك ${activeAnnouncements.length} إعلانات نشطة:` : `You have ${activeAnnouncements.length} active announcements:`);

      for (const a of activeAnnouncements) {
         const msg = `📢 <b>${a.title}</b>\n\n${a.message}\n\n<i>${lang === 'ar' ? 'ينتهي في' : 'Expires'}: ${new Date(a.expire_at).toDateString()}</i>`;
         await ctx.replyWithHTML(msg);
      }
    });

    // P2P TASK ASSIGNMENTS - NEW MODULE
    bot.hears(["📌 New Task", "📌 مهمة جديدة"], async (ctx) => {
      const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", ctx.from.id).eq("company_id", currentCompanyId).limit(1).single();
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
      const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", ctx.from.id).eq("company_id", currentCompanyId).limit(1).single();
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

    // TEAM LEADER REPORTS HOOK
    bot.hears(["📊 Team Reports", "📊 تقارير فريقي"], async (ctx) => {
      const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", ctx.from.id).eq("company_id", currentCompanyId).limit(1).single();
      if (!employee) return;
      const lang = employee.companies.bot_language || 'en';

      if (!employee.companies.sales_tracking_enabled) return;

      // 1. Is user a leader?
      const { data: membership } = await supabaseAdmin.from("team_members").select("team_id, role, teams(name)").eq("employee_id", employee.id).single();
      
      if (!membership || membership.role !== 'leader') {
         return ctx.reply(lang === 'ar' ? "❌ هذا الأمر مخصص لمشرفي الفرق فقط." : "❌ Only Team Leaders can access this.");
      }

      const teamsData: any = membership.teams;
      const teamName = (Array.isArray(teamsData) ? teamsData[0]?.name : teamsData?.name) || "Team";

      // 2. Fetch reports for this team_id
      const { data: reports } = await supabaseAdmin.from("reports").select(`
          id, date, created_at, location_lat, location_lng, notes,
          employees(name),
          report_values(field_id, value)
      `).eq("team_id", membership.team_id).eq("status", "completed").order("created_at", { ascending: false }).limit(200);

      if (!reports || reports.length === 0) {
         return ctx.reply(lang === 'ar' ? "لم يقم فريقك بإدراج أي تقارير بعد." : "Your team hasn't submitted any reports yet.");
      }

      // 3. Fetch custom fields mapped for this team
      const { data: fields } = await supabaseAdmin.from("custom_fields").select("id, label").eq("team_id", membership.team_id).order("order_index", { ascending: true });
      
      // 4. Construct Excel Structure
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Team Reports', { views: [{ rightToLeft: lang === 'ar' }] });

      const columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Time', key: 'time', width: 12 },
        { header: 'Employee', key: 'employee', width: 25 },
      ];
      
      if (fields) {
        fields.forEach(f => columns.push({ header: f.label, key: f.id, width: 20 }));
      }
      columns.push({ header: 'Notes', key: 'notes', width: 40 });
      columns.push({ header: 'Location Link', key: 'location', width: 30 });

      worksheet.columns = columns;

      // Style Header
      const headerRow = worksheet.getRow(1);
      headerRow.font = { name: 'Arial', family: 4, size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      reports.forEach((r: any) => {
          const d = new Date(r.created_at);
          const dateStr = d.toLocaleDateString('en-GB');
          const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          const empData: any = r.employees;
          const rawName = Array.isArray(empData) ? empData[0]?.name : empData?.name;
          const empName = rawName || 'Unknown';
          
          const valsMap: Record<string, string> = {};
          if (r.report_values) {
              r.report_values.forEach((v: any) => { valsMap[v.field_id] = v.value; });
          }

          const rowData: any = {
             date: dateStr,
             time: timeStr,
             employee: empName,
             notes: r.notes || "",
          };

          if (fields) {
             fields.forEach(f => {
                rowData[f.id] = valsMap[f.id] || "";
             });
          }

          const mapLink = r.location_lat ? `https://www.google.com/maps?q=${r.location_lat},${r.location_lng}` : "";
          
          const row = worksheet.addRow(rowData);
          row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          
          if (mapLink) {
             row.getCell('location').value = { text: 'View Map', hyperlink: mapLink };
             row.getCell('location').font = { color: { argb: 'FF0563C1' }, underline: true };
          } else {
             row.getCell('location').value = "-";
          }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      
      await ctx.reply(lang === 'ar' ? `📊 تم سحب ${reports.length} تقارير من فريق ${teamName}. يتم توليد الملف...` : `📊 Fetched ${reports.length} reports for ${teamName}. Generating file...`);
      return ctx.replyWithDocument({ source: Buffer.from(buffer), filename: `Team_Reports_${new Date().toISOString().split("T")[0]}.xlsx` });
    });

    // MY REPORTS HOOK
    bot.hears(["📂 My Reports", "📂 تقاريري"], async (ctx) => {
      const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", ctx.from.id).eq("company_id", currentCompanyId).limit(1).single();
      if (!employee) return;
      const lang = employee.companies.bot_language || 'en';

      if (!employee.companies.sales_tracking_enabled) return;

      const { data: membership } = await supabaseAdmin.from("team_members").select("team_id, teams(name)").eq("employee_id", employee.id).single();
      
      if (!membership) {
         return ctx.reply(lang === 'ar' ? "❌ لست منضماً لأي فريق." : "❌ You are not assigned to any team.");
      }

      // 2. Fetch reports for this specific employee
      const { data: reports } = await supabaseAdmin.from("reports").select(`
          id, date, created_at, location_lat, location_lng, notes,
          report_values(field_id, value)
      `).eq("employee_id", employee.id).eq("status", "completed").order("created_at", { ascending: false }).limit(200);

      if (!reports || reports.length === 0) {
         return ctx.reply(lang === 'ar' ? "لم تقم بإدراج أي تقارير بعد." : "You haven't submitted any reports yet.");
      }

      // 3. Fetch custom fields mapped for this team
      const { data: fields } = await supabaseAdmin.from("custom_fields").select("id, label").eq("team_id", membership.team_id).order("order_index", { ascending: true });
      
      // 4. Construct Excel Structure
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('My Reports', { views: [{ rightToLeft: lang === 'ar' }] });

      const columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Time', key: 'time', width: 12 },
      ];
      
      if (fields) {
        fields.forEach(f => columns.push({ header: f.label, key: f.id, width: 20 }));
      }
      columns.push({ header: 'Notes', key: 'notes', width: 40 });
      columns.push({ header: 'Location Link', key: 'location', width: 30 });

      worksheet.columns = columns;

      // Style Header
      const headerRow = worksheet.getRow(1);
      headerRow.font = { name: 'Arial', family: 4, size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      reports.forEach((r: any) => {
          const d = new Date(r.created_at);
          const dateStr = d.toLocaleDateString('en-GB');
          const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          
          const valsMap: Record<string, string> = {};
          if (r.report_values) {
              r.report_values.forEach((v: any) => { valsMap[v.field_id] = v.value; });
          }

          const rowData: any = {
             date: dateStr,
             time: timeStr,
             notes: r.notes || "",
          };

          if (fields) {
             fields.forEach(f => {
                rowData[f.id] = valsMap[f.id] || "";
             });
          }

          const mapLink = r.location_lat ? `https://www.google.com/maps?q=${r.location_lat},${r.location_lng}` : "";
          
          const row = worksheet.addRow(rowData);
          row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          
          if (mapLink) {
             row.getCell('location').value = { text: 'View Map', hyperlink: mapLink };
             row.getCell('location').font = { color: { argb: 'FF0563C1' }, underline: true };
          } else {
             row.getCell('location').value = "-";
          }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      
      await ctx.reply(lang === 'ar' ? `📊 تم سحب ${reports.length} تقارير خاصة بك. يتم توليد الملف...` : `📊 Fetched your ${reports.length} reports. Generating file...`);
      return ctx.replyWithDocument({ source: Buffer.from(buffer), filename: `My_Reports_${new Date().toISOString().split("T")[0]}.xlsx` });
    });

    // SALES TRACKING HOOK
    bot.hears(["📈 Submit Report", "📈 تقرير مبيعات"], async (ctx) => {
      const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", ctx.from.id).eq("company_id", currentCompanyId).limit(1).single();
      if (!employee) return;
      const lang = employee.companies.bot_language || 'en';

      if (!employee.companies.sales_tracking_enabled) return;

      // Ensure they belong to a team!
      const { data: teamMember } = await supabaseAdmin.from("team_members").select("team_id").eq("employee_id", employee.id).single();
      if (!teamMember) {
         return ctx.reply(lang === 'ar' ? "❌ لست منضماً لأي فريق لتسجيل تقرير المبيعات." : "❌ You are not assigned to any sales team.", getMainMenu(employee.companies));
      }

      // Check if draft exists
      let { data: draft } = await supabaseAdmin.from("reports").select("id, team_id, location_lat, location_lng").eq("employee_id", employee.id).eq("status", "draft").single();
      
      const today = new Date().toISOString().split("T")[0];

      if (!draft) {
          const { data: newDraft } = await supabaseAdmin.from("reports").insert({
              company_id: employee.company_id,
              team_id: teamMember.team_id,
              employee_id: employee.id,
              date: today,
              status: 'draft'
          }).select("id, team_id, location_lat, location_lng").single();
          draft = newDraft;
      }

      if (draft && draft.location_lat) {
          // Already have a location for this draft, resume next field
          return runNextReportStep(ctx, employee, draft);
      }

      return ctx.reply(lang === 'ar' 
        ? "أهلاً بك!\nللبدء بتسجيل التقرير الميداني، يرجى إرسال موقعك الحالي أولاً باستخدام زر 'إرسال الموقع' بالأسفل 📍" 
        : "Welcome!\nTo start tracking your field report, please send your current location using the button below 📍",
        Markup.keyboard([[Markup.button.locationRequest(lang === 'ar' ? "📍 إرسال الموقع" : "📍 Send Location")]]).resize()
      );
    });

    bot.on("callback_query", async (ctx: any) => {
      const data = ctx.callbackQuery.data;
      const telegramUserId = ctx.from.id;
      
      // TASK ASSIGNMENT HOOK (Step 1 -> 2)
      if (data && data.startsWith("assign_task_to_")) {
        const assigneeFullId = data.replace("assign_task_to_", "");
        const shortRef = assigneeFullId.substring(0, 8); // Extremely slim UUID footprint

        const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", telegramUserId).eq("company_id", currentCompanyId).limit(1).single();
        if(!employee) return;
        const lang = (employee.companies as any).bot_language || 'en';

        await ctx.answerCbQuery();
        return ctx.reply(lang === 'ar' 
          ? `يرجى الرد على هذه الرسالة بوصف المهمة المطلوبة:\n\n[Ref: ${shortRef}]`
          : `Please reply directly to this message with the Task Title/Description:\n\n[Ref: ${shortRef}]`, 
          { reply_markup: { force_reply: true } }
        );
      }

      // START TASK HOOK
      if (data && data.startsWith("start_task_")) {
         const taskId = data.replace("start_task_", "");
         await supabaseAdmin.from("tasks").update({ status: "in_progress" }).eq("id", taskId);
         
         await ctx.answerCbQuery("Task marked as in progress!").catch(()=>{});
         await ctx.editMessageReplyMarkup(Markup.inlineKeyboard([
             [Markup.button.callback("✅ Mark as Done", `task_done_${taskId}`)]
         ]).reply_markup).catch(()=>{});

         try {
             const { data: taskData } = await supabaseAdmin.from("tasks")
                .select("title, assigned_by, assignee_to_lookup:employees!tasks_assigned_to_fkey(name, companies(bot_language))")
                .eq("id", taskId).single();
             if (taskData && taskData.assigned_by) {
                 const { data: assigner } = await supabaseAdmin.from("employees").select("telegram_user_id").eq("id", taskData.assigned_by).single();
                 if (assigner?.telegram_user_id) {
                     const assigneeAny: any = taskData.assignee_to_lookup;
                     const assigneeObj = Array.isArray(assigneeAny) ? assigneeAny[0] : assigneeAny;
                     const lang = assigneeObj?.companies?.bot_language || 'en';
                     const msg = lang === 'ar' 
                       ? `⏳ <b>بدأ العمل:</b>\n${assigneeObj?.name} بدأ الآن بتنفيذ المهمة:\n"${taskData.title}"`
                       : `⏳ <b>Task Started:</b>\n${assigneeObj?.name} is now working on:\n"${taskData.title}"`;
                     bot.telegram.sendMessage(assigner.telegram_user_id, msg, { parse_mode: "HTML" }).catch(()=>{});
                 }
             }
         } catch(e) { console.error("Start hook ping error:", e); }
         return;
      }

      // COMPLETE TASK HOOK
      if (data && data.startsWith("task_done_")) {
         const taskId = data.replace("task_done_", "");
         await supabaseAdmin.from("tasks").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", taskId);
         
         await ctx.answerCbQuery("Completed!").catch(()=>{});
         
         // Remove buttons, keep original text but append status
         const oldText = ctx.callbackQuery.message?.text || "Task";
         await ctx.editMessageText(oldText + "\n\n✅ <b>COMPLETED</b>", { 
             parse_mode: "HTML", 
             reply_markup: { inline_keyboard: [] } 
         }).catch(()=>{});
         
         try {
             const { data: taskData } = await supabaseAdmin.from("tasks")
                .select("title, assigned_by, assignee_to_lookup:employees!tasks_assigned_to_fkey(name, companies(bot_language))")
                .eq("id", taskId).single();
             if (taskData && taskData.assigned_by) {
                 const { data: assigner } = await supabaseAdmin.from("employees").select("telegram_user_id").eq("id", taskData.assigned_by).single();
                 if (assigner?.telegram_user_id) {
                     const assigneeAny: any = taskData.assignee_to_lookup;
                     const assigneeObj = Array.isArray(assigneeAny) ? assigneeAny[0] : assigneeAny;
                     const lang = assigneeObj?.companies?.bot_language || 'en';
                     const msg = lang === 'ar' 
                       ? `✅ <b>مهمة منجزة:</b>\n${assigneeObj?.name} أتم بنجاح المهمة:\n"${taskData.title}"`
                       : `✅ <b>Task Completed:</b>\n${assigneeObj?.name} has successfully finished:\n"${taskData.title}"`;
                     bot.telegram.sendMessage(assigner.telegram_user_id, msg, { parse_mode: "HTML" }).catch(()=>{});
                 }
             }
         } catch(e) { console.error("Done hook ping error:", e); }
         return;
      }

      // DEADLINE (CALENDAR) SELECTION HOOK
      if (data && data.startsWith("tdate_")) {
         await ctx.answerCbQuery();
         const parts = data.split("_");
         const shortTaskId = parts[1];
         const offset = parts[2];
         
         const { data: executer } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", telegramUserId).eq("company_id", currentCompanyId).limit(1).single();
         if(!executer) return;
         const lang = (executer.companies as any).bot_language || 'en';

         // Find the exact task by its UUID short-ref
         const { data: matchedTasks } = await supabaseAdmin.from("tasks").select("id, assigned_to, title, deadline").eq("assigned_by", executer.id).order("created_at", { ascending: false }).limit(20);
         const targetTask = matchedTasks?.find(t => t.id.startsWith(shortTaskId));
         if (!targetTask) return ctx.editMessageText(lang === 'ar' ? "❌ لم يتم العثور على المهمة." : "❌ Task not found.");

         let deadlineObj = null;
         if (offset !== "skip") {
             const days = parseInt(offset);
             const d = new Date();
             d.setDate(d.getDate() + days);
             deadlineObj = d.toISOString().split("T")[0];
         }

         await supabaseAdmin.from("tasks").update({ deadline: deadlineObj }).eq("id", targetTask.id);
         await ctx.editMessageText(lang === 'ar' ? `✅ تم تحديد التسليم: ${deadlineObj || 'بدون موعد'}` : `✅ Deadline set to: ${deadlineObj || 'Skip'}`);

         // Ping Assignee Now!
         const { data: targetEmployee } = await supabaseAdmin.from("employees").select("telegram_user_id").eq("id", targetTask.assigned_to).single();
         if (targetEmployee && targetEmployee.telegram_user_id) {
            const notifyMsg = lang === 'ar' 
              ? `🔔 <b>مهمة جديدة أُسندت إليك!</b>\n\n👤 بواسطة: ${executer.name}\n📌 المهمة: ${targetTask.title}\n⏳ التسليم: ${deadlineObj || 'غير محدد'}`
              : `🔔 <b>New Task Assigned!</b>\n\n👤 By: ${executer.name}\n📌 Task: ${targetTask.title}\n⏳ Deadline: ${deadlineObj || 'N/A'}`;
            
            await bot.telegram.sendMessage(targetEmployee.telegram_user_id, notifyMsg, {
               parse_mode: "HTML",
               reply_markup: {
                  inline_keyboard: [[
                     Markup.button.callback(lang === 'ar' ? "⏳ قيد التنفيذ" : "⏳ Start Progress", `start_task_${targetTask.id}`),
                     Markup.button.callback(lang === 'ar' ? "✅ تم الإنجاز" : "✅ Mark as Done", `task_done_${targetTask.id}`)
                  ]]
               }
            }).catch(e => console.error("Could not notify assigned user:", e));
         }
         return;
      }
      
      // OPTION SELECT FOR FIELD REPORT
      if (data && data.startsWith("ropt_")) {
          const parts = data.split("_");
          const shortReportId = parts[1];
          const shortFieldId = parts[2];
          const optIndex = parseInt(parts[3], 10);
          
          await ctx.answerCbQuery().catch(()=>{});
          
          const telegramUserId = ctx.callbackQuery.from.id;
          const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", telegramUserId).eq("company_id", currentCompanyId).limit(1).single();
          if(!employee) return;
          const lang = (employee.companies as any).bot_language || 'en';

          const { data: reports } = await supabaseAdmin.from("reports").select("id, team_id").eq("employee_id", employee.id).eq("status", "draft");
          const draftReport = reports?.find(r => r.id.startsWith(shortReportId));
          if (!draftReport) {
              return ctx.editMessageText(lang === 'ar' ? "❌ لم يتم العثور على المسودة." : "❌ Draft not found.").catch(()=>{});
          }
          
          const { data: fields } = await supabaseAdmin.from("custom_fields").select("*").eq("team_id", draftReport.team_id);
          const matchedField = fields?.find(f => f.id.startsWith(shortFieldId));
          
          if (matchedField && matchedField.options) {
              const selectedValue = matchedField.options[optIndex];
              
              // Remove the keyboard inline buttons
              await ctx.editMessageText(`✅ ${matchedField.label}: ${selectedValue}`).catch(()=>{});
              
              await supabaseAdmin.from("report_values").insert({
                  report_id: draftReport.id,
                  field_id: matchedField.id,
                  value: selectedValue
              });
              
              // Move to next step!
              return runNextReportStep(ctx, employee, draftReport);
          }
      }
    });

    bot.on("text", async (ctx) => {
      const telegramUserId = ctx.from.id;
      const replyToMsg = ctx.message.reply_to_message;
      
      // TASK ASSIGNMENT HOOK (Step 2 -> 3)
      // TASK ASSIGNMENT HOOK (Drafting Phase)
      if (replyToMsg && "text" in replyToMsg && replyToMsg.text && replyToMsg.text.includes("[Ref:")) {
          const match = replyToMsg.text.match(/\[Ref:\s*([a-f0-9]{8})\]/);
          if (match) {
             const shortRef = match[1];
             const taskTitle = ctx.message.text.trim();
             const { data: sender } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", telegramUserId).eq("company_id", currentCompanyId).limit(1).single();
             if(!sender) return;
             const lang = (sender.companies as any).bot_language || 'en';

             // Reverse lookup the assignee using the Short Ref
             const { data: coworkers } = await supabaseAdmin.from("employees").select("id").eq("company_id", sender.company_id);
             const matchedCoworker = coworkers?.find(c => c.id.startsWith(shortRef));

             if (!matchedCoworker) {
                return ctx.reply(lang === 'ar' ? "❌ لم نتمكن من العثور على الموظف الهدف." : "❌ Could not verify assignee identity.");
             }

             // Immediately stage the task in the database
             const { data: insertedTask, error } = await supabaseAdmin.from("tasks").insert({
                company_id: sender.company_id,
                assigned_by: sender.id,
                assigned_to: matchedCoworker.id,
                title: taskTitle,
                status: 'pending' // Initially pending but undeclared deadline
             }).select("id").single();

             if (error || !insertedTask) {
                console.error("TASK_INSERT_ERROR", error);
                return ctx.reply(lang === 'ar' ? `❌ حدث خطأ داخلي. أعد المحاولة.\n(Error: ${error?.message || 'unknown'})` : `❌ Internal error creating task.\n(Error: ${error?.message || 'unknown'})`);
             }

             // Inline Keyboard for Deadline (Clean UX)
             const shortTaskId = insertedTask.id.substring(0, 8);
             
             const calButtons = [
                 [
                   Markup.button.callback(lang === 'ar' ? "📅 اليوم" : "📅 Today", `tdate_${shortTaskId}_0`),
                   Markup.button.callback(lang === 'ar' ? "📅 غداً" : "📅 Tomorrow", `tdate_${shortTaskId}_1`),
                   Markup.button.callback(lang === 'ar' ? "📅 الأسبوع القادم" : "📅 Next Week", `tdate_${shortTaskId}_7`)
                 ],
                 [
                   Markup.button.callback(lang === 'ar' ? "⏭️ بدون تحديد موعد (تخطي)" : "⏭️ Skip Deadline", `tdate_${shortTaskId}_skip`)
                 ]
             ];

             return ctx.reply(lang === 'ar'
               ? `تم حفظ المهمة. متى يجب تحديد التسليم؟ 👇`
               : `Task title saved. When is the deadline? 👇`,
               Markup.inlineKeyboard(calButtons)
             );
           }
      }

      // SALES REPORT FORM HOOK
      if (replyToMsg && "text" in replyToMsg && replyToMsg.text && replyToMsg.text.includes("[Report:")) {
          const match = replyToMsg.text.match(/\[Report:\s*([a-f0-9]{8})_([a-f0-9]{8}|notes)\]/);
          if (match) {
             const shortReportId = match[1];
             const targetFieldShort = match[2];
             const inputValue = ctx.message.text.trim();
             
             const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", telegramUserId).eq("company_id", currentCompanyId).limit(1).single();
             if(!employee) return;
             const lang = (employee.companies as any).bot_language || 'en';

             // Find the draft report
             const { data: reports } = await supabaseAdmin.from("reports").select("id, team_id").eq("employee_id", employee.id).eq("status", "draft");
             const draftReport = reports?.find(r => r.id.startsWith(shortReportId));
             
             if (!draftReport) return ctx.reply(lang === 'ar' ? "❌ لم يتم العثور على المسودة، قد تكون أُكملت مسبقاً." : "❌ Report draft not found or already completed.");

             if (targetFieldShort === "notes") {
                 const { data: tm } = await supabaseAdmin.from("teams").select("require_notes").eq("id", draftReport.team_id).single();
                 const noVariations = ["no", "none", "لا", "لا يوجد", "لايوجد"];
                 if (tm?.require_notes && noVariations.includes(inputValue.toLowerCase())) {
                     return ctx.reply(lang === 'ar' 
                        ? `❌ الملاحظات إجبارية في هذا الفريق. يرجى توضيح رسالة حقيقية:\n\n[Report: ${shortReportId}_notes]` 
                        : `❌ Notes are required for your team. Please elaborate:\n\n[Report: ${shortReportId}_notes]`,
                        { reply_markup: { force_reply: true } }
                     );
                 }
                 
                 await supabaseAdmin.from("reports").update({ notes: inputValue, status: 'completed' }).eq("id", draftReport.id);
                 return ctx.reply(lang === 'ar' ? "✅ تم تسجيل تقريرك الميداني بنجاح! شكراً لك." : "✅ Field report submitted successfully! Thank you.", getMainMenu(employee.companies));
             }

             // Find targeted field
             const { data: fields } = await supabaseAdmin.from("custom_fields").select("id, field_type").eq("team_id", draftReport.team_id);
             const matchedField = fields?.find(f => f.id.startsWith(targetFieldShort));

             if (matchedField) {
                 if (matchedField.field_type === 'number' && isNaN(Number(inputValue))) {
                     return ctx.reply(lang === 'ar' 
                        ? `❌ خطأ في الإدخال. الرجاء إدخال رقم صحيح:\n\n[Report: ${shortReportId}_${targetFieldShort}]` 
                        : `❌ Invalid input. Please enter a number:\n\n[Report: ${shortReportId}_${targetFieldShort}]`,
                        { reply_markup: { force_reply: true } }
                     );
                 }
                 await supabaseAdmin.from("report_values").insert({
                     report_id: draftReport.id,
                     field_id: matchedField.id,
                     value: inputValue
                 });
                 // Move to next step!
                 return runNextReportStep(ctx, employee, draftReport);
             }
          }
      }

      // Default Menu Handler for unknown inputs
      const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", telegramUserId).eq("company_id", currentCompanyId).limit(1).single();
      if (!employee) return;
      const lang = (employee.companies as any).bot_language || 'en';
      ctx.reply(lang === 'ar' ? "استخدم الحوار أعلاه لتعيين المهام، أو الأزرار للحضور." : "Please use the inline dialog to assign tasks, or menu buttons for attendance.", getMainMenu(employee.companies));
    });

    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
    
  } catch (err) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
