-- Add auth_mode to companies: 'telegram' (default, current flow) | 'password' (phone + password)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS auth_mode TEXT NOT NULL DEFAULT 'telegram';

-- Add login_password to employees (SHA-256 hex hash stored by the owner)
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS login_password TEXT;
