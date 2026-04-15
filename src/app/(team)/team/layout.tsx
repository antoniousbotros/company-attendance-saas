"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Clock,
  Home,
  CalendarDays,
  CheckSquare,
  Megaphone,
  BarChart3,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmployeeData {
  id: string;
  name: string;
  phone: string;
  department: string;
  company_id: string;
  companies: {
    name: string;
    enable_geofencing: boolean;
    office_lat: number;
    office_lng: number;
    office_radius: number;
    work_start_time: string;
    late_threshold: number;
    sales_tracking_enabled: boolean;
    bot_language: string;
  };
}

interface TeamContextType {
  employee: EmployeeData | null;
  loading: boolean;
}

const TeamContext = createContext<TeamContextType>({ employee: null, loading: true });
export const useTeam = () => useContext(TeamContext);

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);

  // Skip layout shell for login page
  if (pathname === "/team/login") {
    return <>{children}</>;
  }

  useEffect(() => {
    fetch("/api/team/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setEmployee(data.employee);
        } else {
          router.push("/team/login");
        }
      })
      .catch(() => router.push("/team/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/team/auth/logout", { method: "POST" });
    router.push("/team/login");
  };

  const salesEnabled = employee?.companies?.sales_tracking_enabled;

  const navItems = [
    { name: "Home", icon: Home, href: "/team" },
    { name: "Attendance", icon: CalendarDays, href: "/team/attendance" },
    { name: "Tasks", icon: CheckSquare, href: "/team/tasks" },
    { name: "News", icon: Megaphone, href: "/team/announcements" },
    ...(salesEnabled
      ? [{ name: "Reports", icon: BarChart3, href: "/team/reports" }]
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
    <TeamContext.Provider value={{ employee, loading }}>
      <div className="min-h-screen bg-[#f5f5f5] font-sans">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex fixed inset-y-0 left-0 w-56 bg-white border-r border-[#e0e0e0] flex-col z-40">
          <div className="p-5 border-b border-[#e0e0e0]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#ff5a00] rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-black tracking-tight text-[#111]">Yawmy</span>
            </div>
            {employee && (
              <p className="text-xs font-semibold text-[#6b7280] mt-2 truncate">
                {employee.name}
              </p>
            )}
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all",
                    isActive
                      ? "bg-[#fff1e8] text-[#ff5a00]"
                      : "text-[#6b7280] hover:bg-[#f5f5f5] hover:text-[#111]"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-[#e0e0e0]">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-[#6b7280] hover:text-[#b91c1c] hover:bg-[#fef2f2] transition-all w-full"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="lg:ml-56 pb-20 lg:pb-0">
          <div className="max-w-3xl mx-auto px-4 py-6">{children}</div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#e0e0e0] z-40 safe-area-pb">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all",
                    isActive ? "text-[#ff5a00]" : "text-[#9ca3af]"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] font-bold">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </TeamContext.Provider>
  );
}
