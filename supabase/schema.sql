-- TABLES
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
    plan_id TEXT DEFAULT 'starter' CHECK (plan_id IN ('starter', 'growth', 'pro', 'enterprise')),
    subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled')),
    onboarding_step INTEGER DEFAULT 1,
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
    current_period_end TIMESTAMP WITH TIME ZONE,
    telegram_token TEXT,
    bot_name TEXT,
    work_start_time TIME DEFAULT '09:00',
    work_end_time TIME DEFAULT '17:00',
    late_threshold INTEGER DEFAULT 15,
    office_lat DOUBLE PRECISION,
    office_lng DOUBLE PRECISION,
    office_radius INTEGER DEFAULT 200,
    enable_geofencing BOOLEAN DEFAULT false,
    -- Payroll & HR Settings
    bot_language VARCHAR(2) DEFAULT 'en',
    working_days JSONB DEFAULT '["Sunday","Monday","Tuesday","Wednesday","Thursday"]'::jsonb,
    holidays JSONB DEFAULT '[]'::jsonb,
    late_penalty_per_minute DECIMAL DEFAULT 1.0,
    absence_penalty_per_day DECIMAL DEFAULT 1.0,
    overtime_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    telegram_user_id BIGINT UNIQUE,
    invite_token UUID DEFAULT uuid_generate_v4(),
    -- Compensation & Rules
    base_salary DECIMAL DEFAULT 0,
    salary_type TEXT DEFAULT 'monthly' CHECK (salary_type IN ('monthly', 'daily', 'hourly')),
    working_hours_per_day DECIMAL DEFAULT 8,
    allowed_late_minutes INTEGER DEFAULT NULL,
    overtime_rate DECIMAL DEFAULT 1.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    working_hours NUMERIC(5,2),
    late_minutes INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('present', 'late', 'absent', 'holiday')) DEFAULT 'present',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- RLS POLICIES (Simplified for dev, but important for production)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Companies
DROP POLICY IF EXISTS "Owners can view their own company" ON public.companies;
CREATE POLICY "Owners can view their own company" ON public.companies 
    FOR ALL USING (auth.uid() = owner_id);

-- Employees
DROP POLICY IF EXISTS "Owners can view employees of their company" ON public.employees;
CREATE POLICY "Owners can view employees of their company" ON public.employees 
    FOR ALL USING (
        company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
    );

-- Attendance
DROP POLICY IF EXISTS "Owners can view attendance of their company" ON public.attendance;
CREATE POLICY "Owners can view attendance of their company" ON public.attendance 
    FOR ALL USING (
        company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
    );

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id),
    stripe_id TEXT,
    amount NUMERIC,
    currency TEXT DEFAULT 'EGP',
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    total_working_days INTEGER DEFAULT 0,
    present_days INTEGER DEFAULT 0,
    absent_days INTEGER DEFAULT 0,
    total_hours DECIMAL DEFAULT 0,
    late_minutes INTEGER DEFAULT 0,
    overtime_hours DECIMAL DEFAULT 0,
    base_salary DECIMAL DEFAULT 0,
    deductions DECIMAL DEFAULT 0,
    bonuses DECIMAL DEFAULT 0,
    final_salary DECIMAL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, month)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can view their own subscriptions" ON public.subscriptions;
CREATE POLICY "Owners can view their own subscriptions" ON public.subscriptions 
    FOR ALL USING (
        company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
    );

ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can view payroll of their company" ON public.payroll;
CREATE POLICY "Owners can view payroll of their company" ON public.payroll 
    FOR ALL USING (
        company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
    );

-- ADD NEW FEATURES (CURRENCY & HALF-DAY)
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'EGP',
ADD COLUMN IF NOT EXISTS half_day_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS half_day_hours DECIMAL DEFAULT 4.0;

ALTER TABLE public.payroll
ADD COLUMN IF NOT EXISTS half_days DECIMAL DEFAULT 0;

-- ONBOARDING TRIGGER
-- This function creates a company record automatically when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.companies (name, owner_id)
  VALUES (
    COALESCE(new.raw_user_meta_data->>'full_name', 'My') || '''s Company',
    new.id
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- For triggers, it's safer to drop and create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- TASKS MODULE
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link TEXT,
    due_date DATE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'completed', 'late')) DEFAULT 'pending',
    employee_submission TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can view tasks of their company" ON public.tasks;
CREATE POLICY "Owners can view tasks of their company" ON public.tasks 
    FOR ALL USING (
        company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
    );
