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

const getMainMenu = (enableGeofencing: boolean) => {
  if (enableGeofencing) {
    return Markup.keyboard([
      [Markup.button.locationRequest("📍 Send Location (Check In / Out)")],
      ["📊 My Attendance", "ℹ️ Help"]
    ]).resize();
  }
  return Markup.keyboard([
    ["✅ Check In", "🚪 Check Out"],
    ["📊 My Attendance", "ℹ️ Help"]
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
        return ctx.reply(
          `Welcome back, ${employee.name}! You are linked to ${employee.companies.name}.\n\nUse the buttons below to log your status.`,
          getMainMenu(employee.companies.enable_geofencing)
        );
      }

      return ctx.reply(
        "Welcome to the Attendance Bot! To get started, please share your contact so we can link your account.",
        Markup.keyboard([
          Markup.button.contactRequest("📱 Share Contact")
        ]).oneTime().resize()
      );
    });

    bot.on("contact", async (ctx) => {
      const contact = ctx.message.contact;
      const telegramUserId = ctx.from.id;
      
      if (!contact || contact.user_id !== telegramUserId) {
        return ctx.reply("Please share YOUR OWN contact.");
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

      await supabaseAdmin
        .from("employees")
        .update({ telegram_user_id: telegramUserId })
        .eq("id", employee.id);

      return ctx.reply(
        `Success! Your account is now linked to ${employee.companies.name}.\n\nYou can now use the check-in and check-out buttons.`,
        getMainMenu(employee.companies.enable_geofencing)
      );
    });

    const processAttendance = async (ctx: any, employee: any, explicitlyLocation: boolean = false) => {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const company = employee.companies;

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

        if (error) return ctx.reply("Error recording attendance. Please try again.");
        return ctx.reply(`✅ Checked In at ${now.toLocaleTimeString()}.${isLate ? `\n⚠️ You are ${lateMins} minutes late.` : ""}`);
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

        if (error) return ctx.reply("Error recording checkout. Please try again.");
        return ctx.reply(`🚪 Checked Out at ${now.toLocaleTimeString()}.\nTotal hours: ${diffHours}h`);
      }

      return ctx.reply("You have already completed your shift today!");
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

      const company = employee.companies;

      if (company.enable_geofencing) {
        if (!company.office_lat || !company.office_lng) {
          return ctx.reply("⚠️ Geofencing is enabled, but your company has not set up their office GPS coordinates yet.");
        }

        const distance = getDistance(latitude, longitude, company.office_lat, company.office_lng);

        if (distance > (company.office_radius || 200)) {
          return ctx.reply(`❌ Check in rejected. You are ${Math.round(distance)} meters away from the office.\nAllowed radius: ${company.office_radius || 200} meters.`);
        }
      }

      await processAttendance(ctx, employee, true);
    });

    bot.hears("✅ Check In", async (ctx) => {
      const userId = ctx.from.id;
      const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", userId).single();
      
      if (!employee) return ctx.reply("Please /start and link your account first.");
      if (employee.companies.enable_geofencing) {
        return ctx.reply("⚠️ Your company strictly requires GPS Location verification. Please use the '📍 Send Location' button.", getMainMenu(true));
      }

      const today = new Date().toISOString().split("T")[0];
      const { data: attendance } = await supabaseAdmin.from("attendance").select("*").eq("employee_id", employee.id).eq("date", today).single();
      if (attendance && attendance.check_in) {
        return ctx.reply(`You already checked in today at ${new Date(attendance.check_in).toLocaleTimeString()}.`);
      }

      await processAttendance(ctx, employee);
    });

    bot.hears("🚪 Check Out", async (ctx) => {
      const userId = ctx.from.id;
      const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", userId).single();
      
      if (!employee) return ctx.reply("Please /start and link your account first.");
      if (employee.companies.enable_geofencing) {
        return ctx.reply("⚠️ Your company strictly requires GPS Location verification. Please use the '📍 Send Location' button.", getMainMenu(true));
      }

      const today = new Date().toISOString().split("T")[0];
      const { data: attendance } = await supabaseAdmin.from("attendance").select("*").eq("employee_id", employee.id).eq("date", today).single();
      
      if (!attendance || !attendance.check_in) return ctx.reply("You haven't checked in yet today!");
      if (attendance.check_out) return ctx.reply(`You already checked out today at ${new Date(attendance.check_out).toLocaleTimeString()}.`);

      await processAttendance(ctx, employee);
    });

    bot.hears("📊 My Attendance", async (ctx) => {
      const userId = ctx.from.id;
      
      const { data: employee } = await supabaseAdmin
        .from("employees")
        .select("*, companies(*)")
        .eq("telegram_user_id", userId)
        .single();

      if (!employee) return ctx.reply("Please link your account first.");

      const { data: logs } = await supabaseAdmin
        .from("attendance")
        .select("*")
        .eq("employee_id", employee.id)
        .order("date", { ascending: false })
        .limit(5);

      if (!logs || logs.length === 0) return ctx.reply("No attendance records found.");

      let message = "📅 *Your Recent Attendance*\n\n";
      logs.forEach(log => {
        message += `${log.date}: ${log.status.toUpperCase()}\nIn: ${log.check_in ? new Date(log.check_in).toLocaleTimeString() : "-"} | Out: ${log.check_out ? new Date(log.check_out).toLocaleTimeString() : "-"}\n\n`;
      });

      return ctx.replyWithMarkdown(message, getMainMenu(employee.companies.enable_geofencing));
    });

    bot.on("text", async (ctx) => {
      const telegramUserId = ctx.from.id;
      const { data: employee } = await supabaseAdmin.from("employees").select("*, companies(*)").eq("telegram_user_id", telegramUserId).single();

      if (!employee) {
        return ctx.reply(
          "⚠️ For security reasons, we do not accept manually typed phone numbers.\n\nPlease tap the '📱 Share Contact' button at the bottom of your screen to verify your identity.",
          Markup.keyboard([Markup.button.contactRequest("📱 Share Contact")]).oneTime().resize()
        );
      }

      ctx.reply("Please use the menu buttons to log your attendance.", getMainMenu(employee.companies.enable_geofencing));
    });

    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
    
  } catch (err) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
