import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  console.warn("[stripe.ts] STRIPE_SECRET_KEY is not set.");
}

const stripe = new Stripe(stripeKey || "no_stripe_key_provided", {
  apiVersion: "2026-03-25.dahlia",
});

export default stripe;

// ── Price ID map: plan → { monthly, yearly } ──────────────────────────────────
export const STRIPE_PRICE_IDS: Record<string, { monthly?: string; yearly?: string }> = {
  basic: {
    monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY,
    yearly:  process.env.STRIPE_PRICE_BASIC_YEARLY,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    yearly:  process.env.STRIPE_PRICE_PRO_YEARLY,
  },
  business: {
    monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
    yearly:  process.env.STRIPE_PRICE_BUSINESS_YEARLY,
  },
  enterprise: {
    monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
    yearly:  process.env.STRIPE_PRICE_ENTERPRISE_YEARLY,
  },
};

export function getStripePrice(planId: string, period: "monthly" | "yearly"): string | undefined {
  return STRIPE_PRICE_IDS[planId]?.[period];
}
