export interface Plan {
  name: string;
  nameAr: string;
  price: number;        // monthly price EGP
  yearlyPrice: number;  // total yearly price EGP (30% off)
  employeeLimit: number;
  popular?: boolean;
}

// 30% yearly discount constant
export const YEARLY_DISCOUNT = 0.30;
export const TRIAL_DAYS = 7;

export const PLANS: Record<string, Plan> = {
  free: {
    name: "Free",
    nameAr: "مجاني",
    price: 0,
    yearlyPrice: 0,
    employeeLimit: 3,
  },
  basic: {
    name: "Basic",
    nameAr: "أساسي",
    price: 79,
    yearlyPrice: Math.round(79 * 12 * (1 - YEARLY_DISCOUNT)), // 664
    employeeLimit: 10,
  },
  pro: {
    name: "Pro",
    nameAr: "احترافي",
    price: 249,
    yearlyPrice: Math.round(249 * 12 * (1 - YEARLY_DISCOUNT)), // 2092
    employeeLimit: 30,
    popular: true,
  },
  business: {
    name: "Business",
    nameAr: "أعمال",
    price: 699,
    yearlyPrice: Math.round(699 * 12 * (1 - YEARLY_DISCOUNT)), // 5872
    employeeLimit: 75,
  },
  enterprise: {
    name: "Enterprise",
    nameAr: "شركات",
    price: 1199,
    yearlyPrice: Math.round(1199 * 12 * (1 - YEARLY_DISCOUNT)), // 10072
    employeeLimit: 200,
  },
};

// Helper: effective monthly price when billed yearly
export function monthlyEquivalent(plan: Plan): number {
  return Math.round(plan.yearlyPrice / 12);
}

// All features are included in every plan
export const ALL_FEATURES = [
  "Telegram Bot",
  "Attendance Tracking",
  "Late Arrival Tracking",
  "Daily Reports",
  "CSV Export",
  "Team Notifications",
  "Multi-Admin",
  "Analytics",
];

export const ALL_FEATURES_AR = [
  "بوت تليجرام",
  "تتبع الحضور",
  "نظام التأخيرات",
  "تقارير يومية",
  "تصدير CSV",
  "إشعارات الفريق",
  "تعدد المديرين",
  "تحليلات",
];

export const EXTRA_EMPLOYEE_COST = 30; // EGP per extra employee

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
