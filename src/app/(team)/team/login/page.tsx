"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowRight, ChevronRight, Building2, ChevronLeft, Eye, EyeOff } from "lucide-react";
import { countryCodes } from "@/lib/countryCodes";

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
        // telegram mode — send OTP
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[340px]">

        {/* Logo */}
        <div className="mb-12 text-center">
          <div className="w-12 h-12 bg-[#ff5a00] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#ff5a00]/15">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <p className="text-[11px] font-semibold text-[#b0b0b0] tracking-[0.2em] uppercase">Employee Portal</p>
        </div>

        {/* ── Phone Step ── */}
        {step === "phone" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h1 className="text-[28px] font-black text-[#111] tracking-tight leading-tight">Sign in</h1>
              <p className="text-[14px] text-[#999] mt-2 leading-relaxed">Enter your phone number to continue.</p>
            </div>

            {error && <p className="text-[13px] text-[#e04f00] font-semibold">{error}</p>}

            <div className="space-y-2">
              <div className="flex items-center border-b-2 border-[#e5e7eb] focus-within:border-[#111] transition-colors">
                <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="bg-transparent py-4 text-[15px] font-semibold text-[#111] outline-none pe-2" dir="ltr">
                  {countryCodes.map((c) => (<option key={c.iso} value={c.code}>{c.iso} {c.code}</option>))}
                </select>
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && phone && handlePhoneContinue()}
                  className="flex-1 bg-transparent py-4 text-[15px] font-semibold text-[#111] placeholder:text-[#ccc] outline-none"
                  autoFocus
                />
              </div>
            </div>

            <button
              onClick={() => handlePhoneContinue()}
              disabled={loading || !phone}
              className="w-full bg-[#111] text-white font-semibold py-4 rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-30"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        )}

        {/* ── Select Company ── */}
        {step === "select_company" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <button onClick={() => { setStep("phone"); setError(""); }} className="text-[#999] hover:text-[#111] mb-4 flex items-center gap-1 text-sm font-medium"><ChevronLeft className="w-4 h-4" /> Back</button>
              <h1 className="text-[28px] font-black text-[#111] tracking-tight">Choose workspace</h1>
              <p className="text-[14px] text-[#999] mt-2">Multiple accounts found.</p>
            </div>
            <div className="space-y-1">
              {companies.map((c) => (
                <button key={c.company_id} onClick={() => handleCompanySelect(c.company_id)} disabled={loading}
                  className="w-full flex items-center gap-4 py-4 px-1 border-b border-[#f5f5f5] last:border-0 hover:bg-[#fafafa] transition-colors text-start disabled:opacity-50 group">
                  <div className="w-10 h-10 bg-[#f5f5f5] rounded-xl flex items-center justify-center group-hover:bg-[#ff5a00] transition-colors">
                    <Building2 className="w-5 h-5 text-[#999] group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-[15px] font-semibold text-[#111] flex-1">{c.company_name}</span>
                  {loading ? <div className="w-4 h-4 border-2 border-[#ddd] border-t-[#111] rounded-full animate-spin" /> : <ChevronRight className="w-4 h-4 text-[#ddd]" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Password Step ── */}
        {step === "password" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <button onClick={() => { setStep("phone"); setPassword(""); setError(""); }} className="text-[#999] hover:text-[#111] mb-4 flex items-center gap-1 text-sm font-medium"><ChevronLeft className="w-4 h-4" /> Back</button>
              <h1 className="text-[28px] font-black text-[#111] tracking-tight leading-tight">Enter password</h1>
              <p className="text-[14px] text-[#999] mt-2">Use the password your manager gave you.</p>
            </div>

            {error && <p className="text-[13px] text-[#e04f00] font-semibold">{error}</p>}

            <div className="flex items-center border-b-2 border-[#e5e7eb] focus-within:border-[#111] transition-colors">
              <input
                ref={passwordRef}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && password && handlePasswordLogin()}
                className="flex-1 bg-transparent py-4 text-[15px] font-semibold text-[#111] placeholder:text-[#ccc] outline-none"
              />
              <button onClick={() => setShowPassword((v) => !v)} className="text-[#bbb] hover:text-[#111] transition-colors p-2">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              onClick={handlePasswordLogin}
              disabled={loading || !password.trim()}
              className="w-full bg-[#111] text-white font-semibold py-4 rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-30"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        )}

        {/* ── OTP Step ── */}
        {step === "otp" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <button onClick={() => { setStep("phone"); setOtpDigits(["","","","","",""]); setError(""); }} className="text-[#999] hover:text-[#111] mb-4 flex items-center gap-1 text-sm font-medium"><ChevronLeft className="w-4 h-4" /> Back</button>
              <h1 className="text-[28px] font-black text-[#111] tracking-tight">Verification</h1>
              <p className="text-[14px] text-[#999] mt-2">Enter the 6-digit code sent to your Telegram.</p>
            </div>

            {error && <p className="text-[13px] text-[#e04f00] font-semibold">{error}</p>}

            <div className="flex gap-3 justify-center" onPaste={handleOtpPaste}>
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
                  className="w-12 h-14 text-center text-[20px] font-black text-[#111] border-b-2 border-[#e5e7eb] focus:border-[#111] bg-transparent outline-none transition-colors"
                />
              ))}
            </div>

            {loading && (
              <div className="flex justify-center">
                <div className="w-5 h-5 border-2 border-[#111]/10 border-t-[#111] rounded-full animate-spin" />
              </div>
            )}

            <div className="text-center">
              <button onClick={() => sendOTP(selectedCompanyId || undefined)} disabled={loading} className="text-[13px] text-[#999] font-medium hover:text-[#111] transition-colors disabled:opacity-50">
                Resend code
              </button>
            </div>
          </div>
        )}

        <div className="mt-16 text-center">
          <p className="text-[11px] text-[#ddd] font-medium">Yawmy &middot; 2026</p>
        </div>
      </div>
    </div>
  );
}
