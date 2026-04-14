"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Clock, Mail, Lock, ArrowRight, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { translations, type Language } from "@/lib/i18n";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<Language>("en");
  const router = useRouter();

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
    console.log("Attempting login for:", email);
    setLoading(true);
    
    try {
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password: password 
      });

      if (error) {
        console.error("Login error:", error.message);
        alert(error.message);
      } else if (data.session || data.user) {
        console.log("Login successful!");
        window.location.href = "/overview";
      } else {
        alert("Check your email for confirmation link.");
      }
    } catch (err: any) {
      console.error("System error:", err.message);
      alert("System error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Lang Switcher floating */}
      <button 
        type="button"
        onClick={toggleLang}
        className="fixed top-8 right-8 flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-xl font-bold text-sm hover:bg-border transition-all z-50"
      >
        <Languages className="w-4 h-4" />
        {lang === "en" ? "العربية" : "English"}
      </button>

      <div className="w-full max-w-[420px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(79,70,229,0.3)]">
            <Clock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">{t.welcomeBack}</h1>
          <p className="text-zinc-500 font-bold">{t.signInSubtitle}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5 font-sans">
            <div className="relative group">
              <div className={cn(
                "absolute inset-y-0 flex items-center pointer-events-none text-zinc-500 transition-colors group-focus-within:text-indigo-500",
                lang === 'ar' ? "right-4" : "left-4"
              )}>
                <Mail className="w-5 h-5" />
              </div>
              <input 
                type="email" 
                placeholder="Email Address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(
                  "w-full bg-secondary border border-border rounded-2xl py-3.5 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-600 font-bold",
                  lang === 'ar' ? "pr-12 pl-4" : "pl-12 pr-4"
                )}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5 font-sans">
            <div className="relative group">
              <div className={cn(
                "absolute inset-y-0 flex items-center pointer-events-none text-zinc-500 transition-colors group-focus-within:text-indigo-500",
                lang === 'ar' ? "right-4" : "left-4"
              )}>
                <Lock className="w-5 h-5" />
              </div>
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(
                  "w-full bg-secondary border border-border rounded-2xl py-3.5 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-600 font-bold",
                  lang === 'ar' ? "pr-12 pl-4" : "pl-12 pr-4"
                )}
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-background font-black py-4 rounded-2xl hover:scale-[1.02] transition-all active:scale-[0.98] flex items-center justify-center gap-2 group shadow-xl relative overflow-hidden h-14"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <>
                Sign In
                <ArrowRight className={cn("w-5 h-5 group-hover:translate-x-1 transition-transform", lang === 'ar' && "rotate-180")} />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-4">
          <p className="text-zinc-500 text-sm font-bold">
            {t.noAccount} <a href="/signup" className="text-indigo-600 hover:underline font-black">{t.registerCompany}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
