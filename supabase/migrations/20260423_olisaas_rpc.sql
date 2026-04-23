-- Olisaas LTD Fulfillment DB Migration
-- Creates the idempotent webhook RPC for the marketplace.

CREATE OR REPLACE FUNCTION public.fulfill_olisaas_ltd(
    p_company_id UUID, 
    p_tier_id TEXT, 
    p_order_id TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing RECORD;
BEGIN
    -- Idempotency check lock: we ensure no concurrent webhook payload double-processes.
    SELECT * INTO v_existing FROM public.company_entitlements 
    WHERE company_id = p_company_id AND type = 'ltd'
    FOR UPDATE;

    IF v_existing.reference_id = p_order_id THEN
        RETURN jsonb_build_object('success', true, 'status', 'already_processed', 'tier', v_existing.tier_id);
    END IF;

    IF FOUND THEN
        -- Upgrade or replace existing LTD
        UPDATE public.company_entitlements
        SET tier_id = p_tier_id,
            reference_id = p_order_id,
            source = 'marketplace',
            status = 'active',
            created_at = NOW()
        WHERE id = v_existing.id;

        -- Prevent duplicates by maintaining immutable audit trail
        INSERT INTO public.entitlement_logs (company_id, action, metadata)
        VALUES (p_company_id, 'ltd_upgraded_olisaas', jsonb_build_object('order_id', p_order_id, 'old_tier', v_existing.tier_id, 'new_tier', p_tier_id));
        
    ELSE
        -- Upsert the LTD tier override for the company entirely
        INSERT INTO public.company_entitlements (company_id, tier_id, type, source, reference_id)
        VALUES (p_company_id, p_tier_id, 'ltd', 'marketplace', p_order_id);

        -- Preserve the audit trail
        INSERT INTO public.entitlement_logs (company_id, action, metadata)
        VALUES (p_company_id, 'ltd_activated_olisaas', jsonb_build_object('order_id', p_order_id, 'tier', p_tier_id));
    END IF;

    RETURN jsonb_build_object('success', true, 'status', 'activated', 'tier', p_tier_id);
END;
$$;
