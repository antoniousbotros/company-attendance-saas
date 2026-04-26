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
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <CalendarDays className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">{isRTL ? "سجل الحضور" : "Attendance Log"}</h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{isRTL ? "عرض وتحليل أدائك" : "Review your performance"}</p>
          </div>
        </div>

        <div className="flex bg-muted/50 backdrop-blur-sm rounded-2xl p-1.5 border border-border/50 self-end md:self-auto">
          {(["week", "month"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-5 py-2 rounded-xl text-xs font-black transition-all duration-300",
                period === p 
                  ? "bg-white text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
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
            <div key={idx} className="premium-card p-5 text-center group">
              <p className={cn("text-3xl font-black tracking-tighter mb-1", m.color)}>{m.val}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{m.label}</p>
              <div className={cn("mt-3 h-1 w-8 mx-auto rounded-full opacity-30", m.bg)} />
            </div>
          ))}
        </div>
      )}

      {/* ── Visual Insights ── */}
      {!loading && chartData.length > 0 && (
        <div className="premium-card p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest">{isRTL ? "ساعات العمل اليومية" : "DAILY SESSION HOURS"}</h3>
            <div className="bg-primary/5 px-3 py-1 rounded-xl text-primary text-[10px] font-black uppercase tracking-tighter">
              {period === "week" ? (isRTL ? "آخر 7 أيام" : "Last 7 Days") : (isRTL ? "آخر 30 يوم" : "Last 30 Days")}
            </div>
          </div>
          <div className="h-48 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={period === "week" ? 24 : 8}>
                <XAxis dataKey="day" tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={25} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9', radius: 8 }}
                  contentStyle={{ borderRadius: 16, border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", fontSize: 11, fontWeight: 800 }}
                />
                <Bar dataKey="hours" radius={[6, 6, 2, 2]}>
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
                    "w-12 h-12 rounded-2xl flex flex-col items-center justify-center shadow-sm",
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
                    "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border",
                    statusColor(r.status),
                    r.status === 'present' ? "border-success/20" : r.status === 'late' ? "border-warning/20" : "border-danger/20"
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
