"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { LocateFixed, MapPin, Search, Calendar, Users, Briefcase, Plus, Save, Trash2, ArrowRight, Image as ImageIcon, X, ZoomIn, Download, FileDown, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

// Supabase generated types conceptually
type Team = { id: string; name: string; leader_id: string | null; show_notes?: boolean; require_notes?: boolean; };
type Field = { id: string; team_id: string; label: string; field_type: string; order_index: number; options?: string[] };
type Employee = { id: string; name: string };
type TeamMember = { id: string; team_id: string; employee_id: string; role: string; employee_name?: string };
type ReportObj = { id: string; employee_name: string; team_name: string; team_id?: string; date: string; created_at: string; location_lat: number; location_lng: number; notes: string; values: Record<string, string> };

export default function SalesTrackingPage() {
    const [activeTab, setActiveTab] = useState<"reports"|"settings">("reports");
    const [isLoading, setIsLoading] = useState(true);
    
    // Auth & Role
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    // Data
    const [teams, setTeams] = useState<Team[]>([]);
    const [fields, setFields] = useState<Field[]>([]);
    const [reports, setReports] = useState<ReportObj[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Determine if Admin (Company Owner)
        const { data: company } = await supabase.from("companies").select("id").eq("owner_id", user.id).single();
        if (company) {
            setCompanyId(company.id);
            setIsAdmin(true);
            await fetchAllData(company.id);
        } else {
            // Must be employee leader/member -> fetch from employees
            const { data: emp } = await supabase.from("employees").select("company_id").eq("telegram_user_id", user.id).limit(1).single();
            // Typically web dashboard is for Admin, but if employees can login we fall back
            // Assuming Admin for MVP as requested ("Admin creates teams")
            if (emp) {
               setCompanyId(emp.company_id);
               setIsAdmin(false);
               await fetchAllData(emp.company_id);
            }
        }
        setIsLoading(false);
    };

    const fetchAllData = async (cid: string) => {
        const [teamsRes, fieldsRes, rawReports, employeesRes, membersRes] = await Promise.all([
            supabase.from("teams").select("*").eq("company_id", cid),
            supabase.from("custom_fields").select("*, teams!inner(company_id)").eq("teams.company_id", cid),
            supabase.from("reports").select(`
                id, date, created_at, location_lat, location_lng, notes, status, team_id,
                employees(name), teams(name),
                report_values(field_id, value)
            `).eq("company_id", cid).eq("status", "completed").order("created_at", { ascending: false }).limit(1000),
            supabase.from("employees").select("id, name").eq("company_id", cid),
            supabase.from("team_members").select("id, team_id, employee_id, role, employees!inner(name, company_id)").eq("employees.company_id", cid)
        ]);

        if (teamsRes.data) setTeams(teamsRes.data);
        if (fieldsRes.data) setFields(fieldsRes.data);
        if (employeesRes.data) setEmployees(employeesRes.data);
        if (membersRes.data) {
            const mapped = membersRes.data.map((m: any) => ({
                id: m.id, team_id: m.team_id, employee_id: m.employee_id, role: m.role, employee_name: m.employees?.name
            }));
            setTeamMembers(mapped);
        }

        if (rawReports.data) {
            const formatted = rawReports.data.map((r: any) => {
                const valuesMap: Record<string, string> = {};
                if (r.report_values) {
                   r.report_values.forEach((v: any) => { valuesMap[v.field_id] = v.value; });
                }
                return {
                    id: r.id,
                    employee_name: r.employees?.name || 'Unknown',
                    team_name: r.teams?.name || 'Unknown',
                    team_id: r.team_id,
                    date: r.date,
                    created_at: r.created_at,
                    location_lat: r.location_lat,
                    location_lng: r.location_lng,
                    notes: r.notes || '',
                    values: valuesMap
                };
            });
            setReports(formatted);
        }
    };

    if (isLoading) {
        return <div className="p-8 flex justify-center text-[#ff5a00]"><LocateFixed className="animate-spin w-8 h-8" /></div>;
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto" dir="rtl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-['Tajawal'] text-gray-900 tracking-tight flex items-center gap-2">
                        <LocateFixed className="w-7 h-7 text-[#ff5a00]" />
                        شاشة التقارير الميدانية والمبيعات
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">تتبع نشاط الفرق وزيارات العملاء لحظياً من البوت.</p>
                </div>
            </div>

            {isAdmin && (
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100 max-w-md w-full">
                    <button
                        onClick={() => setActiveTab("reports")}
                        className={cn(
                            "flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200",
                            activeTab === "reports" ? "bg-[#ff5a00] text-white shadow-md" : "text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        سجل التقارير
                    </button>
                    <button
                        onClick={() => setActiveTab("settings")}
                        className={cn(
                            "flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200",
                            activeTab === "settings" ? "bg-black text-white shadow-md" : "text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        إدارة الفرق والنماذج
                    </button>
                </div>
            )}

            {activeTab === "reports" && (
            <ReportsView reports={reports} fields={fields} teams={teams} employees={employees} onReportsChange={setReports} />
            )}

            {activeTab === "settings" && isAdmin && (
                <TeamSettingsView 
                   companyId={companyId!} 
                   initialTeams={teams} 
                   initialFields={fields} 
                   employees={employees}
                   initialMembers={teamMembers}
                />
            )}
        </div>
    );
}

// ----------------------------------------------------
// SUB COMPONENTS
// ----------------------------------------------------

function ReportsView({ reports, fields, teams, employees, onReportsChange }: { reports: ReportObj[], fields: Field[], teams: Team[], employees: Employee[], onReportsChange: (r: ReportObj[]) => void }) {
    const [filterTeam, setFilterTeam] = useState("");
    const [filterEmployee, setFilterEmployee] = useState("");
    const [filterDateFrom, setFilterDateFrom] = useState("");
    const [filterDateTo, setFilterDateTo] = useState("");
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [editingReport, setEditingReport] = useState<ReportObj | null>(null);
    const [deletingReport, setDeletingReport] = useState<ReportObj | null>(null);

    const closeLightbox = useCallback(() => setLightboxUrl(null), []);

    // Close on ESC
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeLightbox(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [closeLightbox]);

    // Group fields by label — fields from different teams with the same label share one column
    const dedupedCols: { label: string; ids: string[]; isImage: boolean }[] = [];
    const allFieldIds = Array.from(new Set(reports.flatMap(r => Object.keys(r.values))));
    allFieldIds.forEach(fid => {
        const field = fields.find(f => f.id === fid);
        const label = field?.label || fid;
        const isImage = field?.field_type === "image";
        const existing = dedupedCols.find(c => c.label === label);
        if (existing) {
            if (!existing.ids.includes(fid)) existing.ids.push(fid);
            if (isImage) existing.isImage = true;
        } else {
            dedupedCols.push({ label, ids: [fid], isImage });
        }
    });

    // Helper: get the first non-empty value from a report for a column group
    const getColValue = (r: ReportObj, col: { ids: string[] }) =>
        col.ids.map(id => r.values[id]).find(v => v && v.trim() !== "") || "";

    const filteredReports = reports.filter(r => {
        if (filterTeam && r.team_id !== filterTeam) return false;
        if (filterEmployee && r.employee_name !== filterEmployee) return false;
        if (filterDateFrom && new Date(r.date) < new Date(filterDateFrom)) return false;
        if (filterDateTo && new Date(r.date) > new Date(filterDateTo)) return false;
        return true;
    });

    const exportToExcel = async () => {
        const ExcelJS = (await import("exceljs")).default;
        const wb = new ExcelJS.Workbook();
        wb.creator = "Yawmy";
        wb.created = new Date();
        const ws = wb.addWorksheet("تقارير ميدانية", { views: [{ rightToLeft: true }] });

        // Resolve dynamic field labels (already deduped by label)
        const dynamicCols = dedupedCols;

        // Build header row
        const headers = [
            "تاريخ التقرير",
            "وقت الإرسال",
            "اسم الموظف",
            "الفريق",
            ...dynamicCols.map(c => c.label),
            "الملاحظات",
            "رابط الموقع",
        ];

        ws.addRow(headers);

        // Style header row
        const headerRow = ws.getRow(1);
        headerRow.eachCell(cell => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF5A00" } };
            cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
            cell.border = {
                top: { style: "thin", color: { argb: "FFDDDDDD" } },
                bottom: { style: "thin", color: { argb: "FFDDDDDD" } },
            };
        });
        headerRow.height = 24;

        // Data rows
        filteredReports.forEach((r, idx) => {
            const mapsLink = r.location_lat
                ? `https://www.google.com/maps?q=${r.location_lat},${r.location_lng}`
                : "—";

            const rowData = [
                new Date(r.date).toLocaleDateString("en-GB"),
                new Date(r.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true }),
                r.employee_name,
                r.team_name,
                ...dynamicCols.map(c => {
                    const val = getColValue(r, c);
                    return c.isImage ? (val ? "✅ تم الرفع" : "—") : (val || "—");
                }),
                r.notes || "—",
                mapsLink,
            ];

            const row = ws.addRow(rowData);
            row.height = 20;

            // Zebra striping
            const bg = idx % 2 === 0 ? "FFFFFFFF" : "FFFFF8F5";
            row.eachCell(cell => {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
                cell.alignment = { vertical: "middle", wrapText: false };
                cell.border = { bottom: { style: "hair", color: { argb: "FFEEEEEE" } } };
            });

            // Make the maps link a hyperlink
            if (r.location_lat) {
                const lastCell = row.getCell(row.cellCount);
                lastCell.value = { text: "عرض على الخريطة", hyperlink: mapsLink };
                lastCell.font = { color: { argb: "FF0070C0" }, underline: true };
            }
        });

        // Auto-fit columns (approximate)
        ws.columns.forEach(col => {
            let maxLen = 10;
            col.eachCell?.({ includeEmpty: true }, cell => {
                const v = cell.value ? String(cell.value) : "";
                if (v.length > maxLen) maxLen = v.length;
            });
            col.width = Math.min(maxLen + 4, 50);
        });

        // Freeze header row
        ws.views = [{ state: "frozen", ySplit: 1, rightToLeft: true }];

        // Download
        const buf = await wb.xlsx.writeBuffer();
        const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const dateStr = new Date().toISOString().slice(0, 10);
        a.download = `تقارير-ميدانية-${dateStr}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDeleteReport = async (id: string) => {
        await supabase.from("reports").delete().eq("id", id);
        onReportsChange(reports.filter(r => r.id !== id));
        setDeletingReport(null);
    };

    const handleSaveEdit = (updated: ReportObj) => {
        onReportsChange(reports.map(r => r.id === updated.id ? updated : r));
        setEditingReport(null);
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs text-gray-500 mb-1">الفريق</label>
                    <select 
                        value={filterTeam} onChange={e => setFilterTeam(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                    >
                        <option value="">الكل</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs text-gray-500 mb-1">الموظف</label>
                    <select 
                        value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                    >
                        <option value="">الكل</option>
                        {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                    </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs text-gray-500 mb-1">من تاريخ</label>
                    <input 
                        type="date" 
                        value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                    />
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs text-gray-500 mb-1">إلى تاريخ</label>
                    <input 
                        type="date" 
                        value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800">أحدث التقارير الميدانية</h3>
                    <div className="flex items-center gap-3">
                        <span className="bg-orange-50 text-[#ff5a00] text-xs font-bold px-3 py-1 rounded-full">
                            {filteredReports.length} تقارير
                        </span>
                        <button
                            onClick={exportToExcel}
                            disabled={filteredReports.length === 0}
                            className="flex items-center gap-2 bg-[#ff5a00] hover:bg-[#e04f00] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95"
                        >
                            <FileDown className="w-4 h-4" />
                            تصدير Excel
                        </button>
                    </div>
                </div>
                
                <div className="overflow-x-auto w-full">
                    <div className="min-w-[700px]">
                        {/* Header row */}
                        <div className="flex items-center bg-[#fafafa] text-gray-500 text-[13px] font-semibold border-b border-gray-100">
                            <div className="px-5 py-4 w-[130px] shrink-0 text-right">التاريخ والوقت</div>
                            <div className="px-5 py-4 w-[160px] shrink-0 text-right">الموظف</div>
                            <div className="px-5 py-4 w-[100px] shrink-0 text-right">الفريق</div>
                            {dedupedCols.map(col => (
                                <div key={col.label} className="px-5 py-4 flex-1 text-right">{col.label}</div>
                            ))}
                            <div className="px-5 py-4 w-[160px] shrink-0 text-right">الملاحظات</div>
                            <div className="px-5 py-4 w-[80px] shrink-0 text-center">الموقع</div>
                        </div>

                        {/* Body rows */}
                        {filteredReports.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">لا توجد تقارير مطابقة.</div>
                        ) : filteredReports.map(r => (
                            <SwipeableRow
                                key={r.id}
                                onEdit={() => setEditingReport(r)}
                                onDelete={() => setDeletingReport(r)}
                            >
                                <div className="flex items-center text-sm font-medium text-gray-700 hover:bg-gray-50/50 transition-colors">
                                    <div className="px-5 py-3 w-[130px] shrink-0 text-gray-500">
                                        <div>{new Date(r.date).toLocaleDateString("en-GB")}</div>
                                        <div className="text-xs text-gray-400 font-mono mt-0.5">{new Date(r.created_at).toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit", hour12: true })}</div>
                                    </div>
                                    <div className="px-5 py-3 w-[160px] shrink-0">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                                                {r.employee_name.charAt(0)}
                                            </div>
                                            <span className="truncate">{r.employee_name}</span>
                                        </div>
                                    </div>
                                    <div className="px-5 py-3 w-[100px] shrink-0">
                                        <span className="px-2 py-1 bg-gray-100 rounded-md text-gray-600 text-[11px]">{r.team_name}</span>
                                    </div>
                                    {dedupedCols.map(col => {
                                        const value = getColValue(r, col);
                                        const isImage = col.isImage || (value.startsWith("https://") && (value.includes(".jpg") || value.includes(".jpeg") || value.includes(".png") || value.includes(".webp") || value.includes(".gif") || value.includes("supabase.co/storage")));
                                        return (
                                            <div key={col.label} className="px-5 py-3 flex-1 text-center bg-blue-50/20">
                                                {isImage && value ? (
                                                    <button
                                                        onClick={() => setLightboxUrl(value)}
                                                        className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#fff1e8] hover:bg-[#ffd4b8] border border-[#ffd4b8] text-[#ff5a00] transition-all hover:scale-105 active:scale-95"
                                                        title="عرض الصورة"
                                                    >
                                                        <ImageIcon className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <span className="text-sm text-gray-700">{value || "-"}</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <div className="px-5 py-3 w-[160px] shrink-0 text-gray-500 truncate" title={r.notes}>{r.notes || "-"}</div>
                                    <div className="px-5 py-3 w-[80px] shrink-0 text-center">
                                        {r.location_lat ? (
                                            <a
                                                href={`https://www.google.com/maps?q=${r.location_lat},${r.location_lng}`}
                                                target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                                title="عرض على الخريطة"
                                            >
                                                <MapPin className="w-4 h-4" />
                                            </a>
                                        ) : <span className="text-gray-300">-</span>}
                                    </div>
                                </div>
                            </SwipeableRow>
                        ))}
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {lightboxUrl && (
                <div
                    className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={closeLightbox}
                >
                    <div
                        className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-90 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                <ImageIcon className="w-4 h-4 text-[#ff5a00]" />
                                عرض الصورة
                            </div>
                            <div className="flex items-center gap-2">
                                <a href={lightboxUrl} download target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ff5a00] bg-[#fff1e8] hover:bg-[#ffd4b8] px-3 py-1.5 rounded-lg transition-all">
                                    <Download className="w-3.5 h-3.5" /> تحميل
                                </a>
                                <button onClick={closeLightbox} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-all">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="p-4 flex items-center justify-center bg-[#f9fafb] min-h-[300px]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={lightboxUrl} alt="صورة التقرير" className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-lg" />
                        </div>
                    </div>
                </div>
            )}
            {/* Edit Modal */}
            {editingReport && (
                <EditReportModal
                    report={editingReport}
                    fields={fields}
                    onClose={() => setEditingReport(null)}
                    onSaved={handleSaveEdit}
                />
            )}

            {/* Delete Confirm */}
            {deletingReport && (
                <DeleteConfirmModal
                    reportDate={deletingReport.date}
                    employeeName={deletingReport.employee_name}
                    onCancel={() => setDeletingReport(null)}
                    onConfirm={() => handleDeleteReport(deletingReport.id)}
                />
            )}
        </div>
    );
}

// ── SwipeableRow ───────────────────────────────────────────────
function SwipeableRow({ children, onEdit, onDelete }: { children: React.ReactNode; onEdit: () => void; onDelete: () => void }) {
    const [offsetX, setOffsetX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startXRef = useRef(0);
    const isDraggingRef = useRef(false);
    const ACTION_W = 80;
    const THRESHOLD = 40;

    const onTouchStart = (e: React.TouchEvent) => {
        startXRef.current = e.touches[0].clientX;
        isDraggingRef.current = true;
        setIsDragging(true);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (!isDraggingRef.current) return;
        const delta = e.touches[0].clientX - startXRef.current;
        setOffsetX(Math.max(-ACTION_W, Math.min(ACTION_W, delta)));
    };

    const onTouchEnd = () => {
        isDraggingRef.current = false;
        setIsDragging(false);
        setOffsetX(prev => Math.abs(prev) >= THRESHOLD ? (prev > 0 ? ACTION_W : -ACTION_W) : 0);
    };

    const close = () => setOffsetX(0);

    return (
        <div className="relative overflow-hidden border-b border-gray-50 last:border-0">
            {/* Edit — swipe right reveals (left side, green) */}
            <div className="absolute left-0 inset-y-0 flex flex-col items-center justify-center gap-0.5 bg-emerald-500 text-white text-[10px] font-bold select-none" style={{ width: ACTION_W }}>
                <Pencil className="w-4 h-4" />
                <span>تعديل</span>
            </div>
            <button className="absolute left-0 inset-y-0 z-10" style={{ width: ACTION_W }} onClick={() => { close(); onEdit(); }} aria-label="edit" />

            {/* Delete — swipe left reveals (right side, red) */}
            <div className="absolute right-0 inset-y-0 flex flex-col items-center justify-center gap-0.5 bg-red-500 text-white text-[10px] font-bold select-none" style={{ width: ACTION_W }}>
                <Trash2 className="w-4 h-4" />
                <span>حذف</span>
            </div>
            <button className="absolute right-0 inset-y-0 z-10" style={{ width: ACTION_W }} onClick={() => { close(); onDelete(); }} aria-label="delete" />

            {/* Sliding content */}
            <div
                className="relative bg-white"
                style={{
                    transform: `translateX(${offsetX}px)`,
                    transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2,0,0.2,1)',
                }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {children}
            </div>
        </div>
    );
}

// ── EditReportModal ────────────────────────────────────────────
function EditReportModal({ report, fields, onClose, onSaved }: { report: ReportObj; fields: Field[]; onClose: () => void; onSaved: (updated: ReportObj) => void }) {
    const [editedValues, setEditedValues] = useState<Record<string, string>>({ ...report.values });
    const [editedNotes, setEditedNotes] = useState(report.notes);
    const [saving, setSaving] = useState(false);

    const editableFields = Object.keys(report.values)
        .map(fid => ({ fid, field: fields.find(f => f.id === fid) }))
        .filter(({ field }) => field && field.field_type !== 'image');

    const handleSave = async () => {
        setSaving(true);
        await Promise.all(
            Object.entries(editedValues).map(([fieldId, value]) =>
                supabase.from('report_values').upsert(
                    { report_id: report.id, field_id: fieldId, value },
                    { onConflict: 'report_id,field_id' }
                )
            )
        );
        await supabase.from('reports').update({ notes: editedNotes }).eq('id', report.id);
        setSaving(false);
        onSaved({ ...report, values: editedValues, notes: editedNotes });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200" onClick={e => e.stopPropagation()} dir="rtl">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2"><Pencil className="w-5 h-5 text-[#ff5a00]" /> تعديل التقرير</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
                </div>
                <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-3 text-sm text-gray-500">
                    <span className="font-semibold text-gray-800">{report.employee_name}</span>
                    <span className="text-gray-300">•</span>
                    <span>{report.team_name}</span>
                    <span className="text-gray-300">•</span>
                    <span>{new Date(report.date).toLocaleDateString('ar-EG')}</span>
                </div>
                <div className="p-5 space-y-4 max-h-[55vh] overflow-y-auto">
                    {editableFields.map(({ fid, field }) => (
                        <div key={fid}>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">{field!.label}</label>
                            {field!.field_type === 'select' && field!.options?.length ? (
                                <select
                                    value={editedValues[fid] || ''}
                                    onChange={e => setEditedValues(prev => ({ ...prev, [fid]: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#ff5a00] transition-all"
                                >
                                    <option value="">اختر...</option>
                                    {field!.options!.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            ) : (
                                <input
                                    type={field!.field_type === 'number' ? 'number' : 'text'}
                                    value={editedValues[fid] || ''}
                                    onChange={e => setEditedValues(prev => ({ ...prev, [fid]: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#ff5a00] focus:ring-2 focus:ring-[#ff5a00]/10 transition-all"
                                />
                            )}
                        </div>
                    ))}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">الملاحظات</label>
                        <textarea
                            value={editedNotes}
                            onChange={e => setEditedNotes(e.target.value)}
                            rows={3}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#ff5a00] focus:ring-2 focus:ring-[#ff5a00]/10 transition-all resize-none"
                        />
                    </div>
                </div>
                <div className="p-5 border-t border-gray-100 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">إلغاء</button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-[#ff5a00] hover:bg-[#e04f00] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        حفظ التعديلات
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── DeleteConfirmModal ─────────────────────────────────────────
function DeleteConfirmModal({ reportDate, employeeName, onCancel, onConfirm }: { reportDate: string; employeeName: string; onCancel: () => void; onConfirm: () => void }) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-4" onClick={onCancel}>
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200" onClick={e => e.stopPropagation()} dir="rtl">
                <div className="p-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-7 h-7 text-red-500" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">حذف التقرير</h3>
                    <p className="text-sm text-gray-500">سيتم حذف تقرير <span className="font-semibold text-gray-800">{employeeName}</span> بتاريخ <span className="font-semibold text-gray-800">{new Date(reportDate).toLocaleDateString('ar-EG')}</span> بشكل نهائي.</p>
                </div>
                <div className="px-5 pb-5 flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">إلغاء</button>
                    <button onClick={onConfirm} className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
                        <Trash2 className="w-4 h-4" /> حذف نهائياً
                    </button>
                </div>
            </div>
        </div>
    );
}

function TeamSettingsView({ companyId, initialTeams, initialFields, employees, initialMembers }: { companyId: string, initialTeams: Team[], initialFields: Field[], employees: Employee[], initialMembers: TeamMember[] }) {
    const [teams, setTeams] = useState<Team[]>(initialTeams);
    const [fields, setFields] = useState<Field[]>(initialFields);
    const [members, setMembers] = useState<TeamMember[]>(initialMembers);
    const [newTeamName, setNewTeamName] = useState("");

    const handleCreateTeam = async () => {
        if (!newTeamName.trim()) return;
        const { data, error } = await supabase.from("teams").insert({ company_id: companyId, name: newTeamName }).select("*").single();
        if (data) {
            setTeams([...teams, data]);
            setNewTeamName("");
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Team Block */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-gray-400"/> فرق العمل</h3>
                    <div className="flex flex-col gap-3">
                        <input 
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#ff5a00] transition-colors" 
                            placeholder="اسم الفريق (مثال: المبيعات الخارجية)" 
                            value={newTeamName} onChange={e => setNewTeamName(e.target.value)}
                        />
                        <button 
                            onClick={handleCreateTeam}
                            className="w-full bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4"/> إضافة فريق
                        </button>
                    </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 hidden">
                    <p className="text-xs text-orange-800 leading-relaxed font-medium">
                        ملاحظة: لتعيين موظفين داخل الفريق، يرجى التوجه إلى شاشة "فريق العمل" واختيار الموظفين وتعديل بياناتهم للانضمام للفرق (قيد التطوير).
                    </p>
                </div>
            </div>

            {/* Teams List & Form Builder */}
            <div className="lg:col-span-2 flex flex-col gap-4">
                {teams.map(team => (
                    <TeamCard 
                        key={team.id} 
                        team={team} 
                        fields={fields.filter(f => f.team_id === team.id)}
                        employees={employees}
                        members={members.filter(m => m.team_id === team.id)} 
                        onFieldsChange={(updated) => setFields(prev => [...prev.filter(f => f.team_id !== team.id), ...updated])}
                        onMembersChange={(updated) => setMembers(prev => [...prev.filter(m => m.team_id !== team.id), ...updated])}
                    />
                ))}
                
                {teams.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 flex flex-col items-center">
                        <Users className="w-12 h-12 text-gray-200 mb-3" />
                        <p>لا توجد فرق عمل حتى الان.</p>
                        <p className="text-sm">أنشئ فريقك الأول للبدء في تجميع التقارير الميدانية.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function TeamCard({ team, fields, employees, members, onFieldsChange, onMembersChange }: { team: Team, fields: Field[], employees: Employee[], members: TeamMember[], onFieldsChange: (f: Field[]) => void, onMembersChange: (m: TeamMember[]) => void }) {
    const [localFields, setLocalFields] = useState<Field[]>(fields);
    const [localMembers, setLocalMembers] = useState<TeamMember[]>(members);
    const [newLabel, setNewLabel] = useState("");
    const [newType, setNewType] = useState("number"); // number, text, select
    const [newOptionsText, setNewOptionsText] = useState("");
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
    const [activeTab, setActiveTab] = useState<"fields"|"members">("fields");
    const [errorMsg, setErrorMsg] = useState("");
    
    // Notes configuration state
    const [showNotes, setShowNotes] = useState(team.show_notes ?? true);
    const [requireNotes, setRequireNotes] = useState(team.require_notes ?? false);

    const handleAddField = async () => {
        setErrorMsg("");
        if (!newLabel.trim()) {
            setErrorMsg("⚠️ يرجى كتابة اسم الحقل المخصص في الجزء العلوي أولاً.");
            return;
        }
        if (newType === 'select' && !newOptionsText.trim()) {
            setErrorMsg("⚠️ يرجى كتابة الخيارات في الجزء السفلي.");
            return;
        }
        
        try {
            const fieldOptions = newType === 'select' ? newOptionsText.split(',').map(s=>s.trim()).filter(Boolean) : [];
            const { data, error } = await supabase.from("custom_fields").insert({
                team_id: team.id,
                label: newLabel,
                field_type: newType,
                options: fieldOptions,
                order_index: localFields.length
            }).select().single();
            
            if (error) {
                console.error("Supabase Error adding field:", error);
                alert("تعذر حفظ الحقل المخصص. تأكد من اتصالك بالإنترنت وأن لديك صلاحية: " + error.message);
                return;
            }
            
            if (data) {
                const next = [...localFields, data];
                setLocalFields(next);
                onFieldsChange(next);
                setNewLabel("");
                setNewOptionsText("");
            }
        } catch (err) {
            console.error("Network or Syntax Error adding field:", err);
            alert("حدث خطأ غير متوقع.");
        }
    };

    const handleDeleteField = async (id: string) => {
        setErrorMsg("");
        await supabase.from("custom_fields").delete().eq("id", id);
        const next = localFields.filter(f => f.id !== id);
        setLocalFields(next);
        onFieldsChange(next);
    };

    const handleToggleNotesFlag = async (key: 'show_notes'|'require_notes', val: boolean) => {
        await supabase.from("teams").update({ [key]: val }).eq("id", team.id);
        if (key === 'show_notes') setShowNotes(val);
        if (key === 'require_notes') setRequireNotes(val);
    };

    const handleAddMember = async () => {
        if (!selectedEmployeeId) return;
        const emp = employees.find(e => e.id === selectedEmployeeId);
        const { data, error } = await supabase.from("team_members").insert({
            team_id: team.id,
            employee_id: selectedEmployeeId,
            role: 'member'
        }).select().single();

        if (error) {
            alert("خطأ أثناء الإضافة: " + error.message);
            return;
        }

        if (data) {
            const newMember = { ...data, employee_name: emp?.name };
            const next = [...localMembers, newMember];
            setLocalMembers(next);
            onMembersChange(next);
            setSelectedEmployeeId("");
        }
    };

    const handleRemoveMember = async (id: string) => {
        await supabase.from("team_members").delete().eq("id", id);
        const next = localMembers.filter(m => m.id !== id);
        setLocalMembers(next);
        onMembersChange(next);
    };

    const handleToggleRole = async (memberId: string, newRole: string) => {
        const { error } = await supabase.from("team_members").update({ role: newRole }).eq("id", memberId);
        if (error) {
            alert("خطأ أثناء تغيير الصلاحية: " + error.message);
            return;
        }
        const next = localMembers.map(m => m.id === memberId ? { ...m, role: newRole } : m);
        setLocalMembers(next);
        onMembersChange(next);
    };

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-[16px] text-gray-900 drop-shadow-sm">{team.name}</h4>
                <div className="flex space-x-reverse space-x-1">
                    <button onClick={() => setActiveTab("fields")} className={cn("px-3 py-1.5 rounded-full text-xs font-semibold transition-colors", activeTab === "fields" ? "bg-[#ff5a00] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}>
                        {localFields.length} حقول مخصصة
                    </button>
                    <button onClick={() => setActiveTab("members")} className={cn("px-3 py-1.5 rounded-full text-xs font-semibold transition-colors", activeTab === "members" ? "bg-[#ff5a00] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}>
                        {localMembers.length} أعضاء
                    </button>
                </div>
            </div>

            <div className="bg-[#fafafa] rounded-xl p-4 border border-gray-100 min-h-[250px]">
                <p className="text-xs text-gray-500 font-bold mb-3">{activeTab === "fields" ? "نموذج التقرير الميداني (يظهر في التليجرام):" : "أعضاء الفريق ومسؤولياتهم:"}</p>
                <div className="flex flex-col gap-2">
                    {activeTab === "fields" && (
                        <>
                            <div className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-lg shadow-sm text-sm text-gray-600">
                                <span className="flex items-center gap-2 font-medium">1. إرسال الموقع الجغرافي <MapPin className="w-3.5 h-3.5 text-blue-500"/></span>
                                <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-400">إجباري آلياً</span>
                            </div>

                            {localFields.map((f, i) => (
                                <div key={f.id} className="flex flex-col gap-1 p-2.5 bg-white border border-gray-200 rounded-lg shadow-sm">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-gray-800 flex items-center gap-2">
                                            <span className="text-gray-400 text-xs w-4">{i + 2}.</span> 
                                            {f.label}
                                            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded ml-2">
                                                {f.field_type === 'number' ? 'رقم' : f.field_type === 'select' ? 'خيارات متعددة' : f.field_type === 'image' ? 'صورة' : 'نص'}
                                            </span>
                                        </span>
                                        <button onClick={() => handleDeleteField(f.id)} className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors">
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                    </div>
                                    {f.field_type === 'select' && f.options && f.options.length > 0 && (
                                        <div className="flex flex-wrap gap-1 pr-8">
                                            {f.options.map(o => (
                                                <span key={o} className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded">{o}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div className="flex flex-col p-2.5 bg-white border border-dashed border-gray-300 rounded-lg text-sm text-gray-400 gap-2 overflow-hidden transition-all duration-300 focus-within:border-[#ff5a00]">
                                <div className="flex items-center gap-2">
                                    <input 
                                        placeholder="اسم الحقل المخصص (مثال: تقييم العميل)" 
                                        className="bg-transparent border-none outline-none flex-1 font-semibold text-gray-900 placeholder:text-gray-300"
                                        value={newLabel} onChange={e => setNewLabel(e.target.value)}
                                        onFocus={() => setErrorMsg("")}
                                    />
                                    <div className="flex items-center gap-2 border-r border-gray-200 pr-2">
                                        <select className="bg-transparent text-xs font-bold text-[#ff5a00] outline-none cursor-pointer" value={newType} onChange={e => setNewType(e.target.value)}>
                                            <option value="text">نص سريع</option>
                                            <option value="number">رقم</option>
                                            <option value="select">خيارات متعددة</option>
                                            <option value="image">صورة</option>
                                        </select>
                                        {newType !== 'select' && (
                                            <button onClick={handleAddField} className="bg-black text-white p-1 rounded-md hover:bg-gray-800 transition-colors" type="button">
                                                <Plus className="w-4 h-4"/>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {newType === 'select' && (
                                    <div className="flex items-center gap-2 border-t border-gray-100 pt-2 pb-1">
                                        <input 
                                            placeholder="اكتب الخيارات هنا وافصل بينها بفاصلة. مثال: مهتم, غير مهتم, مشغول" 
                                            className="bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 outline-none flex-1 font-medium text-[11px] text-gray-800 focus:border-[#ff5a00] transition-colors"
                                            value={newOptionsText} onChange={e => setNewOptionsText(e.target.value)}
                                            onFocus={() => setErrorMsg("")}
                                        />
                                        <button onClick={handleAddField} className="bg-[#ff5a00] text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-[#e04f00] shadow-sm transition-colors" type="button">
                                            إضافة الحقل
                                        </button>
                                    </div>
                                )}
                                {errorMsg && (
                                    <div className="text-red-500 text-[10px] font-bold bg-red-50 p-1.5 rounded-md mt-1 animate-in fade-in zoom-in slide-in-from-top-1">
                                        {errorMsg}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex flex-col gap-2 p-2.5 bg-white border border-gray-200 rounded-lg shadow-sm text-sm text-gray-600 mt-1">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 font-medium">الأخير. ملاحظات التقرير</span>
                                    <div className="flex items-center gap-4 text-xs font-bold">
                                        <label className="flex items-center gap-1.5 cursor-pointer hover:text-black">
                                            <input type="checkbox" className="accent-black" checked={showNotes} onChange={e => handleToggleNotesFlag('show_notes', e.target.checked)} />
                                            إظهار الحقل
                                        </label>
                                        {showNotes && (
                                            <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#ff5a00] text-gray-400">
                                                <input type="checkbox" className="accent-[#ff5a00]" checked={requireNotes} onChange={e => handleToggleNotesFlag('require_notes', e.target.checked)} />
                                                إجباري
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === "members" && (
                        <>
                            <div className="flex gap-2 mb-2">
                                <select 
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#ff5a00]"
                                    value={selectedEmployeeId}
                                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                >
                                    <option value="">-- إختر موظف لإضافته --</option>
                                    {employees.filter(e => !localMembers.find(m => m.employee_id === e.id)).map(e => (
                                        <option key={e.id} value={e.id}>{e.name}</option>
                                    ))}
                                </select>
                                <button type="button" onClick={handleAddMember} disabled={!selectedEmployeeId} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 flex shrink-0 items-center gap-2">
                                    <Plus className="w-4 h-4"/> إضافة
                                </button>
                            </div>

                            {localMembers.length === 0 ? (
                                <div className="text-center py-6 text-gray-400 text-sm">
                                    لا يوجد أعضاء في هذا الفريق.
                                </div>
                            ) : localMembers.map(m => (
                                <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm text-sm gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-orange-50 text-[#ff5a00] flex items-center justify-center font-bold">
                                            {(m.employee_name || '?').charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">{m.employee_name}</div>
                                            <div className="text-xs text-gray-500">{m.role === 'leader' ? 'مشرف الفريق' : 'عضو ميداني'}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-end sm:self-auto">
                                        <button 
                                            type="button"
                                            onClick={() => handleToggleRole(m.id, m.role === 'leader' ? 'member' : 'leader')}
                                            className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-colors", m.role === 'leader' ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100")}
                                        >
                                            {m.role === 'leader' ? 'تجريد الإشراف' : 'تعيين مشرف'}
                                        </button>
                                        <button type="button" onClick={() => handleRemoveMember(m.id)} className="text-red-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors">
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}

