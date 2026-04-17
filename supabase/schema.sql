-- TABLES
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
    plan_id TEXT DEFAULT 'free' CHECK (plan_id IN ('free', 'starter', 'pro', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled')),
    onboarding_step INTEGER DEFAULT 1,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
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
    departments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    telegram_user_id BIGINT UNIQUE,
    department TEXT,
    invite_token UUID DEFAULT uuid_generate_v4(),
    -- Compensation & Rules
    base_salary DECIMAL DEFAULT 0,
    salary_type TEXT DEFAULT 'monthly' CHECK (salary_type IN ('monthly', 'daily', 'hourly')),
    working_hours_per_day DECIMAL DEFAULT 8,
    allowed_late_minutes INTEGER DEFAULT NULL,
    overtime_rate DECIMAL DEFAULT 1.5,
    birth_date DATE,
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
    paymob_order_id TEXT,
    paymob_transaction_id TEXT,
    merchant_order_id TEXT,
    amount NUMERIC,
    currency TEXT DEFAULT 'EGP',
    status TEXT,
    hmac_verified BOOLEAN DEFAULT false,
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
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'EGP',
ADD COLUMN IF NOT EXISTS half_day_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS half_day_hours DECIMAL DEFAULT 4.0;

ALTER TABLE public.payroll
ADD COLUMN IF NOT EXISTS half_days DECIMAL DEFAULT 0;

-- PRICING CONFIG (Super Admin controlled, single row)
CREATE TABLE IF NOT EXISTS public.pricing_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plans JSONB NOT NULL DEFAULT '{
      "free": { "name": "Free", "nameAr": "مجاني", "price": 0, "employeeLimit": 5 },
      "starter": { "name": "Starter", "nameAr": "أساسي", "price": 149, "employeeLimit": 10 },
      "pro": { "name": "Pro", "nameAr": "احترافي", "price": 499, "employeeLimit": 25, "popular": true },
      "enterprise": { "name": "Enterprise", "nameAr": "شركات", "price": 999, "employeeLimit": 50 }
    }'::jsonb,
    features JSONB NOT NULL DEFAULT '["Telegram Bot","Attendance Tracking","Late Arrival Tracking","Daily Reports","CSV Export","Team Notifications","Multi-Admin","Analytics"]'::jsonb,
    features_ar JSONB NOT NULL DEFAULT '["بوت تليجرام","تتبع الحضور","نظام التأخيرات","تقارير يومية","تصدير CSV","إشعارات الفريق","تعدد المديرين","تحليلات"]'::jsonb,
    extra_employee_cost INTEGER NOT NULL DEFAULT 50,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default row if none exists
INSERT INTO public.pricing_config (id) VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

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
    assigned_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    assigned_to UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    deadline DATE,
    status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'late')) DEFAULT 'pending',
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

-- ANNOUNCEMENTS MODULE
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_type TEXT CHECK (target_type IN ('all', 'department', 'specific')),
    expire_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.announcement_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    department TEXT
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can manage announcements" ON public.announcements;
CREATE POLICY "Owners can manage announcements" ON public.announcements
    FOR ALL USING (
        company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
    );

-- SALES TRACKING MODULE (FIELD TEAMS)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS sales_tracking_enabled BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    leader_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    show_notes BOOLEAN DEFAULT true,
    require_notes BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member', -- 'leader', 'member'
    UNIQUE(team_id, employee_id)
);

CREATE TABLE IF NOT EXISTS public.custom_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    field_type TEXT NOT NULL DEFAULT 'text', -- 'number', 'text', 'select', 'image'
    options JSONB DEFAULT '[]'::jsonb,
    is_required BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    notes TEXT,
    status TEXT DEFAULT 'draft', -- 'draft', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.report_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES public.custom_fields(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    UNIQUE(report_id, field_id)
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can manage teams" ON public.teams;
CREATE POLICY "Owners can manage teams" ON public.teams
    FOR ALL USING (
        company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
    );

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can view reports" ON public.reports;
CREATE POLICY "Owners can view reports" ON public.reports
    FOR ALL USING (
        company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
    );

-- EMPLOYEE PORTAL AUTH
CREATE TABLE IF NOT EXISTS public.employee_otp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.employee_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    token VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-------------------------------------------------------------------------------
-- DATABASE PERFORMANCE TUNING (MULTI-TENANT COMPOSITE B-TREE INDEXING)
-------------------------------------------------------------------------------
-- These indices transform standard full-table sequential scans across massive SaaS 
-- data sets (O(N)) into localized isolated tenant tree lookups (O(log N)).

-- 1. Attendance: heavily queried by company_id, then date
CREATE INDEX IF NOT EXISTS idx_attendance_tenant_date ON public.attendance(company_id, date);

-- 2. Tasks: heavily queried by company dashboard viewing assignments
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_assignee ON public.tasks(company_id, assigned_to);

-- 3. Reports: multi-tenant fast lookups
CREATE INDEX IF NOT EXISTS idx_reports_tenant_date ON public.reports(company_id, date);

-- 4. Payroll tracking arrays
CREATE INDEX IF NOT EXISTS idx_payroll_tenant_month ON public.payroll(company_id, month);

-------------------------------------------------------------------------------
-- ZERO-TRUST RLS IMPLEMENTATION (EDGE JWT BOUNDARIES)
-------------------------------------------------------------------------------
-- These policies securely allow employees utilizing Custom Edge JWTs to interact 
-- with backend APIs without triggering God-Mode (supabaseAdmin) leakages.

CREATE POLICY "Edge JWT Isolation: Employees" ON public.employees
  FOR ALL USING (company_id::text = auth.jwt()->>'company_id');

CREATE POLICY "Edge JWT Isolation: Attendance" ON public.attendance
  FOR ALL USING (company_id::text = auth.jwt()->>'company_id');

CREATE POLICY "Edge JWT Isolation: Tasks" ON public.tasks
  FOR ALL USING (company_id::text = auth.jwt()->>'company_id');

CREATE POLICY "Edge JWT Isolation: Reports" ON public.reports
  FOR ALL USING (company_id::text = auth.jwt()->>'company_id');

CREATE POLICY "Edge JWT Isolation: Announcements" ON public.announcements
  FOR ALL USING (company_id::text = auth.jwt()->>'company_id');
