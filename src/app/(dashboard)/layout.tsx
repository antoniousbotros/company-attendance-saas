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
  Languages
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageProvider, useLanguage } from "@/lib/LanguageContext";

function Sidebar() {
  const pathname = usePathname();
  const { lang, t, toggleLang, isRTL } = useLanguage();
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const navigation = [
    { name: t.overview, href: "/overview", icon: LayoutDashboard },
    { name: t.employees, href: "/employees", icon: Users },
    { name: t.attendance, href: "/attendance", icon: CalendarCheck },
    { name: t.reports, href: "/reports", icon: BarChart3 },
    { name: t.billing, href: "/billing", icon: CreditCard },
  ];

  return (
    <aside className={cn(
      "w-64 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] flex flex-col fixed h-full z-20 transition-all duration-300",
      isRTL ? "right-0 border-l" : "left-0 border-r"
    )}>
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-xl tracking-tight">SyncTime</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" 
                  : "text-zinc-500 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5",
                isActive ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500 group-hover:text-indigo-600 dark:group-hover:text-zinc-300"
              )} />
              <span className="font-bold text-sm tracking-tight">{item.name}</span>
              {isActive && (
                <div className={cn(
                  "absolute w-1 h-6 bg-indigo-600 rounded-full",
                  isRTL ? "right-0 rounded-l-full" : "left-0 rounded-r-full"
                )} />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 space-y-2 border-t border-zinc-200 dark:border-zinc-800">
        <button 
          onClick={toggleLang}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-zinc-500 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all font-bold text-sm"
        >
          <Languages className="w-5 h-5" />
          {lang === "en" ? "العربية" : "English"}
        </button>
        
        <button 
          onClick={toggleTheme}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-zinc-500 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all font-bold text-sm"
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {theme === "dark" ? t.lightMode : t.darkMode}
        </button>
        
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-zinc-500 hover:text-red-600 hover:bg-red-500/10 transition-all font-bold text-sm">
          <LogOut className="w-5 h-5" />
          {t.signOut}
        </button>
      </div>
    </aside>
  );
}

function MainContent({ children }: { children: React.ReactNode }) {
  const { isRTL } = useLanguage();
  
  return (
    <main className={cn(
      "flex-1 p-8 bg-zinc-50/50 dark:bg-transparent min-h-screen transition-all duration-300",
      isRTL ? "mr-64" : "ml-64"
    )}>
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </main>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background text-foreground flex transition-all duration-300">
        <Sidebar />
        <MainContent>
          {children}
        </MainContent>
      </div>
    </LanguageProvider>
  );
}
