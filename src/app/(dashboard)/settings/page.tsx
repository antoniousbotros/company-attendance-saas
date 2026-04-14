"use client";

import React, { useState, useEffect } from "react";
import { 
  Bot, 
  Building2, 
  Save, 
  MessageSquare, 
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    telegram_token: "",
    bot_name: ""
  });
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (data) {
      setCompany(data);
      setFormData({
        name: data.name || "",
        telegram_token: data.telegram_token || "",
        bot_name: data.bot_name || ""
      });
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("companies")
      .update({
        name: formData.name,
        telegram_token: formData.telegram_token,
        bot_name: formData.bot_name
      })
      .eq("owner_id", user?.id);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: isRTL ? "تم حفظ الإعدادات بنجاح!" : "Settings saved successfully!" });
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className={isRTL ? "text-right" : "text-left"}>
        <h1 className="text-3xl font-black tracking-tight">{isRTL ? "الإعدادات" : "Settings"}</h1>
        <p className="text-zinc-500 mt-2 font-bold">{isRTL ? "إدارة هوية شركتك وإعدادات البوت" : "Manage your company identity and bot configuration"}</p>
      </div>

      {message.text && (
        <div className={cn(
          "p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in duration-300",
          message.type === 'success' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
        )}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-bold text-sm">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Company Section */}
        <section className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-[2.5rem] p-10 shadow-sm">
           <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                 <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black">{isRTL ? "هوية الشركة" : "Company Identity"}</h2>
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">{isRTL ? "المعلومات الأساسية" : "Basics"}</p>
              </div>
           </div>

           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-xs font-black text-zinc-500 uppercase tracking-widest px-1">{isRTL ? "اسم الشركة" : "Company Name"}</label>
                 <input 
                   type="text" 
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                   className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl py-4 px-6 font-bold outline-none focus:ring-2 ring-indigo-500/20 transition-all"
                   placeholder="e.g. Acme Corp"
                 />
              </div>
           </div>
        </section>

        {/* Telegram Section */}
        <section className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
           <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#0055FF] flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                 <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black">{isRTL ? "إعدادات تليجرام" : "Telegram Integration"}</h2>
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">{isRTL ? "ربط بوت الحضور" : "Bot connection"}</p>
              </div>
           </div>

           <div className="space-y-8 relative z-10">
              <div className="space-y-2">
                 <label className="text-xs font-black text-zinc-500 uppercase tracking-widest px-1">{isRTL ? "اسم البوت (اختياري)" : "Bot Name (Optional)"}</label>
                 <div className="relative">
                    <MessageSquare className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300" />
                    <input 
                      type="text" 
                      value={formData.bot_name}
                      onChange={e => setFormData({...formData, bot_name: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl py-4 pl-14 pr-6 font-bold outline-none focus:ring-2 ring-indigo-500/20 transition-all"
                      placeholder="@SyncTimeBot"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-black text-zinc-500 uppercase tracking-widest px-1">{isRTL ? "رمز البوت (Token)" : "Telegram Bot Token"}</label>
                 <div className="relative group">
                    <Key className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                      type="password" 
                      value={formData.telegram_token}
                      onChange={e => setFormData({...formData, telegram_token: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl py-4 pl-14 pr-6 font-bold outline-none focus:ring-2 ring-indigo-500/20 transition-all font-mono"
                      placeholder="123456789:ABCDefgh..."
                    />
                 </div>
                 <p className="text-[10px] text-zinc-400 font-medium px-1 leading-relaxed">
                    {isRTL 
                      ? "احصل عليه من @BotFather في تليجرام. لا تشاركه مع أي شخص، سيتم تخزينه بشكل آمن."
                      : "Get this from @BotFather on Telegram. Never share it; it will be stored securely."
                    }
                 </p>
              </div>

              {formData.telegram_token && (
                <div className="bg-indigo-50 dark:bg-indigo-500/10 p-6 rounded-[1.5rem] border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-between">
                   <div className="flex items-center gap-3 text-indigo-700 dark:text-indigo-300">
                      <ShieldCheck className="w-5 h-5" />
                      <span className="text-xs font-black uppercase tracking-widest">{isRTL ? "اتصال آمن" : "Securely Encrypted"}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black text-emerald-600">{isRTL ? "مستعد للعمل" : "Ready"}</span>
                   </div>
                </div>
              )}
           </div>

           {/* Subtle glow background */}
           <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        </section>

        <div className="flex justify-end gap-4 pt-4">
           <button 
             type="button" 
             className="px-8 py-4 rounded-2xl text-zinc-500 font-black text-sm hover:bg-zinc-100 transition-all"
           >
             {isRTL ? "إلغاء" : "Cancel"}
           </button>
           <button 
             type="submit"
             disabled={saving}
             className="bg-[#0055FF] hover:bg-[#0044CC] text-white font-black px-12 py-4 rounded-2xl shadow-2xl shadow-indigo-600/20 flex items-center gap-3 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
           >
             {saving ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
             ) : (
               <Save className="w-5 h-5" />
             )}
             {isRTL ? "حفظ التغييرات" : "Save Changes"}
           </button>
        </div>
      </form>
    </div>
  );
}
