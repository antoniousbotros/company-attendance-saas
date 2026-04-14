"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle2 } from "lucide-react";
import { PLANS, calculateExtraCosts } from "@/lib/billing";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";
import {
  PageHeader,
  SectionCard,
  StatusPill,
  PrimaryButton,
  HelpCard,
} from "@/app/components/talabat-ui";

export default function BillingPage() {
  const { t, isRTL } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("EGP");
  const [employeeCount, setEmployeeCount] = useState(0);

  // We fall back to a local generated trial if no backend payment system exists
  const [company, setCompany] = useState(() => {
    const trial_ends_at = new Date(Date.now() + 86400000 * 10).toISOString();
    return {
      plan_id: "growth",
      subscription_status: "trialing",
      trial_ends_at,
    };
  });

  useEffect(() => {
    async function loadBilling() {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return;
       const { data: comp } = await supabase.from("companies").select("id, currency").eq("owner_id", user.id).single();
       if (comp) {
          setCurrency(comp.currency || "EGP");
          const { count } = await supabase.from("employees").select("*", { count: "exact", head: true }).eq("company_id", comp.id);
          setEmployeeCount(count || 0);
       }
       setLoading(false);
    }
    loadBilling();
  }, []);

  const [daysLeft] = useState(() =>
    Math.max(
      0,
      Math.ceil(
        (new Date(company.trial_ends_at).getTime() - Date.now()) / 86400000
      )
    )
  );

  const currentPlan = PLANS[company.plan_id as keyof typeof PLANS];
  const extraCost = calculateExtraCosts(
    employeeCount,
    company.plan_id
  );
  const trialProgress = Math.min(100, ((14 - daysLeft) / 14) * 100);

  const extraCount = Math.max(
    0,
    employeeCount -
      (currentPlan.employeeLimit === Infinity ? employeeCount : currentPlan.employeeLimit)
  );
  const limitLabel =
    currentPlan.employeeLimit === Infinity ? "∞" : currentPlan.employeeLimit;

  return (
    <div className="space-y-8">
      <PageHeader
        title={t.billingTitle}
        subtitle={t.billingSubtitle}
        isRTL={isRTL}
      />

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Current plan */}
        <SectionCard>
          <div
            className={cn(
              "flex items-start justify-between mb-6",
              isRTL && "flex-row-reverse"
            )}
          >
            <div>
              <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                {t.currentPlan}
              </p>
              <p className="text-[32px] font-bold text-[#111] leading-tight tracking-tight mt-1">
                {currentPlan.name}
              </p>
              <p className="text-sm text-[#6b7280] mt-1">
                {currentPlan.price} {currency} / {isRTL ? "شهر" : "month"}
              </p>
            </div>
            <StatusPill
              label={
                company.subscription_status === "trialing"
                  ? t.activeTrial
                  : t.active
              }
              tone="success"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-y border-[#f1f1f1]">
            <div>
              <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-3">
                {t.planDetails}
              </p>
              <ul className="space-y-2.5">
                {currentPlan.features.map((f, i) => (
                  <li
                    key={i}
                    className={cn(
                      "flex items-center gap-2 text-sm text-[#4b5563]",
                      isRTL && "flex-row-reverse"
                    )}
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#1e8e3e] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-3">
                {t.trialInfo}
              </p>
              <p className="text-sm text-[#4b5563]">
                {t.trialEndsIn}{" "}
                <span className="font-bold text-[#111]">
                  {daysLeft} {t.days}
                </span>
                .
              </p>
              <div className="w-full h-1.5 bg-[#f1f1f1] rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-[#ff5a00] transition-all"
                  style={{ width: `${trialProgress}%` }}
                />
              </div>
              <p className="text-xs text-[#9ca3af] mt-2">
                {new Date(company.trial_ends_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-[#f1f1f1] pt-6 flex items-center justify-between gap-4">
            <p className="text-sm text-[#6b7280] max-w-sm text-start">
              {isRTL ? "الترقية متاحة لتحصل على ميزات أكبر لشركتك ورفع حدود الاستخدام." : "Upgrade to unlock enterprise features and raise your employee limits."}
            </p>
          </div>
        </SectionCard>
      </div>

      {/* Available Plans */}
      <div>
        <h2 className="text-lg font-bold text-[#111] mb-4 text-start">{isRTL ? "الباقات المتاحة للترقية" : "Available Plans"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: "starter", name: "Starter", arName: "أساسي", price: 49, limit: 10, features: ["Telegram Bot Access", "Daily Attendance Logs", "Simple Dashboard"], arFeatures: ["بوابة تليجرام", "سجلات يومية", "لوحة تحكم بسيطة"] },
            { id: "growth", name: "Growth", arName: "نمو", price: 499, limit: 50, popular: true, features: ["Everything in Starter", "Late Arrival Tracking", "CSV Export", "Team Notifications"], arFeatures: ["كل ميزات الأساسي", "نظام التأخيرات", "تصدير البيانات CSV", "إشعارات الفريق"] },
            { id: "pro", name: "Pro", arName: "احترافي", price: 899, limit: 150, features: ["Everything in Growth", "Advanced Analytics", "Employee Performance", "Multiple Admins"], arFeatures: ["كل ميزات النمو", "تحليلات متقدمة", "تقارير وتقييمات الموظفين", "مديرين متعددين"] },
            { id: "enterprise", name: "Enterprise", arName: "شركات الكبرى", price: "Custom", arPrice: "مخصص", limit: Infinity, features: ["Full Customization", "Dedicated Support", "API Access", "White-label Options"], arFeatures: ["تخصيص كامل", "دعم مخصص", "ربط API", "واجهة بعلامتك التجارية"] }
          ].map(p => (
            <SectionCard key={p.id} padding="default" className={cn("flex flex-col relative", p.popular && "border-[#ff5a00] ring-1 ring-[#ff5a00] shadow-md", company.plan_id === p.id && "bg-[#f9fafb]")}>
              {p.popular && <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-[#ff5a00] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">{isRTL ? "اﻷكثر طلباً" : "Popular"}</div>}
              {company.plan_id === p.id && <div className="absolute top-4 right-4 text-[#166534] bg-[#f0fdf4] text-[10px] font-bold px-2 py-0.5 rounded uppercase">{isRTL ? "نشط" : "Active"}</div>}
              
              <div className="mb-4 text-start">
                <h3 className="text-xl font-bold text-[#111]">{isRTL ? p.arName : p.name}</h3>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-black">{isRTL && p.arPrice ? p.arPrice : p.price}</span>
                  {p.price !== "Custom" && <span className="text-sm font-semibold text-[#6b7280]"> {currency} /{isRTL ? "شهر" : "mo"}</span>}
                </div>
                <p className="text-xs text-[#6b7280] font-medium mt-1">
                  {p.limit === Infinity ? (isRTL ? "موظفين بلا حدود" : "Unlimited employees") : (isRTL ? `حتى ${p.limit} موظف` : `Up to ${p.limit} employees`)}
                </p>
              </div>
              
              <ul className="space-y-2 mb-6 flex-1">
                 {(isRTL ? p.arFeatures : p.features).map((f, i) => (
                   <li key={i} className="flex items-start gap-2 text-xs font-semibold text-[#4b5563]">
                     <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
                     <span className="text-start">{f}</span>
                   </li>
                 ))}
              </ul>
              <PrimaryButton disabled={company.plan_id === p.id} className="w-full text-sm">
                {company.plan_id === p.id ? (isRTL ? "باقتك الحالية" : "Current Plan") : (isRTL ? "ترقية الباقة" : "Upgrade")}
              </PrimaryButton>
            </SectionCard>
          ))}
        </div>
      </div>

      {/* Usage */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-[#111] mb-3 text-start">{t.usage}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SectionCard>
            <div className="text-start">
              <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">
                {t.totalEmployeesLabel}
              </p>
              <p className="text-[28px] font-bold text-[#111]">
                {loading ? "..." : employeeCount}
              </p>
              <p className="text-xs text-[#9ca3af] mt-1">
                {t.planLimit}: {limitLabel}
              </p>
            </div>
          </SectionCard>
          <SectionCard>
            <div className="text-start">
              <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">
                {t.extraEmployees}
              </p>
              <p className="text-[28px] font-bold text-[#b45309]">{extraCount}</p>
              <p className="text-xs text-[#9ca3af] mt-1">{t.extraCost}</p>
            </div>
          </SectionCard>
          <SectionCard className="bg-[#fff1e8] border-[#ffd4b8]">
            <div className="text-start">
              <p className="text-xs font-semibold text-[#ff5a00] uppercase tracking-wider mb-2">
                {t.estimatedAddon}
              </p>
              <p className="text-[28px] font-bold text-[#ff5a00]">
                +{extraCost} {currency}
              </p>
              <p className="text-xs text-[#9ca3af] mt-1">{t.nextBill}</p>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Help */}
      <HelpCard
        title={t.needHelpTitle}
        subtitle={t.needHelpSubtitle}
        moreLabel={t.more}
        isRTL={isRTL}
        articles={[
          { title: t.article4Title, description: t.article4Desc },
          { title: t.article1Title, description: t.article1Desc },
          { title: t.article2Title, description: t.article2Desc },
          { title: t.article3Title, description: t.article3Desc },
        ]}
      />
    </div>
  );
}
