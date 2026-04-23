import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get input
    const { code } = await request.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Invalid code format" }, { status: 400 });
    }

    // Identify user's company (Assuming owner_id = user.id)
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: "Company not found for user" }, { status: 404 });
    }

    // Securely call the Postgres RPC to redeem code using row locks
    const { data: result, error: rpcError } = await supabase.rpc("redeem_ltd_code", {
      p_code: code.trim(),
      p_company_id: company.id
    });

    if (rpcError) {
      console.error("LTD Redemption RPC Error:", rpcError);
      return NextResponse.json({ error: "Internal server error during redemption." }, { status: 500 });
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to redeem code" }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: result.message,
      tier: result.tier 
    });

  } catch (err: any) {
    console.error("LTD API Exception:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
