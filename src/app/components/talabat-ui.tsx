"use client";

/**
 * Talabat-inspired reusable UI primitives for SyncTime.
 * Light-only, orange-primary, rounded cards + pills.
 *
 * Do not use elsewhere in the app outside the (dashboard) group
 * unless you also adopt the light theme.
 */

import React from "react";
import Link from "next/link";
import { Calendar, ChevronDown, FileText, Search } from "lucide-react";
import { cn } from "@/lib/utils";

import { supabase } from "@/lib/supabase";

export function BrandLogo() {
  const [name, setName] = React.useState("Yawmy");

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
       if (user) {
          supabase.from("companies").select("name").eq("owner_id", user.id).single().then(({ data }) => {
             if (data && (data as any).name) setName((data as any).name);
          });
       }
    });
  }, []);

  return (
    <div className="flex items-center gap-1 select-none">
      <span className="bg-[#1a1a1a] text-white font-extrabold text-[13px] leading-none px-2 py-1 rounded-[4px] tracking-tight">
        admin
      </span>
      <span className="bg-[#ff5a00] text-white font-extrabold text-[13px] leading-none px-2 py-1 rounded-[4px] tracking-tight truncate max-w-[140px]">
        {name}
      </span>
    </div>
  );
}

/* ------------------------------ Status Pill ----------------------------- */

type StatusTone = "success" | "warning" | "danger" | "neutral";

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-[#e6f6ec] text-[#1e8e3e]",
  warning: "bg-[#fdf4d8] text-[#b45309]",
  danger: "bg-[#fef1f1] text-[#b91c1c]",
  neutral: "bg-[#f1f1f1] text-[#4b5563]",
};

export function StatusPill({
  label,
  tone = "success",
  className,
}: {
  label: string;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase",
        TONE_CLASSES[tone],
        className
      )}
    >
      {label}
    </span>
  );
}

/* ---------------------------- Section Card ----------------------------- */

export function SectionCard({
  children,
  className,
  padding = "default",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "default" | "lg";
}) {
  const pad =
    padding === "none" ? "" : padding === "lg" ? "p-8" : "p-6";
  return (
    <section
      className={cn(
        "bg-white border border-[#eeeeee] rounded-xl",
        pad,
        className
      )}
    >
      {children}
    </section>
  );
}

/* ------------------------------ Page Header ---------------------------- */

export function PageHeader({
  title,
  subtitle,
  subtitleTone = "muted",
  action,
  isRTL,
}: {
  title: string;
  subtitle?: string;
  subtitleTone?: "muted" | "orange";
  action?: React.ReactNode;
  isRTL?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 md:flex-row md:items-start md:justify-between",
        isRTL && "text-right"
      )}
    >
      <div>
        <h1 className="text-[28px] md:text-[32px] font-bold text-[#111] leading-tight tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <button
            type="button"
            className={cn(
              "mt-2 inline-flex items-center gap-1 text-[15px] font-medium",
              subtitleTone === "orange"
                ? "text-[#ff5a00] hover:underline"
                : "text-[#6b7280]"
            )}
          >
            {subtitle}
            {subtitleTone === "orange" && <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* --------------------------- Date Range Pill --------------------------- */

export function DateRangePill({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-[#ffd4b8] text-[#ff5a00] text-sm font-medium bg-white hover:bg-[#fff1e8] transition-colors"
    >
      <Calendar className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

/* ---------------------------- Ghost Button ----------------------------- */

export function GhostButton({
  children,
  icon: Icon,
  className,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 h-10 px-4 text-sm font-medium text-[#4b5563] hover:text-[#111] hover:bg-[#f5f5f5] rounded-md transition-colors",
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}

/* --------------------------- Primary Button --------------------------- */

export function PrimaryButton({
  children,
  icon: Icon,
  className,
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 h-10 px-5 rounded-md text-sm font-semibold bg-[#ff5a00] text-white hover:bg-[#e04f00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}

/* ---------------------------- Search Field ----------------------------- */

export function SearchField({
  placeholder,
  value,
  onChange,
  className,
}: {
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("relative flex-1 min-w-[180px] max-w-md", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-4 rounded-full bg-white border border-[#eeeeee] text-sm text-[#111] placeholder-[#9ca3af] outline-none focus:border-[#ffd4b8] focus:ring-2 focus:ring-[#ff5a00]/10 transition-all"
      />
    </div>
  );
}

/* ---------------------------- Help Articles ---------------------------- */

type Article = {
  title: string;
  description?: string;
  href?: string;
};

export function HelpCard({
  title,
  subtitle,
  moreLabel,
  articles,
  isRTL,
}: {
  title: string;
  subtitle?: string;
  moreLabel?: string;
  articles: Article[];
  isRTL?: boolean;
}) {
  return (
    <SectionCard>
      <div
        className={cn(
          "flex items-start justify-between mb-6",
          isRTL && "flex-row-reverse"
        )}
      >
        <div>
          <h3 className="text-lg font-bold text-[#111]">{title}</h3>
          {subtitle && (
            <p className="text-sm text-[#6b7280] mt-1">{subtitle}</p>
          )}
        </div>
        {moreLabel && (
          <Link
            href="/blog"
            className="text-sm font-medium text-[#6b7280] hover:text-[#111] inline-flex items-center gap-1"
          >
            {moreLabel} <span aria-hidden>›</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {articles.map((a, i) => (
          <Link
            key={i}
            href={a.href || "#"}
            className="group block p-4 rounded-lg border border-[#eeeeee] hover:border-[#ffd4b8] hover:bg-[#fffaf5] transition-colors"
          >
            <div className="flex items-center gap-2 mb-2 text-[#6b7280] group-hover:text-[#ff5a00]">
              <FileText className="w-4 h-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Article
              </span>
            </div>
            <p className="text-sm font-bold text-[#111] leading-snug line-clamp-2">
              {a.title}
            </p>
            {a.description && (
              <p className="mt-1.5 text-xs text-[#6b7280] leading-relaxed line-clamp-2">
                {a.description}
              </p>
            )}
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}
