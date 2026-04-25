-- The Entitlements View (Single Source of Truth)
-- Tailored to use `companies` and the existing `active_subscriptions` / `user_entitlements`
CREATE OR REPLACE VIEW active_entitlements_view AS
SELECT 
  c.id AS company_id,
  COALESCE(
    ltd.plan_id,                                       -- Priority 1: Lifetime Access
    sub.plan_id,                                       -- Priority 2: Active Subscription
    CASE WHEN c.trial_ends_at > now() THEN 'pro' END,  -- Priority 3: Active Trial (Defaults to Pro limits)
    'free'                                             -- Priority 4: Default Fallback
  ) as effective_plan,
  CASE 
    WHEN ltd.id IS NOT NULL THEN 'lifetime'
    WHEN sub.id IS NOT NULL THEN 'subscription'
    WHEN c.trial_ends_at > now() THEN 'trial'
    ELSE 'free'
  END as access_type,
  sub.current_period_end,
  c.trial_ends_at
FROM public.companies c
LEFT JOIN (SELECT * FROM public.user_entitlements WHERE type = 'ltd' AND status = 'active') ltd ON c.id = ltd.company_id
LEFT JOIN (SELECT * FROM public.active_subscriptions WHERE status IN ('active', 'past_due')) sub ON c.id = sub.company_id;
