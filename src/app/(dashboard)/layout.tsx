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
  Globe,
  Banknote,
  ListTodo,
  Megaphone
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
  const { t, isRTL } = useLanguage();
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
        { name: (t as any).tasks, href: "/tasks", icon: ListTodo },
        { name: isRTL ? "إعلانات الشركة" : "Announcements", href: "/announcements", icon: Megaphone },
        { name: (t as any).payroll, href: "/payroll", icon: CreditCard },
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
            className="h-9 w-9 flex items-center justify-center rounded-full text-[#4b5563] border border-[#eeeeee] hover:bg-[#f5f5f5] transition-colors"
            aria-label="Toggle language"
            title={lang === "en" ? "العربية" : "English"}
          >
            <Globe className="w-[18px] h-[18px]" />
          </button>

          <div
            className="h-9 w-9 rounded-full bg-[#111] text-white flex items-center justify-center text-[13px] font-bold shadow-sm"
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
  const [showRolesModal, setShowRolesModal] = useState(false);

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

        <footer className="mt-auto px-4 md:px-8 py-6 border-t border-[#eeeeee] bg-white flex flex-col items-center justify-center text-center">
          <p className="text-[11px] text-[#9ca3af] mb-1 font-medium tracking-wide">HR & PAYROLL ENGINE</p>
          <button 
            onClick={() => setShowRolesModal(true)} 
            className="text-xs font-bold text-[#6b7280] hover:text-[#ff5a00] transition-colors underline decoration-[#ff5a00]/30 underline-offset-4"
          >
             {isRTL ? "كيف يتم حساب الخصومات والرواتب؟" : "How are deductions & payroll calculated?"}
          </button>
        </footer>

        {showRolesModal && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowRolesModal(false)}>
              <div 
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 md:p-8 relative max-h-[85vh] overflow-y-auto" 
                onClick={(e) => e.stopPropagation()} 
                dir={isRTL ? "rtl" : "ltr"}
              >
                 <button 
                    onClick={() => setShowRolesModal(false)} 
                    className={cn("absolute top-5 p-2 bg-[#f5f5f5] rounded-full text-[#6b7280] hover:text-[#111] hover:bg-[#eeeeee] transition-colors", isRTL ? "left-5" : "right-5")}
                 >
                    <X className="w-4 h-4"/>
                 </button>
                 
                 <div className="mb-6">
                    <h2 className="text-xl font-bold text-[#111] leading-tight mb-2">
                       {isRTL ? "سياسة الخصومات وحساب الراتب" : "Payroll & Deduction AI Logic"}
                    </h2>
                    <p className="text-sm text-[#6b7280]">
                       {isRTL 
                        ? "هكذا يقوم النظام تلقائياً بحساب راتب كل موظف بناءً على إعدادات شركتك."
                        : "Here is exactly how our engine calculates every employee's final payroll automatically."}
                    </p>
                 </div>

                 <div className="space-y-4">
                    <div className="p-4 bg-[#f9fafb] border border-[#eeeeee] rounded-xl flex items-start gap-4">
                       <div className="w-8 h-8 rounded-full bg-[#ff5a00]/10 text-[#ff5a00] flex items-center justify-center font-bold text-sm shrink-0">1</div>
                       <div>
                          <h4 className="font-bold text-[#111] text-sm mb-1">{isRTL ? "حساب قيمة اليوم" : "Daily Rate Formula"}</h4>
                          <p className="text-xs text-[#4b5563] leading-relaxed">
                            {isRTL 
                             ? "للموظفين الشهريين: يتم قسمة الراتب الأساسي على عدد «أيام العمل المتوقعة» في الشهر (بعد استبعاد أيام الإجازات الأسبوعية والعطلات الرسمية)."
                             : "For Monthly salaries: The base salary is divided by the exact calendar 'Expected Working Days' inside that specific month (skipping weekends and your holidays)."}
                          </p>
                       </div>
                    </div>

                    <div className="p-4 bg-[#f9fafb] border border-[#eeeeee] rounded-xl flex items-start gap-4">
                       <div className="w-8 h-8 rounded-full bg-[#ff5a00]/10 text-[#ff5a00] flex items-center justify-center font-bold text-sm shrink-0">2</div>
                       <div>
                          <h4 className="font-bold text-[#111] text-sm mb-1">{isRTL ? "غياب اليوم الكامل" : "Full Absence Penalties"}</h4>
                          <p className="text-xs text-[#4b5563] leading-relaxed">
                            {isRTL 
                             ? "يتم المقارنة بين حضور الموظف وأيام العمل المتوقعة. يتم خصم قيمة الأيام الغائبة مصحوبةً بـ «مُعامل خصم الغياب» (مثلاً: خصم يومين لكل يوم غياب)."
                             : "The system compares actual check-ins vs expected days. Missing days are deducted multiplied by your company's 'Absence Penalty' config (e.g. 2 days cut per 1 missed day)."}
                          </p>
                       </div>
                    </div>

                    <div className="p-4 bg-[#f9fafb] border border-[#eeeeee] rounded-xl flex items-start gap-4">
                       <div className="w-8 h-8 rounded-full bg-[#ff5a00]/10 text-[#ff5a00] flex items-center justify-center font-bold text-sm shrink-0">3</div>
                       <div>
                          <h4 className="font-bold text-[#111] text-sm mb-1">{isRTL ? "غياب نصف يوم" : "Half-Day Deductions"}</h4>
                          <p className="text-xs text-[#4b5563] leading-relaxed">
                            {isRTL 
                             ? "إذا حضر الموظف وانصرف مبكراً بحيث كان مجموع ساعاته أقل من حد «ساعات نصف اليوم»، يُخصم منه نصف قيمة الخصم اليومي."
                             : "If an employee works less hours than your 'Half-Day Threshold' config, they are hit with exactly half of the standard absence deduction penalty."}
                          </p>
                       </div>
                    </div>

                    <div className="p-4 bg-[#fef2f2] border border-[#fca5a5] rounded-xl flex items-start gap-4 text-[#991b1b]">
                       <div className="w-8 h-8 rounded-full bg-[#fee2e2] text-[#b91c1c] flex items-center justify-center font-bold text-sm shrink-0">4</div>
                       <div>
                          <h4 className="font-bold text-[#7f1d1d] text-sm mb-1">{isRTL ? "حساب دقائق التأخير" : "Late Minute Deductions"}</h4>
                          <p className="text-xs text-[#991b1b]/80 leading-relaxed font-medium">
                            {isRTL 
                             ? "يتم جمع كل الدقائق التي تأخر فيها الموظف بعد «فترة السماح» وضربها بقيمة الخصم المحددة لكل دقيقة تأخير."
                             : "Any check-in past the start time minus their 'Grace Period' is tracked. Total late minutes in the month are multiplied by your Late Penalty rate."}
                          </p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
