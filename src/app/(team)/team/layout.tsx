"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  CalendarDays,
  CheckSquare,
  Megaphone,
  BarChart3,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Team i18n
const teamT = {
  en: {
    home: "Home",
    attendance: "Attendance",
    tasks: "Tasks",
    announcements: "News",
    reports: "Reports",
    signOut: "Sign Out",
    greeting_morning: "Good morning",
    greeting_afternoon: "Good afternoon",
    greeting_evening: "Good evening",
  },
  ar: {
    home: "الرئيسية",
    attendance: "الحضور",
    tasks: "المهام",
    announcements: "الإعلانات",
    reports: "التقارير",
    signOut: "تسجيل الخروج",
    greeting_morning: "صباح الخير",
    greeting_afternoon: "مساء الخير",
    greeting_evening: "مساء الخير",
  },
};

interface CompanyData {
  name: string;
  logo_url: string | null;
  enable_geofencing: boolean;
  office_lat: number;
  office_lng: number;
  office_radius: number;
  work_start_time: string;
  late_threshold: number;
  sales_tracking_enabled: boolean;
  bot_language: string;
}

interface EmployeeData {
  id: string;
  name: string;
  phone: string;
  department: string;
  company_id: string;
  companies: CompanyData;
}

interface TeamContextType {
  employee: EmployeeData | null;
  loading: boolean;
  isRTL: boolean;
  lang: "en" | "ar";
  t: typeof teamT.en;
}

const TeamContext = createContext<TeamContextType>({
  employee: null,
  loading: true,
  isRTL: false,
  lang: "en",
  t: teamT.en,
});
export const useTeam = () => useContext(TeamContext);

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const isLoginPage = pathname === "/team/login";

  useEffect(() => {
    if (isLoginPage) { setLoading(false); return; }
    fetch("/api/team/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setEmployee(data.employee);
          const lang = data.employee?.companies?.bot_language || "en";
          document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
        } else {
          router.push("/team/login");
        }
      })
      .catch(() => router.push("/team/login"))
      .finally(() => setLoading(false));
  }, [router, isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch("/api/team/auth/logout", { method: "POST" });
    document.documentElement.setAttribute("dir", "ltr");
    router.push("/team/login");
  };

  const lang = (employee?.companies?.bot_language === "ar" ? "ar" : "en") as "en" | "ar";
  const isRTL = lang === "ar";
  const t = teamT[lang];
  const salesEnabled = employee?.companies?.sales_tracking_enabled;
  const logoUrl = employee?.companies?.logo_url;
  const companyName = employee?.companies?.name || "Yawmy";

  const navItems = [
    { name: t.home, icon: Home, href: "/team" },
    { name: t.attendance, icon: CalendarDays, href: "/team/attendance" },
    { name: t.tasks, icon: CheckSquare, href: "/team/tasks" },
    { name: t.announcements, icon: Megaphone, href: "/team/announcements" },
    ...(salesEnabled
      ? [{ name: t.reports, icon: BarChart3, href: "/team/reports" }]
      : []),
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#ff5a00]/20 border-t-[#ff5a00] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <TeamContext.Provider value={{ employee, loading, isRTL, lang, t }}>
      <div className="min-h-screen bg-[#f5f5f5] font-sans">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            "hidden lg:flex fixed inset-y-0 w-56 bg-white flex-col z-40 shadow-sm",
            isRTL ? "right-0 border-l border-[#f0f0f0]" : "left-0 border-r border-[#f0f0f0]"
          )}
        >
          <div className="p-5 border-b border-[#f0f0f0]">
            <div className="flex items-center gap-2.5">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="w-9 h-9 rounded-xl object-cover" />
              ) : (
                <div className="w-9 h-9 bg-[#ff5a00] rounded-xl flex items-center justify-center text-white font-black text-sm">
                  {companyName.charAt(0)}
                </div>
              )}
              <span className="text-base font-bold text-[#111] truncate">{companyName}</span>
            </div>
            {employee && (
              <p className="text-[11px] font-medium text-[#9ca3af] mt-2 truncate">
                {employee.name}
              </p>
            )}
          </div>

          <nav className="flex-1 p-3 space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    isActive
                      ? "bg-[#fff1e8] text-[#ff5a00]"
                      : "text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#111]"
                  )}
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-[#f0f0f0]">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#6b7280] hover:text-[#b91c1c] hover:bg-[#fef2f2] transition-all w-full"
            >
              <LogOut className="w-[18px] h-[18px]" />
              {t.signOut}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className={cn("pb-20 lg:pb-0", isRTL ? "lg:mr-56" : "lg:ml-56")}>
          <div className="max-w-2xl mx-auto px-4 py-5">{children}</div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#f0f0f0] z-40">
          <div className="flex items-center justify-around py-1.5 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition-all min-w-[48px]",
                    isActive ? "text-[#ff5a00]" : "text-[#b0b0b0]"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
                  <span className="text-[9px] font-bold">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </TeamContext.Provider>
  );
}
