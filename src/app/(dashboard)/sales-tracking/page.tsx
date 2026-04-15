"use client";

import React, { useState, useEffect } from "react";
import { LocateFixed, MapPin, Search, Calendar, Users, Briefcase, Plus, Save, Trash2, ArrowRight } from "lucide-react";
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
                <ReportsView reports={reports} fields={fields} teams={teams} employees={employees} />
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

function ReportsView({ reports, fields, teams, employees }: { reports: ReportObj[], fields: Field[], teams: Team[], employees: Employee[] }) {
    const [filterTeam, setFilterTeam] = useState("");
    const [filterEmployee, setFilterEmployee] = useState("");
    const [filterDateFrom, setFilterDateFrom] = useState("");
    const [filterDateTo, setFilterDateTo] = useState("");

    const dynamicFieldIds = Array.from(new Set(reports.flatMap(r => Object.keys(r.values))));

    const filteredReports = reports.filter(r => {
        if (filterTeam && r.team_id !== filterTeam) return false;
        if (filterEmployee && r.employee_name !== filterEmployee) return false;
        if (filterDateFrom && new Date(r.date) < new Date(filterDateFrom)) return false;
        if (filterDateTo && new Date(r.date) > new Date(filterDateTo)) return false;
        return true;
    });

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
                    <span className="bg-orange-50 text-[#ff5a00] text-xs font-bold px-3 py-1 rounded-full w-fit">
                        {filteredReports.length} تقارير
                    </span>
                </div>
                
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-[#fafafa] text-gray-500 text-[13px] font-semibold border-b border-gray-100">
                                <th className="px-5 py-4 w-32">التاريخ والوقت</th>
                                <th className="px-5 py-4 w-48">الموظف</th>
                                <th className="px-5 py-4 w-32">الفريق</th>
                                {dynamicFieldIds.map(fid => {
                                    const fl = fields.find(f => f.id === fid)?.label || "قيمة ديناميكية";
                                    return <th key={fid} className="px-5 py-4">{fl}</th>
                                })}
                                <th className="px-5 py-4">الملاحظات</th>
                                <th className="px-5 py-4 w-32 text-center">الموقع الجغرافي</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-medium text-gray-700 divide-y divide-gray-50">
                            {filteredReports.length === 0 ? (
                                <tr>
                                    <td colSpan={6 + dynamicFieldIds.length} className="text-center py-12 text-gray-400">
                                        لا توجد تقارير مطابقة.
                                    </td>
                                </tr>
                            ) : filteredReports.map(r => (
                                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-3 text-gray-500">
                                        <div>{new Date(r.date).toLocaleDateString("en-GB")}</div>
                                        <div className="text-xs text-gray-400 font-mono mt-0.5">{new Date(r.created_at).toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit", hour12: true })}</div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                {r.employee_name.charAt(0)}
                                            </div>
                                            {r.employee_name}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className="px-2 py-1 bg-gray-100 rounded-md text-gray-600 text-[11px]">{r.team_name}</span>
                                    </td>
                                    {dynamicFieldIds.map(fid => (
                                        <td key={fid} className="px-5 py-3 bg-blue-50/20">{r.values[fid] || "-"}</td>
                                    ))}
                                    <td className="px-5 py-3 text-gray-500 max-w-[200px] truncate" title={r.notes}>{r.notes || "-"}</td>
                                    <td className="px-5 py-3 text-center">
                                        {r.location_lat ? (
                                            <a 
                                                href={`https://www.google.com/maps?q=${r.location_lat},${r.location_lng}`} 
                                                target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                                title="عرض الموقع على الخريطة"
                                            >
                                                <MapPin className="w-4 h-4" />
                                            </a>
                                        ) : <span className="text-gray-300">-</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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

