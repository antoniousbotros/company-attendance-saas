"use client";

import React from "react";
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight,
  TrendingUp,
  Receipt
} from "lucide-react";
import { PLANS, calculateExtraCosts } from "@/lib/billing";
import { cn } from "@/lib/utils";

export default function BillingPage() {
  // Mock data for demo
  const company = {
    plan_id: "growth",
    subscription_status: "trialing",
    trial_ends_at: new Date(Date.now() + 86400000 * 10).toISOString(),
    employee_count: 55,
  };

  const currentPlan = PLANS[company.plan_id as keyof typeof PLANS];
  const extraCost = calculateExtraCosts(company.employee_count, company.plan_id);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-zinc-400 mt-2">Manage your subscription, plan, and payment methods.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Plan Summary */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <CreditCard className="w-32 h-32 text-indigo-500" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">Current Plan</h2>
                  <p className="text-4xl font-black mt-1 text-indigo-400">{currentPlan.name}</p>
                </div>
                <div className="px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-bold uppercase text-xs">Active Trial</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-y border-zinc-800">
                <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase mb-4">Plan Details</p>
                  <ul className="space-y-3">
                    {currentPlan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                        <CheckCircle2 className="w-4 h-4 text-zinc-600" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase mb-4">Trial Information</p>
                  <p className="text-zinc-300 text-sm mb-2">Your trial ends in <span className="text-white font-bold">10 days</span>.</p>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full w-[70%]" />
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-2 italic text-center text-rose-400 font-bold uppercase">
                    Ends on {new Date(company.trial_ends_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                <p className="text-zinc-500 text-sm max-w-sm">
                  Upgrade to continue using premium features and increase your employee limit.
                </p>
                <button className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3.5 rounded-2xl transition-all shadow-xl shadow-indigo-500/20">
                  Upgrade Plan Now
                </button>
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
              Usage & Scaling
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-900">
                <p className="text-xs font-bold text-zinc-600 uppercase mb-2">Total Employees</p>
                <p className="text-3xl font-black">{company.employee_count}</p>
                <p className="text-xs text-zinc-500 mt-1">Limit: {currentPlan.employeeLimit}</p>
              </div>
              <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-900 text-amber-500">
                <p className="text-xs font-bold text-zinc-600 uppercase mb-2">Extra Employees</p>
                <p className="text-3xl font-black">{Math.max(0, company.employee_count - currentPlan.employeeLimit)}</p>
                <p className="text-xs text-zinc-500 mt-1">+5 EGP per employee</p>
              </div>
              <div className="p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 text-indigo-400">
                <p className="text-xs font-bold text-zinc-600 uppercase mb-2">Estimated Add-on</p>
                <p className="text-3xl font-black">{extraCost} EGP</p>
                <p className="text-xs text-zinc-500 mt-1">Next bill summary</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Invoices & Help */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <h4 className="font-bold flex items-center gap-2 mb-4">
              <Receipt className="w-5 h-5 text-zinc-400" />
              Recent Invoices
            </h4>
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium">Inv #00{i}-24</p>
                    <p className="text-xs text-zinc-500">Oct 12, 2023</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">149 EGP</p>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase">Paid</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
              View All History
            </button>
          </div>

          <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-6">
            <AlertCircle className="w-8 h-8 text-indigo-400 mb-4" />
            <h4 className="font-bold text-indigo-400 mb-2">Need help?</h4>
            <p className="text-xs text-indigo-300/70 leading-relaxed">
              If you have questions about your billing or need a custom enterprise plan, contact our support team.
            </p>
            <button className="mt-4 text-sm font-bold text-white underline decoration-indigo-400 hover:text-indigo-200">
              Chat with Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
