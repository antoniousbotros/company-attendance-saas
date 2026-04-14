"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Clock, Mail, Lock, ArrowRight, Building2 } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          company_name: companyName // This will be used by our trigger
        }
      }
    });

    if (authError) {
      alert(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
       alert("Registration successful! Please check your email for verification.");
       router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(79,70,229,0.3)]">
            <Clock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Create Account</h1>
          <p className="text-zinc-500">Scale your team with SyncTime</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1.5">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 transition-colors group-focus-within:text-indigo-500">
                <Building2 className="w-5 h-5" />
              </div>
              <input 
                type="text" 
                placeholder="Company Name" 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-600"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 transition-colors group-focus-within:text-indigo-500">
                <Mail className="w-5 h-5" />
              </div>
              <input 
                type="email" 
                placeholder="Email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-600"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 transition-colors group-focus-within:text-indigo-500">
                <Lock className="w-5 h-5" />
              </div>
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-600"
                required
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group shadow-xl shadow-indigo-500/10"
          >
            {loading ? "Creating Account..." : "Register Company"}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="text-center">
          <p className="text-zinc-500 text-sm">
            Already have an account? <Link href="/login" className="text-indigo-400 font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Simple internal Link component to avoid errors if next/link is tricky
function Link({ href, children, className }: any) {
  return <a href={href} className={className}>{children}</a>;
}
