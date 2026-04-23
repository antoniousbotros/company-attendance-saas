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
        const paymentIntentId: string | null = session.payment_intent ?? null;

        // Check if transaction already exists (deduplication)
        const { data: existing } = await supabaseAdmin
          .from("subscriptions")
          .select("id")
          .or(`stripe_session_id.eq.${session.id}${paymentIntentId ? `,stripe_payment_intent_id.eq.${paymentIntentId}` : ""}`)
          .single();

        if (existing) {
          console.log(`[billing/webhook] Transaction ${session.id} already exists, skipping.`);
          break;
        }

        // Get current company state to detect downgrade
        const { data: comp } = await supabaseAdmin
          .from("companies")
          .select("plan_id")
          .eq("id", company_id)
          .single();

        const planOrder = ["free", "starter", "pro", "business", "enterprise"];
        const currentRank = planOrder.indexOf(comp?.plan_id || "free");
        const nextRank = planOrder.indexOf(plan_id);

        const isDowngrade = nextRank < currentRank;

        if (isDowngrade) {
          // It's a downgrade — set it as pending while keeping the current plan active
          await supabaseAdmin
            .from("companies")
            .update({ 
               pending_plan_id: plan_id,
               subscription_status: "active" 
            })
            .eq("id", company_id);
          console.log(`[billing/webhook] Downgrade detected: company=${company_id} plan=${plan_id} set as PENDING.`);
        } else {
          // It's an upgrade or same plan — activate immediately
          await supabaseAdmin
            .from("companies")
            .update({ 
               plan_id, 
               pending_plan_id: null,
               subscription_status: "active" 
            })
            .eq("id", company_id);
          console.log(`[billing/webhook] Plan activated immediately: company=${company_id} plan=${plan_id}`);
        }

        // Persist Stripe IDs
        try {
          const stripeUpdate: Record<string, string | null> = {};
          if (customerId) stripeUpdate.stripe_customer_id = customerId;
          if (subscriptionId) {
             stripeUpdate.stripe_subscription_id = subscriptionId;
             // Update period end from subscription
             const sub = await stripe.subscriptions.retrieve(subscriptionId) as any;
             stripeUpdate.current_period_end = new Date(sub.current_period_end * 1000).toISOString();
          }
          if (Object.keys(stripeUpdate).length > 0) {
            await supabaseAdmin.from("companies").update(stripeUpdate).eq("id", company_id);
          }
        } catch (e: any) { console.error("Stripe metadata update failed", e.message); }

        // Record the transaction
        await supabaseAdmin.from("subscriptions").insert({
          company_id,
          stripe_session_id: session.id,
          stripe_subscription_id: subscriptionId,
          stripe_payment_intent_id: paymentIntentId,
          amount: (session.amount_total ?? 0) / 100,
          currency: (session.currency ?? "egp").toUpperCase(),
          status: "succeeded",
          plan_id,
          started_at: new Date().toISOString(),
          // Use current_period_end if available
          ends_at: subscriptionId ? new Date(((await stripe.subscriptions.retrieve(subscriptionId)) as any).current_period_end * 1000).toISOString() : null
        });
        console.log(`[billing/webhook] Plan activation logic finished for company=${company_id}`);
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
        const paymentIntentId = invoice.payment_intent;
        
        // Deduplicate: check if this invoice was already processed (or session fulfilled it)
        const { data: existing } = await supabaseAdmin
          .from("subscriptions")
          .select("id")
          .or(`stripe_invoice_id.eq.${invoice.id},stripe_session_id.eq.${invoice.id}${paymentIntentId ? `,stripe_payment_intent_id.eq.${paymentIntentId}` : ""}`)
          .single();

        if (existing) {
          console.log(`[billing/webhook] Invoice ${invoice.id} already processed, skipping.`);
          break;
        }

        const subId = invoice.subscription;
        const sub = subId ? await stripe.subscriptions.retrieve(subId) : null;
        const company_id = sub?.metadata?.company_id;
        const plan_id = sub?.metadata?.plan_id;

        if (company_id) {
          const periodEnd = sub ? new Date((sub as any).current_period_end * 1000).toISOString() : null;
          
          await supabaseAdmin
            .from("companies")
            .update({ 
               subscription_status: "active",
               current_period_end: periodEnd 
            })
            .eq("id", company_id);

          // Log renewal
          await supabaseAdmin.from("subscriptions").insert({
            company_id,
            stripe_session_id: invoice.id, // Legacy mapping
            stripe_invoice_id: invoice.id,
            stripe_subscription_id: invoice.subscription,
            stripe_payment_intent_id: paymentIntentId,
            amount: (invoice.amount_paid ?? 0) / 100,
            currency: (invoice.currency ?? "egp").toUpperCase(),
            status: "succeeded",
            plan_id: plan_id ?? null,
            started_at: new Date(invoice.created * 1000).toISOString(),
            ends_at: periodEnd
          });
        }
        break;
      }

      // ── Subscription updated — handle scheduled plan changes ──────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as any;
        const { company_id, plan_id } = sub.metadata ?? {};
        
        if (company_id && plan_id) {
          // If the subscription is actually on the plan we wanted (e.g. downgrade target reached)
          // or if the subscription updated to a new plan ID
          const currentSubPlanId = sub.items.data[0].plan.metadata?.plan_id || sub.metadata?.plan_id;
          
          await supabaseAdmin
            .from("companies")
            .update({ 
              plan_id: currentSubPlanId || plan_id, 
              pending_plan_id: null,
              current_period_end: new Date((sub as any).current_period_end * 1000).toISOString()
            })
            .eq("id", company_id);
          
          console.log(`[billing/webhook] Subscription updated: company=${company_id} plan moved to ${currentSubPlanId}`);
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
