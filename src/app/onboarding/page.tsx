"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  Users, 
  MessageCircle, 
  ArrowRight, 
  CheckCircle2, 
  Plus,
  QrCode
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState("");
  const [employees, setEmployees] = useState([{ name: "", phone: "" }]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchCompany = async () => {
      const { data: company } = await supabase.from("companies").select("*").single();
      if (company) {
        setCompanyName(company.name);
        setStep(company.onboarding_step || 1);
      }
    };
    fetchCompany();
  }, []);

  const nextStep = async () => {
    if (step === 3) {
      await supabase.from("companies").update({ onboarding_step: 4 }).match({ name: companyName });
      router.push("/overview");
      return;
    }
    const newStep = step + 1;
    setStep(newStep);
    await supabase.from("companies").update({ onboarding_step: newStep }).match({ name: companyName });
  };

  const addEmployeeRow = () => setEmployees([...employees, { name: "", phone: "" }]);

  const saveEmployees = async () => {
    setLoading(true);
    const { data: company } = await supabase.from("companies").select("id").single();
    if (company) {
      const validEmployees = employees.filter(e => e.name && e.phone).map(e => ({
        ...e,
        company_id: company.id,
        phone: e.phone.replace("+", "")
      }));
      if (validEmployees.length > 0) {
        await supabase.from("employees").insert(validEmployees);
      }
    }
    setLoading(false);
    nextStep();
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6">
      {/* Progress Bar */}
      <div className="w-full max-w-lg mb-12">
        <div className="flex justify-between mb-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300",
                step >= s ? "bg-indigo-600 text-white scale-110 shadow-[0_0_20px_rgba(79,70,229,0.4)]" : "bg-zinc-800 text-zinc-500"
              )}>
                {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
              </div>
              <span className={cn("text-[10px] font-bold uppercase tracking-widest", step >= s ? "text-indigo-400" : "text-zinc-600")}>
                {s === 1 ? "Company" : s === 2 ? "Team" : "Connect"}
              </span>
            </div>
          ))}
        </div>
        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 transition-all duration-500" 
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
        </div>
      </div>

      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 mb-8">
              <Building2 className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black mb-2">Let's name your workspace</h1>
            <p className="text-zinc-500 mb-8">We pre-filled this based on your name, but you can change it.</p>
            
            <input 
              type="text" 
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl p-4 text-xl font-bold outline-none focus:border-indigo-500 transition-all mb-8"
              placeholder="e.g. Acme Corp"
            />
            
            <button 
              onClick={nextStep}
              className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all"
            >
              التالي
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-8">
              <Users className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black mb-2">Add your team</h1>
            <p className="text-zinc-500 mb-8">Add the employees you want to track attendance for.</p>
            
            <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {employees.map((emp, i) => (
                <div key={i} className="flex gap-3">
                  <input 
                    placeholder="Name" 
                    className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-xl p-3 outline-none focus:border-indigo-500"
                    value={emp.name}
                    onChange={(e) => {
                      const newEmp = [...employees];
                      newEmp[i].name = e.target.value;
                      setEmployees(newEmp);
                    }}
                  />
                  <input 
                    placeholder="Phone" 
                    className="flex-[1.5] bg-zinc-800/50 border border-zinc-700 rounded-xl p-3 outline-none focus:border-indigo-500"
                    value={emp.phone}
                    onChange={(e) => {
                      const newEmp = [...employees];
                      newEmp[i].phone = e.target.value;
                      setEmployees(newEmp);
                    }}
                  />
                </div>
              ))}
            </div>

            <button 
              onClick={addEmployeeRow}
              className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-500 font-bold hover:border-zinc-600 hover:text-zinc-300 transition-all flex items-center justify-center gap-2 mb-8"
            >
              <Plus className="w-5 h-5" />
              Add more employees
            </button>
            
            <div className="flex gap-4">
              <button 
                onClick={nextStep}
                className="flex-1 bg-zinc-800 text-white font-black py-4 rounded-2xl hover:bg-zinc-700 transition-all"
              >
                Skip for now
              </button>
              <button 
                onClick={saveEmployees}
                disabled={loading}
                className="flex-[2] bg-indigo-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
              >
                {loading ? "Saving..." : "Save and Continue"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-center">
            <div className="w-16 h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-500 mb-8 mx-auto">
              <MessageCircle className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black mb-2">Connect Telegram Bot</h1>
            <p className="text-zinc-500 mb-8">Scane the QR code or click the button below to start tracking.</p>
            
            <div className="bg-white p-6 rounded-3xl inline-block mb-8">
              <QrCode className="w-32 h-32 text-black" />
            </div>

            <a 
              href="https://t.me/your_bot_name" 
              target="_blank"
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all mb-4"
            >
              Open Telegram Bot
              <ExternalLink className="w-5 h-5" />
            </a>

            <button 
              onClick={nextStep}
              className="w-full bg-zinc-800 text-white font-black py-4 rounded-2xl hover:bg-zinc-700 transition-all"
            >
              I've connected my account
            </button>
          </div>
        )}
      </div>
      
      <p className="mt-8 text-zinc-600 font-medium text-sm">
        Quick setup: You're almost there!
      </p>
    </div>
  );
}

function ExternalLink({ className }: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}
