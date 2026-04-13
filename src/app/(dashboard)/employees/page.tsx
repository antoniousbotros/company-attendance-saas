"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, ExternalLink, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function EmployeesPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmployee, setNewEmployee] = useState({ name: "", phone: "", department: "" });

  const fetchEmployees = async () => {
    setLoading(true);
    const { data } = await supabase.from("employees").select("*").order("created_at", { ascending: false });
    if (data) setEmployees(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async () => {
    const { data: company } = await supabase.from("companies").select("id").single();
    if (!company) return alert("Please set up your company first.");

    const { error } = await supabase.from("employees").insert({
      name: newEmployee.name,
      phone: newEmployee.phone.replace("+", ""),
      company_id: company.id
    });

    if (error) {
       alert(error.message);
    } else {
       setShowAddModal(false);
       setNewEmployee({ name: "", phone: "", department: "" });
       fetchEmployees();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await supabase.from("employees").delete().eq("id", id);
    fetchEmployees();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-zinc-400 mt-2">Manage your team and their Telegram connectivity.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Employee
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Employee</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Phone</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Telegram Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-zinc-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-zinc-500 italic">
                  {loading ? "Loading..." : "No employees found. Add your first team member!"}
                </td>
              </tr>
            ) : employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-indigo-400 uppercase">
                      {emp.name.substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-200">{emp.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-zinc-400 font-mono text-sm">+{emp.phone}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      emp.telegram_user_id ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-600"
                    )}></div>
                    <span className="text-sm text-zinc-300">
                      {emp.telegram_user_id ? "Connected" : "Not Linked"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleDelete(emp.id)}
                      className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-2">Add New Employee</h2>
            <p className="text-zinc-500 text-sm mb-6">Enter details to generate their link.</p>
            
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Full Name" 
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 outline-none" 
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="Phone (e.g. 201234567890)" 
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 outline-none" 
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
              />
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddEmployee}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper local cn function if needed
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
