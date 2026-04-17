"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";
import {
  PageHeader,
  SectionCard,
  PrimaryButton,
  GhostButton,
  HelpCard,
} from "@/app/components/talabat-ui";

function ReportCard({
  icon: Icon,
  tone,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "orange" | "red";
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  const iconBg = tone === "orange" ? "bg-[#fff1e8] text-[#ff5a00]" : "bg-[#fef1f1] text-[#b91c1c]";
  return (
    <SectionCard padding="lg">
      <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-5", iconBg)}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-[#111] mb-2">{title}</h3>
      <p className="text-sm text-[#6b7280] leading-relaxed mb-6 max-w-md">
        {description}
      </p>
      {action}
    </SectionCard>
  );
}

function MetricBox({ label, value, delta, up }: { label: string; value: string; delta?: string; up?: boolean; }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-[28px] font-bold text-[#111]">{value}</p>
        {delta && <span className={cn("text-xs font-semibold", up ? "text-[#1e8e3e]" : "text-[#b91c1c]")}>{delta}</span>}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { t, isRTL } = useLanguage();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [exporting, setExporting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [anomalyResult, setAnomalyResult] = useState<string | null>(null);

  const [stats, setStats] = useState({
    avgHours: "0.0h",
    onTimeRate: "0%",
    workingDays: "0d",
    activeEmployees: "0",
    loading: true
  });

  useEffect(() => {
    async function loadStats() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: company } = await supabase.from("companies").select("id").eq("owner_id", user.id).single();
      if (!company) { setStats(s => ({ ...s, loading: false })); return; }

      const companyId = company.id;
      const { count: empCount } = await supabase.from("employees").select("*", { count: "exact", head: true }).eq("company_id", companyId);
      const currentMonthStr = new Date().toISOString().slice(0, 7);
      const [y, m] = currentMonthStr.split('-');
      const lastDay = new Date(Number(y), Number(m), 0).getDate();
      const startM = `${currentMonthStr}-01`;
      const endM = `${currentMonthStr}-${lastDay}`;
      const { data: attendance } = await supabase.from("attendance").select("working_hours, status, date").eq("company_id", companyId).gte("date", startM).lte("date", endM);

      let totalHours = 0, presentCounts = 0, lateCounts = 0;
      const uniqueDays = new Set<string>();

      if (attendance && attendance.length > 0) {
         attendance.forEach(r => {
           totalHours += Number(r.working_hours || 0);
           if (r.status === 'present') presentCounts++;
           if (r.status === 'late') lateCounts++;
           uniqueDays.add(r.date);
         });
         const totalEntries = presentCounts + lateCounts;
         const onTimeP = totalEntries > 0 ? Math.round((presentCounts / totalEntries) * 100) : 0;
         const avgH = totalEntries > 0 ? (totalHours / totalEntries).toFixed(1) : "0.0";
         setStats({ avgHours: `${avgH}h`, onTimeRate: `${onTimeP}%`, workingDays: `${uniqueDays.size}d`, activeEmployees: `${empCount || 0}`, loading: false });
      } else {
         setStats({ avgHours: "0.0h", onTimeRate: "0%", workingDays: "0d", activeEmployees: `${empCount || 0}`, loading: false });
      }
    }
    loadStats();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: company } = await supabase.from("companies").select("id").eq("owner_id", user.id).single();
    if (!company) return;

    const [yR, mR] = selectedMonth.split('-');
    const lDR = new Date(Number(yR), Number(mR), 0).getDate();
    const { data } = await supabase.from("attendance")
      .select("date, check_in, check_out, working_hours, late_minutes, status, employees(name)")
      .eq("company_id", company.id)
      .gte("date", `${selectedMonth}-01`)
      .lte("date", `${selectedMonth}-${lDR}`)
      .order("date", { ascending: true });

    setExporting(false);
    if (!data || data.length === 0) return alert(isRTL ? "لا توجد سجلات لهذا الشهر." : "No records found for this month.");

    const headers = ["Date", "Employee", "Status", "Check In", "Check Out", "Working Hours", "Late Mins"];
    const rows = data.map((r: any) => [
      r.date, r.employees?.name, r.status, new Date(r.check_in).toLocaleTimeString(),
      r.check_out ? new Date(r.check_out).toLocaleTimeString() : "-", r.working_hours || 0, r.late_minutes || 0
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `Attendance_${selectedMonth}.csv`;
    link.click();
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnomalyResult(null);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: company } = await supabase.from("companies").select("id").eq("owner_id", user?.id).single();
    
    if (company) {
       const currentMonthStr = new Date().toISOString().slice(0, 7);
       const [yA, mA] = currentMonthStr.split('-');
       const lDA = new Date(Number(yA), Number(mA), 0).getDate();
       const { data } = await supabase.from("attendance").select("status, employees(name)").eq("company_id", company.id).gte("date", `${currentMonthStr}-01`).lte("date", `${currentMonthStr}-${lDA}`);
       if (data && data.length > 0) {
         const flags: Record<string, { late: 0, absent: 0 }> = {};
         data.forEach((r: any) => {
           const emp = r.employees?.name;
           if (!emp) return;
           if (!flags[emp]) flags[emp] = { late: 0, absent: 0 };
           if (r.status === 'late') flags[emp].late++;
           if (r.status === 'absent') flags[emp].absent++;
         });
         
         const anomalies = Object.entries(flags).filter(([_, counts]) => counts.late > 3 || counts.absent > 1);
         if (anomalies.length > 0) {
            setAnomalyResult(anomalies.map(([name, c]) => `${name}: ${c.late} Lates, ${c.absent} Absences`).join("\n"));
         } else {
            setAnomalyResult(isRTL ? "لا توجد أي مخالفات هذا الشهر. الأداء ممتاز!" : "No violations detected this month. Great performance!");
         }
       } else {
         setAnomalyResult(isRTL ? "لا توجد بيانات كافية للتحليل." : "Not enough data to analyze.");
       }
    }
    setAnalyzing(false);
  };

  return (
    <div className="space-y-8">
      <PageHeader title={t.reportsTitle} subtitle={t.reportsSubtitle} isRTL={isRTL} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReportCard
          icon={FileSpreadsheet} tone="orange" title={t.monthlySummary} description={t.monthlySummaryDesc}
          action={
            <div className={cn("flex flex-wrap items-center gap-3", isRTL && "flex-row-reverse")}>
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="h-10 px-4 rounded-xl bg-[#f9fafb] border border-[#eeeeee] text-sm font-semibold outline-none focus:bg-white focus:border-[#ff5a00] transition-colors" />
              <button onClick={handleExport} disabled={exporting} className={cn("flex items-center gap-2 h-10 px-5 rounded-xl text-white font-bold transition-all", exporting ? "bg-[#ff5a00]/50" : "bg-[#ff5a00] hover:bg-[#e65100]")}>
                 <Download className="w-4 h-4" /> {exporting ? "..." : t.export}
              </button>
            </div>
          }
        />
        <ReportCard
          icon={AlertCircle} tone="red" title={t.anomalyDetection} description={t.anomalyDesc}
          action={
            <div className={cn("flex flex-col gap-3 items-start", isRTL && "items-end")}>
              <button onClick={handleAnalyze} disabled={analyzing} className={cn("flex items-center gap-2 h-10 px-5 rounded-xl text-white font-bold transition-all", analyzing ? "bg-[#111]/50" : "bg-[#111] hover:bg-black")}>
                 <TrendingUp className="w-4 h-4" /> {analyzing ? "..." : t.analyzeData}
              </button>
              {anomalyResult && (
                <div className="mt-2 p-3 bg-[#fef1f1] border border-[#fecaca] rounded-lg w-full">
                  <p className="text-xs font-semibold text-[#b91c1c] whitespace-pre-wrap text-start" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>{anomalyResult}</p>
                </div>
              )}
            </div>
          }
        />
      </div>

      <SectionCard padding="lg">
        <h3 className="text-sm font-bold text-[#111] mb-6">{t.teamPerformance} {stats.loading && <span className="opacity-50 text-xs">(Loading...)</span>}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <MetricBox label={t.avgHoursPerDay} value={stats.avgHours} />
          <MetricBox label={t.onTimeRate} value={stats.onTimeRate} />
          <MetricBox label={t.workingDays} value={stats.workingDays} />
          <MetricBox label={t.activeEmployees} value={stats.activeEmployees} />
        </div>
      </SectionCard>
    </div>
  );
}
