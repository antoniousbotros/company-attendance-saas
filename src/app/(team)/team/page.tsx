"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useTeam } from "./layout";
import { LogIn, LogOut, MapPin, AlertTriangle, RefreshCw, TrendingUp, TrendingDown, Clock, CheckSquare, Megaphone, BarChart3 } from "lucide-react";
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
  const isPreGrantedWfh = todayRecord && !todayRecord.check_in && todayRecord.day_type === "wfh";
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
      let body: any = { dayType: isPreGrantedWfh ? "wfh" : dayType };
      const isWfh = isPreGrantedWfh || (dayType === "wfh" && company?.enable_wfh);
      
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="lg:grid lg:grid-cols-5 lg:gap-8 space-y-8 lg:space-y-0">
        {/* ── Dashboard Grid ── */}

        {/* ── Left Column (3/5): Performance ── */}
        <div className="lg:col-span-3 space-y-8">

          {/* Performance Insight Card */}
          <div className="premium-card p-6 md:p-8 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl transition-colors group-hover:bg-primary/10" />
            
            <div className="flex items-start justify-between relative z-10 mb-8">
              <div>
                <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-2">
                  {isRTL ? "تحليل الحضور" : "Attendance Insights"}
                </h3>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black text-foreground tracking-tighter">
                    {loading ? "—" : `${stats.onTimeRate}%`}
                  </span>
                  {!loading && (
                    <div className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-black flex items-center gap-1",
                      stats.onTimeRate >= 80 ? "bg-success-soft text-success border border-success/10" : "bg-danger-soft text-danger border border-danger/10"
                    )}>
                      {stats.onTimeRate >= 80 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {stats.onTime}/{stats.total} {isRTL ? "يوم" : "DAYS"}
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-[#f5f5f5] p-2 rounded-md text-[#6b7280] font-bold text-[10px] uppercase tracking-wider">
                {period === "week" ? (isRTL ? "آخر 7 أيام" : "Last 7 Days") : (isRTL ? "آخر 30 يوم" : "Last 30 Days")}
              </div>
            </div>

            <div className="relative z-10">
              {!loading && chartData.length > 0 ? (
                <div className="h-56 -ml-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={period === "week" ? 32 : 12}>
                      <XAxis 
                        dataKey="day" 
                        tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <YAxis 
                        tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} 
                        axisLine={false} 
                        tickLine={false} 
                        width={30}
                      />
                      <Tooltip
                        cursor={{ fill: '#f5f5f5', radius: 4 }}
                        contentStyle={{ 
                          borderRadius: 8, 
                          border: "1px solid #eeeeee", 
                          boxShadow: "none", 
                          fontSize: 11,
                          fontWeight: 800,
                          padding: "8px 12px"
                        }}
                      />
                      <Bar 
                        dataKey="hours" 
                        fill="#ff5a00" 
                        radius={[4, 4, 0, 0]} 
                        name={isRTL ? "ساعات" : "Hours"} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : !loading ? (
                <div className="h-56 flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <BarChart3 className="w-12 h-12 opacity-10" />
                  <p className="text-xs font-bold uppercase tracking-widest">{isRTL ? "لا توجد بيانات متاحة" : "No data available yet"}</p>
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-[#ff5a00]/10 border-t-[#ff5a00] rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Core Metrics Grid */}
          {!loading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: isRTL ? "حضور منتظم" : "ON TIME", val: stats.onTime, color: "text-success", bg: "bg-success-soft" },
                { label: isRTL ? "تأخير" : "LATE", val: stats.late, color: "text-danger", bg: "bg-danger-soft" },
                { label: isRTL ? "متوسط الساعات" : "AVG HOURS", val: `${stats.avgHours}h`, color: "text-[#111]", bg: "bg-[#f5f5f5]" },
                { label: isRTL ? "مهام معلقة" : "PENDING", val: taskCount, color: "text-[#ff5a00]", bg: "bg-[#fff1e8]" },
              ].map((m, idx) => (
                <div key={idx} className="premium-card p-5 group">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 transition-colors group-hover:text-primary">
                    {m.label}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={cn("text-3xl font-black tracking-tighter", m.color)}>{m.val}</span>
                  <div className={cn("w-1 h-4 bg-[#eeeeee] rounded-full", m.bg)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right Column (2/5): Actions ── */}
        <div className="lg:col-span-2 flex flex-col gap-8">

          {/* Today's High-Impact Attendance Card */}
          <div className="premium-card p-6 flex-1 flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Clock className="w-24 h-24 rotate-12" />
            </div>

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-[#ff5a00]/10 rounded-md flex items-center justify-center text-[#ff5a00] border border-[#ff5a00]/10">
                  <Clock className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground tracking-tight">{isRTL ? "حضور اليوم" : "DAILY LOG"}</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {new Date().toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
              {geofencing && (
                <div className="bg-[#fff1e8] px-2 py-1 rounded-md flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-[#ff5a00]" />
                  <span className="text-[9px] font-black text-[#ff5a00] uppercase">{isRTL ? "موقع نشط" : "LIVE GPS"}</span>
                </div>
              )}
            </div>

            {/* Today's Activity Timeline */}
            {todayRecord && (
              <div className="grid grid-cols-2 gap-3 mb-8 relative z-10">
                {todayRecord.check_in && (
                  <div className="bg-[#fcfcfc] rounded-md p-4 border border-[#eeeeee]">
                    <p className="text-[10px] font-black text-[#9ca3af] uppercase tracking-widest mb-1">{isRTL ? "دخول" : "CHECK IN"}</p>
                    <p className="text-xl font-black text-[#111]">{formatTime(todayRecord.check_in)}</p>
                  </div>
                )}
                {todayRecord.check_out && (
                  <div className="bg-[#fcfcfc] rounded-md p-4 border border-[#eeeeee]">
                    <p className="text-[10px] font-black text-[#9ca3af] uppercase tracking-widest mb-1">{isRTL ? "خروج" : "CHECK OUT"}</p>
                    <p className="text-xl font-black text-[#111]">{formatTime(todayRecord.check_out)}</p>
                  </div>
                )}
                {!todayRecord.check_out && todayRecord.working_hours && (
                  <div className="col-span-2 bg-[#fff1e8] rounded-md p-4 border border-[#ff5a00]/10 flex items-center justify-between">
                    <span className="text-[11px] font-black text-[#ff5a00] uppercase tracking-widest">{isRTL ? "مدة العمل الحالية" : "SESSION DURATION"}</span>
                    <span className="text-xl font-black text-[#ff5a00]">{todayRecord.working_hours}h</span>
                  </div>
                )}
              </div>
            )}

            {/* Feedback Messages */}
            {actionResult && (
              <div className={cn(
                "p-4 rounded-md text-[10px] font-black uppercase tracking-widest mb-6 animate-in zoom-in-95 duration-300 border", 
                actionResult.ok ? "bg-success-soft text-success border-success/10" : "bg-danger-soft text-danger border-danger/10"
              )}>
                <div className="flex items-center gap-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full animate-ping", actionResult.ok ? "bg-success" : "bg-danger")} />
                  {actionResult.message}
                </div>
              </div>
            )}
            
            {locationError && (
              <div className="bg-warning-soft text-warning p-4 rounded-md text-[10px] font-black uppercase tracking-widest mb-6 border border-warning/10 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>{locationError}</p>
              </div>
            )}

            {/* Primary Action Button */}
            <div className="mt-auto relative z-10">
              {shiftDone ? (
                <div className="w-full py-6 rounded-md bg-success-soft text-success border border-dashed border-success/30 flex flex-col items-center justify-center gap-2">
                  <TrendingUp className="w-8 h-8" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{isRTL ? "اكتمل يومك بنجاح" : "Shift Completed"}</span>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {!hasCheckedIn && !wfhModal && (
                    <button
                      onClick={() => {
                          if (isPreGrantedWfh) handleAttendance("check-in", "wfh");
                          else if (company?.enable_wfh) setWfhModal(true);
                          else handleAttendance("check-in");
                      }}
                      disabled={actionLoading}
                      className="w-full bg-[#ff5a00] text-white font-black py-4 rounded-md shadow-lg shadow-[#ff5a00]/10 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                    >
                      <div className="flex items-center justify-center gap-3">
                        {actionLoading
                          ? <RefreshCw className="w-5 h-5 animate-spin" />
                          : <><LogIn className="w-5 h-5 stroke-[3]" /> <span className="text-lg">{isRTL ? "تسجيل دخول" : "CHECK IN"}</span></>}
                      </div>
                    </button>
                  )}
                  
                  {!hasCheckedIn && wfhModal && (
                     <div className="flex gap-3">
                        <button
                          onClick={() => handleAttendance("check-in", "office")}
                          disabled={actionLoading}
                          className="flex-1 bg-[#ff5a00] text-white font-black py-5 rounded-md hover:scale-[1.01] transition-all flex flex-col items-center justify-center disabled:opacity-50 gap-1"
                        >
                           <span className="text-xl">🏢</span>
                           <span className="text-[10px] uppercase tracking-widest">{isRTL ? "المكتب" : "OFFICE"}</span>
                        </button>
                        <button
                          onClick={() => handleAttendance("check-in", "wfh")}
                          disabled={actionLoading}
                          className="flex-1 bg-[#111] text-white font-black py-5 rounded-md hover:scale-[1.01] transition-all flex flex-col items-center justify-center disabled:opacity-50 gap-1"
                        >
                           <span className="text-xl">🏠</span>
                           <span className="text-[10px] uppercase tracking-widest">{isRTL ? "المنزل" : "WFH"}</span>
                        </button>
                     </div>
                  )}

                  {hasCheckedIn && !hasCheckedOut && (
                    <button
                      onClick={() => handleAttendance("check-out")}
                      disabled={actionLoading}
                      className="w-full bg-[#dc2626] text-white font-black py-4 rounded-md shadow-lg shadow-[#dc2626]/10 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                    >
                      <div className="flex items-center justify-center gap-3">
                        {actionLoading
                          ? <RefreshCw className="w-5 h-5 animate-spin" />
                          : <><LogOut className="w-5 h-5 stroke-[3]" /> <span className="text-lg">{isRTL ? "تسجيل انصراف" : "CHECK OUT"}</span></>}
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Nav: Tasks & Announcements */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/team/tasks" className="premium-card p-6 flex flex-col gap-4 group transition-all hover:border-[#ff5a00]/20">
              <div className="w-12 h-12 bg-[#fff1e8] rounded-md flex items-center justify-center text-[#ff5a00] border border-[#ff5a00]/10 group-hover:scale-110 transition-transform duration-500">
                <CheckSquare className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#6b7280] uppercase tracking-widest mb-1 group-hover:text-[#ff5a00] transition-colors">
                  {isRTL ? "المهام" : "TASKS"}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-[#111] tracking-tighter">{taskCount}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ff5a00] animate-pulse" />
                </div>
              </div>
            </Link>
            
            <Link href="/team/announcements" className="premium-card p-6 flex flex-col gap-4 group transition-all hover:border-[#ff5a00]/20">
              <div className="w-12 h-12 bg-[#fff1e8] rounded-md flex items-center justify-center text-[#ff5a00] border border-[#ff5a00]/10 group-hover:scale-110 transition-transform duration-500">
                <Megaphone className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#6b7280] uppercase tracking-widest mb-1 group-hover:text-[#ff5a00] transition-colors">
                  {isRTL ? "الإعلانات" : "NEWS"}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-[#111] tracking-tighter">{announcementCount}</span>
                  {announcementCount > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ff5a00] animate-pulse" />
                  )}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
