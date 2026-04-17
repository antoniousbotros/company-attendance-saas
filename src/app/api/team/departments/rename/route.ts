import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { oldName, newName } = await req.json();

    if (!oldName || !newName || oldName === newName) {
      return NextResponse.json({ ok: false, error: "Invalid parameters" }, { status: 400 });
    }

    // Capture the company entity owned by active user
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("id, departments")
      .eq("owner_id", user.id)
      .single();

    if (!company) {
      return NextResponse.json({ ok: false, error: "No company found" }, { status: 404 });
    }

    // 1. Shift departments array
    const oldDepts = company.departments || [];
    if (!oldDepts.includes(oldName)) {
      return NextResponse.json({ ok: false, error: "Department not found" }, { status: 404 });
    }

    // Ensure we don't accidentally duplicate
    const newDeptsList = [...new Set(oldDepts.map((d: string) => d === oldName ? newName : d))];
    
    await supabaseAdmin
      .from("companies")
      .update({ departments: newDeptsList })
      .eq("id", company.id);

    // 2. Shift employees tied onto this sector
    await supabaseAdmin
      .from("employees")
      .update({ department: newName })
      .eq("department", oldName)
      .eq("company_id", company.id);

    // 3. Prevent broken announcement targets
    const { data: announcements } = await supabaseAdmin
      .from("announcements")
      .select("id")
      .eq("company_id", company.id);

    if (announcements && announcements.length > 0) {
      const annIds = announcements.map(a => a.id);
      await supabaseAdmin
        .from("announcement_targets")
        .update({ department: newName })
        .eq("department", oldName)
        .in("announcement_id", annIds);
    }

    return NextResponse.json({ ok: true, departments: newDeptsList });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
