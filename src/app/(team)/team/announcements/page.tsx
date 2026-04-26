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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">

      {/* ── Announcements Feed ── */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse premium-card h-32" />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="premium-card py-20 flex flex-col items-center justify-center text-center gap-6 border-dashed">
            <div className="w-20 h-20 bg-[#fff1e8] rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#ff5a00] opacity-40" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground tracking-tight">{isRTL ? "لا توجد أخبار جديدة" : "CLEAR BULLETIN"}</h3>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
                {isRTL ? "ستظهر الإعلانات الجديدة هنا" : "You're all caught up"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {announcements.map((a) => {
              const recent = isRecent(a.created_at || a.expire_at);
              return (
                <div key={a.id} className="premium-card p-6 group hover:border-primary/20 transition-all">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110",
                        recent ? "bg-[#fff1e8] text-[#ff5a00] border border-[#ff5a00]/10 shadow-sm" : "bg-[#f5f5f5] text-[#6b7280] border border-[#eeeeee]"
                      )}>
                        <Pin className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-lg font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{a.title}</h3>
                           {recent && (
                            <span className="bg-[#ff5a00] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md animate-pulse tracking-widest">
                              {isRTL ? "جديد" : "NEW"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                          <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(a.expire_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric" })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed max-w-2xl">
                    {a.message}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Birthdays Section ── */}
      {!loading && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#ff5a00]/10 rounded-md flex items-center justify-center text-[#ff5a00]">
                <PartyPopper className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-foreground tracking-tight">{isRTL ? "أعياد ميلاد الموظفين" : "Team Birthdays"}</h2>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{isRTL ? "احتفل مع زملائك" : "Celebrate your colleagues"}</p>
              </div>
            </div>

            {/* Month Selector Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 md:pb-0" dir={isRTL ? "rtl" : "ltr"}>
              {Array.from({ length: 12 }).map((_, i) => {
                const monthNum = i + 1;
                const monthName = new Date(2000, i, 1).toLocaleString(lang === "ar" ? "ar-EG" : "en-US", { month: "short" });
                const isActive = activeMonth === monthNum;
                return (
                  <button
                    key={monthNum}
                    onClick={() => setActiveMonth(monthNum)}
                    className={cn(
                      "px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                      isActive 
                        ? "bg-[#111] text-white border-[#111] shadow-md shadow-black/10 scale-105" 
                        : "bg-[#f5f5f5] text-[#6b7280] border-[#eeeeee] hover:bg-[#fff1e8] hover:text-[#ff5a00] hover:border-[#ff5a00]/20"
                    )}
                  >
                    {monthName}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(() => {
              const filteredBirthdays = allBirthdays.filter((b) => new Date(b.birth_date).getMonth() + 1 === activeMonth).sort((a, b) => new Date(a.birth_date).getDate() - new Date(b.birth_date).getDate());
              
              if (filteredBirthdays.length === 0) {
                return (
                  <div className="md:col-span-2 lg:col-span-3 premium-card py-16 flex flex-col items-center justify-center text-center opacity-40 border-dashed">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {isRTL ? "لا توجد أعياد ميلاد هذا الشهر" : "No birthdays this month"}
                    </p>
                  </div>
                );
              }

              return filteredBirthdays.map((b) => (
                <div key={b.id} className="premium-card p-4 group hover:border-primary/20 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#fff1e8] text-[#ff5a00] border border-[#ff5a00]/10 rounded-md flex items-center justify-center text-xs font-black shadow-inner group-hover:scale-110 transition-transform">
                      {b.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[13px] font-black text-foreground">{b.name}</p>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter opacity-60">
                        {b.department || (isRTL ? "غير محدد" : "Team Member")}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center bg-[#fcfcfc] px-3 py-1.5 rounded-md border border-[#eeeeee]">
                    <span className="text-lg font-black text-[#ff5a00] leading-none">{new Date(b.birth_date).getDate()}</span>
                    <span className="text-[8px] font-black text-[#6b7280] uppercase tracking-tighter">{new Date(b.birth_date).toLocaleString(lang === "ar" ? "ar-EG" : "en-US", { month: "short" })}</span>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
