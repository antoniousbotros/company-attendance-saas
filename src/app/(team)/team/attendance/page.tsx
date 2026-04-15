"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useTeam } from "../layout";
import { CalendarDays } from "lucide-react";
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
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#ff5a00]" />
          <h1 className="text-lg font-black text-[#111]">{isRTL ? "سجل الحضور" : "Attendance"}</h1>
        </div>
        <div className="flex bg-white rounded-full p-1 shadow-sm">
          {(["week", "month"] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn("px-4 py-1 rounded-full text-[11px] font-bold transition-all", period === p ? "bg-[#ff5a00] text-white" : "text-[#6b7280]")}>
              {p === "week" ? (isRTL ? "أسبوع" : "Week") : (isRTL ? "شهر" : "Month")}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#e6f6ec] rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-[#1e8e3e]">{stats.present}</p>
            <p className="text-[9px] font-bold text-[#1e8e3e] uppercase">{isRTL ? "حاضر" : "Present"}</p>
          </div>
          <div className="bg-[#fdf4d8] rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-[#b45309]">{stats.late}</p>
            <p className="text-[9px] font-bold text-[#b45309] uppercase">{isRTL ? "متأخر" : "Late"}</p>
          </div>
          <div className="bg-[#fef2f2] rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-[#b91c1c]">{stats.absent}</p>
            <p className="text-[9px] font-bold text-[#b91c1c] uppercase">{isRTL ? "غائب" : "Absent"}</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {!loading && chartData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs font-bold text-[#6b7280] mb-3">{isRTL ? "ساعات العمل" : "Working Hours"}</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={period === "week" ? 20 : 6}>
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={20} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 11 }} />
                <Bar dataKey="hours" radius={[3, 3, 0, 0]} name={isRTL ? "ساعات" : "Hours"}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={barColor(entry.status)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Records List */}
      {loading ? (
        <div className="text-center py-12 text-sm text-[#6b7280]">{isRTL ? "جاري التحميل..." : "Loading..."}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-[#6b7280]">{isRTL ? "لا توجد سجلات حضور" : "No attendance records."}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#111]">
                  {new Date(r.date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { weekday: "short", month: "short", day: "numeric" })}
                </p>
                <div className="flex gap-3 mt-1 text-[11px] text-[#6b7280] font-medium">
                  {r.check_in && <span>{isRTL ? "حضور" : "In"}: {formatTime(r.check_in)}</span>}
                  {r.check_out && <span>{isRTL ? "انصراف" : "Out"}: {formatTime(r.check_out)}</span>}
                  {r.working_hours && <span>{r.working_hours}h</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {r.late_minutes > 0 && (
                  <span className="text-[9px] font-bold text-[#b45309]">{r.late_minutes}{isRTL ? "د" : "m"}</span>
                )}
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${statusColor(r.status)}`}>
                  {r.status === "present" ? (isRTL ? "حاضر" : "Present") : r.status === "late" ? (isRTL ? "متأخر" : "Late") : (isRTL ? "غائب" : "Absent")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
