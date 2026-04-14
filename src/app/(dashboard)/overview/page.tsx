"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  Clock,
  TrendingUp,
  BarChart3,
  Search,
  Plus,
  ArrowUpRight,
  ArrowRight,
  MoreHorizontal,
  LucideIcon
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

function StatBlock({ name, value, trend, icon: Icon, isRTL, isUp }: any) {
  return (
    <div className="p-5 border border-zinc-100 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
      <div className={cn("flex items-center gap-3 mb-4", isRTL ? "flex-row-reverse" : "")}>
        <div className="w-8 h-8 rounded bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border border-zinc-100 dark:border-zinc-700">
           <Icon className="w-4 h-4 text-zinc-500" />
        </div>
        <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-tight">{name}</span>
      </div>
      <div className={cn("flex items-baseline gap-2", isRTL ? "flex-row-reverse" : "")}>
         <span className="text-3xl font-black tracking-tight">{value}</span>
         <div className={cn(
           "flex items-center text-[11px] font-bold",
           isUp ? "text-emerald-500" : "text-amber-500"
         )}>
           {trend}
           <ArrowUpRight className={cn("w-3 h-3", !isUp && "rotate-90")} />
         </div>
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
        recent: attendance?.slice(0, 10) || []
      });
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-5xl mx-auto w-full">
      {/* Title Section */}
      <div className={cn("border-b border-zinc-100 dark:border-zinc-800 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6", isRTL ? "text-right" : "text-left")}>
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white mb-2">{isRTL ? "لوحة التحكم" : "Dashboard Overview"}</h1>
          <p className="text-zinc-500 text-[15px] font-medium leading-relaxed max-w-xl">
            {isRTL ? "مرحباً بك في مساحة عمل حضور الموظفين. إليك ملخص سريع لنشاط اليوم والبيانات المسجلة." : "Welcome to your attendance workspace. Here is a brief overview of today's activity and recorded data."}
          </p>
        </div>
        <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black px-4 py-2 rounded-md transition-all hover:bg-zinc-800 dark:hover:bg-zinc-200 text-sm font-bold shadow-sm shadow-black/10 active:scale-95">
              <Plus className="w-4 h-4" />
              {t.addEmployee}
           </button>
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatBlock name={t.attendanceRate} value="94.2%" trend="+2.4%" icon={TrendingUp} isRTL={isRTL} isUp={true} />
        <StatBlock name={t.totalEmployees} value={data.total} trend="0%" icon={Users} isRTL={isRTL} isUp={true} />
        <StatBlock name={t.presentToday} value={data.present} trend="+8%" icon={UserCheck} isRTL={isRTL} isUp={true} />
        <StatBlock name={t.lateArrivals} value={data.late} trend="-5%" icon={Clock} isRTL={isRTL} isUp={false} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-4">
        {/* Recent Activity (Notion-style list) */}
        <div className={cn("lg:col-span-2 space-y-6", isRTL ? "text-right" : "text-left")}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-black">{t.recentCheckins}</h2>
            <button className="text-[12px] font-bold text-zinc-400 hover:text-zinc-600 flex items-center gap-1 transition-colors">
              {isRTL ? "عرض الكل" : "See all"}
              <ArrowRight className={cn("w-3 h-3", isRTL && "rotate-180")} />
            </button>
          </div>
          
          <div className="border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg overflow-hidden shadow-sm">
            <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
               {data.recent.length === 0 ? (
                 <div className="p-12 text-center text-zinc-400 font-medium italic text-sm">
                    {isRTL ? "لا يوجد سجلات حضور لنعرضها اليوم." : "No attendance logs to show for today."}
                 </div>
               ) : data.recent.map((log) => (
                 <div key={log.id} className={cn("p-4 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer", isRTL ? "flex-row-reverse" : "")}>
                    <div className={cn("flex items-center gap-4", isRTL ? "flex-row-reverse" : "")}>
                       <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-[10px] text-zinc-400">
                          {log.employees?.name.substring(0, 1).toUpperCase()}
                       </div>
                       <div>
                          <p className="text-sm font-bold">{log.employees?.name}</p>
                          <p className="text-[11px] text-zinc-400 uppercase font-black">{log.status}</p>
                       </div>
                    </div>
                    <div className={cn("flex flex-col", isRTL ? "text-right" : "text-right")}>
                       <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                          {new Date(log.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                       <span className="text-[10px] font-bold text-zinc-400">{new Date(log.check_in).toLocaleDateString()}</span>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Workspace Quick Links (Notion style) */}
        <div className="space-y-10">
           <div className={isRTL ? "text-right" : "text-left"}>
              <h3 className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">{isRTL ? "إدارة سريعة" : "Quick Actions"}</h3>
              <div className="space-y-1">
                 {[
                   { name: isRTL ? "تصدير التقرير الشهري" : "Export Monthly Report", icon: BarChart3 },
                   { name: isRTL ? "إدارة الموظفين" : "Manage Staff Members", icon: Users },
                   { name: isRTL ? "إعدادات البوت" : "Bot Integration Settings", icon: Clock }
                 ].map(action => (
                   <button key={action.name} className={cn("w-full flex items-center gap-3 px-3 py-2 text-[13px] font-bold text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors group", isRTL ? "flex-row-reverse text-right" : "text-left")}>
                      <action.icon className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                      <span>{action.name}</span>
                   </button>
                 ))}
              </div>
           </div>

           <div className={cn("p-6 bg-[#fbfbfa] dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg", isRTL ? "text-right" : "text-left")}>
              <div className="w-8 h-8 rounded bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-black mb-4 mx-auto md:mx-0">
                 <Clock className="w-4 h-4" />
              </div>
              <h4 className="font-black text-sm mb-2">{isRTL ? "تحديث تلقائي" : "Real-time Update"}</h4>
              <p className="text-[11px] text-zinc-500 font-bold leading-relaxed">
                 {isRTL 
                   ? "تتم مزامنة بيانات حضور فريقك في الوقت الفعلي من تطبيق تليجرام."
                   : "Your team's check-in data is synchronized in real-time from the Telegram app."
                 }
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
