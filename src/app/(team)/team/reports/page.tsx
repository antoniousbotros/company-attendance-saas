"use client";

import React, { useEffect, useState } from "react";
import { useTeam } from "../layout";
import { BarChart3, MapPin, Send, User, Download, Camera, Image as ImageIcon, Loader2, AlertTriangle, ChevronDown } from "lucide-react";
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
    // ── Location guard ───────────────────────────────────────────
    if (!location) {
      setLocationError(isRTL ? "⚠️ يجب تحديد الموقع قبل إرسال التقرير." : "⚠️ Location is required before submitting.");
      return;
    }
    setSubmitting(true);
    const fv = Object.entries(fieldValues).map(([field_id, value]) => ({ field_id, value }));
    const res = await fetch("/api/team/reports/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_id: team.id, location_lat: location.lat, location_lng: location.lng, field_values: fv, notes: notes || null }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setLocationError(isRTL ? `❌ ${err.error || 'خطأ في الإرسال. حاول مرة أخرى.'}` : `❌ ${err.error || 'Submission failed. Please try again.'}`);
      return;
    }
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Navigation Tabs ── */}
      <div className="flex bg-muted/50 backdrop-blur-sm rounded-2xl p-1.5 border border-border/50">
        <button 
          onClick={() => { setTab("submit"); setSubmitted(false); }} 
          className={cn(
            "flex-1 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all duration-300", 
            tab === "submit" ? "bg-white text-[#111] shadow-sm ring-1 ring-[#eeeeee]" : "text-[#6b7280] hover:text-[#111]"
          )}
        >
          {isRTL ? "إرسال تقرير" : "NEW REPORT"}
        </button>
        <button 
          onClick={() => setTab("my_reports")} 
          className={cn(
            "flex-1 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all duration-300", 
            tab === "my_reports" ? "bg-white text-[#111] shadow-sm ring-1 ring-[#eeeeee]" : "text-[#6b7280] hover:text-[#111]"
          )}
        >
          {isRTL ? "سجلي" : "MY HISTORY"}
        </button>
        {isLeader && (
          <button 
            onClick={() => setTab("team_reports")} 
            className={cn(
              "flex-1 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all duration-300", 
              tab === "team_reports" ? "bg-white text-[#111] shadow-sm ring-1 ring-[#eeeeee]" : "text-[#6b7280] hover:text-[#111]"
            )}
          >
            {isRTL ? "تقارير الفريق" : "TEAM LOG"}
          </button>
        )}
      </div>

      {/* ── Submission Form ── */}
      {tab === "submit" && (
        <div className="premium-card p-6 md:p-8 space-y-8">
          {submitted ? (
            <div className="text-center py-12 flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-success-soft rounded-full flex items-center justify-center shadow-inner">
                <Send className="w-8 h-8 text-success animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground tracking-tight mb-2">{isRTL ? "تم الإرسال بنجاح!" : "REPORT SENT!"}</h3>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{isRTL ? "شكراً لتوثيق نشاطك اليوم" : "Thank you for your report"}</p>
              </div>
              <button 
                onClick={() => setSubmitted(false)} 
                className="px-8 py-3 bg-[#111] text-white text-[10px] font-black uppercase tracking-widest rounded-md hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                {isRTL ? "إرسال تقرير جديد" : "SUBMIT ANOTHER"}
              </button>
            </div>
          ) : (
            <>
              {/* Location Matrix */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{isRTL ? "موقع النشاط" : "LOCATION CAPTURE"}</label>
                  {location && <span className="text-[9px] font-black text-success uppercase tracking-tighter">VERIFIED</span>}
                </div>
                {location ? (
                  <div className="flex items-center justify-between gap-4 bg-[#fcfcfc] border border-[#eeeeee] p-4 rounded-md group transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-success-soft rounded-md flex items-center justify-center text-success border border-success/10">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-foreground">{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</p>
                        <p className="text-[9px] font-black text-muted-foreground uppercase opacity-60">{isRTL ? "تم تحديد الإحداثيات" : "COORDINATES SECURED"}</p>
                      </div>
                    </div>
                    <button onClick={() => setLocation(null)} className="text-[10px] font-black text-danger hover:underline uppercase tracking-widest">{isRTL ? "تعديل" : "RESET"}</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button 
                      onClick={captureLocation} 
                      disabled={locationLoading} 
                      className="w-full h-24 border-2 border-dashed border-[#eeeeee] rounded-md flex flex-col items-center justify-center gap-2 hover:border-[#ff5a00]/50 hover:bg-[#fff1e8]/30 transition-all group disabled:opacity-50"
                    >
                      {locationLoading ? (
                        <Loader2 className="w-6 h-6 text-[#ff5a00] animate-spin" />
                      ) : (
                        <>
                          <MapPin className="w-6 h-6 text-[#6b7280] group-hover:text-[#ff5a00] transition-colors" />
                          <p className="text-[10px] font-black text-[#6b7280] group-hover:text-[#111] uppercase tracking-widest">{isRTL ? "اضغط لتحديد الموقع" : "CLICK TO CAPTURE LOCATION"}</p>
                        </>
                      )}
                    </button>
                    {locationError && (
                      <div className="bg-danger-soft text-danger p-3 rounded-md text-[10px] font-black border border-danger/10 flex items-center gap-2 uppercase tracking-widest">
                        <AlertTriangle className="w-4 h-4" />
                        {locationError}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dynamic Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {fields.map((f) => (
                  <div key={f.id} className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">{f.label}</label>
                    {f.field_type === "select" ? (
                      <div className="relative group">
                        <select 
                          value={fieldValues[f.id] || ""} 
                          onChange={(e) => setFieldValues({ ...fieldValues, [f.id]: e.target.value })} 
                          className="w-full bg-[#fcfcfc] border border-[#eeeeee] rounded-md px-4 py-3 text-sm font-black text-[#111] outline-none focus:border-[#ff5a00] focus:bg-white transition-all appearance-none"
                        >
                          <option value="">{isRTL ? "اختر من القائمة..." : "Choose Option..."}</option>
                          {(f.options || []).map((opt: string, i: number) => (<option key={i} value={opt}>{opt}</option>))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280] pointer-events-none group-focus-within:text-[#ff5a00]" />
                      </div>
                    ) : f.field_type === "image" ? (
                      <div className="space-y-3">
                        {fieldValues[f.id] ? (
                          <div className="relative group rounded-md overflow-hidden border border-[#eeeeee]">
                            <img src={fieldValues[f.id]} alt="" className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                onClick={() => setFieldValues({ ...fieldValues, [f.id]: "" })} 
                                className="bg-white text-danger font-black px-6 py-2 rounded-md text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
                              >
                                {isRTL ? "إزالة الصورة" : "REMOVE PHOTO"}
                              </button>
                            </div>
                          </div>
                        ) : uploadingField === f.id ? (
                          <div className="h-48 border border-[#eeeeee] bg-[#fcfcfc] rounded-md flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 text-[#ff5a00] animate-spin" />
                            <p className="text-[10px] font-black text-[#6b7280] uppercase tracking-widest animate-pulse">{isRTL ? "جاري المعالجة..." : "PROCESSING IMAGE..."}</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <label className="flex flex-col items-center justify-center gap-2 border border-[#eeeeee] rounded-md py-8 hover:border-[#ff5a00] hover:bg-[#fff1e8] transition-all cursor-pointer group shadow-sm">
                              <Camera className="w-5 h-5 text-[#6b7280] group-hover:text-[#ff5a00] transition-colors" />
                              <span className="text-[10px] font-black text-[#6b7280] group-hover:text-[#111] uppercase tracking-tighter">{isRTL ? "كاميرا" : "CAMERA"}</span>
                              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={async (e) => {
                                let file = e.target.files?.[0]; if (!file) return;
                                setUploadingField(f.id); setUploadError("");
                                try {
                                  file = await compressImageFile(file);
                                  const fd = new FormData(); fd.append("image", file);
                                  const res = await fetch("/api/team/reports/upload-image", { method: "POST", body: fd });
                                  const data = await res.json();
                                  if (data.ok) { setFieldValues((prev) => ({ ...prev, [f.id]: data.url })); }
                                  else { setUploadError(data.error || "Upload failed"); }
                                } catch (error) { setUploadError("Connection error"); }
                                setUploadingField(null);
                              }} />
                            </label>
                            <label className="flex flex-col items-center justify-center gap-2 border border-[#eeeeee] rounded-md py-8 hover:border-[#ff5a00] hover:bg-[#fff1e8] transition-all cursor-pointer group shadow-sm">
                              <ImageIcon className="w-5 h-5 text-[#6b7280] group-hover:text-[#ff5a00] transition-colors" />
                              <span className="text-[10px] font-black text-[#6b7280] group-hover:text-[#111] uppercase tracking-tighter">{isRTL ? "معرض" : "GALLERY"}</span>
                              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                let file = e.target.files?.[0]; if (!file) return;
                                setUploadingField(f.id); setUploadError("");
                                try {
                                  file = await compressImageFile(file);
                                  const fd = new FormData(); fd.append("image", file);
                                  const res = await fetch("/api/team/reports/upload-image", { method: "POST", body: fd });
                                  const data = await res.json();
                                  if (data.ok) { setFieldValues((prev) => ({ ...prev, [f.id]: data.url })); }
                                  else { setUploadError(data.error || "Upload failed"); }
                                } catch (error) { setUploadError("Connection error"); }
                                setUploadingField(null);
                              }} />
                            </label>
                          </div>
                        )}
                        {uploadError && <p className="text-[10px] font-black text-danger uppercase tracking-tighter text-center">{uploadError}</p>}
                      </div>
                    ) : (
                      <input 
                        type={f.field_type === "number" ? "number" : "text"} 
                        value={fieldValues[f.id] || ""} 
                        onChange={(e) => setFieldValues({ ...fieldValues, [f.id]: e.target.value })} 
                        placeholder={f.label} 
                        className="w-full bg-[#fcfcfc] border border-[#eeeeee] rounded-md px-4 py-3 text-sm font-black text-[#111] outline-none focus:border-[#ff5a00] focus:bg-white transition-all" 
                      />
                    )}
                  </div>
                ))}
              </div>

              {team.show_notes !== false && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
                    {isRTL ? "ملاحظات إضافية" : "ADDITIONAL NOTES"} {team.require_notes && <span className="text-danger ml-1">*</span>}
                  </label>
                  <textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    rows={4} 
                    className="w-full bg-[#fcfcfc] border border-[#eeeeee] rounded-md px-4 py-3 text-sm font-black text-[#111] placeholder:text-[#6b7280]/30 outline-none focus:border-[#ff5a00] focus:bg-white transition-all resize-none" 
                    placeholder={isRTL ? "اكتب ملاحظاتك هنا..." : "Provide any extra context..."} 
                  />
                </div>
              )}

              <div className="pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !location}
                  className="w-full h-16 bg-[#ff5a00] text-white text-sm font-black uppercase tracking-[0.2em] rounded-md shadow-lg shadow-[#ff5a00]/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-3 group"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {isRTL ? "جاري الإرسال..." : "SUBMITTING REPORT..."}
                    </>
                  ) : !location ? (
                    <>
                      <MapPin className="w-5 h-5 opacity-40 group-hover:animate-bounce" />
                      {isRTL ? "يرجى تحديد الموقع" : "CAPTURING GPS..."}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 stroke-[2.5]" />
                      {isRTL ? "إرسال التقرير الميداني" : "TRANSMIT FIELD REPORT"}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── My Reports History ── */}
      {tab === "my_reports" && (
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">{isRTL ? "سجل تقاريري" : "MY SUBMISSIONS"}</h3>
          {myReports.length === 0 ? (
            <div className="premium-card py-20 flex flex-col items-center justify-center text-muted-foreground gap-4 border-dashed">
              <Send className="w-12 h-12 opacity-10" />
              <p className="text-[10px] font-black uppercase tracking-widest">{isRTL ? "لا توجد تقارير مرسلة" : "No reports found"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myReports.map((r) => (
                <div key={r.id} className="premium-card p-5 group hover:border-primary/20 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-foreground font-black text-xs">
                        {new Date(r.date).getDate()}
                      </div>
                      <div>
                        <p className="text-[13px] font-black text-foreground">
                          {new Date(r.date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { weekday: "long", month: "short" })}
                        </p>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter opacity-60">
                          {new Date(r.date).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    {r.location_lat && (
                      <a 
                        href={`https://www.google.com/maps?q=${r.location_lat},${r.location_lng}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="h-8 px-3 rounded-md bg-[#fff1e8] text-[#ff5a00] border border-[#ff5a00]/10 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#ff5a00] hover:text-white transition-all shadow-sm"
                      >
                        <MapPin className="w-3 h-3" /> {isRTL ? "الخريطة" : "MAP"}
                      </a>
                    )}
                  </div>

                  {r.report_values?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {r.report_values.map((v: any, i: number) => {
                        const isImage = v.value?.startsWith("http") && /\.(jpg|jpeg|png|webp|gif)/i.test(v.value);
                        if (isImage) {
                          return (
                            <a key={i} href={v.value} target="_blank" rel="noreferrer" className="block relative group/img">
                              <img src={v.value} alt={getFieldLabel(v.field_id)} className="w-16 h-16 object-cover rounded-md border border-[#eeeeee] shadow-sm transition-transform group-hover/img:scale-105" />
                            </a>
                          );
                        }
                        return (
                          <div key={i} className="flex flex-col bg-muted/30 px-3 py-1.5 rounded-xl border border-border/50">
                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter opacity-60">{getFieldLabel(v.field_id)}</span>
                            <span className="text-[11px] font-black text-foreground">{v.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {r.notes && (
                    <div className="bg-[#fcfcfc] p-3 rounded-md border-s-4 border-[#ff5a00]/20 border border-[#eeeeee]">
                      <p className="text-[11px] text-[#6b7280] leading-relaxed italic">{r.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Team Reports (Leader Dashboard) ── */}
      {tab === "team_reports" && isLeader && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">{isRTL ? "إحصائيات الفريق" : "TEAM ANALYTICS"}</h3>
            <button 
              onClick={exportToExcel} 
              disabled={exporting || teamReports.length === 0} 
              className="flex items-center justify-center gap-2 bg-[#111] text-white font-black text-[10px] px-6 py-3 rounded-md hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50 uppercase tracking-widest"
            >
              <Download className="w-4 h-4" /> 
              {exporting ? (isRTL ? "جاري التصدير..." : "EXPORTING...") : (isRTL ? "تصدير EXCEL" : "EXPORT EXCEL")}
            </button>
          </div>

          {teamReports.length === 0 ? (
            <div className="premium-card py-20 flex flex-col items-center justify-center text-muted-foreground gap-4 border-dashed">
              <User className="w-12 h-12 opacity-10" />
              <p className="text-[10px] font-black uppercase tracking-widest">{isRTL ? "لا توجد تقارير للفريق حالياً" : "No team reports found"}</p>
            </div>
          ) : (
            <div className="premium-card overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-start">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/50">
                      <th className="px-6 py-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest text-start">{isRTL ? "التاريخ" : "DATE"}</th>
                      <th className="px-6 py-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest text-start">{isRTL ? "الموظف" : "MEMBER"}</th>
                      {reportFields.map((f) => (
                        <th key={f.id} className="px-6 py-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest text-start">{f.label}</th>
                      ))}
                      <th className="px-6 py-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest text-start">{isRTL ? "ملاحظات" : "NOTES"}</th>
                      <th className="px-6 py-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest text-start">{isRTL ? "GPS" : "GPS"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {teamReports.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs font-black text-foreground">
                            {new Date(r.date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric" })}
                          </span>
                          <p className="text-[9px] font-black text-muted-foreground uppercase opacity-40">
                            {new Date(r.date).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-[#ff5a00]/10 rounded-md flex items-center justify-center text-[#ff5a00] border border-[#ff5a00]/10">
                              <User className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-black text-foreground">{r.employee_name}</span>
                          </div>
                        </td>
                        {reportFields.map((f) => (
                          <td key={f.id} className="px-6 py-4">
                            {(() => {
                              const val = getFieldValue(r, f.id);
                              if (val && val.startsWith("http") && /\.(jpg|jpeg|png|webp|gif)/i.test(val)) {
                                return (
                                  <a href={val} target="_blank" rel="noreferrer" className="block w-10 h-10 rounded-md overflow-hidden border border-[#eeeeee] hover:scale-110 transition-transform">
                                    <img src={val} alt="" className="w-full h-full object-cover" />
                                  </a>
                                );
                              }
                              return <span className="text-xs font-bold text-foreground/80">{val}</span>;
                            })()}
                          </td>
                        ))}
                        <td className="px-6 py-4">
                          <p className="text-xs text-muted-foreground max-w-[150px] truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                            {r.notes || <span className="opacity-30 italic">No notes</span>}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {r.location_lat ? (
                            <a 
                              href={`https://www.google.com/maps?q=${r.location_lat},${r.location_lng}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="w-8 h-8 rounded-md bg-[#f5f5f5] flex items-center justify-center text-[#ff5a00] border border-[#eeeeee] hover:bg-[#ff5a00] hover:text-white transition-all shadow-sm"
                            >
                              <MapPin className="w-4 h-4" />
                            </a>
                          ) : <span className="text-muted-foreground opacity-30">—</span>}
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
