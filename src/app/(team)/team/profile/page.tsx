"use client";

import React, { useState, useRef } from "react";
import { useTeam } from "../layout";
import { User, Phone, Briefcase, Cake, Camera, Save, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TeamProfilePage() {
  const { employee, t, lang, refreshEmployee } = useTeam();
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  
  // Local state for editable fields
  const [birthDate, setBirthDate] = useState(employee?.birth_date || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(employee?.avatar_url || null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setResult(null);
    
    try {
      const formData = new FormData();
      if (birthDate) formData.append("birth_date", birthDate);
      if (selectedFile) formData.append("avatar", selectedFile);
      
      const res = await fetch("/api/team/profile/update", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (data.ok) {
        setResult({ ok: true, message: lang === "ar" ? "تم تحديث الملف الشخصي بنجاح" : "Profile updated successfully" });
        await refreshEmployee();
      } else {
        setResult({ ok: false, message: data.error || (lang === "ar" ? "فشل التحديث" : "Update failed") });
      }
    } catch {
      setResult({ ok: false, message: lang === "ar" ? "خطأ في الاتصال" : "Connection error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* ── Left: Profile Image Upload ── */}
        <div className="lg:col-span-1 space-y-6">
          <div className="premium-card p-8 flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-md overflow-hidden bg-[#f5f5f5] border-2 border-[#eeeeee]">
                {previewUrl ? (
                  <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <User className="w-12 h-12 opacity-20" />
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#ff5a00] text-white rounded-md shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
              >
                <Camera className="w-5 h-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-black text-foreground">{employee?.name}</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                {employee?.department}
              </p>
            </div>
          </div>
        </div>

        {/* ── Right: Personal Details Form ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="premium-card p-6 md:p-8 space-y-8">
            
            {result && (
              <div className={cn(
                "p-4 rounded-md flex items-center gap-3 animate-in zoom-in-95 duration-300",
                result.ok ? "bg-success-soft text-success border border-success/10" : "bg-danger-soft text-danger border border-danger/10"
              )}>
                {result.ok ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span className="text-[11px] font-black uppercase tracking-widest">{result.message}</span>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
              
              {/* Static: Phone */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t.phone}</span>
                </div>
                <div className="p-4 bg-[#fcfcfc] rounded-md border border-[#eeeeee] text-sm font-bold text-[#6b7280] flex items-center justify-between">
                  {employee?.phone}
                  <div className="px-2 py-0.5 bg-[#f5f5f5] rounded-md text-[9px] uppercase tracking-tighter">Read Only</div>
                </div>
              </div>

              {/* Static: Department */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t.department}</span>
                </div>
                <div className="p-4 bg-[#fcfcfc] rounded-md border border-[#eeeeee] text-sm font-bold text-[#6b7280] flex items-center justify-between">
                  {employee?.department}
                  <div className="px-2 py-0.5 bg-[#f5f5f5] rounded-md text-[9px] uppercase tracking-tighter">Read Only</div>
                </div>
              </div>

              {/* Editable: Birthday */}
              <div className="space-y-3 md:col-span-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Cake className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t.birthday}</span>
                </div>
                <input 
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full p-4 bg-[#fcfcfc] rounded-md border border-[#eeeeee] focus:border-[#ff5a00] transition-all outline-none text-sm font-bold"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-[#ff5a00] text-white font-black px-8 py-4 rounded-md shadow-md shadow-[#ff5a00]/10 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5 stroke-[2.5]" />
                    <span>{t.save}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
