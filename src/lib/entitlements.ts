import { supabaseAdmin } from "@/lib/supabase";
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
  // Fetch both LTD and Subscription concurrently
  const [ltdReq, compReq] = await Promise.all([
    supabaseAdmin
      .from("company_entitlements")
      .select("tier_id")
      .eq("company_id", companyId)
      .eq("status", "active")
      .single(),
    supabaseAdmin
      .from("companies")
      .select("plan_id, subscription_status")
      .eq("id", companyId)
      .single()
  ]);

  const ltdPlanId = (ltdReq.data && !ltdReq.error) ? ltdReq.data.tier_id : null;
  const isSubActive = compReq.data && ["active", "trialing"].includes(compReq.data.subscription_status || "");
  const subPlanId = isSubActive ? (compReq.data?.plan_id || "free") : "free";

  let finalPlanId = "free";
  let isLifetime = false;

  if (ltdPlanId) {
    // If LTD exists, check if Subscription provides higher limits
    const ltdLimit = PLANS[ltdPlanId]?.employeeLimit || 0;
    const subLimit = PLANS[subPlanId]?.employeeLimit || 0;

    if (subLimit > ltdLimit) {
      finalPlanId = subPlanId;
      isLifetime = false; // Using the paid sub because it's higher
    } else {
      finalPlanId = ltdPlanId;
      isLifetime = true;
    }
  } else {
    finalPlanId = subPlanId;
  }

  const plan = PLANS[finalPlanId];

  return {
    tier: finalPlanId,
    isLifetime: isLifetime,
    limits: plan ? plan.employeeLimit : PLANS.free.employeeLimit,
    planDetails: plan || PLANS.free,
  };
}
