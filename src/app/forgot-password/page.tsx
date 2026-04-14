"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Clock, Mail, ArrowRight, Languages, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Language } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
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

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccess(false);
    
    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
         redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err: unknown) {
      setErrorMsg("System error: " + (err instanceof Error ? err.message : String(err)));
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
          className={cn("absolute top-8 flex items-center gap-2 bg-[#f9fafb] text-[#6b7280] border border-[#eeeeee] px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#f5f5f5] hover:text-[#111] transition-all", isRTL ? "left-8" : "right-8")}
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
                 {isRTL ? "نسيت كلمة المرور؟" : "Reset Password"}
               </h1>
               <p className="text-[#6b7280] font-bold text-lg">
                 {isRTL ? "أدخل بريدك الإلكتروني وسنرسل لك رابطاً لاستعادة حسابك." : "Enter your email and we'll send you a recovery link."}
               </p>
            </div>
          </div>

          {!success ? (
             <form onSubmit={handleReset} className="space-y-6">
               
               {errorMsg && (
                  <div className="bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca] p-4 rounded-xl text-sm font-bold animate-in fade-in">
                     {errorMsg}
                  </div>
               )}

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
                       "w-full bg-white border border-[#eeeeee] rounded-xl py-3.5 focus:border-[#ff5a00] focus:ring-1 focus:ring-[#ff5a00] outline-none transition-all placeholder:text-[#9ca3af] font-bold text-[#111] shadow-sm",
                       isRTL ? "pr-12 pl-4" : "pl-12 pr-4"
                     )}
                     required
                   />
                 </div>
               </div>

               <button 
                 type="submit"
                 disabled={loading}
                 className="w-full bg-[#111] text-white font-black py-4 rounded-xl hover:bg-[#111]/80 hover:scale-[1.01] transition-all active:scale-[0.98] flex items-center justify-center gap-2 group shadow-xl shadow-black/10 mt-8"
               >
                 {loading ? (
                   <span className="flex items-center gap-2">
                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     {isRTL ? "جاري الإرسال..." : "Processing..."}
                   </span>
                 ) : (
                   <>
                     {isRTL ? "إرسال رابط الاستعادة" : "Send Recovery Link"}
                     <ArrowRight className={cn("w-5 h-5 group-hover:translate-x-1 transition-transform", isRTL && "rotate-180")} />
                   </>
                 )}
               </button>
             </form>
          ) : (
             <div className="bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] p-6 rounded-xl animate-in fade-in space-y-3">
                <h3 className="font-black text-lg">{isRTL ? "تم إرسال الرابط بنجاح!" : "Recovery Link Sent!"}</h3>
                <p className="font-bold text-sm">
                   {isRTL ? `لقد قمنا بإرسال رسالة إلى ${email}. يرجى التحقق من بريدك الوارد (ومجلد الرسائل غير المرغوب فيها) لتعيين كلمة مرور جديدة.` : `We've sent an email to ${email}. Please check your inbox (and spam folder) to set a new password.`}
                </p>
             </div>
          )}

          <div className="text-left pt-2">
            <p className="text-[#6b7280] text-sm font-bold">
              {isRTL ? "تذكرت كلمة المرور؟" : "Remembered your password?"} <a href="/login" className="text-[#ff5a00] hover:underline font-black px-1">{isRTL ? "تسجيل الدخول" : "Sign in here"}</a>
            </p>
          </div>
          
          <div className="pt-20 lg:hidden">
             <p className="text-[#9ca3af] font-bold text-xs text-center">© 2026 Yawmy Platform. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* RIGHT PANE - Visual Board (Using dark variant for Password Reset to separate contexts) */}
      <div className="hidden lg:flex w-1/2 bg-[#111] relative overflow-hidden flex-col items-center justify-center p-12 transition-all duration-500">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
         
         <div className="relative z-10 w-full max-w-lg space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <div className="space-y-4">
               <h2 className="text-5xl font-black text-white leading-tight">
                  {isRTL ? "بياناتك في أمان دائماً" : "Your data is always secure"}
               </h2>
               <p className="text-lg text-[#9ca3af] font-bold">
                  {isRTL 
                   ? "منصة يومي مشفرة بالكامل. لا يمكن لأي شخص الاطلاع على بيانات موظفيك باستثناءك." 
                   : "Yawmy is completely encrypted. No one can access your employee data except you."}
               </p>
            </div>

            <div className="relative group perspective pt-8">
               <div className="absolute inset-0 bg-[#ff5a00]/20 blur-3xl rounded-3xl transform group-hover:scale-105 transition-all duration-700"></div>
               {/* Decorative floating widget showing security lock instead of dashboard */}
               <div className="relative bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm text-center shadow-2xl">
                  <Lock className="w-20 h-20 text-[#ff5a00] mx-auto opacity-80" />
                  <div className="mt-6 space-y-2">
                     <div className="h-2 w-1/2 bg-white/10 rounded-full mx-auto"></div>
                     <div className="h-2 w-3/4 bg-white/10 rounded-full mx-auto"></div>
                     <div className="h-2 w-1/3 bg-white/10 rounded-full mx-auto"></div>
                  </div>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
}
