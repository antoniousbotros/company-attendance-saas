import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import stripe, { STRIPE_PRICE_IDS } from "@/lib/stripe";
import { PLANS } from "@/lib/billing";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { owner_id, plan_id } = body;

    if (!owner_id || !plan_id) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    // Free plan needs no payment
    if (plan_id === "free") {
      return NextResponse.json({ ok: false, error: "Free plan requires no payment" }, { status: 400 });
    }

    const plan = PLANS[plan_id as keyof typeof PLANS];
    if (!plan) {
      return NextResponse.json({ ok: false, error: "Invalid plan" }, { status: 400 });
    }

    const priceId = STRIPE_PRICE_IDS[plan_id];
    if (!priceId) {
      return NextResponse.json(
        { ok: false, error: `Stripe Price ID not configured for plan: ${plan_id}. Set STRIPE_PRICE_${plan_id.toUpperCase()} in env vars.` },
        { status: 500 }
      );
    }

    // 1. Get company & owner email
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("id, name, stripe_customer_id")
      .eq("owner_id", owner_id)
      .single();

    if (!company) {
      return NextResponse.json({ ok: false, error: "Company not found" }, { status: 404 });
    }

    const { data: ownerAuth } = await supabaseAdmin.auth.admin.getUserById(owner_id);
    const email = ownerAuth?.user?.email ?? undefined;

    // 2. Reuse or create a Stripe Customer so payment methods are saved
    let customerId: string = company.stripe_customer_id ?? "";
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        name: company.name,
        metadata: { company_id: company.id, owner_id },
      });
      customerId = customer.id;
      // Persist customer ID immediately
      await supabaseAdmin
        .from("companies")
        .update({ stripe_customer_id: customerId })
        .eq("id", company.id);
    }

    // 3. Create a Stripe Checkout Session (hosted by Stripe — no PCI risk)
    const origin = req.headers.get("origin") ?? "https://www.yawmy.app";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/billing?cancelled=true`,
      // Embed plan & company so the webhook can act on this without DB lookups
      metadata: {
        company_id: company.id,
        plan_id,
        owner_id,
      },
      subscription_data: {
        metadata: {
          company_id: company.id,
          plan_id,
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ ok: true, url: session.url });

  } catch (err: any) {
    console.error("[billing/checkout] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
