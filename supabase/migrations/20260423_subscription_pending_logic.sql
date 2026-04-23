-- Subscription Logic Enhancement
-- 1. Add tracking for pending plan and period ends
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS pending_plan_id TEXT,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- 2. Enhance subscriptions table with activation/expiration dates and better status tracking
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT,
ADD COLUMN IF NOT EXISTS plan_id TEXT;

-- 3. Update existing statuses to be more consistent
-- (Optional: cleanup if needed)

-- 4. Enable RLS on subscriptions (already enabled, but ensure performance)
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_session ON public.subscriptions(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_invoice ON public.subscriptions(stripe_invoice_id);
