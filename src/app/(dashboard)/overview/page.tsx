"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  Clock,
  TrendingUp,
  BarChart3,
  AlertCircle,
  Plus,
  Palette,
  LayoutGrid,
  CreditCard,
  ChevronLeft,
  ArrowUpRight,
  TrendingDown,
  CalendarDays,
  Bot
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

function StatCard({ name, value, trend, isUp, icon: Icon, colorClass, isRTL, unit }: any) {
  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all duration-500 group relative flex flex-col justify-between h-[180px]">
      <div className={cn("flex justify-between", isRTL ? "flex-row-reverse text-right" : "flex-row text-left")}>
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-900", colorClass)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className={isRTL ? "text-right" : "text-left"}>
           <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">{name}</span>
           <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{value}</span>
              {unit && <span className="text-sm font-black text-zinc-400 uppercase">{unit}</span>}
           </div>
        </div>
      </div>

      <div className={cn("flex items-end justify-between mt-auto", isRTL ? "flex-row-reverse" : "flex-row")}>
         <div className="flex items-end gap-1 h-10">
            {[30, 60, 45, 90, 50, 80, 70].map((h, i) => (
              <div 
                key={i} 
                className={cn(
                  "w-1.5 rounded-full transition-all duration-1000", 
                  colorClass.replace('text-', 'bg-'),
                  i === 6 ? "opacity-100" : "opacity-30"
                )} 
                style={{ height: `${h}%` }}
              />
            ))}
         </div>
         <div className={cn(
           "flex items-center gap-1 font-black text-[10px]",
           isUp ? "text-emerald-500" : "text-amber-500"
         )}>
            <span className="uppercase tracking-widest">{trend} {isRTL ? "مقارنة بالسابق" : "vs last month"}</span>
            {isUp ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
         </div>
      </div>
    </div>
  );
}

function ActionCard({ name, subtitle, icon: Icon, color, isRTL }: any) {
  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-[1.5rem] p-6 shadow-sm hover:shadow-md transition-all flex items-center gap-6 cursor-pointer group">
       <div className={cn(
         "w-10 h-10 rounded-full flex items-center justify-center transition-all group-hover:scale-110",
         isRTL ? "order-last" : "order-first",
         color
       )}>
          <Icon className="w-5 h-5" />
       </div>
       <div className={cn("flex-1", isRTL ? "text-right" : "text-left")}>
          <h4 className="text-sm font-black text-zinc-900 dark:text-white">{name}</h4>
          <p className="text-[10px] font-bold text-zinc-400 mt-0.5">{subtitle}</p>
       </div>
       <div className={cn("w-6 h-6 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-300 group-hover:text-indigo-600 transition-colors", isRTL ? "order-first" : "order-last")}>
          <ChevronLeft className={cn("w-4 h-4", !isRTL && "rotate-180")} />
       </div>
    </div>
  );
}

export default function OverviewPage() {
  const { t, isRTL } = useLanguage();
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
      setData({
        total: employees?.length || 0,
        present,
        late: attendance?.filter(a => a.status === 'late').length || 0,
        absent: (employees?.length || 0) - present,
        recent: attendance?.slice(0, 5) || []
      });
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Welcome Section */}
      <div className={cn("flex flex-col md:flex-row md:items-end justify-between gap-6", isRTL ? "md:flex-row-reverse" : "")}>
        <div className={isRTL ? "text-right" : "text-left"}>
           <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight italic">
             {t.welcome} <span className="text-[#0055FF] not-italic">European Cosmetics</span> 👋
           </h1>
           <p className="text-zinc-400 font-bold mt-2">{t.todayStatus}</p>
        </div>
        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl gap-1 h-fit">
           <button className="flex items-center gap-2 bg-[#0055FF] px-6 py-2.5 rounded-xl text-white font-black text-xs shadow-xl shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95">
              <Plus className="w-4 h-4" />
              {t.addEmployee}
           </button>
           <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-zinc-500 font-black text-xs hover:bg-zinc-200/50 transition-all">
              <BarChart3 className="w-4 h-4" />
              {isRTL ? "تصدير التقارير" : "Export Reports"}
           </button>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-5 rounded-3xl flex items-center justify-between group overflow-hidden relative">
         <div className={cn("flex items-center gap-5 relative z-10", isRTL ? "flex-row-reverse" : "")}>
            <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse">
               <AlertCircle className="w-6 h-6" />
            </div>
            <div className={isRTL ? "text-right" : "text-left"}>
               <div className="flex items-center gap-2">
                  <span className="text-rose-900 dark:text-rose-100 font-black text-[13px]">{t.lateAlert}</span>
                  <div className="flex gap-1">
                     <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">1 {isRTL ? "عالي" : "High"}</span>
                     <span className="bg-rose-100 text-rose-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">{data.late} {isRTL ? "متأخر" : "Late"}</span>
                  </div>
               </div>
               <p className="text-rose-600 text-[10px] font-bold mt-1">
                  {isRTL ? "يوجد موظفون يحتاجون مراجعة سجلات حضورهم اليوم." : "Several employees need attendance log review today."}
               </p>
            </div>
         </div>
         <button className="bg-rose-600 hover:bg-rose-700 text-white font-black px-6 py-3 rounded-2xl text-[11px] shadow-xl shadow-rose-600/20 transition-all z-10 flex items-center gap-2 group-hover:scale-105">
           {t.viewDetails}
           <ChevronLeft className={cn("w-4 h-4", !isRTL && "rotate-180")} />
         </button>
         <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-rose-500/5 to-transparent pointer-events-none" />
      </div>

      {/* Attendance Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard name={t.attendanceRate} value="94.2" unit="%" trend="58%" isUp={true} icon={TrendingUp} colorClass="text-[#0055FF]" isRTL={isRTL} />
        <StatCard name={t.totalCheckins} value={data.present} trend="77%" isUp={true} icon={CalendarDays} colorClass="text-amber-500" isRTL={isRTL} />
        <StatCard name={t.activeEmployees} value={data.total} trend="92%" isUp={true} icon={Users} colorClass="text-emerald-500" isRTL={isRTL} />
        <StatCard name={t.avgWorkHours} value="8.4" unit="Hrs" trend="79%" isUp={true} icon={Clock} colorClass="text-indigo-500" isRTL={isRTL} />
      </div>

      {/* Attendance Specific Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <ActionCard name={isRTL ? "إدارة الورديات" : "Manage Schedules"} subtitle={isRTL ? "قم بتعيين ساعات العمل والمناوبات لكل فريق." : "Set work hours and shifts for your team."} icon={CalendarDays} color="bg-indigo-50 text-indigo-600" isRTL={isRTL} />
         <ActionCard name={isRTL ? "إعدادات البوت" : "Telegram Bot Settings"} subtitle={isRTL ? "تحكم في رسائل الترحيب وتنبيهات الحضور." : "Configure welcome messages and alerts."} icon={Bot} color="bg-amber-50 text-amber-600" isRTL={isRTL} />
         <ActionCard name={isRTL ? "تقارير الأداء" : "Performance Reports"} subtitle={isRTL ? "حلل التزام الموظفين وساعات العمل الشهرية." : "Analyze commitment and monthly work hours."} icon={BarChart3} color="bg-rose-50 text-rose-600" isRTL={isRTL} />
      </div>

      {/* Attendance Statistics Chart Section */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
         <div className={cn("flex items-center justify-between mb-12", isRTL ? "flex-row-reverse" : "")}>
            <div className={isRTL ? "text-right" : "text-left"}>
               <h2 className="text-2xl font-black text-zinc-900 dark:text-white">{t.stats}</h2>
               <p className="text-zinc-500 text-sm font-bold">{t.statsSubtitle}</p>
            </div>
            <div className="flex bg-zinc-50 dark:bg-zinc-900 p-1 rounded-2xl gap-1">
               {['Year', 'Month', 'Week', 'Day'].map((label, i) => (
                 <button key={label} className={cn(
                   "px-5 py-2 rounded-xl text-xs font-black transition-all",
                   label === 'Month' ? "bg-[#0055FF] text-white shadow-xl shadow-indigo-600/30" : "text-zinc-400 hover:text-zinc-600"
                 )}>
                   {label || label}
                 </button>
               ))}
            </div>
         </div>

         {/* Bar Chart Visualization (Pure CSS/Tailwind) */}
         <div className="h-[300px] flex items-end justify-between gap-4 px-10 relative">
            <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
               {[100, 75, 50, 25, 0].map(v => (
                 <div key={v} className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-zinc-300 w-8">{v}%</span>
                    <div className="flex-1 h-[1px] bg-zinc-50 dark:bg-zinc-900" />
                 </div>
               ))}
            </div>
            
            {/* Attendance Percentage Bars */}
            {[80, 85, 90, 95, 88, 70, 92, 85, 88, 90, 85, 95].map((h, i) => (
               <div key={i} className="flex-1 flex flex-col items-center group cursor-pointer h-full justify-end relative z-10">
                  <div 
                    className={cn(
                      "w-full max-w-[40px] rounded-t-xl transition-all duration-1000",
                      i === 3 ? "bg-[#0055FF] shadow-2xl shadow-indigo-500/50" : "bg-[#F0F5FF] dark:bg-zinc-900/50 group-hover:bg-indigo-100"
                    )} 
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[9px] font-black text-zinc-400 mt-4 uppercase">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i % 7]}
                  </span>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
