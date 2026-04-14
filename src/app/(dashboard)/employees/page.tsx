"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, X, Send, Copy, Check, Pencil } from "lucide-react";
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
    const { data: company } = await supabase.from("companies").select("bot_name").single();
    if (company?.bot_name) {
      setBotName(company.bot_name.replace("@", ""));
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
      alert(error.message);
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
      alert(error.message);
    } else {
      setShowEditModal(false);
      setEditingEmployee(null);
      fetchEmployees();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await supabase.from("employees").delete().eq("id", id);
    fetchEmployees();
  };

  const copyInviteLink = (empId: string) => {
    const link = `https://t.me/${botName || 'SyncTimeBot'}`;
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

      <div
        className={cn(
          "flex flex-wrap items-center gap-3",
          isRTL && "flex-row-reverse"
        )}
      >
        <SearchField
          placeholder={isRTL ? "بحث عن موظف..." : "Search employees..."}
          value={query}
          onChange={setQuery}
        />
      </div>

      <SectionCard padding="none" className="overflow-hidden bg-white border border-[#eeeeee]">
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              <tr className="text-[#6b7280] text-[11px] uppercase tracking-wider border-b border-[#f1f1f1]">
                <th className="px-6 py-5 font-bold text-start w-[30%]">
                  {isRTL ? "الموظف" : "Employee"}
                </th>
                <th className="px-6 py-5 font-bold text-start w-[20%]">{isRTL ? "رقم الهاتف" : "Phone"}</th>
                <th className="px-6 py-5 font-bold text-start w-[25%]">
                  {isRTL ? "حالة الربط" : "Status"}
                </th>
                <th className="px-6 py-5 font-bold text-end w-[25%]">
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
                filtered.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-t border-[#f1f1f1] hover:bg-[#fafafa] transition-colors group"
                  >
                    <td className="px-6 py-5 text-start">
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
                          onClick={() => { setEditingEmployee(emp); setShowEditModal(true); }}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

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
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">
                  {isRTL ? "القسم / التخصص (اختياري)" : "Department"}
                </label>
                <input
                  type="text"
                  placeholder={isRTL ? "مثال: مهندس برمجيات، محاسب..." : "e.g., Software, Marketing..."}
                  className="w-full h-12 px-4 rounded-xl bg-[#f9fafb] border border-[#eeeeee] text-sm text-[#111] font-bold outline-none focus:bg-white focus:border-[#ff5a00] transition-all"
                  value={newEmployee.department}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, department: e.target.value })
                  }
                />
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
              <div className="space-y-1.5 text-start" dir={isRTL ? "rtl" : "ltr"}>
                <label className="block text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">
                  {isRTL ? "القسم / التخصص (اختياري)" : "Department"}
                </label>
                <input
                  type="text"
                  className="w-full h-12 px-4 rounded-xl bg-[#f9fafb] border border-[#eeeeee] text-sm text-[#111] font-bold outline-none focus:bg-white focus:border-[#ff5a00] transition-all"
                  value={editingEmployee.department || ""}
                  onChange={(e) =>
                    setEditingEmployee({ ...editingEmployee, department: e.target.value })
                  }
                />
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
