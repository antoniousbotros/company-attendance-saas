"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Clock, Mail, Lock, User, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Language } from "@/lib/i18n";
import { countryCodes } from "@/lib/countryCodes";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState("+20");
  const [phone, setPhone] = useState("");
  
  const [loading, setLoading] = useState(false);
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (password !== confirmPassword) {
       setErrorMsg(isRTL ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
       return;
    }
    
    setLoading(true);
    
    try {
      if (!supabase) throw new Error("Supabase client not initialized");

       const fullPhone = `${countryCode}${phone.startsWith('0') ? phone.substring(1) : phone}`;

       const { data: authData, error: authError } = await supabase.auth.signUp({ 
         email: email.trim(), 
         password,
         options: {
           data: {
             full_name: fullName,
             phone: fullPhone
           }
         }
       });

       if (authError) {
         setErrorMsg(authError.message);
       } else if (authData.user) {
          // Fire off custom Welcome Email via our internal logic leveraging EmailIT API
          fetch("/api/email/welcome", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ email: email.trim(), name: fullName })
          }).catch(console.error);

          window.location.href = "/onboarding";
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative z-10 transition-all duration-500 bg-white shadow-xl shadow-black/5 overflow-y-auto">
        
        {/* Lang Switcher Absolute Corner */}
        <button 
          type="button"
          onClick={toggleLang}
          className={cn("absolute top-8 flex items-center gap-2 bg-[#f9fafb] text-[#6b7280] border border-[#e0e0e0] px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#f5f5f5] hover:text-[#111] transition-all", isRTL ? "left-8" : "right-8")}
        >
          <Languages className="w-4 h-4" />
          {lang === "en" ? "العربية" : "English"}
        </button>

        <div className="w-full max-w-[420px] space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 py-12">
          
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
                 {isRTL ? "ابدأ اليوم مجاناً" : "Get Started Now"}
               </h1>
               <p className="text-[#6b7280] font-bold text-lg">
                 {isRTL ? "قم بإنشاء حسابك لإدارة فريق عملك" : "Create your account to manage your workforce"}
               </p>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            
            {errorMsg && (
               <div className="bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca] p-4 rounded-lg text-sm font-bold animate-in fade-in">
                  {errorMsg}
               </div>
            )}

            <div className="space-y-1.5 font-sans">
              <label className="text-sm font-bold text-[#111] block mb-1">
                 {isRTL ? "الاسم الكامل" : "Full Name"}
              </label>
              <div className="relative group">
                <div className={cn(
                  "absolute inset-y-0 flex items-center pointer-events-none text-[#9ca3af] transition-colors group-focus-within:text-[#ff5a00]",
                  isRTL ? "right-4" : "left-4"
                )}>
                  <User className="w-5 h-5" />
                </div>
                <input 
                  type="text" 
                  placeholder={isRTL ? "اسمك الكامل" : "Mina Botros"}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={cn(
                    "w-full bg-white border border-[#e0e0e0] rounded-lg py-3.5 focus:border-[#ff5a00] focus:ring-1 focus:ring-[#ff5a00] outline-none transition-all placeholder:text-[#9ca3af] font-bold text-[#111]",
                    isRTL ? "pr-12 pl-4" : "pl-12 pr-4"
                  )}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 font-sans">
              <label className="text-sm font-bold text-[#111] block mb-1">
                 {isRTL ? "رقم الهاتف" : "Phone Number"}
              </label>
              <div 
                 className={cn(
                    "flex bg-white border border-[#e0e0e0] rounded-lg focus-within:border-[#ff5a00] focus-within:ring-1 focus-within:ring-[#ff5a00] transition-all items-center",
                    isRTL ? "flex-row" : "flex-row" // Visual standard: country code on left globally, or match RTL
                    // Actually, let's strictly put it left in English, right in Arabic
                 )}
                 style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
              >
                  <select 
                     value={countryCode} 
                     onChange={e => setCountryCode(e.target.value)} 
                     className={cn(
                        "appearance-none bg-transparent outline-none py-3.5 text-[#111] font-bold text-center cursor-pointer min-w-[80px]",
                        isRTL ? "border-l border-[#e0e0e0]" : "border-r border-[#e0e0e0]"
                     )}
                     dir="ltr"
                  >
                     {countryCodes.map(c => (
                        <option key={c.iso} value={c.code}>{c.iso} {c.code}</option>
                     ))}
                  </select>
                  <div className="relative flex-1 group">
                     {/* No icon for phone to keep it clean alongside the dropdown */}
                     <input 
                        type="tel" 
                        placeholder={isRTL ? "رقم المحمول" : "Mobile number"}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={cn(
                           "w-full bg-transparent outline-none py-3.5 placeholder:text-[#9ca3af] font-bold text-[#111]",
                           isRTL ? "text-right pr-4 pl-4" : "text-left pl-4 pr-4"
                        )}
                        required
                     />
                  </div>
              </div>
            </div>

            <div className="space-y-1.5 font-sans">
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

            <div className="space-y-1.5 font-sans">
              <label className="text-sm font-bold text-[#111] block mb-1">
                 {isRTL ? "كلمة المرور" : "Password"}
              </label>
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

            <div className="space-y-1.5 font-sans">
              <label className="text-sm font-bold text-[#111] block mb-1">
                 {isRTL ? "تأكيد كلمة المرور" : "Confirm Password"}
              </label>
              <div className="relative group">
                <div className={cn(
                  "absolute inset-y-0 flex items-center pointer-events-none text-[#9ca3af] transition-colors group-focus-within:text-[#ff5a00]",
                  isRTL ? "right-4" : "left-4"
                )}>
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type="password" 
                  placeholder={isRTL ? "أعد كتابة كلمة المرور" : "Re-enter password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    "w-full bg-white border border-[#e0e0e0] rounded-lg py-3.5 focus:border-[#ff5a00] focus:ring-1 focus:ring-[#ff5a00] outline-none transition-all placeholder:text-[#9ca3af] font-bold text-[#111]",
                    isRTL ? "pr-12 pl-4" : "pl-12 pr-4"
                  )}
                  required
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-2">
               <input type="checkbox" required className="w-4 h-4 rounded text-[#ff5a00] ring-[#ff5a00] focus:ring-[#ff5a00] border-[#eeeeee] accent-[#ff5a00]" />
               <span className="text-[#6b7280] font-bold text-sm">
                  {isRTL ? "أوافق على " : "I agree to the "}
                  <a href="#" className="text-[#111] underline hover:text-[#ff5a00]">{isRTL ? "الشروط والخصوصية" : "Terms & Privacy"}</a>
               </span>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff5a00] text-white font-black py-4 rounded-lg hover:bg-[#e04f00] hover:scale-[1.01] transition-all active:scale-[0.98] flex items-center justify-center gap-2 group shadow-lg shadow-[#ff5a00]/20 mt-4"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isRTL ? "جاري إنشاء حسابك..." : "Processing..."}
                </span>
              ) : (
                <>
                  {isRTL ? "إنشاء الحساب" : "Create Account"}
                </>
              )}
            </button>
          </form>

          <div className="text-left pt-2 pb-12">
            <p className="text-[#6b7280] text-sm font-bold">
              {isRTL ? "لديك حساب بالفعل؟" : "Have an account?"} <a href="/login" className="text-[#ff5a00] hover:underline font-black px-1">{isRTL ? "تسجيل الدخول" : "Sign in"}</a>
            </p>
          </div>
          
        </div>
      </div>

      {/* RIGHT PANE - Visual Board (Exactly mirrors Login component for UX consistency) */}
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
               <img src="https://media.discordapp.net/attachments/1231649964593414235/1231650073699844096/telegram_mockup.png" alt="App Preview" className="relative drop-shadow-2xl rounded-2xl transform rotate-[2deg] group-hover:rotate-0 transition-transform duration-700 border-4 border-white/10" onError={(e) => (e.currentTarget.style.display = 'none')} />
            </div>

            <div className="pt-12 text-center text-white/50 text-sm font-bold flex items-center justify-center gap-8 opacity-60">
               <span className="tracking-widest uppercase">Trusted By Leading SaaS</span>
            </div>
         </div>
      </div>

    </div>
  );
}
