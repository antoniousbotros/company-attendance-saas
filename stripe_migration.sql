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

-- Add payment_gateway control to pricing_config
ALTER TABLE pricing_config ADD COLUMN IF NOT EXISTS payment_gateway text DEFAULT 'stripe';
-- Set default for existing row
UPDATE pricing_config SET payment_gateway = 'stripe' WHERE id = '00000000-0000-0000-0000-000000000001' AND payment_gateway IS NULL;
