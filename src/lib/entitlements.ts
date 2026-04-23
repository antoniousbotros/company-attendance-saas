import { supabaseAdmin } from "@/lib/supabase";
import { PLANS, Plan } from "@/lib/billing";

export type CompanyAccess = {
  tier: string;
  isLifetime: boolean;
  limits: number;
  planDetails: Plan;
};

/**
 * Universal access check using the User Entitlements source of truth.
 * Hierarchy: Highest Tier among ACTIVE entitlements.
 */
export async function getCompanyAccess(companyId: string): Promise<CompanyAccess> {
  const { data: entitlements, error } = await supabaseAdmin
    .from("user_entitlements")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "active");

  if (error || !entitlements || entitlements.length === 0) {
    return {
      tier: "free",
      isLifetime: false,
      limits: PLANS.free.employeeLimit,
      planDetails: PLANS.free,
    };
  }

  // Find the hierarchy: Highest employee limit among active ones
  let bestPlanId = "free";
  let isLifetime = false;

  for (const ent of entitlements) {
    const plan = PLANS[ent.plan_id];
    if (!plan) continue;

    const currentBest = PLANS[bestPlanId]?.employeeLimit || 0;
    if (plan.employeeLimit >= currentBest) {
      bestPlanId = ent.plan_id;
      isLifetime = (ent.type === 'ltd');
    }
  }

  const finalPlan = PLANS[bestPlanId] || PLANS.free;

  return {
    tier: bestPlanId,
    isLifetime: isLifetime,
    limits: finalPlan.employeeLimit,
    planDetails: finalPlan,
  };
}
