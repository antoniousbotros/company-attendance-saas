"use client";

import React, { useEffect, useState } from "react";
import { CheckSquare, Plus, X, Clock, User } from "lucide-react";

export default function TeamTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [coworkers, setCoworkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [assignTo, setAssignTo] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadTasks = () => {
    fetch("/api/team/tasks")
      .then((r) => r.json())
      .then((data) => {
        setTasks(data.tasks || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadTasks();
  }, []);

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
      body: JSON.stringify({
        assigned_to: assignTo,
        title: taskTitle,
        deadline: taskDeadline || null,
      }),
    });
    setShowAssign(false);
    setAssignTo("");
    setTaskTitle("");
    setTaskDeadline("");
    setSubmitting(false);
    loadTasks();
  };

  const handleUpdate = async (taskId: string, action: "start" | "done") => {
    setUpdating(taskId);
    await fetch("/api/team/tasks/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId, action }),
    });
    setUpdating(null);
    loadTasks();
  };

  const statusColor = (status: string) => {
    if (status === "in_progress") return "bg-[#fff1e8] text-[#ff5a00]";
    if (status === "completed") return "bg-[#e6f6ec] text-[#1e8e3e]";
    return "bg-[#f1f1f1] text-[#4b5563]";
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-[#ff5a00]" />
          <h1 className="text-xl font-black text-[#111]">My Tasks</h1>
        </div>
        <button
          onClick={openAssignModal}
          className="bg-[#ff5a00] text-white font-bold text-xs px-3 py-2 rounded-lg hover:bg-[#e04f00] transition-all flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Assign
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-[#6b7280]">Loading...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-sm text-[#6b7280]">No pending tasks.</div>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl border border-[#e0e0e0] p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-bold text-[#111] flex-1">{t.title}</h3>
                <span
                  className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${statusColor(t.status)}`}
                >
                  {t.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-[#6b7280] font-medium mb-3">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" /> {t.assigned_by_name}
                </span>
                {t.deadline && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(t.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {t.status === "pending" && (
                  <button
                    onClick={() => handleUpdate(t.id, "start")}
                    disabled={updating === t.id}
                    className="text-xs font-bold text-[#ff5a00] bg-[#fff1e8] px-3 py-1.5 rounded-lg hover:bg-[#ffe4d1] transition-all disabled:opacity-50"
                  >
                    Start
                  </button>
                )}
                {(t.status === "pending" || t.status === "in_progress") && (
                  <button
                    onClick={() => handleUpdate(t.id, "done")}
                    disabled={updating === t.id}
                    className="text-xs font-bold text-[#1e8e3e] bg-[#e6f6ec] px-3 py-1.5 rounded-lg hover:bg-[#d0eeda] transition-all disabled:opacity-50"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Task Modal */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end lg:items-center justify-center p-4">
          <div className="bg-white rounded-t-2xl lg:rounded-2xl w-full max-w-sm p-5 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-[#111]">Assign Task</h2>
              <button onClick={() => setShowAssign(false)} className="text-[#9ca3af] hover:text-[#111]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-[#111] block mb-1">Assign to</label>
              <select
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className="w-full border border-[#e0e0e0] rounded-lg px-3 py-2.5 text-sm font-semibold text-[#111] outline-none focus:border-[#ff5a00]"
              >
                <option value="">Select coworker</option>
                {coworkers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.department ? `(${c.department})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#111] block mb-1">Task title</label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full border border-[#e0e0e0] rounded-lg px-3 py-2.5 text-sm font-semibold text-[#111] placeholder:text-[#9ca3af] outline-none focus:border-[#ff5a00]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#111] block mb-1">Deadline (optional)</label>
              <input
                type="date"
                value={taskDeadline}
                onChange={(e) => setTaskDeadline(e.target.value)}
                className="w-full border border-[#e0e0e0] rounded-lg px-3 py-2.5 text-sm font-semibold text-[#111] outline-none focus:border-[#ff5a00]"
              />
            </div>

            <button
              onClick={handleAssign}
              disabled={submitting || !assignTo || !taskTitle}
              className="w-full bg-[#ff5a00] text-white font-black py-3 rounded-lg hover:bg-[#e04f00] transition-all disabled:opacity-50"
            >
              {submitting ? "Assigning..." : "Assign Task"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
