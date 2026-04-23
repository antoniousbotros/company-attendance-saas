"use client";

import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from "recharts";
import { 
  CheckCircle2, 
  Clock, 
  Users, 
  ListTodo, 
  Plus, 
  ArrowRight,
  TrendingUp,
  MessageCircle,
  ShieldCheck,
  Zap,
  BarChart3,
  LayoutDashboard,
  PieChart
} from "lucide-react";
import { cn } from "@/lib/utils";

const data = [
  { name: "Sun", attendance: 92 },
  { name: "Mon", attendance: 98 },
  { name: "Tue", attendance: 85 },
  { name: "Wed", attendance: 94 },
  { name: "Thu", attendance: 90 },
];

export default function ShowcaseSection({ isRTL }: { isRTL: boolean }) {
  return (
    <section className="py-24 bg-[#fcfcfc] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#fff1e8] text-[#ff5a00] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
            <Zap className="w-4 h-4" />
            {isRTL ? "نظام متكامل" : "All-in-One Engine"}
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[#111] leading-tight">
            {isRTL 
              ? "أكثر من مجرد تحضير. نظام ذكي لإدارة فريقك بالكامل."
              : "Power analytics, tasks, and tracking in one place."}
          </h2>
          <p className="text-lg text-[#6b7280] font-medium leading-relaxed">
            {isRTL 
              ? "بياناتك تتحول تلقائياً إلى تقارير تفاعلية ومهام قابلة للتتبع، مما يوفر عليك ساعات من العمل اليدوي."
              : "Your data is automatically transformed into interactive reports and trackable tasks, saving you hours of manual work."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* 1. ANALYTICS CARD */}
          <div className="bg-white border border-[#eeeeee] rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all h-full flex flex-col group">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-[#111] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#ff5a00]" />
                  {isRTL ? "تحليلات الحضور الذكية" : "Smart Attendance Analytics"}
                </h3>
                <p className="text-sm text-[#6b7280]">{isRTL ? "تتبع الأداء الأسبوعي لمؤسستك" : "Track your team performance weekly"}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#f9fafb] border border-[#eeeeee] flex items-center justify-center text-[#ff5a00]">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: isRTL ? "نسبة الانضباط" : "Accuracy", val: "94%", color: "text-[#1e8e3e]" },
                { label: isRTL ? "متوسط التأخير" : "Avg Late", val: "12m", color: "text-amber-500" },
                { label: isRTL ? "الحضور اليوم" : "Present", val: "48/50", color: "text-[#111]" },
              ].map((stat, i) => (
                <div key={i} className="bg-[#f9fafb] rounded-2xl p-4 border border-[#eeeeee] group-hover:border-[#ff5a00]/20 transition-colors">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-[#9ca3af] mb-1">{stat.label}</p>
                  <p className={cn("text-xl font-black", stat.color)}>{stat.val}</p>
                </div>
              ))}
            </div>

            <div className="h-[200px] w-full mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: "#9ca3af" }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                    cursor={{ fill: "#fcfcfc" }}
                  />
                  <Bar dataKey="attendance" radius={[6, 6, 0, 0]}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 1 ? "#ff5a00" : "#ffd4b8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. TASK MANAGEMENT CARD */}
          <div className="bg-white border border-[#eeeeee] rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all h-full flex flex-col group">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-[#111] flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-[#ff5a00]" />
                  {isRTL ? "إدارة المهام وتكليف الفريق" : "Quick Task Assignment"}
                </h3>
                <p className="text-sm text-[#6b7280]">{isRTL ? "حول التقارير إلى مهام فورية" : "Turn reports into trackable actions"}</p>
              </div>
              <button className="w-10 h-10 rounded-xl bg-[#ff5a00] text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-[#ff5a00]/20">
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6 flex-1">
              {[
                { task: isRTL ? "مراجعة جرد المستودع" : "Warehouse Inventory Audit", user: "Ahmed A.", time: "2h ago", status: "pending" },
                { task: isRTL ? "تحصيل مستحقات فرع المعادي" : "Maadi Branch Collections", user: "Sara K.", time: "4h ago", status: "done" },
                { task: isRTL ? "صيانة وحدة التكييف الرئيسية" : "Main AC Unit Maintenance", user: "Mostafa M.", time: "1d ago", status: "pending" },
              ].map((task, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-[#f9fafb] border border-[#eeeeee] rounded-2xl group-hover:bg-white transition-all group-hover:shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2",
                      task.status === "done" ? "bg-[#1e8e3e] border-[#1e8e3e]" : "border-[#9ca3af]"
                    )}>
                      {task.status === "done" && <CheckCircle2 className="w-full h-full text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#111]">{task.task}</p>
                      <p className="text-[10px] text-[#6b7280] font-medium">{task.user} • {task.time}</p>
                    </div>
                  </div>
                  {task.status === "pending" && (
                    <div className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[9px] font-black uppercase">
                      {isRTL ? "جاري" : "Ongoing"}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-[#fff1e8] rounded-2xl p-4 flex items-center justify-between">
              <span className="text-xs font-bold text-[#ff5a00]">{isRTL ? "إنجاز 85% من مهام الأسبوع" : "85% of weekly goals reached"}</span>
              <div className="w-32 h-2 bg-[#ffd4b8] rounded-full overflow-hidden">
                <div className="h-full bg-[#ff5a00]" style={{ width: "85%" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. INFOGRAPHIC (Data Flow) */}
        <div className="bg-[#111] rounded-[3rem] p-12 relative overflow-hidden group border border-[#333]">
          {/* Abstract particles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff5a00]/10 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#0284c7]/10 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="relative z-10">
            <h3 className="text-2xl font-black text-white text-center mb-16">
              {isRTL ? "دورة البيانات: من الميدان إلى لوحة التحكم" : "Data Flow: From Field to Dashboard"}
            </h3>

            <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4 lg:gap-8 max-w-5xl mx-auto px-4 md:px-0">
              {[
                { icon: MessageCircle, label: isRTL ? "تسجيل الموظف" : "Employee Tap", sub: isRTL ? "تليجرام + GPS" : "Telegram + GPS", color: "bg-[#0088cc]" },
                { icon: ShieldCheck, label: isRTL ? "تحقق فوري" : "Instant Verification", sub: isRTL ? "تشفير عسكري" : "Military Grade", color: "bg-[#1e8e3e]" },
                { icon: PieChart, label: isRTL ? "معالجة البيانات" : "Data Processing", sub: isRTL ? "محرك الرواتب" : "Payroll Engine", color: "bg-[#ff5a00]" },
                { icon: LayoutDashboard, label: isRTL ? "لوحة التحكم" : "Live Dashboard", sub: isRTL ? "تقارير ذكية" : "Smart Insights", color: "bg-white text-[#111]" },
              ].map((step, i) => (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center text-center space-y-4 flex-1">
                    <div className={cn(
                      "w-20 h-20 rounded-[2rem] flex items-center justify-center text-white shadow-2xl transition-transform group-hover:scale-110",
                      step.color
                    )}>
                      <step.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-black text-white text-sm lg:text-base">{step.label}</p>
                      <p className="text-[10px] lg:text-[11px] text-gray-400 font-bold uppercase tracking-widest">{step.sub}</p>
                    </div>
                  </div>
                  {i < 3 && (
                    <div className="hidden md:flex items-center justify-center text-[#ff5a00]/30 h-8">
                      <ArrowRight className={cn("w-6 h-6", isRTL && "rotate-180")} />
                    </div>
                  )}
                  {i < 3 && (
                    <div className="md:hidden text-[#ff5a00]/30 w-full flex justify-center py-4">
                       <ArrowRight className="w-6 h-6 rotate-90" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
