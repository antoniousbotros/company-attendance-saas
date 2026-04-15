"use client";

import React, { useEffect, useState } from "react";
import { Megaphone, Clock } from "lucide-react";

export default function TeamAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/team/announcements")
      .then((r) => r.json())
      .then((data) => {
        setAnnouncements(data.announcements || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-[#ff5a00]" />
        <h1 className="text-xl font-black text-[#111]">Announcements</h1>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-[#6b7280]">Loading...</div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12 text-sm text-[#6b7280]">No announcements right now.</div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-xl border border-[#e0e0e0] p-5"
            >
              <h3 className="text-base font-bold text-[#111] mb-2">{a.title}</h3>
              <p className="text-sm text-[#4b5563] leading-relaxed whitespace-pre-wrap">
                {a.message}
              </p>
              <div className="flex items-center gap-1.5 mt-3 text-[10px] text-[#9ca3af] font-medium">
                <Clock className="w-3 h-3" />
                Expires {new Date(a.expire_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
