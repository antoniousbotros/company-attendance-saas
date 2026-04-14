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
  CheckCircle2,
  Users,
  PieChart,
  Globe
} from "lucide-react";
import PricingSection from "./components/pricing-section";
import { LanguageProvider, useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

function LandingPageContent() {
  const { lang, toggleLang, isRTL } = useLanguage();

  return (
    <div className={cn("min-h-screen bg-[#f9fafb] text-[#111] transition-colors duration-500 font-sans", isRTL ? "rtl" : "ltr")} dir={isRTL ? "rtl" : "ltr"}>
      {/* 1. HERO SECTION & NAVIGATION */}
      <nav className="fixed top-0 w-full z-50 border-b border-[#eeeeee] bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#ff5a00] rounded-xl flex items-center justify-center shadow-lg shadow-[#ff5a00]/30">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-[#111]">Yawmy {isRTL && "يومي"}</span>
          </div>
          
          <div className="flex items-center gap-4 md:gap-8">
            <button
              onClick={toggleLang}
              className="flex items-center gap-2 text-sm font-bold text-[#6b7280] hover:text-[#111] transition-colors px-3 py-1.5 rounded-full hover:bg-[#f5f5f5] border border-transparent hover:border-[#eeeeee]"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden md:inline">{lang === "en" ? "العربية" : "English"}</span>
            </button>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/login" className="text-sm font-bold text-[#6b7280] hover:text-[#ff5a00] transition-colors">{isRTL ? "تسجيل الدخول" : "Sign In"}</Link>
            </div>
            <Link href="/signup" className="bg-[#ff5a00] text-white px-5 py-2.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl font-black hover:bg-[#e04f00] hover:-translate-y-0.5 transition-all text-sm shadow-xl shadow-[#ff5a00]/20">
              {isRTL ? "ابدأ مجانًا" : "Start Free Trial"}
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-40 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-8 relative">
          <div className="inline-flex items-center gap-2 bg-[#fff1e8] text-[#ff5a00] ring-1 ring-[#ffd4b8] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest animate-in fade-in duration-700">
            <ShieldCheck className="w-4 h-4" />
            {isRTL ? "موثوق من الشركات النامية" : "Used by growing teams"}
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.1] text-balance">
            {isRTL ? "إدارة حضور ورواتب فريقك… " : "Manage your team’s attendance & payroll "}
            <span className="text-[#ff5a00] relative inline-block">
              {isRTL ? "في دقيقة" : "in minutes"}
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-[#ffd4b8] -z-10" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 15 100 5 L 100 10 L 0 10 Z" fill="currentColor"/></svg>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-[#6b7280] max-w-2xl mx-auto font-bold leading-relaxed">
            {isRTL ? "بدون أجهزة — كله من تليجرام" : "No devices needed — powered by Telegram"}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/signup" className="w-full sm:w-auto bg-[#ff5a00] hover:bg-[#e04f00] text-white font-black px-10 py-5 rounded-[1.25rem] text-xl shadow-2xl shadow-[#ff5a00]/30 flex items-center justify-center gap-3 group transition-all transform hover:-translate-y-1">
              {isRTL ? "ابدأ مجانًا" : "Start Free Trial"}
              <ArrowRight className={cn("w-6 h-6 transition-transform", isRTL ? "group-hover:-translate-x-1 rotate-180" : "group-hover:translate-x-1")} />
            </Link>
          </div>

          <div className="mt-20 relative mx-auto w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            <div className="absolute inset-0 bg-gradient-to-b from-[#ff5a00]/20 to-transparent blur-3xl -z-10 rounded-full opacity-50"></div>
            <div className="rounded-3xl border border-[#eeeeee] bg-white shadow-2xl overflow-hidden ring-1 ring-black/5">
               <div className="bg-[#f5f5f5] border-b border-[#eeeeee] h-12 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#22c55e]"></div>
               </div>
               <div className="p-8 flex items-center justify-center bg-zinc-50 aspect-video">
                  <div className="flex flex-col items-center text-center gap-4">
                     <div className="w-20 h-20 bg-[#fff1e8] rounded-2xl flex items-center justify-center text-[#ff5a00] rotate-12 shadow-lg mb-4">
                        <MessageCircle className="w-10 h-10" />
                     </div>
                     <h3 className="text-2xl font-black text-[#111]">{isRTL ? "لوحة تحكم ذكية تلخص كل شيء" : "Smart Dashboard Summarizing Everything"}</h3>
                     <p className="text-[#6b7280] font-bold">{isRTL ? "شاهد حضور موظفيك لحظة بلحظة" : "Watch your employees check-in live"}</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROBLEM SECTION */}
      <section className="py-24 bg-white border-y border-[#eeeeee]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { text: isRTL ? "بتضيع وقت في تسجيل الحضور؟" : "Wasting time tracking attendance?", icon: Clock, color: "text-[#b91c1c] bg-[#fef2f2] border-[#fecaca]" },
              { text: isRTL ? "في تلاعب من الموظفين؟" : "Employees manipulating check-ins?", icon: Users, color: "text-[#b91c1c] bg-[#fef2f2] border-[#fecaca]" },
              { text: isRTL ? "أجهزة البصمة غالية ومعقدة؟" : "Biometric devices are expensive?", icon: Fingerprint, color: "text-[#b91c1c] bg-[#fef2f2] border-[#fecaca]" }
            ].map((prob, i) => (
               <div key={i} className="flex flex-col items-center text-center space-y-4 p-8 rounded-3xl border border-[#eeeeee] hover:border-[#fecaca] transition-colors">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border", prob.color)}>
                     <prob.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-[#111]">{prob.text}</h3>
               </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SOLUTION SECTION */}
      <section className="py-32 px-6">
         <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8">
               <div className="inline-flex items-center gap-2 bg-[#ecfdf5] text-[#059669] ring-1 ring-[#a7f3d0] px-4 py-2 rounded-full text-sm font-bold uppercase tracking-widest">
                 {isRTL ? "الحل النهائي" : "The Ultimate Solution"}
               </div>
               <h2 className="text-4xl md:text-5xl font-black leading-tight">
                  {isRTL ? "تليجرام هو جهاز البصمة الجديد!" : "Telegram is your new Biometric Device!"}
               </h2>
               <p className="text-xl text-[#6b7280] font-medium leading-relaxed">
                  {isRTL 
                   ? "من خلال ربط ذكي بروبوت تليجرام، يقوم موظفوك بتسجيل الحضور بضغطة زر (مع التحقق من الموقع الجغرافي). يتم تتبع الوقت وتوليد الخصومات وحساب الرواتب تلقائياً بالكامل في لوحة تحكمك." 
                   : "Through a smart Telegram Bot integration, your employees check-in with a single tap (with GPS validation). Time is tracked, penalties are generated, and payroll is calculated completely automatically inside your dashboard."}
               </p>
               <ul className="space-y-4 pt-4">
                  {[
                     isRTL ? "توفير الوقت بفضل الأتمتة" : "Save hours with automation",
                     isRTL ? "تقليل الأخطاء البشرية" : "Reduce human payroll errors",
                     isRTL ? "لا يوجد تكاليف للأجهزة المعقدة" : "Zero hardware installation cost"
                  ].map((benefit, i) => (
                     <li key={i} className="flex items-center gap-3 text-[#111] font-bold text-lg">
                        <CheckCircle2 className="w-6 h-6 text-[#10b981]" />
                        {benefit}
                     </li>
                  ))}
               </ul>
            </div>
            <div className="flex-1 w-full relative">
               <div className="absolute inset-0 bg-[#0284c7]/5 blur-3xl rounded-full"></div>
               <img src="https://media.discordapp.net/attachments/1231649964593414235/1231650073699844096/telegram_mockup.png" alt="Telegram App Mockup" className="relative z-10 w-full max-w-sm mx-auto drop-shadow-2xl hover:-translate-y-2 transition-transform duration-500 rounded-3xl" onError={(e) => (e.currentTarget.style.display = 'none')} />
            </div>
         </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section id="features" className="py-24 bg-white border-y border-[#eeeeee]">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center space-y-4 mb-16">
             <h2 className="text-4xl md:text-5xl font-black">{isRTL ? "كل ما تحتاجه لإدارة شركتك" : "Everything you need to manage your company"}</h2>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                title: isRTL ? "تتبع الحضور" : "Attendance Tracking", 
                desc: isRTL ? "تسجيل دقيق مع التحقق من الموقع (GPS)." : "Accurate check-ins with GPS validation.",
                icon: Clock
              },
              { 
                title: isRTL ? "كشف التأخيرات" : "Late Detection", 
                desc: isRTL ? "تحديد تلقائي للتأخير وتطبيق الخصومات." : "Auto-detects late arrivals and applies penalties.",
                icon: ShieldCheck
              },
              { 
                title: isRTL ? "أتمتة الرواتب" : "Payroll Automation", 
                desc: isRTL ? "استخراج كشوف المرتبات بضغطة زر واحدة." : "Generate final payrolls with a single click.",
                icon: BarChart3
              },
              { 
                title: isRTL ? "تقارير وتحليلات" : "Reports & Insights", 
                desc: isRTL ? "رؤية شاملة لأداء الفريق وأيام الغياب." : "Comprehensive view of team performance & absences.",
                icon: PieChart
              },
              { 
                title: isRTL ? "تجربة موبايل ممتازة" : "Mobile-first", 
                desc: isRTL ? "إدارة شركتك بالكامل من هاتفك المحمول." : "Administer your entire business directly from your phone.",
                icon: Smartphone
              }
            ].map((feature, i) => (
              <div key={i} className="bg-[#f9fafb] border border-[#eeeeee] p-8 rounded-3xl space-y-4 hover:border-[#ff5a00]/30 hover:shadow-xl transition-all group">
                <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center ring-1 ring-[#eeeeee] shadow-sm text-[#ff5a00] group-hover:bg-[#ff5a00] group-hover:text-white transition-colors">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-[#111]">{feature.title}</h3>
                <p className="text-[#6b7280] font-bold text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="py-32 px-6">
         <div className="max-w-7xl mx-auto">
           <div className="text-center space-y-4 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
             <h2 className="text-4xl md:text-5xl font-black tracking-tight">{isRTL ? "كيف يعمل النظام؟" : "How does it work?"}</h2>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-[45px] left-[10%] right-[10%] h-[2px] bg-[#eeeeee] -z-10"></div>
              
              {[
                 { step: 1, title: isRTL ? "أضف موظفيك" : "Add your employees", desc: isRTL ? "قم بإدخال بيانات رواتبهم وأرقام هواتفهم." : "Enter their payroll details and phone numbers." },
                 { step: 2, title: isRTL ? "اربط تليجرام" : "Connect Telegram bot", desc: isRTL ? "سيقومون بمشاركة جهة الاتصال لمرة واحدة." : "They share their contact to the bot one-time." },
                 { step: 3, title: isRTL ? "راقب الحضور فوراً" : "Start tracking instantly", desc: isRTL ? "كل شيء يعمل تلقائياً من الآن فصاعداً!" : "Everything runs automatically from now on!" },
              ].map((s, i) => (
                 <div key={i} className="flex flex-col items-center text-center space-y-4 bg-white p-8 rounded-3xl border border-[#eeeeee] shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-[#111] text-white flex items-center justify-center font-black text-xl shadow-lg ring-4 ring-white">
                       {s.step}
                    </div>
                    <h3 className="text-xl font-black text-[#111] pt-2">{s.title}</h3>
                    <p className="text-[#6b7280] font-bold">{s.desc}</p>
                 </div>
              ))}
           </div>
         </div>
      </section>

      {/* 6. PRICING */}
      <PricingSection />

      {/* 7. SOCIAL PROOF */}
      <section className="py-24 bg-white border-y border-[#eeeeee] overflow-hidden">
         <div className="max-w-7xl mx-auto px-6 text-center space-y-16">
            <h2 className="text-3xl md:text-4xl font-black">{isRTL ? "موثوق من قِبل أكثر من 500 شركة" : "Trusted by 500+ growing companies"}</h2>
            <div className="flex flex-wrap justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
               <div className="text-2xl font-black text-[#9ca3af]">Acme Corp</div>
               <div className="text-2xl font-black text-[#9ca3af]">Stark Ind</div>
               <div className="text-2xl font-black text-[#9ca3af]">Wayne Ent</div>
               <div className="text-2xl font-black text-[#9ca3af]">Globex</div>
            </div>
         </div>
      </section>

      {/* 8. FINAL CTA */}
      <section className="py-32 px-6 bg-[#ff5a00] text-white text-center relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
         <div className="max-w-3xl mx-auto space-y-8 relative z-10">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
               {isRTL ? "ابدأ إدارة فريقك بشكل أسهل اليوم" : "Start managing your team smarter today"}
            </h2>
            <Link href="/signup" className="inline-block bg-white text-[#ff5a00] font-black px-12 py-5 rounded-2xl text-xl shadow-2xl hover:bg-[#fff1e8] hover:scale-105 transition-all transform hover:-translate-y-1">
              {isRTL ? "ابدأ مجانًا" : "Start Free Trial"}
            </Link>
         </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#ff5a00]" />
            <span className="text-xl font-black tracking-tighter text-[#111]">Yawmy {isRTL && "يومي"}</span>
          </div>
          <div className="flex gap-6 text-sm font-bold text-[#6b7280]">
             <Link href="#" className="hover:text-[#ff5a00]">{isRTL ? "سياسة الخصوصية" : "Privacy Policy"}</Link>
             <Link href="#" className="hover:text-[#ff5a00]">{isRTL ? "تواصل معنا" : "Contact Sales"}</Link>
          </div>
          <p className="text-[#9ca3af] font-bold text-xs">© 2026 Yawmy Platform.</p>
        </div>
      </footer>
    </div>
  );
}

// Icon placeholder mock
function Fingerprint(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .346-2"/><path d="M8.5 15c.175.52.507 1.83.674 2.5"/><path d="M12 19.5v-1.5c0-1.5.5-2.5 1.5-3.5"/><path d="M15 19.5V15a3 3 0 0 0-3-3"/><path d="M19 19.5V12a6 6 0 0 0-6-6 6 6 0 0 0-6 6v7.5"/><path d="M12 2v2"/><path d="M8 3.5 9 5"/><path d="M16 3.5 15 5"/></svg>
}

export default function LandingPage() {
  return (
    <LanguageProvider>
      <LandingPageContent />
    </LanguageProvider>
  );
}
