"use client";

import React, { useState, useRef, useEffect } from "react";
import { Clock, ArrowRight, ChevronRight, Building2, Shield, Smartphone } from "lucide-react";
import { countryCodes } from "@/lib/countryCodes";

type Step = "phone" | "select_company" | "otp";

interface CompanyOption { company_id: string; company_name: string; }

export default function TeamLoginPage() {
  const [step, setStep] = useState<Step>("phone");
  const [countryCode, setCountryCode] = useState("+20");
  const [phone, setPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const fullPhone = `${countryCode}${phone.startsWith("0") ? phone.substring(1) : phone}`;
  const otpCode = otpDigits.join("");

  useEffect(() => {
    if (step === "otp") otpRefs.current[0]?.focus();
  }, [step]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (paste.length === 6) {
      setOtpDigits(paste.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  const handleSendOTP = async (companyId?: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/team/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, company_id: companyId }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || "Something went wrong"); return; }
      if (data.step === "select_company") { setCompanies(data.companies); setStep("select_company"); }
      else { setStep("otp"); }
    } catch { setError("Connection error"); }
    finally { setLoading(false); }
  };

  const handleCompanySelect = (companyId: string) => {
    setSelectedCompanyId(companyId);
    handleSendOTP(companyId);
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) return;
    setLoading(true);
    setError("");
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

  // Auto-verify when 6 digits are entered
  useEffect(() => {
    if (otpCode.length === 6 && step === "otp" && !loading) handleVerifyOTP();
  }, [otpCode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ff5a00] via-[#ff7a33] to-[#e04f00] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] bg-black/5 rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
      </div>

      <div className="w-full max-w-[380px] relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-black/20 mb-4">
            <Clock className="w-9 h-9 text-[#ff5a00]" />
          </div>
          <h1 className="text-white text-2xl font-black tracking-tight">Yawmy</h1>
          <p className="text-white/60 text-xs font-medium mt-1">Employee Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-7 shadow-2xl shadow-black/15 backdrop-blur-xl">

          {/* Step: Phone */}
          {step === "phone" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-xl font-black text-[#111] mb-1">Welcome back</h2>
                <p className="text-[13px] text-[#9ca3af] leading-relaxed">
                  Sign in with your phone number. We'll send a verification code to your Telegram.
                </p>
              </div>

              {error && (
                <div className="bg-[#fef2f2] text-[#b91c1c] p-3 rounded-2xl text-xs font-semibold animate-in fade-in duration-200">
                  {error}
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider block mb-2">Phone Number</label>
                <div className="flex bg-[#f9fafb] rounded-2xl overflow-hidden ring-1 ring-[#e5e7eb] focus-within:ring-2 focus-within:ring-[#ff5a00] transition-all">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-transparent px-3 py-4 text-sm font-bold text-[#111] outline-none min-w-[85px] border-e border-[#e5e7eb]"
                    dir="ltr"
                  >
                    {countryCodes.map((c) => (
                      <option key={c.iso} value={c.code}>{c.iso} {c.code}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="Enter your number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 bg-transparent px-4 py-4 text-sm font-semibold text-[#111] placeholder:text-[#b0b0b0] outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <button
                onClick={() => handleSendOTP()}
                disabled={loading || !phone}
                className="w-full bg-[#111] text-white font-bold py-4 rounded-2xl hover:bg-[#222] transition-all flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 pt-2">
                <div className="flex items-center gap-1.5 text-[10px] text-[#b0b0b0] font-medium">
                  <Shield className="w-3 h-3" /> Secure login
                </div>
                <div className="w-px h-3 bg-[#e5e7eb]" />
                <div className="flex items-center gap-1.5 text-[10px] text-[#b0b0b0] font-medium">
                  <Smartphone className="w-3 h-3" /> Via Telegram
                </div>
              </div>
            </div>
          )}

          {/* Step: Select Company */}
          {step === "select_company" && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-xl font-black text-[#111] mb-1">Choose workspace</h2>
                <p className="text-[13px] text-[#9ca3af]">Your number is registered in multiple companies.</p>
              </div>

              <div className="space-y-2">
                {companies.map((c) => (
                  <button
                    key={c.company_id}
                    onClick={() => handleCompanySelect(c.company_id)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl bg-[#f9fafb] hover:bg-[#fff1e8] hover:ring-1 hover:ring-[#ffd4b8] transition-all text-start disabled:opacity-50 group"
                  >
                    <div className="w-10 h-10 bg-[#fff1e8] rounded-xl flex items-center justify-center group-hover:bg-[#ff5a00] group-hover:text-white transition-colors">
                      <Building2 className="w-5 h-5 text-[#ff5a00] group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-sm font-bold text-[#111] flex-1">{c.company_name}</span>
                    <ChevronRight className="w-4 h-4 text-[#c0c0c0] group-hover:text-[#ff5a00] transition-colors" />
                  </button>
                ))}
              </div>

              <button
                onClick={() => { setStep("phone"); setError(""); }}
                className="w-full text-sm text-[#9ca3af] font-semibold hover:text-[#111] transition-colors py-2"
              >
                Back
              </button>
            </div>
          )}

          {/* Step: OTP */}
          {step === "otp" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <div className="w-14 h-14 bg-[#f0fdf4] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-7 h-7 text-[#1e8e3e]" />
                </div>
                <h2 className="text-xl font-black text-[#111] mb-1">Check your Telegram</h2>
                <p className="text-[13px] text-[#9ca3af]">
                  Enter the 6-digit code we sent to your bot
                </p>
              </div>

              {error && (
                <div className="bg-[#fef2f2] text-[#b91c1c] p-3 rounded-2xl text-xs font-semibold animate-in fade-in duration-200">
                  {error}
                </div>
              )}

              {/* OTP Input Boxes */}
              <div className="flex gap-2.5 justify-center" onPaste={handleOtpPaste}>
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
                    className="w-12 h-14 text-center text-xl font-black text-[#111] bg-[#f9fafb] rounded-2xl ring-1 ring-[#e5e7eb] focus:ring-2 focus:ring-[#ff5a00] focus:bg-white outline-none transition-all"
                  />
                ))}
              </div>

              {/* Loading indicator */}
              {loading && (
                <div className="flex justify-center">
                  <div className="w-6 h-6 border-2 border-[#ff5a00]/20 border-t-[#ff5a00] rounded-full animate-spin" />
                </div>
              )}

              <div className="flex flex-col items-center gap-3 pt-2">
                <button
                  onClick={() => handleSendOTP(selectedCompanyId || undefined)}
                  disabled={loading}
                  className="text-xs text-[#ff5a00] font-bold hover:underline disabled:opacity-50"
                >
                  Resend code
                </button>
                <button
                  onClick={() => { setStep("phone"); setOtpDigits(["", "", "", "", "", ""]); setError(""); }}
                  className="text-xs text-[#9ca3af] font-semibold hover:text-[#111] transition-colors"
                >
                  Use different number
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center mt-8 gap-1.5">
          <Clock className="w-3 h-3 text-white/30" />
          <p className="text-[10px] text-white/30 font-medium">Powered by Yawmy — 2026</p>
        </div>
      </div>
    </div>
  );
}
