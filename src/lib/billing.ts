export interface Plan {
  name: string;
  price: number;
  employeeLimit: number;
  features: string[];
  popular?: boolean;
}

export const PLANS: Record<string, Plan> = {
  starter: {
    name: "Starter",
    price: 149,
    employeeLimit: 10,
    features: ["Attendance tracking", "Telegram bot", "Simple dashboard"],
  },
  growth: {
    name: "Growth",
    price: 399,
    employeeLimit: 50,
    features: ["Advanced reports", "Late tracking", "Notifications", "Export CSV"],
    popular: true,
  },
  pro: {
    name: "Pro",
    price: 799,
    employeeLimit: Infinity,
    features: ["GPS tracking", "Selfie verification", "Multi-admin", "API access"],
  },
  enterprise: {
    name: "Enterprise",
    price: 3000,
    employeeLimit: Infinity,
    features: ["White-label", "Custom domain", "Dedicated support"],
  },
};

export const EXTRA_EMPLOYEE_COST = 5;

export function calculateExtraCosts(employeeCount: number, planId: string) {
  const plan = PLANS[planId];
  if (!plan) return 0;
  
  if (employeeCount > plan.employeeLimit) {
    return (employeeCount - plan.employeeLimit) * EXTRA_EMPLOYEE_COST;
  }
  return 0;
}

export function isTrialActive(trialEndsAt: string) {
  return new Date(trialEndsAt) > new Date();
}
