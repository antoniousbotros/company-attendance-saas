"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useTeam } from "./layout";
import { LogIn, LogOut, MapPin, AlertTriangle, RefreshCw, TrendingUp, TrendingDown, Clock, CheckSquare, Megaphone } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

type Period = "week" | "month";

export default function TeamHomePage() {
  const { employee, isRTL, lang } = useTeam();
  const [records, setRecords] = useState<any[]>([]);
  const [taskCount, setTaskCount] = useState(0);
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [period, setPeriod] = useState<Period>("week");
  const [wfhModal, setWfhModal] = useState(false);

  const company = employee?.companies;
  const geofencing = company?.enable_geofencing;

  const loadData = () => {
    Promise.all([
      fetch("/api/team/attendance/history").then((r) => r.json()),
      fetch("/api/team/tasks").then((r) => r.json()),
      fetch("/api/team/announcements").then((r) => r.json()),
    ]).then(([attRes, taskRes, annRes]) => {
      setRecords(attRes.records || []);
      const activeTasks = (taskRes.tasks || []).filter((t: any) => t.status !== "completed");
      setTaskCount(activeTasks.length);
      setAnnouncementCount((annRes.announcements || []).length);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRecords = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - (period === "week" ? 7 : 30));
    return records.filter((r) => new Date(r.date) >= cutoff);
  }, [records, period]);

  const chartData = useMemo(() => {
    return filteredRecords
      .slice(0, period === "week" ? 7 : 30)
      .reverse()
      .map((r) => ({
        day: new Date(r.date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { weekday: "short" }),
        hours: r.working_hours || 0,
        late: r.late_minutes || 0,
      }));
  }, [filteredRecords, period, lang]);

  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const onTime = filteredRecords.filter((r) => r.status === "present").length;
    const late = filteredRecords.filter((r) => r.status === "late").length;
    const avgHours = total > 0
      ? Math.round((filteredRecords.reduce((a, r) => a + (r.working_hours || 0), 0) / total) * 10) / 10
      : 0;
    const onTimeRate = total > 0 ? Math.round((onTime / total) * 100) : 0;
    return { total, onTime, late, avgHours, onTimeRate };
  }, [filteredRecords]);

  const today = new Date().toISOString().split("T")[0];
  const todayRecord = records.find((r) => r.date === today);
  const hasCheckedIn = !!todayRecord?.check_in;
  const hasCheckedOut = !!todayRecord?.check_out;
  const shiftDone = hasCheckedIn && hasCheckedOut;

  const getLocationFromIP = async (): Promise<{ lat: number; lng: number }> => {
    const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
    const data = await res.json();
    if (data.latitude && data.longitude) {
      return { lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) };
    }
    throw new Error("IP_FAILED");
  };

  const getLocation = (): Promise<{ lat: number; lng: number }> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        getLocationFromIP().then(resolve).catch(() => reject(new Error("NOT_SUPPORTED")));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          if (err.code === 1) {
            reject(new Error("PERMISSION_DENIED"));
          } else {
            getLocationFromIP().then(resolve).catch(() => reject(new Error("POSITION_UNAVAILABLE")));
          }
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    });

  const handleAttendance = async (type: "check-in" | "check-out", dayType: "office" | "wfh" = "office") => {
    setActionLoading(true);
    setActionResult(null);
    setLocationError("");
    setWfhModal(false);

    try {
      let body: any = { dayType };
      const isWfh = dayType === "wfh" && company?.enable_wfh;
      
      if (!isWfh && geofencing) {
        try { 
           const loc = await getLocation(); 
           body.lat = loc.lat;
           body.lng = loc.lng;
        }
        catch (locErr: any) {
          const msg = locErr?.message;
          if (msg === "NOT_SUPPORTED") {
            setLocationError(isRTL ? "المتصفح لا يدعم تحديد الموقع." : "Browser does not support geolocation.");
          } else if (msg === "PERMISSION_DENIED") {
            setLocationError(isRTL
              ? "تم رفض الموقع. اذهب إلى: الإعدادات ← الخصوصية ← خدمات الموقع ← تفعيل Safari"
              : "Location denied. Go to: Settings → Privacy → Location Services → enable for Safari");
          } else if (msg === "POSITION_UNAVAILABLE") {
            setLocationError(isRTL ? "تعذر تحديد الموقع. تأكد من تفعيل خدمات الموقع." : "Location unavailable. Enable Location Services in Settings.");
          } else {
            setLocationError(isRTL ? "انتهت مهلة تحديد الموقع. حاول مرة أخرى في مكان مفتوح." : "Location timed out. Try again in an open area.");
          }
          setActionLoading(false); return;
        }
      }
      const res = await fetch(`/api/team/attendance/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        const msg = type === "check-in"
          ? `${isRTL ? "تم تسجيل الحضور" : "Checked in at"} ${data.time}${data.isLate ? ` (${data.lateMins} ${isRTL ? "د تأخير" : "min late"})` : ""}`
          : `${isRTL ? "تم تسجيل الانصراف" : "Checked out at"} ${data.time} — ${data.hours}h`;
        setActionResult({ ok: true, message: msg });
        loadData();
      } else {
        setActionResult({ ok: false, message: data.error });
      }
    } catch {
      setActionResult({ ok: false, message: isRTL ? "خطأ في الاتصال" : "Connection error" });
    }
    setActionLoading(false);
  };

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? (isRTL ? "صباح الخير" : "Good morning") : hour < 18 ? (isRTL ? "مساء الخير" : "Good afternoon") : (isRTL ? "مساء الخير" : "Good evening");

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-US", {
      timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hour12: true,
    });

  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {/* ── Top row: greeting + period selector ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {employee?.companies?.logo_url ? (
            <img src={employee.companies.logo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 bg-[#ff5a00] rounded-full flex items-center justify-center text-white font-black text-sm">
              {employee?.name?.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-[11px] text-[#9ca3af] font-medium">{greeting}</p>
            <h1 className="text-lg font-black text-[#111] leading-tight">{employee?.name?.split(" ")[0]}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Period pills */}
          <div className="flex bg-white rounded-full p-1 shadow-sm border border-[#f0f0f0]">
            {(["week", "month"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                  period === p ? "bg-[#ff5a00] text-white shadow-sm" : "text-[#6b7280] hover:text-[#111]"
                )}
              >
                {p === "week" ? (isRTL ? "أسبوع" : "Week") : (isRTL ? "شهر" : "Month")}
              </button>
            ))}
          </div>
          <button
            onClick={loadData}
            className="w-9 h-9 bg-white rounded-full shadow-sm border border-[#f0f0f0] flex items-center justify-center text-[#6b7280] hover:text-[#111] transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Desktop: 2-column main area / Mobile: stacked ── */}
      <div className="lg:grid lg:grid-cols-5 lg:gap-5 space-y-5 lg:space-y-0">

        {/* ── Left (3/5): Chart + Stats ── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Performance card */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#f0f0f0] p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-[#9ca3af] mb-1">
                  {isRTL ? "نسبة الحضور" : "Attendance Rate"}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-[#111]">{loading ? "—" : `${stats.onTimeRate}%`}</span>
                  {!loading && (
                    <span className={cn("text-xs font-bold flex items-center gap-0.5", stats.onTimeRate >= 80 ? "text-[#1e8e3e]" : "text-[#b91c1c]")}>
                      {stats.onTimeRate >= 80 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {stats.onTime}/{stats.total} {isRTL ? "يوم" : "days"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!loading && chartData.length > 0 ? (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={period === "week" ? 28 : 10}>
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", fontSize: 12 }}
                      labelStyle={{ fontWeight: 700 }}
                    />
                    <Bar dataKey="hours" fill="#ff5a00" radius={[4, 4, 0, 0]} name={isRTL ? "ساعات" : "Hours"} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : !loading ? (
              <div className="h-44 flex items-center justify-center text-sm text-[#9ca3af]">
                {isRTL ? "لا توجد بيانات" : "No data yet"}
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#ff5a00]/20 border-t-[#ff5a00] rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Stats 4-grid */}
          {!loading && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl border border-[#f0f0f0] shadow-sm p-4">
                <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wide mb-1">
                  {isRTL ? "حضور منتظم" : "On Time"}
                </p>
                <p className="text-2xl font-black text-[#1e8e3e]">{stats.onTime}</p>
              </div>
              <div className="bg-white rounded-2xl border border-[#f0f0f0] shadow-sm p-4">
                <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wide mb-1">
                  {isRTL ? "تأخير" : "Late"}
                </p>
                <p className="text-2xl font-black text-[#b91c1c]">{stats.late}</p>
              </div>
              <div className="bg-white rounded-2xl border border-[#f0f0f0] shadow-sm p-4">
                <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wide mb-1">
                  {isRTL ? "متوسط الساعات" : "Avg Hours"}
                </p>
                <p className="text-2xl font-black text-[#111]">{stats.avgHours}h</p>
              </div>
              <div className="bg-white rounded-2xl border border-[#f0f0f0] shadow-sm p-4">
                <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wide mb-1">
                  {isRTL ? "مهام معلقة" : "Pending"}
                </p>
                <p className="text-2xl font-black text-[#ff5a00]">{taskCount}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right (2/5): Check-in card ── */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Today's attendance */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#f0f0f0] p-5 flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#fff4ee] rounded-xl flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#ff5a00]" />
                </div>
                <p className="text-sm font-bold text-[#111]">{isRTL ? "حضور اليوم" : "Today"}</p>
              </div>
              {geofencing && (
                <span className="text-[9px] text-[#9ca3af] flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" /> {isRTL ? "موقع مطلوب" : "Location required"}
                </span>
              )}
            </div>

            {/* Time pills */}
            {todayRecord && (
              <div className="flex flex-wrap gap-2 mb-4">
                {todayRecord.check_in && (
                  <div className="bg-[#f5f5f5] rounded-xl px-3 py-2">
                    <p className="text-[9px] font-bold text-[#9ca3af] uppercase">{isRTL ? "حضور" : "In"}</p>
                    <p className="text-sm font-black text-[#111]">{formatTime(todayRecord.check_in)}</p>
                  </div>
                )}
                {todayRecord.check_out && (
                  <div className="bg-[#f5f5f5] rounded-xl px-3 py-2">
                    <p className="text-[9px] font-bold text-[#9ca3af] uppercase">{isRTL ? "انصراف" : "Out"}</p>
                    <p className="text-sm font-black text-[#111]">{formatTime(todayRecord.check_out)}</p>
                  </div>
                )}
                {todayRecord.working_hours && (
                  <div className="bg-[#f5f5f5] rounded-xl px-3 py-2">
                    <p className="text-[9px] font-bold text-[#9ca3af] uppercase">{isRTL ? "ساعات" : "Hours"}</p>
                    <p className="text-sm font-black text-[#111]">{todayRecord.working_hours}h</p>
                  </div>
                )}
                {todayRecord.status === "late" && (
                  <div className="bg-[#fdf4d8] rounded-xl px-3 py-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-[#b45309]" />
                    <p className="text-sm font-black text-[#b45309]">{todayRecord.late_minutes}{isRTL ? "د" : "m"}</p>
                  </div>
                )}
              </div>
            )}

            {actionResult && (
              <div className={cn("p-3 rounded-xl text-xs font-semibold mb-4", actionResult.ok ? "bg-[#e6f6ec] text-[#1e8e3e]" : "bg-[#fef2f2] text-[#b91c1c]")}>
                {actionResult.message}
              </div>
            )}
            {locationError && (
              <div className="bg-[#fdf4d8] text-[#b45309] p-3 rounded-xl text-xs font-semibold mb-4">{locationError}</div>
            )}

            {shiftDone ? (
              <div className="text-center py-4 text-sm font-bold text-[#1e8e3e] bg-[#e6f6ec] rounded-xl">
                {isRTL ? "✓ تم إنهاء الوردية" : "✓ Shift completed"}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {!hasCheckedIn && !wfhModal && (
                  <button
                    onClick={() => {
                        if (company?.enable_wfh) setWfhModal(true);
                        else handleAttendance("check-in");
                    }}
                    disabled={actionLoading}
                    className="w-full bg-[#1e8e3e] text-white font-black py-3.5 rounded-xl hover:bg-[#16753b] transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                  >
                    {actionLoading
                      ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><LogIn className="w-4 h-4" /> {isRTL ? "تسجيل حضور" : "Check In"}</>}
                  </button>
                )}
                
                {!hasCheckedIn && wfhModal && (
                   <div className="flex gap-2">
                      <button
                        onClick={() => handleAttendance("check-in", "office")}
                        disabled={actionLoading}
                        className="flex-1 bg-[#1e8e3e] text-white font-black py-3.5 rounded-xl hover:bg-[#16753b] transition-all flex flex-col items-center justify-center disabled:opacity-50 text-xs"
                      >
                         🏢 {isRTL ? "المكتب" : "Office"}
                      </button>
                      <button
                        onClick={() => handleAttendance("check-in", "wfh")}
                        disabled={actionLoading}
                        className="flex-1 bg-black text-white font-black py-3.5 rounded-xl hover:bg-[#333] transition-all flex flex-col items-center justify-center disabled:opacity-50 text-xs"
                      >
                         🏠 {isRTL ? "المنزل" : "WFH"}
                      </button>
                   </div>
                )}
                {hasCheckedIn && !hasCheckedOut && (
                  <button
                    onClick={() => handleAttendance("check-out")}
                    disabled={actionLoading}
                    className="w-full bg-[#b91c1c] text-white font-black py-3.5 rounded-xl hover:bg-[#991b1b] transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                  >
                    {actionLoading
                      ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><LogOut className="w-4 h-4" /> {isRTL ? "تسجيل انصراف" : "Check Out"}</>}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick links: Tasks + Announcements */}
          <div className="grid grid-cols-2 gap-3">
            <a href="/team/tasks" className="bg-white rounded-2xl border border-[#f0f0f0] shadow-sm p-4 flex flex-col gap-2 hover:border-[#ff5a00]/30 transition-all group">
              <div className="w-8 h-8 bg-[#fff4ee] rounded-xl flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-[#ff5a00]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wide">
                  {isRTL ? "المهام" : "Tasks"}
                </p>
                <p className="text-xl font-black text-[#111]">{taskCount}</p>
              </div>
            </a>
            <a href="/team/announcements" className="bg-white rounded-2xl border border-[#f0f0f0] shadow-sm p-4 flex flex-col gap-2 hover:border-[#ff5a00]/30 transition-all group">
              <div className="w-8 h-8 bg-[#fff4ee] rounded-xl flex items-center justify-center">
                <Megaphone className="w-4 h-4 text-[#ff5a00]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wide">
                  {isRTL ? "الإعلانات" : "News"}
                </p>
                <p className="text-xl font-black text-[#111]">{announcementCount}</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
