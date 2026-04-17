import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getPayMobClient } from "@/lib/paymob";
import { PLANS } from "@/lib/billing";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { owner_id, plan_id, extra_cost = 0 } = body;

    if (!owner_id || !plan_id) {
      return NextResponse.json({ ok: false, error: "Missing required properties" }, { status: 400 });
    }

    const plan = PLANS[plan_id as keyof typeof PLANS];
    if (!plan) {
      return NextResponse.json({ ok: false, error: "Invalid plan" }, { status: 400 });
    }

    // Amount is standard price + extra employees cost. PayMob uses cents (piasters).
    const amountEGP = Number(plan.price) + Number(extra_cost);
    const amountCents = amountEGP * 100;

    const { data: company } = await supabaseAdmin.from("companies").select("*").eq("owner_id", owner_id).single();
    
    if (!company) {
      return NextResponse.json({ ok: false, error: "Company not found" }, { status: 404 });
    }

    const { data: owner } = await supabaseAdmin.auth.admin.getUserById(owner_id);
    const email = owner?.user?.email || "owner@yawmy.app";

    const paymob = getPayMobClient();
    const merchantOrderId = `SUB_${company.id}_${Date.now()}`;

    // Step 1: Authenticate
    const authData = await paymob.authenticate();

    // Step 2: Create Order
    const orderData = await paymob.createOrder({
      authToken: authData.token,
      amountCents,
      currency: "EGP",
      merchantOrderId
    });

    // Generate strict checkout sequence
    const billingData = {
      first_name: company.name.split(" ")[0] || "Yawmy",
      last_name: company.name.split(" ").slice(1).join(" ") || "Owner",
      email: email,
      phone_number: "+201000000000",
      apartment: "NA", floor: "NA", street: "NA", building: "NA", shipping_method: "NA",
      postal_code: "NA", city: "Cairo", country: "EGY", state: "Cairo"
    };

    // Step 3: Payment Key Generation
    const paymentKeyData = await paymob.getPaymentKey({
      authToken: authData.token,
      amountCents,
      orderId: orderData.id,
      currency: "EGP",
      billingData
    });

    const iframeUrl = paymob.getIframeUrl(paymentKeyData.token);

    // Persist Payment Intent
    await supabaseAdmin.from("subscriptions").insert({
      company_id: company.id,
      merchant_order_id: merchantOrderId,
      paymob_order_id: String(orderData.id),
      amount: amountEGP,
      currency: "EGP",
      status: "pending"
    });

    return NextResponse.json({
      ok: true,
      iframeUrl,
      merchantOrderId
    });

  } catch (err: any) {
    console.error("PayMob Checkout Exception:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
