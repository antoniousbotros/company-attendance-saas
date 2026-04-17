"use client";

import React, { useEffect, useState } from "react";
import { useTeam } from "../layout";
import { Megaphone, Clock, AlertCircle, Sparkles, Pin, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TeamAnnouncementsPage() {
  const { isRTL, lang } = useTeam();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/team/announcements")
      .then((r) => r.json())
      .then((data) => {
        setAnnouncements(data.announcements || []);
        setBirthdays(data.birthdays || []);
        setLoading(false);
      });
  }, []);

  const isRecent = (dateStr: string) => {
    const diffTime = Math.abs(new Date().getTime() - new Date(dateStr).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* Premium Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#111] to-[#222] rounded-3xl p-6 md:p-8 shadow-xl border border-[#333]">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Megaphone className="w-48 h-48 text-white transform rotate-[-20deg]" />
        </div>
        <div className="relative z-10 flex flex-col items-start gap-4 text-start">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
            <Megaphone className="w-6 h-6 text-[#ff5a00]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {isRTL ? "إعلانات الشركة" : "Company Announcements"}
            </h1>
            <p className="text-sm md:text-base text-[#9ca3af] mt-1.5 font-medium max-w-md">
              {isRTL 
                ? "ابق على اطلاع بآخر أخبار وقرارات الشركة المهمة" 
                : "Stay updated with the latest news, policies, and important updates."}
            </p>
          </div>
        </div>
      </div>

      {/* Announcements Grid / List */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-3xl p-6 h-40 border border-[#f1f1f1]" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-[#f1f1f1] shadow-sm">
          <div className="w-16 h-16 bg-[#fff1e8] rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-[#ff5a00]" />
          </div>
          <h3 className="text-lg font-black text-[#111] mb-2">{isRTL ? "لا توجد إعلانات حالياً" : "All caught up!"}</h3>
          <p className="text-sm text-[#6b7280] max-w-xs leading-relaxed">
            {isRTL ? "ستظهر إعلانات وقرارات الشركة الجديدة هنا بمجرد نشرها." : "New firm announcements and directives will appear here when published."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {announcements.map((a) => {
            const recent = isRecent(a.created_at || a.expire_at); // fallback logic
            return (
              <div 
                key={a.id} 
                className="group relative bg-white rounded-3xl p-6 md:p-7 shadow-sm border border-[#f1f1f1] hover:border-[#ff5a00]/30 hover:shadow-lg transition-all duration-300 flex flex-col text-start"
              >
                {/* Decorative Accent Bar */}
                <div className="absolute top-0 left-6 right-6 h-1 bg-gradient-to-r from-[#ff5a00] to-[#ff8c42] rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="flex items-start justify-between mb-4">
                  <div className={cn(
                    "p-2.5 rounded-xl border flex-shrink-0",
                    recent ? "bg-[#fff1e8] border-[#ffe4d1] text-[#ff5a00]" : "bg-[#f9fafb] border-[#e5e7eb] text-[#6b7280]"
                  )}>
                    <Pin className="w-5 h-5" />
                  </div>
                  {recent && (
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold text-[#ff5a00] bg-[#fff1e8] px-2.5 py-1 rounded-full">
                      <AlertCircle className="w-3 h-3" />
                      {isRTL ? "جديد" : "New"}
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#111] mb-2.5 leading-snug group-hover:text-[#ff5a00] transition-colors">
                    {a.title}
                  </h3>
                  <p className="text-sm text-[#4b5563] leading-relaxed whitespace-pre-wrap line-clamp-4">
                    {a.message}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#f1f1f1] flex items-center justify-between text-xs font-semibold text-[#9ca3af]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#d1d5db]" />
                    <span>{isRTL ? "صالحة حتى" : "Valid until"}</span>
                  </div>
                  <span className="text-[#111]">
                    {new Date(a.expire_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Birthday Table Block */}
      {!loading && birthdays.length > 0 && (
        <div className="mt-12 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-[#ff5a00] to-[#ff8c42] rounded-xl flex items-center justify-center shadow-md">
              <PartyPopper className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#111] tracking-tight text-start">
                {isRTL ? "أعياد ميلاد هذا الشهر!" : "This Month's Birthdays!"}
              </h2>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-[#f1f1f1] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start" dir={isRTL ? "rtl" : "ltr"}>
                <thead className="bg-[#f9fafb] border-b border-[#f1f1f1]">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-[#6b7280] uppercase tracking-wider text-start">
                      {isRTL ? "الموظف" : "Employee"}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-[#6b7280] uppercase tracking-wider text-start">
                      {isRTL ? "القسم" : "Department"}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-[#6b7280] uppercase tracking-wider text-start">
                      {isRTL ? "التاريخ" : "Date"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f1f1]">
                  {birthdays.map((b) => (
                    <tr key={b.id} className="hover:bg-[#fff9f5] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#fff1e8] text-[#ff5a00] flex items-center justify-center text-xs font-bold ring-1 ring-[#ffd4b8] group-hover:scale-110 transition-transform">
                            {b.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-[#111]">{b.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex py-1 px-2.5 rounded-lg bg-[#f3f4f6] text-[#4b5563] text-xs font-bold">
                          {b.department || (isRTL ? "غير محدد" : "Unassigned")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#ff5a00]">
                            {new Date(b.birth_date).getDate()}
                          </span>
                          <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">
                            {new Date(b.birth_date).toLocaleString(lang === "ar" ? "ar-EG" : "en-US", { month: "long" })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
