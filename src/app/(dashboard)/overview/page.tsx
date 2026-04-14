"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Clock,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";
import {
  PageHeader,
  SectionCard,
  StatusPill,
  HelpCard,
} from "@/app/components/talabat-ui";

type AttendanceRow = {
  id: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  working_hours: number | null;
  employees?: { name: string } | null;
};

function StatCard({
  label,
  value,
  trend,
  isUp,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  trend?: string;
  isUp?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <SectionCard className="hover:border-[#e5e5e5] transition-colors">
      <div className="flex items-start justify-between mb-4">
        <span className="text-[12px] font-semibold text-[#6b7280] uppercase tracking-wider">
          {label}
        </span>
        <div className="w-8 h-8 rounded-full bg-[#fff1e8] text-[#ff5a00] flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[28px] font-bold text-[#111] tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "text-xs font-semibold",
              isUp ? "text-[#1e8e3e]" : "text-[#b45309]"
            )}
          >
            {trend}
          </span>
        )}
      </div>
    </SectionCard>
  );
}

export default function OverviewPage() {
  const { t, isRTL } = useLanguage();
  const [data, setData] = useState({
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
    recent: [] as AttendanceRow[],
  });

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data: employees } = await supabase.from("employees").select("id");
      const { data: attendance } = await supabase
        .from("attendance")
        .select("*, employees(name)")
        .eq("date", today);

      const present = attendance?.length || 0;
      setData({
        total: employees?.length || 0,
        present,
        late: attendance?.filter((a) => a.status === "late").length || 0,
        absent: Math.max(0, (employees?.length || 0) - present),
        recent: (attendance as AttendanceRow[] | null)?.slice(0, 6) || [],
      });
    };
    fetchData();
  }, []);

  const attendanceRate =
    data.total > 0 ? Math.round((data.present / data.total) * 100) : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title={t.overviewTitle}
        subtitle={t.overviewSubtitle}
        isRTL={isRTL}
      />

      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t.attendanceRate}
          value={`${attendanceRate}%`}
          trend="+2.4%"
          isUp
          icon={TrendingUp}
        />
        <StatCard
          label={t.totalEmployees}
          value={data.total}
          icon={Users}
        />
        <StatCard
          label={t.presentToday}
          value={data.present}
          trend="+8%"
          isUp
          icon={UserCheck}
        />
        <StatCard
          label={t.lateArrivals}
          value={data.late}
          trend="-5%"
          isUp={false}
          icon={Clock}
        />
      </div>

      {/* Recent check-ins table */}
      <div>
        <div
          className={cn(
            "flex items-center justify-between mb-3",
            isRTL && "flex-row-reverse"
          )}
        >
          <h2 className="text-lg font-bold text-[#111]">{t.recentCheckins}</h2>
          <Link
            href="/attendance"
            className="text-sm font-medium text-[#6b7280] hover:text-[#ff5a00] inline-flex items-center gap-1"
          >
            {t.seeAll}
            <ArrowRight className={cn("w-3 h-3", isRTL && "rotate-180")} />
          </Link>
        </div>

        <SectionCard padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[#6b7280] text-xs">
                  <th className="text-left font-medium px-6 py-4">
                    {t.status}
                  </th>
                  <th className="text-left font-medium px-6 py-4">
                    {t.employee}
                  </th>
                  <th className="text-left font-medium px-6 py-4">
                    {t.checkIn}
                  </th>
                  <th className="text-right font-medium px-6 py-4">
                    {t.duration}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.recent.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-16 text-center text-[#9ca3af] text-sm italic"
                    >
                      {t.noRecords}
                    </td>
                  </tr>
                ) : (
                  data.recent.map((log) => {
                    const tone =
                      log.status === "present"
                        ? "success"
                        : log.status === "late"
                        ? "warning"
                        : "neutral";
                    const label =
                      log.status === "late"
                        ? t.statusLate
                        : log.status === "absent"
                        ? t.statusAbsent
                        : t.statusPresent;
                    return (
                      <tr
                        key={log.id}
                        className="border-t border-[#f1f1f1] hover:bg-[#fafafa] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <StatusPill label={label} tone={tone} />
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-[#111]">
                            {log.employees?.name ?? "—"}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#4b5563]">
                          {log.check_in
                            ? new Date(log.check_in).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-[#111]">
                          {log.working_hours ? `${log.working_hours}h` : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {/* Help section */}
      <HelpCard
        title={t.needHelpTitle}
        subtitle={t.needHelpSubtitle}
        moreLabel={t.more}
        isRTL={isRTL}
        articles={[
          { title: t.article1Title, description: t.article1Desc },
          { title: t.article2Title, description: t.article2Desc },
          { title: t.article3Title, description: t.article3Desc },
          { title: t.article4Title, description: t.article4Desc },
        ]}
      />
    </div>
  );
}
