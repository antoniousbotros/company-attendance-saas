# SaaS Attendance System: SyncTime

A professional, multi-tenant attendance tracking system using Telegram for employee interaction and a premium Next.js dashboard for administration.

## 🚀 Getting Started

### 1. Database Setup (Supabase)
Run the following SQL in your Supabase SQL Editor:
```sql
-- Create tables and enable RLS as defined in supabase/schema.sql
```

### 2. Telegram Bot Setup
1. Message **@BotFather** on Telegram.
2. Create a new bot and copy the **API Token**.
3. Set the Webhook URL (after deploying):
   `https://your-domain.com/api/telegram/webhook`

### 3. Environment Variables
Copy `.env.example` to `.env.local` and fill in your credentials from Supabase and Telegram.

### 4. Running Locally
```bash
npm install
npm run dev
```

## 🏗 System Architecture

### Multi-tenancy
- Every `company` has an `owner_id` (the user who signed up).
- Every `employee` and `attendance` record is linked to a `company_id`.
- Supabase Row Level Security (RLS) ensures one company cannot see another's data.

### Bot Logic
- **Linking**: When an employee shares their contact, the bot matches their phone number with the database record and links their `telegram_user_id`.
- **Attendance**: The bot uses simple buttons for `Check In` and `Check Out`.
- **Rules**: 
  - Only one check-in allowed per day.
  - Check-ins after 10:00 AM are automatically marked as **Late**.
  - Working hours are calculated automatically on check-out.

## 📱 Features
- **Modern Dashboard**: Built with Next.js, Tailwind, and Glassmorphic aesthetics.
- **Real-time Stats**: Track presence, lateness, and total hours.
- **Employee Management**: Manage your team and track their Telegram connectivity.
- **Exportable Reports**: Generate CSVs for payroll.

## 🛠 Project Structure
- `/src/app/api/telegram/webhook`: The brain of the Telegram bot.
- `/src/app/(dashboard)`: The multi-page admin dashboard.
- `/src/lib/supabase`: Database and Auth initialization.
- `/supabase/schema.sql`: Database definition.
