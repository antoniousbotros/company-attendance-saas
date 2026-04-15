-- Fix: New accounts must start on the free plan with active status.
-- The previous trigger did not explicitly set plan_id/subscription_status,
-- relying on column defaults which may have drifted. This migration hardens
-- the defaults AND rewrites the trigger to be explicit.

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

-- 3. Ensure existing accounts without a plan default to free/active
UPDATE public.companies
SET
  plan_id = 'free',
  subscription_status = 'active'
WHERE
  plan_id IS NULL
  OR plan_id NOT IN ('free', 'starter', 'pro', 'enterprise');
