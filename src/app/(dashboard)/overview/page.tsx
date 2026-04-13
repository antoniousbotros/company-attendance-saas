"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  Clock,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function OverviewPage() {
  const [data, setData] = useState({
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
    recent: [] as any[]
  });

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date().toISOString().split("T")[0];
      
      const { data: employees } = await supabase.from("employees").select("id");
      const { data: attendance } = await supabase.from("attendance")
        .select("*, employees(name)")
        .eq("date", today);

      const present = attendance?.length || 0;
      const late = attendance?.filter(a => a.status === 'late').length || 0;
      
      setData({
        total: employees?.length || 0,
        present,
        late,
        absent: (employees?.length || 0) - present,
        recent: attendance?.slice(0, 5) || []
      });
    };
    fetchData();
  }, []);

  const stats = [
    { 
      name: "Total Employees", 
      value: data.total.toString(), 
      icon: Users,
      color: "bg-blue-500/10 text-blue-500",
      change: "Active in system",
      trend: "neutral"
    },
    { 
      name: "Present Today", 
      value: data.present.toString(), 
      icon: UserCheck, 
      color: "bg-emerald-500/10 text-emerald-500",
      change: `${data.total ? Math.round((data.present/data.total)*100) : 0}% attendance`,
      trend: "up"
    },
    { 
      name: "Late Arrivals", 
      value: data.late.toString(), 
      icon: Clock, 
      color: "bg-amber-500/10 text-amber-500",
      change: "Marked as late",
      trend: "down"
    },
    { 
      name: "Absent", 
      value: data.absent.toString(), 
      icon: UserMinus, 
      color: "bg-rose-500/10 text-rose-500",
      change: "Pending log",
      trend: "neutral"
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-zinc-400 mt-2">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className={stat.color + " p-3 rounded-xl"}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-sm bg-zinc-800 px-2 py-1 rounded-lg text-zinc-400">
                {stat.trend === "up" ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : null}
                <span>{stat.change}</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-zinc-400 text-sm font-medium">{stat.name}</p>
              <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6">Recent Check-ins</h2>
          <div className="space-y-6">
            {data.recent.length === 0 ? (
              <p className="text-zinc-600 italic">No check-ins yet today.</p>
            ) : data.recent.map((log: any) => (
              <div key={log.id} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-indigo-400 uppercase">
                  {(log.employees?.name || "??").substring(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-zinc-100">{log.employees?.name}</p>
                  <p className="text-xs text-zinc-500 uppercase">{log.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-emerald-500">
                    {new Date(log.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Chart Placeholder */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-zinc-500 gap-4">
          <BarChart3 className="w-12 h-12 opacity-20" />
          <p>Attendance trends visualization will appear here</p>
        </div>
      </div>
    </div>
  );
}
