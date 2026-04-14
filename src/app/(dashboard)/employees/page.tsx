"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, X } from "lucide-react";
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

  useEffect(() => {
    // Inline async so setState only fires after awaits, not synchronously in the effect body.
    const load = async () => {
      const { data } = await supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });
      setEmployees((data as Employee[]) ?? []);
      setLoading(false);
    };
    void load();
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

    // Phone normalization (keep digits only — required for Telegram bot matching)
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
    <div className="space-y-8">
      <PageHeader
        title={t.employeesTitle}
        subtitle={t.employeesSubtitle}
        isRTL={isRTL}
        action={
          <PrimaryButton
            icon={Plus}
            onClick={() => setShowAddModal(true)}
          >
            {t.addEmployee}
          </PrimaryButton>
        }
      />

      {/* Filter row */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-3",
          isRTL && "flex-row-reverse"
        )}
      >
        <SearchField
          placeholder={t.searchPlaceholder}
          value={query}
          onChange={setQuery}
        />
      </div>

      {/* Table */}
      <SectionCard padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[#6b7280] text-xs">
                <th className="text-left font-medium px-6 py-4">
                  {t.employee}
                </th>
                <th className="text-left font-medium px-6 py-4">{t.phone}</th>
                <th className="text-left font-medium px-6 py-4">
                  {t.telegramStatus}
                </th>
                <th className="text-right font-medium px-6 py-4">
                  {t.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-16 text-center text-[#9ca3af] text-sm"
                  >
                    …
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-16 text-center text-[#9ca3af] text-sm italic"
                  >
                    {t.noEmployees}
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-t border-[#f1f1f1] hover:bg-[#fafafa] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#fff1e8] text-[#ff5a00] flex items-center justify-center text-xs font-bold uppercase">
                          {emp.name.substring(0, 2)}
                        </div>
                        <p className="text-sm font-semibold text-[#111]">
                          {emp.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4b5563] font-mono">
                      +{emp.phone}
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill
                        label={emp.telegram_user_id ? t.connected : t.notLinked}
                        tone={emp.telegram_user_id ? "success" : "neutral"}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="p-2 rounded-md text-[#6b7280] hover:text-[#b91c1c] hover:bg-[#fef1f1] transition-colors"
                        aria-label="Delete employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Add employee modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md border border-[#eeeeee] shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f1f1]">
              <h2 className="text-lg font-bold text-[#111]">{t.addEmployee}</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-md text-[#6b7280] hover:text-[#111] hover:bg-[#f5f5f5]"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6b7280] mb-1.5">
                  {t.employee}
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="Full name"
                  className="w-full h-10 px-3 rounded-md bg-white border border-[#eeeeee] text-sm text-[#111] outline-none focus:border-[#ffd4b8] focus:ring-2 focus:ring-[#ff5a00]/10"
                  value={newEmployee.name}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6b7280] mb-1.5">
                  {t.phone}
                </label>
                <input
                  type="text"
                  placeholder="201234567890"
                  className="w-full h-10 px-3 rounded-md bg-white border border-[#eeeeee] text-sm text-[#111] font-mono outline-none focus:border-[#ffd4b8] focus:ring-2 focus:ring-[#ff5a00]/10"
                  value={newEmployee.phone}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, phone: e.target.value })
                  }
                />
                <p className="text-[11px] text-[#9ca3af] mt-1.5">
                  Country code + number, digits only (e.g. 201234567890)
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#f1f1f1] bg-[#fafafa] rounded-b-xl">
              <button
                onClick={() => setShowAddModal(false)}
                className="h-10 px-4 text-sm font-medium text-[#4b5563] hover:text-[#111] rounded-md hover:bg-white transition-colors"
              >
                {t.cancel}
              </button>
              <PrimaryButton onClick={handleAddEmployee} disabled={saving}>
                {saving ? "…" : t.saveChanges}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
