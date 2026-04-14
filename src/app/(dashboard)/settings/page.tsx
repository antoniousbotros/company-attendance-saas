"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Bot,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
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
    if (!user) {
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("companies")
      .update({
        name: formData.name,
        telegram_token: formData.telegram_token,
        bot_name: formData.bot_name,
      })
      .eq("owner_id", user.id);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: t.saved });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#ff5a00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inputBase =
    "w-full h-11 px-4 rounded-md bg-white border border-[#eeeeee] text-sm text-[#111] outline-none focus:border-[#ffd4b8] focus:ring-2 focus:ring-[#ff5a00]/10 transition-all";

  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader
        title={t.settingsTitle}
        subtitle={t.settingsSubtitle}
        isRTL={isRTL}
      />

      {message.text && (
        <div
          className={cn(
            "rounded-md border px-4 py-3 flex items-center gap-2 text-sm",
            message.type === "success"
              ? "bg-[#e6f6ec] border-[#c9ecd2] text-[#1e8e3e]"
              : "bg-[#fef1f1] border-[#f5cccc] text-[#b91c1c]"
          )}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <SectionCard padding="lg">
          <SectionHeader
            icon={Building2}
            title={t.companyIdentity}
            subtitle={t.basics}
          />
          <Field label={t.companyName}>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={inputBase}
              placeholder="e.g. Acme Corp"
            />
          </Field>
        </SectionCard>

        <SectionCard padding="lg">
          <SectionHeader
            icon={Bot}
            title={t.telegramIntegration}
            subtitle={t.botConnection}
          />

          <div className="space-y-5">
            <Field label={t.botName}>
              <input
                type="text"
                value={formData.bot_name}
                onChange={(e) =>
                  setFormData({ ...formData, bot_name: e.target.value })
                }
                className={inputBase}
                placeholder="@SyncTimeBot"
              />
            </Field>

            <Field label={t.botToken} hint={t.botTokenHint}>
              <input
                type="password"
                value={formData.telegram_token}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    telegram_token: e.target.value,
                  })
                }
                className={cn(inputBase, "font-mono")}
                placeholder="123456789:ABCDefgh..."
              />
            </Field>

            {formData.telegram_token && (
              <div
                className={cn(
                  "flex items-center justify-between rounded-md border border-[#ffd4b8] bg-[#fff1e8] px-4 py-3",
                  isRTL && "flex-row-reverse"
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-2 text-[#ff5a00]",
                    isRTL && "flex-row-reverse"
                  )}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {t.securelyEncrypted}
                  </span>
                </div>
                <StatusPill label={t.ready} tone="success" />
              </div>
            )}
          </div>
        </SectionCard>

        <div
          className={cn(
            "flex items-center justify-end gap-2",
            isRTL && "flex-row-reverse"
          )}
        >
          <button
            type="button"
            className="h-10 px-4 text-sm font-medium text-[#4b5563] hover:text-[#111] hover:bg-white rounded-md transition-colors"
          >
            {t.cancel}
          </button>
          <PrimaryButton type="submit" icon={Save} disabled={saving}>
            {saving ? "…" : t.saveChanges}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}
