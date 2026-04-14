"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ListTodo, Plus, Search, Calendar, Link as LinkIcon, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";
import { PageHeader, SectionCard, PrimaryButton, StatusPill } from "@/app/components/talabat-ui";

type Employee = { id: string; name: string };
type Task = {
  id: string;
  title: string;
  description: string;
  link: string;
  due_date: string;
  status: "pending" | "late" | "completed";
  created_at: string;
  employees: { name: string };
};

export default function TasksPage() {
  const { t, isRTL } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // New Task Form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    link: "",
    due_date: new Date().toISOString().split("T")[0],
    employee_id: "",
  });

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: company } = await supabase.from("companies").select("id").eq("owner_id", user.id).single();
    if (!company) { setLoading(false); return; }

    const { data: emps } = await supabase.from("employees").select("id, name").eq("company_id", company.id);
    if (emps) setEmployees(emps);

    const { data: tsks } = await supabase.from("tasks").select("*, employees(name)").eq("company_id", company.id).order("created_at", { ascending: false });
    if (tsks) setTasks(tsks as Task[]);

    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.employee_id || !form.due_date) return alert("Please fill required fields.");
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: company } = await supabase.from("companies").select("id").eq("owner_id", user.id).single();
    if (!company) return alert("Company not found.");

    const { error } = await supabase.from("tasks").insert({
      company_id: company.id,
      employee_id: form.employee_id,
      title: form.title,
      description: form.description,
      link: form.link,
      due_date: form.due_date,
      status: "pending"
    });

    if (error) return alert("Failed to assign task");
    
    setShowForm(false);
    setForm({ ...form, title: "", description: "", link: "" });
    loadData();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title={isRTL ? "إدارة المهام" : "Task Management"}
        subtitle={isRTL ? "تعيين المهام لموظفيك ومتابعة التنفيذ لحظياً" : "Assign and track daily/weekly employee tasks"}
        isRTL={isRTL}
        action={
          <PrimaryButton icon={Plus} onClick={() => setShowForm(!showForm)}>
            {showForm ? (isRTL ? "إلغاء" : "Cancel") : (isRTL ? "إضافة مهمة" : "New Task")}
          </PrimaryButton>
        }
      />

      {showForm && (
        <SectionCard className="border-[#ff5a00] ring-1 ring-[#ff5a00] bg-[#fff1e8]">
          <h3 className={cn("text-lg font-bold text-[#111] mb-4", isRTL && "text-end")}>{isRTL ? "تفاصيل المهمة الجديدة" : "New Task Details"}</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", isRTL && "text-end")}>
              <div>
                <label className="block text-xs font-bold text-[#6b7280] mb-1">{isRTL ? "اسم الموظف *" : "Assign To *"}</label>
                <select value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-[#ffd4b8] outline-none">
                  <option value="">{isRTL ? "اختر موظفاً" : "Select Employee"}</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6b7280] mb-1">{isRTL ? "تاريخ الاستحقاق *" : "Due Date *"}</label>
                <input type="date" required value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-[#ffd4b8] outline-none" />
              </div>
            </div>

            <div className={isRTL ? "text-end" : "text-start"}>
                <label className="block text-xs font-bold text-[#6b7280] mb-1">{isRTL ? "عنوان المهمة *" : "Task Title *"}</label>
                <input type="text" required placeholder={isRTL ? "مثال: مراجعة الميزانية" : "e.g., Audit Q1 Financials"} value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-[#ffd4b8] outline-none" />
            </div>

            <div className={isRTL ? "text-end" : "text-start"}>
                <label className="block text-xs font-bold text-[#6b7280] mb-1">{isRTL ? "تفاصيل إضافية (اختياري)" : "Description (Optional)"}</label>
                <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-[#ffd4b8] outline-none" />
            </div>

            <div className={isRTL ? "text-end" : "text-start"}>
                <label className="block text-xs font-bold text-[#6b7280] mb-1">{isRTL ? "رابط ملف أو مستند (اختياري)" : "Resource Link (Optional)"}</label>
                <input type="url" placeholder="https://" value={form.link} onChange={e => setForm({...form, link: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-[#ffd4b8] outline-none" />
            </div>

            <div className={cn("flex pt-2", isRTL && "justify-end")}>
              <PrimaryButton type="submit">{isRTL ? "تعيين وإرسال" : "Assign Task"}</PrimaryButton>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard padding="none" className="overflow-hidden bg-white border border-[#eeeeee]">
        <div className={cn("p-5 border-b border-[#eeeeee] flex items-center justify-between bg-[#f9fafb]", isRTL && "flex-row-reverse")}>
          <h3 className="font-bold text-[#111] text-sm">{isRTL ? "سجل المهام" : "Task Board"}</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-yellow-100 text-yellow-800">Pending</span>
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-green-100 text-green-800">Completed</span>
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-red-100 text-red-800">Late</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              <tr className="text-[#6b7280] text-[11px] uppercase tracking-wider border-b border-[#f1f1f1]">
                <th className="px-6 py-4 font-bold text-start w-[25%]">{isRTL ? "الموظف" : "Assignee"}</th>
                <th className="px-6 py-4 font-bold text-start w-[40%]">{isRTL ? "المهمة" : "Task"}</th>
                <th className="px-6 py-4 font-bold text-center w-[15%]">{isRTL ? "تاريخ الاستحقاق" : "Due Date"}</th>
                <th className="px-6 py-4 font-bold text-end w-[20%]">{isRTL ? "الحالة" : "Status"}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="w-5 h-5 border-2 border-[#ff5a00] border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <ListTodo className="w-10 h-10 text-[#d1d5db] mx-auto mb-3" />
                    <p className="text-[#9ca3af] text-sm italic font-medium">{isRTL ? "لا توجد مهام مسجلة حالياً." : "No tasks assigned yet."}</p>
                  </td>
                </tr>
              ) : (
                tasks.map((t) => (
                  <tr key={t.id} className="border-t border-[#f1f1f1] hover:bg-[#fafafa] transition-colors relative group">
                    <td className="px-6 py-4 text-start">
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-bold text-sm text-[#111]">{t.employees?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-start">
                      <div className="flex flex-col items-start gap-1 max-w-sm">
                        <span className="font-bold text-[#111] text-sm">{t.title}</span>
                        {t.description && <span className="text-xs text-[#6b7280] truncate w-full">{t.description}</span>}
                        {t.link && <a href={t.link} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-[#0284c7] hover:underline flex items-center gap-1 mt-1"><LinkIcon className="w-3 h-3"/> {isRTL ? "افتح المستند" : "Open Link"}</a>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-semibold text-[#4b5563] flex items-center justify-center gap-1"><Calendar className="w-3 h-3"/> {t.due_date}</span>
                    </td>
                    <td className="px-6 py-4 text-end">
                       <div className="flex justify-end">
                         {t.status === "completed" && <StatusPill label={isRTL ? "مكتمل" : "Completed"} tone="success" />}
                         {t.status === "pending" && <StatusPill label={isRTL ? "قيد الانتظار" : "Pending"} tone="warning" />}
                         {t.status === "late" && <StatusPill label={isRTL ? "متأخر" : "Late"} tone="danger" />}
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
