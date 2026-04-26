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
  ChevronLeft,
  ChevronRight,
  Calculator,
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
      <div className="min-h-screen bg-[#f5f5f5] text-[#111] flex font-sans">
        
        {/* 🏢 Desktop Sidebar */}
        <aside
          dir={isRTL ? "rtl" : "ltr"}
          className={cn(
            "hidden lg:flex flex-col w-[240px] bg-[#f5f5f5] border-r border-[#eeeeee] fixed inset-y-0 z-50",
            isRTL ? "right-0 border-r-0 border-l border-[#eeeeee]" : "left-0"
          )}>
           <div className="p-8">
              <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                 <div className="w-10 h-10 bg-[#ff5a00] rounded-md flex items-center justify-center text-white font-black text-sm">
                    {companyName.charAt(0)}
                 </div>
                 <div className={cn("flex flex-col", isRTL && "items-end")}>
                    <span className="text-[14px] font-black tracking-tight">{companyName}</span>
                    <span className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-widest">Portal</span>
                 </div>
              </div>
           </div>

           <nav className="flex-1 px-4 space-y-1">
              {navItems.map((item) => {
                 const isActive = pathname === item.href;
                  return (
                     <Link
                       key={item.href}
                       href={item.href}
                       className={cn(
                         "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold transition-all",
                         isRTL ? "flex-row-reverse" : "",
                         isActive 
                           ? isRTL
                             ? "bg-white text-[#ff5a00] border-r-4 border-[#ff5a00] shadow-sm"
                             : "bg-white text-[#111] border-l-4 border-[#ff5a00] shadow-sm"
                           : "text-[#6b7280] hover:bg-white/50 hover:text-[#111]",
                       )}
                     >
                        <item.icon className={cn("w-4 h-4 shrink-0", isActive && "text-[#ff5a00]")} />
                        {item.name}
                     </Link>
                  );
              })}
           </nav>

           <div className="p-4 border-t border-[#eeeeee] space-y-2">
              <Link href="/team/profile" className={cn("flex items-center gap-3 p-3 rounded-md hover:bg-white/50 transition-colors", isRTL && "flex-row-reverse")}>
                 <div className="w-8 h-8 rounded-md bg-[#eeeeee] flex items-center justify-center text-[#6b7280] overflow-hidden border border-[#eeeeee]">
                    {employee?.avatar_url ? (
                      <img src={employee.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                 </div>
                 <div className={cn("flex flex-col", isRTL && "items-end")}>
                    <span className="text-xs font-bold text-[#111]">{employee?.name?.split(" ")[0]}</span>
                    <span className="text-[10px] text-[#9ca3af]">{t.profile}</span>
                 </div>
              </Link>
              <button 
                onClick={handleLogout}
                className={cn("w-full flex items-center gap-3 p-3 rounded-md text-[#dc2626] hover:bg-red-50 transition-colors text-sm font-bold", isRTL && "flex-row-reverse")}
              >
                 <LogOut className="w-4 h-4" />
                 {t.signOut}
              </button>
           </div>
        </aside>

        <div className={cn(
          "flex-1 flex flex-col min-h-screen min-w-0 bg-white",
          isRTL ? "lg:mr-[240px]" : "lg:ml-[240px]"
        )}>
          {/* 📱 Mobile Top Header */}
          <header className="lg:hidden h-16 bg-white border-b border-[#eeeeee] px-6 flex items-center justify-between z-40">
             <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                <div className="w-8 h-8 bg-[#ff5a00] rounded-md flex items-center justify-center text-white font-black text-xs">
                   {companyName.charAt(0)}
                </div>
                <span className="text-sm font-black">{companyName}</span>
             </div>
             <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-[#f5f5f5] rounded-md transition-colors">
                <Menu className="w-5 h-5" />
             </button>
          </header>

          {/* 📱 Mobile Sidebar Overlay */}
          {sidebarOpen && (
             <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setSidebarOpen(false)} />
          )}

          {/* 📱 Mobile Sidebar Drawer */}
          <aside className={cn(
            "fixed inset-y-0 z-[110] w-[280px] bg-white shadow-2xl transition-transform duration-300 lg:hidden",
            isRTL ? (sidebarOpen ? "translate-x-0" : "translate-x-full") : (sidebarOpen ? "translate-x-0" : "-translate-x-full"),
            isRTL ? "right-0" : "left-0"
          )}>
             <div className="flex flex-col h-full">
                <div className="p-6 border-b border-[#eeeeee] flex items-center justify-between">
                   <span className="font-black text-lg">{t.home}</span>
                   <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-[#f5f5f5] rounded-md">
                      <X className="w-5 h-5" />
                   </button>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                   {navItems.map((item) => (
                      <Link 
                        key={item.href} 
                        href={item.href} 
                        className={cn("flex items-center gap-3 p-4 rounded-md font-bold text-sm", pathname === item.href ? "bg-[#fff1e8] text-[#ff5a00]" : "text-[#6b7280]", isRTL && "flex-row-reverse text-right")}
                      >
                         <item.icon className="w-5 h-5" />
                         {item.name}
                      </Link>
                   ))}
                   <div className="pt-4 mt-4 border-t border-[#eeeeee]">
                      <Link 
                        href="/team/profile" 
                        className={cn("flex items-center gap-3 p-4 rounded-md font-bold text-sm", pathname === "/team/profile" ? "bg-[#fff1e8] text-[#ff5a00]" : "text-[#6b7280]", isRTL && "flex-row-reverse text-right")}
                      >
                         <div className="w-6 h-6 rounded-md bg-[#eeeeee] flex items-center justify-center overflow-hidden border border-[#eeeeee]">
                            {employee?.avatar_url ? (
                              <img src={employee.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-3 h-3" />
                            )}
                         </div>
                         {t.profile}
                      </Link>
                   </div>
                </nav>
                <div className="p-4 border-t border-[#eeeeee]">
                   <button onClick={handleLogout} className={cn("w-full flex items-center gap-3 p-4 rounded-md text-[#dc2626] font-bold", isRTL && "flex-row-reverse text-right")}>
                      <LogOut className="w-5 h-5" />
                      {t.signOut}
                   </button>
                </div>
             </div>
          </aside>

          {/* 🖼️ Page Banner */}
          <div className="page-banner" dir={isRTL ? "rtl" : "ltr"}>
             <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">
                   <Link href="/team" className="hover:text-[#ff5a00] transition-colors">{t.home}</Link>
                   {pathname !== "/team" && (
                     <>
                       {isRTL ? <ChevronRight className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                       <span className="text-[#6b7280]">{navItems.find(i => i.href === pathname)?.name || t.profile}</span>
                     </>
                   )}
                </div>
                <h1 className="text-2xl font-black text-[#111] tracking-tight">
                   {navItems.find(i => i.href === pathname)?.name || t.profile}
                </h1>
             </div>
          </div>

          {/* 🚀 Main Content */}
          <main className="flex-1 px-4 md:px-8 py-6 md:py-10 max-w-[1200px] w-full mx-auto bg-white min-h-[calc(100vh-64px-116px)] pb-24 lg:pb-10">
            {children}
          </main>

          {/* 📱 Mobile Bottom Tab Bar */}
          <nav className={cn(
            "lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#eeeeee] flex items-stretch",
            "safe-area-inset-bottom"
          )}>
            {[...navItems, { name: t.profile, icon: User, href: "/team/profile" }].map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-bold transition-all",
                    isActive ? "text-[#ff5a00]" : "text-[#9ca3af]"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 transition-all", isActive && "scale-110")} />
                  <span className="truncate max-w-[50px] text-center">{item.name}</span>
                  {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#ff5a00]" />}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </TeamContext.Provider>
  );
}
