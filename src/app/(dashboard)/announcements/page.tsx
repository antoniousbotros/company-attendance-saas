"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Megaphone, Plus, Trash2, Calendar, Target, CheckCircle2, XCircle } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";
import { PageHeader, SectionCard, PrimaryButton, StatusPill } from "@/app/components/talabat-ui";

type Employee = { id: string; name: string; department: string | null };
type Announcement = {
  id: string;
  title: string;
  message: string;
  target_type: "all" | "department" | "specific";
  expire_at: string;
  is_active: boolean;
  created_at: string;
  creator: { name: string } | null;
  targets: { department: string | null; employee_id: string | null }[];
};

export default function AnnouncementsPage() {
  const { t, isRTL } = useLanguage();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message: "",
    target_type: "all" as "all" | "department" | "specific",
    expire_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    selectedTargets: [] as string[],
  });

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: company } = await supabase.from("companies").select("id").eq("owner_id", user.id).single();
    if (!company) { setLoading(false); return; }

    const { data: emps } = await supabase.from("employees").select("id, name, department").eq("company_id", company.id);
    if (emps) {
       setEmployees(emps);
       const uniqueDepts = Array.from(new Set(emps.map(e => e.department).filter(Boolean))) as string[];
       setDepartments(uniqueDepts);
    }

    const { data: ann } = await supabase.from("announcements")
        .select("*, creator:employees!created_by(name), targets:announcement_targets(department, employee_id)")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });
        
    if (ann) setAnnouncements(ann as any[]);

    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.message || !form.expire_at) return alert(isRTL ? "يرجى ملء الحقول المطلوبة." : "Please fill required fields.");
    if (form.target_type !== "all" && form.selectedTargets.length === 0) return alert(isRTL ? "يرجى اختيار المستهدفين." : "Please select targets.");
    
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsSubmitting(false); return; }
    const { data: company } = await supabase.from("companies").select("id").eq("owner_id", user.id).single();
    if (!company) { setIsSubmitting(false); return; }

    const { data: executer } = await supabase.from("employees").select("id").eq("company_id", company.id).limit(1).single();

    try {
       const res = await fetch("/api/announcements/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
             company_id: company.id,
             created_by: executer ? executer.id : null,
             title: form.title,
             message: form.message,
             target_type: form.target_type,
             targets: form.selectedTargets,
             expire_at: form.expire_at
          })
       });

       if (!res.ok) throw new Error("Failed to create via API");
       
       setShowForm(false);
       setForm({ ...form, title: "", message: "", target_type: "all", selectedTargets: [] });
       loadData();
    } catch (err) {
       console.error(err);
       alert(isRTL ? "فشل إنشاء التعميم." : "Failed to create announcement.");
    }
    setIsSubmitting(false);
  };

  const handleTargetToggle = (val: string) => {
      setForm(prev => {
          if (prev.selectedTargets.includes(val)) return { ...prev, selectedTargets: prev.selectedTargets.filter(item => item !== val) };
          return { ...prev, selectedTargets: [...prev.selectedTargets, val] };
      });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title={isRTL ? "التعميمات والتنبيهات" : "Announcements"}
        subtitle={isRTL ? "إرسال قرارات إدارية وتنبيهات فورية لموظفيك عبر تليجرام" : "Broadcast company updates instantly via Telegram"}
        isRTL={isRTL}
        action={
          <PrimaryButton disabled={isSubmitting} icon={Plus} onClick={() => setShowForm(!showForm)}>
            {showForm ? (isRTL ? "إلغاء" : "Cancel") : (isRTL ? "إضافة تعميم" : "New Announcement")}
          </PrimaryButton>
        }
      />

      {showForm && (
        <SectionCard className="border-[#ff5a00] ring-1 ring-[#ff5a00] bg-[#fff1e8]">
          <h3 className={cn("text-lg font-bold text-[#111] mb-4 flex items-center gap-2", isRTL && "justify-end")}>
            <Megaphone className="w-5 h-5 text-[#ff5a00]" />
            {isRTL ? "نشر تعميم جديد" : "Broadcast New Announcement"}
          </h3>
          <form onSubmit={handleCreate} className="space-y-6">
            
            <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", isRTL && "text-end")}>
              <div className={isRTL ? "text-end" : "text-start"}>
                <label className="block text-xs font-bold text-[#6b7280] mb-1">{isRTL ? "عنوان التعميم *" : "Announcement Title *"}</label>
                <input disabled={isSubmitting} type="text" required dir="auto" placeholder={isRTL ? "مثال: تعديل ساعات العمل في رمضان" : "e.g., Ramadan Working Hours"} value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-[#ffd4b8] outline-none disabled:opacity-50 font-bold" />
              </div>
              <div className={isRTL ? "text-end" : "text-start"}>
                <label className="block text-xs font-bold text-[#6b7280] mb-1">{isRTL ? "تاريخ انتهاء التعميم *" : "Expiration Date *"}</label>
                <input disabled={isSubmitting} type="date" required value={form.expire_at} onChange={e => setForm({...form, expire_at: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-[#ffd4b8] outline-none disabled:opacity-50" />
              </div>
            </div>

            <div className={isRTL ? "text-end" : "text-start"}>
                <label className="block text-xs font-bold text-[#6b7280] mb-1">{isRTL ? "نص التعميم *" : "Message Content *"}</label>
                <textarea disabled={isSubmitting} rows={4} required dir="auto" placeholder={isRTL ? "اكتب تفاصيل القرار أو التنبيه هنا..." : "Type the announcement details..."} value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="w-full p-4 rounded-xl border border-[#ffd4b8] outline-none disabled:opacity-50 resize-y" />
            </div>

            <div className={cn("p-4 bg-white rounded-xl border border-[#ffd4b8]", isRTL && "text-end")}>
                <label className="block text-xs font-bold text-[#6b7280] mb-3">{isRTL ? "الجهة المستهدفة *" : "Target Audience *"}</label>
                <div className={cn("flex flex-wrap gap-3", isRTL && "justify-end")}>
                   <label className="flex items-center gap-2 cursor-pointer bg-[#f9fafb] px-4 py-2 rounded-lg border border-[#eeeeee] hover:bg-[#f1f1f1] transition-colors">
                      <input type="radio" className="accent-[#ff5a00]" name="target" checked={form.target_type === "all"} onChange={() => setForm({...form, target_type: "all", selectedTargets: []})} />
                      <span className="text-sm font-bold text-[#111]">{isRTL ? "جميع الموظفين" : "All Employees"}</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer bg-[#f9fafb] px-4 py-2 rounded-lg border border-[#eeeeee] hover:bg-[#f1f1f1] transition-colors">
                      <input type="radio" className="accent-[#ff5a00]" name="target" checked={form.target_type === "department"} onChange={() => setForm({...form, target_type: "department", selectedTargets: []})} />
                      <span className="text-sm font-bold text-[#111]">{isRTL ? "أقسام محددة" : "Specific Departments"}</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer bg-[#f9fafb] px-4 py-2 rounded-lg border border-[#eeeeee] hover:bg-[#f1f1f1] transition-colors">
                      <input type="radio" className="accent-[#ff5a00]" name="target" checked={form.target_type === "specific"} onChange={() => setForm({...form, target_type: "specific", selectedTargets: []})} />
                      <span className="text-sm font-bold text-[#111]">{isRTL ? "موظفين محددين" : "Specific Employees"}</span>
                   </label>
                </div>

                {/* Sub-Selection Dropdowns */}
                {form.target_type === "department" && (
                    <div className="mt-4 pt-4 border-t border-[#eeeeee]">
                       <p className="text-xs text-[#6b7280] mb-2">{isRTL ? "اختر الأقسام المطلوبة:" : "Select Departments:"}</p>
                       <div className={cn("flex flex-wrap gap-2", isRTL && "justify-end")}>
                          {departments.map(dept => (
                             <button key={dept} type="button" onClick={() => handleTargetToggle(dept)} className={cn("px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border", form.selectedTargets.includes(dept) ? "bg-[#ff5a00] text-white border-[#ff5a00]" : "bg-white text-[#4b5563] border-[#eeeeee] hover:bg-gray-50")}>
                                {dept}
                             </button>
                          ))}
                       </div>
                    </div>
                )}

                {form.target_type === "specific" && (
                    <div className="mt-4 pt-4 border-t border-[#eeeeee] max-h-48 overflow-y-auto pr-2">
                       <p className="text-xs text-[#6b7280] mb-2">{isRTL ? "حدد الموظفين:" : "Select Employees:"}</p>
                       <div className={cn("flex flex-wrap gap-2", isRTL && "justify-end")}>
                          {employees.map(emp => (
                             <button key={emp.id} type="button" onClick={() => handleTargetToggle(emp.id)} className={cn("px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border", form.selectedTargets.includes(emp.id) ? "bg-[#ff5a00] text-white border-[#ff5a00]" : "bg-white text-[#4b5563] border-[#eeeeee] hover:bg-gray-50")}>
                                {emp.name}
                             </button>
                          ))}
                       </div>
                    </div>
                )}
            </div>

            <div className={cn("flex items-center pt-2 gap-4", isRTL && "justify-end flex-row-reverse")}>
              <PrimaryButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? (isRTL ? "جاري الإرسال عبر تليجرام..." : "Broadcasting via Telegram...") : (isRTL ? "نشر التعميم" : "Send Announcement")}
              </PrimaryButton>
              <p className="text-xs font-bold text-[#9ca3af]">
                 {isRTL ? "سيتم إرسال التنبيه فوراً كرسالة بوش للبوت." : "Will instantly push Telegram alerts to targets."}
              </p>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard padding="none" className="overflow-hidden bg-white border border-[#eeeeee]">
        <div className={cn("p-5 border-b border-[#eeeeee] flex items-center justify-between bg-[#f9fafb]", isRTL && "flex-row-reverse")}>
          <h3 className="font-bold text-[#111] text-sm">{isRTL ? "جميع التعميمات" : "All Announcements"}</h3>
        </div>

        <div className="overflow-x-auto">
           <table className="w-full text-start">
             <thead>
               <tr className="text-[#6b7280] text-[11px] uppercase tracking-wider border-b border-[#f1f1f1]">
                 <th className="px-6 py-4 font-bold text-start w-[40%]">{isRTL ? "عنوان التعميم والتفاصيل" : "Announcement Breakdown"}</th>
                 <th className="px-6 py-4 font-bold text-start w-[20%]">{isRTL ? "المستهدف" : "Target"}</th>
                 <th className="px-6 py-4 font-bold text-center w-[15%]">{isRTL ? "تاريخ الانتهاء" : "Expires"}</th>
                 <th className="px-6 py-4 font-bold text-end w-[25%]">{isRTL ? "الحالة" : "Status"}</th>
               </tr>
             </thead>
             <tbody>
               {loading ? (
                 <tr>
                   <td colSpan={4} className="px-6 py-16 text-center">
                     <div className="w-5 h-5 border-2 border-[#ff5a00] border-t-transparent rounded-full animate-spin mx-auto" />
                   </td>
                 </tr>
               ) : announcements.length === 0 ? (
                 <tr>
                   <td colSpan={4} className="px-6 py-16 text-center">
                     <Megaphone className="w-10 h-10 text-[#d1d5db] mx-auto mb-3 opacity-50" />
                     <p className="text-[#9ca3af] text-sm italic font-medium">{isRTL ? "لا توجد تعميمات إدارية منشورة." : "No announcements broadcasted yet."}</p>
                   </td>
                 </tr>
               ) : (
                 announcements.map((a) => {
                   const isExpired = new Date(a.expire_at) < new Date();
                   const isActive = a.is_active && !isExpired;

                   return (
                   <tr key={a.id} className="border-t border-[#f1f1f1] hover:bg-[#fafafa] transition-colors relative group">
                     <td className="px-6 py-4 text-start">
                       <div className="flex flex-col items-start gap-1 max-w-sm">
                         <span className="font-bold text-[#111] text-sm">{a.title}</span>
                         <span className="text-[11px] text-[#6b7280] truncate w-full">{a.message}</span>
                         <span className="text-[10px] text-[#9ca3af] mt-1">{isRTL ? `نشر بواسطة: ${a.creator?.name || 'المدير'}` : `By: ${a.creator?.name || 'Admin'}`}</span>
                       </div>
                     </td>
                     <td className="px-6 py-4 text-start">
                       <div className="flex flex-col items-start gap-1">
                         {a.target_type === 'all' && <span className="font-bold text-xs bg-[#f3f4f6] px-2 py-1 rounded text-[#4b5563]">{isRTL ? "جميع الموظفين" : "Global"}</span>}
                         {a.target_type === 'department' && (
                             <span className="font-bold text-xs bg-[#e0f2fe] px-2 py-1 rounded text-[#0369a1]" title={a.targets.map(t => t.department).join(", ")}>
                                {isRTL ? `${a.targets.length} أقسام` : `${a.targets.length} Depts`}
                             </span>
                         )}
                         {a.target_type === 'specific' && (
                             <span className="font-bold text-xs bg-[#fae8ff] px-2 py-1 rounded text-[#86198f]">
                                {isRTL ? `${a.targets.length} موظف` : `${a.targets.length} Emps`}
                             </span>
                         )}
                       </div>
                     </td>
                     <td className="px-6 py-4 text-center">
                       <span className={cn("text-xs font-semibold flex items-center justify-center gap-1", isExpired ? "text-[#b91c1c]" : "text-[#4b5563]")}>
                          <Calendar className="w-3 h-3"/> 
                          {new Date(a.expire_at).toLocaleDateString()}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-end">
                        <div className="flex justify-end items-center gap-3">
                          {isActive ? (
                              <div className="flex items-center gap-1.5 text-[#16a34a] bg-[#dcfce7] px-2.5 py-1 rounded-full text-xs font-bold border border-[#bbf7d0]">
                                 <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse"></span>
                                 {isRTL ? "نشط" : "Active"}
                              </div>
                          ) : (
                              <div className="flex items-center gap-1.5 text-[#6b7280] bg-[#f3f4f6] px-2.5 py-1 rounded-full text-xs font-bold border border-[#e5e7eb]">
                                 {isRTL ? "منتهي / غير نشط" : "Expired"}
                              </div>
                          )}
                        </div>
                     </td>
                   </tr>
                 )})
               )}
             </tbody>
           </table>
        </div>
      </SectionCard>
    </div>
  );
}
