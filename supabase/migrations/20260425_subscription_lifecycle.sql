-- Migration: Subscription Lifecycle v2.5
-- Description: Unifies entitlements, implements Trial logic, and hardens access control.

-- 1. Ensure type constraints include 'trial' if they exist, or just allow it.
-- In our schema it was a TEXT field, so we just use it.

-- 2. Update New User Trigger to include Trial Entitlement
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Insert into companies
  INSERT INTO public.companies (name, owner_id, plan_id, subscription_status)
  VALUES (
    COALESCE(new.raw_user_meta_data->>'full_name', 'My') || '''s Company',
    new.id,
    'free',
    'active'
  )
  RETURNING id INTO v_company_id;

  -- Insert 7-day Trial of 'pro' plan into entitlements
  INSERT INTO public.user_entitlements (
    company_id, 
    type, 
    plan_id, 
    status, 
    start_at, 
    end_at, 
    source
  )
  VALUES (
    v_company_id,
    'trial',
    'pro', -- Let them taste the best features
    'active',
    NOW(),
    NOW() + INTERVAL '7 days',
    'admin'
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Unified Tier Resolution function (The SQL version of getCompanyAccess)
CREATE OR REPLACE FUNCTION get_active_tier_id(p_company_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_plan_id TEXT;
BEGIN
    -- Rank: LTD > Subscription > Trial > Free
    
    -- 1. Check LTD
    SELECT plan_id INTO v_plan_id FROM public.user_entitlements 
    WHERE company_id = p_company_id AND status = 'active' AND type = 'ltd' LIMIT 1;
    IF v_plan_id IS NOT NULL THEN RETURN v_plan_id; END IF;

    -- 2. Check Subscription
    SELECT plan_id INTO v_plan_id FROM public.user_entitlements 
    WHERE company_id = p_company_id AND status = 'active' AND type = 'subscription' 
    AND (end_at IS NULL OR end_at > NOW()) LIMIT 1;
    IF v_plan_id IS NOT NULL THEN RETURN v_plan_id; END IF;

    -- 3. Check Trial
    SELECT plan_id INTO v_plan_id FROM public.user_entitlements 
    WHERE company_id = p_company_id AND status = 'active' AND type = 'trial' 
    AND end_at > NOW() LIMIT 1;
    IF v_plan_id IS NOT NULL THEN RETURN v_plan_id; END IF;

    -- 4. Fallback to free
    RETURN 'free';
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Refactor Employee Limit Trigger to use the new Unified Resolution
CREATE OR REPLACE FUNCTION get_company_employee_limit(p_company_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_tier_id TEXT;
    v_limit INTEGER;
BEGIN
    v_tier_id := get_active_tier_id(p_company_id);

    -- Map tier to limits
    CASE v_tier_id
        WHEN 'basic' THEN v_limit := 10;
        WHEN 'pro' THEN v_limit := 30;
        WHEN 'business' THEN v_limit := 75;
        WHEN 'enterprise' THEN v_limit := 200;
        ELSE v_limit := 3; -- free or unknown
    END CASE;

    RETURN v_limit;
END;
$$ LANGUAGE plpgsql STABLE;
