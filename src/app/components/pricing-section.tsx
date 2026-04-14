"use client";

import React from "react";
import { Check, Zap, Sparkles, Building2, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    price: "149",
    employees: "10",
    icon: Zap,
    features: ["Telegram Bot Access", "Daily Attendance Logs", "Simple Dashboard"],
    color: "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
  },
  {
    name: "Growth",
    price: "499",
    employees: "50",
    popular: true,
    icon: Sparkles,
    features: ["Everything in Starter", "Late Arrival Tracking", "CSV Export", "Team Notifications"],
    color: "bg-indigo-600 text-white shadow-indigo-600/30",
    description: "+5 EGP per extra employee"
  },
  {
    name: "Pro",
    price: "899",
    employees: "150",
    icon: Building2,
    features: ["Everything in Growth", "Advanced Analytics", "Employee Performance", "Multiple Admins"],
    color: "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
  },
  {
    name: "Enterprise",
    price: "Custom",
    employees: "Unlimited",
    icon: Crown,
    features: ["Full Customization", "Dedicated Support", "API Access", "White-label Options"],
    color: "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
  }
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">باقات تناسب نمو شركتك</h2>
          <p className="text-zinc-500 font-bold text-lg">أسعار بسيطة، بدون تعقيدات، تدفع فقط لما تستخدمه.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={cn(
                "relative group h-full rounded-[3rem] p-10 border transition-all duration-300 transform hover:-translate-y-2",
                plan.popular 
                  ? "bg-indigo-600 border-indigo-500 shadow-2xl scale-105" 
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 shadow-sm"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mb-6",
                  plan.popular ? "bg-white/20 text-white" : "bg-indigo-50 dark:bg-zinc-800 text-indigo-600"
                )}>
                  <plan.icon className="w-8 h-8" />
                </div>
                <h3 className={cn("text-2xl font-black mb-2", plan.popular ? "text-white" : "text-foreground")}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className={cn("text-4xl font-black", plan.popular ? "text-white" : "text-foreground")}>
                    {plan.price}
                  </span>
                  {plan.price !== "Custom" && (
                    <span className={plan.popular ? "text-indigo-200" : "text-zinc-500 font-bold"}>EGP/mo</span>
                  )}
                </div>
                {plan.description && <p className="text-xs font-bold mt-2 text-indigo-200">{plan.description}</p>}
              </div>

              <div className={cn("h-[1px] w-full mb-8", plan.popular ? "bg-white/10" : "bg-zinc-100 dark:bg-zinc-800")} />

              <ul className="space-y-4 mb-10 min-h-[220px]">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className={cn("w-5 h-5 shrink-0 mt-0.5", plan.popular ? "text-white" : "text-emerald-500")} />
                    <span className={cn("text-sm font-bold", plan.popular ? "text-white/90" : "text-zinc-600 dark:text-zinc-400")}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button className={cn(
                "w-full py-4 rounded-2xl font-black transition-all text-sm",
                plan.popular 
                  ? "bg-white text-indigo-600 hover:bg-zinc-100 shadow-xl" 
                  : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-black dark:hover:bg-zinc-200"
              )}>
                {plan.name === "Enterprise" ? "Contact Us" : "Start Free Trial"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
