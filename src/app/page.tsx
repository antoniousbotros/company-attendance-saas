"use client";

import React from "react";
import Link from "next/link";
import PricingSection from "@/app/components/pricing-section";
import { Clock, CheckCircle2, ShieldCheck, Zap, ArrowRight, MessageCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="bg-[#09090b] text-white selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">SyncTime</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Pricing</a>
            <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Sign In</Link>
            <Link href="/signup" className="bg-white text-black px-5 py-2.5 rounded-xl font-bold hover:bg-zinc-200 transition-all text-sm">
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="pt-40 pb-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-8 animate-bounce">
              <Zap className="w-3 h-3" />
              NEW: TELEGRAM INTEGRATION 2.0
            </div>
            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tighter">
              الحضور والانصراف <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500">
                أسهل من أي وقت
              </span>
            </h1>
            <p className="text-zinc-400 text-xl md:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed">
              تتبع حضور موظفيك من خلال تليجرام مباشرة. لا داعي لأجهزة البصمة المكلفة، موبايل الموظف هو جهازه.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-black px-10 py-5 rounded-2xl text-lg shadow-2xl shadow-indigo-500/30 flex items-center justify-center gap-2 group">
                ابدأ تجربتك المجانية
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center gap-4 px-6 text-zinc-500 font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                No CC required
              </div>
            </div>

            {/* Trust Element */}
            <div className="mt-20 pt-10 border-t border-zinc-900">
              <p className="text-zinc-600 text-sm font-bold uppercase tracking-[0.2em] mb-8 text-center">In use by forward-thinking teams</p>
              <div className="flex flex-wrap justify-center gap-12 opacity-30 grayscale contrast-125">
                <div className="flex items-center gap-2 font-bold text-2xl">⚡️ Rabeh.ai</div>
                <div className="flex items-center gap-2 font-bold text-2xl">🏢 Baseet</div>
                <div className="flex items-center gap-2 font-bold text-2xl">🛠 Buildoura</div>
                <div className="flex items-center gap-2 font-bold text-2xl">🌍 Global Dev</div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-24 bg-zinc-950/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { 
                  icon: MessageCircle, 
                  title: "Bot First Interface", 
                  desc: "الموظف يسجل حضوره بضغطة زر واحدة داخل تليجرام. سهل، سريع ومعتاد." 
                },
                { 
                  icon: ShieldCheck, 
                  title: "Secure & Accurate", 
                  desc: "نظام التحقق من رقم التليفون ومكان التواجد يضمن دقة البيانات ويمنع التلاعب." 
                },
                { 
                  icon: Clock, 
                  title: "Auto-Reporting", 
                  desc: "تقارير يومية وشهرية تصلك مباشرة، وفر ساعات من العمل اليدوي كل شهر." 
                }
              ].map((f, i) => (
                <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-10 rounded-[2.5rem] hover:border-indigo-500/50 transition-all duration-300">
                  <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 mb-8">
                    <f.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
                  <p className="text-zinc-500 leading-relaxed font-arabic rtl text-right">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <div id="pricing">
          <PricingSection />
        </div>

        {/* Closing CTA */}
        <section className="py-32 px-6">
          <div className="max-w-5xl mx-auto relative rounded-[3rem] overflow-hidden bg-indigo-600 p-16 text-center shadow-2xl shadow-indigo-500/20">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-indigo-800 opacity-50" />
             <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">
                   Ready to modernize your team's <br/> attendance workflow?
                </h2>
                <Link href="/login" className="inline-flex items-center gap-3 bg-white text-black font-black px-12 py-5 rounded-2xl text-xl hover:bg-zinc-100 transition-all shadow-xl">
                   Get Started For Free
                   <ArrowRight className="w-6 h-6" />
                </Link>
                <p className="mt-8 text-indigo-200 font-medium">Join 200+ companies already using SyncTime</p>
             </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-20 border-t border-zinc-900 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-50">
            <Clock className="w-5 h-5" />
            <span className="font-bold tracking-tight">SyncTime Systems</span>
          </div>
          <p className="text-zinc-600 text-sm">© 2026 SyncTime. All rights reserved. Built for growth in MENA.</p>
        </div>
      </footer>
    </div>
  );
}
