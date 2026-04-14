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
  Languages,
  Menu,
  X,
  Plus,
  ChevronRight,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageProvider, useLanguage } from "@/lib/LanguageContext";

function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (v: boolean) => void }) {
  const pathname = usePathname();
  const { lang, t, isRTL } = useLanguage();

  const navigation = [
    { name: t.overview, href: "/overview", icon: LayoutDashboard },
    { name: t.employees, href: "/employees", icon: Users },
    { name: t.attendance, href: "/attendance", icon: CalendarCheck },
    { name: t.reports, href: "/reports", icon: BarChart3 },
    { name: t.billing, href: "/billing", icon: CreditCard },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed top-0 bottom-0 z-50 w-[260px] bg-[#fbfbfa] dark:bg-[#191919] border-zinc-200 dark:border-zinc-800 transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col",
        isRTL ? "right-0 border-l" : "left-0 border-r",
        isOpen ? "translate-x-0" : isRTL ? "translate-x-full" : "-translate-x-full"
      )}>
        {/* Workspace Header */}
        <div className="p-4 flex items-center justify-between group">
          <div className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer w-full overflow-hidden">
             <div className="w-5 h-5 rounded bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-white dark:text-black">
               {isRTL ? "س" : "S"}
             </div>
             <span className="text-sm font-bold truncate">SyncTime Workspace</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
               <span>{isRTL ? "نظرة عامة" : "Main"}</span>
               <Plus className="w-3 h-3 cursor-pointer hover:text-zinc-600" />
            </div>
            <nav className="space-y-0.5">
              {navigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] transition-colors group",
                      isActive 
                        ? "bg-zinc-200/60 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold" 
                        : "text-zinc-500 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4", isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 group-hover:text-zinc-600")} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <div className="px-3 mb-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
               {isRTL ? "الإعدادات" : "Configuration"}
            </div>
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] transition-colors",
                pathname === "/settings" 
                  ? "bg-zinc-200/60 dark:bg-zinc-800 text-zinc-900 font-bold" 
                  : "text-zinc-500 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/50 hover:text-zinc-900"
              )}
            >
              <Settings className="w-4 h-4" />
              <span>{t.settings}</span>
            </Link>
          </div>
        </div>

        {/* User Session */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                 <div className="w-6 h-6 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-[10px] text-white dark:text-black font-bold">A</div>
                 <span className="text-[13px] font-bold text-zinc-600 truncate max-w-[120px]">Antonious</span>
              </div>
              <button className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors">
                 <MoreHorizontal className="w-4 h-4 text-zinc-400" />
              </button>
           </div>
        </div>
      </aside>
    </>
  );
}

function Header({ setIsSidebarOpen }: { setIsSidebarOpen: (v: boolean) => void }) {
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
    <header className="h-12 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-[#121212]/80 backdrop-blur sticky top-0 z-30 transition-all duration-300">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
             <span className="hover:underline cursor-pointer">SyncTime</span>
             <ChevronRight className="w-3 h-3 opacity-50" />
             <span className="text-zinc-600 dark:text-zinc-300">Dashboard</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={toggleLang} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-500 text-xs font-bold transition-all">
             {lang === 'en' ? 'AR' : 'EN'}
          </button>
          <button onClick={toggleTheme} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-500 transition-all">
             {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-500 relative transition-all">
             <Bell className="w-4 h-4" />
             <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-white dark:bg-[#121212] text-zinc-900 dark:text-zinc-100 flex font-sans transition-colors duration-300">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <div className={cn(
          "flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300",
          "lg:ltr:ml-[260px] lg:rtl:mr-[260px]"
        )}>
          <Header setIsSidebarOpen={setIsSidebarOpen} />
          <main className="flex-1 p-4 sm:p-8 md:p-12 max-w-5xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </LanguageProvider>
  );
}
