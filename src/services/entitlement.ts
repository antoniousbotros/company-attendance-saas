import { createClient } from '@supabase/supabase-js';
import { PLANS, Plan } from '@/lib/billing';

// Note: Use Service Role to query active_entitlements if called from API/Webhooks
// Otherwise, user-bound client shouldn't matter as long as RLS on `tenants` allows them to view their row.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export type AccessType = 'lifetime' | 'subscription' | 'trial' | 'free';

export interface Entitlement {
  companyId: string;
  type: AccessType;
  planId: string;
  limits: Plan;
  expiresAt: string | null;
}

export async function getCompanyEntitlement(companyId: string): Promise<Entitlement> {
  const { data, error } = await supabaseAdmin
    .from('active_entitlements_view')
    .select('*')
    .eq('company_id', companyId)
    .single();

  if (error || !data) {
    return {
      companyId,
      type: 'free',
      planId: 'free',
      limits: PLANS['free'],
      expiresAt: null
    };
  }

  const planId = data.effective_plan as string;
  const limits = PLANS[planId] || PLANS['free'];

  return {
    companyId: data.company_id,
    type: data.access_type as AccessType,
    planId: limits.name === PLANS['free'].name ? 'free' : planId,
    limits,
    expiresAt: data.current_period_end || data.trial_ends_at || null
  };
}

export async function enforceEmployeeLimits(companyId: string, currentEmployees: number) {
  const entitlement = await getCompanyEntitlement(companyId);
  const maxAllowed = entitlement.limits.employeeLimit;

  if (currentEmployees >= maxAllowed) {
    throw new Error(`LIMIT_REACHED: Your plan allows a maximum of ${maxAllowed} employees.`);
  }
}
