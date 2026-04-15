"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useTeam } from "../layout";
import { CheckSquare, Plus, X, Clock, User, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "my_tasks" | "assigned_by_me";
type StatusFilter = "all" | "pending" | "in_progress" | "completed";

export default function TeamTasksPage() {
  const { isRTL } = useTeam();
  const [tab, setTab] = useState<Tab>("my_tasks");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [assignedByMe, setAssignedByMe] = useState<any[]>([]);
  const [coworkers, setCoworkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [assignTo, setAssignTo] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [personalTask, setPersonalTask] = useState("");
  const [addingPersonal, setAddingPersonal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadTasks = () => {
    fetch("/api/team/tasks")
      .then((r) => r.json())
      .then((data) => {
        setMyTasks(data.tasks || []);
        setAssignedByMe(data.assigned_by_me || []);
        setLoading(false);
      });
  };

  useEffect(() => { loadTasks(); }, []);

  const activeTasks = tab === "my_tasks" ? myTasks : assignedByMe;
  const filteredTasks = useMemo(() => {
    if (statusFilter === "all") return activeTasks;
    return activeTasks.filter((t) => t.status === statusFilter);
  }, [activeTasks, statusFilter]);

  const openAssignModal = async () => {
    setShowAssign(true);
    const res = await fetch("/api/team/tasks/coworkers").then((r) => r.json());
    setCoworkers(res.employees || []);
  };

  const handleAssign = async () => {
    if (!assignTo || !taskTitle) return;
    setSubmitting(true);
    await fetch("/api/team/tasks/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigned_to: assignTo, title: taskTitle, deadline: taskDeadline || null }),
    });
    setShowAssign(false);
    setAssignTo(""); setTaskTitle(""); setTaskDeadline("");
    setSubmitting(false);
    loadTasks();
  };

  const handleAddPersonal = async () => {
    if (!personalTask.trim() || addingPersonal) return;
    setAddingPersonal(true);
    await fetch("/api/team/tasks/self", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: personalTask.trim() }),
    });
    setPersonalTask("");
    setAddingPersonal(false);
    loadTasks();
    inputRef.current?.focus();
  };

  const handleToggle = async (task: any) => {
    if (toggling) return;
    setToggling(task.id);
    const action = task.status === "completed" ? "undo" : "done";
    await fetch("/api/team/tasks/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: task.id, action }),
    });
    setToggling(null);
    loadTasks();
  };

  const handleStart = async (taskId: string) => {
    setToggling(taskId);
    await fetch("/api/team/tasks/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId, action: "start" }),
    });
    setToggling(null);
    loadTasks();
  };

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

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: isRTL ? "الكل" : "All" },
    { key: "pending", label: isRTL ? "معلق" : "Pending" },
    { key: "in_progress", label: isRTL ? "قيد التنفيذ" : "Active" },
    { key: "completed", label: isRTL ? "مكتمل" : "Done" },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-[#ff5a00]" />
          <h1 className="text-lg font-black text-[#111]">{isRTL ? "المهام" : "Tasks"}</h1>
        </div>
        <button
          onClick={openAssignModal}
          className="bg-[#ff5a00] text-white font-bold text-[11px] px-3 py-2 rounded-xl hover:bg-[#e04f00] transition-all flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> {isRTL ? "تكليف" : "Assign"}
        </button>
      </div>

      {/* Main Tabs */}
      <div className="flex bg-white rounded-full p-1 shadow-sm">
        <button
          onClick={() => setTab("my_tasks")}
          className={cn("flex-1 py-1.5 rounded-full text-[11px] font-bold transition-all", tab === "my_tasks" ? "bg-[#ff5a00] text-white" : "text-[#6b7280]")}
        >
          {isRTL ? "مهامي" : "My Tasks"} ({myTasks.length})
        </button>
        <button
          onClick={() => setTab("assigned_by_me")}
          className={cn("flex-1 py-1.5 rounded-full text-[11px] font-bold transition-all", tab === "assigned_by_me" ? "bg-[#ff5a00] text-white" : "text-[#6b7280]")}
        >
          {isRTL ? "كلفت بها" : "I Assigned"} ({assignedByMe.length})
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={cn(
              "px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border",
              statusFilter === f.key ? "bg-[#111] text-white border-[#111]" : "bg-white text-[#6b7280] border-[#e0e0e0]"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Add Personal Task – inline input (My Tasks only) */}
      {tab === "my_tasks" && (
        <div className="flex items-center gap-2 bg-white rounded-2xl shadow-sm px-4 py-3 border border-dashed border-[#e0e0e0]">
          <div className="w-5 h-5 rounded-full border-2 border-[#d1d5db] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={personalTask}
            onChange={(e) => setPersonalTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddPersonal()}
            placeholder={isRTL ? "أضف مهمة لنفسك..." : "Add a task for yourself..."}
            className="flex-1 text-sm font-medium text-[#111] placeholder:text-[#bbb] outline-none bg-transparent"
          />
          <button
            onClick={handleAddPersonal}
            disabled={!personalTask.trim() || addingPersonal}
            className="w-7 h-7 rounded-lg bg-[#ff5a00] flex items-center justify-center disabled:opacity-30 hover:bg-[#e04f00] transition-all flex-shrink-0"
          >
            {addingPersonal ? (
              <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5 text-white" />
            )}
          </button>
        </div>
      )}

      {/* Task List */}
      {loading ? (
        <div className="text-center py-12 text-sm text-[#6b7280]">
          {isRTL ? "جاري التحميل..." : "Loading..."}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-3xl mb-2">🎉</div>
          <p className="text-sm text-[#6b7280] font-medium">
            {isRTL ? "لا توجد مهام" : "No tasks here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((t) => {
            const isDone = t.status === "completed";
            const isSelf = t.is_self;
            const isActive = toggling === t.id;

            return (
              <div
                key={t.id}
                className={cn(
                  "bg-white rounded-2xl shadow-sm p-4 flex items-start gap-3 transition-all duration-200",
                  isDone && "opacity-55"
                )}
              >
                {/* Checkbox (My Tasks tab: togglable. Assigned tab: static status dot) */}
                {tab === "my_tasks" ? (
                  <button
                    onClick={() => handleToggle(t)}
                    disabled={isActive}
                    className={cn(
                      "flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                      isDone
                        ? "bg-[#1e8e3e] border-[#1e8e3e]"
                        : "border-[#d1d5db] hover:border-[#ff5a00] hover:bg-[#fff1e8]"
                    )}
                  >
                    {isActive ? (
                      <Loader2 className="w-2.5 h-2.5 text-[#ff5a00] animate-spin" />
                    ) : isDone ? (
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    ) : null}
                  </button>
                ) : (
                  <div className={cn(
                    "flex-shrink-0 mt-1.5 w-2 h-2 rounded-full",
                    t.status === "completed" ? "bg-[#1e8e3e]" :
                    t.status === "in_progress" ? "bg-[#ff5a00]" :
                    t.status === "late" ? "bg-[#b91c1c]" : "bg-[#d1d5db]"
                  )} />
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className={cn(
                      "text-sm font-bold text-[#111] leading-tight flex-1",
                      isDone && "line-through text-[#9ca3af]"
                    )}>
                      {t.title}
                    </h3>

                    {/* Badge */}
                    {isSelf ? (
                      <span className="flex-shrink-0 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#f3f0ff] text-[#7c3aed]">
                        {isRTL ? "شخصي" : "Personal"}
                      </span>
                    ) : (
                      <span className={`flex-shrink-0 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${statusStyle(t.status)}`}>
                        {statusLabel(t.status)}
                      </span>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-3 text-[11px] text-[#9ca3af] font-medium">
                    {!isSelf && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {tab === "my_tasks"
                          ? `${isRTL ? "من" : "From"}: ${t.assigned_by_name}`
                          : `${isRTL ? "إلى" : "To"}: ${t.assigned_to_name}`}
                      </span>
                    )}
                    {t.deadline && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(t.deadline).toLocaleDateString()}
                      </span>
                    )}
                    {isDone && t.completed_at && (
                      <span className="text-[#1e8e3e]">
                        {isRTL ? "أُنجز" : "Done"} {new Date(t.completed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Start button for assigned pending tasks */}
                  {tab === "my_tasks" && t.status === "pending" && !isSelf && (
                    <button
                      onClick={() => handleStart(t.id)}
                      disabled={isActive}
                      className="mt-2 text-[10px] font-bold text-[#ff5a00] bg-[#fff1e8] px-2.5 py-1 rounded-lg hover:bg-[#ffe4d1] transition-all disabled:opacity-50 flex items-center gap-1"
                    >
                      {isActive ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      {isRTL ? "بدء" : "Start"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Modal */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end lg:items-center justify-center p-4">
          <div className="bg-white rounded-t-2xl lg:rounded-2xl w-full max-w-sm p-5 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-[#111]">{isRTL ? "تكليف مهمة" : "Assign Task"}</h2>
              <button onClick={() => setShowAssign(false)} className="text-[#9ca3af] hover:text-[#111]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#9ca3af] uppercase block mb-1">{isRTL ? "تكليف إلى" : "Assign to"}</label>
              <select
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className="w-full border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-sm font-semibold text-[#111] outline-none focus:border-[#ff5a00]"
              >
                <option value="">{isRTL ? "اختر زميل" : "Select coworker"}</option>
                {coworkers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.department ? `(${c.department})` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#9ca3af] uppercase block mb-1">{isRTL ? "عنوان المهمة" : "Task title"}</label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder={isRTL ? "ما المطلوب؟" : "What needs to be done?"}
                className="w-full border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-sm font-semibold text-[#111] placeholder:text-[#9ca3af] outline-none focus:border-[#ff5a00]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#9ca3af] uppercase block mb-1">{isRTL ? "الموعد النهائي" : "Deadline"}</label>
              <input
                type="date"
                value={taskDeadline}
                onChange={(e) => setTaskDeadline(e.target.value)}
                className="w-full border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-sm font-semibold text-[#111] outline-none focus:border-[#ff5a00]"
              />
            </div>
            <button
              onClick={handleAssign}
              disabled={submitting || !assignTo || !taskTitle}
              className="w-full bg-[#ff5a00] text-white font-black py-3 rounded-xl hover:bg-[#e04f00] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? (isRTL ? "جاري التكليف..." : "Assigning...") : (isRTL ? "تكليف" : "Assign Task")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
