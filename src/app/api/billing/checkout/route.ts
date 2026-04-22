import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import stripe, { STRIPE_PRICE_IDS } from "@/lib/stripe";
import { PLANS } from "@/lib/billing";

export const dynamic = "force-dynamic";

const CONFIG_ID = "00000000-0000-0000-0000-000000000001";

// ── Read active gateway from sadmin pricing_config ────────────────────────────
async function getActiveGateway(): Promise<"stripe" | "paymob"> {
  try {
    const { data } = await supabaseAdmin
      .from("pricing_config")
      .select("payment_gateway")
      .eq("id", CONFIG_ID)
      .single();
    return (data?.payment_gateway as "stripe" | "paymob") ?? "stripe";
  } catch {
    return "stripe"; // default
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { owner_id, plan_id } = body;

    if (!owner_id || !plan_id) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }
    if (plan_id === "free") {
      return NextResponse.json({ ok: false, error: "Free plan requires no payment" }, { status: 400 });
    }

    const plan = PLANS[plan_id as keyof typeof PLANS];
    if (!plan) {
      return NextResponse.json({ ok: false, error: "Invalid plan" }, { status: 400 });
    }

    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("id, name, stripe_customer_id")
      .eq("owner_id", owner_id)
      .single();
    if (!company) {
      return NextResponse.json({ ok: false, error: "Company not found" }, { status: 404 });
    }

    const gateway = await getActiveGateway();

    // ── STRIPE ────────────────────────────────────────────────────────────────
    if (gateway === "stripe") {
      const priceId = STRIPE_PRICE_IDS[plan_id];
      if (!priceId) {
        return NextResponse.json(
          { ok: false, error: `Stripe Price ID not configured for plan: ${plan_id}. Set STRIPE_PRICE_${plan_id.toUpperCase()} in Vercel env vars.` },
          { status: 500 }
        );
      }

      const { data: ownerAuth } = await supabaseAdmin.auth.admin.getUserById(owner_id);
      const email = ownerAuth?.user?.email ?? undefined;

      let customerId: string = company.stripe_customer_id ?? "";
      if (!customerId) {
        const customer = await stripe.customers.create({
          email,
          name: company.name,
          metadata: { company_id: company.id, owner_id },
        });
        customerId = customer.id;
        await supabaseAdmin
          .from("companies")
          .update({ stripe_customer_id: customerId })
          .eq("id", company.id);
      }

      const origin = req.headers.get("origin") ?? "https://www.yawmy.app";
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/billing?cancelled=true`,
        metadata: { company_id: company.id, plan_id, owner_id },
        subscription_data: { metadata: { company_id: company.id, plan_id } },
        allow_promotion_codes: true,
      });

      return NextResponse.json({ ok: true, url: session.url, gateway: "stripe" });
    }

    // ── PAYMOB ────────────────────────────────────────────────────────────────
    if (gateway === "paymob") {
      try {
        const { getPayMobClient } = await import("@/lib/paymob");
        const { data: ownerAuth } = await supabaseAdmin.auth.admin.getUserById(owner_id);
        const email = ownerAuth?.user?.email ?? "owner@yawmy.app";

        const amountEGP = Number(plan.price) + Number(body.extra_cost ?? 0);
        const amountCents = amountEGP * 100;
        const paymob = getPayMobClient();
        const merchantOrderId = `SUB_${company.id}_${Date.now()}`;

        const authData = await paymob.authenticate();
        const orderData = await paymob.createOrder({
          authToken: authData.token, amountCents, currency: "EGP", merchantOrderId,
        });

        const billingData = {
          first_name: company.name.split(" ")[0] || "Yawmy",
          last_name: company.name.split(" ").slice(1).join(" ") || "Owner",
          email,
          phone_number: "+201000000000",
          apartment: "NA", floor: "NA", street: "NA", building: "NA",
          shipping_method: "NA", postal_code: "NA", city: "Cairo", country: "EGY", state: "Cairo",
        };

        const paymentKeyData = await paymob.getPaymentKey({
          authToken: authData.token, amountCents, orderId: orderData.id, currency: "EGP", billingData,
        });

        const iframeUrl = paymob.getIframeUrl(paymentKeyData.token);

        await supabaseAdmin.from("subscriptions").insert({
          company_id: company.id,
          merchant_order_id: merchantOrderId,
          paymob_order_id: String(orderData.id),
          amount: amountEGP,
          currency: "EGP",
          status: "pending",
        });

        // Return both for billing page compatibility
        return NextResponse.json({ ok: true, url: iframeUrl, iframeUrl, gateway: "paymob" });
      } catch (err: any) {
        console.error("[billing/checkout] PayMob error:", err);
        return NextResponse.json({ ok: false, error: `PayMob error: ${err.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: false, error: "Unknown gateway" }, { status: 500 });

  } catch (err: any) {
    console.error("[billing/checkout] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
