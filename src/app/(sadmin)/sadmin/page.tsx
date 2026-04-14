"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { 
  Building2, Bot, CreditCard, ShieldCheck, 
  ExternalLink, LogIn, Clock, AlertTriangle, CheckCircle2,
  RefreshCw, Power
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function SadminDashboard() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();

  const loadData = async () => {
    setLoading(true);
    // Note: To fetch everything, we actually need an API route using Service Role Key
    // because standard RLS blocks us.
    try {
      const res = await fetch("/api/sadmin/data");
      const data = await res.json();
      if (data.ok) {
        setCompanies(data.companies);
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
        window.location.href = data.url; // Redirect via Magic Link
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
        await loadData(); // Reload stats
      } else {
        const errorData = await res.json();
        alert(errorData.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
    setUpdating(null);
  };
  
  const handleSignout = async () => {
     await fetch("/api/sadmin/auth?action=logout", { method: "POST" });
     router.push("/sadmin/login");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-zinc-500">Loading Intelligence...</div>;
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black">God Mode</h1>
              <p className="text-zinc-400 text-sm">Managing {companies.length} active companies</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={loadData} className="p-3 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-xl transition-all">
                <RefreshCw className="w-5 h-5" />
             </button>
             <button onClick={handleSignout} className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all flex items-center gap-2 font-bold text-sm">
                <Power className="w-5 h-5" /> Sign Out
             </button>
          </div>
        </div>

        {/* Company List */}
        <div className="grid grid-cols-1 gap-4">
          {companies.map((company) => {
            const isTrialActive = new Date(company.trial_ends_at) > new Date();
            
            return (
              <div key={company.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col lg:flex-row gap-6 relative overflow-hidden group">
                
                {/* Visual Accent */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${company.plan_id === 'enterprise' ? 'bg-indigo-500' : company.plan_id === 'pro' ? 'bg-primary' : 'bg-emerald-500'}`} />

                {/* Left: Core Info */}
                <div className="flex-1 space-y-4 text-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-zinc-400" />
                        {company.name}
                      </h2>
                      <p className="text-zinc-500 font-mono mt-1 text-xs">{company.id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-800/50">
                    <div>
                      <p className="text-zinc-500 mb-1 flex items-center gap-1"><Bot className="w-4 h-4"/> Bot Name</p>
                      <p className="font-medium text-sky-400">{company.bot_name ? `@${company.bot_name}` : "Not Connected"}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 mb-1 flex items-center gap-1"><ShieldCheck className="w-4 h-4"/> Token</p>
                      <p className="font-mono text-xs text-zinc-300 truncate" title={company.telegram_token}>
                        {company.telegram_token ? `${company.telegram_token.substring(0, 10)}...` : "N/A"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-zinc-400 pt-2">
                     <p>Owner: <span className="text-white font-medium">{company.ownerData?.email || company.owner_id}</span></p>
                  </div>
                </div>

                {/* Middle: Plan Status */}
                <div className="lg:w-72 bg-zinc-950 p-5 rounded-2xl border border-zinc-800/50 flex flex-col justify-center text-sm">
                  <div className="flex items-center justify-between mb-4">
                     <span className="text-zinc-400 flex items-center gap-1"><CreditCard className="w-4 h-4"/> Current Plan</span>
                     <span className="uppercase font-black text-xs px-2 py-1 bg-white text-black rounded-md">{company.plan_id}</span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                     <span className="text-zinc-400 flex items-center gap-1"><Clock className="w-4 h-4"/> Trial</span>
                     <span className={`font-bold ${isTrialActive ? 'text-emerald-400' : 'text-red-400'}`}>
                       {company.trial_ends_at ? format(new Date(company.trial_ends_at), "MMM d, yyyy") : "N/A"}
                     </span>
                  </div>

                   <div className="flex gap-2">
                      <select 
                        value={company.plan_id}
                        onChange={(e) => handleUpdatePlan(company.id, e.target.value)}
                        disabled={updating === company.id}
                        className="flex-1 bg-zinc-900 border border-zinc-800 text-white rounded-lg px-2 py-1.5 outline-none text-xs"
                      >
                        <option value="starter">Starter</option>
                        <option value="growth">Growth</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                      
                      <button 
                        onClick={() => handleUpdatePlan(company.id, company.plan_id, 14)}
                        disabled={updating === company.id}
                        title="+14 Days Trial"
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                      >
                        +14d
                      </button>
                   </div>
                </div>

                {/* Right: Actions */}
                <div className="lg:w-48 flex flex-col justify-center gap-3">
                  <button 
                    onClick={() => handleImpersonate(company.owner_id, company.id)}
                    disabled={impersonating === company.id}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {impersonating === company.id ? "Connecting..." : (
                      <>
                        <LogIn className="w-5 h-5" />
                        Impersonate
                      </>
                    )}
                  </button>
                </div>

              </div>
            );
          })}

          {companies.length === 0 && (
            <div className="text-center text-zinc-500 py-12">No companies found in database.</div>
          )}
        </div>
      </div>
    </div>
  );
}
