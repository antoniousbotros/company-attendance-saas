-- Add payment_intent deduplication
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

CREATE INDEX IF NOT EXISTS idx_subscriptions_pi ON public.subscriptions(stripe_payment_intent_id);
