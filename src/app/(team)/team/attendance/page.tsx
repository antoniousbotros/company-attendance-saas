"use client";

import React, { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

export default function TeamAttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/team/attendance/history")
      .then((r) => r.json())
      .then((data) => {
        setRecords(data.records || []);
        setLoading(false);
      });
  }, []);

  const statusColor = (status: string) => {
    if (status === "present") return "bg-[#e6f6ec] text-[#1e8e3e]";
    if (status === "late") return "bg-[#fdf4d8] text-[#b45309]";
    return "bg-[#fef2f2] text-[#b91c1c]";
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", {
      timeZone: "Africa/Cairo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-[#ff5a00]" />
        <h1 className="text-xl font-black text-[#111]">Attendance History</h1>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-[#6b7280]">Loading...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-sm text-[#6b7280]">No attendance records yet.</div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-[#e0e0e0] p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-bold text-[#111]">
                  {new Date(r.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <div className="flex gap-3 mt-1 text-xs text-[#6b7280] font-medium">
                  {r.check_in && <span>In: {formatTime(r.check_in)}</span>}
                  {r.check_out && <span>Out: {formatTime(r.check_out)}</span>}
                  {r.working_hours && <span>{r.working_hours}h</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {r.late_minutes > 0 && (
                  <span className="text-[10px] font-bold text-[#b45309]">
                    {r.late_minutes}m late
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${statusColor(r.status)}`}
                >
                  {r.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
