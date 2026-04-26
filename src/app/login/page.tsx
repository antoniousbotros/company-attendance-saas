"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Clock, Mail, Lock, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { translations, type Language } from "@/lib/i18n";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<Language>("en");

  useEffect(() => {
    const savedLang = (localStorage.getItem("lang") as Language) || "en";
    setLang(savedLang);
    document.documentElement.setAttribute("dir", savedLang === "ar" ? "rtl" : "ltr");
  }, []);

  const toggleLang = () => {
    const newLang = lang === "en" ? "ar" : "en";
    setLang(newLang);
    localStorage.setItem("lang", newLang);
    document.documentElement.setAttribute("dir", newLang === "ar" ? "rtl" : "ltr");
  };

  const t = translations[lang];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password: password 
      });

      if (error) {
        alert(error.message);
      } else if (data.session || data.user) {
        window.location.href = "/overview";
      } else {
        alert("Check your email for confirmation link.");
      }
    } catch (err: unknown) {
      alert("System error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const isRTL = lang === 'ar';

  return (
    <div className="min-h-screen w-full flex font-sans bg-white selection:bg-[#ff5a00]/30 transition-colors duration-500">
       
      {/* LEFT PANE - Form Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative z-10 transition-all duration-500 bg-white shadow-xl shadow-black/5">
        
        {/* Lang Switcher Absolute Corner */}
        <button 
          type="button"
          onClick={toggleLang}
          className={cn("absolute top-8 flex items-center gap-2 bg-[#f9fafb] text-[#6b7280] border border-[#e0e0e0] px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#f5f5f5] hover:text-[#111] transition-all", isRTL ? "left-8" : "right-8")}
        >
          <Languages className="w-4 h-4" />
          {lang === "en" ? "العربية" : "English"}
        </button>

        <div className="w-full max-w-[420px] space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Logo Brand Header */}
          <div className="flex flex-col items-start space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#ff5a00] rounded-lg flex items-center justify-center shadow-lg shadow-[#ff5a00]/30">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter text-[#111]">Yawmy {isRTL && "يومي"}</span>
            </div>
            
            <div className="space-y-2">
               <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#111]">
                 {t.welcomeBack || (isRTL ? "ابدأ الآن" : "Welcome Back")}
               </h1>
               <p className="text-[#6b7280] font-bold text-lg">
                 {isRTL ? "أدخل بياناتك للوصول إلى حسابك" : "Enter your credentials to access your account"}
               </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            <div className="space-y-2 font-sans">
              <label className="text-sm font-bold text-[#111] block mb-1">
                 {isRTL ? "البريد الإلكتروني" : "Email address"}
              </label>
              <div className="relative group">
                <div className={cn(
                  "absolute inset-y-0 flex items-center pointer-events-none text-[#9ca3af] transition-colors group-focus-within:text-[#ff5a00]",
                  isRTL ? "right-4" : "left-4"
                )}>
                  <Mail className="w-5 h-5" />
                </div>
                <input 
                  type="email" 
                  placeholder={isRTL ? "name@company.com" : "name@company.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "w-full bg-white border border-[#e0e0e0] rounded-lg py-3.5 focus:border-[#ff5a00] focus:ring-1 focus:ring-[#ff5a00] outline-none transition-all placeholder:text-[#9ca3af] font-bold text-[#111]",
                    isRTL ? "pr-12 pl-4" : "pl-12 pr-4"
                  )}
                  required
                />
              </div>
            </div>

            <div className="space-y-2 font-sans">
              <div className="flex items-center justify-between mb-1">
                 <label className="text-sm font-bold text-[#111]">
                    {isRTL ? "كلمة المرور" : "Password"}
                 </label>
                 <a href="/forgot-password" className="text-sm font-bold text-[#ff5a00] hover:underline">
                    {isRTL ? "هل نسيت كلمة المرور؟" : "Forgot password?"}
                 </a>
              </div>
              <div className="relative group">
                <div className={cn(
                  "absolute inset-y-0 flex items-center pointer-events-none text-[#9ca3af] transition-colors group-focus-within:text-[#ff5a00]",
                  isRTL ? "right-4" : "left-4"
                )}>
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type="password" 
                  placeholder={isRTL ? "٨ أحرف على الأقل" : "min 8 characters"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "w-full bg-white border border-[#e0e0e0] rounded-lg py-3.5 focus:border-[#ff5a00] focus:ring-1 focus:ring-[#ff5a00] outline-none transition-all placeholder:text-[#9ca3af] font-bold text-[#111]",
                    isRTL ? "pr-12 pl-4" : "pl-12 pr-4"
                  )}
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff5a00] text-white font-black py-4 rounded-lg hover:bg-[#e04f00] hover:scale-[1.01] transition-all active:scale-[0.98] flex items-center justify-center gap-2 group shadow-lg shadow-[#ff5a00]/20 mt-8"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isRTL ? "جاري التحميل..." : "Processing..."}
                </span>
              ) : (
                <>
                  {isRTL ? "تسجيل الدخول" : "Login"}
                </>
              )}
            </button>
          </form>

          <div className="text-left pt-2">
            <p className="text-[#6b7280] text-sm font-bold">
              {t.noAccount || (isRTL ? "ليس لديك حساب؟" : "Don't have an account?")} <a href="/signup" className="text-[#ff5a00] hover:underline font-black px-1">{isRTL ? "سجل الآن" : "Sign up"}</a>
            </p>
          </div>
          
          <div className="pt-20 lg:hidden">
             <p className="text-[#9ca3af] font-bold text-xs text-center">© 2026 Yawmy Platform. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* RIGHT PANE - Visual Board */}
      <div className="hidden lg:flex w-1/2 bg-[#ff5a00] relative overflow-hidden flex-col items-center justify-center p-12 transition-all duration-500">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
         <div className="absolute inset-0 bg-gradient-to-br from-[#ff5a00] to-[#e04f00]"></div>
         
         <div className="relative z-10 w-full max-w-lg space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <div className="space-y-4">
               <h2 className="text-5xl font-black text-white leading-tight">
                  {isRTL ? "أسهل طريقة لإدارة فريقك ورواتبك" : "The simplest way to manage your workforce"}
               </h2>
               <p className="text-lg text-white/80 font-bold">
                  {isRTL 
                   ? "منصة متكاملة تدعم تليجرام، وتغنيك عن أجهزة البصمة المزعجة." 
                   : "An all-in-one Telegram-powered platform replacing messy physical biometrics."}
               </p>
            </div>

            <div className="relative group perspective">
               <div className="absolute inset-0 bg-white/20 blur-2xl rounded-3xl transform group-hover:scale-105 transition-all duration-700"></div>
               <img src="/hr_mobile_mockup.png" alt="App Preview" className="relative drop-shadow-2xl rounded-2xl transform rotate-[-2deg] group-hover:rotate-0 transition-transform duration-700 border-4 border-white/10" onError={(e) => (e.currentTarget.style.display = 'none')} />
            </div>

            <div className="pt-12 text-center text-white/50 text-sm font-bold flex items-center justify-center gap-8 opacity-60">
               <span className="tracking-widest uppercase">Trusted By Leading SaaS</span>
            </div>
         </div>
      </div>

    </div>
  );
}
