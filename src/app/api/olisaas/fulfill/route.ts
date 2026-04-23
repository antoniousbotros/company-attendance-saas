import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { PLANS } from "@/lib/billing";
import stripe from "@/lib/stripe";
import { BillingService } from "@/lib/billing/service";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Security Layer: Validates the request authorization token against the env secret safely. */
function isAuthorized(authHeader: string | null): boolean {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  
  const token = authHeader.split(" ")[1];
  const secret = process.env.OLISAAS_FULFILLMENT_SECRET;
  
  if (!secret) return false;
  
  try {
    const tokenBuffer = Buffer.from(token);
    const secretBuffer = Buffer.from(secret);
    return crypto.timingSafeEqual(tokenBuffer, secretBuffer);
  } catch (e) {
    return false;
  }
}

/** Business Layer: Map Olisaas generic tier strings to our internal billing system. */
function mapTierIdToInternalPlan(externalTier: string): string {
  const TIER_MAP: Record<string, string> = {
    'tier1': 'starter',
    'tier2': 'pro',
    'tier3': 'business',
    'tier4': 'enterprise',
    'starter': 'starter',
    'pro': 'pro',
    'business': 'business',
    'enterprise': 'enterprise'
  };

  const internalTier = TIER_MAP[externalTier.toLowerCase()] || 'starter'; 
  return Object.keys(PLANS).includes(internalTier) ? internalTier : 'free';
}

export async function POST(request: Request) {
  try {
    // 1. Security Check
    const authHeader = request.headers.get("authorization");
    if (!isAuthorized(authHeader)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // 2. Parse Body & Idempotency
    const body = await request.json();
    const { email, tierId, orderId, timestamp } = body;

    if (!email || !tierId || !orderId || !timestamp) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Idempotency check via BillingService Webhook Logs
    const isNew = await BillingService.startProcessing({
        provider: 'paymob', // Or 'olisaas' but we map it to paymob for ledger
        eventType: 'fulfillment',
        eventId: String(orderId),
        payload: body
    });

    if (!isNew) {
        return NextResponse.json({ success: true, message: "Already processed" });
    }

    // 3. User / Tenant Resolution
    let targetUserId = "";
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) return NextResponse.json({ error: "Internal Auth Error" }, { status: 500 });

    const existingUser = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      targetUserId = existingUser.id;
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        email_confirm: true,
        user_metadata: { source: "olisaas_ltd", full_name: "LTD User" }
      });

      if (createError || !newUser.user) return NextResponse.json({ error: "Failed to provision user" }, { status: 500 });
      targetUserId = newUser.user.id;
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("id")
      .eq("owner_id", targetUserId)
      .single();

    if (companyError || !company) return NextResponse.json({ error: "Company tenant resolving failure" }, { status: 500 });

    // 4. Execute Entitlement Activation
    const internalTierId = mapTierIdToInternalPlan(tierId);

    await BillingService.activateEntitlement({
        companyId: company.id,
        planId: internalTierId,
        type: 'ltd',
        source: 'paymob', // Olisaas orders are processed through the Paymob integration channel
        startAt: new Date(),
        endAt: null
    });

    // Cleanup existing subs
    const { data: activeSubs } = await supabaseAdmin
        .from("active_subscriptions")
        .select("id, provider_subscription_id")
        .eq("company_id", company.id)
        .eq("status", "active");

    if (activeSubs && activeSubs.length > 0) {
       for (const sub of activeSubs) {
           if (sub.provider_subscription_id) {
               try { await stripe.subscriptions.cancel(sub.provider_subscription_id); } catch (e) {}
           }
       }
       await supabaseAdmin.from("active_subscriptions").update({ status: "canceled" }).eq("company_id", company.id);
    }

    await BillingService.finishProcessing(String(orderId));

    return NextResponse.json({ success: true, tier: internalTierId }, { status: 200 });

  } catch (error: any) {
    console.error("Olisaas fulfillment fatal:", error);
    return NextResponse.json({ error: "Fatal Internal Error" }, { status: 500 });
  }
}
