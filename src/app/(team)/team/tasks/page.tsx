"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useTeam } from "../layout";
import { CheckSquare, Plus, X, Clock, User, Check, Loader2, UserPlus, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "my_tasks" | "assigned_by_me";
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
    if (tab !== "my_tasks") return;
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
    if (s === "in_progress") return "bg-[#fff1e8] text-[#ff5a00]";
    if (s === "completed") return "bg-[#e6f6ec] text-[#1e8e3e]";
    if (s === "late") return "bg-[#fef2f2] text-[#b91c1c]";
    return "bg-[#f1f1f1] text-[#4b5563]";
  };

  const statusLabel = (s: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      pending: { en: "Pending", ar: "معلق" },
      in_progress: { en: "In Progress", ar: "قيد التنفيذ" },
      completed: { en: "Done", ar: "مكتمل" },
      late: { en: "Late", ar: "متأخر" },
    };
    return labels[s]?.[isRTL ? "ar" : "en"] || s;
  };

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ height: isDeleting ? 0 : undefined, transition: isDeleting ? "height 0.28s ease" : undefined }}>

      {/* Action background layers */}
      {tab === "my_tasks" && (
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
      )}

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
          "bg-white rounded-2xl shadow-sm p-4 flex items-start gap-3",
          isDone && "opacity-55",
          tab === "my_tasks" && "cursor-grab active:cursor-grabbing"
        )}
      >
        {/* Checkbox */}
        {tab === "my_tasks" ? (
          <button
            onClick={() => onToggle(task)}
            disabled={!!isActive}
            onPointerDown={(e) => e.stopPropagation()}
            className={cn(
              "flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
              isDone ? "bg-[#1e8e3e] border-[#1e8e3e]" : "border-[#d1d5db] hover:border-[#ff5a00]"
            )}
          >
            {isActive ? <Loader2 className="w-2.5 h-2.5 text-[#ff5a00] animate-spin" /> : isDone ? <Check className="w-3 h-3 text-white" strokeWidth={3} /> : null}
          </button>
        ) : (
          <div className={cn("flex-shrink-0 mt-1.5 w-2 h-2 rounded-full",
            task.status === "completed" ? "bg-[#1e8e3e]" :
            task.status === "in_progress" ? "bg-[#ff5a00]" :
            task.status === "late" ? "bg-[#b91c1c]" : "bg-[#d1d5db]"
          )} />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={cn("text-sm font-bold text-[#111] leading-tight flex-1", isDone && "line-through text-[#9ca3af]")}>
              {task.title}
            </h3>
            {isSelf ? (
              <span className="flex-shrink-0 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#f3f0ff] text-[#7c3aed]">
                {isRTL ? "شخصي" : "Personal"}
              </span>
            ) : (
              <span className={`flex-shrink-0 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${statusStyle(task.status)}`}>
                {statusLabel(task.status)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-[11px] text-[#9ca3af] font-medium">
            {!isSelf && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {tab === "my_tasks"
                  ? `${isRTL ? "من" : "From"}: ${task.assigned_by_name}`
                  : `${isRTL ? "إلى" : "To"}: ${task.assigned_to_name}`}
              </span>
            )}
            {task.deadline && (
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(task.deadline).toLocaleDateString()}</span>
            )}
            {isDone && task.completed_at && (
              <span className="text-[#1e8e3e]">{isRTL ? "أُنجز" : "Done"} {new Date(task.completed_at).toLocaleDateString()}</span>
            )}
          </div>
          {tab === "my_tasks" && task.status === "pending" && !isSelf && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onStart(task.id)}
              disabled={!!isActive}
              className="mt-2 text-[10px] font-bold text-[#ff5a00] bg-[#fff1e8] px-2.5 py-1 rounded-lg hover:bg-[#ffe4d1] transition-all disabled:opacity-50"
            >
              {isRTL ? "بدء" : "Start"}
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
  const [deadline, setDeadline] = useState(task.deadline || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onSave(task.id, title, deadline);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end lg:items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl lg:rounded-2xl w-full max-w-sm p-5 space-y-4 animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-[#1e8e3e]" />
            <h2 className="text-base font-black text-[#111]">{isRTL ? "تعديل المهمة" : "Edit Task"}</h2>
          </div>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-[#111]"><X className="w-5 h-5" /></button>
        </div>
        <div>
          <label className="text-[10px] font-bold text-[#9ca3af] uppercase block mb-1">{isRTL ? "عنوان المهمة" : "Task title"}</label>
          <input
            autoFocus
            type="text"
            value={title}
            dir="auto"
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="w-full border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-sm font-semibold text-[#111] outline-none focus:border-[#1e8e3e]"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-[#9ca3af] uppercase block mb-1">{isRTL ? "الموعد النهائي" : "Deadline"}</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-sm font-semibold text-[#111] outline-none focus:border-[#1e8e3e]"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-[#e0e0e0] text-[#6b7280] font-bold py-2.5 rounded-xl hover:bg-[#f5f5f5] transition-all text-sm">
            {isRTL ? "إلغاء" : "Cancel"}
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="flex-1 bg-[#1e8e3e] text-white font-black py-2.5 rounded-xl hover:bg-[#166d31] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isRTL ? "حفظ" : "Save"}
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

  // Task actions
  const [toggling, setToggling] = useState<string | null>(null);
  const [editTask, setEditTask] = useState<any | null>(null);

  const loadTasks = useCallback(() => {
    fetch("/api/team/tasks")
      .then((r) => r.json())
      .then((data) => {
        setMyTasks(data.tasks || []);
        setAssignedByMe(data.assigned_by_me || []);
        setLoading(false);
      });
  }, []);

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
    if (assignTo) {
      await fetch("/api/team/tasks/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_to: assignTo, title: title.trim(), deadline: deadline || null }),
      });
    } else {
      await fetch("/api/team/tasks/self", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), deadline: deadline || null }),
      });
    }
    setTitle(""); setAssignTo(""); setDeadline(""); setShowAssignPanel(false); setSubmitting(false);
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
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CheckSquare className="w-5 h-5 text-[#ff5a00]" />
        <h1 className="text-lg font-black text-[#111]">{isRTL ? "المهام" : "Tasks"}</h1>
      </div>

      {/* Swipe hint banner */}
      {tab === "my_tasks" && !loading && filteredTasks.length > 0 && (
        <div className="flex items-center justify-between text-[10px] text-[#9ca3af] font-medium px-1">
          <span className="flex items-center gap-1">
            <span className="text-[#1e8e3e]">←</span> {isRTL ? "يمين: تعديل" : "Right: Edit"}
          </span>
          <span className="flex items-center gap-1">
            {isRTL ? "يسار: حذف" : "Left: Delete"} <span className="text-[#ef4444]">→</span>
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-white rounded-full p-1 shadow-sm">
        <button onClick={() => setTab("my_tasks")} className={cn("flex-1 py-1.5 rounded-full text-[11px] font-bold transition-all", tab === "my_tasks" ? "bg-[#ff5a00] text-white" : "text-[#6b7280]")}>
          {isRTL ? "مهامي" : "My Tasks"} ({myTasks.length})
        </button>
        <button onClick={() => setTab("assigned_by_me")} className={cn("flex-1 py-1.5 rounded-full text-[11px] font-bold transition-all", tab === "assigned_by_me" ? "bg-[#ff5a00] text-white" : "text-[#6b7280]")}>
          {isRTL ? "كلفت بها" : "I Assigned"} ({assignedByMe.length})
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button key={f.key} onClick={() => setStatusFilter(f.key)} className={cn("px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border", statusFilter === f.key ? "bg-[#111] text-white border-[#111]" : "bg-white text-[#6b7280] border-[#e0e0e0]")}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Unified Composer */}
      {tab === "my_tasks" && (
        <div className={cn("bg-white rounded-2xl shadow-sm border transition-all duration-200", showAssignPanel ? "border-[#ff5a00] ring-1 ring-[#ff5a00]/20" : "border-dashed border-[#e0e0e0]")}>
          <div className="flex items-center gap-2 px-4 py-3">
            <div className="w-5 h-5 rounded-full border-2 border-[#d1d5db] flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={ensureCoworkers}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder={isRTL ? "أضف مهمة لنفسك..." : "Add a task for yourself..."}
              className="flex-1 text-sm font-medium text-[#111] placeholder:text-[#bbb] outline-none bg-transparent"
              dir="auto"
            />
            <button
              onClick={async () => { await ensureCoworkers(); setShowAssignPanel((v) => !v); if (showAssignPanel) { setAssignTo(""); setDeadline(""); } }}
              className={cn("flex-shrink-0 flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all border", isAssigning ? "bg-[#ff5a00] text-white border-[#ff5a00]" : "bg-white text-[#6b7280] border-[#e0e0e0] hover:border-[#ff5a00] hover:text-[#ff5a00]")}
            >
              <UserPlus className="w-3 h-3" />
              {isAssigning ? (selectedCoworker?.name || (isRTL ? "تعيين" : "Assign")) : (isRTL ? "تكليف" : "Assign")}
            </button>
            <button onClick={handleSubmit} disabled={!title.trim() || submitting} className="w-7 h-7 rounded-lg bg-[#ff5a00] flex items-center justify-center disabled:opacity-30 hover:bg-[#e04f00] transition-all flex-shrink-0">
              {submitting ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Plus className="w-3.5 h-3.5 text-white" />}
            </button>
          </div>
          {showAssignPanel && (
            <div className="px-4 pb-3 border-t border-[#f5f5f5] pt-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
              <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wide">{isRTL ? "تكليف إلى:" : "Assign to:"}</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setAssignTo("")} className={cn("px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all", assignTo === "" ? "bg-[#7c3aed] text-white border-[#7c3aed]" : "bg-white text-[#6b7280] border-[#e0e0e0] hover:border-[#7c3aed] hover:text-[#7c3aed]")}>
                  {isRTL ? "🙋 شخصي" : "🙋 Personal"}
                </button>
                {coworkers.map((c) => (
                  <button key={c.id} onClick={() => setAssignTo(c.id)} className={cn("px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all", assignTo === c.id ? "bg-[#ff5a00] text-white border-[#ff5a00]" : "bg-white text-[#6b7280] border-[#e0e0e0] hover:border-[#ff5a00] hover:text-[#ff5a00]")}>
                    {c.name}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#9ca3af] flex-shrink-0" />
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="flex-1 text-[12px] font-medium text-[#111] outline-none bg-transparent border-b border-[#e0e0e0] focus:border-[#ff5a00] pb-0.5 transition-colors" />
                <span className="text-[10px] text-[#9ca3af] font-medium">{isRTL ? "الموعد (اختياري)" : "Deadline (optional)"}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task List */}
      {loading ? (
        <div className="text-center py-12 text-sm text-[#6b7280]">{isRTL ? "جاري التحميل..." : "Loading..."}</div>
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
        </div>
      )}

      {/* Edit Modal */}
      {editTask && (
        <EditTaskModal task={editTask} isRTL={isRTL} onSave={handleSaveEdit} onClose={() => setEditTask(null)} />
      )}
    </div>
  );
}
