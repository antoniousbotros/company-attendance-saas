import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCompanyAccess } from "@/lib/entitlements";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const access = await getCompanyAccess(company.id);
    return NextResponse.json(access);
    
  } catch (error: any) {
    console.error("Error fetching company access:", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
