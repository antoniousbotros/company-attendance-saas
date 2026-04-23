# 🧠 ENGINEERING_BRAIN.md

## SYSTEM OVERVIEW

**SyncTime SaaS Attendance** is a high-performance, multi-tenant workforce management platform designed for the MENA region. It provides real-time attendance tracking via automated Telegram bots and a high-fidelity web portal.

### Technical Stack
- **Frontend**: Next.js 16 (App Router) + Tailwind CSS 4.
- **Backend**: Serverless API Routes + Telegraf (Telegram Bot).
- **Database**: Supabase (PostgreSQL) + Row Level Security (RLS).
- **Hosting**: Vercel (Edge & Serverless).

### Architecture
- **Multi-Tenant Logic**: Every database record (`employees`, `attendance`, `subscriptions`, `tasks`) is strictly scoped to a `company_id`. Isolation is enforced at the database level via Postgres RLS.
- **Subdomain Routing**: Virtual routing via `middleware.ts` rewrites `team.yawmy.app` to the internal portal logic and protects `sadmin.*` routes.
- **Dual-Platform Parity**: Business logic is unified across the **Telegram Bot** and the **Employee Web App**.

---

## CORE BUSINESS LOGIC (CRITICAL)

### 1. Attendance & Automation
- **Check-In/Out**: Managed via Telegram or Web. Requires valid lat/lng geofencing in production.
- **Late Policy**: Fixed 10:00 AM threshold for `late` flagging. 
- **Employee Portal**: Custom phone + OTP authentication (independent of Supabase Auth) leveraging the `employee_sessions` table for performance.

### 2. Monetization & Entitlements
- **Pricing Layer**: Dynamically resolves access via `MAX(LTD, Subscription)`. 
- **Employee Limits**: Strictly enforced at the DB level via `BEFORE INSERT` triggers to prevent browser-based hacking of subscription tiers.
- **Billing**: Integrated with Stripe (Hosted Checkout) and PayMob (EGP local gateway).

---

## UI SYSTEM

### Design Rules
- **Aesthetic**: Light-mode only. Talabat-inspired partners dashboard.
- **Palette**: Core orange (`#ff5a00`), muted grays (`#f9fafb` background), near-black text (`#111`).
- **Typography**: Dual-alphabet support: `Poppins` (Latin) and `IBM Plex Sans Arabic` (Arabic).

### Component System
- **Talabat-UI**: All shared primitives live in `src/app/components/talabat-ui.tsx`. Use these to maintain consistency. Do not recreate buttons or modalless layouts.
- **Charts**: Use `Recharts` for all analytics dashboards.

---

## SECURITY RULES (MANDATORY)

### RLS Policies
- **Always Active**: `ENABLE ROW LEVEL SECURITY` on all user-facing tables.
- **Service Role**: `supabaseAdmin` is restricted to API-level internal migrations and Telegram parsers. Client-side code MUST use the standard `supabase` client.

### Token Handling
- **Sadmin Protection**: Uses high-entropy HMAC signature verification with `SADMIN_JWT_SECRET`. 
- **Employee OTP**: Generated using `crypto.randomInt` and stored with a 5-minute TTL.

---

## KNOWN ISSUES & TRAPS

### ⚠️ Critical Alerts
- **Middleware Runtime**: `middleware.ts` runs in the Vercel Edge Runtime. Traditional Node.js modules like `crypto` will crash the site; use the Web Crypto API (`crypto.subtle`) instead.
- **Billing Sync**: The Super Admin pricing UI saves to the database, but the customer checkout page still reads from a legacy `billing.ts` constant. These must be synchronized manually when updating prices.
- **Apple Pay**: Stripe Apple Pay ONLY appears on Safari. It will be hidden in regular Chromium browsers during testing.

---

## CURRENT TASK
- [ ] Refactor `billing.ts` to read directly from the `pricing_config` table.
- [ ] Enable RLS on `employee_sessions` and `employee_otp` tables.
- [ ] Standardize the "Employee App" naming across all marketing materials.

---

## DECISIONS LOG (Key Milestones)

- **2026-04-23**: Isolated symmetric cryptographic secrets enforcing `SADMIN_JWT_SECRET` separating human authenticators from machine cryptographic layers.
- **2026-04-23**: Established native Lifetime Deal (LTD) support using `company_entitlements` layer bypassing Stripe subscription limits.
- **2026-04-23**: Created `ShowcaseSection` with code-based mockups for Analytics (Recharts) and Data-Flow Infographic on the landing page.
- **2026-04-23**: Verified Stripe Apple Pay compatibility for Hosted Checkout and verified `yawmy.app` domain association.

---

## CHANGE LOG

- **v2.3.2**: **UI Showcase & Stripe Verification.** Added interactive Showcase section to landing page. Verified Apple Pay. Renamed "Portal" to "Employee App".
- **v2.3.1**: **ATO Security Hardening.** Implemented JWT session enforcement for system admins. Blocked API-overage leakage via Postgres triggers.
- **v2.3.0**: **Lifetime Deals (LTD).** Added internal redemption system and Olisaas marketplace webhook fulfillment bridge.
- **v2.2.0**: **Sales Tracking enhancements.** RTL drag fixes, sticky columns for mobile, and location validation (3 layers).
- **v2.1.0**: Team portal UI redesign, Recharts charts, company logo upload.
- **v2.0.0**: Initial Employee Portal release and simplified pricing model.
