"use client";

import React, { useState } from "react";
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
  Globe,
  Wallet,
  MapPin,
  ChevronDown,
  LayoutDashboard
} from "lucide-react";
import PricingSection from "./components/pricing-section";
import ShowcaseSection from "./components/showcase-section";
import { LanguageProvider, useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

function LandingPageContent() {
  const { lang, toggleLang, isRTL } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const t = {
    nav: {
      blog: isRTL ? "المدونة" : "Blog",
      login: isRTL ? "تسجيل الدخول" : "Sign In",
      startFree: isRTL ? "ابدأ مجاناً" : "Start Free Trial",
    },
    hero: {
      badge: isRTL ? "⚡ إعداد في دقيقتين • بدون أجهزة بصمة" : "⚡ Setup in 2 minutes • No hardware required",
      headline: isRTL 
        ? "حوّل حضور فريقك وإدارة رواتبهم إلى نظام آلي بالكامل." 
        : "Put your attendance and payroll on autopilot.",
      subhead: isRTL 
        ? "اجعل تليجرام جهاز بصمة ذكي مزود بالـ GPS. تتبع الحضور، احسب التأخيرات، واصرف الرواتب تلقائياً وبدون أي أجهزة معقدة." 
        : "Turn Telegram into a GPS-verified punch clock. Track attendance, auto-calculate deductions, and generate payroll with zero hardware.",
      ctaPrimary: isRTL ? "ابدأ مجاناً الآن" : "Start for Free",
      ctaSecondary: isRTL ? "عرض الباقات" : "View Pricing",
    },
    problem: {
      headline: isRTL ? "الطرق التقليدية تكلفك الكثير من الوقت والمال." : "The old way of managing teams is costing you.",
      card1: {
        title: isRTL ? "وقت مهدر" : "Lost Time",
        desc: isRTL ? "تضييع ساعات طويلة في حساب الرواتب والخصومات يدوياً." : "Wasting hours manually calculating payroll and deductions."
      },
      card2: {
        title: isRTL ? "تكاليف عالية" : "Lost Money",
        desc: isRTL ? "أجهزة بصمة غالية الثمن ومعرضة للأعطال." : "Expensive biometric scanners that break or need maintenance."
      },
      card3: {
        title: isRTL ? "تلاعب بالحضور" : "Lost Trust",
        desc: isRTL ? "تسجيل حضور غير دقيق واعتماد على الورق." : "\"Buddy punching\" and inaccurate paper timesheets."
      }
    },
    solution: {
      eyebrow: isRTL ? "البديل الذكي" : "The Smart Alternative",
      headline: isRTL ? "تليجرام هو جهاز البصمة الجديد الخاص بك." : "Telegram is your new biometric device.",
      paragraph: isRTL 
        ? "ودّع أجهزة البصمة المعقدة وتطبيقات الموارد البشرية الثقيلة. بضغطة زر واحدة على تليجرام، يقوم موظفوك بتسجيل الدخول مع التحقق من الموقع الجغرافي (GPS). وتتحدث لوحتك فوراً، لحساب ساعات العمل وخصومات التأخير آلياً." 
        : "Say goodbye to expensive hardware and complex HR apps. With a single tap in Telegram, employees check in with verified GPS. Your dashboard instantly updates, calculating hours and late penalties automatically."
    },
    benefits: [
      {
        title: isRTL ? "تتبع جغرافي لا يقبل التلاعب" : "Bulletproof GPS Tracking",
        desc: isRTL ? "التأكد من موقع الموظف الفعلي (GPS) يمنع تسجيل الدخول عن بُعد." : "Real-time location verification ensures nobody checks in from bed.",
        icon: MapPin
      },
      {
        title: isRTL ? "رواتب بضغطة زر" : "Zero-Touch Payroll",
        desc: isRTL ? "استخراج كشوف المرتبات نهاية الشهر مع احتساب كافة خصومات التأخير مسبقاً." : "Generate end-of-month salary reports with all late deductions already calculated.",
        icon: Wallet
      },
      {
        title: isRTL ? "لا يحتاج لتدريب" : "No Training Required",
        desc: isRTL ? "إذا كانوا يعرفون استخدام تليجرام، فهم يعرفون استخدام \"يومي\". بدون تثبيت تطبيقات جديدة." : "If they can send a message, they can use Yawmy. No apps to install.",
        icon: Smartphone
      },
      {
        title: isRTL ? "تطبيق احترافي لكل موظف" : "Pro App for Every Employee",
        desc: isRTL ? "يحصل كل موظف على بوابة ويب خاصة لإدارة المهام، والاطلاع على سجل الحضور، وتلقي إعلانات الشركة." : "Every employee gets a dedicated web portal to manage tasks, view attendance history, and receive company announcements.",
        icon: LayoutDashboard
      }
    ],
    howItWorks: {
      headline: isRTL ? "جاهز للعمل في 3 خطوات بسيطة." : "Up and running in 3 simple steps.",
      steps: [
        { title: isRTL ? "أضف موظفيك" : "Add employees", desc: isRTL ? "حدد رواتبهم الأساسية ومواعيد العمل." : "Add basic salaries and working hours." },
        { title: isRTL ? "اربط بوت تليجرام" : "Connect Telegram", desc: isRTL ? "بوت آمن وموثق بضغطة زر واحدة." : "Connect our highly secure Telegram Bot." },
        { title: isRTL ? "سجل الحضور" : "Check-in & track", desc: isRTL ? "تلقي الإشعارات والتقارير آلياً." : "Receive real-time notifications and reports." }
      ]
    },
    proof: isRTL ? "يثق بنا أكثر من 500 شركة طموحة في عالم الأعمال." : "Trusted by 500+ forward-thinking businesses across the MENA region.",
    faq: {
      headline: isRTL ? "الأسئلة الشائعة" : "Frequently Asked Questions",
      items: [
        {
          q: isRTL ? "هل التحقق من الموقع (GPS) دقيق؟" : "Is the GPS tracking accurate?",
          a: isRTL 
            ? "نعم، نعتمد على خدمات الموقع الخاصة بنظام التشغيل في الهاتف (iOS/Android) لضمان دقة لا تقبل التلاعب." 
            : "Yes, we use native iOS and Android location services through Telegram to ensure tamper-proof accuracy."
        },
        {
          q: isRTL ? "هل يحتاج الموظفون لتنزيل تطبيق جديد؟" : "Do my employees need to download a new app?",
          a: isRTL 
            ? "على الإطلاق. كل شيء يتم من خلال تطبيق تليجرام الذي يمتلكه الجميع بالفعل." 
            : "Not at all. Everything is done through Telegram, an app they likely already have."
        },
        {
          q: isRTL ? "هل يمكنني إدارة فروع متعددة؟" : "Can I manage multiple branches?",
          a: isRTL 
            ? "نعم، يمكنك تصنيف موظفيك حسب الأقسام وتتبع حضور كل فرع أو قسم بسهولة من لوحة التحكم." 
            : "Yes, you can easily categorize your employees into different departments and track each branch directly from the dashboard."
        }
      ]
    },
    finalCta: {
      headline: isRTL ? "جاهز لتوفير وقتك وجهدك في حساب الرواتب؟" : "Ready to stop worrying about payroll?",
      subhead: isRTL ? "انضم لمئات المديرين الذين يوفرون أكثر من 10 ساعات شهرياً." : "Join hundreds of managers saving 10+ hours every month.",
      button: isRTL ? "أنشئ حسابك المجاني الآن" : "Create Your Free Account"
    }
  };

  return (
    <div className={cn("min-h-screen bg-[#f9fafb] text-[#111] transition-colors duration-500 font-sans", isRTL ? "rtl text-right" : "ltr text-left")} dir={isRTL ? "rtl" : "ltr"}>
      {/* 1. HERO SECTION & NAVIGATION */}
      <nav className="fixed top-0 w-full z-50 border-b border-[#eeeeee] bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/logos/yawmy-logo.svg" alt="Yawmy" className="h-10 w-auto" />
          </Link>
          
          <div className="flex items-center gap-4 md:gap-8">
            <button
              onClick={toggleLang}
              className="flex items-center gap-2 text-sm font-bold text-[#6b7280] hover:text-[#111] transition-colors px-3 py-1.5 rounded-full hover:bg-[#f5f5f5] border border-transparent hover:border-[#eeeeee]"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden md:inline">{lang === "en" ? "العربية" : "English"}</span>
            </button>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/blog" className="text-sm font-bold text-[#6b7280] hover:text-[#ff5a00] transition-colors">{t.nav.blog}</Link>
              <Link href="/login" className="text-sm font-bold text-[#6b7280] hover:text-[#ff5a00] transition-colors">{t.nav.login}</Link>
            </div>
            <Link href="/signup" className="bg-[#ff5a00] text-white px-5 py-2.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl font-black hover:bg-[#e04f00] hover:-translate-y-0.5 transition-all text-sm shadow-xl shadow-[#ff5a00]/20">
              {t.nav.startFree}
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-40 pb-24 px-6 bg-white overflow-hidden relative">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-[#ff5a00]/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#fff1e8] text-[#ff5a00] ring-1 ring-[#ffd4b8] px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest animate-in fade-in duration-700">
            <Zap className="w-4 h-4" />
            {t.hero.badge}
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-7xl font-black tracking-tighter leading-[1.15] text-[#111]">
            {t.hero.headline}
          </h1>

          <p className="text-lg md:text-xl text-[#6b7280] max-w-2xl mx-auto font-medium leading-relaxed">
            {t.hero.subhead}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link href="/signup" className="w-full sm:w-auto bg-[#ff5a00] hover:bg-[#e04f00] text-white font-black px-10 py-5 rounded-2xl text-lg shadow-2xl shadow-[#ff5a00]/30 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1">
              {t.hero.ctaPrimary}
              <ArrowRight className={cn("w-5 h-5", isRTL && "rotate-180")} />
            </Link>
            <a href="#pricing" className="w-full sm:w-auto bg-[#f9fafb] hover:bg-[#f3f4f6] text-[#111] font-bold border border-[#e5e7eb] px-10 py-5 rounded-2xl text-lg flex items-center justify-center gap-3 transition-all">
              {t.hero.ctaSecondary}
            </a>
          </div>
        </div>
      </section>

      {/* 2. PROBLEM SECTION */}
      <section className="py-24 bg-[#f9fafb] border-t border-[#eeeeee]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-[#111]">{t.problem.headline}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { ...t.problem.card1, icon: Clock },
              { ...t.problem.card2, icon: Wallet },
              { ...t.problem.card3, icon: ShieldCheck }
            ].map((prob, i) => (
               <div key={i} className="flex flex-col items-center text-center space-y-4 p-10 rounded-[2rem] bg-white border border-[#fecaca] shadow-sm hover:shadow-xl hover:border-[#fca5a5] transition-all">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[#fef2f2] text-[#b91c1c]">
                     <prob.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-[#111]">{prob.title}</h3>
                  <p className="text-[#6b7280] font-medium leading-relaxed">{prob.desc}</p>
               </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SOLUTION & BENEFITS SECTION */}
      <section className="py-32 bg-white px-6">
         <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-20 mb-32">
               <div className="flex-1 space-y-8">
                  <div className="inline-flex items-center gap-2 bg-[#ecfdf5] text-[#059669] ring-1 ring-[#a7f3d0] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                    {t.solution.eyebrow}
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black leading-[1.2] text-[#111]">
                    {t.solution.headline}
                  </h2>
                  <p className="text-xl text-[#6b7280] font-medium leading-relaxed">
                    {t.solution.paragraph}
                  </p>
               </div>
               <div className="flex-1 w-full relative flex justify-center lg:justify-end">
                  <div className="absolute inset-0 bg-[#0284c7]/5 blur-3xl rounded-full"></div>
                  <img src="/hr_mobile_mockup.png" alt="Telegram App Mockup" className="relative z-10 w-full max-w-[320px] drop-shadow-2xl hover:-translate-y-2 transition-transform duration-700 rounded-3xl" onError={(e) => (e.currentTarget.style.display = 'none')} />
               </div>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {t.benefits.map((benefit, i) => (
                <div key={i} className="bg-[#f9fafb] p-10 rounded-[2rem] border border-[#eeeeee] flex flex-col space-y-5">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#ff5a00] shadow-sm border border-[#eeeeee]">
                    <benefit.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-[#111]">{benefit.title}</h3>
                  <p className="text-[#6b7280] font-medium leading-relaxed">{benefit.desc}</p>
                </div>
              ))}
            </div>
         </div>
      </section>

      {/* 4. SHOWCASE (Analytics, Tasks, Infographic) */}
      <ShowcaseSection isRTL={isRTL} />

      {/* 5. HOW IT WORKS */}
      <section className="py-32 px-6 bg-[#111] text-white">
         <div className="max-w-7xl mx-auto">
           <div className="text-center space-y-4 mb-20">
             <h2 className="text-4xl md:text-5xl font-black tracking-tight">{t.howItWorks.headline}</h2>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-[36px] left-[15%] right-[15%] h-[2px] bg-white/10 -z-10"></div>
              
              {t.howItWorks.steps.map((s, i) => (
                 <div key={i} className="flex flex-col items-center text-center space-y-5">
                    <div className="w-20 h-20 rounded-2xl bg-[#ff5a00] text-white flex items-center justify-center font-black text-3xl shadow-[0_0_40px_rgba(255,90,0,0.3)] ring-8 ring-[#111]">
                       {i + 1}
                    </div>
                    <h3 className="text-xl font-black pt-4">{s.title}</h3>
                    <p className="text-white/60 font-medium max-w-[250px]">{s.desc}</p>
                 </div>
              ))}
           </div>
         </div>
      </section>

      {/* 6. SOCIAL PROOF */}
      <section className="py-24 bg-white border-b border-[#eeeeee] overflow-hidden">
         <div className="max-w-7xl mx-auto px-6 text-center space-y-12">
            <h2 className="text-2xl font-black text-[#6b7280]">{t.proof}</h2>
            <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
               <img src="/logos/baseet.svg" alt="Baseet" className="h-10 object-contain" />
               <img src="/logos/makhzon.svg" alt="Makhzon" className="h-10 object-contain" />
               <img src="/logos/alwaseet-logo.svg" alt="AlWaseet" className="h-10 object-contain" />
               <img src="/logos/menutap.svg" alt="MenuTap" className="h-10 object-contain" />
               <img src="/logos/worldsite-logo.svg" alt="Worldsite" className="h-10 object-contain" />
            </div>
         </div>
      </section>

      {/* 7. PRICING */}
      <div id="pricing">
        <PricingSection />
      </div>

      {/* 8. FAQ */}
      <section className="py-32 bg-[#f9fafb] px-6 border-y border-[#eeeeee]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-[#111]">{t.faq.headline}</h2>
          </div>
          <div className="space-y-4">
            {t.faq.items.map((item, i) => (
              <div 
                key={i} 
                className={cn(
                  "bg-white border rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer",
                  openFaq === i ? "border-[#ff5a00] shadow-md" : "border-[#eeeeee] hover:border-[#d1d5db]"
                )}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="px-6 py-5 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#111]">{item.q}</h3>
                  <ChevronDown className={cn("w-5 h-5 text-[#9ca3af] transition-transform duration-300", openFaq === i && "rotate-180 text-[#ff5a00]")} />
                </div>
                <div className={cn(
                  "px-6 overflow-hidden transition-all duration-300 ease-in-out",
                  openFaq === i ? "max-h-40 pb-5 opacity-100" : "max-h-0 opacity-0"
                )}>
                  <p className="text-[#6b7280] font-medium leading-relaxed">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="py-32 px-6 bg-[#ff5a00] text-white text-center relative overflow-hidden">
         <div className="absolute inset-0 bg-[#e04f00] opacity-0"></div>
         <div className="max-w-3xl mx-auto space-y-8 relative z-10">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-[1.1]">
               {t.finalCta.headline}
            </h2>
            <p className="text-xl font-medium text-white/90">
               {t.finalCta.subhead}
            </p>
            <div className="pt-8">
              <Link href="/signup" className="inline-block bg-white text-[#ff5a00] font-black px-12 py-5 rounded-2xl text-xl shadow-2xl hover:scale-105 transition-all transform hover:-translate-y-1">
                {t.finalCta.button}
              </Link>
            </div>
         </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 bg-white border-t border-[#eeeeee]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center">
            <img src="/logos/yawmy-logo.svg" alt="Yawmy" className="h-10 w-auto" />
          </div>
          <div className="flex gap-8 text-sm font-bold text-[#6b7280]">
             <Link href="/blog" className="hover:text-[#ff5a00] transition-colors">{t.nav.blog}</Link>
             <Link href="#" className="hover:text-[#ff5a00] transition-colors">Privacy Policy</Link>
             <Link href="#" className="hover:text-[#ff5a00] transition-colors">Contact Sales</Link>
          </div>
          <p className="text-[#9ca3af] font-bold text-xs">© 2026 Yawmy Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default function LandingPage() {
  return (
    <LanguageProvider>
      <LandingPageContent />
    </LanguageProvider>
  );
}
