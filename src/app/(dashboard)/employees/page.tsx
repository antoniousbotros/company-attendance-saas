"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, X, Send, Copy, Check } from "lucide-react";
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
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    phone: "",
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
      company_id: company.id,
    });

    setSaving(false);
    if (error) {
      alert(error.message);
    } else {
      setShowAddModal(false);
      setNewEmployee({ name: "", phone: "" });
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
          <table className="w-full">
            <thead>
              <tr className="text-[#6b7280] text-[11px] uppercase tracking-wider border-b border-[#f1f1f1]">
                <th className={cn("px-6 py-5 font-bold", isRTL ? "text-right" : "text-left")}>
                  {isRTL ? "الموظف" : "Employee"}
                </th>
                <th className={cn("px-6 py-5 font-bold", isRTL ? "text-right" : "text-left")}>{isRTL ? "رقم الهاتف" : "Phone"}</th>
                <th className={cn("px-6 py-5 font-bold", isRTL ? "text-right" : "text-left")}>
                  {isRTL ? "حالة الربط" : "Status"}
                </th>
                <th className={cn("px-6 py-5 font-bold", isRTL ? "text-left" : "text-right")}>
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
                    <td className="px-6 py-5">
                      <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                        <div className="w-10 h-10 rounded-xl bg-[#fff1e8] text-[#ff5a00] flex items-center justify-center text-xs font-bold uppercase ring-1 ring-[#ffd4b8]">
                          {emp.name.substring(0, 2)}
                        </div>
                        <div className={isRTL ? "text-right" : "text-left"}>
                          <p className="text-sm font-bold text-[#111]">{emp.name}</p>
                          <p className="text-[10px] text-[#9ca3af] font-medium uppercase">{isRTL ? "موظف" : "Staff"}</p>
                        </div>
                      </div>
                    </td>
                    <td className={cn("px-6 py-5 text-sm font-semibold text-[#4b5563] font-mono", isRTL && "text-right")}>
                      +{emp.phone}
                    </td>
                    <td className="px-6 py-5">
                      <StatusPill
                        label={emp.telegram_user_id ? (isRTL ? "متصل" : "Connected") : (isRTL ? "غير مربوط" : "Not Linked")}
                        tone={emp.telegram_user_id ? "success" : "neutral"}
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div className={cn("flex items-center gap-2", isRTL ? "justify-start" : "justify-end")}>
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
    </div>
  );
}
