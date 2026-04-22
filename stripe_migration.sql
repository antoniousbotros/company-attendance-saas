-- Run this in your Supabase SQL Editor before deploying the Stripe integration
-- Adds Stripe-specific columns to companies and subscriptions tables

-- companies: store Stripe customer + subscription IDs for reuse
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS stripe_customer_id     text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- subscriptions: add Stripe columns alongside existing PayMob columns
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS stripe_session_id      text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS plan_id                text;

-- Optional: index for fast webhook lookups
CREATE INDEX IF NOT EXISTS idx_companies_stripe_customer_id
  ON companies(stripe_customer_id);
