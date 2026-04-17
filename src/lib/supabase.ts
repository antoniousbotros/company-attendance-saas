import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

// Accessing env vars directly to ensure Turbopack picks them up
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("CRITICAL: Supabase Environment Variables are missing in this build!");
}

// Browser Client used for Client Components
export const supabase = createBrowserClient(
  supabaseUrl || 'https://MISSING_URL.supabase.co',
  supabaseAnonKey || 'MISSING_KEY'
);

// Admin client for backend operations
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://MISSING_URL.supabase.co',
  serviceRoleKey || 'MISSING_KEY',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// RLS Enforcer client for backend operations
// Uses the provided employee JWT token to instantiate a localized database connection boundary via Row Level Security (RLS) constraints.
export const createTeamClient = (token: string) => {
  return createClient(
    supabaseUrl || 'https://MISSING_URL.supabase.co',
    supabaseAnonKey || 'MISSING_KEY',
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  );
};
