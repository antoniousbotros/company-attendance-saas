"use client";

import React, { useEffect, useState } from "react";
import { useTeam } from "./layout";
import { Clock, LogIn, LogOut, MapPin, AlertTriangle } from "lucide-react";

export default function TeamHomePage() {
  const { employee } = useTeam();
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [taskCount, setTaskCount] = useState(0);
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [locationError, setLocationError] = useState("");

  const company = employee?.companies;
  const geofencing = company?.enable_geofencing;

  const loadData = () => {
    Promise.all([
      fetch("/api/team/attendance/history").then((r) => r.json()),
      fetch("/api/team/tasks").then((r) => r.json()),
      fetch("/api/team/announcements").then((r) => r.json()),
    ]).then(([attRes, taskRes, annRes]) => {
      const today = new Date().toISOString().split("T")[0];
      const todayRec = (attRes.records || []).find((r: any) => r.date === today);
      setTodayRecord(todayRec || null);
      const activeTasks = (taskRes.tasks || []).filter((t: any) => t.status !== "completed");
      setTaskCount(activeTasks.length);
      setAnnouncementCount((annRes.announcements || []).length);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const getLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    setActionResult(null);
    setLocationError("");

    try {
      let body: any = {};
      if (geofencing) {
        try {
          body = await getLocation();
        } catch {
          setLocationError("Please enable location access to check in.");
          setActionLoading(false);
          return;
        }
      }

      const res = await fetch("/api/team/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.ok) {
        setActionResult({
          ok: true,
          message: `Checked in at ${data.time}${data.isLate ? ` (${data.lateMins} min late)` : ""}`,
        });
        loadData();
      } else {
        setActionResult({ ok: false, message: data.error });
      }
    } catch {
      setActionResult({ ok: false, message: "Connection error" });
    }
    setActionLoading(false);
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setActionResult(null);
    setLocationError("");

    try {
      let body: any = {};
      if (geofencing) {
        try {
          body = await getLocation();
        } catch {
          setLocationError("Please enable location access to check out.");
          setActionLoading(false);
          return;
        }
      }

      const res = await fetch("/api/team/attendance/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.ok) {
        setActionResult({
          ok: true,
          message: `Checked out at ${data.time}. Total: ${data.hours}h`,
        });
        loadData();
      } else {
        setActionResult({ ok: false, message: data.error });
      }
    } catch {
      setActionResult({ ok: false, message: "Connection error" });
    }
    setActionLoading(false);
  };

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const hasCheckedIn = !!todayRecord?.check_in;
  const hasCheckedOut = !!todayRecord?.check_out;
  const shiftDone = hasCheckedIn && hasCheckedOut;

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-black text-[#111]">
          {greeting}, {employee?.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-[#6b7280] font-medium">
          {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Check In/Out Card */}
      <div className="bg-white rounded-2xl border border-[#e0e0e0] p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#fff1e8] rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#ff5a00]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#111]">Today&apos;s Attendance</p>
            {geofencing && (
              <p className="text-[10px] text-[#6b7280] flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Location required
              </p>
            )}
          </div>
        </div>

        {/* Status */}
        {todayRecord && (
          <div className="flex gap-4 mb-4 text-sm">
            {todayRecord.check_in && (
              <div>
                <span className="text-[10px] font-bold text-[#6b7280] uppercase">In</span>
                <p className="font-bold text-[#111]">
                  {new Date(todayRecord.check_in).toLocaleTimeString("en-US", {
                    timeZone: "Africa/Cairo",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              </div>
            )}
            {todayRecord.check_out && (
              <div>
                <span className="text-[10px] font-bold text-[#6b7280] uppercase">Out</span>
                <p className="font-bold text-[#111]">
                  {new Date(todayRecord.check_out).toLocaleTimeString("en-US", {
                    timeZone: "Africa/Cairo",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              </div>
            )}
            {todayRecord.working_hours && (
              <div>
                <span className="text-[10px] font-bold text-[#6b7280] uppercase">Hours</span>
                <p className="font-bold text-[#111]">{todayRecord.working_hours}h</p>
              </div>
            )}
            {todayRecord.status === "late" && (
              <div className="flex items-center gap-1 text-[#b45309] text-xs font-bold">
                <AlertTriangle className="w-3 h-3" />
                {todayRecord.late_minutes}m late
              </div>
            )}
          </div>
        )}

        {/* Action Result */}
        {actionResult && (
          <div
            className={`p-3 rounded-lg text-xs font-semibold mb-4 ${
              actionResult.ok
                ? "bg-[#e6f6ec] text-[#1e8e3e] border border-[#1e8e3e]/20"
                : "bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]"
            }`}
          >
            {actionResult.message}
          </div>
        )}

        {locationError && (
          <div className="bg-[#fdf4d8] text-[#b45309] border border-[#b45309]/20 p-3 rounded-lg text-xs font-semibold mb-4">
            {locationError}
          </div>
        )}

        {/* Buttons */}
        {shiftDone ? (
          <div className="text-center py-3 text-sm font-bold text-[#1e8e3e]">
            Shift completed for today
          </div>
        ) : (
          <div className="flex gap-3">
            {!hasCheckedIn && (
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="flex-1 bg-[#1e8e3e] text-white font-black py-3.5 rounded-xl hover:bg-[#16753b] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" /> Check In
                  </>
                )}
              </button>
            )}
            {hasCheckedIn && !hasCheckedOut && (
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="flex-1 bg-[#b91c1c] text-white font-black py-3.5 rounded-xl hover:bg-[#991b1b] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogOut className="w-4 h-4" /> Check Out
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-[#e0e0e0] p-4">
            <p className="text-[10px] font-bold text-[#6b7280] uppercase">Pending Tasks</p>
            <p className="text-2xl font-black text-[#111] mt-1">{taskCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e0e0e0] p-4">
            <p className="text-[10px] font-bold text-[#6b7280] uppercase">Announcements</p>
            <p className="text-2xl font-black text-[#111] mt-1">{announcementCount}</p>
          </div>
        </div>
      )}
    </div>
  );
}
