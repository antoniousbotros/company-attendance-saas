"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, MapPin, Send, FileText, User } from "lucide-react";

type Tab = "submit" | "my_reports" | "team_reports";

export default function TeamReportsPage() {
  const [tab, setTab] = useState<Tab>("submit");
  const [team, setTeam] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [myReports, setMyReports] = useState<any[]>([]);
  const [teamReports, setTeamReports] = useState<any[]>([]);
  const [reportFields, setReportFields] = useState<any[]>([]);
  const [isLeader, setIsLeader] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
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

  useEffect(() => {
    loadData();
  }, []);

  const captureLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
      },
      () => setLocationLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async () => {
    if (!team) return;
    setSubmitting(true);

    const fv = Object.entries(fieldValues).map(([field_id, value]) => ({
      field_id,
      value,
    }));

    await fetch("/api/team/reports/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        team_id: team.id,
        location_lat: location?.lat,
        location_lng: location?.lng,
        field_values: fv,
        notes: notes || null,
      }),
    });

    setSubmitting(false);
    setSubmitted(true);
    setFieldValues({});
    setNotes("");
    setLocation(null);
    loadData();
  };

  const getFieldLabel = (fieldId: string) => {
    const f = reportFields.find((rf: any) => rf.id === fieldId);
    return f?.label || fieldId;
  };

  const ReportCard = ({ r, showEmployee }: { r: any; showEmployee?: boolean }) => (
    <div className="bg-white rounded-xl border border-[#e0e0e0] p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[#111]">
            {new Date(r.date).toLocaleDateString("en-US", {
              weekday: "short", month: "short", day: "numeric",
            })}
          </p>
          {showEmployee && (
            <p className="text-xs text-[#ff5a00] font-semibold flex items-center gap-1 mt-0.5">
              <User className="w-3 h-3" /> {r.employee_name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {r.location_lat && (
            <a
              href={`https://www.google.com/maps?q=${r.location_lat},${r.location_lng}`}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] font-bold text-[#ff5a00] hover:underline flex items-center gap-0.5"
            >
              <MapPin className="w-3 h-3" /> Map
            </a>
          )}
        </div>
      </div>
      {/* Field values */}
      {r.report_values && r.report_values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {r.report_values.map((v: any, i: number) => (
            <span key={i} className="text-[10px] font-semibold bg-[#f5f5f5] text-[#4b5563] px-2 py-1 rounded">
              {getFieldLabel(v.field_id)}: {v.value}
            </span>
          ))}
        </div>
      )}
      {r.notes && (
        <p className="text-xs text-[#6b7280] italic">{r.notes}</p>
      )}
    </div>
  );

  if (loading) {
    return <div className="text-center py-12 text-sm text-[#6b7280]">Loading...</div>;
  }

  if (!team) {
    return (
      <div className="space-y-5 animate-in fade-in duration-500">
        <h1 className="text-xl font-black text-[#111]">Reports</h1>
        <div className="text-center py-12 text-sm text-[#6b7280]">
          You are not assigned to any team.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-[#ff5a00]" />
        <h1 className="text-xl font-black text-[#111]">Reports</h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-lg border border-[#e0e0e0] p-1">
        <button
          onClick={() => { setTab("submit"); setSubmitted(false); }}
          className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${
            tab === "submit" ? "bg-[#ff5a00] text-white" : "text-[#6b7280]"
          }`}
        >
          Submit
        </button>
        <button
          onClick={() => setTab("my_reports")}
          className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${
            tab === "my_reports" ? "bg-[#ff5a00] text-white" : "text-[#6b7280]"
          }`}
        >
          My Reports
        </button>
        {isLeader && (
          <button
            onClick={() => setTab("team_reports")}
            className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${
              tab === "team_reports" ? "bg-[#ff5a00] text-white" : "text-[#6b7280]"
            }`}
          >
            Team
          </button>
        )}
      </div>

      {/* Submit Tab */}
      {tab === "submit" && (
        <div className="bg-white rounded-xl border border-[#e0e0e0] p-5 space-y-4">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-[#e6f6ec] rounded-full flex items-center justify-center mx-auto mb-3">
                <Send className="w-5 h-5 text-[#1e8e3e]" />
              </div>
              <p className="text-sm font-bold text-[#1e8e3e]">Report submitted!</p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-xs text-[#ff5a00] font-bold mt-3 hover:underline"
              >
                Submit another
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-bold text-[#111] block mb-1.5">Location</label>
                {location ? (
                  <div className="flex items-center gap-2 text-xs text-[#1e8e3e] font-semibold bg-[#e6f6ec] px-3 py-2 rounded-lg">
                    <MapPin className="w-3.5 h-3.5" />
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </div>
                ) : (
                  <button
                    onClick={captureLocation}
                    disabled={locationLoading}
                    className="w-full border border-dashed border-[#e0e0e0] rounded-lg py-3 text-xs font-bold text-[#6b7280] hover:border-[#ff5a00] hover:text-[#ff5a00] transition-all flex items-center justify-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    {locationLoading ? "Getting location..." : "Capture Location"}
                  </button>
                )}
              </div>

              {fields.map((f) => (
                <div key={f.id}>
                  <label className="text-xs font-bold text-[#111] block mb-1.5">{f.label}</label>
                  {f.field_type === "select" ? (
                    <select
                      value={fieldValues[f.id] || ""}
                      onChange={(e) => setFieldValues({ ...fieldValues, [f.id]: e.target.value })}
                      className="w-full border border-[#e0e0e0] rounded-lg px-3 py-2.5 text-sm font-semibold text-[#111] outline-none focus:border-[#ff5a00]"
                    >
                      <option value="">Select</option>
                      {(f.options || []).map((opt: string, i: number) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.field_type === "number" ? "number" : "text"}
                      value={fieldValues[f.id] || ""}
                      onChange={(e) => setFieldValues({ ...fieldValues, [f.id]: e.target.value })}
                      placeholder={f.label}
                      className="w-full border border-[#e0e0e0] rounded-lg px-3 py-2.5 text-sm font-semibold text-[#111] placeholder:text-[#9ca3af] outline-none focus:border-[#ff5a00]"
                    />
                  )}
                </div>
              ))}

              {team.show_notes !== false && (
                <div>
                  <label className="text-xs font-bold text-[#111] block mb-1.5">
                    Notes {team.require_notes ? "(required)" : "(optional)"}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-[#e0e0e0] rounded-lg px-3 py-2.5 text-sm font-semibold text-[#111] placeholder:text-[#9ca3af] outline-none focus:border-[#ff5a00] resize-none"
                    placeholder="Add notes..."
                  />
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-[#ff5a00] text-white font-black py-3 rounded-lg hover:bg-[#e04f00] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </>
          )}
        </div>
      )}

      {/* My Reports Tab */}
      {tab === "my_reports" && (
        <div className="space-y-2">
          {myReports.length === 0 ? (
            <div className="text-center py-12 text-sm text-[#6b7280]">No reports yet.</div>
          ) : (
            myReports.map((r) => <ReportCard key={r.id} r={r} />)
          )}
        </div>
      )}

      {/* Team Reports Tab (leaders only) */}
      {tab === "team_reports" && isLeader && (
        <div className="space-y-2">
          {teamReports.length === 0 ? (
            <div className="text-center py-12 text-sm text-[#6b7280]">No team reports yet.</div>
          ) : (
            teamReports.map((r) => <ReportCard key={r.id} r={r} showEmployee />)
          )}
        </div>
      )}
    </div>
  );
}
