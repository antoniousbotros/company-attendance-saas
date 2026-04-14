"use client";

import React, { useState } from "react";
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

  // Mock data for demo — wire up once subscription queries land.
  // Lazy initializer so Date.now() is called once at mount, not during render.
  const [company] = useState(() => {
    const trial_ends_at = new Date(Date.now() + 86400000 * 10).toISOString();
    return {
      plan_id: "growth",
      subscription_status: "trialing",
      trial_ends_at,
      employee_count: 55,
    };
  });
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
    company.employee_count,
    company.plan_id
  );
  const trialProgress = Math.min(100, ((14 - daysLeft) / 14) * 100);

  const extraCount = Math.max(
    0,
    company.employee_count -
      (currentPlan.employeeLimit === Infinity ? company.employee_count : currentPlan.employeeLimit)
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current plan */}
        <SectionCard className="lg:col-span-2">
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
                {currentPlan.price} EGP / month
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

          <div
            className={cn(
              "mt-6 flex items-center justify-between gap-4",
              isRTL && "flex-row-reverse"
            )}
          >
            <p className="text-sm text-[#6b7280] max-w-sm">
              Upgrade to continue using premium features and raise your
              employee limit.
            </p>
            <PrimaryButton>{t.upgradePlan}</PrimaryButton>
          </div>
        </SectionCard>

        {/* Invoices */}
        <SectionCard>
          <div
            className={cn(
              "flex items-center justify-between mb-4",
              isRTL && "flex-row-reverse"
            )}
          >
            <h3 className="text-sm font-bold text-[#111]">
              {t.recentInvoices}
            </h3>
          </div>
          <div className="divide-y divide-[#f1f1f1]">
            {[1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center justify-between py-3",
                  isRTL && "flex-row-reverse"
                )}
              >
                <div>
                  <p className="text-sm font-semibold text-[#111]">
                    Inv #00{i}-24
                  </p>
                  <p className="text-xs text-[#9ca3af]">Oct 12, 2023</p>
                </div>
                <div className={cn("text-right", isRTL && "text-left")}>
                  <p className="text-sm font-bold text-[#111]">
                    {currentPlan.price} EGP
                  </p>
                  <StatusPill label={t.paid} tone="success" className="mt-1" />
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 text-sm font-medium text-[#ff5a00] hover:underline">
            {t.viewAllHistory}
          </button>
        </SectionCard>
      </div>

      {/* Usage */}
      <div>
        <h2 className="text-lg font-bold text-[#111] mb-3">{t.usage}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SectionCard>
            <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">
              {t.totalEmployeesLabel}
            </p>
            <p className="text-[28px] font-bold text-[#111]">
              {company.employee_count}
            </p>
            <p className="text-xs text-[#9ca3af] mt-1">
              {t.planLimit}: {limitLabel}
            </p>
          </SectionCard>
          <SectionCard>
            <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">
              {t.extraEmployees}
            </p>
            <p className="text-[28px] font-bold text-[#b45309]">{extraCount}</p>
            <p className="text-xs text-[#9ca3af] mt-1">{t.extraCost}</p>
          </SectionCard>
          <SectionCard className="bg-[#fff1e8] border-[#ffd4b8]">
            <p className="text-xs font-semibold text-[#ff5a00] uppercase tracking-wider mb-2">
              {t.estimatedAddon}
            </p>
            <p className="text-[28px] font-bold text-[#ff5a00]">
              {extraCost} EGP
            </p>
            <p className="text-xs text-[#9ca3af] mt-1">{t.nextBill}</p>
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
