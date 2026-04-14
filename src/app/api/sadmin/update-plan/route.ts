import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("sadmin_session");
    if (!sessionCookie || sessionCookie.value !== "authorized") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { companyId, newPlan, extendDays } = await req.json();

    if (!companyId || !newPlan) {
      return NextResponse.json({ ok: false, error: "Missing parameters" }, { status: 400 });
    }

    // Prepare update payload
    let payload: any = { plan_id: newPlan };

    if (extendDays > 0) {
       // Get current trial ends at 
       const { data: comp } = await supabaseAdmin.from("companies").select("trial_ends_at").eq("id", companyId).single();
       if (comp) {
          const currentEnd = comp.trial_ends_at ? new Date(comp.trial_ends_at) : new Date();
          const nextEnd = new Date(currentEnd);
          nextEnd.setDate(nextEnd.getDate() + extendDays);
          payload.trial_ends_at = nextEnd.toISOString();
       }
    }

    const { error } = await supabaseAdmin
      .from("companies")
      .update(payload)
      .eq("id", companyId);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
