"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Clock, Mail, Lock, ArrowRight, User, Globe } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (authError) {
      alert(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
       // Auto-login or redirect to onboarding
       window.location.href = "/onboarding";
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 selection:bg-indigo-500/30">
      <div className="w-full max-w-[420px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(79,70,229,0.3)] animate-pulse">
            <Clock className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">
            ابدأ في أقل من دقيقة
          </h1>
          <p className="text-zinc-500 text-lg">بدون أجهزة — كله من موبايلك</p>
        </div>

        <div className="space-y-4">
          <button className="w-full bg-zinc-900 border border-zinc-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all border-b-4 border-zinc-950 active:border-b-0 active:translate-y-1">
            <Globe className="w-5 h-5 text-indigo-400" />
            Continue with Google
          </button>
          
          <div className="flex items-center gap-4 py-2">
            <div className="h-[1px] flex-1 bg-zinc-800" />
            <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Or with email</span>
            <div className="h-[1px] flex-1 bg-zinc-800" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Full Name" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-600"
                required
              />
            </div>

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="email" 
                placeholder="Email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-600"
                required
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-600"
                required
              />
            </div>

            <button 
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group shadow-2xl shadow-indigo-500/20 text-lg mt-4"
            >
              {loading ? "Creating your workspace..." : "ابدأ مجانًا"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-500 text-sm">
          Already have an account? <a href="/login" className="text-indigo-400 font-bold hover:underline">Sign In</a>
        </p>
      </div>
    </div>
  );
}
