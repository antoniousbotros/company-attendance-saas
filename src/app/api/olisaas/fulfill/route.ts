import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { PLANS } from "@/lib/billing";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Security Layer: Validates the request authorization token against the env secret safely. */
function isAuthorized(authHeader: string | null): boolean {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  
  const token = authHeader.split(" ")[1];
  const secret = process.env.OLISAAS_FULFILLMENT_SECRET;
  
  if (!secret) {
    console.error("CRITICAL: OLISAAS_FULFILLMENT_SECRET is not configured.");
    return false;
  }
  
  try {
    const tokenBuffer = Buffer.from(token);
    const secretBuffer = Buffer.from(secret);
    return crypto.timingSafeEqual(tokenBuffer, secretBuffer);
  } catch (e) {
    // Fails on length mismatch naturally during timingSafeEqual buffer compare
    return false;
  }
}

/** Business Layer: Map Olisaas generic tier strings to our internal billing system. */
function mapTierIdToInternalPlan(externalTier: string): string {
  // Configurable mapping depending on what Olisaas sends
  const TIER_MAP: Record<string, string> = {
    'tier1': 'starter',
    'tier2': 'pro',
    'tier3': 'business',
    'tier4': 'enterprise',
    // Hard fallback mappings directly using Yawmy names
    'starter': 'starter',
    'pro': 'pro',
    'business': 'business',
    'enterprise': 'enterprise'
  };

  const internalTier = TIER_MAP[externalTier.toLowerCase()] || 'starter'; // safe fallback
  return Object.keys(PLANS).includes(internalTier) ? internalTier : 'free';
}

export async function POST(request: Request) {
  try {
    // 1. Security Check: Bearer Authorization
    const authHeader = request.headers.get("authorization");
    if (!isAuthorized(authHeader)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // 2. Parse Body & Prevent Replay Attacks
    const body = await request.json();
    const { email, tierId, productId, orderId, timestamp } = body;

    if (!email || !tierId || !orderId || !timestamp) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const requestTimeMs = Number(timestamp);
    const nowMs = Date.now();
    const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

    if (isNaN(requestTimeMs) || nowMs - requestTimeMs > MAX_AGE_MS) {
      return NextResponse.json({ error: "Request expired (replay protection)" }, { status: 401 });
    }

    // 3. User / Tenant Resolution (Admin API)
    // First, lookup user auth to prevent duplicates
    let targetUserId = "";
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("Olisaas User Lookup Error:", listError);
      return NextResponse.json({ error: "Internal Auth Error" }, { status: 500 });
    }

    const existingUser = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      targetUserId = existingUser.id;
    } else {
      // Auto-Provision Account
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        email_confirm: true, // Auto confirm so they can hit "Reset Password" later
        user_metadata: {
          source: "olisaas_ltd",
          full_name: "LTD User"
        }
      });

      if (createError || !newUser.user) {
        console.error("Olisaas User Genesis Error:", createError);
        return NextResponse.json({ error: "Failed to provision user" }, { status: 500 });
      }
      
      targetUserId = newUser.user.id;
      // Note: The Yawmy `handle_new_user` Postgres trigger fires automatically here!
      // We must wait briefly (1s) to allow the PgTrigger to stamp the 'companies' row.
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Lookup Company ID tied to User
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("id")
      .eq("owner_id", targetUserId)
      .single();

    if (companyError || !company) {
      console.error("Olisaas Company Match Error:", companyError);
      return NextResponse.json({ error: "Company tenant resolving failure" }, { status: 500 });
    }

    // 4. Map Tier and Execute Idempotent Postgres Lock
    const internalTierId = mapTierIdToInternalPlan(tierId);

    const { data: result, error: rpcError } = await supabaseAdmin.rpc("fulfill_olisaas_ltd", {
      p_company_id: company.id,
      p_tier_id: internalTierId,
      p_order_id: String(orderId).trim()
    });

    if (rpcError) {
      console.error("Olisaas Fulfillment RPC Error:", rpcError);
      return NextResponse.json({ error: "Database execution failure" }, { status: 500 });
    }

    if (!result.success) {
      return NextResponse.json({ error: "Failed idempotency or internal error" }, { status: 400 });
    }

    // 5. Success
    return NextResponse.json({ 
      success: true, 
      messageCode: result.status, // "activated" or "already_processed"
      tier: result.tier 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Olisaas fulfillment fatal:", error);
    return NextResponse.json({ error: "Fatal Internal Error" }, { status: 500 });
  }
}
