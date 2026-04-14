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
  Link as LinkIcon
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";
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
    currency: "EGP",
    half_day_enabled: false,
    half_day_hours: 4.0
  });
  const [message, setMessage] = useState<{
    type: "success" | "error" | "";
    text: string;
  }>({ type: "", text: "" });

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
          currency: data.currency || "EGP",
          half_day_enabled: !!data.half_day_enabled,
          half_day_hours: data.half_day_hours || 4.0
        });
      }
      setLoading(false);
    };
    load();
  }, []);

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
        currency: formData.currency,
        half_day_enabled: formData.half_day_enabled,
        half_day_hours: formData.half_day_hours
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

        {/* Telegram Integration */}
        <SectionCard className="relative overflow-hidden">
          <SectionHeader
            icon={Bot}
            title={isRTL ? "إعدادات تليجرام" : "Telegram Integration"}
            subtitle={isRTL ? "ربط بوت الحضور والتواصل" : "Bot connection and messaging"}
          />
          <div className="space-y-8 relative z-10">
            <Field label={isRTL ? "اسم البوت (اختياري)" : "Bot Name (Optional)"}>
              <input
                type="text"
                value={formData.bot_name}
                onChange={(e) =>
                  setFormData({ ...formData, bot_name: e.target.value })
                }
                className="w-full bg-white border border-[#e5e7eb] rounded-lg py-3 px-4 text-sm font-semibold outline-none focus:border-[#ff5a00] transition-colors"
                placeholder="@SyncTimeBot"
              />
            </Field>

            <Field label={isRTL ? "لغة البوت (للموظفين)" : "Bot Language (For Employees)"}>
              <select
                value={formData.bot_language}
                onChange={(e) => setFormData({ ...formData, bot_language: e.target.value })}
                className="w-full bg-white border border-[#e5e7eb] rounded-lg py-3 px-4 text-sm font-semibold outline-none focus:border-[#ff5a00] transition-colors"
              >
                <option value="en">{isRTL ? "الإنجليزية (English)" : "English"}</option>
                <option value="ar">{isRTL ? "العربية (Arabic)" : "Arabic"}</option>
              </select>
            </Field>

            <Field
              label={isRTL ? "رمز البوت (Token)" : "Telegram Bot Token"}
              hint={
                isRTL
                  ? "احصل عليه من @BotFather في تليجرام. لا تشاركه مع أي شخص."
                  : "Get this from @BotFather on Telegram. Never share it."
              }
            >
              <input
                type="password"
                value={formData.telegram_token}
                onChange={(e) =>
                  setFormData({ ...formData, telegram_token: e.target.value })
                }
                className="w-full bg-white border border-[#e5e7eb] rounded-lg py-3 px-4 text-sm font-semibold outline-none focus:border-[#ff5a00] transition-colors font-mono"
                placeholder="123456789:ABCDefgh..."
              />
            </Field>

            {formData.telegram_token && (
              <div className="bg-[#fff1e8] p-4 rounded-xl border border-[#fee2e2] flex items-center justify-between">
                <div className="flex items-center gap-3 text-[#ff5a00]">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {isRTL ? "اتصال مشفر وآمن" : "Securely Encrypted"}
                  </span>
                </div>
                <StatusPill tone="success" label={isRTL ? "جاهز" : "Linked"} />
              </div>
            )}
          </div>
        </SectionCard>

        <div className="flex justify-end pt-4 gap-4">
          <PrimaryButton
            type="submit"
            disabled={saving}
            className="px-12 h-14 rounded-xl font-bold text-base bg-[#ff5a00] hover:bg-[#e65100]"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isRTL ? "حفظ التغييرات" : "Save Settings"}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}
