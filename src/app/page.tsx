"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  MessageCircle, 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  Clock,
  Smartphone,
  ChevronRight,
  Sun,
  Moon
} from "lucide-react";
import PricingSection from "./components/pricing-section";

export default function LandingPage() {
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

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter">SyncTime</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <Link href="/login" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-border transition-all"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link href="/signup" className="bg-foreground text-background px-6 py-3 rounded-2xl font-black hover:scale-105 transition-all text-sm shadow-xl">
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-indigo-600/10 text-indigo-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest animate-fade-in">
            <Zap className="w-4 h-4" />
            Attendance Reimagined
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-balance">
            نظام الحضور والإنصراف <br/>
            <span className="text-indigo-600 italic">عبر تليجرام</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-bold leading-relaxed">
            تتبع حضور موظفيك من خلال تليجرام مباشرة. لا داعي لأجهزة البصمة المكلفة، موبايل الموظف هو جهازه.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/signup" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-black px-10 py-5 rounded-3xl text-xl shadow-2xl shadow-indigo-500/30 flex items-center justify-center gap-3 group transition-all transform hover:-translate-y-1">
              ابدأ تجربتك المجانية
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <div className="flex items-center gap-4 px-8 text-muted-foreground font-black uppercase tracking-tighter text-sm">
              <span className="flex items-center gap-1"><ShieldCheck className="w-5 h-5 text-indigo-500" /> No Hardware</span>
              <span className="flex items-center gap-1"><Zap className="w-5 h-5 text-amber-500" /> Instant Setup</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats / Features Grid */}
      <section id="features" className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              title: "Simple Telegram Bot", 
              desc: "Employees check-in via a simple button click on Telegram. Instant synchronization.",
              icon: MessageCircle,
              color: "bg-sky-500"
            },
            { 
              title: "Smart Analytics", 
              desc: "Get automated reports on late arrivals, working hours, and monthly performance.",
              icon: BarChart3,
              color: "bg-indigo-600"
            },
            { 
              title: "Mobile First", 
              desc: "Administer your entire team from your phone. Clean, responsive admin dashboard.",
              icon: Smartphone,
              color: "bg-emerald-600"
            }
          ].map((feature, i) => (
            <div key={i} className="bg-background border border-border p-10 rounded-[2.5rem] space-y-6 hover:shadow-2xl transition-all group">
              <div className={`${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black tracking-tight">{feature.title}</h3>
              <p className="text-muted-foreground font-bold leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* Footer */}
      <footer className="py-20 border-t border-border mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-indigo-600" />
            <span className="text-xl font-black tracking-tighter">SyncTime</span>
          </div>
          <p className="text-muted-foreground font-bold text-sm">© 2026 SyncTime. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
