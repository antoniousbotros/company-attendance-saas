import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import stripe from "@/lib/stripe";
import { BillingService } from "@/lib/billing/service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  // 1. Verify Signature
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.warn("[billing/webhook] Signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 2. Idempotency Check
  const isNew = await BillingService.startProcessing({
    provider: 'stripe',
    eventType: event.type,
    eventId: event.id,
    payload: event.data.object
  });

  if (!isNew) {
    console.log(`[billing/webhook] Event ${event.id} already processed, skipping.`);
    return NextResponse.json({ received: true, deduplicated: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const { company_id, plan_id, billing_cycle } = session.metadata ?? {};

        if (!company_id || !plan_id) break;

        const subId = session.subscription;
        const sub = subId ? await stripe.subscriptions.retrieve(subId) : null;
        
        // Use service to record and activate
        await BillingService.recordPayment({
            companyId: company_id,
            provider: 'stripe',
            providerPaymentId: session.id,
            amount: (session.amount_total ?? 0) / 100,
            currency: (session.currency ?? "egp").toUpperCase(),
            status: 'paid',
            planId: plan_id,
            billingCycle: billing_cycle
        });

        await BillingService.activateEntitlement({
            companyId: company_id,
            planId: plan_id,
            type: 'subscription',
            source: 'stripe',
            startAt: sub ? new Date((sub as any).current_period_start * 1000) : new Date(),
            endAt: sub ? new Date((sub as any).current_period_end * 1000) : null
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        const subId = invoice.subscription;
        if (!subId) break;

        const sub = await stripe.subscriptions.retrieve(subId) as any;
        const { company_id, plan_id } = sub.metadata ?? {};
        if (!company_id) break;

        await BillingService.recordPayment({
            companyId: company_id,
            provider: 'stripe',
            providerPaymentId: invoice.id,
            amount: (invoice.amount_paid ?? 0) / 100,
            currency: (invoice.currency ?? "egp").toUpperCase(),
            status: 'paid',
            planId: plan_id,
        });

        await BillingService.activateEntitlement({
            companyId: company_id,
            planId: plan_id ?? 'starter',
            type: 'subscription',
            source: 'stripe',
            startAt: new Date(invoice.period_start * 1000),
            endAt: new Date(invoice.period_end * 1000)
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        const { company_id } = sub.metadata ?? {};
        if (company_id) {
            await BillingService.activateEntitlement({
                companyId: company_id,
                planId: 'free',
                type: 'subscription',
                source: 'stripe',
                startAt: new Date(),
                status: 'expired'
            } as any);
        }
        break;
      }

      case "customer.subscription.updated": {
          const sub = event.data.object as any;
          const { company_id } = sub.metadata ?? {};
          if (!company_id) break;

          // Sync period shifts or plan changes
          await BillingService.activateEntitlement({
              companyId: company_id,
              planId: (sub as any).metadata.plan_id || 'starter',
              type: 'subscription',
              source: 'stripe',
              startAt: new Date((sub as any).current_period_start * 1000),
              endAt: new Date((sub as any).current_period_end * 1000)
          });
          break;
      }
    }

    await BillingService.finishProcessing(event.id);
    return NextResponse.json({ received: true });

  } catch (err: any) {
    console.error("[billing/webhook] Processing error:", err.message);
    return NextResponse.json({ received: true, error: err.message });
  }
}
