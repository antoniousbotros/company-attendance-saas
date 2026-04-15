"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { 
  Bot, ShieldCheck, 
  LogIn, Clock, RefreshCw, Search, Mail
} from "lucide-react";

export default function SadminAccounts() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [impersonating, setImpersonating] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sadmin/data");
      const data = await res.json();
      if (data.ok) {
        setCompanies(data.companies);
        setFilteredCompanies(data.companies);
      } else {
        alert("API Error: " + data.error);
      }
    } catch (e: any) {
      alert("Fetch Error: " + e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = companies.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.id.toLowerCase().includes(query) ||
      (c.ownerData?.email || "").toLowerCase().includes(query)
    );
    setFilteredCompanies(filtered);
  }, [searchQuery, companies]);

  const handleImpersonate = async (ownerId: string, companyId: string) => {
    if (!confirm("Are you sure you want to login as this user?")) return;
    setImpersonating(companyId);
    
    try {
      const res = await fetch("/api/sadmin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId }),
      });
      const data = await res.json();
      
      if (data.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to impersonate");
      }
    } catch (e: any) {
      alert(e.message);
    }
    setImpersonating(null);
  };

  const handleUpdatePlan = async (companyId: string, newPlan: string, extendDays: number = 0) => {
    setUpdating(companyId);
    try {
      const res = await fetch("/api/sadmin/update-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, newPlan, extendDays }),
      });
      if (res.ok) {
        await loadData();
      } else {
        const errorData = await res.json();
        alert(errorData.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
    setUpdating(null);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-zinc-500">Loading Accounts Matrix...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header section with search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">Accounts</h1>
          <p className="text-zinc-400">Manage all tenant companies and subscription states.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search companies, emails..."
              className="bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={loadData} className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/80 text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-800/50">
                <th className="px-6 py-4 font-semibold">Company Instance</th>
                <th className="px-6 py-4 font-semibold">Bot Configuration</th>
                <th className="px-6 py-4 font-semibold">Subscription</th>
                <th className="px-6 py-4 font-semibold text-right">Control Panes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30 text-sm">
              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                    No matching accounts found in intelligence matrix.
                  </td>
                </tr>
              )}
              {filteredCompanies.map((company) => {
                const isTrialActive = new Date(company.trial_ends_at) > new Date();
                
                return (
                  <tr key={company.id} className="hover:bg-zinc-800/20 transition-colors group">
                    {/* Company Info */}
                    <td className="px-6 py-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 text-sm">
                          {company.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white text-base leading-none mb-1.5">{company.name}</p>
                          <div className="flex items-center gap-2 text-zinc-500 text-xs">
                            <Mail className="w-3 h-3" />
                            <span className="font-mono">{company.ownerData?.email || 'No email attached'}</span>
                          </div>
                          <p className="text-zinc-600 font-mono text-[10px] mt-1 uppercase tracking-tighter">{company.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Bot Info */}
                    <td className="px-6 py-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-zinc-300">
                          <Bot className="w-3.5 h-3.5 text-sky-400" />
                          <span className="text-xs font-medium">{company.bot_name ? `@${company.bot_name}` : "UNCONFIGURED"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[11px] font-mono text-zinc-500 max-w-[120px] truncate" title={company.telegram_token}>
                            {company.telegram_token || 'MISSING_TOKEN'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Plan Info */}
                    <td className="px-6 py-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                            company.plan_id === 'enterprise' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                            company.plan_id === 'pro' ? 'bg-zinc-100/10 border-white/20 text-white' :
                            'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          }`}>
                            {company.plan_id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          <Clock className={`w-3 h-3 ${isTrialActive ? 'text-emerald-400' : 'text-red-400'}`} />
                          <span className={isTrialActive ? 'text-zinc-400' : 'text-red-400'}>
                             Ends: {company.trial_ends_at ? format(new Date(company.trial_ends_at), "MMM d, yyyy") : "N/A"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Row Actions */}
                    <td className="px-6 py-6 text-right">
                      <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        {/* Plan Selector */}
                        <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden h-9">
                          <select 
                            value={company.plan_id}
                            onChange={(e) => handleUpdatePlan(company.id, e.target.value)}
                            disabled={updating === company.id}
                            className="bg-transparent text-white px-2 py-1 outline-none text-xs appearance-none cursor-pointer border-r border-zinc-800 pr-6"
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a1a1aa\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center', backgroundSize: '12px' }}
                          >
                            <option value="free">Free</option>
                            <option value="starter">Starter</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                          <button 
                            onClick={() => handleUpdatePlan(company.id, company.plan_id, 14)}
                            disabled={updating === company.id}
                            className="px-3 text-[10px] font-black hover:bg-zinc-800 transition-colors text-emerald-400"
                            title="+14 Days"
                          >
                            +14D
                          </button>
                        </div>

                        {/* Impersonate */}
                        <button 
                          onClick={() => handleImpersonate(company.owner_id, company.id)}
                          disabled={impersonating === company.id}
                          className="bg-white text-black font-black text-xs px-4 py-2 rounded-lg hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-lg shadow-white/5 active:scale-95 disabled:opacity-50"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          {impersonating === company.id ? "SYNCCING..." : "IMPERSONATE"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
