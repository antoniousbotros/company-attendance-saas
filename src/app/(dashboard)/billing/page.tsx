"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, ReceiptText, CalendarClock, Users, XCircle, Zap } from "lucide-react";
import {
  PLANS, ALL_FEATURES, ALL_FEATURES_AR, EXTRA_EMPLOYEE_COST,
  calculateExtraCosts, monthlyEquivalent, YEARLY_DISCOUNT,
} from "@/lib/billing";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";
import {
  PageHeader,
  SectionCard,
  StatusPill,
  PrimaryButton,
  HelpCard,
} from "@/app/components/talabat-ui";

type BillingPeriod = "monthly" | "yearly";

function BillingPageInner() {
  const { t, isRTL } = useLanguage();
  const searchParams = useSearchParams();
  const paymentSuccess   = searchParams.get("success") === "true";
  const paymentCancelled = searchParams.get("cancelled") === "true";

  const [loading, setLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [currency] = useState("EGP");
  const [employeeCount, setEmployeeCount] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  const [company, setCompany] = useState({
    id: "",
    plan_id: "free",
    subscription_status: "active",
    trial_ends_at: null as string | null,
  });

  const handleUpgrade = async (planId: string) => {
    try {
      setIsUpgrading(planId);
      const { data: { user } } = await supabase.auth.getUser();
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner_id: user?.id, plan_id: planId, billing_period: billingPeriod }),
      });
      const data = await res.json();
      if (data.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to initialize payment. Please try again.");
        setIsUpgrading(null);
      }
    } catch (err) {
      console.error("[billing] handleUpgrade error:", err);
      setIsUpgrading(null);
    }
  };

  useEffect(() => {
    async function loadBilling() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: comp } = await supabase
        .from("companies")
        .select("id, plan_id, subscription_status, trial_ends_at")
        .eq("owner_id", user.id)
        .single();
      if (comp) {
        const effectivePlanId = comp.plan_id || "free";
        let effectiveStatus = comp.subscription_status || "active";
        if (effectivePlanId === "free" && effectiveStatus !== "active") {
          effectiveStatus = "active";
          supabase.from("companies").update({ plan_id: "free", subscription_status: "active" }).eq("id", comp.id).then(() => {});
        }
        setCompany({ id: comp.id, plan_id: effectivePlanId, subscription_status: effectiveStatus, trial_ends_at: comp.trial_ends_at || null });
        const [empRes, txnRes] = await Promise.all([
          supabase.from("employees").select("*", { count: "exact", head: true }).eq("company_id", comp.id),
          supabase.from("subscriptions").select("*").eq("company_id", comp.id).order("created_at", { ascending: false }),
        ]);
        setEmployeeCount(empRes.count || 0);
        setTransactions(txnRes.data || []);
      }
      setLoading(false);
    }
    loadBilling();
  }, []);

  const currentPlan = PLANS[company.plan_id] || PLANS.free;
  const extraCost = calculateExtraCosts(employeeCount, company.plan_id);
  const extraCount = Math.max(0, employeeCount - currentPlan.employeeLimit);
  const features = isRTL ? ALL_FEATURES_AR : ALL_FEATURES;

  // Only show paid plans in the pricing grid
  const paidPlanEntries = Object.entries(PLANS).filter(([id]) => id !== "free");
  const discountPct = Math.round(YEARLY_DISCOUNT * 100);

  // Plan rank for upgrade vs downgrade detection
  const planOrder = ["free", "basic", "pro", "business", "enterprise"];
  const currentPlanRank = planOrder.indexOf(company.plan_id);

  // Subscription status label + tone
  const statusConfig: Record<string, { label: string; tone: "success" | "danger" | "neutral" }> = {
    active:    { label: t.active,                                         tone: "success" },
    trialing:  { label: t.activeTrial,                                    tone: "neutral" },
    past_due:  { label: isRTL ? "تأخر في الدفع" : "Past Due",          tone: "danger"  },
    cancelled: { label: isRTL ? "ملغي" : "Cancelled",                   tone: "danger"  },
  };
  const statusInfo = statusConfig[company.subscription_status] ?? { label: company.subscription_status, tone: "neutral" as const };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader title={t.billingTitle} subtitle={t.billingSubtitle} isRTL={isRTL} />

      {/* Success / cancelled banners */}
      {paymentSuccess && (
        <div className="flex items-center gap-3 bg-[#e6f6ec] border border-[#bbf7d0] text-[#1e8e3e] px-5 py-4 rounded-xl font-semibold text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {isRTL ? "✅ تمت عملية الدفع بنجاح! تم تفعيل باقتك الجديدة." : "✅ Payment successful! Your new plan has been activated."}
        </div>
      )}
      {paymentCancelled && (
        <div className="flex items-center gap-3 bg-[#fef1f1] border border-[#fecaca] text-[#b91c1c] px-5 py-4 rounded-xl font-semibold text-sm">
          <XCircle className="w-5 h-5 shrink-0" />
          {isRTL ? "تم إلغاء عملية الدفع. لم يُخصم أي مبلغ." : "Payment cancelled. You have not been charged."}
        </div>
      )}

      {/* Past-due payment warning */}
      {company.subscription_status === "past_due" && (
        <div className="flex items-center justify-between gap-4 bg-[#fef2f2] border border-[#fecaca] rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <XCircle className="w-4 h-4 text-[#b91c1c] shrink-0" />
            <p className="text-sm font-bold text-[#b91c1c]">
              {isRTL
                ? "⚠️ فشلت عملية تجديد الدفع. يرجى تحديث بيانات الدفع لتجنّب تعطّل حسابك."
                : "⚠️ Your last payment failed. Please update your payment method to avoid service interruption."}
            </p>
          </div>
          <a
            href="https://billing.stripe.com"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-xs font-black text-white bg-[#b91c1c] px-4 py-2 rounded-lg hover:bg-[#991b1b] transition-all"
          >
            {isRTL ? "تحديث بيانات الدفع" : "Update Payment"}
          </a>
        </div>
      )}

      {/* Usage Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SectionCard className="bg-[#f9fafb]">
          <div className="text-start">
            <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-1">{t.currentPlan}</p>
            <p className="text-xl font-black text-[#111]">{isRTL ? currentPlan.nameAr : currentPlan.name}</p>
            <StatusPill label={statusInfo.label} tone={statusInfo.tone} />
          </div>
        </SectionCard>
        <SectionCard>
          <div className="text-start">
            <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-1">{t.totalEmployeesLabel}</p>
            <p className="text-xl font-black text-[#111]">
              {loading ? "..." : employeeCount} <span className="text-xs font-semibold text-[#9ca3af]">/ {currentPlan.employeeLimit}</span>
            </p>
            <div className="w-full h-1 bg-[#f1f1f1] rounded-full mt-2 overflow-hidden">
              <div
                className={cn("h-full transition-all rounded-full", extraCount > 0 ? "bg-[#ef4444]" : "bg-[#1e8e3e]")}
                style={{ width: `${Math.min(100, (employeeCount / currentPlan.employeeLimit) * 100)}%` }}
              />
            </div>
          </div>
        </SectionCard>
        <SectionCard>
          <div className="text-start">
            <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-1">{t.extraEmployees}</p>
            <p className="text-xl font-black text-[#b45309]">+{extraCount}</p>
            <p className="text-[10px] text-[#9ca3af] mt-1 font-medium">
              {isRTL ? `${EXTRA_EMPLOYEE_COST} جنيه/موظف إضافي` : `${EXTRA_EMPLOYEE_COST} EGP/extra employee`}
            </p>
          </div>
        </SectionCard>
        <SectionCard className="bg-[#fff1e8] border-[#ffd4b8]">
          <div className="text-start">
            <p className="text-[10px] font-black text-[#ff5a00] uppercase tracking-wider mb-1">{t.estimatedAddon}</p>
            <p className="text-xl font-black text-[#ff5a00]">+{extraCost} {currency}</p>
            <p className="text-[10px] text-[#9ca3af] mt-1 font-medium">{t.nextBill}</p>
          </div>
        </SectionCard>
      </div>

      {/* All features banner */}
      <SectionCard className="bg-[#f9fafb]">
        <p className="text-sm font-bold text-[#111] mb-3 text-start">
          {isRTL ? "جميع الميزات متاحة في كل الباقات" : "All features included in every plan"}
        </p>
        <div className="flex flex-wrap gap-2">
          {features.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4b5563] bg-white border border-[#e0e0e0] px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1e8e3e]" />
              {f}
            </span>
          ))}
        </div>
      </SectionCard>

      {/* ── Plan switcher + cards ── */}
      <div>
        {/* Period toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold text-[#111] text-start">
            {isRTL ? "اختر باقتك" : "Choose your plan"}
          </h2>

          {/* Toggle pill */}
          <div className="flex items-center self-start sm:self-auto bg-[#f3f4f6] rounded-xl p-1 gap-1">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                billingPeriod === "monthly"
                  ? "bg-white text-[#111] shadow-sm"
                  : "text-[#6b7280] hover:text-[#111]"
              )}
            >
              {isRTL ? "شهري" : "Monthly"}
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={cn(
                "relative px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                billingPeriod === "yearly"
                  ? "bg-[#ff5a00] text-white shadow-sm"
                  : "text-[#6b7280] hover:text-[#111]"
              )}
            >
              {isRTL ? "سنوي" : "Annual"}
              <span className={cn(
                "text-[10px] font-black px-1.5 py-0.5 rounded-full",
                billingPeriod === "yearly"
                  ? "bg-white text-[#ff5a00]"
                  : "bg-[#ffece0] text-[#ff5a00]"
              )}>
                -{discountPct}%
              </span>
            </button>
          </div>
        </div>

        {/* Annual savings banner */}
        {billingPeriod === "yearly" && (
          <div className="flex items-center gap-2 bg-[#fff8f0] border border-[#ffd4b8] px-4 py-3 rounded-xl mb-5">
            <Zap className="w-4 h-4 text-[#ff5a00] shrink-0" />
            <p className="text-sm font-semibold text-[#b45309]">
              {isRTL
                ? `وفّر ${discountPct}% عند الدفع السنوي — الفاتورة تُدفع مرة واحدة كل عام.`
                : `Save ${discountPct}% with annual billing — charged once per year.`}
            </p>
          </div>
        )}

        {/* Plan cards grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {paidPlanEntries.map(([id, plan]) => {
            const isCurrent = company.plan_id === id;
            const isPopular = plan.popular;
            const cardRank = planOrder.indexOf(id);
            const isDowngrade = !isCurrent && cardRank < currentPlanRank;
            const displayPrice = billingPeriod === "yearly"
              ? monthlyEquivalent(plan)
              : plan.price;
            const yearlyTotal = plan.yearlyPrice;

            return (
              <SectionCard
                key={id}
                padding="default"
                className={cn(
                  "flex flex-col relative",
                  isPopular && "border-[#ff5a00] ring-1 ring-[#ff5a00]",
                  isCurrent && "bg-[#f9fafb]"
                )}
              >
                {isPopular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#ff5a00] text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                    {isRTL ? "الأكثر طلباً" : "Popular"}
                  </div>
                )}

                <div className="text-start flex-1">
                  <h3 className="text-base font-bold text-[#111]">{isRTL ? plan.nameAr : plan.name}</h3>

                  {/* Price display */}
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-[#111]">{displayPrice}</span>
                    <span className="text-xs font-semibold text-[#6b7280]">{currency}/{isRTL ? "شهر" : "mo"}</span>
                  </div>

                  {/* Billed yearly note */}
                  {billingPeriod === "yearly" && (
                    <p className="text-[10px] text-[#ff5a00] font-semibold mt-0.5">
                      {isRTL ? `${yearlyTotal} جنيه/سنة` : `${yearlyTotal} EGP/year`}
                    </p>
                  )}

                  {/* Monthly original price crossed out when yearly */}
                  {billingPeriod === "yearly" && (
                    <p className="text-[10px] text-[#9ca3af] line-through mt-0.5">
                      {plan.price} {currency}/{isRTL ? "شهر" : "mo"}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 mt-2 text-[#6b7280]">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">
                      {isRTL ? `حتى ${plan.employeeLimit} موظف` : `Up to ${plan.employeeLimit} employees`}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <PrimaryButton
                    disabled={isCurrent || isUpgrading !== null}
                    onClick={() => handleUpgrade(id)}
                    className={cn(
                      "w-full text-xs",
                      isDowngrade && !isCurrent && "bg-[#6b7280] hover:bg-[#4b5563]"
                    )}
                  >
                    {isUpgrading === id
                      ? (isRTL ? "جاري التحويل..." : "Redirecting...")
                      : isCurrent
                        ? (isRTL ? "باقتك الحالية" : "Current Plan")
                        : isDowngrade
                          ? (isRTL ? "تخفيض الباقة" : "Downgrade")
                          : (isRTL ? "ترقية الآن" : "Upgrade Now")}
                  </PrimaryButton>
                </div>
              </SectionCard>
            );
          })}
        </div>
        <p className="text-xs text-[#6b7280] font-medium mt-3 text-start">
          {isRTL
            ? `تحتاج موظفين أكثر؟ أضف موظفين إضافيين بـ ${EXTRA_EMPLOYEE_COST} جنيه/شهر لكل موظف.`
            : `Need more employees? Add extra for ${EXTRA_EMPLOYEE_COST} EGP/month each.`}
        </p>
      </div>

      {/* Transactions Record */}
      <div className="pt-4">
        <h2 className="text-lg font-bold text-[#111] mb-4 text-start flex items-center gap-2">
          <ReceiptText className="w-5 h-5 text-[#ff5a00]" />
          {isRTL ? "سجل المدفوعات" : "Transactions Record"}
        </h2>
        <SectionCard padding="none" className="overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-[#6b7280]">{isRTL ? "جاري التحميل..." : "Loading..."}</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-[#f9fafb] rounded-full flex items-center justify-center mb-3">
                <CalendarClock className="w-5 h-5 text-[#9ca3af]" />
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
                    <th className="px-6 py-4 text-xs font-bold text-[#6b7280] uppercase tracking-wider text-start">{isRTL ? "الحالة" : "Status"}</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#6b7280] uppercase tracking-wider text-start">{isRTL ? "رقم المرجع" : "Ref ID"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f1f1]">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#f9fafb] transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-[#111]">{new Date(tx.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm font-black text-[#111]">{tx.amount} {tx.currency}</td>
                      <td className="px-6 py-4">
                        <StatusPill
                          label={tx.status}
                          tone={tx.status === "succeeded" || tx.status === "paid" ? "success" : tx.status === "pending" ? "neutral" : "danger"}
                        />
                      </td>
                      <td className="px-6 py-4 text-xs text-[#9ca3af] font-mono">
                        {tx.stripe_session_id || tx.paymob_order_id || tx.merchant_order_id || tx.id.substring(0, 8) + "..."}
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

export default function BillingPage() {
  return (
    <Suspense>
      <BillingPageInner />
    </Suspense>
  );
}
