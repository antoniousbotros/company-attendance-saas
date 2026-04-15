"use client";

import React, { useState } from "react";
import { Clock, Phone, KeyRound, ChevronRight, Building2 } from "lucide-react";
import { countryCodes } from "@/lib/countryCodes";

type Step = "phone" | "select_company" | "otp";

interface CompanyOption {
  company_id: string;
  company_name: string;
}

export default function TeamLoginPage() {
  const [step, setStep] = useState<Step>("phone");
  const [countryCode, setCountryCode] = useState("+20");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fullPhone = `${countryCode}${phone.startsWith("0") ? phone.substring(1) : phone}`;

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

      if (!data.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      if (data.step === "select_company") {
        setCompanies(data.companies);
        setStep("select_company");
      } else {
        setStep("otp");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = (companyId: string) => {
    setSelectedCompanyId(companyId);
    handleSendOTP(companyId);
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/team/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, code: otp, company_id: selectedCompanyId || undefined }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Invalid code");
        return;
      }

      window.location.href = "/team";
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-[#ff5a00] rounded-xl flex items-center justify-center shadow-lg shadow-[#ff5a00]/20">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-[#111]">Yawmy</span>
        </div>

        <div className="bg-white rounded-2xl border border-[#e0e0e0] p-6 shadow-sm">
          {/* Step: Phone */}
          {step === "phone" && (
            <div className="space-y-5">
              <div className="text-center">
                <h1 className="text-xl font-black text-[#111]">Employee Login</h1>
                <p className="text-sm text-[#6b7280] mt-1">
                  Enter your phone to receive a code on Telegram
                </p>
              </div>

              {error && (
                <div className="bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca] p-3 rounded-lg text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-[#111] block mb-1.5">Phone number</label>
                <div className="flex border border-[#e0e0e0] rounded-lg overflow-hidden focus-within:border-[#ff5a00] focus-within:ring-1 focus-within:ring-[#ff5a00]">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-[#f9fafb] border-r border-[#e0e0e0] px-2 py-3 text-sm font-bold text-[#111] outline-none min-w-[80px]"
                    dir="ltr"
                  >
                    {countryCodes.map((c) => (
                      <option key={c.iso} value={c.code}>
                        {c.iso} {c.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="Mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 px-3 py-3 text-sm font-bold text-[#111] placeholder:text-[#9ca3af] outline-none"
                  />
                </div>
              </div>

              <button
                onClick={() => handleSendOTP()}
                disabled={loading || !phone}
                className="w-full bg-[#ff5a00] text-white font-black py-3 rounded-lg hover:bg-[#e04f00] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Phone className="w-4 h-4" />
                    Send Code
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step: Select Company */}
          {step === "select_company" && (
            <div className="space-y-5">
              <div className="text-center">
                <h1 className="text-xl font-black text-[#111]">Select Company</h1>
                <p className="text-sm text-[#6b7280] mt-1">
                  Your phone is registered in multiple companies
                </p>
              </div>

              <div className="space-y-2">
                {companies.map((c) => (
                  <button
                    key={c.company_id}
                    onClick={() => handleCompanySelect(c.company_id)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-[#e0e0e0] hover:border-[#ff5a00] hover:bg-[#fff8f5] transition-all text-left disabled:opacity-50"
                  >
                    <div className="w-9 h-9 bg-[#fff1e8] rounded-lg flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-[#ff5a00]" />
                    </div>
                    <span className="text-sm font-bold text-[#111] flex-1">{c.company_name}</span>
                    <ChevronRight className="w-4 h-4 text-[#9ca3af]" />
                  </button>
                ))}
              </div>

              <button
                onClick={() => { setStep("phone"); setError(""); }}
                className="w-full text-sm text-[#6b7280] font-semibold hover:text-[#111]"
              >
                Back
              </button>
            </div>
          )}

          {/* Step: OTP */}
          {step === "otp" && (
            <div className="space-y-5">
              <div className="text-center">
                <h1 className="text-xl font-black text-[#111]">Enter Code</h1>
                <p className="text-sm text-[#6b7280] mt-1">
                  We sent a 6-digit code to your Telegram
                </p>
              </div>

              {error && (
                <div className="bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca] p-3 rounded-lg text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center text-2xl font-black tracking-[0.5em] py-4 border border-[#e0e0e0] rounded-lg focus:border-[#ff5a00] focus:ring-1 focus:ring-[#ff5a00] outline-none"
                  autoFocus
                />
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full bg-[#ff5a00] text-white font-black py-3 rounded-lg hover:bg-[#e04f00] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Verify
                  </>
                )}
              </button>

              <button
                onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
                className="w-full text-sm text-[#6b7280] font-semibold hover:text-[#111]"
              >
                Use different number
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[#9ca3af] mt-6 font-medium">
          © 2026 Yawmy Platform
        </p>
      </div>
    </div>
  );
}
