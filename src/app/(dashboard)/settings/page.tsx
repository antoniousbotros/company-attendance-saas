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
  Timer
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
  const [formData, setFormData] = useState({
    name: "",
    telegram_token: "",
    bot_name: "",
    work_start_time: "09:00",
    work_end_time: "17:00",
    late_threshold: 15
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
          work_start_time: data.work_start_time || "09:00",
          work_end_time: data.work_end_time || "17:00",
          late_threshold: data.late_threshold || 15
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
        work_start_time: formData.work_start_time,
        work_end_time: formData.work_end_time,
        late_threshold: formData.late_threshold
      })
      .eq("owner_id", user?.id);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({
        type: "success",
        text: isRTL ? "تم حفظ الإعدادات بنجاح!" : "Settings saved successfully!",
      });
    }
    setSaving(false);
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
        description={
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
                <StatusPill status="success" text={isRTL ? "جاهز" : "Linked"} />
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
