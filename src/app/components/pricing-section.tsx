"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { PLANS, ALL_FEATURES, ALL_FEATURES_AR, monthlyEquivalent, YEARLY_DISCOUNT } from "@/lib/billing";

export default function PricingSection() {
  const { isRTL } = useLanguage();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");

  const planEntries = Object.entries(PLANS);
  const features = isRTL ? ALL_FEATURES_AR : ALL_FEATURES;

  return (
    <section id="pricing" className="py-32 px-6 bg-[#f9fafb]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#111]">
            {isRTL ? "باقات بسيطة، كل الميزات" : "Simple plans, all features included"}
          </h2>
          <p className="text-[#6b7280] font-bold text-lg max-w-xl mx-auto">
            {isRTL
              ? "الفرق الوحيد هو عدد الموظفين. كل الميزات متاحة في كل الباقات."
              : "The only difference is the number of employees. Every feature is included in every plan."}
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-[#eeeeee] p-1 rounded-xl inline-flex relative items-center gap-2">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={cn("px-6 py-2 rounded-lg text-sm font-bold transition-all z-10", billingPeriod === "monthly" ? "bg-white text-[#111] shadow-sm" : "text-[#6b7280] hover:text-[#111]")}
            >
              {isRTL ? "شهري" : "Monthly"}
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={cn("px-6 py-2 rounded-lg text-sm font-bold transition-all z-10 flex items-center gap-2", billingPeriod === "yearly" ? "bg-white text-[#111] shadow-sm" : "text-[#6b7280] hover:text-[#111]")}
            >
              {isRTL ? "سنوي" : "Yearly"}
              <span className="bg-[#ecfdf5] text-[#10b981] text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                {isRTL ? "خصم 30%" : "Save 30%"}
              </span>
            </button>
          </div>
        </div>

        {/* Shared Features */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {features.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4b5563] bg-white border border-[#eeeeee] px-4 py-2 rounded-lg shadow-sm">
              <Check className="w-4 h-4 text-[#1e8e3e]" />
              {f}
            </span>
          ))}
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 max-w-[1400px] mx-auto">
          {planEntries.map(([id, plan]) => (
            <div
              key={id}
              className={cn(
                "relative rounded-2xl p-6 md:p-8 border transition-all duration-300",
                plan.popular
                  ? "bg-[#ff5a00] border-[#e04f00] shadow-xl scale-[1.02]"
                  : "bg-white border-[#eeeeee] hover:border-[#ff5a00]/40 shadow-sm"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-[#fff1e8] text-[#ff5a00] ring-1 ring-[#ffd4b8] text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                    {isRTL ? "الأكثر طلباً" : "Most Popular"}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className={cn("text-lg font-black mb-2", plan.popular ? "text-white" : "text-[#111]")}>
                  {isRTL ? plan.nameAr : plan.name}
                </h3>
                <div className="flex items-baseline gap-1" dir="ltr">
                  {plan.price === 0 ? (
                    <span className={cn("text-3xl font-black", plan.popular ? "text-white" : "text-[#1e8e3e]")}>
                      {isRTL ? "مجاني" : "Free"}
                    </span>
                  ) : (
                    <>
                      <span className={cn("text-3xl font-black", plan.popular ? "text-white" : "text-[#111]")}>
                        {billingPeriod === "yearly" ? monthlyEquivalent(plan) : plan.price}
                      </span>
                      <span className={cn("text-sm font-bold", plan.popular ? "text-white/70" : "text-[#9ca3af]")}>
                        EGP/mo
                      </span>
                    </>
                  )}
                </div>
                {billingPeriod === "yearly" && plan.price > 0 && (
                  <p className={cn("text-xs font-bold mt-1 tracking-tight", plan.popular ? "text-white/80" : "text-[#10b981]")}>
                    {isRTL ? `تدفع سنويًا (${plan.yearlyPrice} ج.م)` : `Billed annually (${plan.yearlyPrice} EGP)`}
                  </p>
                )}
              </div>

              <div className={cn("flex items-center gap-2 mb-6 pb-6 border-b", plan.popular ? "border-white/20" : "border-[#eeeeee]")}>
                <Users className={cn("w-4 h-4", plan.popular ? "text-white/70" : "text-[#6b7280]")} />
                <span className={cn("text-sm font-bold", plan.popular ? "text-white/90" : "text-[#4b5563]")}>
                  {isRTL ? `حتى ${plan.employeeLimit} موظف` : `Up to ${plan.employeeLimit} employees`}
                </span>
              </div>

              <Link 
                href="/signup"
                className={cn(
                  "w-full py-3 rounded-lg font-black transition-all text-sm flex items-center justify-center",
                  plan.popular
                    ? "bg-white text-[#ff5a00] hover:bg-[#fff1e8]"
                    : "bg-[#111] text-white hover:bg-[#111]/80"
                )}>
                {plan.price === 0
                  ? (isRTL ? "ابدأ مجاناً" : "Start Free")
                  : (isRTL ? "ابدأ الآن" : "Get Started")}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
