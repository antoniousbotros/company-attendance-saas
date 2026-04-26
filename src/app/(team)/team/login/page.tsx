"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowRight, ChevronRight, Building2, ChevronLeft, Eye, EyeOff, Smartphone, ShieldCheck, Lock, Loader2 } from "lucide-react";
import { countryCodes } from "@/lib/countryCodes";
import { cn } from "@/lib/utils";

type Step = "phone" | "select_company" | "otp" | "password";

interface CompanyOption { company_id: string; company_name: string; }

export default function TeamLoginPage() {
  const [step, setStep] = useState<Step>("phone");
  const [countryCode, setCountryCode] = useState("+20");
  const [phone, setPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const passwordRef = useRef<HTMLInputElement>(null);

  const fullPhone = `${countryCode}${phone.startsWith("0") ? phone.substring(1) : phone}`;
  const otpCode = otpDigits.join("");

  useEffect(() => { if (step === "otp") otpRefs.current[0]?.focus(); }, [step]);
  useEffect(() => { if (step === "password") setTimeout(() => passwordRef.current?.focus(), 100); }, [step]);

  // ── OTP helpers ─────────────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (paste.length === 6) { setOtpDigits(paste.split("")); otpRefs.current[5]?.focus(); }
  };

  // ── Step 1: check mode after phone entry ────────────────────────────────────
  const handlePhoneContinue = async (companyId?: string) => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/team/auth/check-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, company_id: companyId }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || "Something went wrong"); return; }

      if (data.mode === "select_company") {
        setCompanies(data.companies);
        setStep("select_company");
      } else if (data.mode === "password") {
        if (companyId) setSelectedCompanyId(companyId);
        setStep("password");
      } else {
        if (companyId) setSelectedCompanyId(companyId);
        await sendOTP(companyId);
      }
    } catch { setError("Connection error"); }
    finally { setLoading(false); }
  };

  const handleCompanySelect = (companyId: string) => {
    setSelectedCompanyId(companyId);
    handlePhoneContinue(companyId);
  };

  // ── Telegram OTP flow ────────────────────────────────────────────────────────
  const sendOTP = async (companyId?: string) => {
    const res = await fetch("/api/team/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: fullPhone, company_id: companyId }),
    });
    const data = await res.json();
    if (!data.ok) { setError(data.error || "Failed to send code"); return; }
    setStep("otp");
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/team/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, code: otpCode, company_id: selectedCompanyId || undefined }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || "Invalid code"); return; }
      window.location.href = "/team";
    } catch { setError("Connection error"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (otpCode.length === 6 && step === "otp" && !loading) handleVerifyOTP();
  }, [otpCode]);

  // ── Password flow ────────────────────────────────────────────────────────────
  const handlePasswordLogin = async () => {
    if (!password.trim()) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/team/auth/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, password: password.trim(), company_id: selectedCompanyId || undefined }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || "Invalid phone or password"); return; }
      window.location.href = "/team";
    } catch { setError("Connection error"); }
    finally { setLoading(false); }
  };

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[400px] z-10">
        {/* Logo Section */}
        <div className="mb-12 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <img src="/logos/yawmy-logo.svg" alt="Yawmy" className="h-12 w-auto mb-4" />
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1 opacity-60">Team Portal</p>
        </div>

        <div className="premium-card p-8 md:p-10 shadow-2xl shadow-slate-900/5 relative overflow-hidden">
          {/* Step indicator dot */}
          <div className="absolute top-4 right-4 flex gap-1">
            {["phone", "select_company", "otp", "password"].includes(step) && [1,2,3].map(i => (
              <div key={i} className={cn("w-1 h-1 rounded-full transition-all duration-500", 
                (step === "phone" && i === 1) || (step === "select_company" && i === 1) || (step === "password" && i === 2) || (step === "otp" && i === 2)
                ? "bg-primary w-3" : "bg-muted")} 
              />
            ))}
          </div>

          {/* ── Phone Step ── */}
          {step === "phone" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">Authentication</span>
                </div>
                <h1 className="text-3xl font-black text-foreground tracking-tight leading-none">Welcome back</h1>
                <p className="text-sm font-medium text-muted-foreground mt-3 leading-relaxed">Enter your registered phone number to access your dashboard.</p>
              </div>

              {error && (
                <div className="bg-danger-soft border border-danger/10 p-3 rounded-xl flex items-center gap-3 animate-in shake duration-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-danger" />
                  <p className="text-xs font-black text-danger uppercase tracking-tight">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center bg-muted/50 rounded-2xl p-1 focus-within:bg-white focus-within:ring-2 ring-primary/20 transition-all border border-border/50">
                  <select 
                    value={countryCode} 
                    onChange={(e) => setCountryCode(e.target.value)} 
                    className="bg-transparent py-4 px-4 text-sm font-black text-foreground outline-none border-e border-border/50" 
                    dir="ltr"
                  >
                    {countryCodes.map((c) => (<option key={c.iso} value={c.code}>{c.iso} {c.code}</option>))}
                  </select>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && phone && handlePhoneContinue()}
                    className="flex-1 bg-transparent py-4 px-4 text-sm font-black text-foreground placeholder:text-muted-foreground/40 outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <button
                onClick={() => handlePhoneContinue()}
                disabled={loading || !phone}
                className="w-full h-14 bg-foreground text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-20 shadow-lg shadow-slate-900/10"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4 stroke-[3]" /></>}
              </button>
            </div>
          )}

          {/* ── Select Company ── */}
          {step === "select_company" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <button onClick={() => { setStep("phone"); setError(""); }} className="group text-muted-foreground hover:text-foreground mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors">
                  <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back
                </button>
                <h1 className="text-3xl font-black text-foreground tracking-tight">Workspace</h1>
                <p className="text-sm font-medium text-muted-foreground mt-3">Select the account you want to sign in with.</p>
              </div>

              <div className="grid gap-2">
                {companies.map((c) => (
                  <button key={c.company_id} onClick={() => handleCompanySelect(c.company_id)} disabled={loading}
                    className="w-full flex items-center gap-4 p-4 bg-muted/30 hover:bg-primary-soft hover:border-primary/20 border border-border/50 rounded-2xl transition-all text-start disabled:opacity-50 group relative">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                      <Building2 className="w-6 h-6 stroke-[2]" />
                    </div>
                    <span className="text-sm font-black text-foreground flex-1 tracking-tight">{c.company_name}</span>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <ChevronRight className="w-4 h-4 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Password Step ── */}
          {step === "password" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <button onClick={() => { setStep("phone"); setPassword(""); setError(""); }} className="group text-muted-foreground hover:text-foreground mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors">
                  <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">Security</span>
                </div>
                <h1 className="text-3xl font-black text-foreground tracking-tight">Security Check</h1>
                <p className="text-sm font-medium text-muted-foreground mt-3 leading-relaxed">Enter your private password to unlock your workspace access.</p>
              </div>

              {error && (
                <div className="bg-danger-soft border border-danger/10 p-3 rounded-xl flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-danger" />
                  <p className="text-xs font-black text-danger uppercase tracking-tight">{error}</p>
                </div>
              )}

              <div className="relative">
                <input
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  placeholder="Private Password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && password && handlePasswordLogin()}
                  className="w-full bg-muted/50 border border-border/50 rounded-2xl px-5 py-4 text-sm font-black text-foreground placeholder:text-muted-foreground/40 outline-none focus:bg-white focus:ring-2 ring-primary/20 transition-all"
                />
                <button onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-2">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                onClick={handlePasswordLogin}
                disabled={loading || !password.trim()}
                className="w-full h-14 bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-20 shadow-lg shadow-primary/20"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Access Portal <ArrowRight className="w-4 h-4 stroke-[3]" /></>}
              </button>
            </div>
          )}

          {/* ── OTP Step ── */}
          {step === "otp" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <button onClick={() => { setStep("phone"); setOtpDigits(["","","","","",""]); setError(""); }} className="group text-muted-foreground hover:text-foreground mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors">
                  <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">Verification</span>
                </div>
                <h1 className="text-3xl font-black text-foreground tracking-tight">Verify Identity</h1>
                <p className="text-sm font-medium text-muted-foreground mt-3">We've sent a 6-digit security code to your Telegram.</p>
              </div>

              {error && (
                <div className="bg-danger-soft border border-danger/10 p-3 rounded-xl flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-danger" />
                  <p className="text-xs font-black text-danger uppercase tracking-tight">{error}</p>
                </div>
              )}

              <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-full max-w-[50px] h-14 text-center text-xl font-black text-foreground bg-muted/50 border border-border/50 rounded-xl focus:bg-white focus:border-primary focus:ring-2 ring-primary/20 outline-none transition-all"
                  />
                ))}
              </div>

              {loading && (
                <div className="flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}

              <div className="text-center">
                <button onClick={() => sendOTP(selectedCompanyId || undefined)} disabled={loading} className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors disabled:opacity-50">
                  Didn't receive it? <span className="text-primary underline decoration-primary/20 underline-offset-4 ml-1">Resend code</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center animate-in fade-in duration-1000 delay-500">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center justify-center gap-4">
            <span>Security First</span>
            <span className="w-1 h-1 bg-border rounded-full" />
            <span>Yawmy Cloud</span>
            <span className="w-1 h-1 bg-border rounded-full" />
            <span>v2.4.0</span>
          </p>
          <p className="text-[9px] font-bold text-muted-foreground/30 mt-4 uppercase tracking-[0.1em]">&copy; 2026 Yawmy Technology Group. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
