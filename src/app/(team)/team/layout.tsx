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

const teamT = {
  en: {
    home: "Home",
    attendance: "Attendance",
    tasks: "Tasks",
    announcements: "News",
    reports: "Reports",
    signOut: "Sign Out",
  },
  ar: {
    home: "الرئيسية",
    attendance: "الحضور",
    tasks: "المهام",
    announcements: "الإعلانات",
    reports: "التقارير",
    signOut: "خروج",
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

        {/* Desktop: Top header bar */}
        <header className="hidden lg:flex fixed top-0 inset-x-0 h-14 bg-white border-b border-[#f0f0f0] z-40 shadow-sm items-center px-6">
          {/* Logo */}
          <div className={cn("flex items-center gap-2.5 shrink-0", isRTL && "flex-row-reverse")}>
            {logoUrl ? (
              <img src={logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 bg-[#ff5a00] rounded-lg flex items-center justify-center text-white font-black text-xs">
                {companyName.charAt(0)}
              </div>
            )}
            <span className="text-sm font-bold text-[#111]">{companyName}</span>
          </div>

          {/* Nav links — center */}
          <nav className="flex-1 flex items-center justify-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-4 h-14 text-[13px] font-semibold transition-all border-b-2",
                    isActive
                      ? "border-[#ff5a00] text-[#ff5a00]"
                      : "border-transparent text-[#6b7280] hover:text-[#111]"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Employee name + logout — end */}
          <div className={cn("flex items-center gap-3 shrink-0", isRTL && "flex-row-reverse")}>
            <span className="text-xs font-medium text-[#6b7280]">{employee?.name}</span>
            <button
              onClick={handleLogout}
              className="text-[#9ca3af] hover:text-[#b91c1c] transition-colors p-1.5 rounded-lg hover:bg-[#fef2f2]"
              title={t.signOut}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="lg:pt-14 pb-20 lg:pb-6">
          <div className="max-w-5xl mx-auto px-4 lg:px-8 py-5">{children}</div>
        </main>

        {/* Mobile: Bottom nav */}
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
