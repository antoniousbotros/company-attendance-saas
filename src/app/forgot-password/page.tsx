"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowRight, Mail, Lock, Eye, EyeOff, ChevronLeft, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "email" | "otp" | "new_password" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const otpCode = otpDigits.join("");

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  useEffect(() => { if (step === "otp") otpRefs.current[0]?.focus(); }, [step]);

  // ── OTP input helpers ──────────────────────────────────────────────────────
  const handleOtpChange = (i: number, val: string) => {
    if (val.length > 1) val = val.slice(-1);
    if (val && !/^\d$/.test(val)) return;
    const next = [...otpDigits]; next[i] = val; setOtpDigits(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };
  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (paste.length === 6) { setOtpDigits(paste.split("")); otpRefs.current[5]?.focus(); }
  };

  // ── Step 1: send OTP ───────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!email.trim()) return;
    setLoading(true); setError("");
    const res = await fetch("/api/auth/owner/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), purpose: "reset_password" }),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.ok) { setError(data.error || "Something went wrong"); return; }
    setStep("otp");
    setResendCountdown(60);
  };

  // ── Step 2: verify OTP ─────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) return;
    setLoading(true); setError("");
    // We don't verify here — the OTP is verified together with the new password in step 3
    // Just advance to let user enter new password
    setLoading(false);
    setStep("new_password");
  };

  // ── Step 3: set new password ───────────────────────────────────────────────
  const handleResetPassword = async () => {
    if (!newPass.trim() || newPass !== confirmPass) {
      setError("Passwords do not match"); return;
    }
    if (newPass.length < 8) {
      setError("Password must be at least 8 characters"); return;
    }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/owner/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), code: otpCode, new_password: newPass }),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.ok) { setError(data.error || "Invalid or expired code. Please start over."); return; }
    setStep("done");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[360px]">

        {/* Logo */}
        <div className="mb-12 text-center flex flex-col items-center">
          <img src="/logos/yawmy-logo.svg" alt="Yawmy" className="h-10 w-auto mb-4" />
          <p className="text-[11px] font-semibold text-[#b0b0b0] tracking-[0.2em] uppercase">Reset Password</p>
        </div>

        {/* ── Step 1: Email ── */}
        {step === "email" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h1 className="text-[28px] font-black text-[#111] tracking-tight">Reset password</h1>
              <p className="text-[14px] text-[#999] mt-2">Enter your email and we'll send a 6-digit code.</p>
            </div>

            {error && <p className="text-[13px] text-[#e04f00] font-semibold">{error}</p>}

            <div className="flex items-center border-b-2 border-[#e5e7eb] focus-within:border-[#111] transition-colors">
              <Mail className="w-4 h-4 text-[#bbb] flex-shrink-0 me-3" />
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && email && handleSendOtp()}
                className="flex-1 bg-transparent py-4 text-[15px] font-semibold text-[#111] placeholder:text-[#ccc] outline-none"
                autoFocus
                dir="ltr"
              />
            </div>

            <button
              onClick={handleSendOtp}
              disabled={loading || !email.trim()}
              className="w-full bg-[#111] text-white font-semibold py-4 rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-30"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Send code <ArrowRight className="w-4 h-4" /></>}
            </button>

            <p className="text-center text-[13px] text-[#999]">
              Remember your password?{" "}
              <a href="/login" className="text-[#ff5a00] font-bold hover:underline">Sign in</a>
            </p>
          </div>
        )}

        {/* ── Step 2: OTP ── */}
        {step === "otp" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <button onClick={() => { setStep("email"); setOtpDigits(["","","","","",""]); setError(""); }} className="text-[#999] hover:text-[#111] mb-4 flex items-center gap-1 text-sm font-medium">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <h1 className="text-[28px] font-black text-[#111] tracking-tight">Check your email</h1>
              <p className="text-[14px] text-[#999] mt-2">
                We sent a 6-digit code to <span className="text-[#111] font-bold">{email}</span>
              </p>
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

            <button
              onClick={handleVerifyOtp}
              disabled={loading || otpCode.length < 6}
              className="w-full bg-[#111] text-white font-semibold py-4 rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-30"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
            </button>

            <div className="text-center">
              {resendCountdown > 0 ? (
                <p className="text-[13px] text-[#bbb]">Resend in {resendCountdown}s</p>
              ) : (
                <button onClick={handleSendOtp} disabled={loading} className="text-[13px] text-[#999] font-medium hover:text-[#111] transition-colors">
                  Resend code
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: New Password ── */}
        {step === "new_password" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h1 className="text-[28px] font-black text-[#111] tracking-tight">New password</h1>
              <p className="text-[14px] text-[#999] mt-2">Choose a strong password of at least 8 characters.</p>
            </div>

            {error && <p className="text-[13px] text-[#e04f00] font-semibold">{error}</p>}

            <div className="space-y-4">
              <div className="flex items-center border-b-2 border-[#e5e7eb] focus-within:border-[#111] transition-colors">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="New password"
                  value={newPass}
                  onChange={(e) => { setNewPass(e.target.value); setError(""); }}
                  className="flex-1 bg-transparent py-4 text-[15px] font-semibold text-[#111] placeholder:text-[#ccc] outline-none"
                  autoFocus
                />
                <button onClick={() => setShowPass((v) => !v)} className="text-[#bbb] p-2">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center border-b-2 border-[#e5e7eb] focus-within:border-[#111] transition-colors">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmPass}
                  onChange={(e) => { setConfirmPass(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                  className="flex-1 bg-transparent py-4 text-[15px] font-semibold text-[#111] placeholder:text-[#ccc] outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleResetPassword}
              disabled={loading || !newPass || !confirmPass}
              className="w-full bg-[#ff5a00] text-white font-semibold py-4 rounded-2xl hover:bg-[#e04e00] transition-all flex items-center justify-center gap-2 disabled:opacity-30"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Set new password <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        )}

        {/* ── Done ── */}
        {step === "done" && (
          <div className="text-center space-y-6 animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-[#e6f6ec] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-[#1e8e3e]" />
            </div>
            <div>
              <h1 className="text-[28px] font-black text-[#111]">Password updated!</h1>
              <p className="text-[14px] text-[#999] mt-2">You can now sign in with your new password.</p>
            </div>
            <a
              href="/login"
              className="block w-full bg-[#111] text-white font-semibold py-4 rounded-2xl hover:bg-black transition-all text-center"
            >
              Go to sign in
            </a>
          </div>
        )}

        <div className="mt-16 text-center">
          <p className="text-[11px] text-[#ddd] font-medium">Yawmy &middot; 2026</p>
        </div>
      </div>
    </div>
  );
}
