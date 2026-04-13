"use client";

import React from "react";
import { Check, Star, Zap } from "lucide-react";
import { PLANS } from "@/lib/billing";
import { cn } from "@/lib/utils";

export default function PricingSection() {
  return (
    <section className="py-24 bg-[#09090b] text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-indigo-500 font-bold tracking-widest uppercase text-sm mb-4">Pricing Plans</h2>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
            نظام حضور وانصراف بدون أجهزة <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              كله من موبايلك
            </span>
          </h1>
          <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
            Choose the plan that fits your company size. Start your 14-day free trial today. No credit card required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {Object.entries(PLANS).map(([id, plan]) => (
            <div 
              key={id}
              className={cn(
                "relative flex flex-col p-8 rounded-3xl border transition-all duration-300 group",
                plan.popular 
                  ? "bg-zinc-900 border-indigo-500 shadow-[0_0_40px_rgba(79,70,229,0.1)] scale-105 z-10" 
                  : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full uppercase tracking-tighter shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className="text-zinc-500 text-sm">EGP/mo</span>
                </div>
                <p className="text-zinc-500 text-sm mt-4">
                  {plan.employeeLimit === Infinity ? "Unlimited employees" : `Up to ${plan.employeeLimit} employees`}
                </p>
              </div>

              <ul className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-indigo-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button className={cn(
                "w-full py-4 rounded-2xl font-bold transition-all active:scale-[0.98]",
                plan.popular 
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20" 
                  : "bg-white text-black hover:bg-zinc-200"
              )}>
                Start Free Trial
              </button>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center p-8 bg-zinc-900/30 rounded-3xl border border-zinc-800 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span className="font-bold text-amber-500">LIMITED OFFER</span>
          </div>
          <p className="text-lg">
            Get your first month for only <span className="font-extrabold text-white text-2xl">99 EGP</span>
          </p>
          <p className="text-zinc-500 text-xs mt-2 italic">Discount automatically applied at checkout.</p>
        </div>
      </div>
    </section>
  );
}
