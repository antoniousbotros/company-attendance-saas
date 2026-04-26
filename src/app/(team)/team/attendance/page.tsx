"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useTeam } from "../layout";
import { CalendarDays, Clock, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { cn } from "@/lib/utils";

type Period = "week" | "month";

export default function TeamAttendancePage() {
  const { isRTL, lang } = useTeam();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("week");

  useEffect(() => {
    fetch("/api/team/attendance/history")
      .then((r) => r.json())
      .then((data) => { setRecords(data.records || []); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - (period === "week" ? 7 : 30));
    return records.filter((r) => new Date(r.date) >= cutoff);
  }, [records, period]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const present = filtered.filter((r) => r.status === "present").length;
    const late = filtered.filter((r) => r.status === "late").length;
    const absent = filtered.filter((r) => r.status === "absent").length;
    return { total, present, late, absent };
  }, [filtered]);

  const chartData = useMemo(() => {
    return filtered.slice(0, period === "week" ? 7 : 30).reverse().map((r) => ({
      day: new Date(r.date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { weekday: "short", day: "numeric" }),
      hours: r.working_hours || 0,
      status: r.status,
    }));
  }, [filtered, period, lang]);

  const statusColor = (s: string) => {
    if (s === "present") return "bg-[#e6f6ec] text-[#1e8e3e]";
    if (s === "late") return "bg-[#fdf4d8] text-[#b45309]";
    return "bg-[#fef2f2] text-[#b91c1c]";
  };

  const barColor = (s: string) => {
    if (s === "present") return "#1e8e3e";
    if (s === "late") return "#b45309";
    return "#b91c1c";
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-US", {
      timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hour12: true,
    });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── Filter Card ── */}
      <div className="premium-card p-4 flex items-center justify-between bg-[#fcfcfc]">
        <h3 className="text-sm font-black text-[#111] uppercase tracking-widest px-1">
          {isRTL ? "تحليل الفترة" : "PERIOD ANALYSIS"}
        </h3>
        <div className="flex bg-[#f5f5f5] rounded-md p-1 border border-[#eeeeee]">
          {(["week", "month"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-4 py-1.5 rounded-md text-[10px] font-black transition-all",
                period === p 
                  ? "bg-white text-[#ff5a00] shadow-sm" 
                  : "text-[#6b7280] hover:text-[#111]"
              )}
            >
              {p === "week" ? (isRTL ? "أسبوع" : "WEEK") : (isRTL ? "شهر" : "MONTH")}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary Matrix ── */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: isRTL ? "حاضر" : "PRESENT", val: stats.present, color: "text-success", bg: "bg-success-soft" },
            { label: isRTL ? "متأخر" : "LATE", val: stats.late, color: "text-warning", bg: "bg-warning-soft" },
            { label: isRTL ? "غائب" : "ABSENT", val: stats.absent, color: "text-danger", bg: "bg-danger-soft" },
          ].map((m, idx) => (
            <div key={idx} className="premium-card p-5 text-center">
              <p className={cn("text-3xl font-black tracking-tighter mb-1", m.color)}>{m.val}</p>
              <p className="text-[10px] font-black text-[#9ca3af] uppercase tracking-widest">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Visual Insights ── */}
      {!loading && chartData.length > 0 && (
        <div className="premium-card p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-[#6b7280] uppercase tracking-widest">{isRTL ? "ساعات العمل اليومية" : "DAILY SESSION HOURS"}</h3>
            <div className="bg-[#fff1e8] px-2 py-1 rounded-md text-[#ff5a00] text-[9px] font-black uppercase tracking-tighter">
              {period === "week" ? (isRTL ? "آخر 7 أيام" : "Last 7 Days") : (isRTL ? "آخر 30 يوم" : "Last 30 Days")}
            </div>
          </div>
          <div className="h-48 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={period === "week" ? 24 : 8}>
                <XAxis dataKey="day" tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={25} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9', radius: 4 }}
                  contentStyle={{ borderRadius: 8, border: "1px solid #eeeeee", boxShadow: "none", fontSize: 11, fontWeight: 800 }}
                />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={barColor(entry.status)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Detailed History ── */}
      <div className="space-y-6">
        <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest px-1">{isRTL ? "قائمة السجلات" : "HISTORY LIST"}</h3>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest animate-pulse">{isRTL ? "جاري التحميل..." : "Loading History..."}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="premium-card py-20 flex flex-col items-center justify-center text-muted-foreground gap-4 border-dashed">
            <CalendarDays className="w-12 h-12 opacity-10" />
            <p className="text-xs font-black uppercase tracking-widest">{isRTL ? "لا توجد سجلات" : "No records found"}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((r) => (
              <div key={r.id} className="premium-card p-5 flex items-center justify-between group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "w-12 h-12 rounded-md flex flex-col items-center justify-center",
                    r.status === 'present' ? "bg-success-soft text-success" : r.status === 'late' ? "bg-warning-soft text-warning" : "bg-danger-soft text-danger"
                  )}>
                    <span className="text-[10px] font-black uppercase leading-none opacity-60">
                      {new Date(r.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short' })}
                    </span>
                    <span className="text-lg font-black leading-none mt-1">
                      {new Date(r.date).getDate()}
                    </span>
                  </div>
                  
                  <div>
                    <p className="text-[13px] font-black text-foreground tracking-tight">
                      {new Date(r.date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { weekday: "long" })}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {r.check_in && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-muted rounded-lg border border-border/50">
                          <span className="text-[9px] font-black text-muted-foreground opacity-60">IN</span>
                          <span className="text-[10px] font-bold text-foreground">{formatTime(r.check_in)}</span>
                        </div>
                      )}
                      {r.working_hours && (
                        <div className="flex items-center gap-1 text-[11px] font-black text-primary">
                          <Clock className="w-3.5 h-3.5" />
                          {r.working_hours}h
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md border",
                    statusColor(r.status),
                    r.status === 'present' ? "border-success/10" : r.status === 'late' ? "border-warning/10" : "border-danger/10"
                  )}>
                    {r.status === "present" ? (isRTL ? "حاضر" : "Present") : r.status === "late" ? (isRTL ? "متأخر" : "Late") : (isRTL ? "غائب" : "Absent")}
                  </span>
                  {r.late_minutes > 0 && (
                    <div className="flex items-center gap-1 text-warning">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-black">{r.late_minutes}{isRTL ? "د" : "m"}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
