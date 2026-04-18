import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getTeamSession, getDistance } from "../../_helpers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getTeamSession(req);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const { lat, lng, dayType = "office" } = await req.json().catch(() => ({ lat: null, lng: null, dayType: "office" }));

    const { data: employee } = await supabaseAdmin
      .from("employees")
      .select("id, company_id, allowed_late_minutes, companies(enable_geofencing, office_lat, office_lng, office_radius, work_start_time, late_threshold, enable_wfh, wfh_ignore_late)")
      .eq("id", session.employee_id)
      .eq("company_id", session.company_id)
      .single();

    if (!employee) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const company = employee.companies as any;
    if (!company) return NextResponse.json({ ok: false, error: "Company not found" }, { status: 404 });

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // Check if already checked in or if Admin preemptively granted WFH
    const { data: existing } = await supabaseAdmin
      .from("attendance")
      .select("id, check_in, check_out, day_type")
      .eq("employee_id", session.employee_id)
      .eq("company_id", session.company_id)
      .eq("date", today)
      .single();

    if (existing?.check_in) {
      return NextResponse.json({ ok: false, error: "Already checked in today" }, { status: 400 });
    }

    const isAdminGrantedWfh = existing?.day_type === "wfh";
    const isWfh = isAdminGrantedWfh || (dayType === "wfh" && company.enable_wfh);

    // Geofencing check
    if (!isWfh && company.enable_geofencing) {
      if (!lat || !lng) {
        return NextResponse.json({ ok: false, error: "Location required" }, { status: 400 });
      }
      const dist = getDistance(lat, lng, company.office_lat, company.office_lng);
      const radius = company.office_radius || 200;
      if (dist > radius) {
        return NextResponse.json({
          ok: false,
          error: `You are ${Math.round(dist)}m away from the office. Must be within ${radius}m.`,
        }, { status: 403 });
      }
    }

    // Late calculation
    let isLate = false;
    let lateMins = 0;
    
    if (isWfh && company.wfh_ignore_late) {
        // Skip lateness check completely
    } else if (company.work_start_time) {
      const [startH, startM] = company.work_start_time.split(":").map(Number);
      const threshold = employee.allowed_late_minutes ?? company.late_threshold ?? 15;
      const workStart = new Date(now);
      workStart.setHours(startH, startM, 0, 0);
      if (now > workStart) {
        const diffMins = Math.floor((now.getTime() - workStart.getTime()) / 60000);
        if (diffMins > threshold) {
          isLate = true;
          lateMins = diffMins;
        }
      }
    }

    const status = isLate ? "late" : "present";
    await supabaseAdmin.from("attendance").upsert({
      employee_id: session.employee_id,
      company_id: session.company_id,
      date: today,
      check_in: now.toISOString(),
      status,
      late_minutes: lateMins,
      day_type: isWfh ? "wfh" : "office",
      source: "bot"
    });

    const timeStr = now.toLocaleTimeString("en-US", {
      timeZone: "Africa/Cairo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return NextResponse.json({ ok: true, time: timeStr, isLate, lateMins });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
