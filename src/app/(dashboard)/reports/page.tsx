"use client";

import React from "react";
import { 
  FileSpreadsheet, 
  Download, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  Calendar
} from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Insights</h1>
        <p className="text-zinc-400 mt-2">Generate detailed summaries for payroll and performance audits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Monthly Summary Report Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-32 h-32 text-indigo-500" />
          </div>
          
          <div className="relative z-10">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 mb-6">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Monthly Summary</h2>
            <p className="text-zinc-500 mb-8 max-w-sm">
              Comprehensive report of all employees for the current month. Includes total hours, late counts, and absences.
            </p>
            <div className="flex gap-4">
              <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
                <Calendar className="w-5 h-5" />
                Select Month
              </button>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 rounded-xl transition-all flex items-center justify-center gap-2">
                <Download className="w-5 h-5" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Audit Report Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Clock className="w-32 h-32 text-rose-500" />
          </div>

          <div className="relative z-10">
            <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Anomaly Detection</h2>
            <p className="text-zinc-500 mb-8 max-w-sm">
              Identifies employees with frequent late arrivals or missing check-out logs to help maintain discipline.
            </p>
            <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Analyze Data
            </button>
          </div>
        </div>
      </div>

      {/* Quick Visual Stats */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-8 mt-12">
        <h3 className="text-lg font-bold mb-6 text-zinc-400">Team Performance vs Last Month</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          <div>
            <p className="text-sm text-zinc-600 uppercase font-bold tracking-widest mb-2">Avg Hours/Day</p>
            <p className="text-4xl font-extrabold text-white">7.8h <span className="text-xs text-emerald-500 font-normal">+4%</span></p>
          </div>
          <div>
            <p className="text-sm text-zinc-600 uppercase font-bold tracking-widest mb-2">On-Time Rate</p>
            <p className="text-4xl font-extrabold text-white">92% <span className="text-xs text-rose-500 font-normal">-2%</span></p>
          </div>
          <div>
            <p className="text-sm text-zinc-600 uppercase font-bold tracking-widest mb-2">Total Working Days</p>
            <p className="text-4xl font-extrabold text-white">22d</p>
          </div>
          <div>
            <p className="text-sm text-zinc-600 uppercase font-bold tracking-widest mb-2">Active Employees</p>
            <p className="text-4xl font-extrabold text-white">24</p>
          </div>
        </div>
      </div>
    </div>
  );
}
