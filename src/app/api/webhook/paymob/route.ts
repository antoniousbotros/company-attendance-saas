import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getPayMobClient } from "@/lib/paymob";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawUrl = new URL(req.url);
    const hmacParam = rawUrl.searchParams.get("hmac");
    const payload = await req.json();

    const paymob = getPayMobClient();

    // 1. Validate the Payload Origination securely
    const isValid = paymob.verifyHmac(payload.obj, hmacParam || payload.hmac || "");
    if (!isValid) {
      console.error("PayMob: Invalid HMAC Signature detected");
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { obj } = payload;
    const { success, id, order } = obj;
    const merchantOrderId = order.merchant_order_id; // e.g., SUB_companyid_timestamp

    if (!merchantOrderId || !merchantOrderId.startsWith("SUB_")) {
      return NextResponse.json({ ok: true, mssg: "Ignored non-subscription payload" });
    }

    const companyId = merchantOrderId.split("_")[1];

    if (success === true) {
      // Mark transation correctly handled
      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "completed",
          paymob_transaction_id: String(id),
          hmac_verified: true
        })
        .eq("merchant_order_id", merchantOrderId);
        
      // Elevate company database rules
      await supabaseAdmin
        .from("companies")
        .update({
          subscription_status: "active"
        })
        .eq("id", companyId);

    } else {
      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "failed",
          paymob_transaction_id: String(id),
          hmac_verified: true
        })
        .eq("merchant_order_id", merchantOrderId);
    }

    return NextResponse.json({ ok: true });

  } catch (err: any) {
    console.error("PayMob Webhook Processing Error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
