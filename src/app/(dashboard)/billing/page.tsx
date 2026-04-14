"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, ReceiptText, CalendarClock } from "lucide-react";
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
  const [transactions, setTransactions] = useState<any[]>([]);

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
          
          const [empRes, txnRes] = await Promise.all([
             supabase.from("employees").select("*", { count: "exact", head: true }).eq("company_id", comp.id),
             supabase.from("subscriptions").select("*").eq("company_id", comp.id).order('created_at', { ascending: false })
          ]);
          
          setEmployeeCount(empRes.count || 0);
          setTransactions(txnRes.data || []);
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader
        title={t.billingTitle}
        subtitle={t.billingSubtitle}
        isRTL={isRTL}
      />

      {/* 1. Limitations & Usage Metrics */}
      <div>
        <h2 className="text-lg font-bold text-[#111] mb-4 text-start">{isRTL ? "استخدام الباقة الحالية" : "Current Plan Limitations"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <SectionCard className="md:col-span-1 bg-[#f9fafb]">
            <div className={cn("flex flex-col text-start h-full justify-between")}>
              <div>
                <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">
                  {t.currentPlan}
                </p>
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-2xl font-black text-[#111] leading-none">
                    {currentPlan.name}
                  </p>
                  <StatusPill
                    label={company.subscription_status === "trialing" ? t.activeTrial : t.active}
                    tone="success"
                  />
                </div>
                <p className="text-xs font-bold text-[#6b7280]">
                  {currentPlan.price} {currency} / {isRTL ? "شهر" : "mo"}
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard className="md:col-span-1">
            <div className="text-start">
              <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">
                {t.totalEmployeesLabel}
              </p>
              <p className="text-[28px] font-black text-[#111]">
                {loading ? "..." : employeeCount} <span className="text-sm font-semibold text-[#9ca3af]">/ {limitLabel}</span>
              </p>
              <div className="w-full h-1.5 bg-[#f1f1f1] rounded-full mt-3 overflow-hidden">
                <div
                  className={cn("h-full transition-all", employeeCount > (currentPlan.employeeLimit || 0) ? "bg-[#ef4444]" : "bg-[#1e8e3e]")}
                  style={{ width: `${Math.min(100, (employeeCount / (currentPlan.employeeLimit === Infinity ? 1 : currentPlan.employeeLimit)) * 100)}%` }}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard className="md:col-span-1">
            <div className="text-start">
              <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">
                {t.extraEmployees}
              </p>
              <p className="text-[28px] font-black text-[#b45309]">+{extraCount}</p>
              <p className="text-xs text-[#9ca3af] mt-2 font-medium">{t.extraCost}</p>
            </div>
          </SectionCard>

          <SectionCard className="md:col-span-1 bg-[#fff1e8] border-[#ffd4b8]">
            <div className="text-start">
              <p className="text-xs font-black text-[#ff5a00] uppercase tracking-wider mb-2">
                {t.estimatedAddon}
              </p>
              <p className="text-[28px] font-black text-[#ff5a00]">
                +{extraCost} {currency}
              </p>
              <p className="text-xs text-[#9ca3af] mt-2 font-medium">{t.nextBill}</p>
            </div>
          </SectionCard>

        </div>
      </div>

      {/* 2. Available Plans */}
      <div className="pt-4">
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

      {/* 3. Transactions Record */}
      <div className="pt-4">
        <h2 className="text-lg font-bold text-[#111] mb-4 text-start flex items-center gap-2">
          <ReceiptText className="w-5 h-5 text-[#ff5a00]"/> 
          {isRTL ? "سجل المدفوعات" : "Transactions Record"}
        </h2>
        <SectionCard padding="none" className="overflow-hidden">
          {loading ? (
             <div className="p-8 text-center text-sm text-[#6b7280]">{isRTL ? "جاري التحميل..." : "Loading..."}</div>
          ) : transactions.length === 0 ? (
             <div className="p-12 text-center flex flex-col items-center">
               <div className="w-12 h-12 bg-[#f9fafb] rounded-full flex items-center justify-center mb-3">
                 <CalendarClock className="w-5 h-5 text-[#9ca3af]"/>
               </div>
               <p className="text-sm font-bold text-[#111]">{isRTL ? "لا توجد معاملات سابقة" : "No recent transactions"}</p>
               <p className="text-xs text-[#6b7280] mt-1">{isRTL ? "ستظهر فواتيرك هنا بمجرد الترقية." : "Your invoices will appear here once you upgrade."}</p>
             </div>
          ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-start">
                 <thead className="bg-[#f9fafb] border-b border-[#f1f1f1]">
                   <tr>
                     <th className="px-6 py-4 text-xs font-bold text-[#6b7280] uppercase tracking-wider text-start">{isRTL ? "التاريخ" : "Date"}</th>
                     <th className="px-6 py-4 text-xs font-bold text-[#6b7280] uppercase tracking-wider text-start">{isRTL ? "المبلغ" : "Amount"}</th>
                     <th className="px-6 py-4 text-xs font-bold text-[#6b7280] uppercase tracking-wider text-start">{isRTL ? "العملة" : "Currency"}</th>
                     <th className="px-6 py-4 text-xs font-bold text-[#6b7280] uppercase tracking-wider text-start">{isRTL ? "الحالة" : "Status"}</th>
                     <th className="px-6 py-4 text-xs font-bold text-[#6b7280] uppercase tracking-wider text-start">{isRTL ? "رقم المرجع" : "Ref ID"}</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[#f1f1f1]">
                   {transactions.map((tx) => (
                     <tr key={tx.id} className="hover:bg-[#f9fafb] transition-colors">
                       <td className="px-6 py-4 text-sm font-semibold text-[#111]">
                         {new Date(tx.created_at).toLocaleDateString()}
                       </td>
                       <td className="px-6 py-4 text-sm font-black text-[#111]">{tx.amount}</td>
                       <td className="px-6 py-4 text-sm font-semibold text-[#6b7280]">{tx.currency}</td>
                       <td className="px-6 py-4">
                         <StatusPill 
                            label={tx.status} 
                            tone={tx.status === 'succeeded' || tx.status === 'paid' ? 'success' : tx.status === 'pending' ? 'neutral' : 'danger'} 
                         />
                       </td>
                       <td className="px-6 py-4 text-xs text-[#9ca3af] font-mono">
                         {tx.stripe_id || tx.id.substring(0, 8) + '...'}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          )}
        </SectionCard>
      </div>

      {/* Help */}
      <div className="pt-4">
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
    </div>
  );
}
