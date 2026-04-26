"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Users,
  CreditCard,
  Settings as SettingsIcon,
  HelpCircle,
  ArrowUpRight,
  Bell,
  Clock,
  Menu as MenuIcon,
  X,
  ChevronLeft,
  Globe,
  Banknote,
  ListTodo,
  Megaphone,
  LocateFixed,
  LogOut,
  Smartphone
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
        { name: isRTL ? "التقارير الميدانية" : "Sales Tracking", href: "/sales-tracking", icon: LocateFixed },
        { name: (t as any).payroll, href: "/payroll", icon: CreditCard },
        { name: t.billing, href: "/billing", icon: CreditCard },
        { name: isRTL ? "مدونة يومي" : "Yawmy Blog", href: "/blog", icon: Globe },
        { name: t.settings, href: "/settings", icon: SettingsIcon },
      ],
    },
    {
      label: isRTL ? "بوابات خارجية" : "External Portals",
      items: [
        { name: isRTL ? "تطبيق الموظفين (برو)" : "Employee App (Pro)", href: "https://team.yawmy.app", icon: Smartphone },
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
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const groups = useNav();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const [profile, setProfile] = React.useState<{name:string;email:string}|null>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setProfile({
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Admin',
          email: data.user.email || '',
        });
      }
    });
  }, []);

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
          "fixed top-0 bottom-0 z-50 w-[260px] bg-white flex flex-col transition-transform duration-200 ease-out lg:translate-x-0",
          isRTL
            ? "right-0 border-l border-[#eeeeee]"
            : "left-0 border-r border-[#eeeeee]",
          isOpen
            ? "translate-x-0"
            : isRTL
            ? "translate-x-full"
            : "-translate-x-full"
        )}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Logo header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#f0f0f0]">
          <BrandLogo />
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 hover:bg-[#f5f5f5] rounded-md text-[#9ca3af]"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {groups.map((group) => (
            <div key={group.label}>
              <div className={cn(
                "px-3 mb-1.5 text-[10px] font-black text-[#c4c4c4] uppercase tracking-[0.12em]",
                isRTL && "text-right"
              )}>
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
                          "flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium transition-all duration-150",
                          isRTL && "flex-row-reverse text-right",
                          isActive
                            ? "bg-[#fff4ee] text-[#ff5a00] font-bold"
                            : "text-[#6b7280] hover:text-[#111] hover:bg-[#f9f9f9]"
                        )}
                      >
                        <Icon className={cn(
                          "w-[17px] h-[17px] shrink-0 transition-colors",
                          isActive ? "text-[#ff5a00]" : "text-[#c4c4c4]"
                        )} />
                        <span className="truncate flex-1">{item.name}</span>
                        {isActive && (
                          <span className={cn(
                            "w-1 h-4 rounded-full bg-[#ff5a00] shrink-0",
                            isRTL ? "mr-auto" : "ml-auto"
                          )} />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Profile + Sign Out */}
        <div className="border-t border-[#f0f0f0] p-3 space-y-1">
          {profile && (
            <div className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md bg-[#f9f9f9]",
              isRTL && "flex-row-reverse text-right"
            )}>
              <div className="w-8 h-8 rounded-full bg-[#111] text-white flex items-center justify-center text-[12px] font-black shrink-0">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-bold text-[#111] truncate">{profile.name}</span>
                <span className="text-[10px] text-[#9ca3af] truncate">{profile.email}</span>
              </div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium text-[#dc2626] hover:bg-[#fef2f2] transition-all duration-150",
              isRTL && "flex-row-reverse text-right"
            )}
          >
            <LogOut className={cn("w-[16px] h-[16px] shrink-0")} />
            <span>{isRTL ? "تسجيل الخروج" : "Sign Out"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function PageBanner() {
  const pathname = usePathname();
  const { isRTL } = useLanguage();
  const groups = useNav();

  const activeItem = groups
    .flatMap((g) => g.items)
    .find((item) => pathname.startsWith(item.href));

  if (!activeItem) return null;

  return (
    <div className="bg-[#f0f9f4] border-b border-[#d1fae5] py-6 px-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-[1200px] mx-auto w-full">
        <div className={cn("flex items-center gap-2 mb-1 text-[10px] font-black text-[#9ca3af] uppercase tracking-[0.12em]", isRTL && "flex-row-reverse")}>
          <span>{isRTL ? "لوحة التحكم" : "Dashboard"}</span>
          <span className="opacity-30">/</span>
          <span className="text-[#ff5a00]">{activeItem.name}</span>
        </div>
        <h1 className={cn("text-2xl font-black tracking-tight text-[#111]", isRTL && "text-right")}>
          {activeItem.name}
        </h1>
      </div>
    </div>
  );
}

function TopBar({ setIsSidebarOpen }: { setIsSidebarOpen: (v: boolean) => void }) {
  const { toggleLang, lang, isRTL } = useLanguage();

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

        <div className="flex items-center gap-4">
          <a href="https://team.yawmy.app" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs sm:text-sm font-bold text-[#ff5a00] hover:underline">
            <span className="hidden sm:inline">{isRTL ? "تطبيق الموظفين" : "Employee App"}</span>
            <span className="sm:hidden">{isRTL ? "التطبيق" : "App"}</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
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
  const [showTeamBanner, setShowTeamBanner] = useState(false);
  const [access, setAccess] = useState<any>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem("team_banner_dismissed");
    if (!dismissed) setShowTeamBanner(true);

    fetch("/api/billing/access")
      .then(res => res.json())
      .then(data => setAccess(data))
      .catch(console.error);
  }, []);

  const dismissBanner = () => {
    localStorage.setItem("team_banner_dismissed", "true");
    setShowTeamBanner(false);
  };

  const isTrialActive = access?.isTrial && access?.status === 'active';
  const isTrialExpired = access?.isTrial && access?.status === 'expired';

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#111] flex font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen min-w-0 bg-white",
          isRTL ? "lg:mr-[260px]" : "lg:ml-[260px]"
        )}
      >
        <TopBar setIsSidebarOpen={setIsSidebarOpen} />

        {!isTrialExpired && (
          <div className="bg-[#1e8e3e] text-white px-4 md:px-8 py-3 relative flex items-center justify-between text-start md:text-center z-20">
            <div className="flex flex-col md:flex-row md:items-center justify-center gap-2 md:gap-4 flex-1">
              <span className="text-sm font-medium">
                 {isRTL 
                   ? "دع موظفيك يستخدمون تطبيقهم الخاص لإدارة المهام والتسجيل والتقارير." 
                   : "Give your employees their own Pro App to manage tasks, attendance, and reports."}
              </span>
              <a href="https://team.yawmy.app" target="_blank" rel="noreferrer" className="bg-white text-[#1e8e3e] w-fit px-4 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-gray-100 transition-colors">
                {isRTL ? "تطبيق فريق العمل" : "Open Team App"}
              </a>
            </div>
            <button 
              onClick={dismissBanner} 
              className={cn("absolute w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors", isRTL ? "left-4" : "right-4")} 
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <PageBanner />
        
        {/* Trial Banners */}
        {isTrialActive && (
          <div className="bg-[#0284c7] text-white px-4 md:px-8 py-2.5 flex items-center justify-between text-xs sm:text-sm font-bold animate-in slide-in-from-top duration-500 z-20">
             <div className="flex-1 text-center">
                {isRTL 
                 ? `بقي ${access?.daysLeft} أيام في الفترة التجريبية للباقة الاحترافية (Pro).` 
                 : `You have ${access?.daysLeft} days left in your Pro Trial.`}
             </div>
             <Link href="/billing" className="bg-white text-[#0284c7] px-3 py-1 rounded-full hover:bg-gray-100 transition-colors shrink-0">
               {isRTL ? "اشترك الآن" : "Unlock Forever"}
             </Link>
          </div>
        )}

        {isTrialExpired && (
          <div className="bg-red-600 text-white px-4 md:px-8 py-2.5 flex items-center justify-between text-xs sm:text-sm font-bold z-20">
             <div className="flex-1 text-center">
                {isRTL 
                 ? "انتهت الفترة التجريبية! يرجى الاشتراك للاستمرار في استخدام المميزات الاحترافية." 
                 : "Trial Expired! Subscribe to keep your Premium features active."}
             </div>
             <Link href="/billing" className="bg-white text-red-600 px-3 py-1 rounded-full hover:bg-white/90 transition-colors shrink-0">
               {isRTL ? "تفعيل الحساب" : "Activate Now"}
             </Link>
          </div>
        )}


        <main className="flex-1 px-8 py-10 max-w-[1200px] w-full mx-auto bg-white min-h-[calc(100vh-64px-116px)]">
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
