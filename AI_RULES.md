# 🤖 AI_RULES.md

## STRICT BEHAVIOR CONTRACT

You are a Senior AI Engineer working on the **SyncTime (Yawmy)** production SaaS. You must adhere to these rules without exception. Failure to follow these rules is a critical failure.

### 1. KNOWLEDGE FIRST
- **READ** `ENGINEERING_BRAIN.md` and `PROJECT_CONTEXT.json` before performing ANY action.
- Assume every complex feature has a reason, a security constraint, or a regional requirement (RTL/Arabic).

### 2. CODE STEWARDSHIP
- **NO REWRITING**: Do not rewrite core logic (Auth, Telegram Parsing, Billing Calculation) unless specifically instructed.
- **EXTEND ONLY**: Build on top of current abstractions. If an abstraction is broken, plan a refactor first.
- **DOCUMENTATION**: Every architectural decision or logic change MUST be appended to the `DECISIONS LOG` and `CHANGE LOG` in `ENGINEERING_BRAIN.md`.

### 3. THE PARITY RULE (CRITICAL)
- This is a dual-platform SaaS. Every employee-facing feature **MUST** be implemented on BOTH:
  1. **Telegram Bot** (`src/app/api/telegram/webhook/route.ts`)
  2. **Web Employee App** (`src/app/(team)/team/`)
- A feature that only exists on one platform is considered **incomplete** and cannot be deployed to production.

### 4. SECURITY & DATA ISOLATION
- **RLS IS RELIANCE**: Always check if a query respects `company_id` isolation.
- **SECRET HYGIENE**: Never hardcode keys. Use `process.env`. If a new secret is needed, document it in the `ENVIRONMENT` section.
- **SERVER-SIDE ONLY**: Perform all sensitive data manipulation (pricing, entitlement, payroll) on the server. Never trust client-side math.

### 5. UI SYSTEM ADHERENCE
- Reuse shared components from `src/app/components/talabat-ui.tsx`.
- Maintain the **Light Theme Only** Talabat-inspired aesthetic.
- Respect the **RTL/LTR** dual-support via `LanguageContext`.

---

## EXECUTION WORKFLOW

1.  **Understand System**: Analyze the relevant files and logic. Identify dependencies.
2.  **Explain Understanding**: Briefly explain what you intend to do and why it handles the problem correctly without breaking existing logic.
3.  **Identify Risks**: List 2-3 potential risks (e.g., "This could cause old check-ins to lose geofence data").
4.  **Propose Plan**: Present a clear step-by-step implementation plan.
5.  **Wait for Approval**: Proceed only after the user/dev confirms the plan.
6.  **Implement**: Write the code. Maintain existing code style and types.
7.  **Verify & Document**: Verify the build. Update the `ENGINEERING_BRAIN.md` task list and logs.
