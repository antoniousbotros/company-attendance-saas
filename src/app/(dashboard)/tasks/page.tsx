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
  employee_submission?: string | null;
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
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    link: "",
    due_date: new Date().toISOString().split("T")[0],
    employee_id: "",
    file: null as File | null,
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
    if (!form.title || !form.employee_id || !form.due_date) return alert(isRTL ? "يرجى ملء الحقول المطلوبة." : "Please fill required fields.");
    
    setIsUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsUploading(false); return; }
    const { data: company } = await supabase.from("companies").select("id").eq("owner_id", user.id).single();
    if (!company) { setIsUploading(false); alert("Company not found."); return; }

    let finalLink = form.link;

    if (form.file) {
      if (form.file.size > 2 * 1024 * 1024) {
         setIsUploading(false);
         alert(isRTL ? "عذراً، الحد الأقصى لحجم الملف هو ٢ ميجابايت." : "Max file size is 2MB.");
         return;
      }
      
      const fileExt = form.file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${company.id}/tasks/${fileName}`;
      
      const { data, error: uploadError } = await supabase.storage.from("task-attachments").upload(filePath, form.file);
      
      if (uploadError) {
         setIsUploading(false);
         console.error(uploadError);
         alert(isRTL ? "فشل رفع الملف." : "File upload failed.");
         return;
      }
      
      const { data: { publicUrl } } = supabase.storage.from("task-attachments").getPublicUrl(filePath);
      finalLink = publicUrl;
    }

    const { error } = await supabase.from("tasks").insert({
      company_id: company.id,
      employee_id: form.employee_id,
      title: form.title,
      description: form.description,
      link: finalLink,
      due_date: form.due_date,
      status: "pending"
    });

    setIsUploading(false);
    if (error) return alert(isRTL ? "فشل تعيين المهمة" : "Failed to assign task");
    
    setShowForm(false);
    setForm({ ...form, title: "", description: "", link: "", file: null });
    loadData();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title={isRTL ? "إدارة المهام" : "Task Management"}
        subtitle={isRTL ? "تعيين المهام لموظفيك ومتابعة التنفيذ لحظياً" : "Assign and track daily/weekly employee tasks"}
        isRTL={isRTL}
        action={
          <PrimaryButton disabled={isUploading} icon={Plus} onClick={() => setShowForm(!showForm)}>
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
                <select disabled={isUploading} value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-[#ffd4b8] outline-none disabled:opacity-50">
                  <option value="">{isRTL ? "اختر موظفاً" : "Select Employee"}</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6b7280] mb-1">{isRTL ? "تاريخ الاستحقاق *" : "Due Date *"}</label>
                <input disabled={isUploading} type="date" required value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-[#ffd4b8] outline-none disabled:opacity-50" />
              </div>
            </div>

            <div className={isRTL ? "text-end" : "text-start"}>
                <label className="block text-xs font-bold text-[#6b7280] mb-1">{isRTL ? "عنوان المهمة *" : "Task Title *"}</label>
                <input disabled={isUploading} type="text" required dir="auto" placeholder={isRTL ? "مثال: مراجعة الميزانية" : "e.g., Audit Q1 Financials"} value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-[#ffd4b8] outline-none disabled:opacity-50" />
            </div>

            <div className={isRTL ? "text-end" : "text-start"}>
                <label className="block text-xs font-bold text-[#6b7280] mb-1">{isRTL ? "تفاصيل إضافية (اختياري)" : "Description (Optional)"}</label>
                <input disabled={isUploading} type="text" dir="auto" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-[#ffd4b8] outline-none disabled:opacity-50" />
            </div>

            <div className={isRTL ? "text-end" : "text-start"}>
                <label className="block text-xs font-bold text-[#6b7280] mb-1">{isRTL ? "مرفقات المهمة (اختياري)" : "Task Attachments (Optional)"}</label>
                <div className="flex flex-col gap-2">
                   <input 
                      disabled={isUploading}
                      type="file" 
                      onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (file && file.size > 2 * 1024 * 1024) {
                            alert(isRTL ? "عذراً، الحد الأقصى لحجم الملف هو ٢ ميجابايت." : "Max file size is 2MB.");
                            e.target.value = '';
                            return;
                         }
                         setForm({...form, file: file || null});
                      }} 
                      className={cn("w-full bg-white h-12 px-4 py-2.5 rounded-xl border border-[#ffd4b8] outline-none text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#ff5a00]/10 file:text-[#ff5a00] hover:file:bg-[#ff5a00]/20 max-w-full disabled:opacity-50", isRTL && "file:ml-4 file:mr-0 text-end flex-row-reverse")} 
                   />
                   {!form.file && (
                     <div className="relative">
                       <input disabled={isUploading} type="url" dir="ltr" placeholder="https://" value={form.link} onChange={e => setForm({...form, link: e.target.value})} className={cn("w-full h-12 px-4 py-2 rounded-xl border border-[#ffd4b8] outline-none text-sm disabled:opacity-50", isRTL && "text-end")} />
                       <div className={cn("absolute top-3 text-[10px] uppercase font-bold text-[#b45309]", isRTL ? "left-4" : "right-4")}>
                         {isRTL ? "أو ضع رابط هنا" : "OR PASTE LINK"}
                       </div>
                     </div>
                   )}
                </div>
            </div>

            <div className={cn("flex pt-2", isRTL && "justify-end")}>
              <PrimaryButton type="submit" disabled={isUploading}>
                {isUploading ? (isRTL ? "جاري تعيين المهمة ورفع الملف..." : "Uploading & Assigning...") : (isRTL ? "تعيين وإرسال" : "Assign Task")}
              </PrimaryButton>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard padding="none" className="overflow-hidden bg-white border border-[#eeeeee]">
        <div className={cn("p-5 border-b border-[#eeeeee] flex items-center justify-between bg-[#f9fafb]", isRTL && "flex-row-reverse")}>
          <h3 className="font-bold text-[#111] text-sm">{isRTL ? "سجل المهام" : "Task Board"}</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-yellow-100 text-yellow-800">{isRTL ? "قيد الانتظار" : "Pending"}</span>
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-green-100 text-green-800">{isRTL ? "مكتمل" : "Completed"}</span>
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-red-100 text-red-800">{isRTL ? "متأخر" : "Late"}</span>
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
                         {t.link && <a href={t.link} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-[#0284c7] hover:underline flex items-center gap-1 mt-1 bg-[#bae6fd]/30 px-2 py-1 border border-[#bae6fd] rounded"><LinkIcon className="w-3 h-3"/> {isRTL ? "افتح المستند المرفق" : "Open Attached Document"}</a>}
                         {t.employee_submission && (
                           <div className={cn("mt-2 p-2 rounded border border-[#bae6fd] bg-[#f0f9ff] text-[#0369a1] text-[11px] font-medium leading-relaxed w-full", isRTL && "text-end")}>
                             <span className="font-bold opacity-80 block mb-0.5">{isRTL ? "ملاحظات الموظف / الرابط:" : "Employee's Note / Link:"}</span>
                             {t.employee_submission.startsWith("http") ? (
                               <a href={t.employee_submission} target="_blank" rel="noreferrer" className="underline hover:text-[#0284c7]">{t.employee_submission}</a>
                             ) : (
                               <span>{t.employee_submission}</span>
                             )}
                           </div>
                         )}
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
