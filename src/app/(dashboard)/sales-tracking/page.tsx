"use client";

import React, { useState, useEffect } from "react";
import { LocateFixed, MapPin, Search, Calendar, Users, Briefcase, Plus, Save, Trash2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

// Supabase generated types conceptually
type Team = { id: string; name: string; leader_id: string | null };
type Field = { id: string; team_id: string; label: string; field_type: string; order_index: number };
type ReportObj = { id: string; employee_name: string; team_name: string; date: string; location_lat: number; location_lng: number; notes: string; values: Record<string, string> };

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
            const { data: emp } = await supabase.from("employees").select("company_id").eq("telegram_user_id", user.id).single();
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
        const [teamsRes, fieldsRes, rawReports] = await Promise.all([
            supabase.from("teams").select("*").eq("company_id", cid),
            supabase.from("custom_fields").select("*, teams!inner(company_id)").eq("teams.company_id", cid),
            supabase.from("reports").select(`
                id, date, location_lat, location_lng, notes, status,
                employees(name), teams(name),
                report_values(field_id, value)
            `).eq("company_id", cid).eq("status", "completed").order("date", { ascending: false }).limit(100)
        ]);

        if (teamsRes.data) setTeams(teamsRes.data);
        if (fieldsRes.data) setFields(fieldsRes.data);

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
                    date: r.date,
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
                <ReportsView reports={reports} fields={fields} />
            )}

            {activeTab === "settings" && isAdmin && (
                <TeamSettingsView companyId={companyId!} initialTeams={teams} initialFields={fields} />
            )}
        </div>
    );
}

// ----------------------------------------------------
// SUB COMPONENTS
// ----------------------------------------------------

function ReportsView({ reports, fields }: { reports: ReportObj[], fields: Field[] }) {
    // Quick summarize all unique fields dynamically based on current reports dataset to create table headers.
    const dynamicFieldIds = Array.from(new Set(reports.flatMap(r => Object.keys(r.values))));

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">أحدث التقارير الميدانية</h3>
                <span className="bg-orange-50 text-[#ff5a00] text-xs font-bold px-3 py-1 rounded-full w-fit">
                    {reports.length} تقارير
                </span>
            </div>
            
            <div className="overflow-x-auto w-full">
                <table className="w-full text-right">
                    <thead>
                        <tr className="bg-[#fafafa] text-gray-500 text-[13px] font-semibold border-b border-gray-100">
                            <th className="px-5 py-4 w-32">التاريخ</th>
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
                        {reports.length === 0 ? (
                            <tr>
                                <td colSpan={6 + dynamicFieldIds.length} className="text-center py-12 text-gray-400">
                                    لا توجد تقارير مدخلة حتى الآن.
                                </td>
                            </tr>
                        ) : reports.map(r => (
                            <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-5 py-3 text-gray-500">{new Date(r.date).toLocaleDateString("en-GB")}</td>
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
    );
}

function TeamSettingsView({ companyId, initialTeams, initialFields }: { companyId: string, initialTeams: Team[], initialFields: Field[] }) {
    const [teams, setTeams] = useState<Team[]>(initialTeams);
    const [fields, setFields] = useState<Field[]>(initialFields);
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

                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
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
                        onFieldsChange={(updated) => setFields(prev => [...prev.filter(f => f.team_id !== team.id), ...updated])}
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

function TeamCard({ team, fields, onFieldsChange }: { team: Team, fields: Field[], onFieldsChange: (f: Field[]) => void }) {
    const [localFields, setLocalFields] = useState<Field[]>(fields);
    const [newLabel, setNewLabel] = useState("");
    const [newType, setNewType] = useState("number"); // number, text

    const handleAddField = async () => {
        if (!newLabel.trim()) return;
        
        try {
            const { data, error } = await supabase.from("custom_fields").insert({
                team_id: team.id,
                label: newLabel,
                field_type: newType,
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
            }
        } catch (err) {
            console.error("Network or Syntax Error adding field:", err);
            alert("حدث خطأ غير متوقع.");
        }
    };

    const handleDeleteField = async (id: string) => {
        await supabase.from("custom_fields").delete().eq("id", id);
        const next = localFields.filter(f => f.id !== id);
        setLocalFields(next);
        onFieldsChange(next);
    };

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-[16px] text-gray-900 drop-shadow-sm">{team.name}</h4>
                <div className="bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold text-gray-500">
                    {localFields.length} حقول مخصصة
                </div>
            </div>

            <div className="bg-[#fafafa] rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-500 font-bold mb-3">نموذج التقرير الميداني (يظهر في التليجرام):</p>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-lg shadow-sm text-sm text-gray-600">
                        <span className="flex items-center gap-2 font-medium">1. إرسال الموقع الجغرافي <MapPin className="w-3.5 h-3.5 text-blue-500"/></span>
                        <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-400">إجباري آلياً</span>
                    </div>

                    {localFields.map((f, i) => (
                        <div key={f.id} className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-lg shadow-sm text-sm">
                            <span className="font-medium text-gray-800 flex items-center gap-2">
                                <span className="text-gray-400 text-xs w-4">{i + 2}.</span> 
                                {f.label}
                                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded ml-2">
                                    {f.field_type === 'number' ? 'رقم' : 'نص'}
                                </span>
                            </span>
                            <button onClick={() => handleDeleteField(f.id)} className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors">
                                <Trash2 className="w-4 h-4"/>
                            </button>
                        </div>
                    ))}

                    <div className="flex items-center justify-between p-2.5 bg-white border border-dashed border-gray-300 rounded-lg text-sm text-gray-400">
                        <input 
                            placeholder="اسم الحقل الجديد (مثال: عدد الزيارات)" 
                            className="bg-transparent border-none outline-none flex-1 font-medium"
                            value={newLabel} onChange={e => setNewLabel(e.target.value)}
                        />
                        <div className="flex items-center gap-2 border-r border-gray-200 pr-2 pb-[1px]">
                            <select className="bg-transparent text-xs outline-none cursor-pointer" value={newType} onChange={e => setNewType(e.target.value)}>
                                <option value="number">رقم</option>
                                <option value="text">نص سريع</option>
                            </select>
                            <button onClick={handleAddField} className="bg-black text-white p-1 rounded-md hover:bg-gray-800 transition-colors">
                                <Plus className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-lg shadow-sm text-sm text-gray-600 relative overflow-hidden mt-1 opacity-70">
                        <div className="absolute inset-0 bg-gray-50/50 mix-blend-multiply pointer-events-none" />
                        <span className="flex items-center gap-2 font-medium">الأخير. ملاحظات التقرير (اختياري)</span>
                        <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-400">نهاية النموذج</span>
                    </div>

                </div>
            </div>
        </div>
    );
}

