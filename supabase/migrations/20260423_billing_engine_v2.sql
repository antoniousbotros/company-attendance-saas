-- 1. Webhook Logs for Idempotency
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL, -- 'stripe', 'paymob'
    event_type TEXT NOT NULL,
    event_id TEXT UNIQUE NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Payments (The Financial Ledger)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_payment_id TEXT UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'EGP',
    status TEXT NOT NULL, -- 'paid', 'failed', 'pending'
    plan_id TEXT,
    billing_cycle TEXT, -- 'monthly', 'yearly'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Active Subscriptions (State of recurring billing)
CREATE TABLE IF NOT EXISTS public.active_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_subscription_id TEXT UNIQUE,
    plan_id TEXT NOT NULL,
    billing_cycle TEXT NOT NULL,
    status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing'
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. User Entitlements (The Access Authority)
CREATE TABLE IF NOT EXISTS public.user_entitlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'subscription', 'ltd'
    plan_id TEXT NOT NULL,
    status TEXT NOT NULL, -- 'active', 'expired', 'revoked'
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ, -- NULL for LTD
    source TEXT NOT NULL, -- 'stripe', 'paymob', 'ltd_code', 'admin'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON public.webhook_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_company_id ON public.payments(company_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_company_active ON public.user_entitlements(company_id, status);

-- Enable RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Owner viewing)
CREATE POLICY "Owners can view their own payments" ON public.payments
    FOR SELECT USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

CREATE POLICY "Owners can view their own entitlements" ON public.user_entitlements
    FOR SELECT USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

-- INITIAL MIGRATION: Populate entitlements from existing companies
INSERT INTO public.user_entitlements (company_id, type, plan_id, status, start_at, end_at, source)
SELECT 
    id, 
    'subscription', 
    COALESCE(plan_id, 'free'), 
    'active', 
    created_at, 
    current_period_end, 
    'admin'
FROM public.companies
ON CONFLICT DO NOTHING;
