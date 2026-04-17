"use client";

import React, { useEffect, useState } from "react";
import { useTeam } from "../layout";
import { Megaphone, Clock, AlertCircle, Sparkles, Pin, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TeamAnnouncementsPage() {
  const { isRTL, lang } = useTeam();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [allBirthdays, setAllBirthdays] = useState<any[]>([]);
  const [activeMonth, setActiveMonth] = useState<number>(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/team/announcements")
      .then((r) => r.json())
      .then((data) => {
        setAnnouncements(data.announcements || []);
        setAllBirthdays(data.birthdays || []);
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
      {/* Minimal Header */}
      <div className="flex flex-col items-start gap-1.5 text-start mb-2">
        <h1 className="text-2xl font-black text-[#111] tracking-tight flex items-center gap-2.5">
          <Megaphone className="w-5 h-5 text-[#ff5a00]" />
          {isRTL ? "إعلانات الشركة" : "Company Announcements"}
        </h1>
        <p className="text-sm font-bold text-[#9ca3af]">
          {isRTL 
            ? "ابق على اطلاع بآخر أخبار وقرارات الشركة المهمة" 
            : "Stay updated with the latest news, policies, and important updates."}
        </p>
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
        <div className="bg-white rounded-3xl shadow-sm border border-[#f1f1f1] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-start" dir={isRTL ? "rtl" : "ltr"}>
              <thead className="bg-[#f9fafb] border-b border-[#f1f1f1]">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-[#6b7280] uppercase tracking-wider text-start">
                    {isRTL ? "العنوان" : "Title"}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-[#6b7280] uppercase tracking-wider text-start w-1/2">
                    {isRTL ? "التفاصيل" : "Message"}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-[#6b7280] uppercase tracking-wider text-start">
                    {isRTL ? "تاريخ الإنتهاء" : "Expires"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f1f1]">
                {announcements.map((a) => {
                  const recent = isRecent(a.created_at || a.expire_at);
                  return (
                    <tr key={a.id} className="hover:bg-[#fff9f5] transition-colors group align-top">
                      <td className="px-6 py-5">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors mt-0.5",
                            recent ? "bg-[#fff1e8] text-[#ff5a00] ring-1 ring-[#ffd4b8]" : "bg-[#f3f4f6] text-[#6b7280]"
                          )}>
                            <Pin className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[#111] group-hover:text-[#ff5a00] transition-colors">{a.title}</span>
                            {recent && (
                              <span className="inline-flex w-fit items-center gap-1 text-[10px] uppercase font-extrabold text-[#ff5a00] mt-1 bg-[#fff1e8] px-2 py-0.5 rounded-lg">
                                <AlertCircle className="w-3 h-3" />
                                {isRTL ? "جديد" : "New"}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm text-[#4b5563] whitespace-pre-line leading-relaxed max-w-xl">
                          {a.message}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-4 h-4 text-[#d1d5db]" />
                          <span className="text-xs font-bold text-[#6b7280]">
                            {new Date(a.expire_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Birthday Table Block */}
      {!loading && (
        <div className="mt-12 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#ff5a00] to-[#ff8c42] rounded-xl flex items-center justify-center shadow-md">
                <PartyPopper className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#111] tracking-tight text-start">
                  {isRTL ? "أعياد ميلاد الموظفين" : "Employee Birthdays"}
                </h2>
              </div>
            </div>

            {/* Scrollable Month Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide md:max-w-md w-full" dir={isRTL ? "rtl" : "ltr"}>
              {Array.from({ length: 12 }).map((_, i) => {
                const monthNum = i + 1;
                const d = new Date(2000, i, 1);
                const monthName = d.toLocaleString(lang === "ar" ? "ar-EG" : "en-US", { month: "short" });
                const isActive = activeMonth === monthNum;
                return (
                  <button
                    key={monthNum}
                    onClick={() => setActiveMonth(monthNum)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                      isActive 
                        ? "bg-[#111] text-white shadow-md border-transparent" 
                        : "bg-[#f9fafb] text-[#6b7280] border border-[#f1f1f1] hover:bg-[#ff5a00]/10 hover:text-[#ff5a00] hover:border-[#ff5a00]/30"
                    )}
                  >
                    {monthName}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-[#f1f1f1] overflow-hidden">
            {(() => {
              const filteredBirthdays = allBirthdays.filter((b) => new Date(b.birth_date).getMonth() + 1 === activeMonth).sort((a, b) => new Date(a.birth_date).getDate() - new Date(b.birth_date).getDate());
              
              if (filteredBirthdays.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <p className="text-sm font-bold text-[#9ca3af]">
                      {isRTL ? "لا توجد أعياد ميلاد مسجلة في هذا الشهر." : "No birthdays recorded for this month."}
                    </p>
                  </div>
                );
              }

              return (
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
                      {filteredBirthdays.map((b) => (
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
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
