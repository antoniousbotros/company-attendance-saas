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
      color: "bg-blue-500/10 text-blue-500 shadow-blue-500/20",
      change: "Active in system",
      trend: "neutral"
    },
    { 
      name: "Present Today", 
      value: data.present.toString(), 
      icon: UserCheck, 
      color: "bg-emerald-500/10 text-emerald-500 shadow-emerald-500/20",
      change: `${data.total ? Math.round((data.present/data.total)*100) : 0}% attendance`,
      trend: "up"
    },
    { 
      name: "Late Arrivals", 
      value: data.late.toString(), 
      icon: Clock, 
      color: "bg-amber-500/10 text-amber-500 shadow-amber-500/20",
      change: "Marked as late",
      trend: "down"
    },
    { 
      name: "Absent", 
      value: data.absent.toString(), 
      icon: UserMinus, 
      color: "bg-rose-500/10 text-rose-500 shadow-rose-500/20",
      change: "Pending log",
      trend: "neutral"
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Dashboard Overview</h1>
        <p className="text-zinc-500 mt-2 font-medium">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 hover:border-indigo-500/50 transition-all duration-300 shadow-sm shadow-zinc-200/50 dark:shadow-none">
            <div className="flex items-center justify-between mb-4">
              <div className={stat.color + " p-3 rounded-2xl shadow-sm"}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg text-zinc-500 dark:text-zinc-400">
                {stat.trend === "up" ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : null}
                <span>{stat.change}</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-zinc-400 dark:text-zinc-500 text-sm font-bold uppercase tracking-widest">{stat.name}</p>
              <h3 className="text-4xl font-black mt-2 tracking-tighter">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 shadow-sm shadow-zinc-200/50 dark:shadow-none">
          <h2 className="text-xl font-black mb-8">Recent Check-ins</h2>
          <div className="space-y-8">
            {data.recent.length === 0 ? (
              <p className="text-zinc-400 italic font-medium">No check-ins yet today.</p>
            ) : data.recent.map((log: any) => (
              <div key={log.id} className="flex items-center gap-5 group">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-lg text-indigo-500 uppercase transition-all group-hover:bg-indigo-600 group-hover:text-white">
                  {(log.employees?.name || "??").substring(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">{log.employees?.name}</p>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{log.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-indigo-600 dark:text-emerald-500">
                    {new Date(log.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Chart Placeholder */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 flex flex-col items-center justify-center text-zinc-400 gap-4 shadow-sm shadow-zinc-200/50 dark:shadow-none">
          <div className="w-20 h-20 rounded-full bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center">
            <BarChart3 className="w-10 h-10 opacity-20" />
          </div>
          <p className="font-bold text-sm uppercase tracking-widest opacity-50 text-center"> Attendance trends visualization <br/> will appear here</p>
        </div>
      </div>
    </div>
  );
}
