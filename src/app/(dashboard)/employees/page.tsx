"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, X, Send, Copy, Check, Pencil, KeyRound, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";
import {
  PageHeader,
  SectionCard,
  StatusPill,
  PrimaryButton,
  SearchField,
} from "@/app/components/talabat-ui";

type Employee = {
  id: string;
  name: string;
  phone: string;
  telegram_user_id?: string | null;
  department?: string | null;
  base_salary?: number;
  salary_type?: string;
  working_hours_per_day?: number;
  overtime_rate?: number;
  created_at?: string;
};

export default function EmployeesPage() {
  const { t, isRTL } = useLanguage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [botName, setBotName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [authMode, setAuthMode] = useState<"telegram" | "password">("telegram");
  const [empPassword, setEmpPassword] = useState("");
  const [showEmpPassword, setShowEmpPassword] = useState(false);
  
  // Department State
  const [activeTab, setActiveTab] = useState<'employees' | 'departments'>('employees');
  const [departmentsList, setDepartmentsList] = useState<string[]>([]);
  const [newDepartment, setNewDepartment] = useState("");
  
  // Bulk Assign State
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [bulkDepartment, setBulkDepartment] = useState("");

  const allAvailableDepartments = useMemo(() => {
      const activeDepts = employees.map(e => e.department).filter(Boolean) as string[];
      let configuredDepts: string[] = [];
      if (Array.isArray(departmentsList)) {
          configuredDepts = departmentsList;
      } else if (typeof departmentsList === 'string') {
          try {
             configuredDepts = JSON.parse(departmentsList);
          } catch(e) {}
      }
      return Array.from(new Set([...configuredDepts, ...activeDepts]));
  }, [departmentsList, employees]);


  const [newEmployee, setNewEmployee] = useState({
    name: "",
    phone: "",
    department: "",
    base_salary: 0,
    salary_type: "monthly",
    working_hours_per_day: 8,
    overtime_rate: 1.5
  });

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });
    setEmployees((data as Employee[]) ?? []);
    setLoading(false);
  };

  const fetchCompany = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: company } = await supabase.from("companies").select("id, bot_name, departments, auth_mode").eq("owner_id", user.id).single();
    if (company) {
      setBotName(company.bot_name?.replace("@", "") || "");
      setDepartmentsList(company.departments || []);
      setAuthMode((company.auth_mode || "telegram") as "telegram" | "password");
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchCompany();
  }, []);

  const handleAddEmployee = async () => {
    if (!newEmployee.name.trim() || !newEmployee.phone.trim()) return;
    setSaving(true);
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .single();
    if (!company) {
      alert("Please set up your company first.");
      setSaving(false);
      return;
    }

    const phone = newEmployee.phone.replace(/\D/g, "");

    const { error } = await supabase.from("employees").insert({
      name: newEmployee.name.trim(),
      phone,
      department: newEmployee.department.trim() || null,
      company_id: company.id,
      base_salary: newEmployee.base_salary,
      salary_type: newEmployee.salary_type,
      working_hours_per_day: newEmployee.working_hours_per_day,
      overtime_rate: newEmployee.overtime_rate,
    });

    setSaving(false);
    if (error) {
      if (error.message.includes("employees_phone_key") || error.code === "23505") {
          alert(isRTL ? "⚠️ رقم الهاتف هذا مسجل بالفعل لموظف آخر." : "⚠️ This phone number is already registered to another employee.");
      } else {
          alert(error.message);
      }
    } else {
      setShowAddModal(false);
      setNewEmployee({ 
        name: "", 
        phone: "",
        department: "",
        base_salary: 0,
        salary_type: "monthly",
        working_hours_per_day: 8,
        overtime_rate: 1.5
      });
      fetchEmployees();
    }
  };

  const handleSaveEdit = async () => {
    if (!editingEmployee || !editingEmployee.name.trim() || !editingEmployee.phone.trim()) return;
    setSaving(true);
    const phone = editingEmployee.phone.replace(/\D/g, "");

    const { error } = await supabase.from("employees").update({
      name: editingEmployee.name.trim(),
      phone,
      department: editingEmployee.department?.trim() || null,
      base_salary: editingEmployee.base_salary,
      salary_type: editingEmployee.salary_type,
      working_hours_per_day: editingEmployee.working_hours_per_day,
      overtime_rate: editingEmployee.overtime_rate,
    }).eq("id", editingEmployee.id);

    setSaving(false);
    if (error) {
      if (error.message.includes("employees_phone_key") || error.code === "23505") {
          alert(isRTL ? "⚠️ رقم الهاتف هذا مسجل بالفعل لموظف آخر." : "⚠️ This phone number is already registered to another employee.");
      } else {
          alert(error.message);
      }
    } else {
      // If password mode and a password was provided, save it
      if (authMode === "password" && empPassword.trim()) {
        await fetch("/api/team/employees/set-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employee_id: editingEmployee.id, password: empPassword.trim() }),
        });
      }
      setShowEditModal(false);
      setEditingEmployee(null);
      setEmpPassword("");
      fetchEmployees();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await supabase.from("employees").delete().eq("id", id);
    fetchEmployees();
  };

  const handleSaveDepartment = async () => {
     if (!newDepartment.trim()) return;
     const updatedList = [...new Set([...departmentsList, newDepartment.trim()])];
     setSaving(true);
     const { data: { user } } = await supabase.auth.getUser();
     if(user) {
         const { data: company } = await supabase.from("companies").select("id").eq("owner_id", user.id).single();
         if (company) {
             await supabase.from("companies").update({ departments: updatedList }).eq("id", company.id);
             setDepartmentsList(updatedList);
             setNewDepartment("");
         }
     }
     setSaving(false);
  };

  const handleRemoveDepartment = async (dept: string) => {
     if(!confirm(isRTL ? "هل تريد مسح هذا القسم؟ لن يتم حذفه من الموظفين الحاليين." : "Remove this department? Employees currently in it will not be affected.")) return;
     const updatedList = departmentsList.filter(d => d !== dept);
     const { data: { user } } = await supabase.auth.getUser();
     if(user) {
         const { data: company } = await supabase.from("companies").select("id").eq("owner_id", user.id).single();
         if (company) {
             await supabase.from("companies").update({ departments: updatedList }).eq("id", company.id);
             setDepartmentsList(updatedList);
         }
     }
  };

  const handleBulkAssign = async () => {
    if (selectedEmployeeIds.length === 0 || !bulkDepartment) return;
    setSaving(true);
    
    // Explicit null when UNASSIGN selected so that it triggers clearing the department
    const targetDept = bulkDepartment === "UNASSIGN" ? null : bulkDepartment;

    const { error } = await supabase
      .from("employees")
      .update({ department: targetDept })
      .in("id", selectedEmployeeIds);

    if (error) {
       alert(error.message);
    } else {
       setSelectedEmployeeIds([]);
       setBulkDepartment("");
       fetchEmployees();
    }
    setSaving(false);
  };


  const copyInviteLink = (empId: string) => {
    const link = `https://t.me/${botName || 'YawmyBot'}`;
    navigator.clipboard.writeText(link);
    setCopiedId(empId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.department && e.department.toLowerCase().includes(q)) ||
        e.phone.includes(q)
    );
  }, [employees, query]);

  const groupedEmployees = useMemo(() => {
     const groups: Record<string, Employee[]> = {};
     filtered.forEach(e => {
         const dept = e.department || (isRTL ? "غير محدد التخصص" : "Unassigned");
         if (!groups[dept]) groups[dept] = [];
         groups[dept].push(e);
     });
     return groups;
  }, [filtered, isRTL]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title={isRTL ? "الموظفين" : "Employees"}
        subtitle={isRTL ? "إدارة فريق العمل وحالة الربط مع تليجرام" : "Manage your team and Telegram linking status"}
        isRTL={isRTL}
        action={
          <PrimaryButton
            icon={Plus}
            onClick={() => setShowAddModal(true)}
          >
            {isRTL ? "إضافة موظف" : "Add Employee"}
          </PrimaryButton>
        }
      />

      <div className={cn("flex items-center gap-6 border-b border-[#eeeeee] mb-6", isRTL && "flex-row-reverse")}>
         <button onClick={() => setActiveTab('employees')} className={cn("pb-3 text-sm font-bold border-b-2 transition-colors", activeTab === 'employees' ? "border-[#ff5a00] text-[#ff5a00]" : "border-transparent text-[#6b7280] hover:text-[#111]")}>
            {isRTL ? "فريق العمل" : "Employees"}
         </button>
         <button onClick={() => setActiveTab('departments')} className={cn("pb-3 text-sm font-bold border-b-2 transition-colors", activeTab === 'departments' ? "border-[#ff5a00] text-[#ff5a00]" : "border-transparent text-[#6b7280] hover:text-[#111]")}>
            {isRTL ? "إدارة الأقسام" : "Departments"}
         </button>
      </div>

      {activeTab === 'employees' ? (
        <>
          <div className={cn("flex flex-wrap items-center gap-3", isRTL && "flex-row-reverse")}>
            <SearchField
              placeholder={isRTL ? "بحث عن موظف..." : "Search employees..."}
              value={query}
              onChange={setQuery}
            />
          </div>

          <SectionCard padding="none" className="overflow-hidden bg-white border border-[#eeeeee]">
            {selectedEmployeeIds.length > 0 && (
              <div className={cn("p-4 bg-[#fff1e8] border-b border-[#ffd4b8] flex items-center justify-between", isRTL && "flex-row-reverse")}>
                 <div className={cn("flex items-center gap-2 text-[#ff5a00] font-bold text-sm", isRTL && "flex-row-reverse")}>
                   <span>{isRTL ? "محدد:" : "Selected:"}</span>
                   <span>{selectedEmployeeIds.length}</span>
                 </div>
                 <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                    <select
                      className="h-10 px-4 rounded-lg bg-white border border-[#ffd4b8] text-sm text-[#111] font-bold outline-none"
                      value={bulkDepartment}
                      onChange={(e) => setBulkDepartment(e.target.value)}
                    >
                      <option value="">{isRTL ? "--- اختر القسم ---" : "--- Select Dept ---"}</option>
                      <option value="UNASSIGN">{isRTL ? "إزالة التخصيص" : "Remove Dept"}</option>
                      {allAvailableDepartments.map(d => (
                         <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <PrimaryButton 
                      disabled={!bulkDepartment || saving} 
                      onClick={handleBulkAssign}
                      className="h-10 px-6 bg-[#ff5a00]"
                    >
                      {saving ? "..." : (isRTL ? "تطبيق" : "Apply")}
                    </PrimaryButton>
                 </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-start">
                <thead>
                  <tr className="text-[#6b7280] text-[11px] uppercase tracking-wider border-b border-[#f1f1f1]">
                    <th className="px-6 py-5 w-12 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-[#eeeeee] accent-[#ff5a00]" 
                        checked={selectedEmployeeIds.length === filtered.length && filtered.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedEmployeeIds(filtered.map(emp => emp.id));
                          else setSelectedEmployeeIds([]);
                        }}
                      />
                    </th>
                    <th className={cn("px-4 py-5 font-bold w-[30%]", isRTL ? "text-right" : "text-left")}>
                      {isRTL ? "الموظف" : "Employee"}
                    </th>
                    <th className={cn("px-6 py-5 font-bold w-[20%]", isRTL ? "text-right" : "text-left")}>{isRTL ? "رقم الهاتف" : "Phone"}</th>
                    <th className={cn("px-6 py-5 font-bold w-[25%]", isRTL ? "text-right" : "text-left")}>{isRTL ? "حالة الربط" : "Status"}</th>
                    <th className={cn("px-6 py-5 font-bold w-[25%]", isRTL ? "text-left" : "text-right")}>
                      {isRTL ? "الإجراءات" : "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center">
                        <div className="w-5 h-5 border-2 border-[#ff5a00] border-t-transparent rounded-full animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center text-[#9ca3af] text-sm italic">
                        {isRTL ? "لا يوجد موظفين حالياً" : "No employees added yet."}
                      </td>
                    </tr>
                  ) : (
                    Object.entries(groupedEmployees).map(([dept, emps]) => (
                      <React.Fragment key={dept}>
                        <tr className="bg-[#f9fafb] border-y border-[#eeeeee]">
                           <td colSpan={5} className={cn("px-6 py-3", isRTL ? "text-right" : "text-left")}>
                               <span className="text-xs font-bold text-[#6b7280]">{dept}</span>
                               <span className="mx-2 text-[10px] bg-white border border-[#eeeeee] rounded-full px-2 py-0.5 text-[#111]">{emps.length}</span>
                           </td>
                        </tr>
                        {emps.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-t border-[#f1f1f1] hover:bg-[#fafafa] transition-colors group"
                  >
                    <td className="px-6 py-5 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-[#eeeeee] accent-[#ff5a00]" 
                        checked={selectedEmployeeIds.includes(emp.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedEmployeeIds([...selectedEmployeeIds, emp.id]);
                          else setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== emp.id));
                        }}
                      />
                    </td>
                    <td className="px-4 py-5 text-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#fff1e8] text-[#ff5a00] flex items-center justify-center text-xs font-bold uppercase ring-1 ring-[#ffd4b8] shrink-0">
                          {emp.name.substring(0, 2)}
                        </div>
                        <div className="text-start max-w-[200px]">
                          <p className="text-sm font-bold text-[#111] truncate">{emp.name}</p>
                          <p className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-wider">{emp.department || (isRTL ? "غير محدد التخصص" : "Unassigned Dept")}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-semibold text-[#4b5563] font-mono text-start">
                      <span dir="ltr" className="inline-block">+{"\u200E"}{emp.phone}</span>
                    </td>
                    <td className="px-6 py-5 text-start">
                      <StatusPill
                        label={emp.telegram_user_id ? (isRTL ? "متصل" : "Connected") : (isRTL ? "غير مربوط" : "Not Linked")}
                        tone={emp.telegram_user_id ? "success" : "neutral"}
                      />
                    </td>
                    <td className="px-6 py-5 text-end">
                      <div className="flex items-center gap-2 justify-end">
                        {!emp.telegram_user_id && (
                          <button
                            onClick={() => copyInviteLink(emp.id)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                              copiedId === emp.id 
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                                : "bg-[#fff1e8] text-[#ff5a00] border border-[#ffd4b8] hover:bg-[#ff5a00] hover:text-white"
                            )}
                          >
                            {copiedId === emp.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copiedId === emp.id ? (isRTL ? "تم النسخ" : "Copied") : (isRTL ? "نسخ الرابط" : "Invite")}
                          </button>
                        )}
                        <button
                          onClick={() => { setEditingEmployee(emp); setEmpPassword(""); setShowEmpPassword(false); setShowEditModal(true); }}
                          className="p-2 rounded-lg text-[#6b7280] hover:text-[#0284c7] hover:bg-[#f0f9ff] transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="p-2 rounded-lg text-[#6b7280] hover:text-[#b91c1c] hover:bg-[#fef1f1] transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      ) : (
        <div className="max-w-2xl space-y-6 animate-in slide-in-from-bottom-2 duration-500">
           <SectionCard className="border-[#eeeeee]">
               <div className={cn("mb-6", isRTL && "text-end")}>
                  <h3 className="text-sm font-bold text-[#111] mb-1">{isRTL ? "إضافة قسم جديد" : "Add New Department"}</h3>
                  <p className="text-xs text-[#6b7280]">{isRTL ? "أضف الأقسام ليتمكن التيم من التصنيف على أساسها." : "Add departments to group your team effectively."}</p>
               </div>
               
               <div className={cn("flex flex-wrap gap-3 mb-8", isRTL && "flex-row-reverse")}>
                  <input value={newDepartment} onChange={e=>setNewDepartment(e.target.value)} type="text" className={cn("flex-1 h-11 px-4 rounded-xl border border-[#eeeeee] text-sm font-bold outline-none focus:border-[#ff5a00] transition-colors", isRTL && "text-right")} placeholder={isRTL ? "مثال: قسم المبيعات، المحاسبة..." : "Sales, HR..."} />
                  <PrimaryButton disabled={saving} onClick={handleSaveDepartment} className="px-8 h-11 bg-[#111] border-transparent hover:bg-black text-white">
                     {saving ? "..." : (isRTL ? "إضافة القسم" : "Add")}
                  </PrimaryButton>
               </div>
               
               <div className="space-y-3">
                  {departmentsList.length === 0 ? (
                     <div className="p-6 text-center bg-[#f9fafb] border border-[#eeeeee] rounded-xl border-dashed">
                       <p className="text-sm text-[#9ca3af] font-bold italic">{isRTL ? "لا توجد أقسام مسجلة." : "No departments added yet."}</p>
                     </div>
                  ) : departmentsList.map(dept => (
                     <div key={dept} className={cn("flex items-center justify-between p-4 bg-[#f9fafb] border border-[#eeeeee] rounded-xl hover:bg-white transition-colors group space-x-reverse", isRTL && "flex-row-reverse")}>
                         <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                             <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs ring-1 ring-indigo-100/50">
                                {dept.substring(0, 1)}
                             </div>
                             <span className="font-bold text-sm text-[#111]">{dept}</span>
                         </div>
                         <button onClick={() => handleRemoveDepartment(dept)} className="p-2 text-[#9ca3af] hover:text-[#b91c1c] hover:bg-[#fef1f1] rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-4 h-4" />
                         </button>
                     </div>
                  ))}
               </div>
           </SectionCard>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md border border-[#eeeeee] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#f1f1f1]">
              <h2 className="text-lg font-bold text-[#111]">{isRTL ? "إضافة موظف جديد" : "Add New Employee"}</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg text-[#6b7280] hover:text-[#111] hover:bg-[#f5f5f5] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={cn("px-6 py-8 space-y-6", isRTL && "text-right")}>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">
                  {isRTL ? "الاسم الرباعي" : "Full Name"}
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder={isRTL ? "أدخل اسم الموظف..." : "John Doe"}
                  className="w-full h-12 px-4 rounded-xl bg-[#f9fafb] border border-[#eeeeee] text-sm text-[#111] font-bold outline-none focus:bg-white focus:border-[#ff5a00] transition-all"
                  value={newEmployee.name}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5 align-end">
                <label className="block text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">
                  {isRTL ? "القسم / التخصص (اختياري)" : "Department"}
                </label>
                {allAvailableDepartments.length > 0 ? (
                  <select
                    className="w-full h-12 px-4 py-0 rounded-xl bg-[#f9fafb] border border-[#eeeeee] text-sm text-[#111] font-bold outline-none focus:bg-white focus:border-[#ff5a00] transition-all"
                    value={newEmployee.department}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, department: e.target.value })
                    }
                  >
                    <option value="">{isRTL ? "--- اختر تخصيص ---" : "--- Unassigned ---"}</option>
                    {allAvailableDepartments.map(d => (
                       <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full h-12 px-4 rounded-xl bg-[#fff1e8] border border-[#ffd4b8] text-[#ff5a00] flex items-center text-xs font-bold leading-tight">
                     {isRTL ? "يرجى إضافة أقسام أولاً من تبويب الأقسام." : "Please create departments first."}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">
                  {isRTL ? "رقم الهاتف (الواتساب)" : "WhatsApp Number"}
                </label>
                <input
                  type="text"
                  placeholder="201234567890"
                  className="w-full h-12 px-4 rounded-xl bg-[#f9fafb] border border-[#eeeeee] text-sm text-[#111] font-mono font-bold outline-none focus:bg-white focus:border-[#ff5a00] transition-all"
                  value={newEmployee.phone}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, phone: e.target.value })
                  }
                />
                <p className="text-[10px] text-[#9ca3af] font-medium leading-relaxed">
                  {isRTL 
                    ? "أدخل كود الدولة متبوعاً بالرقم، أرقام فقط (مثال: 201234567890)" 
                    : "Include country code, digits only (e.g. 201234567890)"}
                </p>
              </div>
              
              {/* HR & Payroll Fields */}
              <div className="pt-4 border-t border-[#eeeeee] space-y-6">
                <h3 className="text-sm font-bold text-[#111]">{isRTL ? "بيانات الرواتب والموارد البشرية" : "Payroll & HR Data"}</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">
                      {isRTL ? "نظام الراتب" : "Salary Type"}
                    </label>
                    <select
                      className="w-full h-12 px-4 rounded-xl bg-[#f9fafb] border border-[#eeeeee] text-sm text-[#111] font-bold outline-none focus:bg-white focus:border-[#ff5a00] transition-all"
                      value={newEmployee.salary_type}
                      onChange={(e) => setNewEmployee({ ...newEmployee, salary_type: e.target.value })}
                    >
                      <option value="monthly">{isRTL ? "شهري" : "Monthly"}</option>
                      <option value="daily">{isRTL ? "يومي" : "Daily"}</option>
                      <option value="hourly">{isRTL ? "بالساعة" : "Hourly"}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">
                      {isRTL ? "الراتب الأساسي" : "Base Salary"}
                    </label>
                    <input
                      type="number"
                      className="w-full h-12 px-4 rounded-xl bg-[#f9fafb] border border-[#eeeeee] text-sm text-[#111] font-bold outline-none focus:bg-white focus:border-[#ff5a00] transition-all"
                      value={newEmployee.base_salary}
                      onChange={(e) => setNewEmployee({ ...newEmployee, base_salary: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">
                      {isRTL ? "ساعات العمل يومياً" : "Daily Hours"}
                    </label>
                    <input
                      type="number"
                      className="w-full h-12 px-4 rounded-xl bg-[#f9fafb] border border-[#eeeeee] text-sm text-[#111] font-bold outline-none focus:bg-white focus:border-[#ff5a00] transition-all"
                      value={newEmployee.working_hours_per_day}
                      onChange={(e) => setNewEmployee({ ...newEmployee, working_hours_per_day: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">
                      {isRTL ? "مضاعف الإضافي" : "Overtime Rate"}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full h-12 px-4 rounded-xl bg-[#f9fafb] border border-[#eeeeee] text-sm text-[#111] font-bold outline-none focus:bg-white focus:border-[#ff5a00] transition-all"
                      value={newEmployee.overtime_rate}
                      onChange={(e) => setNewEmployee({ ...newEmployee, overtime_rate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-[#f1f1f1] bg-[#f9fafb]">
              <button
                onClick={() => setShowAddModal(false)}
                className="text-sm font-bold text-[#6b7280] hover:text-[#111] px-4 transition-colors"
              >
                {t.cancel}
              </button>
              <PrimaryButton onClick={handleAddEmployee} disabled={saving} className="px-8 h-11 bg-[#ff5a00] hover:bg-[#e65100]">
                {saving ? "..." : (isRTL ? "حفظ البيانات" : "Save Employee")}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md border border-[#eeeeee] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#f1f1f1]">
              <h2 className="text-lg font-bold text-[#111]">{isRTL ? "تعديل بيانات الموظف" : "Edit Employee"}</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-lg text-[#6b7280] hover:text-[#111] hover:bg-[#f5f5f5] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={cn("px-6 py-8 space-y-6 max-h-[70vh] overflow-y-auto", isRTL && "text-right")}>
              <div className="space-y-1.5 text-start" dir={isRTL ? "rtl" : "ltr"}>
                <label className="block text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">
                  {isRTL ? "الاسم الرباعي" : "Full Name"}
                </label>
                <input
                  type="text"
                  autoFocus
                  className="w-full h-12 px-4 rounded-xl bg-[#f9fafb] border border-[#eeeeee] text-sm text-[#111] font-bold outline-none focus:bg-white focus:border-[#ff5a00] transition-all"
                  value={editingEmployee.name}
                  onChange={(e) =>
                    setEditingEmployee({ ...editingEmployee, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5 align-end" dir={isRTL ? "rtl" : "ltr"}>
                <label className="block text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">
                  {isRTL ? "القسم / التخصص (اختياري)" : "Department"}
                </label>
                {allAvailableDepartments.length > 0 ? (
                  <select
                    className="w-full h-12 px-4 py-0 rounded-xl bg-[#f9fafb] border border-[#eeeeee] text-sm text-[#111] font-bold outline-none focus:bg-white focus:border-[#ff5a00] transition-all"
                    value={editingEmployee.department || ""}
                    onChange={(e) =>
                      setEditingEmployee({ ...editingEmployee, department: e.target.value })
                    }
                  >
                    <option value="">{isRTL ? "--- اختر تخصيص ---" : "--- Unassigned ---"}</option>
                    {allAvailableDepartments.map(d => (
                       <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full h-12 px-4 rounded-xl bg-[#fff1e8] border border-[#ffd4b8] text-[#ff5a00] flex items-center text-xs font-bold leading-tight">
                     {isRTL ? "يرجى إضافة أقسام أولاً من تبويب الأقسام." : "Please create departments first."}
                  </div>
                )}
              </div>
              <div className="space-y-1.5 text-start" dir={isRTL ? "rtl" : "ltr"}>
                <label className="block text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">
                  {isRTL ? "رقم الهاتف (الواتساب)" : "WhatsApp Number"}
                </label>
                <input
                  type="text"
                  className="w-full h-12 px-4 rounded-xl bg-[#f9fafb] border border-[#eeeeee] text-sm text-[#111] font-mono font-bold outline-none focus:bg-white focus:border-[#ff5a00] transition-all"
                  value={editingEmployee.phone}
                  onChange={(e) =>
                    setEditingEmployee({ ...editingEmployee, phone: e.target.value })
                  }
                />
              </div>
              
              <div className="pt-4 border-t border-[#eeeeee] space-y-6 text-start" dir={isRTL ? "rtl" : "ltr"}>
                <h3 className="text-sm font-bold text-[#111]">{isRTL ? "بيانات الرواتب والموارد البشرية" : "Payroll & HR Data"}</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">
                      {isRTL ? "نظام الراتب" : "Salary Type"}
                    </label>
                    <select
                      className="w-full h-12 px-4 rounded-xl bg-[#f9fafb] border border-[#eeeeee] text-sm text-[#111] font-bold outline-none focus:bg-white focus:border-[#ff5a00] transition-all"
                      value={editingEmployee.salary_type || "monthly"}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, salary_type: e.target.value })}
                    >
                      <option value="monthly">{isRTL ? "شهري" : "Monthly"}</option>
                      <option value="daily">{isRTL ? "يومي" : "Daily"}</option>
                      <option value="hourly">{isRTL ? "بالساعة" : "Hourly"}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">
                      {isRTL ? "الراتب الأساسي" : "Base Salary"}
                    </label>
                    <input
                      type="number"
                      className="w-full h-12 px-4 rounded-xl bg-[#f9fafb] border border-[#eeeeee] text-sm text-[#111] font-bold outline-none focus:bg-white focus:border-[#ff5a00] transition-all"
                      value={editingEmployee.base_salary || 0}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, base_salary: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">
                      {isRTL ? "ساعات العمل يومياً" : "Daily Hours"}
                    </label>
                    <input
                      type="number"
                      className="w-full h-12 px-4 rounded-xl bg-[#f9fafb] border border-[#eeeeee] text-sm text-[#111] font-bold outline-none focus:bg-white focus:border-[#ff5a00] transition-all"
                      value={editingEmployee.working_hours_per_day || 0}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, working_hours_per_day: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">
                      {isRTL ? "مضاعف الإضافي" : "Overtime Rate"}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full h-12 px-4 rounded-xl bg-[#f9fafb] border border-[#eeeeee] text-sm text-[#111] font-bold outline-none focus:bg-white focus:border-[#ff5a00] transition-all"
                      value={editingEmployee.overtime_rate || 0}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, overtime_rate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              {/* Password Section — only in password auth mode */}
              {authMode === "password" && (
                <div className="pt-4 border-t border-[#eeeeee] space-y-3 text-start" dir={isRTL ? "rtl" : "ltr"}>
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#ff5a00]" />
                    <h3 className="text-sm font-bold text-[#111]">{isRTL ? "كلمة مرور تسجيل الدخول" : "Login Password"}</h3>
                  </div>
                  <p className="text-[11px] text-[#9ca3af]">{isRTL ? "اتركها فارغة للإبقاء على كلمة المرور الحالية." : "Leave blank to keep the current password."}</p>
                  <div className="flex items-center border border-[#eeeeee] rounded-xl bg-[#f9fafb] focus-within:border-[#ff5a00] focus-within:bg-white transition-all">
                    <input
                      type={showEmpPassword ? "text" : "password"}
                      placeholder={isRTL ? "كلمة مرور جديدة..." : "New password..."}
                      value={empPassword}
                      onChange={(e) => setEmpPassword(e.target.value)}
                      className="flex-1 h-12 px-4 bg-transparent text-sm font-mono text-[#111] outline-none"
                    />
                    <button type="button" onClick={() => setShowEmpPassword(v => !v)} className="px-3 text-[#9ca3af] hover:text-[#111] transition-colors">
                      {showEmpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-[#f1f1f1] bg-[#f9fafb]">
              <button
                onClick={() => setShowEditModal(false)}
                className="text-sm font-bold text-[#6b7280] hover:text-[#111] px-4 transition-colors"
              >
                {t.cancel}
              </button>
              <PrimaryButton onClick={handleSaveEdit} disabled={saving} className="px-8 h-11 bg-[#ff5a00] hover:bg-[#e65100]">
                {saving ? "..." : (isRTL ? "حفظ التعديلات" : "Save Changes")}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
