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

### 3. Monetization (Simplified Model)
- **Plans**: Free (5 emp), Starter (10 emp, 149 EGP), Pro (25 emp, 499 EGP), Enterprise (50 emp, 999 EGP).
- **All features included** in every plan — differentiation is employee count only.
- **Usage-Based**: 50 EGP per extra employee over the plan limit.
- **No trial**: New signups start on the Free plan (5 employees, all features).

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

### 4. Employee Portal (`team.yawmy.app`)
- **Auth**: Phone + OTP via Telegram (custom session, not Supabase Auth)
- **Session**: `team_session` httpOnly cookie → `employee_sessions` DB table (7-day TTL)
- **Multi-company**: If phone exists in 2+ companies, employee selects which company to login to
- **Features**: Check-in/out (with geofencing), attendance history, tasks (view/assign/complete), announcements, sales reports
- **Routing**: `team.` subdomain rewrite in middleware → `src/app/(team)/team/` pages
- **Data access**: All queries use `supabaseAdmin` with manual `company_id` scoping
- **Mobile-first**: Bottom nav on mobile, left sidebar on desktop

## CURRENT TASK
- [x] Initial SaaS Architecture
- [x] Multi-step Onboarding Wizard
- [x] Monetization Logic
- [x] Production Build Fixes
- [ ] Payment Gateway Integration (Paymob/Stripe)
- [ ] Real-time Attendance Live-view Notification

## PARITY RULE
**Every employee-facing feature must exist on both Telegram bot AND web team portal (`team.yawmy.app`).** A feature that only works on one platform is incomplete. Both platforms hit the same DB tables and must use identical business logic. Web actions must trigger Telegram notifications where applicable.

## KNOWN ISSUES & RISKS (NEW)
- **Sadmin auth**: Uses a plain-text cookie value `"authorized"`. Pre-existing issue, not introduced in this release. Should be upgraded to signed session tokens in a future sprint.
- **Sadmin pricing editor vs hardcoded billing.ts**: The sadmin pricing page saves to `pricing_config` DB table, but the customer-facing billing page reads from hardcoded `billing.ts`. These are not yet connected. Admin price changes via sadmin UI do NOT propagate to what customers see. Connecting them requires making the billing page fetch from the DB — planned for a future iteration.
- **Schema migration**: Existing companies with `plan_id = 'growth'` must be migrated to `'starter'` BEFORE applying the updated CHECK constraint. Run: `UPDATE companies SET plan_id = 'starter' WHERE plan_id = 'growth';`
- **RLS on new tables**: `employee_otp`, `employee_sessions`, and `pricing_config` do not have RLS enabled. They are only accessed via `supabaseAdmin` (service role) in API routes, but if the anon key is ever used against them, data would be exposed. Consider enabling RLS as defense-in-depth.

## DECISIONS LOG
- **2026-04-14**: Switched to `@supabase/ssr` for better Next.js 15+ compatibility and cookie-based auth.
- **2026-04-14**: Redesigned dashboard to **Notion-style Minimalist Workspace** for professional clarity.
- **2026-04-14**: Implemented `LanguageProvider` for instant RTL/LTR switching across all dashboard components.
- **2026-04-14**: Added `telegram_token` support to allows multi-tenant bot ownership.
- **2026-04-14**: Implemented `force-dynamic` on Telegram webhook to ensure reliability on Vercel.
- **2026-04-14**: Added `onboarding_step` to `companies` to prevent users from skipping the activation flow.
- **2026-04-14**: **Dashboard UI redesigned** to a Talabat Partners-inspired light theme with orange (`#ff5a00`) primary. Dropped dark mode entirely. Introduced shared primitives in `src/app/components/talabat-ui.tsx`. Sidebar reduced to 6 honest routes grouped into two sections — no stub pages for features we don't have. Business logic (Supabase queries, RLS, billing math, phone normalization, Telegram webhook) unchanged.

## DECISIONS LOG (NEW)
- **2026-04-15**: Team portal UI redesigned to analytics dashboard style with Recharts bar charts, period selectors, stats grids, RTL support, and company logo.
- **2026-04-15**: Added logo upload to admin Settings (Supabase Storage `company-logos` bucket, `logo_url` column on companies table).
- **2026-04-15**: Team reports page now includes table view for leaders with client-side Excel export (ExcelJS), matching Telegram bot's Excel output format.
- **2026-04-15**: Simplified pricing to 4 plans (Free/Starter/Pro/Enterprise) — all features included, only employee limit differs. Removed `growth` plan. Extra cost raised to 50 EGP/employee.
- **2026-04-15**: Replaced 14-day trial with permanent Free plan (5 employees).
- **2026-04-15**: Built employee web portal at `team.yawmy.app` — custom phone+OTP auth, mirrors all Telegram bot features.
- **2026-04-15**: Established parity rule — every employee feature must exist on both Telegram and web.
- **2026-04-15**: Added sadmin pricing control page (`/sadmin/pricing`) with DB-backed `pricing_config` table.
- **2026-04-15**: Security hardening — added `company_id` scoping to all team API queries, try/catch on all routes, sanitized error messages, crypto-secure OTP generation.

## CHANGE LOG
- **v2.1.0**: Team portal UI redesign (analytics dashboard style), Recharts charts, company logo upload, Excel export for team leaders, full RTL/Arabic support.
- **v2.0.0**: Employee Portal (`team.yawmy.app`), simplified pricing (4 plans, all features), sadmin pricing control, security hardening.
- **v1.1.0**: Major UI overhaul (Notion Style), Cookie-based Auth, and multi-tenant bot support.
- **v1.0.0**: Initial release of SyncTime SaaS.
- **v2.2.0**: Sales Tracking enhancements — resizable columns, RTL drag fix, sticky employee column, mobile card view, location validation (3 layers), payroll bug fixes, Telegram bot parity (holiday guard, WFH bypass, edit-last-report), middleware Edge Runtime fix.

## DECISIONS LOG (v2.2.0)
- **2026-04-19**: Fixed React error #301 in sales-tracking — moved `setColWidths` call from render into `useEffect` to comply with React rendering rules.
- **2026-04-19**: Inverted drag delta in `ResizableColHeader` for RTL — `position: sticky; end-0` places handle on LEFT in RTL, so rightward drag must shrink the column.
- **2026-04-19**: Added 3-layer location enforcement for field reports: (1) API route returns 400 if lat/lng missing, (2) team web app disables submit button + shows error, (3) Telegram bot re-prompts for location before completing any draft report.
- **2026-04-20**: Fixed 3 payroll calculation bugs: (a) overtime pay now correctly uses `hourlyRate × otRate × hours`; (b) late minutes no longer double-counted against missing-hours deduction; (c) date strings built from loop vars instead of `toISOString()` to avoid UTC offset errors on Cairo (UTC+2) servers.
- **2026-04-21**: Sales tracking table restructured into two panels: sticky (date + employee, outside transform) + SwipeableRow (data columns only). Root cause: CSS `position: sticky` doesn't work inside CSS `transform` parents. Extracting sticky cells from SwipeableRow's `translateX` scope solves it permanently.
- **2026-04-21**: Added mobile responsive card view for sales tracking (`< lg`). Cards show employee name prominently with explicit edit/delete buttons — swipe gesture removed on mobile to prevent conflict with horizontal scroll.
- **2026-04-21**: **CRITICAL FIX** — Replaced `import { createHmac } from 'crypto'` in `src/middleware.ts` with Web Crypto API (`crypto.subtle.sign`). Node.js `crypto` module is not available in Vercel Edge Runtime; this was a silent runtime bug that could crash sadmin route protection on every request. Token generation in `api/sadmin/auth/route.ts` remains on Node.js (API route, not middleware) and is unaffected.

## KNOWN ISSUES (updated v2.2.0)
- **RESOLVED**: `crypto` module in middleware Edge Runtime — fixed in v2.2.0 (replaced with Web Crypto API).
- **Pre-existing**: Sadmin auth uses HMAC tokens derived from the `SADMIN_PASSWORD` env var. If the password is weak or leaked, sadmin is compromised. Upgrade to dedicated sadmin user table with bcrypt in a future sprint.
- **Pre-existing**: `employee_otp`, `employee_sessions`, `pricing_config` tables have no RLS. Access is only via `supabaseAdmin` (service role) in API routes. Safe for now but should add RLS as defence-in-depth.
- **Pre-existing**: Sadmin pricing editor saves to `pricing_config` DB table, but customer-facing billing reads from hardcoded `billing.ts`. Price changes in sadmin UI do NOT propagate to customers until `billing.ts` is refactored to read from DB.
- **Pre-existing**: Next.js 16 deprecation warning: `middleware.ts` file convention will become `proxy.ts`. Not breaking; rename in next major version bump.
- **Pre-existing**: `middleware.ts` reads `companies.onboarding_step` on every authenticated request when `onb_done` cookie is absent. Can be expensive under load. Mitigation: cookie is set once onboarding is complete, so DB is only hit once per fresh session.
