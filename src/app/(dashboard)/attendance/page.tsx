"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Download, Filter, CalendarDays, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";
import {
  PageHeader,
  SectionCard,
  StatusPill,
  GhostButton,
  SearchField,
  HelpCard,
} from "@/app/components/talabat-ui";

type AttendanceRow = {
  id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  working_hours: number | null;
  employees?: { name: string; phone?: string } | null;
};

type PresetKey = "today" | "yesterday" | "week" | "month" | "custom";

const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function formatCheckInLabel(iso: string, locale: string, isRTL: boolean) {
  const d = new Date(iso);
  const weekday = isRTL ? WEEKDAYS_AR[d.getDay()] : WEEKDAYS_EN[d.getDay()];
  const month = d.toLocaleString(locale, { month: "short" });
  const day = d.getDate();
  const time = d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: false });
  return { weekday, date: `${month} ${day}`, time };
}

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function rangeLabel(from: Date, to: Date, locale: string) {
  const fmt = (d: Date) => d.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
  return `${fmt(from)} – ${fmt(to)}`;
}

function getPresetRange(key: PresetKey): { from: Date; to: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const to = new Date(today);

  switch (key) {
    case "today":
      return { from: new Date(today), to };
    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { from: y, to: y };
    }
    case "week": {
      const w = new Date(today);
      w.setDate(w.getDate() - 6);
      return { from: w, to };
    }
    case "month": {
      const m = new Date(today);
      m.setDate(m.getDate() - 29);
      return { from: m, to };
    }
    default:
      return { from: new Date(today), to };
  }
}

export default function AttendancePage() {
  const { t, isRTL, lang } = useLanguage();
  const locale = lang === "ar" ? "ar-EG" : "en-US";

  const [logs, setLogs] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activePreset, setActivePreset] = useState<PresetKey>("today");
  const [range, setRange] = useState(getPresetRange("today"));
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState(formatDate(range.from));
  const [customTo, setCustomTo] = useState(formatDate(range.to));

  const presets: { key: PresetKey; label: string }[] = [
    { key: "today", label: isRTL ? "اليوم" : "Today" },
    { key: "yesterday", label: isRTL ? "أمس" : "Yesterday" },
    { key: "week", label: isRTL ? "هذا الأسبوع" : "This Week" },
    { key: "month", label: isRTL ? "هذا الشهر" : "This Month" },
    { key: "custom", label: isRTL ? "مخصص" : "Custom" },
  ];

  const handlePreset = (key: PresetKey) => {
    setActivePreset(key);
    if (key === "custom") {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      setRange(getPresetRange(key));
    }
  };

  const handleCustomApply = () => {
    setRange({ from: new Date(customFrom), to: new Date(customTo) });
    setShowCustom(false);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const fromIso = formatDate(range.from);
      const toIso = formatDate(range.to);
      const { data } = await supabase
        .from("attendance")
        .select("*, employees(name, phone)")
        .gte("date", fromIso)
        .lte("date", toIso)
        .order("date", { ascending: false })
        .order("check_in", { ascending: false });
      setLogs((data as AttendanceRow[]) ?? []);
      setLoading(false);
    };
    load();
  }, [range]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) => {
      const name = l.employees?.name?.toLowerCase() ?? "";
      const phone = l.employees?.phone ?? "";
      return name.includes(q) || phone.includes(q);
    });
  }, [logs, query]);

  // Stats
  const stats = useMemo(() => {
    const total = filtered.length;
    const present = filtered.filter((l) => l.status === "present").length;
    const late = filtered.filter((l) => l.status === "late").length;
    const absent = filtered.filter((l) => l.status === "absent").length;
    return { total, present, late, absent };
  }, [filtered]);

  const handleExport = () => {
    const header = [t.employee, t.phone, t.date, t.checkIn, t.checkOut, t.duration, t.status];
    const rows = filtered.map((l) => [
      l.employees?.name ?? "",
      l.employees?.phone ?? "",
      l.date,
      l.check_in ? new Date(l.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
      l.check_out ? new Date(l.check_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
      l.working_hours ? `${l.working_hours}h` : "",
      l.status,
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${formatDate(range.from)}_${formatDate(range.to)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t.attendanceTitle} subtitle={t.attendanceRange} subtitleTone="orange" isRTL={isRTL} />

      {/* Period Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((p) => (
          <button
            key={p.key}
            onClick={() => handlePreset(p.key)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activePreset === p.key
                ? "bg-[#ff5a00] text-white shadow-sm"
                : "bg-white text-[#6b7280] border border-[#e5e7eb] hover:border-[#ff5a00] hover:text-[#ff5a00]"
            )}
          >
            {p.key === "custom" && <CalendarDays className="w-3.5 h-3.5 inline me-1.5 -mt-0.5" />}
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom Date Picker */}
      {showCustom && (
        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-4 flex flex-wrap items-end gap-3 shadow-sm animate-in fade-in duration-200">
          <div>
            <label className="text-[10px] font-bold text-[#6b7280] uppercase block mb-1">{isRTL ? "من" : "From"}</label>
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm font-semibold text-[#111] outline-none focus:border-[#ff5a00]" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#6b7280] uppercase block mb-1">{isRTL ? "إلى" : "To"}</label>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm font-semibold text-[#111] outline-none focus:border-[#ff5a00]" />
          </div>
          <button onClick={handleCustomApply} className="bg-[#ff5a00] text-white font-bold text-xs px-5 py-2.5 rounded-lg hover:bg-[#e04f00] transition-all">
            {isRTL ? "تطبيق" : "Apply"}
          </button>
          <button onClick={() => setShowCustom(false)} className="text-[#9ca3af] hover:text-[#111] p-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search + Export */}
      <div className={cn("flex flex-wrap items-center gap-3", isRTL && "flex-row-reverse")}>
        <SearchField placeholder={t.searchPlaceholder} value={query} onChange={setQuery} />
        <div className="ms-auto">
          <GhostButton icon={Download} onClick={handleExport}>{t.downloadReport}</GhostButton>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-3 text-center">
          <p className="text-xl font-black text-[#111]">{stats.total}</p>
          <p className="text-[9px] font-bold text-[#6b7280] uppercase">{isRTL ? "إجمالي" : "Total"}</p>
        </div>
        <div className="bg-[#e6f6ec] rounded-xl p-3 text-center">
          <p className="text-xl font-black text-[#1e8e3e]">{stats.present}</p>
          <p className="text-[9px] font-bold text-[#1e8e3e] uppercase">{isRTL ? "حاضر" : "Present"}</p>
        </div>
        <div className="bg-[#fdf4d8] rounded-xl p-3 text-center">
          <p className="text-xl font-black text-[#b45309]">{stats.late}</p>
          <p className="text-[9px] font-bold text-[#b45309] uppercase">{isRTL ? "متأخر" : "Late"}</p>
        </div>
        <div className="bg-[#fef2f2] rounded-xl p-3 text-center">
          <p className="text-xl font-black text-[#b91c1c]">{stats.absent}</p>
          <p className="text-[9px] font-bold text-[#b91c1c] uppercase">{isRTL ? "غائب" : "Absent"}</p>
        </div>
      </div>

      {/* Range Heading */}
      <h2 className="text-base font-bold text-[#111]">{rangeLabel(range.from, range.to, locale)}</h2>

      {/* Table */}
      <SectionCard padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[#6b7280] text-xs">
                <th className="text-start font-medium px-6 py-4 w-[120px]">{t.status}</th>
                <th className="text-start font-medium px-6 py-4">{t.employee}</th>
                <th className="text-start font-medium px-6 py-4">{t.issues}</th>
                <th className="text-end font-medium px-6 py-4">{t.checkIn}</th>
                <th className="text-end font-medium px-6 py-4">{t.duration}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-16 text-center text-[#9ca3af] text-sm">...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-16 text-center text-[#9ca3af] text-sm italic">{t.noRecords}</td></tr>
              ) : (
                filtered.map((log) => {
                  const tone = log.status === "present" ? "success" : log.status === "late" ? "warning" : "neutral";
                  const label = log.status === "late" ? t.statusLate : log.status === "absent" ? t.statusAbsent : t.statusPresent;
                  const checkIn = log.check_in ? formatCheckInLabel(log.check_in, locale, isRTL) : null;
                  const issues: string[] = [];
                  if (log.status === "late") issues.push(t.issueLate);
                  if (log.check_in && !log.check_out) issues.push(t.issueMissingCheckout);

                  return (
                    <tr key={log.id} className="border-t border-[#f1f1f1] hover:bg-[#fafafa] transition-colors">
                      <td className="px-6 py-5 align-top"><StatusPill label={label} tone={tone} /></td>
                      <td className="px-6 py-5 align-top">
                        <p className="text-[15px] font-semibold text-[#111]">{log.employees?.name ?? "—"}</p>
                        {checkIn && <p className="text-xs text-[#6b7280] mt-0.5">{checkIn.weekday}, {checkIn.date} at {checkIn.time}</p>}
                      </td>
                      <td className="px-6 py-5 align-top">
                        {issues.length > 0 ? (
                          <div className="flex flex-wrap gap-1">{issues.map((iss) => <StatusPill key={iss} label={iss} tone="neutral" />)}</div>
                        ) : <span className="text-[#d4d4d4]">—</span>}
                      </td>
                      <td className="px-6 py-5 text-end align-top text-sm font-semibold text-[#111]">
                        {log.check_in ? new Date(log.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td className="px-6 py-5 text-end align-top text-sm font-semibold text-[#111]">
                        {log.working_hours ? `${log.working_hours}h` : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <HelpCard
        title={t.needHelpTitle}
        subtitle={t.needHelpSubtitle}
        moreLabel={t.more}
        isRTL={isRTL}
        articles={[
          { title: t.article1Title, description: t.article1Desc },
          { title: t.article2Title, description: t.article2Desc },
          { title: t.article3Title, description: t.article3Desc },
          { title: t.article4Title, description: t.article4Desc },
        ]}
      />
    </div>
  );
}
