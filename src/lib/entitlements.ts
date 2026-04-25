import { supabaseAdmin } from "@/lib/supabase";
import { PLANS, Plan } from "@/lib/billing";

export type CompanyAccess = {
  tier: string;
  isLifetime: boolean;
  isTrial: boolean;
  daysLeft?: number;
  limits: number;
  planDetails: Plan;
  status: 'active' | 'expired' | 'free';
};

/**
 * Universal access check using the User Entitlements source of truth.
 * Hierarchy: LTD > Subscription > Trial > Free
 */
export async function getCompanyAccess(companyId: string): Promise<CompanyAccess> {
  const { data: entitlements, error } = await supabaseAdmin
    .from("user_entitlements")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "active");

  const defaultAccess: CompanyAccess = {
    tier: "free",
    isLifetime: false,
    isTrial: false,
    limits: PLANS.free.employeeLimit,
    planDetails: PLANS.free,
    status: 'free'
  };

  if (error || !entitlements || entitlements.length === 0) {
    return defaultAccess;
  }

  // 1. LTD Overrides
  const ltd = entitlements.find(e => e.type === 'ltd');
  if (ltd) {
    const plan = PLANS[ltd.plan_id] || PLANS.enterprise;
    return {
      tier: ltd.plan_id,
      isLifetime: true,
      isTrial: false,
      limits: plan.employeeLimit,
      planDetails: plan,
      status: 'active'
    };
  }

  // 2. ACTIVE Subscriptions
  const sub = entitlements.find(e => e.type === 'subscription');
  if (sub) {
    const isPastDue = sub.end_at && new Date(sub.end_at) < new Date();
    const plan = PLANS[sub.plan_id] || PLANS.free;
    
    return {
      tier: sub.plan_id,
      isLifetime: false,
      isTrial: false,
      limits: plan.employeeLimit,
      planDetails: plan,
      status: isPastDue ? 'expired' : 'active'
    };
  }

  // 3. TRIAL
  const trial = entitlements.find(e => e.type === 'trial');
  if (trial) {
    const now = new Date();
    const end = new Date(trial.end_at);
    const isExpired = end < now;
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const plan = PLANS[trial.plan_id] || PLANS.pro;

    return {
      tier: trial.plan_id,
      isLifetime: false,
      isTrial: true,
      daysLeft: Math.max(0, daysLeft),
      limits: plan.employeeLimit,
      planDetails: plan,
      status: isExpired ? 'expired' : 'active'
    };
  }

  return defaultAccess;
}
