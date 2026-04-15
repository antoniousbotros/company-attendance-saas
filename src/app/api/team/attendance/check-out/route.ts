import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getTeamSession, getDistance } from "../../_helpers";

export async function POST(req: NextRequest) {
  const session = await getTeamSession(req);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const { lat, lng } = await req.json().catch(() => ({ lat: null, lng: null }));

    const { data: employee } = await supabaseAdmin
      .from("employees")
      .select("id, companies(enable_geofencing, office_lat, office_lng, office_radius)")
      .eq("id", session.employee_id)
      .eq("company_id", session.company_id)
      .single();

    if (!employee) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const company = employee.companies as any;
    if (!company) return NextResponse.json({ ok: false, error: "Company not found" }, { status: 404 });

    if (company.enable_geofencing) {
      if (!lat || !lng) {
        return NextResponse.json({ ok: false, error: "Location required" }, { status: 400 });
      }
      const dist = getDistance(lat, lng, company.office_lat, company.office_lng);
      const radius = company.office_radius || 200;
      if (dist > radius) {
        return NextResponse.json({
          ok: false,
          error: `You are ${Math.round(dist)}m away. Must be within ${radius}m.`,
        }, { status: 403 });
      }
    }

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    const { data: attendance } = await supabaseAdmin
      .from("attendance")
      .select("id, check_in, check_out")
      .eq("employee_id", session.employee_id)
      .eq("company_id", session.company_id)
      .eq("date", today)
      .single();

    if (!attendance?.check_in) {
      return NextResponse.json({ ok: false, error: "You haven't checked in yet" }, { status: 400 });
    }
    if (attendance.check_out) {
      return NextResponse.json({ ok: false, error: "Already checked out today" }, { status: 400 });
    }

    const checkIn = new Date(attendance.check_in);
    const diffHours = Math.round(((now.getTime() - checkIn.getTime()) / (1000 * 60 * 60)) * 100) / 100;

    await supabaseAdmin
      .from("attendance")
      .update({ check_out: now.toISOString(), working_hours: diffHours })
      .eq("id", attendance.id);

    const timeStr = now.toLocaleTimeString("en-US", {
      timeZone: "Africa/Cairo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return NextResponse.json({ ok: true, time: timeStr, hours: diffHours });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
