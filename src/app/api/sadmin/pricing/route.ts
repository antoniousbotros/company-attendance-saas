import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const CONFIG_ID = "00000000-0000-0000-0000-000000000001";

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get("sadmin_session");
  if (!sessionCookie || sessionCookie.value !== "authorized") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("pricing_config")
    .select("*")
    .eq("id", CONFIG_ID)
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, config: data });
  // Note: data includes payment_gateway field from DB
}

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("sadmin_session");
    if (!sessionCookie || sessionCookie.value !== "authorized") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { plans, features, features_ar, extra_employee_cost } = body;

    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (plans !== undefined) payload.plans = plans;
    if (features !== undefined) payload.features = features;
    if (features_ar !== undefined) payload.features_ar = features_ar;
    if (extra_employee_cost !== undefined) payload.extra_employee_cost = extra_employee_cost;
    if (body.payment_gateway !== undefined) payload.payment_gateway = body.payment_gateway;

    const { error } = await supabaseAdmin
      .from("pricing_config")
      .update(payload)
      .eq("id", CONFIG_ID);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
