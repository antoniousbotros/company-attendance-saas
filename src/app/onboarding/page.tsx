"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Trash2,
  Check,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const T = {
  en: {
    steps: ["Company", "Team", "Connect"],
    step1Title: "Name your workspace",
    step1Sub: "You can always change this later from settings.",
    namePlaceholder: "e.g. Acme Corp",
    next: "Continue",
    step2Title: "Add your team",
    step2Sub: "Add employees to track attendance. You can add more later.",
    namePh: "Full name",
    phonePh: "Phone number",
    addRow: "Add employee",
    skip: "Skip for now",
    save: "Save & Continue",
    saving: "Saving…",
    step3Title: "Connect your Telegram bot",
    step3Sub: "Your team will use this bot to log attendance and receive updates.",
    botInstr1: "Open @BotFather on Telegram",
    botFatherLink: "https://t.me/BotFather",
    botInstr2: "Send /newbot and follow the prompts",
    botInstr3: "Copy the API token and paste it below",
    tokenPh: "110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw",
    connecting: "Connecting…",
    connect: "Connect Bot",
    connectedTitle: "Bot connected!",
    connectedSub: "Your team can now use the bot to check in and receive announcements.",
    scanLabel: "Share this link with your team",
    openBot: "Open Bot",
    toDashboard: "Go to Dashboard",
    footer: "Quick setup · Takes less than 2 minutes",
  },
  ar: {
    steps: ["الشركة", "الفريق", "الربط"],
    step1Title: "سمّ مساحة عملك",
    step1Sub: "يمكنك تغيير هذا لاحقاً من الإعدادات.",
    namePlaceholder: "مثلاً: شركة ABC",
    next: "متابعة",
    step2Title: "أضف فريقك",
    step2Sub: "أضف الموظفين لتتبع الحضور. يمكنك إضافة المزيد لاحقاً.",
    namePh: "الاسم الكامل",
    phonePh: "رقم الهاتف",
    addRow: "إضافة موظف",
    skip: "تخطى الآن",
    save: "حفظ والمتابعة",
    saving: "جارٍ الحفظ…",
    step3Title: "اربط بوت تيليجرام",
    step3Sub: "سيستخدم فريقك هذا البوت لتسجيل الحضور والانصراف.",
    botInstr1: "افتح @BotFather على تيليجرام",
    botInstr2: "أرسل /newbot واتبع التعليمات",
    botInstr3: "انسخ رمز API والصقه أدناه",
    tokenPh: "110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw",
    connecting: "جارٍ الربط…",
    connect: "ربط البوت",
    connectedTitle: "تم ربط البوت!",
    connectedSub: "يمكن لفريقك الآن استخدام البوت لتسجيل الحضور وتلقي الإعلانات.",
    scanLabel: "شارك هذا الرابط مع فريقك",
    openBot: "فتح البوت",
    toDashboard: "الذهاب للوحة التحكم",
    footer: "إعداد سريع · أقل من دقيقتين",
  },
};

type Lang = "en" | "ar";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState("");
  const [employees, setEmployees] = useState([{ name: "", phone: "" }]);
  const [loading, setLoading] = useState(false);
  const [telegramToken, setTelegramToken] = useState("");
  const [botUsername, setBotUsername] = useState("");
  const [error, setError] = useState("");
  const [lang, setLang] = useState<Lang>("ar");
  const router = useRouter();

  const isRTL = lang === "ar";
  const t = T[lang];
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const browserLang = navigator.language?.startsWith("ar") ? "ar" : "en";
    setLang(browserLang);
    document.documentElement.setAttribute("dir", browserLang === "ar" ? "rtl" : "ltr");
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
  }, [isRTL]);

  useEffect(() => {
    supabase.from("companies").select("*").single().then(({ data }) => {
      if (data) {
        setCompanyName(data.name || "");
        if (data.onboarding_step) setStep(data.onboarding_step);
      }
    });
  }, []);

  const advanceStep = async (newStep: number) => {
    setStep(newStep);
    await supabase.from("companies").update({ onboarding_step: newStep }).match({ name: companyName });
  };

  const handleStep1 = async () => {
    if (!companyName.trim()) return;
    await supabase.from("companies").update({ name: companyName.trim() }).match({ name: companyName });
    advanceStep(2);
  };

  const handleStep2Save = async () => {
    setLoading(true);
    const { data: company } = await supabase.from("companies").select("id").single();
    if (company) {
      const valid = employees.filter((e) => e.name && e.phone).map((e) => ({
        ...e,
        company_id: company.id,
        phone: e.phone.replace("+", ""),
      }));
      if (valid.length > 0) await supabase.from("employees").insert(valid);
    }
    setLoading(false);
    advanceStep(3);
  };

  const handleConnectBot = async () => {
    if (!telegramToken.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`https://api.telegram.org/bot${telegramToken.trim()}/getMe`);
      const data = await res.json();
      if (!data.ok) {
        setError(lang === "ar" ? "رمز البوت غير صحيح. يرجى التحقق والمحاولة مرة أخرى." : "Invalid bot token. Please check and try again.");
        setLoading(false);
        return;
      }
      const botName = data.result.username;
      const hookRes = await fetch("/api/telegram/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: telegramToken.trim() }),
      });
      const hookData = await hookRes.json();
      if (!hookData.ok) {
        setError(lang === "ar" ? "فشل ربط البوت. تأكد من صحة الرمز." : "Failed to register webhook. Check your token.");
        setLoading(false);
        return;
      }
      const { data: company } = await supabase.from("companies").select("id").single();
      if (company) {
        await supabase.from("companies").update({ telegram_token: telegramToken.trim(), bot_name: botName }).eq("id", company.id);
      }
      setBotUsername(botName);
    } catch {
      setError(lang === "ar" ? "خطأ في الاتصال. حاول مرة أخرى." : "Connection error. Please try again.");
    }
    setLoading(false);
  };

  const handleFinish = async () => {
    await supabase.from("companies").update({ onboarding_step: 4 }).match({ name: companyName });
    router.push("/overview");
  };

  const stepIcons = [Building2, Users, MessageCircle];
  const stepColors = ["#ff5a00", "#1e8e3e", "#0284c7"];

  return (
    <div className={cn("min-h-screen bg-[#fafafa] flex flex-col", isRTL && "font-sans")}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0] bg-white">
        <div className="flex items-center">
          <img src="/logos/yawmy-logo.svg" alt="Yawmy" className="h-8 w-auto" />
        </div>
        <button
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          className="text-xs font-bold text-[#6b7280] hover:text-[#111] px-3 py-1.5 rounded-lg hover:bg-[#f5f5f5] transition-all"
        >
          {lang === "ar" ? "English" : "عربي"}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">

          {/* Stepper */}
          <div className="flex items-center mb-10">
            {[1, 2, 3].map((s, i) => {
              const done = step > s;
              const active = step === s;
              return (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300",
                      done ? "bg-[#111] text-white" : active ? "bg-[#ff5a00] text-white" : "bg-[#f0f0f0] text-[#9ca3af]"
                    )}>
                      {done ? <Check className="w-4 h-4" /> : s}
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wide whitespace-nowrap",
                      active ? "text-[#111]" : done ? "text-[#6b7280]" : "text-[#9ca3af]"
                    )}>
                      {t.steps[i]}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className="flex-1 mx-3 mb-5">
                      <div className="h-px bg-[#e5e7eb] relative">
                        <div
                          className="absolute inset-y-0 start-0 bg-[#111] transition-all duration-500"
                          style={{ width: step > s ? "100%" : "0%" }}
                        />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8">

            {/* Step 1: Company name */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-3 duration-400">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${stepColors[0]}15` }}
                >
                  <Building2 className="w-6 h-6" style={{ color: stepColors[0] }} />
                </div>
                <h1 className="text-2xl font-black text-[#111] mb-1">{t.step1Title}</h1>
                <p className="text-sm text-[#9ca3af] mb-6">{t.step1Sub}</p>

                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStep1()}
                  className="w-full border border-[#e5e7eb] rounded-xl px-4 py-3 text-[15px] font-semibold text-[#111] outline-none focus:border-[#ff5a00] focus:ring-2 focus:ring-[#ff5a00]/10 transition-all mb-6 bg-white"
                  placeholder={t.namePlaceholder}
                  autoFocus
                />

                <button
                  onClick={handleStep1}
                  disabled={!companyName.trim()}
                  className="w-full bg-[#ff5a00] text-white font-black py-3.5 rounded-xl hover:bg-[#e04e00] transition-all flex items-center justify-center gap-2 disabled:opacity-40 text-sm"
                >
                  {t.next} <Arrow className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 2: Team */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-3 duration-400">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${stepColors[1]}15` }}
                >
                  <Users className="w-6 h-6" style={{ color: stepColors[1] }} />
                </div>
                <h1 className="text-2xl font-black text-[#111] mb-1">{t.step2Title}</h1>
                <p className="text-sm text-[#9ca3af] mb-6">{t.step2Sub}</p>

                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {employees.map((emp, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        placeholder={t.namePh}
                        className="flex-1 border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-sm font-medium text-[#111] outline-none focus:border-[#ff5a00] focus:ring-2 focus:ring-[#ff5a00]/10 transition-all bg-white"
                        value={emp.name}
                        onChange={(e) => {
                          const updated = [...employees];
                          updated[i].name = e.target.value;
                          setEmployees(updated);
                        }}
                      />
                      <input
                        placeholder={t.phonePh}
                        className="flex-[1.2] border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-sm font-medium text-[#111] outline-none focus:border-[#ff5a00] focus:ring-2 focus:ring-[#ff5a00]/10 transition-all bg-white"
                        value={emp.phone}
                        onChange={(e) => {
                          const updated = [...employees];
                          updated[i].phone = e.target.value;
                          setEmployees(updated);
                        }}
                      />
                      {employees.length > 1 && (
                        <button
                          onClick={() => setEmployees(employees.filter((_, idx) => idx !== i))}
                          className="w-9 h-9 rounded-xl border border-[#e5e7eb] flex items-center justify-center text-[#9ca3af] hover:text-[#b91c1c] hover:border-[#fecaca] transition-all flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setEmployees([...employees, { name: "", phone: "" }])}
                  className="w-full py-2.5 border border-dashed border-[#e5e7eb] rounded-xl text-sm font-bold text-[#9ca3af] hover:border-[#ff5a00]/40 hover:text-[#ff5a00] transition-all flex items-center justify-center gap-2 mb-6"
                >
                  <Plus className="w-4 h-4" /> {t.addRow}
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => advanceStep(3)}
                    className="flex-1 border border-[#e5e7eb] text-[#6b7280] font-bold py-3 rounded-xl hover:bg-[#f9f9f9] transition-all text-sm"
                  >
                    {t.skip}
                  </button>
                  <button
                    onClick={handleStep2Save}
                    disabled={loading}
                    className="flex-[2] bg-[#ff5a00] text-white font-black py-3 rounded-xl hover:bg-[#e04e00] transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                  >
                    {loading ? t.saving : <>{t.save} <Arrow className="w-4 h-4" /></>}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Telegram */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-3 duration-400">
                {!botUsername ? (
                  <>
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                      style={{ backgroundColor: `${stepColors[2]}15` }}
                    >
                      <MessageCircle className="w-6 h-6" style={{ color: stepColors[2] }} />
                    </div>
                    <h1 className="text-2xl font-black text-[#111] mb-1">{t.step3Title}</h1>
                    <p className="text-sm text-[#9ca3af] mb-6">{t.step3Sub}</p>

                    {/* Instructions */}
                    <div className="bg-[#f9fafb] rounded-xl border border-[#e5e7eb] p-4 mb-4 space-y-3">
                      {[t.botInstr1, t.botInstr2, t.botInstr3].map((instr, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full bg-[#0284c7]/10 text-[#0284c7] flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-sm text-[#374151]">{instr}</p>
                        </div>
                      ))}
                    </div>

                    {/* BotFather CTA button */}
                    <a
                      href="https://t.me/BotFather"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between w-full bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl px-4 py-3.5 mb-5 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        {/* Telegram logo */}
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                            <path d="M11.944 0A12 12 0 1 0 12 24a12 12 0 0 0-.056-24Zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                          </svg>
                        </div>
                        <div className="text-start">
                          <p className="font-black text-sm leading-tight">@BotFather</p>
                          <p className="text-[11px] text-white/70 font-medium">{lang === 'ar' ? 'اضغط لفتح على تيليجرام' : 'Tap to open on Telegram'}</p>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-white/70 group-hover:text-white transition-all" />
                    </a>

                    <input
                      type="text"
                      value={telegramToken}
                      onChange={(e) => { setTelegramToken(e.target.value); setError(""); }}
                      className="w-full border border-[#e5e7eb] rounded-xl px-4 py-3 text-sm font-mono text-[#111] outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/10 transition-all mb-2 bg-white"
                      placeholder={t.tokenPh}
                      dir="ltr"
                    />

                    {error && (
                      <p className="text-xs text-[#b91c1c] font-semibold mb-4">{error}</p>
                    )}

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={handleFinish}
                        className="flex-1 border border-[#e5e7eb] text-[#6b7280] font-bold py-3 rounded-xl hover:bg-[#f9f9f9] transition-all text-sm"
                      >
                        {t.skip}
                      </button>
                      <button
                        onClick={handleConnectBot}
                        disabled={loading || !telegramToken.trim()}
                        className="flex-[2] bg-[#0284c7] text-white font-black py-3 rounded-xl hover:bg-[#0369a1] transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                      >
                        {loading ? t.connecting : <>{t.connect} <Arrow className="w-4 h-4" /></>}
                      </button>
                    </div>
                  </>
                ) : (
                  /* Connected state */
                  <div className="text-center">
                    <div className="w-14 h-14 bg-[#e6f6ec] rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-7 h-7 text-[#1e8e3e]" />
                    </div>
                    <h2 className="text-xl font-black text-[#111] mb-2">{t.connectedTitle}</h2>
                    <p className="text-sm text-[#9ca3af] mb-6">{t.connectedSub}</p>

                    <div className="bg-[#f9fafb] rounded-xl border border-[#e5e7eb] p-4 mb-6 inline-block w-full">
                      <p className="text-xs font-bold text-[#9ca3af] mb-3">{t.scanLabel}</p>
                      <div className="flex items-center justify-center gap-3">
                        <div className="bg-white p-2 rounded-xl border border-[#e5e7eb]">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://t.me/${botUsername}`}
                            alt="Bot QR"
                            className="w-24 h-24"
                          />
                        </div>
                        <a
                          href={`https://t.me/${botUsername}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-bold text-[#0284c7] hover:underline"
                          dir="ltr"
                        >
                          t.me/{botUsername}
                        </a>
                      </div>
                    </div>

                    <button
                      onClick={handleFinish}
                      className="w-full bg-[#ff5a00] text-white font-black py-3.5 rounded-xl hover:bg-[#e04e00] transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      {t.toDashboard} <Arrow className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-center text-xs text-[#9ca3af] font-medium mt-6">{t.footer}</p>
        </div>
      </div>
    </div>
  );
}
