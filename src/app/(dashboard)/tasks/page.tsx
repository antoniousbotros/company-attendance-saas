"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  ListTodo, Plus, Search, Calendar, Link as LinkIcon,
  X, ChevronDown, User, ChevronLeft, ChevronRight, LayoutList
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";
import { PageHeader, SectionCard, PrimaryButton, StatusPill } from "@/app/components/talabat-ui";

type Employee = { id: string; name: string };
type Task = {
  id: string;
  title: string;
  description: string;
  link: string;
  deadline: string;
  status: "pending" | "in_progress" | "late" | "completed";
  employee_submission?: string | null;
  created_at: string;
  assigned: { name: string };
  assigned_to: string;
  assigner?: { name: string };
};

type DatePreset = "all" | "today" | "week" | "month" | "custom";

function getDateRange(preset: DatePreset, customFrom: string, customTo: string): { from: Date | null; to: Date | null } {
  const now = new Date();
  if (preset === "today") {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    const end = new Date(now); end.setHours(23, 59, 59, 999);
    return { from: start, to: end };
  }
  if (preset === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { from: start, to: end };
  }
  if (preset === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { from: start, to: end };
  }
  if (preset === "custom" && customFrom && customTo) {
    return { from: new Date(customFrom + "T00:00:00"), to: new Date(customTo + "T23:59:59") };
  }
  return { from: null, to: null };
}

function AdminCalendarView({
  tasks,
  isRTL,
  selectedDate,
  setSelectedDate,
}: {
  tasks: Task[];
  isRTL: boolean;
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const paddingDays = Array.from({ length: firstDay }).map((_, i) => i);
  const monthDays = Array.from({ length: daysInMonth }).map((_, i) => i + 1);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

  const calendarTasks = tasks.filter(t => t.deadline);
  const tasksForDay = (day: number) => {
    const dayDate = new Date(year, month, day);
    return calendarTasks.filter(t => isSameDay(new Date(t.deadline), dayDate));
  };

  const weekDaysAr = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const weekDaysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekDays = isRTL ? weekDaysAr : weekDaysEn;

  return (
    <div className="bg-white border-b border-[#eeeeee] p-5 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black text-[#111]">
          {currentDate.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <button onClick={isRTL ? nextMonth : prevMonth} className="p-2 rounded-xl border border-[#e0e0e0] hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-[#6b7280]" />
          </button>
          <button onClick={isRTL ? prevMonth : nextMonth} className="p-2 rounded-xl border border-[#e0e0e0] hover:bg-gray-50 transition-colors">
            <ChevronRight className="w-5 h-5 text-[#6b7280]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(d => (
          <div key={d} className="text-center text-xs font-bold text-[#9ca3af] uppercase tracking-wider py-2">
            {d}
          </div>
        ))}
        
        {paddingDays.map(i => <div key={`pad-${i}`} className="p-2" />)}
        
        {monthDays.map(day => {
          const dayDate = new Date(year, month, day);
          const isSelected = isSameDay(dayDate, selectedDate);
          const isToday = isSameDay(dayDate, new Date());
          const dayTasks = tasksForDay(day);

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(dayDate)}
              className={cn(
                "h-14 rounded-2xl flex flex-col items-center justify-center relative transition-all border",
                isSelected
                  ? "bg-[#111] text-white font-black border-[#111] shadow-md scale-105 z-10"
                  : isToday
                  ? "bg-[#fff1e8] text-[#ff5a00] font-bold border-[#ffd4b8]"
                  : "bg-white hover:bg-gray-50 text-[#4b5563] font-medium border-[#eeeeee]"
              )}
            >
              <span className="text-sm">{day}</span>
              {dayTasks.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1 justify-center max-w-[80%]">
                  {dayTasks.slice(0, 3).map((t, i) => (
                    <div key={i} className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isSelected ? "bg-[#ff5a00]" : t.status === "completed" ? "bg-[#10b981]" : t.status === "in_progress" ? "bg-[#3b82f6]" : "bg-[#f59e0b]"
                    )} />
                  ))}
                  {dayTasks.length > 3 && <span className="text-[8px] font-bold opacity-70">+{dayTasks.length - 3}</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { t, isRTL } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // New Task Form
  const [showForm, setShowForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    link: "",
    deadline: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    assigned_to: "",
    file: null as File | null,
  });

  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: company } = await supabase.from("companies").select("id").eq("owner_id", user.id).single();
    if (!company) { setLoading(false); return; }

    const { data: emps } = await supabase.from("employees").select("id, name").eq("company_id", company.id);
    if (emps) setEmployees(emps);

    const { data: tsks } = await supabase.from("tasks")
      .select("*, assigned:employees!assigned_to(name), assigner:employees!assigned_by(name)")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });

    if (tsks) setTasks(tsks as Task[]);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  // Derived: filtered tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (viewMode === "calendar") {
      result = result.filter(t => {
        if (!t.deadline) return false;
        const d1 = new Date(t.deadline);
        return d1.getFullYear() === calendarDate.getFullYear() && d1.getMonth() === calendarDate.getMonth() && d1.getDate() === calendarDate.getDate();
      });
      return result;
    }

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.assigned?.name?.toLowerCase().includes(q)
      );
    }

    // Employee filter
    if (employeeFilter !== "all") {
      result = result.filter(t => t.assigned_to === employeeFilter);
    }

    // Date filter (by created_at)
    const { from, to } = getDateRange(datePreset, customFrom, customTo);
    if (from && to) {
      result = result.filter(t => {
        const d = new Date(t.created_at);
        return d >= from && d <= to;
      });
    }

    return result;
  }, [tasks, search, employeeFilter, datePreset, customFrom, customTo, viewMode, calendarDate]);

  const hasFilters = search || employeeFilter !== "all" || datePreset !== "all";

  const clearFilters = () => {
    setSearch("");
    setEmployeeFilter("all");
    setDatePreset("all");
    setCustomFrom("");
    setCustomTo("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.assigned_to || !form.deadline) return alert(isRTL ? "يرجى ملء الحقول المطلوبة." : "Please fill required fields.");

    setIsUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsUploading(false); return; }
    const { data: company } = await supabase.from("companies").select("id").eq("owner_id", user.id).single();
    if (!company) { setIsUploading(false); alert("Company not found."); return; }

    const { data: executer } = await supabase.from("employees").select("id").eq("company_id", company.id).limit(1).single();

    let finalLink = form.link;

    if (form.file) {
      if (form.file.size > 2 * 1024 * 1024) {
        setIsUploading(false);
        alert(isRTL ? "عذراً، الحد الأقصى لحجم الملف هو ٢ ميجابايت." : "Max file size is 2MB.");
        return;
      }
      const fileExt = form.file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${company.id}/tasks/${fileName}`;
      const { error: uploadError } = await supabase.storage.from("task-attachments").upload(filePath, form.file);
      if (uploadError) { setIsUploading(false); alert(isRTL ? "فشل رفع الملف." : "File upload failed."); return; }
      const { data: { publicUrl } } = supabase.storage.from("task-attachments").getPublicUrl(filePath);
      finalLink = publicUrl;
    }

    const { error } = await supabase.from("tasks").insert({
      company_id: company.id,
      assigned_to: form.assigned_to,
      assigned_by: executer ? executer.id : null,
      title: form.title,
      description: form.description,
      link: finalLink,
      deadline: form.deadline,
      status: "pending",
    });

    setIsUploading(false);
    if (error) return alert(isRTL ? "فشل تعيين المهمة" : "Failed to assign task");
    setShowForm(false);
    setForm({ ...form, title: "", description: "", link: "", file: null });
    loadData();
  };

  const datePresets: { key: DatePreset; label: string; labelAr: string }[] = [
    { key: "all", label: "All Time", labelAr: "الكل" },
    { key: "today", label: "Today", labelAr: "اليوم" },
    { key: "week", label: "This Week", labelAr: "هذا الأسبوع" },
    { key: "month", label: "This Month", labelAr: "هذا الشهر" },
    { key: "custom", label: "Custom", labelAr: "تخصيص" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <PageHeader
        title={isRTL ? "إدارة المهام" : "Task Management"}
        subtitle={isRTL ? "تعيين المهام لموظفيك ومتابعة التنفيذ لحظياً" : "Assign and track daily/weekly employee tasks"}
        isRTL={isRTL}
        action={
          <PrimaryButton disabled={isUploading} icon={Plus} onClick={() => setShowForm(!showForm)}>
            {showForm ? (isRTL ? "إلغاء" : "Cancel") : (isRTL ? "إضافة مهمة" : "New Task")}
          </PrimaryButton>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SectionCard className="p-4 border-[#eeeeee]">
          <h4 className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">{isRTL ? "إجمالي المهام" : "Total Tasks"}</h4>
          <p className="text-2xl font-black text-[#111] mt-2">{tasks.length}</p>
        </SectionCard>
        <SectionCard className="p-4 border-[#eeeeee]">
          <h4 className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">{isRTL ? "مفتوحة" : "Open"}</h4>
          <p className="text-2xl font-black text-[#f59e0b] mt-2">{tasks.filter(t => ["pending", "in_progress"].includes(t.status)).length}</p>
        </SectionCard>
        <SectionCard className="p-4 border-[#eeeeee]">
          <h4 className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">{isRTL ? "مكتملة" : "Completed"}</h4>
          <p className="text-2xl font-black text-[#10b981] mt-2">{tasks.filter(t => t.status === "completed").length}</p>
        </SectionCard>
        <SectionCard className="p-4 border-[#eeeeee]">
          <h4 className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">{isRTL ? "النتائج" : "Showing"}</h4>
          <p className="text-2xl font-black text-[#ff5a00] mt-2">{filteredTasks.length}</p>
        </SectionCard>
      </div>

      {/* New Task Form */}
      {showForm && (
        <SectionCard className="border-[#ff5a00] ring-1 ring-[#ff5a00] bg-[#fff1e8]">
          <h3 className={cn("text-lg font-bold text-[#111] mb-4", isRTL && "text-end")}>{isRTL ? "تفاصيل المهمة الجديدة" : "New Task Details"}</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", isRTL && "text-end")}>
              <div>
                <label className="block text-xs font-bold text-[#6b7280] mb-1">{isRTL ? "اسم الموظف *" : "Assign To *"}</label>
                <select disabled={isUploading} value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-[#ffd4b8] outline-none disabled:opacity-50">
                  <option value="">{isRTL ? "اختر موظفاً" : "Select Employee"}</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6b7280] mb-1">{isRTL ? "تاريخ الاستحقاق *" : "Deadline *"}</label>
                <input disabled={isUploading} type="datetime-local" required value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-[#ffd4b8] outline-none disabled:opacity-50" />
              </div>
            </div>
            <div className={isRTL ? "text-end" : "text-start"}>
              <label className="block text-xs font-bold text-[#6b7280] mb-1">{isRTL ? "عنوان المهمة *" : "Task Title *"}</label>
              <input disabled={isUploading} type="text" required dir="auto" placeholder={isRTL ? "مثال: مراجعة الميزانية" : "e.g., Audit Q1 Financials"} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-[#ffd4b8] outline-none disabled:opacity-50" />
            </div>
            <div className={isRTL ? "text-end" : "text-start"}>
              <label className="block text-xs font-bold text-[#6b7280] mb-1">{isRTL ? "تفاصيل إضافية (اختياري)" : "Description (Optional)"}</label>
              <input disabled={isUploading} type="text" dir="auto" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-[#ffd4b8] outline-none disabled:opacity-50" />
            </div>
            <div className={isRTL ? "text-end" : "text-start"}>
              <label className="block text-xs font-bold text-[#6b7280] mb-1">{isRTL ? "مرفقات المهمة (اختياري)" : "Task Attachments (Optional)"}</label>
              <div className="flex flex-col gap-2">
                <input
                  disabled={isUploading}
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size > 2 * 1024 * 1024) {
                      alert(isRTL ? "عذراً، الحد الأقصى لحجم الملف هو ٢ ميجابايت." : "Max file size is 2MB.");
                      e.target.value = ""; return;
                    }
                    setForm({ ...form, file: file || null });
                  }}
                  className={cn("w-full bg-white h-12 px-4 py-2.5 rounded-xl border border-[#ffd4b8] outline-none text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#ff5a00]/10 file:text-[#ff5a00] hover:file:bg-[#ff5a00]/20 max-w-full disabled:opacity-50", isRTL && "file:ml-4 file:mr-0 text-end flex-row-reverse")}
                />
                {!form.file && (
                  <div className="relative">
                    <input disabled={isUploading} type="url" dir="ltr" placeholder="https://" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} className={cn("w-full h-12 px-4 py-2 rounded-xl border border-[#ffd4b8] outline-none text-sm disabled:opacity-50", isRTL && "text-end")} />
                    <div className={cn("absolute top-3 text-[10px] uppercase font-bold text-[#b45309]", isRTL ? "left-4" : "right-4")}>{isRTL ? "أو ضع رابط هنا" : "OR PASTE LINK"}</div>
                  </div>
                )}
              </div>
            </div>
            <div className={cn("flex pt-2", isRTL && "justify-end")}>
              <PrimaryButton type="submit" disabled={isUploading}>
                {isUploading ? (isRTL ? "جاري تعيين المهمة ورفع الملف..." : "Uploading & Assigning...") : (isRTL ? "تعيين وإرسال" : "Assign Task")}
              </PrimaryButton>
            </div>
          </form>
        </SectionCard>
      )}

      {/* ── FILTERS & SEARCH ── */}
      <SectionCard className="border-[#eeeeee] bg-[#f9fafb]">
        <div className="space-y-3">

          {/* Row 1: Search + Employee filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none", isRTL ? "right-3" : "left-3")} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={isRTL ? "ابحث عن مهمة أو موظف..." : "Search tasks or employees..."}
                className={cn("w-full h-10 bg-white border border-[#e0e0e0] rounded-xl text-sm font-medium text-[#111] placeholder:text-[#bbb] outline-none focus:border-[#ff5a00] transition-all", isRTL ? "pr-9 pl-4 text-right" : "pl-9 pr-4")}
                dir="auto"
              />
              {search && (
                <button onClick={() => setSearch("")} className={cn("absolute top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#111]", isRTL ? "left-3" : "right-3")}>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Employee filter */}
            <div className="relative sm:w-52">
              <User className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none", isRTL ? "right-3" : "left-3")} />
              <select
                value={employeeFilter}
                onChange={e => setEmployeeFilter(e.target.value)}
                className={cn("w-full h-10 bg-white border border-[#e0e0e0] rounded-xl text-sm font-medium text-[#111] outline-none focus:border-[#ff5a00] transition-all appearance-none", isRTL ? "pr-9 pl-8 text-right" : "pl-9 pr-8")}
              >
                <option value="all">{isRTL ? "كل الموظفين" : "All Employees"}</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <ChevronDown className={cn("absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af] pointer-events-none", isRTL ? "left-3" : "right-3")} />
            </div>
          </div>

          {/* Row 2: Date preset pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wide flex-shrink-0">{isRTL ? "الفترة:" : "Period:"}</span>
            {datePresets.map(p => (
              <button
                key={p.key}
                onClick={() => setDatePreset(p.key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border whitespace-nowrap",
                  datePreset === p.key
                    ? "bg-[#111] text-white border-[#111]"
                    : "bg-white text-[#6b7280] border-[#e0e0e0] hover:border-[#111] hover:text-[#111]"
                )}
              >
                {isRTL ? p.labelAr : p.label}
              </button>
            ))}
            {hasFilters && (
              <button onClick={clearFilters} className="ms-auto text-[11px] font-bold text-[#ff5a00] hover:text-[#e04f00] flex items-center gap-1 transition-all">
                <X className="w-3 h-3" /> {isRTL ? "إزالة الفلاتر" : "Clear filters"}
              </button>
            )}
          </div>

          {/* Row 3: Custom date range (only when custom is selected) */}
          {datePreset === "custom" && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wide">{isRTL ? "من:" : "From:"}</span>
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="h-9 px-3 bg-white border border-[#e0e0e0] rounded-xl text-sm font-medium outline-none focus:border-[#ff5a00] transition-all"
              />
              <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wide">{isRTL ? "إلى:" : "To:"}</span>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="h-9 px-3 bg-white border border-[#e0e0e0] rounded-xl text-sm font-medium outline-none focus:border-[#ff5a00] transition-all"
              />
            </div>
          )}
        </div>
      </SectionCard>

      {/* Task Table */}
      <SectionCard padding="none" className="overflow-hidden bg-white border border-[#eeeeee]">
        <div className={cn("p-5 border-b border-[#eeeeee] flex items-center justify-between bg-[#f9fafb]", isRTL && "flex-row-reverse")}>
          <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <h3 className="font-bold text-[#111] text-sm">{isRTL ? "سجل المهام" : "Task Board"}</h3>
              <span className="text-[10px] font-bold text-[#9ca3af] bg-white border border-[#e0e0e0] px-2 py-0.5 rounded-full">
                {filteredTasks.length} / {tasks.length}
              </span>
            </div>
            <div className="flex bg-[#e0e0e0] rounded-lg p-0.5">
              <button onClick={() => setViewMode("list")} className={cn("p-1.5 rounded-md transition-all", viewMode === "list" ? "bg-white shadow-sm text-[#111]" : "text-[#6b7280] hover:text-[#111]")}>
                <LayoutList className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setViewMode("calendar")} className={cn("p-1.5 rounded-md transition-all", viewMode === "calendar" ? "bg-white shadow-sm text-[#111]" : "text-[#6b7280] hover:text-[#111]")}>
                <Calendar className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-yellow-100 text-yellow-800">{isRTL ? "قيد الانتظار" : "Pending"}</span>
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-blue-100 text-blue-800">{isRTL ? "قيد التنفيذ" : "In Prog."}</span>
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-green-100 text-green-800">{isRTL ? "مكتمل" : "Completed"}</span>
          </div>
        </div>

        {viewMode === "calendar" && (
          <AdminCalendarView tasks={tasks} isRTL={isRTL} selectedDate={calendarDate} setSelectedDate={setCalendarDate} />
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              <tr className="text-[#6b7280] text-[11px] uppercase tracking-wider border-b border-[#f1f1f1]">
                <th className="px-6 py-4 font-bold text-start w-[20%]">{isRTL ? "الموظف" : "Assignee"}</th>
                <th className="px-6 py-4 font-bold text-start w-[15%]">{isRTL ? "المُوكِل" : "Assigner"}</th>
                <th className="px-6 py-4 font-bold text-start w-[30%]">{isRTL ? "المهمة" : "Task"}</th>
                <th className="px-6 py-4 font-bold text-center w-[15%]">{isRTL ? "تاريخ الاستحقاق" : "Deadline"}</th>
                <th className="px-6 py-4 font-bold text-end w-[20%]">{isRTL ? "الحالة" : "Status"}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="w-5 h-5 border-2 border-[#ff5a00] border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <ListTodo className="w-10 h-10 text-[#d1d5db] mx-auto mb-3" />
                    <p className="text-[#9ca3af] text-sm italic font-medium">
                      {hasFilters
                        ? (isRTL ? "لا توجد نتائج تطابق الفلاتر المحددة." : "No tasks match the selected filters.")
                        : (isRTL ? "لا توجد مهام مسجلة حالياً." : "No tasks assigned yet.")}
                    </p>
                    {hasFilters && (
                      <button onClick={clearFilters} className="mt-3 text-sm font-bold text-[#ff5a00] hover:underline">
                        {isRTL ? "إزالة الفلاتر" : "Clear filters"}
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => (
                  <tr key={t.id} className="border-t border-[#f1f1f1] hover:bg-[#fafafa] transition-colors">
                    <td className="px-6 py-4 text-start">
                      <span className="font-bold text-sm text-[#111]">{t.assigned?.name}</span>
                    </td>
                    <td className="px-6 py-4 text-start">
                      <span className="font-medium text-xs text-[#6b7280]">{t.assigner?.name || (isRTL ? "مدير النظام" : "Admin")}</span>
                    </td>
                    <td className="px-6 py-4 text-start">
                      <div className="flex flex-col items-start gap-1 max-w-sm">
                        <span className="font-bold text-[#111] text-sm">{t.title}</span>
                        {t.description && <span className="text-xs text-[#6b7280] truncate w-full">{t.description}</span>}
                        {t.link && (
                          <a href={t.link} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-[#0284c7] hover:underline flex items-center gap-1 mt-1 bg-[#bae6fd]/30 px-2 py-1 border border-[#bae6fd] rounded">
                            <LinkIcon className="w-3 h-3" /> {isRTL ? "افتح المرفق" : "Attachment"}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-semibold text-[#4b5563] flex items-center justify-center gap-1">
                        <Calendar className="w-3 h-3" /> {t.deadline}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-end">
                      <div className="flex justify-end">
                        {t.status === "completed" && <StatusPill label={isRTL ? "مكتمل" : "Completed"} tone="success" />}
                        {t.status === "pending" && <StatusPill label={isRTL ? "قيد الانتظار" : "Pending"} tone="warning" />}
                        {t.status === "in_progress" && <StatusPill label={isRTL ? "قيد التنفيذ" : "In Progress"} tone="neutral" />}
                        {t.status === "late" && <StatusPill label={isRTL ? "متأخر" : "Late"} tone="danger" />}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
