import { createClient } from "@/lib/supabase/server";
import { PLANS, Plan } from "@/lib/billing";

export type CompanyAccess = {
  tier: string;
  isLifetime: boolean;
  limits: number;
  planDetails: Plan;
};

/**
 * Universal access check.
 * This MUST be used throughout the app instead of raw `companies.plan_id`.
 * It automatically applies LTD overrides if a valid permanent entitlement exists.
 */
export async function getCompanyAccess(companyId: string): Promise<CompanyAccess> {
  const supabase = createClient();

  // 1. Check LTD Entitlements First (O(1) indexed query)
  const { data: entitlement, error: entitlementError } = await supabase
    .from("company_entitlements")
    .select("tier_id")
    .eq("company_id", companyId)
    .eq("status", "active")
    .single();

  if (entitlement && !entitlementError) {
    // LTD Overrides subscription limits
    const plan = PLANS[entitlement.tier_id];
    return {
      tier: entitlement.tier_id,
      isLifetime: true,
      limits: plan ? plan.employeeLimit : PLANS.free.employeeLimit,
      planDetails: plan || PLANS.free,
    };
  }

  // 2. Fallback to Subscription logic
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("plan_id, subscription_status")
    .eq("id", companyId)
    .single();

  if (!company || companyError) {
    return {
      tier: "free",
      isLifetime: false,
      limits: PLANS.free.employeeLimit,
      planDetails: PLANS.free,
    };
  }

  const isSubActive = ["active", "trialing"].includes(company.subscription_status || "");
  const activePlanId = isSubActive ? company.plan_id || "free" : "free";

  const plan = PLANS[activePlanId];

  return {
    tier: activePlanId,
    isLifetime: false,
    limits: plan ? plan.employeeLimit : PLANS.free.employeeLimit,
    planDetails: plan || PLANS.free,
  };
}
