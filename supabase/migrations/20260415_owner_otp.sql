-- OTP table for owner account actions (reset password, change email)
CREATE TABLE IF NOT EXISTS public.owner_otp (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  code        TEXT NOT NULL,
  purpose     TEXT NOT NULL DEFAULT 'reset_password', -- 'reset_password' | 'change_email'
  new_email   TEXT,           -- only used when purpose = 'change_email'
  used        BOOLEAN NOT NULL DEFAULT false,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-cleanup: index to purge expired rows efficiently
CREATE INDEX IF NOT EXISTS owner_otp_expires_idx ON public.owner_otp (expires_at);
