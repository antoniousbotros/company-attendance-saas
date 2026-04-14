"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";
import {
  PageHeader,
  SectionCard,
  PrimaryButton,
  StatusPill,
} from "@/app/components/talabat-ui";
import { Calculator, Download, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

type PayrollResponse = {
  id: string;
  month: string;
  employee_id: string;
  employees: { name: string; salary_type: string; base_salary: number };
  base_salary: number;
  deductions: number;
  bonuses: number;
  final_salary: number;
  present_days: number;
  absent_days: number;
  half_days: number;
  late_minutes: number;
  overtime_hours: number;
};

export default function PayrollPage() {
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [records, setRecords] = useState<PayrollResponse[]>([]);
  const [currency, setCurrency] = useState("EGP");
  
  // default to current month YYYY-MM
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const fetchPayroll = async (month: string) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: company } = await supabase.from("companies").select("id, currency").eq("owner_id", user.id).single();
    if (!company) {
       setLoading(false);
       return;
    }

    setCurrency(company.currency || "EGP");

    const { data } = await supabase
      .from("payroll")
      .select("*, employees(name, salary_type, base_salary)")
      .eq("company_id", company.id)
      .eq("month", month);

    setRecords((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPayroll(selectedMonth);
  }, [selectedMonth]);

  const handleCalculate = async () => {
    if (!confirm(isRTL ? "هل أنت متأكد من إعادة حساب الرواتب لهذا الشهر؟" : "Are you sure you want to recalculate payroll for this month?")) return;
    setCalculating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: company } = await supabase.from("companies").select("id").eq("owner_id", user?.id).single();

      if (company) {
        const res = await fetch("/api/payroll/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company_id: company.id, month: selectedMonth })
        });
        const result = await res.json();
        if (result.ok) {
           await fetchPayroll(selectedMonth);
        } else {
           alert("Error estimating payroll: " + result.error);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to calculate payroll.");
    }
    setCalculating(false);
  };

  const exportCSV = () => {
    const headers = ["Employee", "Type", "Present", "Absent", "Late Mins", "Overtime", "Base Salary", "Deductions", "Bonuses", "Final Salary"];
    const rows = records.map(r => [
      r.employees?.name || "Unknown",
      r.employees?.salary_type || "",
      r.present_days,
      r.absent_days,
      r.late_minutes,
      r.overtime_hours,
      r.base_salary,
      r.deductions,
      r.bonuses,
      r.final_salary
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payroll_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPayroll = useMemo(() => records.reduce((acc, curr) => acc + Number(curr.final_salary || 0), 0), [records]);
  const totalDeductions = useMemo(() => records.reduce((acc, curr) => acc + Number(curr.deductions || 0), 0), [records]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title={(t as any).payroll || "Payroll Engine"}
        subtitle={isRTL ? "إدارة رواتب الموظفين، الخصومات والمكافآت" : "Automated monthly payroll, deductions, and reporting"}
        isRTL={isRTL}
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              disabled={records.length === 0}
              className="px-4 py-2 bg-white border border-[#eeeeee] rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-[#f9fafb] transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isRTL ? "تصدير" : "Export CSV"}
            </button>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-10 px-4 rounded-xl bg-white border border-[#eeeeee] text-sm font-semibold outline-none"
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard className="bg-[#fff1e8] border-[#ffd4b8]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-[#ff5a00] mb-1">{isRTL ? "إجمالي الرواتب الصافية" : "Net Total Payroll"}</p>
              <h2 className="text-3xl font-black text-[#111]">
                {loading ? "..." : totalPayroll.toLocaleString()} <span className="text-sm opacity-50 font-semibold">{currency}</span>
              </h2>
            </div>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#ff5a00] shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </SectionCard>
        
        <SectionCard className="bg-[#fef2f2] border-[#fecaca]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-[#dc2626] mb-1">{isRTL ? "إجمالي الخصومات (تأخير وغياب)" : "Total Deductions"}</p>
              <h2 className="text-3xl font-black text-[#111]">
                {loading ? "..." : totalDeductions.toLocaleString()} <span className="text-sm opacity-50 font-semibold text-[#dc2626] font-mono">-{totalDeductions} {currency}</span>
              </h2>
            </div>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#dc2626] shadow-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard padding="none" className="overflow-hidden bg-white border border-[#eeeeee]">
        <div className="p-5 border-b border-[#eeeeee] flex items-center justify-between bg-[#f9fafb]">
          <h3 className="font-bold text-[#111] text-sm">{isRTL ? `رواتب شهر ${selectedMonth}` : `Payroll for ${selectedMonth}`}</h3>
          <PrimaryButton
            icon={Calculator}
            onClick={handleCalculate}
            disabled={calculating}
            className="h-9 px-4 text-xs tracking-wide bg-[#111] hover:bg-[#333]"
          >
            {calculating ? "..." : (isRTL ? "تشغيل محرك الرواتب" : "Run Calculation")}
          </PrimaryButton>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              <tr className="text-[#6b7280] text-[11px] uppercase tracking-wider border-b border-[#f1f1f1]">
                <th className="px-6 py-4 font-bold text-start w-[30%]">{isRTL ? "الموظف" : "Employee"}</th>
                <th className="px-6 py-4 font-bold text-center w-[25%]">{isRTL ? "أيام العمل" : "Present / Absent"}</th>
                <th className="px-6 py-4 font-bold text-center w-[25%]">{isRTL ? "التأخير والإضافي" : "Late / Overtime"}</th>
                <th className="px-6 py-4 font-bold text-end w-[20%]">{isRTL ? "الصافي" : "Final Net Pay"}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="w-5 h-5 border-2 border-[#ff5a00] border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <Calculator className="w-10 h-10 text-[#d1d5db] mx-auto mb-3" />
                    <p className="text-[#9ca3af] text-sm italic font-medium">
                      {isRTL ? "لم يتم حساب الرواتب لهذا الشهر. اضغط على تشغيل في الأعلى." : "Payroll not calculated for this month. Run the calculation."}
                    </p>
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="border-t border-[#f1f1f1] hover:bg-[#fafafa] transition-colors relative group">
                    <td className="px-6 py-4 text-start">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="font-bold text-sm text-[#111]">{r.employees?.name}</span>
                        <span className="text-[10px] text-[#6b7280] bg-[#eeeeee] px-2 py-0.5 rounded-full font-bold uppercase w-fit">{r.employees?.salary_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-bold text-[#166534]">{r.present_days}</span>
                          <span className="text-[10px] text-[#9ca3af] font-semibold">{isRTL ? "حاضر" : "Present"}</span>
                        </div>
                        {r.half_days > 0 && (
                           <div className="flex flex-col items-center">
                             <span className="text-sm font-bold text-[#ea580c]">{r.half_days}</span>
                             <span className="text-[10px] text-[#ea580c] font-semibold">{isRTL ? "نصف يوم" : "Half-Day"}</span>
                           </div>
                        )}
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-bold text-[#dc2626]">{r.absent_days}</span>
                          <span className="text-[10px] text-[#9ca3af] font-semibold">{isRTL ? "غائب" : "Absent"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-bold text-[#dc2626] font-mono">{r.late_minutes}m</span>
                          <span className="text-[10px] text-[#9ca3af] font-semibold">{isRTL ? "تأخير" : "Late"}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-bold text-[#ff5a00] font-mono">{Number(r.overtime_hours || 0).toFixed(1)}h</span>
                          <span className="text-[10px] text-[#9ca3af] font-semibold">{isRTL ? "إضافي" : "Overtime"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-end">
                      <div className="flex flex-col items-end gap-1">
                        <span dir="ltr" className="text-lg font-black text-[#111] tracking-tight flex items-center gap-1 justify-end w-full">
                           {currency} {Number(r.final_salary).toLocaleString()}
                        </span>
                        <div dir="ltr" className="flex items-center justify-end w-full gap-2 group-hover:opacity-100 opacity-60 transition-opacity">
                           <span className="text-[10px] text-[#dc2626] font-bold tracking-wider">-{Number(r.deductions).toLocaleString()}</span>
                           <span className="text-[10px] text-[#166534] font-bold tracking-wider">+{Number(r.bonuses).toLocaleString()}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
