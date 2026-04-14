"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Users,
  CreditCard,
  Settings as SettingsIcon,
  HelpCircle,
  Bell,
  Clock,
  Menu as MenuIcon,
  X,
  ChevronLeft,
  Languages,
  Banknote
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageProvider, useLanguage } from "@/lib/LanguageContext";
import { BrandLogo } from "@/app/components/talabat-ui";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

function useNav(): NavGroup[] {
  const { t } = useLanguage();
  return [
    {
      label: t.monitor,
      items: [
        { name: t.overview, href: "/overview", icon: LayoutDashboard },
        { name: t.attendance, href: "/attendance", icon: ClipboardList },
        { name: t.reports, href: "/reports", icon: BarChart3 },
      ],
    },
    {
      label: t.manage,
      items: [
        { name: t.employees, href: "/employees", icon: Users },
        { name: (t as any).payroll, href: "/payroll", icon: CreditCard }, // Using CreditCard or another icon
        { name: t.billing, href: "/billing", icon: CreditCard },
        { name: t.settings, href: "/settings", icon: SettingsIcon },
      ],
    },
  ];
}

function Sidebar({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}) {
  const pathname = usePathname();
  const { isRTL } = useLanguage();
  const groups = useNav();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 z-50 w-[232px] bg-white flex flex-col transition-transform duration-200 ease-out lg:translate-x-0",
          isRTL
            ? "right-0 border-l border-[#eeeeee]"
            : "left-0 border-r border-[#eeeeee]",
          isOpen
            ? "translate-x-0"
            : isRTL
            ? "translate-x-full"
            : "-translate-x-full"
        )}
      >
        {/* Logo header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#f5f5f5]">
          <BrandLogo />
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 hover:bg-[#f5f5f5] rounded-md text-[#6b7280]"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="px-3 mb-2 text-[12px] text-[#9ca3af] font-medium">
                {group.label}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-[14px] transition-colors",
                          isActive
                            ? "text-[#ff5a00] font-semibold"
                            : "text-[#4b5563] hover:text-[#111] hover:bg-[#f7f7f7]"
                        )}
                      >
                        <Icon className="w-[18px] h-[18px] shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Collapse chevron (decorative on desktop — functional for mobile close) */}
        <div className="px-4 pb-4">
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full border border-[#eeeeee] bg-white flex items-center justify-center text-[#6b7280] hover:text-[#111] hover:bg-[#f5f5f5] transition-colors"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
          </button>
        </div>
      </aside>
    </>
  );
}

function TopBar({ setIsSidebarOpen }: { setIsSidebarOpen: (v: boolean) => void }) {
  const { t, toggleLang, lang } = useLanguage();

  return (
    <header className="h-16 bg-white border-b border-[#eeeeee] sticky top-0 z-30">
      <div className="h-full px-4 md:px-8 flex items-center justify-between">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden p-2 hover:bg-[#f5f5f5] rounded-md text-[#4b5563]"
          aria-label="Open menu"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="h-9 w-9 flex items-center justify-center rounded-full text-[#4b5563] hover:bg-[#f5f5f5] transition-colors"
            aria-label="Toggle language"
            title={lang === "en" ? "العربية" : "English"}
          >
            <Languages className="w-[18px] h-[18px]" />
          </button>

          <button
            className="h-9 w-9 flex items-center justify-center rounded-full text-[#4b5563] hover:bg-[#f5f5f5] transition-colors"
            aria-label="Activity"
          >
            <Clock className="w-[18px] h-[18px]" />
          </button>

          <button
            className="h-9 pl-3 pr-4 inline-flex items-center gap-2 rounded-full border border-[#ffd4b8] text-[#ff5a00] text-sm font-medium bg-white hover:bg-[#fff1e8] transition-colors"
            aria-label="Help center"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">{t.helpCenter}</span>
          </button>

          <button
            className="h-9 w-9 flex items-center justify-center rounded-full text-[#4b5563] hover:bg-[#f5f5f5] relative transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#ff5a00] rounded-full" />
          </button>

          <div
            className="h-9 w-9 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center text-[13px] font-bold"
            aria-label="Account"
          >
            A
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <LanguageProvider>
      <DashboardChrome
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      >
        {children}
      </DashboardChrome>
    </LanguageProvider>
  );
}

function DashboardChrome({
  isSidebarOpen,
  setIsSidebarOpen,
  children,
}: {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (v: boolean) => void;
  children: React.ReactNode;
}) {
  const { isRTL } = useLanguage();

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#111] flex font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen min-w-0",
          isRTL ? "lg:mr-[232px]" : "lg:ml-[232px]"
        )}
      >
        <TopBar setIsSidebarOpen={setIsSidebarOpen} />
        <main className="flex-1 px-4 md:px-8 py-8 max-w-[1200px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
