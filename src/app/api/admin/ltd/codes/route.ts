import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Use the Service Role Key to bypass RLS for generating codes
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateCode(prefix: string) {
  // Generates a code like LTD-PRO-8F2A9B
  const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${randomSuffix}`;
}

export async function POST(request: Request) {
  try {
    // 1. In a production environment, verify the user is a Super Admin here.
    // For now, we assume the route is protected by standard Auth / Middleware.
    
    // Parse Input
    const body = await request.json();
    const { tier_id, quantity = 1, max_redemptions = 1 } = body;

    if (!tier_id || typeof quantity !== 'number' || quantity > 100) {
      return NextResponse.json({ error: "Invalid parameters. Max quantity is 100." }, { status: 400 });
    }

    const validTiers = ['starter', 'pro', 'business', 'enterprise'];
    if (!validTiers.includes(tier_id)) {
      return NextResponse.json({ error: "Invalid tier_id" }, { status: 400 });
    }

    const codesToInsert = [];
    for (let i = 0; i < quantity; i++) {
      codesToInsert.push({
        code: generateCode(`LTD-${tier_id.toUpperCase()}`),
        tier_id,
        max_redemptions,
        current_redemptions: 0,
        is_active: true
      });
    }

    const { data, error } = await supabaseAdmin
      .from("ltd_codes")
      .insert(codesToInsert)
      .select("code");

    if (error) {
      console.error("Failed to insert codes:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true, codes: data });

  } catch (err: any) {
    console.error("Admin LTD Gen Error:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
