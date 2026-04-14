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
- **Theming**: Light-only theme inspired by the Talabat Partners dashboard. Page bg `#f5f5f5`, white cards with `#eeeeee` borders and ~12px radius, near-black text `#111`, muted gray `#6b7280`.
- **Brand**: `--primary: #ff5a00` (talabat orange), hover `#e04f00`, soft `#fff1e8`, border `#ffd4b8`.
- **Status palette**: success `#1e8e3e` on `#e6f6ec`, warning `#b45309` on `#fdf4d8`, danger `#b91c1c` on `#fef1f1`, neutral `#4b5563` on `#f1f1f1`.
- **Typography**: `Poppins` for Latin scripts and `IBM Plex Sans Arabic` for Arabic (RTL). Both loaded via `next/font/google` in `src/app/layout.tsx` as CSS variables `--font-poppins` and `--font-ibm-arabic`. `globals.css` chains them via `--font-sans` (Latin primary) and `--font-arabic` (forced under `[dir="rtl"]`). **Do not reintroduce `Cairo`.**
- **Components**:
  - Shared primitives in `src/app/components/talabat-ui.tsx`: `BrandLogo`, `StatusPill`, `SectionCard`, `PageHeader`, `DateRangePill`, `SearchField`, `GhostButton`, `PrimaryButton`, `HelpCard`. Reuse these in any new dashboard page — do not redefine buttons/cards per page.
  - Dashboard chrome lives in `src/app/(dashboard)/layout.tsx` (sidebar + top bar).
- **Layout rules**:
  - Fixed 232px sidebar, collapses to drawer below `lg`.
  - Main content clamped to `max-w-[1200px]`, page padding `px-4 md:px-8 py-8`.
  - Section grouping in sidebar: "Monitor your performance" (Dashboard, Attendance, Reports) + "Manage your business" (Employees, Payments, Settings).
- **Dark mode**: removed. The header theme toggle no longer exists. If reintroduced, do it via a dedicated `.dark` token block in `globals.css`, not by re-adding `dark:` class variants across pages.

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
- **2026-04-14**: Switched to `@supabase/ssr` for better Next.js 15+ compatibility.
- **2026-04-14**: Implemented `force-dynamic` on Telegram webhook to ensure reliability on Vercel.
- **2026-04-14**: Added `onboarding_step` to `companies` to prevent users from skipping the activation flow.
- **2026-04-14**: **Dashboard UI redesigned** to a Talabat Partners-inspired light theme with orange (`#ff5a00`) primary. Dropped dark mode entirely. Introduced shared primitives in `src/app/components/talabat-ui.tsx`. Sidebar reduced to 6 honest routes grouped into two sections — no stub pages for features we don't have. Business logic (Supabase queries, RLS, billing math, phone normalization, Telegram webhook) unchanged.

## CHANGE LOG
- **v1.0.0**: Initial release of SyncTime SaaS.
