import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import stripe from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Stripe webhooks must receive the RAW body — do NOT parse as JSON before verifying
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  if (!webhookSecret) {
    console.error("[billing/webhook] STRIPE_WEBHOOK_SECRET is not configured.");
    return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    // Invalid signature — reject silently (could be a probe/attack)
    console.warn("[billing/webhook] Signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── Handle events ──────────────────────────────────────────────────────────
  try {
    switch (event.type) {

      // ── Payment succeeded — activate the plan ──────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const { company_id, plan_id } = session.metadata ?? {};

        if (!company_id || !plan_id) {
          console.error("[billing/webhook] checkout.session.completed: missing metadata", session.id);
          break;
        }

        const subscriptionId: string | null = session.subscription ?? null;
        const customerId: string | null = session.customer ?? null;

        // Activate plan — only use safe columns that always exist
        await supabaseAdmin
          .from("companies")
          .update({ plan_id, subscription_status: "active" })
          .eq("id", company_id);

        // Persist Stripe IDs — silently skip if migration columns don't exist yet
        try {
          const stripeUpdate: Record<string, string | null> = {};
          if (customerId) stripeUpdate.stripe_customer_id = customerId;
          if (subscriptionId) stripeUpdate.stripe_subscription_id = subscriptionId;
          if (Object.keys(stripeUpdate).length > 0) {
            await supabaseAdmin.from("companies").update(stripeUpdate).eq("id", company_id);
          }
        } catch { /* migration columns not added yet */ }

        // Record the transaction — use only original columns, add new ones safely
        try {
          await supabaseAdmin.from("subscriptions").insert({
            company_id,
            stripe_session_id: session.id,
            stripe_subscription_id: subscriptionId,
            amount: (session.amount_total ?? 0) / 100,
            currency: (session.currency ?? "egp").toUpperCase(),
            status: "succeeded",
            plan_id,
          });
        } catch {
          // Fallback: insert with only columns that definitely exist
          await supabaseAdmin.from("subscriptions").insert({
            company_id,
            amount: (session.amount_total ?? 0) / 100,
            currency: (session.currency ?? "egp").toUpperCase(),
            status: "succeeded",
          });
        }

        console.log(`[billing/webhook] Plan activated: company=${company_id} plan=${plan_id}`);
        break;
      }

      // ── Subscription cancelled / expired — downgrade to free ──────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        const { company_id } = sub.metadata ?? {};

        if (!company_id) {
          console.warn("[billing/webhook] customer.subscription.deleted: no company_id in metadata");
          break;
        }

        await supabaseAdmin
          .from("companies")
          .update({ plan_id: "free", subscription_status: "cancelled" })
          .eq("id", company_id);
        // Clear subscription ID if column exists
        try {
          await supabaseAdmin.from("companies").update({ stripe_subscription_id: null }).eq("id", company_id);
        } catch { /* migration not done */ }

        console.log(`[billing/webhook] Subscription cancelled — company ${company_id} moved to free.`);
        break;
      }

      // ── Renewal payment succeeded — keep subscription active ──────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        const sub = invoice.subscription
          ? await stripe.subscriptions.retrieve(invoice.subscription)
          : null;
        const company_id = sub?.metadata?.company_id;
        const plan_id = sub?.metadata?.plan_id;

        if (company_id) {
          await supabaseAdmin
            .from("companies")
            .update({ subscription_status: "active" })
            .eq("id", company_id);

          // Log renewal
          await supabaseAdmin.from("subscriptions").insert({
            company_id,
            stripe_session_id: invoice.id,
            stripe_subscription_id: invoice.subscription,
            amount: (invoice.amount_paid ?? 0) / 100,
            currency: (invoice.currency ?? "egp").toUpperCase(),
            status: "succeeded",
            plan_id: plan_id ?? null,
          });
        }
        break;
      }

      // ── Renewal payment failed — flag account ─────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const sub = invoice.subscription
          ? await stripe.subscriptions.retrieve(invoice.subscription)
          : null;
        const company_id = sub?.metadata?.company_id;

        if (company_id) {
          await supabaseAdmin
            .from("companies")
            .update({ subscription_status: "past_due" })
            .eq("id", company_id);
        }
        break;
      }

      default:
        // Ignore unhandled events
        break;
    }
  } catch (handlerErr: any) {
    console.error("[billing/webhook] Handler error:", handlerErr.message);
    // Return 200 so Stripe doesn't retry — the error is on our side
    return NextResponse.json({ received: true, warning: handlerErr.message });
  }

  return NextResponse.json({ received: true });
}
