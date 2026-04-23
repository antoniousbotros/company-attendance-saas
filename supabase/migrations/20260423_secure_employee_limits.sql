-- Migration: Secure Employee Plan Limits
-- Description: Creates a secure BEFORE INSERT trigger on employees to prevent exceeding the plan limit natively, solving the frontend bypass vulnerability.

CREATE OR REPLACE FUNCTION get_company_employee_limit(p_company_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_tier_id TEXT;
    v_limit INTEGER;
BEGIN
    -- 1. Check LTD overrides first
    SELECT tier_id INTO v_tier_id
    FROM public.company_entitlements
    WHERE company_id = p_company_id AND status = 'active'
    LIMIT 1;

    -- 2. Fallback to subscription plan if no LTD exists
    IF v_tier_id IS NULL THEN
        SELECT plan_id INTO v_tier_id
        FROM public.companies
        WHERE id = p_company_id
        AND subscription_status IN ('active', 'trialing');
        
        IF v_tier_id IS NULL THEN
            v_tier_id := 'free';
        END IF;
    END IF;

    -- Map tier to limits based on hardcoded billing.ts logic
    CASE v_tier_id
        WHEN 'basic' THEN v_limit := 10;
        WHEN 'starter' THEN v_limit := 10;
        WHEN 'pro' THEN v_limit := 30;
        WHEN 'business' THEN v_limit := 75;
        WHEN 'enterprise' THEN v_limit := 200;
        ELSE v_limit := 3; -- free or unknown
    END CASE;

    RETURN v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_employee_limit_before_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_current_count INTEGER;
    v_limit INTEGER;
BEGIN
    -- Get current count for this company
    SELECT COUNT(id) INTO v_current_count
    FROM public.employees
    WHERE company_id = NEW.company_id;

    -- Get plan limit safely natively
    v_limit := get_company_employee_limit(NEW.company_id);

    IF v_current_count >= v_limit THEN
        RAISE EXCEPTION 'Employee plan limit reached. Current: %, Limit: %', v_current_count, v_limit USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_employee_limit ON public.employees;

CREATE TRIGGER trg_check_employee_limit
BEFORE INSERT ON public.employees
FOR EACH ROW
EXECUTE FUNCTION check_employee_limit_before_insert();
