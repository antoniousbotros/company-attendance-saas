"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useTeam } from "../layout";
import { CheckSquare, Plus, X, Clock, User, Check, Loader2, UserPlus, Trash2, Pencil, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Camera, ImageIcon } from "lucide-react";
import { cn, compressImageFile } from "@/lib/utils";

type Tab = "my_tasks" | "assigned_by_me" | "calendar";
type StatusFilter = "all" | "pending" | "in_progress" | "completed";

// ─── Swipeable Task Card ───────────────────────────────────────────────────────
const SWIPE_TRIGGER = 90;   // px to trigger action
const SWIPE_MAX = 72;       // px peeking distance

function SwipeableTask({
  task,
  tab,
  isRTL,
  toggling,
  onToggle,
  onStart,
  onDelete,
  onEdit,
}: {
  task: any;
  tab: Tab;
  isRTL: boolean;
  toggling: string | null;
  onToggle: (t: any) => void;
  onStart: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (t: any) => void;
}) {
  const [dx, setDx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const SWIPE_RESISTANCE = 0.45; // dampening past threshold

  const clampedDx = (() => {
    if (Math.abs(dx) <= SWIPE_TRIGGER) return dx;
    const overflow = Math.abs(dx) - SWIPE_TRIGGER;
    return (dx > 0 ? 1 : -1) * (SWIPE_TRIGGER + overflow * SWIPE_RESISTANCE);
  })();

  const revealLeft = clampedDx > 20;  // edit (swipe right → show edit on left)
  const revealRight = clampedDx < -20; // delete (swipe left → show delete on right)

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setDx(e.clientX - startX.current);
  };

  const onPointerUp = async () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dx < -SWIPE_TRIGGER) {
      // Snap to delete
      setIsDeleting(true);
      setDx(-300);
      setTimeout(() => {
        onDelete(task.id);
      }, 280);
      return;
    }
    if (dx > SWIPE_TRIGGER) {
      // Trigger edit
      setDx(0);
      onEdit(task);
      return;
    }
    setDx(0);
  };

  const isDone = task.status === "completed";
  const isSelf = task.is_self;
  const isActive = toggling === task.id;

  const statusStyle = (s: string) => {
    if (s === "in_progress") return "bg-primary-soft text-primary";
    if (s === "completed") return "bg-success-soft text-success";
    if (s === "late") return "bg-danger-soft text-danger";
    return "bg-muted text-muted-foreground";
  };

  const statusLabel = (s: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      pending: { en: "Pending", ar: "معلق" },
      in_progress: { en: "Active", ar: "قيد التنفيذ" },
      completed: { en: "Done", ar: "مكتمل" },
      late: { en: "Late", ar: "متأخر" },
    };
    return labels[s]?.[isRTL ? "ar" : "en"] || s;
  };

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ height: isDeleting ? 0 : undefined, transition: isDeleting ? "height 0.28s ease" : undefined }}>

      {/* Action background layers */}
      <>
          {/* Right swipe → Edit (green) */}
          <div className={cn(
            "absolute inset-y-0 left-0 flex items-center px-5 rounded-l-2xl transition-opacity bg-[#1e8e3e]",
            revealLeft ? "opacity-100" : "opacity-0"
          )}>
            <div className="flex flex-col items-center gap-0.5">
              <Pencil className="w-5 h-5 text-white" />
              <span className="text-[9px] font-bold text-white/90 uppercase">{isRTL ? "تعديل" : "Edit"}</span>
            </div>
          </div>

          {/* Left swipe → Delete (red) */}
          <div className={cn(
            "absolute inset-y-0 right-0 flex items-center px-5 rounded-r-2xl transition-opacity bg-[#ef4444]",
            revealRight ? "opacity-100" : "opacity-0"
          )}>
            <div className="flex flex-col items-center gap-0.5">
              <Trash2 className="w-5 h-5 text-white" />
              <span className="text-[9px] font-bold text-white/90 uppercase">{isRTL ? "حذف" : "Delete"}</span>
            </div>
          </div>
        </>

      {/* Card */}
      <div
        ref={cardRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { setIsDragging(false); setDx(0); }}
        style={{
          transform: `translateX(${clampedDx}px)`,
          transition: isDragging ? "none" : "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          touchAction: "pan-y",
          userSelect: "none",
        }}
        className={cn(
          "premium-card p-4 flex items-start gap-4 transition-opacity",
          isDone && "opacity-55",
          "cursor-grab active:cursor-grabbing"
        )}
      >
        {/* Checkbox */}
        {tab === "my_tasks" ? (
          <button
            onClick={() => onToggle(task)}
            disabled={!!isActive}
            onPointerDown={(e) => e.stopPropagation()}
            className={cn(
              "flex-shrink-0 mt-0.5 w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all duration-300",
              isDone ? "bg-success border-success shadow-sm shadow-success/20" : "border-border-strong hover:border-primary"
            )}
          >
            {isActive ? <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" /> : isDone ? <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} /> : null}
          </button>
        ) : (
          <div className={cn("flex-shrink-0 mt-2 w-2 h-2 rounded-full shadow-sm",
            task.status === "completed" ? "bg-success" :
            task.status === "in_progress" ? "bg-primary" :
            task.status === "late" ? "bg-danger" : "bg-muted-foreground"
          )} />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className={cn("text-sm font-black text-foreground leading-tight truncate", isDone && "line-through opacity-50")}>
              {task.title}
              {task.link && <ImageIcon className="w-3.5 h-3.5 text-primary inline-block ms-2 opacity-70" />}
            </h3>
            {isSelf ? (
              <span className="flex-shrink-0 text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                {isRTL ? "شخصي" : "SELF"}
              </span>
            ) : (
              <span className={cn("flex-shrink-0 text-[9px] font-black uppercase px-2 py-1 rounded-lg border", statusStyle(task.status))}>
                {statusLabel(task.status)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground font-bold uppercase tracking-tight">
            {!isSelf && (
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 opacity-60" />
                {tab === "my_tasks"
                  ? `${isRTL ? "من" : "FROM"}: ${task.assigned_by_name}`
                  : `${isRTL ? "إلى" : "TO"}: ${task.assigned_to_name}`}
              </span>
            )}
            {task.deadline && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 opacity-60" />
                {new Date(task.deadline).toLocaleString(isRTL ? "ar-EG" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
          {tab === "my_tasks" && task.status === "pending" && !isSelf && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onStart(task.id)}
              disabled={!!isActive}
              className="mt-3 text-[10px] font-black text-primary bg-primary-soft px-4 py-1.5 rounded-xl hover:bg-primary hover:text-white transition-all disabled:opacity-50 shadow-sm shadow-primary/5 uppercase tracking-widest"
            >
              {isRTL ? "بدء العمل" : "START TASK"}
            </button>
          )}
        </div>
      </div>

      {/* Swipe hint dots — shown only when dragging */}
      {isDragging && tab === "my_tasks" && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
          <div className={cn("w-1 h-1 rounded-full transition-all", clampedDx > 20 ? "bg-[#1e8e3e]" : "bg-[#d1d5db]")} />
          <div className="w-1 h-1 rounded-full bg-[#d1d5db]" />
          <div className={cn("w-1 h-1 rounded-full transition-all", clampedDx < -20 ? "bg-[#ef4444]" : "bg-[#d1d5db]")} />
        </div>
      )}
    </div>
  );
}

// ─── Calendar View ─────────────────────────────────────────────────────────────
function CalendarView({
  tasks,
  isRTL,
  handleToggle,
  handleStart,
  handleDelete,
  setEditTask,
}: {
  tasks: any[];
  isRTL: boolean;
  handleToggle: (t: any) => void;
  handleStart: (id: string) => void;
  handleDelete: (id: string) => void;
  setEditTask: (t: any) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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

  const selectedDayTasks = calendarTasks.filter(t => isSameDay(new Date(t.deadline), selectedDate));

  const weekDaysAr = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
  const weekDaysEn = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const weekDays = isRTL ? weekDaysAr : weekDaysEn;

  return (
    <div className="premium-card p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight">
            {currentDate.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
            {isRTL ? "تصفح مهامك المجدولة" : "BROWSE SCHEDULED TASKS"}
          </p>
        </div>
        <div className="flex gap-2 bg-muted/50 p-1 rounded-xl border border-border/50">
          <button onClick={isRTL ? nextMonth : prevMonth} className="p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={isRTL ? prevMonth : nextMonth} className="p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-muted-foreground hover:text-foreground">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-8">
        {weekDays.map(d => (
          <div key={d} className="text-center text-[9px] font-black text-muted-foreground uppercase tracking-widest py-3">
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
                "aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 group",
                isSelected
                  ? "bg-primary text-white font-black shadow-lg shadow-primary/30 scale-105 z-10"
                  : isToday
                  ? "bg-primary-soft text-primary font-black ring-1 ring-primary/20"
                  : "hover:bg-muted text-foreground/70 font-bold"
              )}
            >
              <span className="text-sm">{day}</span>
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5 mt-1 justify-center">
                  {dayTasks.slice(0, 3).map((t, i) => (
                    <div key={i} className={cn(
                      "w-1 h-1 rounded-full",
                      isSelected ? "bg-white" : t.status === "completed" ? "bg-success" : t.status === "in_progress" ? "bg-primary" : "bg-muted-foreground/40"
                    )} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-6 pt-6 border-t border-border/50">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            {isRTL ? "مهام يوم" : "TASKS FOR"}{" "}
            <span className="text-foreground ml-2">{selectedDate.toLocaleDateString(isRTL ? "ar-EG" : "en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
          </h3>
          <div className="bg-muted px-2 py-1 rounded-lg text-[9px] font-black text-muted-foreground uppercase">
            {selectedDayTasks.length} {isRTL ? "مهام" : "TASKS"}
          </div>
        </div>
        
        {selectedDayTasks.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-3 opacity-40">
            <CalendarIcon className="w-10 h-10 stroke-[1.5]" />
            <p className="text-[10px] font-black uppercase tracking-widest">{isRTL ? "لا توجد مهام" : "No tasks scheduled"}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedDayTasks.map(t => (
              <SwipeableTask
                key={t.id}
                task={t}
                tab="my_tasks"
                isRTL={isRTL}
                toggling={null}
                onToggle={handleToggle}
                onStart={handleStart}
                onDelete={handleDelete}
                onEdit={setEditTask}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────
function EditTaskModal({
  task,
  isRTL,
  onSave,
  onClose,
}: {
  task: any;
  isRTL: boolean;
  onSave: (id: string, title: string, deadline: string) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const initDeadline = task.deadline 
    ? new Date(new Date(task.deadline).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    : "";
  const [deadline, setDeadline] = useState(initDeadline);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onSave(task.id, title, deadline);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div
        className="premium-card w-full max-w-md p-6 md:p-8 space-y-8 animate-in slide-in-from-bottom-8 duration-500 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-success-soft rounded-xl flex items-center justify-center text-success">
              <Pencil className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground tracking-tight">{isRTL ? "تعديل المهمة" : "Edit Task"}</h2>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{isRTL ? "تحديث تفاصيل المهمة" : "UPDATE TASK DETAILS"}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors text-muted-foreground"><X className="w-6 h-6" /></button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">{isRTL ? "عنوان المهمة" : "TASK TITLE"}</label>
            <input
              autoFocus
              type="text"
              value={title}
              dir="auto"
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="w-full bg-muted/50 border border-border/50 rounded-2xl px-4 py-3.5 text-sm font-black text-foreground outline-none focus:border-success/50 focus:bg-white transition-all"
              placeholder={isRTL ? "ما الذي يجب فعله؟" : "What needs to be done?"}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">{isRTL ? "الموعد النهائي" : "DEADLINE"}</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-muted/50 border border-border/50 rounded-2xl px-4 py-3.5 text-sm font-black text-foreground outline-none focus:border-success/50 focus:bg-white transition-all appearance-none"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button 
            onClick={onClose} 
            className="flex-1 h-14 bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-muted-strong hover:text-foreground transition-all"
          >
            {isRTL ? "إلغاء" : "CANCEL"}
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="flex-1 h-14 bg-success text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-success/20 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                {isRTL ? "حفظ التغييرات" : "SAVE CHANGES"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TeamTasksPage() {
  const { isRTL } = useTeam();
  const [tab, setTab] = useState<Tab>("my_tasks");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [assignedByMe, setAssignedByMe] = useState<any[]>([]);
  const [coworkers, setCoworkers] = useState<any[]>([]);
  const [coworkersLoaded, setCoworkersLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Unified composer
  const [title, setTitle] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [deadline, setDeadline] = useState("");
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedFile = await compressImageFile(file);
      setImageFile(compressedFile);
      setImagePreview(URL.createObjectURL(compressedFile));
    } catch (err) {
      console.error(err);
    }
  };

  // Task actions
  const [toggling, setToggling] = useState<string | null>(null);
  const [editTask, setEditTask] = useState<any | null>(null);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const loadTasks = useCallback((all = false) => {
    fetch(`/api/team/tasks${all ? "?all=true" : ""}`)
      .then((r) => r.json())
      .then((data) => {
        setMyTasks(data.tasks || []);
        setAssignedByMe(data.assigned_by_me || []);
        setHasOlder(data.has_older ?? false);
        setLoading(false);
      });
  }, []);

  const loadOlderTasks = () => {
    setLoadingOlder(true);
    fetch("/api/team/tasks?all=true")
      .then((r) => r.json())
      .then((data) => {
        setMyTasks(data.tasks || []);
        setAssignedByMe(data.assigned_by_me || []);
        setHasOlder(false); // all loaded
        setLoadingOlder(false);
      });
  };

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const ensureCoworkers = async () => {
    if (coworkersLoaded) return;
    const res = await fetch("/api/team/tasks/coworkers").then((r) => r.json());
    setCoworkers(res.employees || []);
    setCoworkersLoaded(true);
  };

  const handleSubmit = async () => {
    if (!title.trim() || submitting) return;
    setSubmitting(true);

    let finalLink = "";
    if (imageFile) {
      const formData = new FormData();
      formData.append("image", imageFile);
      try {
        const res = await fetch("/api/team/tasks/upload-image", { method: "POST", body: formData }).then(r => r.json());
        if (res.ok) finalLink = res.url;
      } catch (err) {
        console.error("Upload error", err);
      }
    }

    if (assignTo) {
      await fetch("/api/team/tasks/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_to: assignTo, title: title.trim(), deadline: deadline || null, link: finalLink || null }),
      });
    } else {
      await fetch("/api/team/tasks/self", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), deadline: deadline || null, link: finalLink || null }),
      });
    }
    setTitle(""); setAssignTo(""); setDeadline(""); setShowAssignPanel(false); setSubmitting(false);
    setImageFile(null); setImagePreview(null);
    loadTasks();
    inputRef.current?.focus();
  };

  const handleToggle = async (task: any) => {
    if (toggling) return;
    setToggling(task.id);
    const action = task.status === "completed" ? "undo" : "done";
    await fetch("/api/team/tasks/update", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task_id: task.id, action }) });
    setToggling(null);
    loadTasks();
  };

  const handleStart = async (id: string) => {
    setToggling(id);
    await fetch("/api/team/tasks/update", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task_id: id, action: "start" }) });
    setToggling(null);
    loadTasks();
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/team/tasks/delete", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task_id: id }) });
    loadTasks();
  };

  const handleSaveEdit = async (id: string, newTitle: string, newDeadline: string) => {
    await fetch("/api/team/tasks/edit", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task_id: id, title: newTitle, deadline: newDeadline }) });
    setEditTask(null);
    loadTasks();
  };

  const activeTasks = tab === "my_tasks" ? myTasks : assignedByMe;
  const filteredTasks = useMemo(() => {
    if (statusFilter === "all") return activeTasks;
    return activeTasks.filter((t) => t.status === statusFilter);
  }, [activeTasks, statusFilter]);

  const selectedCoworker = coworkers.find((c) => c.id === assignTo);
  const isAssigning = assignTo !== "";

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: isRTL ? "الكل" : "All" },
    { key: "pending", label: isRTL ? "معلق" : "Pending" },
    { key: "in_progress", label: isRTL ? "قيد التنفيذ" : "Active" },
    { key: "completed", label: isRTL ? "مكتمل" : "Done" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
          <CheckSquare className="w-6 h-6 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">{isRTL ? "إدارة المهام" : "Task Board"}</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{isRTL ? "تابع مهامك اليومية" : "Track your daily activities"}</p>
        </div>
      </div>

      {/* Tabs - Premium Segmented Control */}
      <div className="flex bg-muted/50 backdrop-blur-sm rounded-2xl p-1.5 border border-border/50">
        <button 
          onClick={() => setTab("my_tasks")} 
          className={cn(
            "flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-300", 
            tab === "my_tasks" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {isRTL ? "مهامي" : "MY TASKS"} <span className="opacity-40 ml-1">({myTasks.length})</span>
        </button>
        <button 
          onClick={() => setTab("assigned_by_me")} 
          className={cn(
            "flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-300", 
            tab === "assigned_by_me" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {isRTL ? "مكلف بها" : "DELEGATED"} <span className="opacity-40 ml-1">({assignedByMe.length})</span>
        </button>
        <button 
          onClick={() => setTab("calendar")} 
          className={cn(
            "flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-2", 
            tab === "calendar" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          {isRTL ? "التقويم" : "CALENDAR"}
        </button>
      </div>

      {/* Filters & Hints Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {filters.map((f) => (
            <button 
              key={f.key} 
              onClick={() => setStatusFilter(f.key)} 
              className={cn(
                "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border", 
                statusFilter === f.key 
                  ? "bg-foreground text-white border-foreground" 
                  : "bg-white text-muted-foreground border-border hover:border-muted-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        
        {/* Swipe hint banner */}
        {(tab === "my_tasks" || tab === "assigned_by_me") && !loading && filteredTasks.length > 0 && (
          <div className="flex items-center gap-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
            <span className="flex items-center gap-1">
              <span className="text-success">←</span> {isRTL ? "يمين: تعديل" : "SWIPE RIGHT: EDIT"}
            </span>
            <div className="w-1 h-1 bg-muted-foreground rounded-full" />
            <span className="flex items-center gap-1">
              {isRTL ? "يسار: حذف" : "SWIPE LEFT: DELETE"} <span className="text-danger">→</span>
            </span>
          </div>
        )}
      </div>

      {/* Unified Composer - Redesigned as a Premium Action Card */}
      {tab === "my_tasks" && (
        <div className={cn(
          "premium-card transition-all duration-500 overflow-hidden", 
          showAssignPanel ? "ring-2 ring-primary/20 border-primary/30" : "border-dashed border-border-strong hover:border-primary/50"
        )}>
          <div className="flex items-center gap-3 p-4">
            <div className="relative group">
              {imagePreview ? (
                <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-md ring-2 ring-white">
                  <img src={imagePreview} alt="upload" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => { setImageFile(null); setImagePreview(null); }} 
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-11 h-11 bg-muted rounded-xl flex items-center justify-center text-muted-foreground hover:bg-primary-soft hover:text-primary transition-all duration-300"
                >
                  <Camera className="w-5 h-5" />
                </button>
              )}
              <input type="file" accept="image/*" capture="environment" hidden ref={fileInputRef} onChange={handleImageCapture} />
            </div>

            <div className="flex-1 min-w-0">
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={ensureCoworkers}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder={isRTL ? "ماذا تريد أن تنجز اليوم؟" : "What needs to be done?"}
                className="w-full text-base font-bold text-foreground placeholder:text-muted-foreground/40 outline-none bg-transparent"
                dir="auto"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={async () => { await ensureCoworkers(); setShowAssignPanel((v) => !v); if (showAssignPanel) { setAssignTo(""); setDeadline(""); } }}
                className={cn(
                  "h-10 px-4 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 border", 
                  isAssigning 
                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20" 
                    : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"
                )}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAssigning ? (selectedCoworker?.name || "ASSIGNED") : (isRTL ? "تكليف" : "DELEGATE")}</span>
              </button>

              <button 
                onClick={handleSubmit} 
                disabled={!title.trim() || submitting} 
                className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5 stroke-[3]" />}
              </button>
            </div>
          </div>

          {showAssignPanel && (
            <div className="px-5 pb-5 pt-1 space-y-5 animate-in slide-in-from-top-4 duration-500">
              <div className="h-px bg-border/50" />
              
              <div className="space-y-3">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{isRTL ? "تعيين المهمة إلى:" : "DELEGATE TO:"}</p>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setAssignTo("")} 
                    className={cn(
                      "px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-tight border transition-all duration-300", 
                      assignTo === "" 
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200" 
                        : "bg-white text-muted-foreground border-border hover:border-indigo-600 hover:text-indigo-600"
                    )}
                  >
                    🙋 {isRTL ? "نفسي" : "MYSELF"}
                  </button>
                  {coworkers.map((c) => (
                    <button 
                      key={c.id} 
                      onClick={() => setAssignTo(c.id)} 
                      className={cn(
                        "px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-tight border transition-all duration-300", 
                        assignTo === c.id 
                          ? "bg-primary text-white border-primary shadow-md shadow-primary/20" 
                          : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"
                      )}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-2.5 border border-border/50 transition-within:border-primary/50">
                  <Clock className="w-4 h-4 text-primary" />
                  <input 
                    type="datetime-local" 
                    value={deadline} 
                    onChange={(e) => setDeadline(e.target.value)} 
                    className="flex-1 text-[12px] font-black text-foreground outline-none bg-transparent uppercase" 
                  />
                  <span className="text-[9px] text-muted-foreground font-black uppercase whitespace-nowrap">{isRTL ? "الموعد النهائي" : "DUE DATE"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task List or Calendar */}
      {loading ? (
        <div className="text-center py-12 text-sm text-[#6b7280]">{isRTL ? "جاري التحميل..." : "Loading..."}</div>
      ) : tab === "calendar" ? (
        <CalendarView tasks={[...myTasks, ...assignedByMe]} isRTL={isRTL} handleToggle={handleToggle} handleStart={handleStart} handleDelete={handleDelete} setEditTask={setEditTask} />
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12"><div className="text-3xl mb-2">🎉</div><p className="text-sm text-[#6b7280] font-medium">{isRTL ? "لا توجد مهام" : "No tasks here."}</p></div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((t) => (
            <SwipeableTask
              key={t.id}
              task={t}
              tab={tab}
              isRTL={isRTL}
              toggling={toggling}
              onToggle={handleToggle}
              onStart={handleStart}
              onDelete={handleDelete}
              onEdit={setEditTask}
            />
          ))}

          {/* Load older tasks */}
          {hasOlder && (
            <div className="pt-2 text-center">
              <button
                onClick={loadOlderTasks}
                disabled={loadingOlder}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#e0e0e0] text-[12px] font-bold text-[#6b7280] hover:text-[#111] hover:border-[#111] transition-all disabled:opacity-50"
              >
                {loadingOlder
                  ? <><Loader2 className="w-3 h-3 animate-spin" />{isRTL ? "جاري التحميل..." : "Loading..."}</>
                  : <>{isRTL ? "⏳ عرض المهام الأقدم" : "⏳ Load older tasks"}</>}
              </button>
              <p className="mt-1.5 text-[10px] text-[#bbb]">{isRTL ? "يتم عرض آخر 30 يوماً فقط" : "Showing last 30 days only"}</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editTask && (
        <EditTaskModal task={editTask} isRTL={isRTL} onSave={handleSaveEdit} onClose={() => setEditTask(null)} />
      )}
    </div>
  );
}
