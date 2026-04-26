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
      
      {/* ── Header ── */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-foreground tracking-tight">
          {t.profile}
        </h1>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {lang === "ar" ? "إدارة معلوماتك الشخصية" : "Manage your personal information"}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* ── Left: Profile Image Upload ── */}
        <div className="lg:col-span-1 space-y-6">
          <div className="premium-card p-8 flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-3xl overflow-hidden bg-muted border-4 border-white shadow-xl">
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
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-xl shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
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
            
            {/* Status Messages */}
            {result && (
              <div className={cn(
                "p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in-95 duration-300",
                result.ok ? "bg-success-soft text-success border border-success/20" : "bg-danger-soft text-danger border border-danger/20"
              )}>
                {result.ok ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span className="text-xs font-bold">{result.message}</span>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
              
              {/* Static: Phone */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t.phone}</span>
                </div>
                <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 text-sm font-bold text-muted-foreground flex items-center justify-between">
                  {employee?.phone}
                  <div className="px-2 py-0.5 bg-muted rounded-md text-[9px] uppercase tracking-tighter">Read Only</div>
                </div>
              </div>

              {/* Static: Department */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t.department}</span>
                </div>
                <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 text-sm font-bold text-muted-foreground flex items-center justify-between">
                  {employee?.department}
                  <div className="px-2 py-0.5 bg-muted rounded-md text-[9px] uppercase tracking-tighter">Read Only</div>
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
                  className="w-full p-4 bg-white rounded-2xl border border-border focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm font-bold"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-primary text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 disabled:opacity-50"
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
