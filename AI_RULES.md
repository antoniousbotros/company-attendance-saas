# 🤖 AI_RULES.md

## STRICT BEHAVIOR CONTRACT
You are an AI engineer working on a production SaaS. You must follow these rules without exception.

### 1. READ FIRST
- Before ANY code change, you MUST read `ENGINEERING_BRAIN.md` and `PROJECT_CONTEXT.json`.
- Understand the existing multi-tenant architecture and RLS policies.

### 2. CORE CONSTRAINTS
- **Don't Rewrite**: Do not rewrite working logic (auth, bot parsing, billing) without explicit approval.
- **Extend Only**: Add new features by creating new modules or components.
- **Security First**: Every DB query must consider the `company_id`. Never allow cross-tenant data leaks.
- **UI Consistency**: Reuse existing Tailwind utility patterns and the established Poppins/Cairo font stack.

### 3. EXECUTION WORKFLOW
1. **System Analysis**: Analyze the current file structure and logic relevant to the task.
2. **Context Explanation**: Briefly explain your understanding of the task and its impact on the system.
3. **Risk Identification**: Highlight potential breaking points (e.g., breaking the bot webhook, auth session leaks).
4. **Proposed Plan**: Detail your implementation steps.
5. **Implement**: Write clean, modular, and typed TypeScript code.
6. **Self-Audit**: Verify the build passes and document the changes in `ENGINEERING_BRAIN.md`.

### 4. PARITY RULE — TELEGRAM + WEB TEAM PORTAL (MANDATORY)
- Every employee-facing feature MUST be implemented on BOTH platforms simultaneously:
  1. **Telegram Bot** (`src/app/api/telegram/webhook/route.ts`)
  2. **Web Team Portal** (`src/app/api/team/` + `src/app/(team)/team/`)
- If a feature exists on one platform but not the other, it is **incomplete and must not be shipped**.
- Both platforms share the same database tables — ensure identical business logic (late calculation, geofencing, task notifications, announcement targeting, report validation).
- When adding a new action: create the API route under `src/app/api/team/`, add the UI in `src/app/(team)/team/`, AND add the handler in the Telegram webhook.
- Telegram notifications must fire from web actions (task assign, task status change) just as they do from the bot.
- Test both flows before marking any feature as done.

### 5. TELEGRAM BOT CARE
- The bot logic in `src/app/api/telegram/webhook/route.ts` is critical.
- Ensure the webhook remains stateless and handles errors gracefully without crashing the Next.js API route.

### 6. DATABASE INTEGRITY
- All schema changes must be added to `supabase/schema.sql`.
- Ensure SQL stays idempotent (`IF NOT EXISTS`, `OR REPLACE`).
