import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  // Warn clearly during dev — don't crash the build
  console.warn("[stripe.ts] STRIPE_SECRET_KEY is not set.");
}

// Singleton — reused across hot-reloads in dev, instantiated once in prod
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_missing", {
  apiVersion: "2026-03-25.dahlia",
});

export default stripe;

// ── Plan → Stripe Price ID map ────────────────────────────────────────────────
// Populated from env vars you set per plan in Stripe Dashboard.
// Each value is a recurring monthly Price ID (price_xxx).
export const STRIPE_PRICE_IDS: Record<string, string | undefined> = {
  starter:    process.env.STRIPE_PRICE_STARTER,
  pro:        process.env.STRIPE_PRICE_PRO,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
};
