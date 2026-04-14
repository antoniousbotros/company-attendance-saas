"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Users, 
  LayoutDashboard, 
  CalendarCheck, 
  BarChart3, 
  CreditCard,
  LogOut,
  Clock,
  Sun,
  Moon,
  Search,
  Bell,
  Settings,
  Store,
  Languages,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageProvider, useLanguage } from "@/lib/LanguageContext";

function NavItem({ item, isActive, isRTL, badge }: { item: any, isActive: boolean, isRTL: boolean, badge?: string }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative",
        isActive 
          ? "bg-[#F0F5FF] text-[#0055FF] dark:bg-indigo-500/10 dark:text-indigo-400 font-black" 
          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 font-bold"
      )}
    >
      <item.icon className={cn(
        "w-5 h-5",
        isActive ? "text-[#0055FF] dark:text-indigo-400" : "text-zinc-400 group-hover:text-zinc-600"
      )} />
      <span className="text-sm tracking-tight">{item.name}</span>
      
      {badge && (
        <span className={cn(
          "absolute text-[10px] font-black px-1.5 py-0.5 rounded-md",
          isRTL ? "left-4" : "right-4",
          isActive ? "bg-[#0055FF] text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
        )}>
          {badge}
        </span>
      )}

      {isActive && (
        <div className={cn(
          "absolute w-1.5 h-6 bg-[#0055FF] rounded-full",
          isRTL ? "-right-1" : "-left-1"
        )} />
      )}
    </Link>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const { lang, t, isRTL } = useLanguage();

  const navigation = [
    { name: t.overview, href: "/overview", icon: LayoutDashboard },
    { name: t.employees, href: "/employees", icon: Users, badge: "12" },
    { name: t.attendance, href: "/attendance", icon: CalendarCheck },
    { name: t.reports, href: "/reports", icon: BarChart3 },
    { name: t.billing, href: "/billing", icon: CreditCard },
  ];

  return (
    <aside className={cn(
      "w-72 bg-white dark:bg-[#09090b] flex flex-col fixed h-full z-40 transition-all duration-500 border-zinc-100 dark:border-zinc-800",
      isRTL ? "right-0 border-l" : "left-0 border-r"
    )}>
      {/* Brand */}
      <div className="p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0055FF] flex items-center justify-center shadow-xl shadow-indigo-500/20">
            <span className="text-white font-black text-2xl">b</span>
          </div>
          <span className="font-black text-2xl tracking-tighter text-zinc-900 dark:text-white">بسيط</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
        <div className="mb-6 px-4">
           <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{isRTL ? "القائمة الرئيسية" : "Main Menu"}</span>
        </div>
        <nav className="space-y-1">
          {navigation.map((item) => (
            <NavItem 
              key={item.href} 
              item={item} 
              isActive={pathname.startsWith(item.href)} 
              isRTL={isRTL}
              badge={item.badge}
            />
          ))}
        </nav>

        <div className="mt-10 mb-6 px-4">
           <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{isRTL ? "الإعدادات" : "Settings"}</span>
        </div>
        <nav className="space-y-1">
          <NavItem item={{ name: t.settings, href: "/settings", icon: Settings }} isActive={pathname === "/settings"} isRTL={isRTL} />
        </nav>
      </div>

      {/* User Session at bottom */}
      <div className="p-6 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-3xl group cursor-pointer hover:bg-zinc-100 transition-all">
           <div className="w-10 h-10 rounded-2xl bg-[#0055FF] flex items-center justify-center text-white font-black">
             {isRTL ? "أ" : "A"}
           </div>
           <div className="flex-1 min-w-0">
             <p className="text-sm font-black text-zinc-900 dark:text-white truncate">European Cosmetics</p>
             <p className="text-[10px] font-bold text-zinc-500 truncate">cosmetics@gmail.com</p>
           </div>
           <LogOut className="w-4 h-4 text-zinc-400 group-hover:text-red-500 transition-colors" />
        </div>
      </div>
    </aside>
  );
}

function Header() {
  const { isRTL, toggleLang, lang } = useLanguage();
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <header className={cn(
      "h-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 fixed top-0 z-30 transition-all duration-500",
      isRTL ? "left-0 right-72" : "right-0 left-72"
    )}>
      <div className="h-full px-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
           <div className="relative group hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder={isRTL ? "بحث..." : "Search..."}
                className="bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 ring-indigo-500/20 w-64 outline-none transition-all"
              />
           </div>
           <div className="h-6 w-[1px] bg-zinc-100 dark:bg-zinc-800 hidden md:block" />
           <div className="flex items-center gap-2 text-zinc-500 font-bold text-sm">
              <span className="hover:text-zinc-900 cursor-pointer">{isRTL ? "لوحة التحكم" : "Dashboard"}</span>
              <ChevronRight className="w-4 h-4 opacity-30" />
              <span className="text-zinc-900 dark:text-white font-black uppercase text-xs tracking-widest">Overview</span>
           </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 px-4 py-2.5 rounded-2xl text-[11px] font-black text-zinc-600 hover:bg-zinc-100 transition-all group">
            <Store className="w-4 h-4 text-[#0055FF]" />
            {isRTL ? "عرض المتجر" : "View Store"}
            <span className="bg-zinc-200 dark:bg-zinc-800 text-[9px] px-2 py-0.5 rounded-md ml-1 opacity-0 group-hover:opacity-100 transition-opacity uppercase">Owner</span>
          </button>
          
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl gap-1">
             <button onClick={toggleLang} className="p-2 rounded-xl hover:bg-white dark:hover:bg-zinc-900 text-zinc-500 hover:text-[#0055FF] transition-all">
               <Languages className="w-5 h-5" />
             </button>
             <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-white dark:hover:bg-zinc-900 text-zinc-500 hover:text-amber-500 transition-all">
               {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>
             <button className="p-2 rounded-xl hover:bg-white dark:hover:bg-zinc-900 text-zinc-500 hover:text-red-500 transition-all relative">
               <Bell className="w-5 h-5" />
               <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900" />
             </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 flex transition-all duration-300">
        <Sidebar />
        <div className="flex-1 min-h-screen flex flex-col">
          <Header />
          <main className={cn(
            "flex-1 p-8 pt-28 transition-all duration-500",
            // The sidebar itself moves, content just needs to account for its fixed width
            "ltr:ml-72 rtl:mr-72"
          )}>
            <div className="max-w-7xl mx-auto pb-20">
              {children}
            </div>
          </main>
        </div>
      </div>
    </LanguageProvider>
  );
}
