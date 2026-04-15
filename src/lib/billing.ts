export interface Plan {
  name: string;
  nameAr: string;
  price: number;
  employeeLimit: number;
  popular?: boolean;
}

export const PLANS: Record<string, Plan> = {
  free: {
    name: "Free",
    nameAr: "مجاني",
    price: 0,
    employeeLimit: 5,
  },
  starter: {
    name: "Starter",
    nameAr: "أساسي",
    price: 149,
    employeeLimit: 10,
  },
  pro: {
    name: "Pro",
    nameAr: "احترافي",
    price: 499,
    employeeLimit: 25,
    popular: true,
  },
  enterprise: {
    name: "Enterprise",
    nameAr: "شركات",
    price: 999,
    employeeLimit: 50,
  },
};

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

export const EXTRA_EMPLOYEE_COST = 50;

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
