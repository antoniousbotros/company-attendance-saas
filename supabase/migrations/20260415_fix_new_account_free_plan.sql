-- Fix: New accounts must start on the free plan with active status.
-- Updated 2026-04-23: Expanded valid plan IDs to include new pricing tiers
-- (basic, business) introduced in the Stripe billing update.

-- 1. Ensure column-level defaults match intent
ALTER TABLE public.companies
  ALTER COLUMN plan_id SET DEFAULT 'free',
  ALTER COLUMN subscription_status SET DEFAULT 'active';

-- 2. Rewrite trigger to explicitly set plan on new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.companies (name, owner_id, plan_id, subscription_status)
  VALUES (
    COALESCE(new.raw_user_meta_data->>'full_name', 'My') || '''s Company',
    new.id,
    'free',
    'active'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure existing accounts without a valid plan default to free/active
--    Valid plan IDs: free, basic, pro, business, enterprise
--    (old IDs: starter — now replaced by basic/business)
UPDATE public.companies
SET
  plan_id = 'free',
  subscription_status = 'active'
WHERE
  plan_id IS NULL
  OR plan_id NOT IN ('free', 'basic', 'pro', 'business', 'enterprise', 'starter');
