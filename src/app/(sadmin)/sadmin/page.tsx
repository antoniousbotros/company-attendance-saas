"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { 
  Building2, TrendingUp, Users, Activity, 
  RefreshCw, DollarSign, ArrowUpRight
} from "lucide-react";

const PLAN_PRICES = {
  starter: 29,
  growth: 99,
  pro: 199,
  enterprise: 499,
};

export default function SadminOverview() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sadmin/data");
      const data = await res.json();
      if (data.ok) {
        setCompanies(data.companies);
      } else {
        console.error("API Error: ", data.error);
      }
    } catch (e: any) {
      console.error("Fetch Error: ", e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
     return <div className="min-h-screen flex items-center justify-center text-zinc-500">Loading Intelligence...</div>;
  }

  // Analytics Computations
  const totalCompanies = companies.length;
  
  const trialingCompanies = companies.filter(
    (c) => new Date(c.trial_ends_at) > new Date()
  ).length;
  
  const mrr = companies.reduce((acc, c) => {
    const price = PLAN_PRICES[c.plan_id as keyof typeof PLAN_PRICES] || 0;
    return acc + price;
  }, 0);

  const activeBots = companies.filter(c => c.telegram_token).length;

  const recentCompanies = [...companies].sort((a, b) => 
     new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 5);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">Overview</h1>
          <p className="text-zinc-400">Your high-level Super Admin intelligence matrix.</p>
        </div>
        <button onClick={loadData} className="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Metrics Grid - Stripe Aesthetic */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-2 text-zinc-400 mb-4">
             <TrendingUp className="w-4 h-4 text-emerald-400" />
             <span className="font-medium text-sm">Estimated MRR</span>
          </div>
          <p className="text-4xl font-black tracking-tight text-white">${mrr.toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-1 text-xs text-zinc-500">
            <span className="text-emerald-400 flex items-center"><ArrowUpRight className="w-3 h-3"/>100%</span> active subs
          </div>
        </div>

        {/* Total Accounts */}
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 relative overflow-hidden group">
           <div className="flex items-center gap-2 text-zinc-400 mb-4">
             <Building2 className="w-4 h-4 text-indigo-400" />
             <span className="font-medium text-sm">Total Accounts</span>
          </div>
          <p className="text-4xl font-black tracking-tight text-white">{totalCompanies}</p>
          <div className="mt-4 text-xs text-zinc-500">
             Across all billing tiers
          </div>
        </div>

        {/* Trialing */}
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 relative overflow-hidden group">
           <div className="flex items-center gap-2 text-zinc-400 mb-4">
             <Activity className="w-4 h-4 text-amber-400" />
             <span className="font-medium text-sm">Active Trials</span>
          </div>
          <p className="text-4xl font-black tracking-tight text-white">{trialingCompanies}</p>
          <div className="mt-4 text-xs text-zinc-500">
             Companies in 14-day window
          </div>
        </div>

        {/* Active Bots */}
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 relative overflow-hidden group">
           <div className="flex items-center gap-2 text-zinc-400 mb-4">
             <Users className="w-4 h-4 text-sky-400" />
             <span className="font-medium text-sm">Configured Bots</span>
          </div>
          <p className="text-4xl font-black tracking-tight text-white">{activeBots}</p>
          <div className="mt-4 text-xs text-zinc-500">
             Using valid Telegram tokens
          </div>
        </div>
      </div>

      {/* Recent Activity Mini-Table */}
      <div className="mt-8 bg-zinc-900/40 border border-zinc-800/50 rounded-3xl overflow-hidden">
         <div className="px-6 py-5 border-b border-zinc-800/50 flex items-center justify-between">
           <h2 className="text-lg font-bold text-white">Recent Signups</h2>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-zinc-900/80 text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-800/50">
                     <th className="px-6 py-4 font-semibold">Company Name</th>
                     <th className="px-6 py-4 font-semibold">Owner Email</th>
                     <th className="px-6 py-4 font-semibold">Plan</th>
                     <th className="px-6 py-4 font-semibold">Joined At</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-800/30 text-sm">
                 {recentCompanies.length === 0 && (
                   <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No activity found.</td></tr>
                 )}
                 {recentCompanies.map(company => (
                   <tr key={company.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                         <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center font-bold text-indigo-400 text-xs">
                           {company.name.charAt(0).toUpperCase()}
                         </div>
                         {company.name}
                      </td>
                      <td className="px-6 py-4 text-zinc-400 font-mono text-xs">{company.ownerData?.email || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md tracking-wide ${
                          company.plan_id === 'enterprise' ? 'bg-indigo-500/20 text-indigo-400' :
                          company.plan_id === 'pro' ? 'bg-white/10 text-white' :
                          'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {company.plan_id}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-500">
                        {company.created_at ? format(new Date(company.created_at), "MMM d, yyyy") : 'Unknown'}
                      </td>
                   </tr>
                 ))}
               </tbody>
            </table>
         </div>
      </div>

    </div>
  );
}
