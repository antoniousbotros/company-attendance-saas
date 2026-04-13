"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Filter, FileDown, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AttendancePage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("attendance")
      .select("*, employees(name)")
      .order("date", { ascending: false });
    if (data) setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Logs</h1>
          <p className="text-zinc-400 mt-2">Historical view of all check-in and check-out activities.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2">
            <FileDown className="w-5 h-5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Employee</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Date</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Check In</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Check Out</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Duration</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-zinc-500 italic">
                  {loading ? "Loading..." : "No attendance records found yet."}
                </td>
              </tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4 font-medium text-zinc-200">{log.employees?.name}</td>
                <td className="px-6 py-4 text-zinc-500">{new Date(log.date).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className="text-zinc-200 font-medium">
                    {log.check_in ? new Date(log.check_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "-"}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-200 font-medium">
                  {log.check_out ? new Date(log.check_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "-"}
                </td>
                <td className="px-6 py-4 text-indigo-400 font-bold">
                  {log.working_hours ? `${log.working_hours}h` : "-"}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    log.status === 'present' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
