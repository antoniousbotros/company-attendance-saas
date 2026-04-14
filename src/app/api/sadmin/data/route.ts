import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    // 1. Verify Sadmin session
    const sessionCookie = req.cookies.get("sadmin_session");
    if (!sessionCookie || sessionCookie.value !== "authorized") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch all companies bypassing RLS
    // We join auth.users securely via RPC if needed, or if we have a view.
    // For now we get company owner ID and will fetch emails separately via admin api if needed.
    const { data: companies, error } = await supabaseAdmin
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Enhance with Emails
    const enhancedCompanies = await Promise.all(
       companies.map(async (c) => {
          const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(c.owner_id);
          return {
             ...c,
             ownerData: { email: user?.email }
          }
       })
    );

    return NextResponse.json({ ok: true, companies: enhancedCompanies });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
