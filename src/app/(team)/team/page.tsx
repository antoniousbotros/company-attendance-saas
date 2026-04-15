"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useTeam } from "./layout";
import { LogIn, LogOut, MapPin, AlertTriangle, RefreshCw, TrendingUp, TrendingDown, Clock } from "lucide-react";
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

  // Period-filtered records
  const filteredRecords = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - (period === "week" ? 7 : 30));
    return records.filter((r) => new Date(r.date) >= cutoff);
  }, [records, period]);

  // Chart data
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

  // Stats
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
        // No GPS — try IP fallback
        getLocationFromIP().then(resolve).catch(() => reject(new Error("NOT_SUPPORTED")));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          if (err.code === 1) {
            reject(new Error("PERMISSION_DENIED"));
          } else {
            // GPS unavailable or timeout — try IP fallback
            getLocationFromIP().then(resolve).catch(() => reject(new Error("POSITION_UNAVAILABLE")));
          }
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    });

  const handleAttendance = async (type: "check-in" | "check-out") => {
    setActionLoading(true);
    setActionResult(null);
    setLocationError("");

    try {
      let body: any = {};
      if (geofencing) {
        try { body = await getLocation(); }
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
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Header */}
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
        <button onClick={loadData} className="w-9 h-9 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#6b7280] hover:text-[#111] transition-all">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Period Selector */}
      <div className="flex bg-white rounded-full p-1 shadow-sm w-fit">
        {(["week", "month"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "px-5 py-1.5 rounded-full text-xs font-bold transition-all",
              period === p ? "bg-[#ff5a00] text-white shadow-sm" : "text-[#6b7280]"
            )}
          >
            {p === "week" ? (isRTL ? "أسبوع" : "Week") : (isRTL ? "شهر" : "Month")}
          </button>
        ))}
      </div>

      {/* Performance Card */}
      {!loading && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs font-semibold text-[#6b7280] mb-1">
            {isRTL ? "نسبة الحضور" : "Attendance Rate"}
          </p>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-black text-[#111]">{stats.onTimeRate}%</span>
            <span className={cn("text-xs font-bold flex items-center gap-0.5", stats.onTimeRate >= 80 ? "text-[#1e8e3e]" : "text-[#b91c1c]")}>
              {stats.onTimeRate >= 80 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {stats.onTime}/{stats.total} {isRTL ? "يوم" : "days"}
            </span>
          </div>

          {chartData.length > 0 && (
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={period === "week" ? 24 : 8}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={25} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 12 }}
                    labelStyle={{ fontWeight: 700 }}
                  />
                  <Bar dataKey="hours" fill="#ff5a00" radius={[4, 4, 0, 0]} name={isRTL ? "ساعات" : "Hours"} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-[10px] font-bold text-[#9ca3af] uppercase">{isRTL ? "حضور منتظم" : "On Time"}</p>
            <p className="text-2xl font-black text-[#1e8e3e] mt-1">{stats.onTime}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-[10px] font-bold text-[#9ca3af] uppercase">{isRTL ? "تأخير" : "Late"}</p>
            <p className="text-2xl font-black text-[#b91c1c] mt-1">{stats.late}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-[10px] font-bold text-[#9ca3af] uppercase">{isRTL ? "متوسط الساعات" : "Avg Hours"}</p>
            <p className="text-2xl font-black text-[#111] mt-1">{stats.avgHours}h</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-[10px] font-bold text-[#9ca3af] uppercase">{isRTL ? "مهام معلقة" : "Pending Tasks"}</p>
            <p className="text-2xl font-black text-[#ff5a00] mt-1">{taskCount}</p>
          </div>
        </div>
      )}

      {/* Check In/Out Card */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-3 mb-3">
          <Clock className="w-5 h-5 text-[#ff5a00]" />
          <p className="text-sm font-bold text-[#111]">{isRTL ? "حضور اليوم" : "Today"}</p>
          {geofencing && (
            <span className="text-[9px] text-[#9ca3af] flex items-center gap-0.5 ms-auto">
              <MapPin className="w-3 h-3" /> {isRTL ? "موقع مطلوب" : "Location required"}
            </span>
          )}
        </div>

        {todayRecord && (
          <div className="flex gap-4 mb-3 text-sm">
            {todayRecord.check_in && (
              <div>
                <span className="text-[9px] font-bold text-[#9ca3af] uppercase">{isRTL ? "حضور" : "In"}</span>
                <p className="font-bold text-[#111]">{formatTime(todayRecord.check_in)}</p>
              </div>
            )}
            {todayRecord.check_out && (
              <div>
                <span className="text-[9px] font-bold text-[#9ca3af] uppercase">{isRTL ? "انصراف" : "Out"}</span>
                <p className="font-bold text-[#111]">{formatTime(todayRecord.check_out)}</p>
              </div>
            )}
            {todayRecord.working_hours && (
              <div>
                <span className="text-[9px] font-bold text-[#9ca3af] uppercase">{isRTL ? "ساعات" : "Hours"}</span>
                <p className="font-bold text-[#111]">{todayRecord.working_hours}h</p>
              </div>
            )}
            {todayRecord.status === "late" && (
              <div className="flex items-center gap-1 text-[#b45309] text-xs font-bold ms-auto">
                <AlertTriangle className="w-3 h-3" />
                {todayRecord.late_minutes}{isRTL ? "د" : "m"}
              </div>
            )}
          </div>
        )}

        {actionResult && (
          <div className={cn("p-3 rounded-xl text-xs font-semibold mb-3", actionResult.ok ? "bg-[#e6f6ec] text-[#1e8e3e]" : "bg-[#fef2f2] text-[#b91c1c]")}>
            {actionResult.message}
          </div>
        )}
        {locationError && (
          <div className="bg-[#fdf4d8] text-[#b45309] p-3 rounded-xl text-xs font-semibold mb-3">{locationError}</div>
        )}

        {shiftDone ? (
          <div className="text-center py-2 text-sm font-bold text-[#1e8e3e]">
            {isRTL ? "تم إنهاء الوردية" : "Shift completed"}
          </div>
        ) : (
          <div className="flex gap-3">
            {!hasCheckedIn && (
              <button
                onClick={() => handleAttendance("check-in")}
                disabled={actionLoading}
                className="flex-1 bg-[#1e8e3e] text-white font-black py-3 rounded-xl hover:bg-[#16753b] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogIn className="w-4 h-4" /> {isRTL ? "تسجيل حضور" : "Check In"}</>}
              </button>
            )}
            {hasCheckedIn && !hasCheckedOut && (
              <button
                onClick={() => handleAttendance("check-out")}
                disabled={actionLoading}
                className="flex-1 bg-[#b91c1c] text-white font-black py-3 rounded-xl hover:bg-[#991b1b] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogOut className="w-4 h-4" /> {isRTL ? "تسجيل انصراف" : "Check Out"}</>}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
