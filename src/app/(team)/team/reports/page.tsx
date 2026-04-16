"use client";

import React, { useEffect, useState } from "react";
import { useTeam } from "../layout";
import { BarChart3, MapPin, Send, User, Download, Camera, Image as ImageIcon } from "lucide-react";
import { cn, compressImageFile } from "@/lib/utils";

type Tab = "submit" | "my_reports" | "team_reports";

export default function TeamReportsPage() {
  const { isRTL, lang } = useTeam();
  const [tab, setTab] = useState<Tab>("submit");
  const [team, setTeam] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [myReports, setMyReports] = useState<any[]>([]);
  const [teamReports, setTeamReports] = useState<any[]>([]);
  const [reportFields, setReportFields] = useState<any[]>([]);
  const [isLeader, setIsLeader] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadData = () => {
    Promise.all([
      fetch("/api/team/reports/fields").then((r) => r.json()),
      fetch("/api/team/reports/history").then((r) => r.json()),
    ]).then(([fieldsRes, historyRes]) => {
      setTeam(fieldsRes.team);
      setFields(fieldsRes.fields || []);
      setMyReports(historyRes.reports || []);
      setReportFields(historyRes.fields || []);
      setIsLeader(historyRes.isLeader || false);
      setTeamReports(historyRes.teamReports || []);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  const fallbackToIP = async () => {
    try {
      const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
      const data = await res.json();
      if (data.latitude && data.longitude) {
        setLocation({ lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) });
        setLocationLoading(false);
        return;
      }
    } catch {}
    setLocationError(isRTL ? "تعذر تحديد الموقع. أدخل الموقع يدوياً." : "Could not detect location.");
    setLocationLoading(false);
  };

  const captureLocation = () => {
    setLocationLoading(true);
    setLocationError("");

    if (!navigator.geolocation) {
      fallbackToIP();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationLoading(false); },
      (err) => {
        if (err.code === 1) {
          // Permission denied — don't fallback, show error
          setLocationError(isRTL
            ? "تم رفض الموقع. فعّل الموقع من إعدادات المتصفح."
            : "Location denied. Enable location in browser settings.");
          setLocationLoading(false);
        } else {
          // Unavailable or timeout — try IP fallback
          fallbackToIP();
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSubmit = async () => {
    if (!team) return;
    setSubmitting(true);
    const fv = Object.entries(fieldValues).map(([field_id, value]) => ({ field_id, value }));
    await fetch("/api/team/reports/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_id: team.id, location_lat: location?.lat, location_lng: location?.lng, field_values: fv, notes: notes || null }),
    });
    setSubmitting(false);
    setSubmitted(true);
    setFieldValues({});
    setNotes("");
    setLocation(null);
    loadData();
  };

  const getFieldLabel = (fieldId: string) => reportFields.find((f: any) => f.id === fieldId)?.label || "";

  const getFieldValue = (report: any, fieldId: string) => {
    const val = report.report_values?.find((v: any) => v.field_id === fieldId);
    return val?.value || "-";
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet(isRTL ? "تقارير الفريق" : "Team Reports", { views: [{ rightToLeft: isRTL }] });

      const cols: any[] = [
        { header: isRTL ? "التاريخ" : "Date", key: "date", width: 15 },
        { header: isRTL ? "الوقت" : "Time", key: "time", width: 12 },
        { header: isRTL ? "الموظف" : "Employee", key: "employee", width: 25 },
      ];
      reportFields.forEach((f) => cols.push({ header: f.label, key: f.id, width: 20 }));
      cols.push({ header: isRTL ? "ملاحظات" : "Notes", key: "notes", width: 30 });
      cols.push({ header: isRTL ? "الموقع" : "Location", key: "location", width: 30 });
      ws.columns = cols;

      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E79" } };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };

      teamReports.forEach((r: any) => {
        const d = new Date(r.created_at);
        const rowData: any = {
          date: d.toLocaleDateString("en-GB"),
          time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
          employee: r.employee_name || "Unknown",
          notes: r.notes || "",
        };
        reportFields.forEach((f) => { rowData[f.id] = getFieldValue(r, f.id); });
        const mapLink = r.location_lat ? `https://www.google.com/maps?q=${r.location_lat},${r.location_lng}` : "";
        const row = ws.addRow(rowData);
        row.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        // Make image URLs clickable links in Excel
        reportFields.forEach((f) => {
          const val = getFieldValue(r, f.id);
          if (val && val.startsWith("http") && /\.(jpg|jpeg|png|webp|gif)/i.test(val)) {
            row.getCell(f.id).value = { text: isRTL ? "عرض الصورة" : "View Image", hyperlink: val } as any;
            row.getCell(f.id).font = { color: { argb: "FF0563C1" }, underline: true };
          }
        });
        if (mapLink) {
          row.getCell("location").value = { text: "View Map", hyperlink: mapLink } as any;
          row.getCell("location").font = { color: { argb: "FF0563C1" }, underline: true };
        } else {
          row.getCell("location").value = "-";
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Team_Reports_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export error:", e);
    }
    setExporting(false);
  };

  if (loading) return <div className="text-center py-12 text-sm text-[#6b7280]">{isRTL ? "جاري التحميل..." : "Loading..."}</div>;

  if (!team) {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <h1 className="text-lg font-black text-[#111]">{isRTL ? "التقارير" : "Reports"}</h1>
        <div className="text-center py-12 text-sm text-[#6b7280]">{isRTL ? "لست منضماً لأي فريق" : "Not assigned to any team."}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-[#ff5a00]" />
        <h1 className="text-lg font-black text-[#111]">{isRTL ? "التقارير" : "Reports"}</h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-full p-1 shadow-sm">
        <button onClick={() => { setTab("submit"); setSubmitted(false); }} className={cn("flex-1 py-1.5 rounded-full text-[11px] font-bold transition-all", tab === "submit" ? "bg-[#ff5a00] text-white" : "text-[#6b7280]")}>
          {isRTL ? "إرسال" : "Submit"}
        </button>
        <button onClick={() => setTab("my_reports")} className={cn("flex-1 py-1.5 rounded-full text-[11px] font-bold transition-all", tab === "my_reports" ? "bg-[#ff5a00] text-white" : "text-[#6b7280]")}>
          {isRTL ? "تقاريري" : "My Reports"}
        </button>
        {isLeader && (
          <button onClick={() => setTab("team_reports")} className={cn("flex-1 py-1.5 rounded-full text-[11px] font-bold transition-all", tab === "team_reports" ? "bg-[#ff5a00] text-white" : "text-[#6b7280]")}>
            {isRTL ? "الفريق" : "Team"}
          </button>
        )}
      </div>

      {/* Submit */}
      {tab === "submit" && (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-[#e6f6ec] rounded-full flex items-center justify-center mx-auto mb-3"><Send className="w-5 h-5 text-[#1e8e3e]" /></div>
              <p className="text-sm font-bold text-[#1e8e3e]">{isRTL ? "تم إرسال التقرير!" : "Report submitted!"}</p>
              <button onClick={() => setSubmitted(false)} className="text-xs text-[#ff5a00] font-bold mt-3 hover:underline">{isRTL ? "إرسال تقرير آخر" : "Submit another"}</button>
            </div>
          ) : (
            <>
              <div>
                <label className="text-[10px] font-bold text-[#9ca3af] uppercase block mb-1.5">{isRTL ? "الموقع" : "Location"}</label>
                {location ? (
                  <div className="flex items-center gap-2 text-xs text-[#1e8e3e] font-semibold bg-[#e6f6ec] px-3 py-2 rounded-xl">
                    <MapPin className="w-3.5 h-3.5" />{location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </div>
                ) : (
                  <>
                    <button onClick={captureLocation} disabled={locationLoading} className="w-full border border-dashed border-[#e0e0e0] rounded-xl py-3 text-xs font-bold text-[#6b7280] hover:border-[#ff5a00] hover:text-[#ff5a00] transition-all flex items-center justify-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />{locationLoading ? (isRTL ? "جاري تحديد الموقع..." : "Getting location...") : (isRTL ? "تحديد الموقع" : "Capture Location")}
                    </button>
                    {locationError && <p className="text-xs text-[#b91c1c] font-semibold mt-2">{locationError}</p>}
                  </>
                )}
              </div>
              {fields.map((f) => (
                <div key={f.id}>
                  <label className="text-[10px] font-bold text-[#9ca3af] uppercase block mb-1.5">{f.label}</label>
                  {f.field_type === "select" ? (
                    <select value={fieldValues[f.id] || ""} onChange={(e) => setFieldValues({ ...fieldValues, [f.id]: e.target.value })} className="w-full border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-sm font-semibold text-[#111] outline-none focus:border-[#ff5a00]">
                      <option value="">{isRTL ? "اختر" : "Select"}</option>
                      {(f.options || []).map((opt: string, i: number) => (<option key={i} value={opt}>{opt}</option>))}
                    </select>
                  ) : f.field_type === "image" ? (
                    <div>
                      {fieldValues[f.id] ? (
                        <div className="relative">
                          <img src={fieldValues[f.id]} alt="" className="w-full h-40 object-cover rounded-xl border border-[#e0e0e0]" />
                          <button onClick={() => setFieldValues({ ...fieldValues, [f.id]: "" })} className="absolute top-2 end-2 bg-white/90 text-[#b91c1c] rounded-lg p-1.5 text-xs font-bold shadow-sm">&times;</button>
                        </div>
                      ) : uploadingField === f.id ? (
                        <div className="flex items-center justify-center py-6 text-xs text-[#6b7280] font-semibold gap-2">
                          <div className="w-4 h-4 border-2 border-[#ff5a00]/20 border-t-[#ff5a00] rounded-full animate-spin" />
                          {isRTL ? "جاري رفع الصورة..." : "Uploading..."}
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-2">
                            <label className="flex-1 border border-dashed border-[#e0e0e0] rounded-xl py-4 text-xs font-bold text-[#6b7280] hover:border-[#ff5a00] hover:text-[#ff5a00] transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                              <Camera className="w-4 h-4" />
                              {isRTL ? "التقاط صورة" : "Take Photo"}
                              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={async (e) => {
                                let file = e.target.files?.[0]; if (!file) return;
                                setUploadingField(f.id); setUploadError("");
                                
                                try {
                                  file = await compressImageFile(file);
                                  const fd = new FormData(); fd.append("image", file);
                                  const res = await fetch("/api/team/reports/upload-image", { method: "POST", body: fd });
                                  const data = await res.json();
                                  if (data.ok) { setFieldValues((prev) => ({ ...prev, [f.id]: data.url })); }
                                  else { setUploadError(data.error || (isRTL ? "فشل رفع الصورة" : "Upload failed")); }
                                } catch (error) { 
                                  console.error(error);
                                  setUploadError(isRTL ? "خطأ في الاتصال" : "Connection error"); 
                                }
                                setUploadingField(null);
                              }} />
                            </label>
                            <label className="flex-1 border border-dashed border-[#e0e0e0] rounded-xl py-4 text-xs font-bold text-[#6b7280] hover:border-[#ff5a00] hover:text-[#ff5a00] transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                              <ImageIcon className="w-4 h-4" />
                              {isRTL ? "رفع صورة" : "Upload"}
                              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                let file = e.target.files?.[0]; if (!file) return;
                                setUploadingField(f.id); setUploadError("");
                                
                                try {
                                  file = await compressImageFile(file);
                                  const fd = new FormData(); fd.append("image", file);
                                  const res = await fetch("/api/team/reports/upload-image", { method: "POST", body: fd });
                                  const data = await res.json();
                                  if (data.ok) { setFieldValues((prev) => ({ ...prev, [f.id]: data.url })); }
                                  else { setUploadError(data.error || (isRTL ? "فشل رفع الصورة" : "Upload failed")); }
                                } catch (error) { 
                                  console.error(error);
                                  setUploadError(isRTL ? "خطأ في الاتصال" : "Connection error"); 
                                }
                                setUploadingField(null);
                              }} />
                            </label>
                          </div>
                          {uploadError && <p className="text-xs text-[#b91c1c] font-semibold mt-2">{uploadError}</p>}
                        </>
                      )}
                    </div>
                  ) : (
                    <input type={f.field_type === "number" ? "number" : "text"} value={fieldValues[f.id] || ""} onChange={(e) => setFieldValues({ ...fieldValues, [f.id]: e.target.value })} placeholder={f.label} className="w-full border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-sm font-semibold text-[#111] placeholder:text-[#9ca3af] outline-none focus:border-[#ff5a00]" />
                  )}
                </div>
              ))}
              {team.show_notes !== false && (
                <div>
                  <label className="text-[10px] font-bold text-[#9ca3af] uppercase block mb-1.5">{isRTL ? "ملاحظات" : "Notes"} {team.require_notes ? `(${isRTL ? "إجباري" : "required"})` : ""}</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-sm font-semibold text-[#111] placeholder:text-[#9ca3af] outline-none focus:border-[#ff5a00] resize-none" placeholder={isRTL ? "أضف ملاحظات..." : "Add notes..."} />
                </div>
              )}
              <button onClick={handleSubmit} disabled={submitting} className="w-full bg-[#ff5a00] text-white font-black py-3 rounded-xl hover:bg-[#e04f00] transition-all disabled:opacity-50">
                {submitting ? (isRTL ? "جاري الإرسال..." : "Submitting...") : (isRTL ? "إرسال التقرير" : "Submit Report")}
              </button>
            </>
          )}
        </div>
      )}

      {/* My Reports */}
      {tab === "my_reports" && (
        <div className="space-y-2">
          {myReports.length === 0 ? (
            <div className="text-center py-12 text-sm text-[#6b7280]">{isRTL ? "لا توجد تقارير" : "No reports yet."}</div>
          ) : myReports.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[#111]">
                  {new Date(r.date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { weekday: "short", month: "short", day: "numeric" })}
                </p>
                {r.location_lat && (
                  <a href={`https://www.google.com/maps?q=${r.location_lat},${r.location_lng}`} target="_blank" rel="noreferrer" className="text-[9px] font-bold text-[#ff5a00] hover:underline flex items-center gap-0.5">
                    <MapPin className="w-3 h-3" /> {isRTL ? "خريطة" : "Map"}
                  </a>
                )}
              </div>
              {r.report_values?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {r.report_values.map((v: any, i: number) => {
                    const isImage = v.value?.startsWith("http") && /\.(jpg|jpeg|png|webp|gif)/i.test(v.value);
                    if (isImage) {
                      return (
                        <a key={i} href={v.value} target="_blank" rel="noreferrer" className="block">
                          <img src={v.value} alt={getFieldLabel(v.field_id)} className="w-16 h-16 object-cover rounded-lg border border-[#e0e0e0]" />
                        </a>
                      );
                    }
                    return <span key={i} className="text-[9px] font-semibold bg-[#f5f5f5] text-[#4b5563] px-2 py-1 rounded-lg">{getFieldLabel(v.field_id)}: {v.value}</span>;
                  })}
                </div>
              )}
              {r.notes && <p className="text-[11px] text-[#6b7280] italic">{r.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Team Reports (Leader) */}
      {tab === "team_reports" && isLeader && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={exportToExcel} disabled={exporting || teamReports.length === 0} className="flex items-center gap-1.5 bg-[#111] text-white font-bold text-[11px] px-4 py-2 rounded-xl hover:bg-[#333] transition-all disabled:opacity-50">
              <Download className="w-3.5 h-3.5" /> {exporting ? (isRTL ? "جاري التصدير..." : "Exporting...") : (isRTL ? "تصدير Excel" : "Export Excel")}
            </button>
          </div>

          {teamReports.length === 0 ? (
            <div className="text-center py-12 text-sm text-[#6b7280]">{isRTL ? "لا توجد تقارير للفريق" : "No team reports."}</div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-start text-sm">
                  <thead className="bg-[#f9fafb] border-b border-[#f0f0f0]">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-bold text-[#6b7280] uppercase text-start">{isRTL ? "التاريخ" : "Date"}</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-[#6b7280] uppercase text-start">{isRTL ? "الموظف" : "Employee"}</th>
                      {reportFields.map((f) => (
                        <th key={f.id} className="px-4 py-3 text-[10px] font-bold text-[#6b7280] uppercase text-start">{f.label}</th>
                      ))}
                      <th className="px-4 py-3 text-[10px] font-bold text-[#6b7280] uppercase text-start">{isRTL ? "ملاحظات" : "Notes"}</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-[#6b7280] uppercase text-start">{isRTL ? "موقع" : "Location"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f0]">
                    {teamReports.map((r) => (
                      <tr key={r.id} className="hover:bg-[#f9fafb] transition-colors">
                        <td className="px-4 py-3 text-xs font-semibold text-[#111] whitespace-nowrap">
                          {new Date(r.date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric" })}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-[#ff5a00] whitespace-nowrap flex items-center gap-1">
                          <User className="w-3 h-3" /> {r.employee_name}
                        </td>
                        {reportFields.map((f) => (
                          <td key={f.id} className="px-4 py-3 text-xs text-[#4b5563]">{(() => {
                            const val = getFieldValue(r, f.id);
                            if (val && val.startsWith("http") && /\.(jpg|jpeg|png|webp|gif)/i.test(val)) {
                              return <a href={val} target="_blank" rel="noreferrer"><img src={val} alt="" className="w-10 h-10 rounded-lg object-cover" /></a>;
                            }
                            return val;
                          })()}</td>
                        ))}
                        <td className="px-4 py-3 text-xs text-[#6b7280] max-w-[120px] truncate">{r.notes || "-"}</td>
                        <td className="px-4 py-3 text-xs">
                          {r.location_lat ? (
                            <a href={`https://www.google.com/maps?q=${r.location_lat},${r.location_lng}`} target="_blank" rel="noreferrer" className="text-[#ff5a00] font-bold hover:underline flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" /> {isRTL ? "عرض" : "View"}
                            </a>
                          ) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
