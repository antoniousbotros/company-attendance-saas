"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Bot,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Clock,
  Timer,
  MapPin,
  Banknote,
  CalendarDays,
  Link as LinkIcon,
  Upload,
  Trash2,
  Smartphone,
  MessageCircle,
  TriangleAlert,
  KeyRound,
  Eye,
  EyeOff,
  AtSign,
  Camera,
  Shield,
  Home,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";
import { cn, compressImageFile } from "@/lib/utils";
import {
  PageHeader,
  SectionCard,
  PrimaryButton,
  StatusPill,
} from "@/app/components/talabat-ui";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">
        {label}
      </label>
      {children}
      {hint && <p className="mt-2 text-xs text-[#9ca3af]">{hint}</p>}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-10 h-10 rounded-lg bg-[#fff1e8] text-[#ff5a00] flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h2 className="text-base font-bold text-[#111]">{title}</h2>
        <p className="text-xs text-[#6b7280] mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mapsLink, setMapsLink] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    telegram_token: "",
    bot_name: "",
    bot_language: "en",
    work_start_time: "09:00",
    work_end_time: "17:00",
    late_threshold: 15,
    office_lat: "",
    office_lng: "",
    office_radius: 200,
    enable_geofencing: false,
    working_days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
    late_penalty_per_minute: 1.0,
    absence_penalty_per_day: 1.0,
    overtime_enabled: false,
    enable_wfh: false,
    wfh_fixed_hours: 8.0,
    wfh_ignore_late: false,
    currency: "EGP",
    half_day_enabled: false,
    half_day_hours: 4.0,
    sales_tracking_enabled: false,
    auth_mode: "telegram" as "telegram" | "password",
  });
  const [savedAuthMode, setSavedAuthMode] = useState<"telegram" | "password">("telegram");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "";
    text: string;
  }>({ type: "", text: "" });
  const [currentEmail, setCurrentEmail] = useState("");

  // Holiday States
  type Holiday = { id: string; date: string; note: string; company_id: string; type: string };
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayNote, setHolidayNote] = useState("");
  const [holidayLoading, setHolidayLoading] = useState(false);

  // Security modals
  type SecModalStep = "idle" | "send" | "otp" | "fields" | "done";
  const [passModal, setPassModal] = useState<SecModalStep>("idle");
  const [emailModal, setEmailModal] = useState<SecModalStep>("idle");
  const [secLoading, setSecLoading] = useState(false);
  const [secError, setSecError] = useState("");
  const [secOtp, setSecOtp] = useState("");
  const [secNewPass, setSecNewPass] = useState("");
  const [secConfirmPass, setSecConfirmPass] = useState("");
  const [secShowPass, setSecShowPass] = useState(false);
  const [secNewEmail, setSecNewEmail] = useState("");
  const [secResend, setSecResend] = useState(0);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_id", user.id)
        .single();
      if (data) {
        setLogoUrl(data.logo_url || null);
        setCurrentEmail(user.email || "");
        setFormData({
          name: data.name || "",
          telegram_token: data.telegram_token || "",
          bot_name: data.bot_name || "",
          bot_language: data.bot_language || "en",
          work_start_time: data.work_start_time || "09:00",
          work_end_time: data.work_end_time || "17:00",
          late_threshold: data.late_threshold || 15,
          office_lat: data.office_lat ? String(data.office_lat) : "",
          office_lng: data.office_lng ? String(data.office_lng) : "",
          office_radius: data.office_radius || 200,
          enable_geofencing: !!data.enable_geofencing,
          working_days: data.working_days || ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
          late_penalty_per_minute: data.late_penalty_per_minute || 1.0,
          absence_penalty_per_day: data.absence_penalty_per_day || 1.0,
          overtime_enabled: !!data.overtime_enabled,
          enable_wfh: !!data.enable_wfh,
          wfh_fixed_hours: data.wfh_fixed_hours || 8.0,
          wfh_ignore_late: !!data.wfh_ignore_late,
          currency: data.currency || "EGP",
          half_day_enabled: !!data.half_day_enabled,
          half_day_hours: data.half_day_hours || 4.0,
          sales_tracking_enabled: !!data.sales_tracking_enabled,
          auth_mode: (data.auth_mode || "telegram") as "telegram" | "password",
        });
        setSavedAuthMode((data.auth_mode || "telegram") as "telegram" | "password");
      }
      
      const sessionData = await supabase.auth.getSession();
      if (sessionData.data.session) {
         try {
            const hRes = await fetch("/api/companies/holidays", {
               headers: { Authorization: `Bearer ${sessionData.data.session.access_token}` }
            });
            const hData = await hRes.json();
            if (hData.ok) setHolidays(hData.holidays);
         } catch(e) {}
      }

      setLoading(false);
    };
    load();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      file = await compressImageFile(file, 800, 0.9); // Logos can be smaller dimensions
      const fd = new FormData();
      fd.append("logo", file);
      const res = await fetch("/api/companies/upload-logo", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok) {
        setLogoUrl(data.logo_url);
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "Upload failed" });
    }
    setLogoUploading(false);
  };

  const handleLogoRemove = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("companies").update({ logo_url: null }).eq("owner_id", user.id);
    setLogoUrl(null);
  };

  const handleAddHoliday = async () => {
     if (!holidayDate) return;
     setHolidayLoading(true);
     const sessionData = await supabase.auth.getSession();
     if (sessionData.data.session) {
        await fetch("/api/companies/holidays", {
           method: "POST",
           headers: { 
             "Content-Type": "application/json",
             Authorization: `Bearer ${sessionData.data.session.access_token}` 
           },
           body: JSON.stringify({ date: holidayDate, note: holidayNote })
        });
        
        const hRes = await fetch("/api/companies/holidays", {
           headers: { Authorization: `Bearer ${sessionData.data.session.access_token}` }
        });
        const hData = await hRes.json();
        if (hData.ok) setHolidays(hData.holidays);
     }
     setHolidayDate("");
     setHolidayNote("");
     setHolidayLoading(false);
  };

  const handleDeleteHoliday = async (id: string) => {
     const sessionData = await supabase.auth.getSession();
     if (sessionData.data.session) {
        await fetch(`/api/companies/holidays?id=${id}`, {
           method: "DELETE",
           headers: { Authorization: `Bearer ${sessionData.data.session.access_token}` }
        });
        setHolidays(holidays.filter(h => h.id !== id));
     }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("companies")
      .update({
        name: formData.name,
        telegram_token: formData.telegram_token,
        bot_name: formData.bot_name,
        bot_language: formData.bot_language,
        work_start_time: formData.work_start_time,
        work_end_time: formData.work_end_time,
        late_threshold: formData.late_threshold,
        office_lat: formData.office_lat ? parseFloat(formData.office_lat) : null,
        office_lng: formData.office_lng ? parseFloat(formData.office_lng) : null,
        office_radius: formData.office_radius,
        enable_geofencing: formData.enable_geofencing,
        working_days: formData.working_days,
        late_penalty_per_minute: formData.late_penalty_per_minute,
        absence_penalty_per_day: formData.absence_penalty_per_day,
        overtime_enabled: formData.overtime_enabled,
        enable_wfh: formData.enable_wfh,
        wfh_fixed_hours: formData.wfh_fixed_hours,
        wfh_ignore_late: formData.wfh_ignore_late,
        currency: formData.currency,
        half_day_enabled: formData.half_day_enabled,
        half_day_hours: formData.half_day_hours,
        sales_tracking_enabled: formData.sales_tracking_enabled,
        auth_mode: formData.auth_mode,
      })
      .eq("owner_id", user?.id);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      // Auto-register the Webhook with Telegram if they provided a token
      if (formData.telegram_token) {
        try {
          await fetch("/api/telegram/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: formData.telegram_token }),
          });
        } catch (err) {
          console.error("Failed to auto-register webhook", err);
        }
      }

      setMessage({
        type: "success",
        text: isRTL ? "تم حفظ الإعدادات بنجاح! البوت جاهز للعمل." : "Settings saved! Bot is ready.",
      });
    }
    setSaving(false);
  };

  const handleExtractMapLink = async () => {
    if (!mapsLink) return;
    setExtracting(true);
    setMessage({ type: "", text: "" });

    try {
      // First try local regex (if they pasted a long link already)
      const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
      const match = mapsLink.match(regex);
      
      if (match) {
        setFormData(prev => ({
          ...prev, 
          office_lat: match[1], 
          office_lng: match[2] 
        }));
        setMapsLink("");
        setExtracting(false);
        return;
      }

      // If no local match, it might be a shortened goo.gl link. Fallback to API crawler
      const res = await fetch("/api/tools/expand-maps-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: mapsLink })
      });
      const result = await res.json();
      
      if (result.ok) {
        setFormData(prev => ({
          ...prev,
          office_lat: String(result.lat),
          office_lng: String(result.lng)
        }));
        setMapsLink("");
      } else {
         setMessage({ type: "error", text: isRTL ? "لم نتمكن من استخراج الإحداثيات من هذا الرابط" : "Could not extract coordinates from this link." });
      }
    } catch (err) {
       setMessage({ type: "error", text: isRTL ? "حدث خطأ أثناء فحص الرابط" : "An error occurred while expanding the map link." });
    }
    setExtracting(false);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#ff5a00] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl">
      <PageHeader
        title={isRTL ? "الإعدادات" : "Settings"}
        subtitle={
          isRTL
            ? "إدارة هوية شركتك، إعدادات البوت، وسياسات الحضور"
            : "Manage your company identity, bot settings, and attendance policies"
        }
      />

      {message.text && (
        <div
          className={cn(
            "p-4 rounded-xl flex items-center gap-3 mb-8 animate-in zoom-in duration-300",
            message.type === "success"
              ? "bg-[#f0fdf4] text-[#166534] border border-[#dcfce7]"
              : "bg-[#fef2f2] text-[#991b1b] border border-[#fee2e2]"
          )}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-semibold text-sm">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8 pb-20">
        {/* Company Identity */}
        <SectionCard>
          <SectionHeader
            icon={Building2}
            title={isRTL ? "هوية الشركة" : "Company Identity"}
            subtitle={isRTL ? "المعلومات الأساسية للنشاط" : "Basic business information"}
          />
          {/* Logo Upload */}
          <div className="mb-8">
            <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-3">
              {isRTL ? "شعار الشركة" : "Company Logo"}
            </label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-[#e5e7eb]" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-[#f9fafb] border border-dashed border-[#e5e7eb] flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-[#9ca3af]" />
                </div>
              )}
              <div className="flex gap-2">
                <label className="cursor-pointer bg-[#fff1e8] text-[#ff5a00] font-bold text-xs px-4 py-2 rounded-lg hover:bg-[#ffe4d1] transition-all flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  {logoUploading ? (isRTL ? "جاري الرفع..." : "Uploading...") : (isRTL ? "رفع شعار" : "Upload")}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={logoUploading} />
                </label>
                {logoUrl && (
                  <button type="button" onClick={handleLogoRemove} className="text-[#9ca3af] hover:text-[#b91c1c] p-2 rounded-lg hover:bg-[#fef2f2] transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Field label={isRTL ? "اسم الشركة" : "Company Name"}>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-white border border-[#e5e7eb] rounded-lg py-3 px-4 text-sm font-semibold outline-none focus:border-[#ff5a00] transition-colors"
                placeholder="e.g. Acme Corp"
              />
            </Field>
            <Field label={isRTL ? "العملة المحلية" : "Currency"}>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full bg-white border border-[#e5e7eb] rounded-lg py-3 px-4 text-sm font-semibold outline-none focus:border-[#ff5a00] transition-colors"
              >
                <option value="EGP">EGP (جنيه مصري)</option>
                <option value="SAR">SAR (ريال سعودي)</option>
                <option value="AED">AED (درهم إماراتي)</option>
                <option value="USD">USD (دولار أمريكي)</option>
              </select>
            </Field>
          </div>
        </SectionCard>

        {/* Attendance Policy */}
        <SectionCard>
          <SectionHeader
            icon={Clock}
            title={isRTL ? "سياسة الحضور" : "Attendance Policy"}
            subtitle={isRTL ? "حدد مواعيد العمل وقواعد التأخير" : "Define work hours and late rules"}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Field label={isRTL ? "بداية العمل" : "Work Start"}>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                <input
                  type="time"
                  value={formData.work_start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, work_start_time: e.target.value })
                  }
                  className="w-full bg-white border border-[#e5e7eb] rounded-lg py-3 pl-10 pr-4 text-sm font-semibold outline-none focus:border-[#ff5a00] transition-colors"
                />
              </div>
            </Field>
            <Field label={isRTL ? "نهاية العمل" : "Work End"}>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                <input
                  type="time"
                  value={formData.work_end_time}
                  onChange={(e) =>
                    setFormData({ ...formData, work_end_time: e.target.value })
                  }
                  className="w-full bg-white border border-[#e5e7eb] rounded-lg py-3 pl-10 pr-4 text-sm font-semibold outline-none focus:border-[#ff5a00] transition-colors"
                />
              </div>
            </Field>
            <Field label={isRTL ? "مهلة التأخير (دقائق)" : "Late Threshold (Min)"}>
              <div className="relative">
                <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                <input
                  type="number"
                  value={formData.late_threshold}
                  onChange={(e) =>
                    setFormData({ ...formData, late_threshold: parseInt(e.target.value) })
                  }
                  className="w-full bg-white border border-[#e5e7eb] rounded-lg py-3 pl-10 pr-4 text-sm font-semibold outline-none focus:border-[#ff5a00] transition-colors"
                />
              </div>
            </Field>
          </div>
        </SectionCard>

        {/* Payroll Policy */}
        <SectionCard>
          <div className="flex items-start justify-between mb-6">
            <SectionHeader
              icon={Banknote}
              title={isRTL ? "سياسة الرواتب (الخصومات والإضافي)" : "Payroll Policy (Penalties & Overtime)"}
              subtitle={isRTL ? "حدد قواعد الخصومات واحتساب الوقت الإضافي" : "Define penalty rules and overtime logic"}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <Field label={isRTL ? "خصم التأخير (قيمة الدقيقة)" : "Late Penalty (Cost per Min)"} hint={isRTL ? "أدخل قيمة الخصم لكل دقيقة تأخير (مثلا 1.0 = خصم دقيقة واحدة)" : "Penalty multiplier per minute"}>
              <input
                type="number"
                step="0.1"
                value={formData.late_penalty_per_minute}
                onChange={(e) => setFormData({ ...formData, late_penalty_per_minute: parseFloat(e.target.value) })}
                className="w-full bg-white border border-[#e5e7eb] rounded-lg py-3 px-4 text-sm font-semibold outline-none focus:border-[#ff5a00] transition-colors"
                placeholder="1.0"
              />
            </Field>
            <Field label={isRTL ? "خصم الغياب (قيمة اليوم)" : "Absence Penalty (Cost per Day)"} hint={isRTL ? "كم يوما يخصم لليوم الواحد غياب؟" : "Multiplier of daily salary per absence"}>
              <input
                type="number"
                step="0.1"
                value={formData.absence_penalty_per_day}
                onChange={(e) => setFormData({ ...formData, absence_penalty_per_day: parseFloat(e.target.value) })}
                className="w-full bg-white border border-[#e5e7eb] rounded-lg py-3 px-4 text-sm font-semibold outline-none focus:border-[#ff5a00] transition-colors"
                placeholder="1.0"
              />
            </Field>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#f9fafb] rounded-xl border border-[#e5e7eb] mb-6">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-[#ff5a00]" />
              <div>
                <p className="text-sm font-bold text-[#111]">{isRTL ? "السماح بالوقت الإضافي" : "Enable Overtime"}</p>
                <p className="text-xs text-[#6b7280]">{isRTL ? "احتساب أجر إضافي للموظف إذا تجاوز ساعات عمله" : "Calculate compensation for extra hours worked"}</p>
              </div>
            </div>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={formData.overtime_enabled}
                  onChange={(e) => setFormData({ ...formData, overtime_enabled: e.target.checked })}
                />
                <div className={cn("block w-14 h-8 rounded-full transition-colors", formData.overtime_enabled ? "bg-[#1e8e3e]" : "bg-[#e5e7eb]")}></div>
                <div className={cn("dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform", formData.overtime_enabled && "transform translate-x-6")}></div>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#f9fafb] rounded-xl border border-[#e5e7eb] mb-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#ff5a00]" />
              <div>
                <p className="text-sm font-bold text-[#111]">{isRTL ? "نظام نصف اليوم (Half-Day)" : "Enable Half-Days"}</p>
                <p className="text-xs text-[#6b7280]">{isRTL ? "إذا عمل الموظف أقل من ساعات محددة يُحسب نصف غياب (0.5 يوماً)" : "Deduct 0.5 absences if employee works under a threshold of hours"}</p>
              </div>
            </div>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={formData.half_day_enabled}
                  onChange={(e) => setFormData({ ...formData, half_day_enabled: e.target.checked })}
                />
                <div className={cn("block w-14 h-8 rounded-full transition-colors", formData.half_day_enabled ? "bg-[#1e8e3e]" : "bg-[#e5e7eb]")}></div>
                <div className={cn("dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform", formData.half_day_enabled && "transform translate-x-6")}></div>
              </div>
            </label>
          </div>

          {formData.half_day_enabled && (
             <div className="p-4 bg-white border border-[#eeeeee] rounded-xl w-full md:w-1/2">
                <Field label={isRTL ? "الحد الأدنى لساعات نصف اليوم" : "Half-Day Maximum Limit (Hours)"} hint={isRTL ? "مثال: إذا كان 4.0 وعمل الموظف 3.5 ساعات، يحسب عليه 0.5 غياب" : "If employee works less than this, they get 0.5 days absent deducted"}>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.half_day_hours}
                    onChange={(e) => setFormData({ ...formData, half_day_hours: parseFloat(e.target.value) })}
                    className="w-full bg-white border border-[#e5e7eb] rounded-lg py-3 px-4 text-sm font-semibold outline-none focus:border-[#ff5a00] transition-colors"
                  />
                </Field>
             </div>
          )}
        </SectionCard>

        {/* Special Holidays */}
        <SectionCard>
          <div className="flex items-start justify-between mb-6">
            <SectionHeader
              icon={CalendarDays}
              title={isRTL ? "أيام الإجازات الخاصة" : "Special Holidays (Public & National)"}
              subtitle={isRTL ? "استثناء بعض التواريخ من سياسة الغياب لتكون إجازة رسمية مدفوعة." : "Exclude specific calendar dates from absence penalties."}
            />
          </div>
          <div className="bg-[#f9fafb] p-6 rounded-2xl border border-[#eeeeee] flex flex-col gap-5">
             <div className="flex flex-col md:flex-row gap-3">
               <div className="flex-1">
                 <input
                   type="date"
                   value={holidayDate}
                   onChange={(e) => setHolidayDate(e.target.value)}
                   className="w-full bg-white border border-[#e5e7eb] rounded-lg py-3 px-4 text-sm font-semibold outline-none focus:border-[#ff5a00] transition-colors"
                 />
               </div>
               <div className="flex-1">
                 <input
                   type="text"
                   placeholder={isRTL ? "المناسبة (مثال: عيد الفطر)" : "Occasion (e.g. National Day)"}
                   value={holidayNote}
                   onChange={(e) => setHolidayNote(e.target.value)}
                   className="w-full bg-white border border-[#e5e7eb] rounded-lg py-3 px-4 text-sm font-semibold outline-none focus:border-[#ff5a00] transition-colors"
                 />
               </div>
               <button
                 type="button"
                 onClick={handleAddHoliday}
                 disabled={!holidayDate || holidayLoading}
                 className="bg-[#111] text-white px-6 py-3 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-black transition-colors min-w-[120px] flex items-center justify-center"
               >
                 {holidayLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isRTL ? "إضافة إجازة" : "Add Holiday")}
               </button>
             </div>

             {holidays.length > 0 && (
                <div className="mt-4 flex flex-col gap-2">
                   {holidays.map(h => (
                      <div key={h.id} className="flex items-center justify-between bg-white px-4 py-3 border border-[#eeeeee] rounded-xl">
                         <div className="flex items-center gap-3">
                            <CalendarDays className="w-4 h-4 text-[#ff5a00]" />
                            <span className="text-sm font-bold text-[#111]">{h.date}</span>
                            <span className="text-xs font-semibold text-[#6b7280 bg-[#f9fafb] px-2 py-0.5 rounded uppercase">{h.note || "Holiday"}</span>
                         </div>
                         <button
                           type="button"
                           onClick={() => handleDeleteHoliday(h.id)}
                           className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                   ))}
                </div>
             )}
          </div>
        </SectionCard>

        {/* Location Verification (Geofencing) */}
        <SectionCard>
          <div className="flex items-start justify-between mb-6">
            <SectionHeader
              icon={MapPin}
              title={isRTL ? "التحقق من الموقع (GPS)" : "Location Verification (GPS)"}
              subtitle={isRTL ? "إلزام الموظفين بتسجيل الدخول من مقر العمل" : "Force employees to check in from the office"}
            />
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={formData.enable_geofencing}
                  onChange={(e) => setFormData({ ...formData, enable_geofencing: e.target.checked })}
                />
                <div className={cn("block w-14 h-8 rounded-full transition-colors", formData.enable_geofencing ? "bg-[#1e8e3e]" : "bg-[#e5e7eb]")}></div>
                <div className={cn("dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform", formData.enable_geofencing && "transform translate-x-6")}></div>
              </div>
            </label>
          </div>
          
          <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-8 transition-opacity", !formData.enable_geofencing && "opacity-50 pointer-events-none")}>
            
            <div className="md:col-span-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-end">
               <div className="flex-1 w-full">
                  <Field label={isRTL ? "رابط خريطة جوجل (استخراج تلقائي)" : "Google Maps Link (Auto Extract)"} hint={isRTL ? "انسخ رابط المقر من جوجل ماب لنستخرج الإحداثيات فوراً" : "Paste a Google Map link to instantly extract Lat/Lng"}>
                     <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                        <input
                           type="url"
                           value={mapsLink}
                           onChange={(e) => setMapsLink(e.target.value)}
                           className="w-full bg-white border border-[#e5e7eb] rounded-lg py-3 pl-10 pr-4 text-sm font-semibold outline-none focus:border-[#ff5a00] transition-colors"
                           placeholder="https://maps.app.goo.gl/..."
                        />
                     </div>
                  </Field>
               </div>
               <PrimaryButton 
                 type="button" 
                 onClick={handleExtractMapLink}
                 disabled={!mapsLink || extracting}
                 className="h-[46px] w-full md:w-auto px-6 whitespace-nowrap bg-[#111] hover:bg-[#333] text-white"
               >
                 {extracting ? (isRTL ? "جاري الاستخراج..." : "Extracting...") : (isRTL ? "استخراج" : "Extract")}
               </PrimaryButton>
            </div>

            <Field label={isRTL ? "خط العرض (Latitude)" : "Latitude"}>
              <input
                type="text"
                value={formData.office_lat}
                onChange={(e) => setFormData({ ...formData, office_lat: e.target.value })}
                className="w-full bg-white border border-[#e5e7eb] rounded-lg py-3 px-4 text-sm font-semibold outline-none focus:border-[#ff5a00] transition-colors font-mono"
                placeholder="29.9792"
              />
            </Field>
            <Field label={isRTL ? "خط الطول (Longitude)" : "Longitude"}>
              <input
                type="text"
                value={formData.office_lng}
                onChange={(e) => setFormData({ ...formData, office_lng: e.target.value })}
                className="w-full bg-white border border-[#e5e7eb] rounded-lg py-3 px-4 text-sm font-semibold outline-none focus:border-[#ff5a00] transition-colors font-mono"
                placeholder="31.1342"
              />
            </Field>
            <Field 
              label={isRTL ? "النطاق المسموح (بالمتر)" : "Allowed Radius (Meters)"} 
              hint={isRTL ? "المسافة المسموح بها حول المقر" : "Distance allowed around office"}
            >
              <input
                type="number"
                value={formData.office_radius}
                onChange={(e) => setFormData({ ...formData, office_radius: parseInt(e.target.value) })}
                className="w-full bg-white border border-[#e5e7eb] rounded-lg py-3 px-4 text-sm font-semibold outline-none focus:border-[#ff5a00] transition-colors"
                placeholder="200"
              />
            </Field>
          </div>
        </SectionCard>

        {/* Work From Home Configuration */}
        <SectionCard>
          <div className="flex items-start justify-between">
            <SectionHeader
              icon={Home}
              title={isRTL ? "العمل من المنزل (WFH)" : "Work From Home (WFH)"}
              subtitle={isRTL ? "تفعيل خيارات العمل عن بعد داخل البوت الخاص بالموظفين" : "Enable remote work selection inside the Telegram Bot"}
            />
            <label className="flex items-center cursor-pointer mt-1">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={formData.enable_wfh}
                  onChange={(e) => setFormData({ ...formData, enable_wfh: e.target.checked })}
                />
                <div className={cn("block w-14 h-8 rounded-full transition-colors", formData.enable_wfh ? "bg-[#1e8e3e]" : "bg-[#e5e7eb]")}></div>
                <div className={cn("dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform", formData.enable_wfh && "transform translate-x-6")}></div>
              </div>
            </label>
          </div>
          
          <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-8 transition-opacity", !formData.enable_wfh && "opacity-50 pointer-events-none")}>
            <div className="flex items-center justify-between col-span-1 md:col-span-2 p-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl">
              <div>
                <p className="text-sm font-bold text-[#111]">{isRTL ? "إلغاء خصم التأخير للمنزل" : "Ignore Lateness Penalty for WFH"}</p>
                <p className="text-xs text-[#6b7280]">{isRTL ? "لا تطبق قوانين التأخير إذا عمل الموظف من المنزل" : "Do not apply late minute rules when shifting remotely"}</p>
              </div>
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={formData.wfh_ignore_late} onChange={(e) => setFormData({ ...formData, wfh_ignore_late: e.target.checked })} />
                  <div className={cn("block w-12 h-7 rounded-full transition-colors", formData.wfh_ignore_late ? "bg-black" : "bg-[#e5e7eb]")}></div>
                  <div className={cn("dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform", formData.wfh_ignore_late && "transform translate-x-5")}></div>
                </div>
              </label>
            </div>
            <Field label={isRTL ? "ساعات الوردية للمنزل" : "Fixed WFH Shift Hours"} hint={isRTL ? "الساعات المعتمدة في الرواتب" : "Hours granted automatically upon WFH check-out"}>
              <input type="number" step="0.5" value={formData.wfh_fixed_hours} onChange={(e) => setFormData({ ...formData, wfh_fixed_hours: parseFloat(e.target.value) })} className="w-full bg-white border border-[#e5e7eb] rounded-lg py-3 px-4 text-sm font-semibold outline-none focus:border-[#ff5a00] transition-colors" placeholder="8.0" />
            </Field>
          </div>
        </SectionCard>

        {/* Sales Tracking Toggle */}
        <SectionCard>
          <div className="flex items-start justify-between">
            <SectionHeader
              icon={MapPin}
              title={isRTL ? "التقارير الميدانية والمبيعات" : "Sales & Field Reports"}
              subtitle={isRTL ? "تفعيل نظام التقارير الميدانية للفرق داخل البوت" : "Enable field tracking and reporting inside the Telegram Bot"}
            />
            <label className="flex items-center cursor-pointer mt-1">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={formData.sales_tracking_enabled}
                  onChange={(e) => setFormData({ ...formData, sales_tracking_enabled: e.target.checked })}
                />
                <div className={cn("block w-14 h-8 rounded-full transition-colors", formData.sales_tracking_enabled ? "bg-[#1e8e3e]" : "bg-[#e5e7eb]")}></div>
                <div className={cn("dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform", formData.sales_tracking_enabled && "transform translate-x-6")}></div>
              </div>
            </label>
          </div>
        </SectionCard>

        {/* Employee Login Mode */}
        <SectionCard>
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#fff1e8] text-[#ff5a00] flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111]">{isRTL ? "طريقة تسجيل دخول الموظف" : "Employee Login Mode"}</h2>
              <p className="text-xs text-[#6b7280] mt-0.5">
                {isRTL ? (
                  <>اختر كيف يسجل موظفوك الدخول في{" "}
                    <a href="https://team.yawmy.app" target="_blank" rel="noreferrer" className="text-[#ff5a00] font-bold hover:underline">team.yawmy.app</a>
                  </>
                ) : (
                  <>Choose how employees sign in on{" "}
                    <a href="https://team.yawmy.app" target="_blank" rel="noreferrer" className="text-[#ff5a00] font-bold hover:underline">team.yawmy.app</a>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Telegram Mode */}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, auth_mode: "telegram" })}
              className={cn(
                "flex items-start gap-4 p-4 rounded-xl border-2 text-start transition-all",
                formData.auth_mode === "telegram"
                  ? "border-[#0088cc] bg-[#f0f9ff]"
                  : "border-[#e5e7eb] bg-white hover:border-[#0088cc]/40"
              )}
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", formData.auth_mode === "telegram" ? "bg-[#0088cc] text-white" : "bg-[#f0f9ff] text-[#0088cc]")}>
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-[#111] mb-0.5">{isRTL ? "تيليجرام (OTP)" : "Telegram (OTP)"}</p>
                <p className="text-xs text-[#6b7280] leading-relaxed">{isRTL ? "الموظف يدخل رقم هاتفه ويستقبل كود عشوائي عبر تيليجرام" : "Employee enters phone, receives a one-time code via Telegram bot"}</p>
                {formData.auth_mode === "telegram" && (
                  <span className="inline-block mt-2 text-[10px] font-bold text-[#0088cc] bg-[#e0f2fe] px-2 py-0.5 rounded-full">{isRTL ? "مُفعَّل" : "Active"}</span>
                )}
              </div>
            </button>

            {/* Password Mode */}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, auth_mode: "password" })}
              className={cn(
                "flex items-start gap-4 p-4 rounded-xl border-2 text-start transition-all",
                formData.auth_mode === "password"
                  ? "border-[#ff5a00] bg-[#fff7f3]"
                  : "border-[#e5e7eb] bg-white hover:border-[#ff5a00]/40"
              )}
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", formData.auth_mode === "password" ? "bg-[#ff5a00] text-white" : "bg-[#fff1e8] text-[#ff5a00]")}>
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-[#111] mb-0.5">{isRTL ? "هاتف + كلمة مرور" : "Phone + Password"}</p>
                <p className="text-xs text-[#6b7280] leading-relaxed">{isRTL ? "أنت تحدد كلمة مرور لكل موظف من صفحة الموظفين. لا يحتاج تيليجرام." : "You set a password per employee from the Employees page. No Telegram needed."}</p>
                {formData.auth_mode === "password" && (
                  <span className="inline-block mt-2 text-[10px] font-bold text-[#ff5a00] bg-[#fff1e8] px-2 py-0.5 rounded-full">{isRTL ? "مُفعَّل" : "Active"}</span>
                )}
              </div>
            </button>
          </div>

          {/* Warning: switching from password → telegram */}
          {savedAuthMode === "password" && formData.auth_mode === "telegram" && (
            <div className="mt-4 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-in fade-in duration-300">
              <TriangleAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">
                  {isRTL ? "تحقق قبل التبديل" : "Check before switching"}
                </p>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  {isRTL
                    ? "الموظفون الذين لم يربطوا حساب تيليجرام لن يتمكنوا من تسجيل الدخول. تأكد أن كل موظف ربط تيليجرام أولاً."
                    : "Employees who have not linked their Telegram account will be unable to sign in. Make sure all employees have connected Telegram first."}
                </p>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Telegram Integration */}
        <SectionCard className="relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#f0f9ff] text-[#0088cc] flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#111]">{isRTL ? "تيليجرام" : "Telegram"}</h2>
                <p className="text-xs text-[#6b7280] mt-0.5">{isRTL ? "ربط بوت الحضور والتواصل" : "Bot connection and messaging"}</p>
              </div>
            </div>
            <span className="bg-[#f0fdf4] text-[#166534] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              {isRTL ? "مجاني" : "Free"}
            </span>
          </div>

          <div className="border-2 border-[#dbeafe] rounded-2xl p-6 md:p-8 space-y-8 bg-[#f8fbff]/50">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#0088cc] text-white flex items-center justify-center font-black text-sm shrink-0">1</div>
                <div className="space-y-4 flex-1">
                  <div>
                    <h3 className="text-sm font-black text-[#111]">{isRTL ? "أنشئ البوت في @BotFather" : "Create the Bot in @BotFather"}</h3>
                    <div className="mt-3 space-y-1.5">
                      {[
                        isRTL ? "افتح BotFather واضغط Start" : "Open BotFather and press Start",
                        isRTL ? "أرسل الأمر /newbot" : "Send /newbot command",
                        isRTL ? "اختر اسماً للبوت (مثال: متجر بسيط)" : "Choose a name for the bot (e.g. My Attendance)",
                        isRTL ? "اختر اسم مستخدم ينتهي بـ bot_" : "Choose a username ending in _bot",
                        isRTL ? "سيرسل لك رسالة فيها التوكن - انسخه" : "It will send you a message with the Token - copy it",
                      ].map((step, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs font-semibold text-[#6b7280]">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#cbd5e1] mt-1.5 shrink-0" />
                          <p>{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <a 
                    href="https://t.me/botfather" 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-[#0088cc] font-bold text-xs hover:underline"
                  >
                    {isRTL ? "فتح BotFather" : "Open BotFather"}
                    <LinkIcon className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#0088cc] text-white flex items-center justify-center font-black text-sm shrink-0">2</div>
                <div className="space-y-4 flex-1">
                  <h3 className="text-sm font-black text-[#111]">{isRTL ? "ألصق التوكن هنا" : "Paste the Token here"}</h3>
                  <div className="max-w-xl">
                    <input
                      type="password"
                      value={formData.telegram_token}
                      onChange={(e) => setFormData({ ...formData, telegram_token: e.target.value })}
                      className="w-full bg-white border-2 border-[#e5e7eb] rounded-xl py-4 px-5 text-sm font-semibold outline-none focus:border-[#0088cc] transition-all font-mono placeholder:text-[#ccc] shadow-sm"
                      placeholder="123456:ABC-DEF_gHiJkLmNoPqRsTuVwXyZ"
                    />
                    <p className="mt-3 text-[11px] font-semibold text-[#9ca3af]">
                      {isRTL ? "...ABC-DEF:123456 التوكن يبدأ بأرقام وبعدها حروف - مثل" : "Token starts with numbers followed by characters - e.g. 123456:ABC-DEF..."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={() => setFormData({ ...formData, telegram_token: "" })}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-[#6b7280] hover:bg-[#f3f4f6] transition-colors"
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button 
                type="submit"
                disabled={saving || !formData.telegram_token}
                className="px-6 py-2.5 rounded-xl text-sm font-black bg-[#4f86f7] hover:bg-[#3b6ed6] text-white shadow-lg shadow-[#4f86f7]/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
                {isRTL ? "تفعيل البوت" : "Activate Bot"}
              </button>
            </div>
          </div>

          {/* Optional Bot Settings (Secondary) */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-[#f1f1f1] pt-8">
            <Field label={isRTL ? "اسم البوت (اختياري)" : "Bot Name (Optional)"}>
              <input
                type="text"
                value={formData.bot_name}
                onChange={(e) => setFormData({ ...formData, bot_name: e.target.value })}
                className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg py-3 px-4 text-sm font-semibold outline-none focus:border-[#ff5a00] transition-colors"
                placeholder="@YawmyBot"
              />
            </Field>

            <Field label={isRTL ? "لغة البوت (للموظفين)" : "Bot Language (For Employees)"}>
              <select
                value={formData.bot_language}
                onChange={(e) => setFormData({ ...formData, bot_language: e.target.value })}
                className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg py-3 px-4 text-sm font-semibold outline-none focus:border-[#ff5a00] transition-colors"
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </Field>
          </div>
        </SectionCard>

        {/* ── Security Section (moved inside form, above Save button) ── */}
        <SectionCard>
          <SectionHeader
            icon={KeyRound}
            title={isRTL ? "الأمان والحساب" : "Security & Account"}
            subtitle={isRTL ? "تغيير كلمة المرور أو البريد الإلكتروني" : "Change your password or email address"}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => { setPassModal("send"); setSecError(""); setSecOtp(""); setSecNewPass(""); setSecConfirmPass(""); }}
              className="flex items-center gap-4 p-4 rounded-xl border border-[#e5e7eb] hover:border-[#111] hover:bg-[#f9fafb] transition-all text-start group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#f5f5f5] text-[#111] flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-[#111]">{isRTL ? "تغيير كلمة المرور" : "Change Password"}</p>
                <p className="text-xs text-[#9ca3af]">{isRTL ? "ستصلك رمز على بريدك" : "You'll get a code by email"}</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => { setEmailModal("send"); setSecError(""); setSecOtp(""); setSecNewEmail(""); }}
              className="flex items-center gap-4 p-4 rounded-xl border border-[#e5e7eb] hover:border-[#111] hover:bg-[#f9fafb] transition-all text-start group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#f5f5f5] text-[#111] flex items-center justify-center">
                <AtSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-[#111]">{isRTL ? "تغيير البريد الإلكتروني" : "Change Email"}</p>
                <p className="text-xs text-[#9ca3af]">{isRTL ? "أدخل البريد الجديد للتحقق" : "Enter new email to verify"}</p>
              </div>
            </button>
          </div>
        </SectionCard>

        {/* ── Sticky Save Footer ── */}
        <div className="sticky bottom-6 flex justify-end p-4 bg-white/95 backdrop-blur-md border border-[#e5e7eb] rounded-2xl shadow-xl shadow-black/10 z-40 mt-12 transition-all group hover:bg-white">
          <PrimaryButton
            type="submit"
            disabled={saving}
            className="px-12 h-14 rounded-xl font-bold text-base bg-[#ff5a00] hover:bg-[#e65100] shadow-md shadow-[#ff5a00]/20"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
            )}
            {isRTL ? "حفظ التغييرات" : "Save Settings"}
          </PrimaryButton>
        </div>
      </form>

      {/* ── Change Password Modal ── */}
      {passModal !== "idle" && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-[#eeeeee] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#f1f1f1]">
              <h2 className="text-base font-black text-[#111]">{isRTL ? "تغيير كلمة المرور" : "Change Password"}</h2>
              <button onClick={() => setPassModal("idle")} className="p-2 rounded-lg hover:bg-[#f5f5f5] text-[#6b7280]"><AtSign className="w-4 h-4 rotate-45" /></button>
            </div>
            <div className="px-6 py-6 space-y-4">
              {secError && <p className="text-[13px] text-[#e04f00] font-semibold">{secError}</p>}

              {passModal === "send" && (
                <>
                  <p className="text-sm text-[#6b7280]">
                    {isRTL ? `سنرسل رمز تحقق إلى ${currentEmail}` : `We'll send a code to ${currentEmail}`}
                  </p>
                  <button
                    onClick={async () => {
                      setSecLoading(true); setSecError("");
                      const res = await fetch("/api/auth/owner/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: currentEmail, purpose: "reset_password" }) });
                      const data = await res.json();
                      setSecLoading(false);
                      if (!data.ok) { setSecError(data.error || "Failed"); return; }
                      setPassModal("otp"); setSecResend(60);
                    }}
                    disabled={secLoading}
                    className="w-full bg-[#111] text-white font-bold py-3.5 rounded-xl hover:bg-black transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {secLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : isRTL ? "إرسال الرمز" : "Send Code"}
                  </button>
                </>
              )}

              {passModal === "otp" && (
                <>
                  <p className="text-sm text-[#6b7280]">{isRTL ? `أدخل الرمز المرسل إلى ${currentEmail}` : `Enter the 6-digit code sent to ${currentEmail}`}</p>
                  <input
                    value={secOtp} onChange={(e) => setSecOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full text-center text-[24px] font-black tracking-[0.3em] border-b-2 border-[#e5e7eb] focus:border-[#111] outline-none py-3 bg-transparent transition-colors" placeholder="------" maxLength={6} inputMode="numeric" autoFocus
                  />
                  <button onClick={() => { if (secOtp.length === 6) setPassModal("fields"); }} disabled={secOtp.length < 6}
                    className="w-full bg-[#111] text-white font-bold py-3.5 rounded-xl hover:bg-black transition-all disabled:opacity-40">
                    {isRTL ? "متابعة" : "Continue"}
                  </button>
                  <div className="text-center">
                    {secResend > 0
                      ? <p className="text-[12px] text-[#bbb]">Resend in {secResend}s</p>
                      : <button onClick={async () => { await fetch("/api/auth/owner/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: currentEmail, purpose: "reset_password" }) }); setSecResend(60); }} className="text-[12px] text-[#999] hover:text-[#111]">{isRTL ? "إعادة الإرسال" : "Resend"}</button>}
                  </div>
                </>
              )}

              {passModal === "fields" && (
                <>
                  <div className="flex items-center border-b border-[#e5e7eb] focus-within:border-[#111] transition-colors">
                    <input type={secShowPass ? "text" : "password"} placeholder={isRTL ? "كلمة المرور الجديدة" : "New password"}
                      value={secNewPass} onChange={(e) => { setSecNewPass(e.target.value); setSecError(""); }}
                      className="flex-1 py-3 bg-transparent text-sm font-semibold text-[#111] outline-none placeholder:text-[#ccc]" />
                    <button type="button" onClick={() => setSecShowPass((v) => !v)} className="text-[#bbb]">{secShowPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                  </div>
                  <div className="border-b border-[#e5e7eb] focus-within:border-[#111] transition-colors">
                    <input type={secShowPass ? "text" : "password"} placeholder={isRTL ? "تأكيد كلمة المرور" : "Confirm password"}
                      value={secConfirmPass} onChange={(e) => { setSecConfirmPass(e.target.value); setSecError(""); }}
                      className="w-full py-3 bg-transparent text-sm font-semibold text-[#111] outline-none placeholder:text-[#ccc]" />
                  </div>
                  <button
                    onClick={async () => {
                      if (secNewPass !== secConfirmPass) { setSecError(isRTL ? "كلمتا المرور غير متطابقتين" : "Passwords don't match"); return; }
                      if (secNewPass.length < 8) { setSecError(isRTL ? "يجب أن تكون 8 أحرف على الأقل" : "Min 8 characters"); return; }
                      setSecLoading(true); setSecError("");
                      const res = await fetch("/api/auth/owner/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: currentEmail, code: secOtp, new_password: secNewPass }) });
                      const data = await res.json();
                      setSecLoading(false);
                      if (!data.ok) { setSecError(data.error || "Invalid code"); return; }
                      setPassModal("done");
                    }}
                    disabled={secLoading || !secNewPass || !secConfirmPass}
                    className="w-full bg-[#ff5a00] text-white font-bold py-3.5 rounded-xl hover:bg-[#e04e00] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {secLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : isRTL ? "حفظ كلمة المرور" : "Save Password"}
                  </button>
                </>
              )}

              {passModal === "done" && (
                <div className="text-center space-y-4 py-2">
                  <CheckCircle2 className="w-12 h-12 text-[#1e8e3e] mx-auto" />
                  <p className="font-black text-[#111]">{isRTL ? "تم تغيير كلمة المرور!" : "Password changed!"}</p>
                  <button onClick={() => setPassModal("idle")} className="w-full bg-[#111] text-white font-bold py-3 rounded-xl">{isRTL ? "إغلاق" : "Close"}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Change Email Modal ── */}
      {emailModal !== "idle" && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-[#eeeeee] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#f1f1f1]">
              <h2 className="text-base font-black text-[#111]">{isRTL ? "تغيير البريد الإلكتروني" : "Change Email"}</h2>
              <button onClick={() => setEmailModal("idle")} className="p-2 rounded-lg hover:bg-[#f5f5f5] text-[#6b7280]"><AtSign className="w-4 h-4 rotate-45" /></button>
            </div>
            <div className="px-6 py-6 space-y-4">
              {secError && <p className="text-[13px] text-[#e04f00] font-semibold">{secError}</p>}

              {emailModal === "send" && (
                <>
                  <p className="text-sm text-[#6b7280]">{isRTL ? "أدخل البريد الإلكتروني الجديد" : "Enter your new email address"}</p>
                  <div className="border-b border-[#e5e7eb] focus-within:border-[#111] transition-colors">
                    <input type="email" placeholder="new@email.com" dir="ltr" value={secNewEmail} onChange={(e) => { setSecNewEmail(e.target.value); setSecError(""); }}
                      className="w-full py-3 bg-transparent text-sm font-semibold text-[#111] outline-none placeholder:text-[#ccc]" autoFocus />
                  </div>
                  <button
                    onClick={async () => {
                      if (!secNewEmail.includes("@")) { setSecError(isRTL ? "بريد إلكتروني غير صالح" : "Invalid email"); return; }
                      setSecLoading(true); setSecError("");
                      const res = await fetch("/api/auth/owner/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: currentEmail, purpose: "change_email", new_email: secNewEmail }) });
                      const data = await res.json();
                      setSecLoading(false);
                      if (!data.ok) { setSecError(data.error || "Failed"); return; }
                      setEmailModal("otp"); setSecResend(60);
                    }}
                    disabled={secLoading || !secNewEmail.trim()}
                    className="w-full bg-[#111] text-white font-bold py-3.5 rounded-xl hover:bg-black transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {secLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : isRTL ? "إرسال رمز التحقق" : "Send Verification Code"}
                  </button>
                  <p className="text-[11px] text-[#9ca3af] text-center">{isRTL ? `سيصل الرمز إلى البريد الجديد: ${secNewEmail || "..."}`  : `Code will be sent to: ${secNewEmail || "..."}`}</p>
                </>
              )}

              {emailModal === "otp" && (
                <>
                  <p className="text-sm text-[#6b7280]">{isRTL ? `أدخل الرمز المرسل إلى ${secNewEmail}` : `Enter the code sent to ${secNewEmail}`}</p>
                  <input
                    value={secOtp} onChange={(e) => setSecOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full text-center text-[24px] font-black tracking-[0.3em] border-b-2 border-[#e5e7eb] focus:border-[#111] outline-none py-3 bg-transparent transition-colors" placeholder="------" maxLength={6} inputMode="numeric" autoFocus
                  />
                  <button
                    onClick={async () => {
                      if (secOtp.length < 6) return;
                      setSecLoading(true); setSecError("");
                      const res = await fetch("/api/auth/owner/change-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current_email: currentEmail, code: secOtp, new_email: secNewEmail }) });
                      const data = await res.json();
                      setSecLoading(false);
                      if (!data.ok) { setSecError(data.error || "Invalid code"); return; }
                      setCurrentEmail(secNewEmail);
                      setEmailModal("done");
                    }}
                    disabled={secLoading || secOtp.length < 6}
                    className="w-full bg-[#ff5a00] text-white font-bold py-3.5 rounded-xl hover:bg-[#e04e00] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {secLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : isRTL ? "تأكيد التغيير" : "Confirm Change"}
                  </button>
                </>
              )}

              {emailModal === "done" && (
                <div className="text-center space-y-4 py-2">
                  <CheckCircle2 className="w-12 h-12 text-[#1e8e3e] mx-auto" />
                  <p className="font-black text-[#111]">{isRTL ? "تم تغيير البريد الإلكتروني!" : "Email updated!"}</p>
                  <p className="text-sm text-[#6b7280]">{secNewEmail}</p>
                  <button onClick={() => setEmailModal("idle")} className="w-full bg-[#111] text-white font-bold py-3 rounded-xl">{isRTL ? "إغلاق" : "Close"}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
