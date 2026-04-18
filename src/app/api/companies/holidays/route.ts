import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const { data: userResp } = await supabaseAdmin.auth.getUser(token);
    const userId = userResp.user?.id;
    if (!userId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const { data: company } = await supabaseAdmin.from("companies").select("id").eq("owner_id", userId).single();
    if (!company) return NextResponse.json({ ok: false, error: "No company found" }, { status: 404 });

    const { data: holidays } = await supabaseAdmin
      .from("special_days")
      .select("*")
      .eq("company_id", company.id)
      .eq("type", "holiday")
      .order("date", { ascending: true });

    return NextResponse.json({ ok: true, holidays: holidays || [] });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const { data: userResp } = await supabaseAdmin.auth.getUser(token);
    const userId = userResp.user?.id;
    if (!userId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const { data: company } = await supabaseAdmin.from("companies").select("id").eq("owner_id", userId).single();
    if (!company) return NextResponse.json({ ok: false, error: "No company found" }, { status: 404 });

    const body = await req.json();
    const { date, note } = body;

    if (!date) return NextResponse.json({ ok: false, error: "Date is required" }, { status: 400 });

    const { error } = await supabaseAdmin.from("special_days").upsert({
      company_id: company.id,
      date,
      type: "holiday",
      note: note || ""
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const { data: userResp } = await supabaseAdmin.auth.getUser(token);
    const userId = userResp.user?.id;
    if (!userId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const { data: company } = await supabaseAdmin.from("companies").select("id").eq("owner_id", userId).single();
    if (!company) return NextResponse.json({ ok: false, error: "No company found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ ok: false, error: "ID is required" }, { status: 400 });

    const { error } = await supabaseAdmin.from("special_days").delete().eq("id", id).eq("company_id", company.id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
