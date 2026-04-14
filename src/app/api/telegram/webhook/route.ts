import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { Telegraf, Markup } from "telegraf";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      console.error("No token provided");
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const bot = new Telegraf(token);

    // Define the main menu
    const mainMenu = Markup.keyboard([
      ["✅ Check In", "🚪 Check Out"],
      ["📊 My Attendance", "ℹ️ Help"]
    ]).resize();

    bot.start(async (ctx) => {
      const telegramUserId = ctx.from.id;
      
      // Check if already linked
      const { data: employee } = await supabaseAdmin
        .from("employees")
        .select("*, companies(name)")
        .eq("telegram_user_id", telegramUserId)
        .single();

      if (employee) {
        return ctx.reply(
          `Welcome back, ${employee.name}! You are linked to ${employee.companies.name}.\n\nUse the buttons below to log your status.`,
          mainMenu
        );
      }

      // Not linked, ask for phone number
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

      // Extract last 9 digits to cleanly ignore country codes and leading zeroes
      const fullPhone = contact.phone_number.replace(/\D/g, "");
      const last9digits = fullPhone.slice(-9);

      const { data: employees, error } = await supabaseAdmin
        .from("employees")
        .select("*, companies(name)")
        .ilike("phone", `%${last9digits}`);

      const employee = employees?.[0]; // take the first match

      if (error || !employee) {
        return ctx.reply(`Sorry, your phone number (ending in ${last9digits}) is not registered in our system.\n\nPlease ask your administrator to add your phone number.`);
      }

      // Officially link them now that we found a match
      await supabaseAdmin
        .from("employees")
        .update({ telegram_user_id: telegramUserId })
        .eq("id", employee.id);

      return ctx.reply(
        `Success! Your account is now linked to ${employee.companies.name}.\n\nYou can now use the check-in and check-out buttons.`,
        mainMenu
      );
    });

    bot.hears("✅ Check In", async (ctx) => {
      const userId = ctx.from.id;
      const now = new Date();
      const today = now.toISOString().split("T")[0];

      const { data: employee } = await supabaseAdmin
        .from("employees")
        .select("*, companies(*)")
        .eq("telegram_user_id", userId)
        .single();

      if (!employee) return ctx.reply("Please /start and link your account first.");

      const company = employee.companies;

      // Check if already checked in today
      const { data: existing } = await supabaseAdmin
        .from("attendance")
        .select("*")
        .eq("employee_id", employee.id)
        .eq("date", today)
        .single();

      if (existing && existing.check_in) {
        return ctx.reply(`You already checked in today at ${new Date(existing.check_in).toLocaleTimeString()}.`);
      }

      // Calculate Late Status based on Company Working Hours
      let isLate = false;
      if (company.work_start_time) {
        const [startH, startM] = company.work_start_time.split(':').map(Number);
        const thresholdMin = company.late_threshold || 15;
        
        // Create a date object for today at the start time
        const workStart = new Date(now);
        workStart.setHours(startH, startM + thresholdMin, 0, 0);

        if (now > workStart) {
          isLate = true;
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
          status: status
        });

      if (error) return ctx.reply("Error recording attendance. Please try again.");

      return ctx.reply(`✅ Checked In at ${now.toLocaleTimeString()}.${isLate ? " (Marked as Late)" : ""}`);
    });

    bot.hears("🚪 Check Out", async (ctx) => {
      const userId = ctx.from.id;
      const now = new Date();
      const today = now.toISOString().split("T")[0];

      const { data: employee } = await supabaseAdmin
        .from("employees")
        .select("*")
        .eq("telegram_user_id", userId)
        .single();

      if (!employee) return ctx.reply("Please /start and link your account first.");

      const { data: attendance } = await supabaseAdmin
        .from("attendance")
        .select("*")
        .eq("employee_id", employee.id)
        .eq("date", today)
        .single();

      if (!attendance || !attendance.check_in) {
        return ctx.reply("You haven't checked in yet today!");
      }

      if (attendance.check_out) {
        return ctx.reply(`You already checked out today at ${new Date(attendance.check_out).toLocaleTimeString()}.`);
      }

      // Calculate working hours
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
    });

    bot.hears("📊 My Attendance", async (ctx) => {
      const userId = ctx.from.id;
      
      const { data: employee } = await supabaseAdmin
        .from("employees")
        .select("*")
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

      return ctx.replyWithMarkdown(message);
    });

    bot.on("text", async (ctx) => {
      const telegramUserId = ctx.from.id;
      
      const { data: employee } = await supabaseAdmin
        .from("employees")
        .select("id")
        .eq("telegram_user_id", telegramUserId)
        .single();

      if (!employee) {
        return ctx.reply(
          "⚠️ For security reasons, we do not accept manually typed phone numbers.\n\nPlease tap the '📱 Share Contact' button at the bottom of your screen to verify your identity.",
          Markup.keyboard([
            Markup.button.contactRequest("📱 Share Contact")
          ]).oneTime().resize()
        );
      }

      ctx.reply("Please use the menu buttons to log your attendance.", mainMenu);
    });

    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
    
  } catch (err) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
