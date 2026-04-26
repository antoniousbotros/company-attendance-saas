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
  Menu,
  X,
  User,
  Cake,
  Phone,
  Briefcase
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
    profile: "My Profile",
    department: "Department",
    birthday: "Birthday",
    phone: "Phone",
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
  },
  ar: {
    home: "الرئيسية",
    attendance: "الحضور",
    tasks: "المهام",
    announcements: "الإعلانات",
    reports: "التقارير",
    signOut: "خروج",
    profile: "الملف الشخصي",
    department: "القسم",
    birthday: "تاريخ الميلاد",
    phone: "رقم الهاتف",
    edit: "تعديل",
    save: "حفظ",
    cancel: "إلغاء",
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
  birth_date?: string;
  avatar_url?: string;
  company_id: string;
  companies: CompanyData;
}

interface TeamContextType {
  employee: EmployeeData | null;
  loading: boolean;
  isRTL: boolean;
  lang: "en" | "ar";
  t: typeof teamT.en;
  refreshEmployee: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType>({
  employee: null,
  loading: true,
  isRTL: false,
  lang: "en",
  t: teamT.en,
  refreshEmployee: async () => {},
});
export const useTeam = () => useContext(TeamContext);

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isLoginPage = pathname === "/team/login";

  const refreshEmployee = async () => {
    try {
      const res = await fetch("/api/team/auth/me");
      const data = await res.json();
      if (data.ok) {
        setEmployee(data.employee);
        const lang = data.employee?.companies?.bot_language || "en";
        document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
      } else if (!isLoginPage) {
        router.push("/team/login");
      }
    } catch {
      if (!isLoginPage) router.push("/team/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoginPage) { setLoading(false); return; }
    refreshEmployee();
  }, [router, isLoginPage]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

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
    <TeamContext.Provider value={{ employee, loading, isRTL, lang, t, refreshEmployee }}>
      <div className="min-h-screen bg-background font-sans selection:bg-primary/10 selection:text-primary overflow-x-hidden">

        {/* 📱 Mobile Top Header (Fixed) */}
        <header className="lg:hidden fixed top-0 inset-x-0 h-20 bg-white/80 backdrop-blur-md border-b border-border/50 z-[60] px-6 flex items-center justify-between">
           <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black text-sm">
                 {companyName.charAt(0)}
              </div>
              <div className={cn("flex flex-col", isRTL && "items-end")}>
                 <span className="text-[14px] font-black tracking-tight">{companyName}</span>
                 <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Portal</span>
              </div>
           </div>
           <button 
             onClick={() => setSidebarOpen(true)}
             className="w-10 h-10 flex items-center justify-center bg-muted rounded-xl text-foreground active:scale-90 transition-transform"
           >
              <Menu className="w-5 h-5" />
           </button>
        </header>

        {/* 📱 Mobile Sidebar Overlay */}
        <div className={cn(
          "fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm transition-opacity duration-500 lg:hidden",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )} onClick={() => setSidebarOpen(false)} />

        {/* 📱 Mobile Sidebar Drawer */}
        <aside className={cn(
          "fixed inset-y-0 z-[80] w-[80%] max-w-[300px] bg-white shadow-2xl transition-transform duration-500 lg:hidden",
          isRTL ? (sidebarOpen ? "translate-x-0" : "translate-x-full") : (sidebarOpen ? "translate-x-0" : "-translate-x-full"),
          isRTL ? "right-0" : "left-0"
        )}>
           <div className="h-full flex flex-col">
              <div className="p-8 border-b border-border/50 flex items-center justify-between">
                 <div className="flex flex-col">
                    <span className="text-sm font-black tracking-tight">{employee?.name}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{employee?.department}</span>
                 </div>
                 <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center bg-muted rounded-lg">
                    <X className="w-4 h-4" />
                 </button>
              </div>

              <nav className="flex-1 p-6 space-y-2">
                 <Link href="/team/profile" className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 text-primary font-black text-sm">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                       <User className="w-5 h-5" />
                    </div>
                    {t.profile}
                 </Link>
                 <Link href="/team/announcements" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted text-muted-foreground hover:text-foreground font-black text-sm transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                       <Megaphone className="w-5 h-5" />
                    </div>
                    {t.announcements}
                 </Link>
              </nav>

              <div className="p-8 border-t border-border/50">
                 <button 
                   onClick={handleLogout}
                   className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-danger-soft text-danger font-black text-sm active:scale-95 transition-all"
                 >
                    <LogOut className="w-5 h-5" />
                    {t.signOut}
                 </button>
              </div>
           </div>
        </aside>

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
             <Link href="/team/profile" className={cn("flex items-center gap-3 p-1.5 hover:bg-muted rounded-xl transition-colors", isRTL && "flex-row-reverse")}>
                <div className={cn("flex flex-col text-right", isRTL && "text-left")}>
                <span className="text-[12px] font-bold text-foreground leading-none mb-1">{employee?.name}</span>
                <span className="text-[10px] font-medium text-muted-foreground leading-none">{employee?.department}</span>
                </div>
                {employee?.avatar_url ? (
                    <img src={employee.avatar_url} alt="" className="w-9 h-9 rounded-xl object-cover border border-border" />
                ) : (
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                        <User className="w-5 h-5" />
                    </div>
                )}
             </Link>
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
        <main className="pt-24 lg:pt-28 pb-32 lg:pb-12">
          <div className="max-w-5xl mx-auto px-4 lg:px-10">
            {children}
          </div>
        </main>

        {/* Mobile: Floating Dock Navigation */}
        <div className="lg:hidden fixed bottom-6 inset-x-6 z-50">
          <nav className="floating-dock mx-auto max-w-sm px-2 py-2 flex items-center justify-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-300 flex-1",
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
          </nav>
        </div>
      </div>
    </TeamContext.Provider>
  );
}
