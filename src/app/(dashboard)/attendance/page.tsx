"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Download, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";
import {
  PageHeader,
  SectionCard,
  StatusPill,
  DateRangePill,
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

const WEEKDAYS_EN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const WEEKDAYS_AR = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

function formatCheckInLabel(iso: string, locale: string, isRTL: boolean) {
  const d = new Date(iso);
  const weekday = isRTL ? WEEKDAYS_AR[d.getDay()] : WEEKDAYS_EN[d.getDay()];
  const month = d.toLocaleString(locale, { month: "short" });
  const day = d.getDate();
  const time = d.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { weekday, date: `${month} ${day}`, time };
}

function rangeLabel(from: Date, to: Date, locale: string) {
  const fmt = (d: Date) =>
    d.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  return `${fmt(from)} – ${fmt(to)}`;
}

export default function AttendancePage() {
  const { t, isRTL, lang } = useLanguage();
  const locale = lang === "ar" ? "ar-EG" : "en-US";

  const [logs, setLogs] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // Last 7 days by default
  const range = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 6);
    return { from, to };
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const fromIso = range.from.toISOString().split("T")[0];
      const toIso = range.to.toISOString().split("T")[0];
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
  }, [range.from, range.to]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) => {
      const name = l.employees?.name?.toLowerCase() ?? "";
      const phone = l.employees?.phone ?? "";
      return name.includes(q) || phone.includes(q);
    });
  }, [logs, query]);

  const handleExport = () => {
    const header = [
      t.employee,
      t.phone,
      t.date,
      t.checkIn,
      t.checkOut,
      t.duration,
      t.status,
    ];
    const rows = filtered.map((l) => [
      l.employees?.name ?? "",
      l.employees?.phone ?? "",
      l.date,
      l.check_in
        ? new Date(l.check_in).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
      l.check_out
        ? new Date(l.check_out).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
      l.working_hours ? `${l.working_hours}h` : "",
      l.status,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${range.from.toISOString().split("T")[0]}_${range.to
      .toISOString()
      .split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={t.attendanceTitle}
        subtitle={t.attendanceRange}
        subtitleTone="orange"
        isRTL={isRTL}
      />

      {/* Filter bar */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-3",
          isRTL && "flex-row-reverse"
        )}
      >
        <DateRangePill label={rangeLabel(range.from, range.to, locale)} />
        <GhostButton icon={Filter}>{t.filters}</GhostButton>
        <SearchField
          placeholder={t.searchPlaceholder}
          value={query}
          onChange={setQuery}
        />
        <div className="ml-auto">
          <GhostButton icon={Download} onClick={handleExport}>
            {t.downloadReport}
          </GhostButton>
        </div>
      </div>

      {/* Range heading */}
      <h2 className="text-lg font-bold text-[#111]">
        {rangeLabel(range.from, range.to, locale)}
      </h2>

      {/* Table */}
      <SectionCard padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[#6b7280] text-xs">
                <th className="text-left font-medium px-6 py-4 w-[140px]">
                  {t.status}
                </th>
                <th className="text-left font-medium px-6 py-4">
                  {t.employee}
                </th>
                <th className="text-left font-medium px-6 py-4">{t.issues}</th>
                <th className="text-right font-medium px-6 py-4">
                  {t.checkIn}
                </th>
                <th className="text-right font-medium px-6 py-4">
                  {t.duration}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-16 text-center text-[#9ca3af] text-sm"
                  >
                    …
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-16 text-center text-[#9ca3af] text-sm italic"
                  >
                    {t.noRecords}
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const tone =
                    log.status === "present"
                      ? "success"
                      : log.status === "late"
                      ? "warning"
                      : "neutral";
                  const label =
                    log.status === "late"
                      ? t.statusLate
                      : log.status === "absent"
                      ? t.statusAbsent
                      : t.statusPresent;
                  const checkIn = log.check_in
                    ? formatCheckInLabel(log.check_in, locale, isRTL)
                    : null;

                  const issues: string[] = [];
                  if (log.status === "late") issues.push(t.issueLate);
                  if (log.check_in && !log.check_out)
                    issues.push(t.issueMissingCheckout);

                  return (
                    <tr
                      key={log.id}
                      className="border-t border-[#f1f1f1] hover:bg-[#fafafa] transition-colors"
                    >
                      <td className="px-6 py-5 align-top">
                        <StatusPill label={label} tone={tone} />
                      </td>
                      <td className="px-6 py-5 align-top">
                        <p className="text-[15px] font-semibold text-[#111]">
                          {log.employees?.name ?? "—"}
                        </p>
                        {checkIn && (
                          <p className="text-xs text-[#6b7280] mt-0.5">
                            {checkIn.weekday}, {checkIn.date} at {checkIn.time}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-5 align-top">
                        {issues.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {issues.map((iss) => (
                              <StatusPill
                                key={iss}
                                label={iss}
                                tone="neutral"
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#d4d4d4]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right align-top text-sm font-semibold text-[#111]">
                        {log.check_in
                          ? new Date(log.check_in).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="px-6 py-5 text-right align-top text-sm font-semibold text-[#111]">
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

      {/* Help card */}
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
