# 🧠 ENGINEERING_BRAIN.md

## SYSTEM OVERVIEW
**SyncTime SaaS Attendance** is a high-performance, multi-tenant platform designed for the MENA region. It leverages a serverless architecture for maximum scalability and zero maintenance.

- **Frontend**: Next.js 16 (App Router) with Turbopack.
- **Backend**: Next.js API Routes (Serverless) + Telegram Bot Webhook.
- **Database**: Supabase (PostgreSQL) with Real-time capabilities.
- **Auth**: Supabase Auth (Email/Password & Social OAuth).
- **Styling**: Tailwind CSS 4 + Lucide Icons + Cairo & Poppins Typography.
- **Hosting**: Vercel (Frontend/API) + Supabase (State/Storage).

## CORE BUSINESS LOGIC
### 1. Multi-Tenant Architecture
- Every record (`employees`, `attendance`, `subscriptions`) MUST be scoped to a `company_id`.
- Data isolation is enforced via **Supabase Row Level Security (RLS)** using `auth.uid()`.
- **Onboarding Trigger**: A PostgreSQL trigger `on_auth_user_created` automatically initializes a workspace for new users on signup.

### 2. Telegram Bot Interaction
- **Linking**: Matches `contact.phone_number` with `employees.phone`.
- **Check-In**: `UPSERT` to `attendance` where `date = CURRENT_DATE`.
- **Late Policy**: Check-ins after **10:00 AM** are flagged as `late`.
- **Check-Out**: Updates `check_out` time and calculates `working_hours` (decimal).

### 3. Monetization (Hybrid Model)
- **Base Plan**: Starter, Growth, Pro, Enterprise.
- **Usage-Based**: 5 EGP per extra employee over the plan limit.
- **Trial**: 14-day automatic trial period for all new companies.

## UI SYSTEM
- **Theming**: Strict dark mode (#09090b) with glassmorphic accents and indigo primaries.
- **Typography**: `Cairo` for Arabic (RTL) and `Poppins` for Latin scripts.
- **Components**: Reusable Tailwind-based components located in `src/app/components`.

## SECURITY RULES (MANDATORY)
1. **Never Bypass RLS**: All queries from the client must use the `supabase` instance. The `supabaseAdmin` client is EXCLUSIVELY for the Telegram webhook and background tasks.
2. **Secret Handling**: Never hardcode tokens. Use `.env.local`.
3. **Validation**: Phone numbers are stored as strings (e.g., `201234567890`) without the `+` sign to ensure consistent bot matching.

## KNOWN ISSUES & TRAPS
- **Middleware**: Uses `@supabase/ssr` for session sync. Never use the old `@supabase/auth-helpers-nextjs` in new middleware logic.
- **Build Crashes**: Supabase clients must have fallbacks for environment variables to prevent crashes during the Vercel pre-rendering phase.
- **Middleware Convention**: Next.js 16 warns about the `/middleware.ts` file; it may need renaming to `/proxy.ts` in future versions.

## CURRENT TASK
- [x] Initial SaaS Architecture
- [x] Multi-step Onboarding Wizard
- [x] Monetization Logic
- [x] Production Build Fixes
- [ ] Payment Gateway Integration (Paymob/Stripe)
- [ ] Real-time Attendance Live-view Notification

## DECISIONS LOG
- **2026-04-14**: Switched to `@supabase/ssr` for better Next.js 15+ compatibility and cookie-based auth.
- **2026-04-14**: Redesigned dashboard to **Notion-style Minimalist Workspace** for professional clarity.
- **2026-04-14**: Implemented `LanguageProvider` for instant RTL/LTR switching across all dashboard components.
- **2026-04-14**: Added `telegram_token` support to allows multi-tenant bot ownership.
- **2026-04-14**: Implemented `force-dynamic` on Telegram webhook to ensure reliability on Vercel.
- **2026-04-14**: Added `onboarding_step` to `companies` to prevent users from skipping the activation flow.

## CHANGE LOG
- **v1.1.0**: Major UI overhaul (Notion Style), Cookie-based Auth, and multi-tenant bot support.
- **v1.0.0**: Initial release of SyncTime SaaS.
