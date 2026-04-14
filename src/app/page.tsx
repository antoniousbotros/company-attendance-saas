"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  Zap,
  BarChart3,
  Clock,
  Smartphone,
} from "lucide-react";
import PricingSection from "./components/pricing-section";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111] transition-colors duration-500 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-[#eeeeee] bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#ff5a00] rounded-xl flex items-center justify-center shadow-lg shadow-[#ff5a00]/30">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-[#111]">SyncTime</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold text-[#6b7280] hover:text-[#ff5a00] transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-bold text-[#6b7280] hover:text-[#ff5a00] transition-colors">Pricing</a>
            <Link href="/login" className="text-sm font-bold text-[#6b7280] hover:text-[#ff5a00] transition-colors">Sign In</Link>
            <Link href="/signup" className="bg-[#ff5a00] text-white px-6 py-3 rounded-2xl font-black hover:bg-[#e04f00] hover:-translate-y-0.5 transition-all text-sm shadow-xl shadow-[#ff5a00]/20">
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-[#fff1e8] text-[#ff5a00] ring-1 ring-[#ffd4b8] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest animate-in fade-in duration-700">
            <Zap className="w-4 h-4 fill-[#ff5a00]" />
            Attendance Reimagined
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-balance rtl" dir="rtl">
            نظام الحضور والإنصراف <br/>
            <span className="text-[#ff5a00] italic rtl">عبر تليجرام</span>
          </h1>

          <p className="text-lg md:text-xl text-[#6b7280] max-w-2xl mx-auto font-bold leading-relaxed rtl" dir="rtl">
            تتبع حضور موظفيك من خلال تليجرام مباشرة. لا داعي لأجهزة البصمة المكلفة، موبايل الموظف هو جهازه.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4 rtl" dir="rtl">
            <Link href="/signup" className="w-full md:w-auto bg-[#ff5a00] hover:bg-[#e04f00] text-white font-black px-10 py-5 rounded-[1.25rem] text-xl shadow-2xl shadow-[#ff5a00]/30 flex items-center justify-center gap-3 group transition-all transform hover:-translate-y-1">
              ابدأ تجربتك المجانية
              <ArrowRight className="w-6 h-6 group-hover:-translate-x-1 transition-transform rotate-180" />
            </Link>
            <div className="flex items-center gap-4 px-8 text-[#6b7280] font-bold tracking-tighter text-sm rtl" dir="rtl">
              <span className="flex items-center gap-1"><ShieldCheck className="w-5 h-5 text-[#ff5a00]" /> بدون أجهزة بصمة</span>
              <span className="flex items-center gap-1"><Zap className="w-5 h-5 text-amber-500 fill-amber-500" /> إعداد فوري</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats / Features Grid */}
      <section id="features" className="py-20 bg-white border-y border-[#eeeeee]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              title: "Simple Telegram Bot", 
              desc: "Employees check-in via a simple button click on Telegram. Instant synchronization.",
              icon: MessageCircle,
              color: "bg-[#0284c7]/10 text-[#0284c7] ring-[#bae6fd]",
              langProps: { dir: "ltr" }
            },
            { 
              title: "Smart Analytics", 
              desc: "Get automated reports on late arrivals, working hours, and monthly performance.",
              icon: BarChart3,
              color: "bg-[#ff5a00]/10 text-[#ff5a00] ring-[#ffd4b8]",
              langProps: { dir: "ltr" }
            },
            { 
              title: "Mobile First", 
              desc: "Administer your entire team from your phone. Clean, responsive admin dashboard.",
              icon: Smartphone,
              color: "bg-[#059669]/10 text-[#059669] ring-[#a7f3d0]",
              langProps: { dir: "ltr" }
            }
          ].map((feature, i) => (
            <div key={i} className="bg-white border border-[#eeeeee] p-10 rounded-2xl space-y-6 hover:border-[#ff5a00]/30 hover:shadow-2xl transition-all group" {...feature.langProps}>
              <div className={`${feature.color} w-16 h-16 rounded-xl flex items-center justify-center ring-1 shadow-lg group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-[#111] tracking-tight">{feature.title}</h3>
              <p className="text-[#6b7280] font-bold leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* Footer */}
      <footer className="py-20 border-t border-[#eeeeee] bg-white mt-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-[#ff5a00]" />
            <span className="text-xl font-black tracking-tighter text-[#111]">SyncTime</span>
          </div>
          <p className="text-[#6b7280] font-bold text-sm">© 2026 SyncTime. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
