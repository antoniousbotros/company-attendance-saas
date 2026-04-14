"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, LogOut, ShieldAlert } from "lucide-react";

export default function SadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/sadmin/login") {
    return <div className="min-h-screen bg-[#09090b] text-white">{children}</div>;
  }

  const handleSignout = async () => {
    await fetch("/api/sadmin/auth?action=logout", { method: "POST" });
    router.push("/sadmin/login");
  };

  const navItems = [
    { name: "Overview", icon: LayoutDashboard, href: "/sadmin" },
    { name: "Accounts", icon: Users, href: "/sadmin/accounts" },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex">
      {/* Stripe / Notion Style Sidebar */}
      <aside className="w-64 bg-[#0a0a0a] border-r border-[#1f1f1f] flex flex-col fixed inset-y-0 left-0 z-50 shadow-2xl">
        <div className="p-6 mb-2">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
               <ShieldAlert className="w-5 h-5 text-indigo-400" />
             </div>
             <h1 className="text-xl font-bold tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">God Mode</h1>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-white/5 text-white shadow-sm ring-1 ring-white/10" 
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                }`}
              >
                <item.icon className={`w-[18px] h-[18px] ${isActive ? "text-indigo-400" : ""}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <button 
            onClick={handleSignout} 
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all font-medium"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 bg-[#09090b] min-h-screen">
        {children}
      </main>
    </div>
  );
}
