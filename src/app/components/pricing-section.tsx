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
    color: "bg-white text-[#111]"
  },
  {
    name: "Growth",
    price: "499",
    employees: "50",
    popular: true,
    icon: Sparkles,
    features: ["Everything in Starter", "Late Arrival Tracking", "CSV Export", "Team Notifications"],
    color: "bg-[#ff5a00] text-white shadow-[#ff5a00]/30",
    description: "+5 EGP per extra employee"
  },
  {
    name: "Pro",
    price: "899",
    employees: "150",
    icon: Building2,
    features: ["Everything in Growth", "Advanced Analytics", "Employee Performance", "Multiple Admins"],
    color: "bg-white text-[#111]"
  },
  {
    name: "Enterprise",
    price: "Custom",
    employees: "Unlimited",
    icon: Crown,
    features: ["Full Customization", "Dedicated Support", "API Access", "White-label Options"],
    color: "bg-white text-[#111]"
  }
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-32 px-6 bg-[#f9fafb]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#111] rtl" dir="rtl">باقات تناسب نمو شركتك</h2>
          <p className="text-[#6b7280] font-bold text-lg rtl" dir="rtl">أسعار بسيطة، بدون تعقيدات، تدفع فقط لما تستخدمه.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={cn(
                "relative group h-full rounded-3xl p-10 border transition-all duration-300 transform hover:-translate-y-2",
                plan.popular 
                  ? "bg-[#ff5a00] border-[#e04f00] shadow-2xl scale-105" 
                  : "bg-white border-[#eeeeee] hover:border-[#ff5a00]/50 shadow-sm"
              )}
              dir="ltr"
            >
              {plan.popular && (
                <div className="flex justify-center absolute -top-4 inset-x-0 mx-auto">
                  <div className="bg-[#fff1e8] text-[#ff5a00] ring-1 ring-[#ffd4b8] text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="mb-8">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ring-1",
                  plan.popular ? "bg-[#e04f00]/50 text-white ring-white/20" : "bg-[#fff1e8] text-[#ff5a00] ring-[#ffd4b8]"
                )}>
                  <plan.icon className={cn("w-8 h-8", plan.popular ? "fill-white/80" : "fill-[#ff5a00]/80")} />
                </div>
                <h3 className={cn("text-2xl font-black mb-2", plan.popular ? "text-white" : "text-[#111]")}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className={cn("text-4xl font-black", plan.popular ? "text-white" : "text-[#111]")}>
                    {plan.price}
                  </span>
                  {plan.price !== "Custom" && (
                     <span className={plan.popular ? "text-[#fff1e8]" : "text-[#9ca3af] font-bold"}>EGP/mo</span>
                  )}
                </div>
                {plan.description && <p className="text-xs font-bold mt-2 text-[#fff1e8] opacity-90">{plan.description}</p>}
              </div>

              <div className={cn("h-[1px] w-full mb-8", plan.popular ? "bg-white/20" : "bg-[#eeeeee]")} />

              <ul className="space-y-4 mb-10 min-h-[220px]">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className={cn("w-5 h-5 shrink-0 mt-0.5", plan.popular ? "text-white" : "text-[#ff5a00]")} />
                    <span className={cn("text-sm font-bold", plan.popular ? "text-white/90" : "text-[#4b5563]")}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button className={cn(
                "w-full py-4 rounded-xl font-black transition-all text-sm shadow-sm",
                plan.popular 
                  ? "bg-white text-[#ff5a00] hover:bg-[#fff1e8]" 
                  : "bg-[#111] text-white hover:bg-[#111]/80"
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
