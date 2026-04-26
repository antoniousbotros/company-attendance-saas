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
  enable_wfh?: boolean;
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
      <div className="min-h-screen bg-background font-sans selection:bg-primary/10 selection:text-primary">

        {/* Desktop: Glassmorphic Top Header */}
        <header className="hidden lg:flex fixed top-4 inset-x-6 h-16 glass-morphism z-50 rounded-2xl items-center px-6 shadow-sm">
          {/* Logo & Company Info */}
          <div className={cn("flex items-center gap-3 shrink-0", isRTL && "flex-row-reverse")}>
            {logoUrl ? (
              <img src={logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
            ) : (
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm shadow-primary/20">
                {companyName.charAt(0)}
              </div>
            )}
            <div className={cn("flex flex-col", isRTL && "items-end")}>
              <span className="text-[13px] font-black text-foreground tracking-tight leading-none mb-0.5">{companyName}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Team Portal</span>
            </div>
          </div>

          {/* Navigation — Centered Pills */}
          <nav className="flex-1 flex items-center justify-center gap-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-300",
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive ? "stroke-[2.5]" : "stroke-[2]")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className={cn("flex items-center gap-4 shrink-0", isRTL && "flex-row-reverse")}>
            <div className={cn("flex flex-col text-right", isRTL && "text-left")}>
              <span className="text-[12px] font-bold text-foreground leading-none mb-1">{employee?.name}</span>
              <span className="text-[10px] font-medium text-muted-foreground leading-none">{employee?.department}</span>
            </div>
            <div className="w-px h-6 bg-border mx-1" />
            <button
              onClick={handleLogout}
              className="group relative flex items-center justify-center w-9 h-9 rounded-xl bg-danger-soft text-danger hover:bg-danger hover:text-white transition-all duration-300"
              title={t.signOut}
            >
              <LogOut className="w-4 h-4 transition-transform group-hover:scale-110" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="lg:pt-24 pb-32 lg:pb-12">
          <div className="max-w-5xl mx-auto px-4 lg:px-10">
            {children}
          </div>
        </main>

        {/* Mobile: Floating Dock Navigation */}
        <div className="lg:hidden fixed bottom-6 inset-x-6 z-50">
          <nav className="floating-dock mx-auto max-w-sm px-2 py-2 flex items-center justify-between">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-300 min-w-[64px]",
                    isActive ? "bg-white/10 text-primary" : "text-white/40 hover:text-white/70"
                  )}
                >
                  <item.icon className={cn("w-6 h-6 mb-1", isActive ? "stroke-[2.5]" : "stroke-[2]")} />
                  <span className="text-[9px] font-black uppercase tracking-tighter">{item.name}</span>
                  {isActive && (
                    <span className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_#ff5a00]" />
                  )}
                </Link>
              );
            })}
            
            {/* Mobile Logout Button integrated into dock if needed, or keeping it clean */}
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl text-white/40 hover:text-danger min-w-[64px]"
            >
              <LogOut className="w-6 h-6 mb-1 stroke-[2]" />
              <span className="text-[9px] font-black uppercase tracking-tighter">{t.signOut}</span>
            </button>
          </nav>
        </div>
      </div>
    </TeamContext.Provider>
  );
}
