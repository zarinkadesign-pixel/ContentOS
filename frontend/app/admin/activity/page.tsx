/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/activity/page.tsx
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import AdminLayout from "../_components/AdminLayout";

interface ActivityEntry {
  id:          string;
  user_id:     string;
  email:       string;
  action:      string;
  module:      string;
  ip:          string | null;
  duration_ms: number | null;
  created_at:  string;
}

const ACTION_COLORS: Record<string, string> = {
  generate_content: "text-purple-400",
  login:            "text-green-400",
  logout:           "text-yellow-400",
  register:         "text-blue-400",
};

export default function AdminActivity() {
  const [log, setLog]       = useState<ActivityEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/activity?limit=500");
    if (r.ok) setLog(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter
    ? log.filter(
        (e) =>
          e.email.toLowerCase().includes(filter.toLowerCase()) ||
          e.action.toLowerCase().includes(filter.toLowerCase()) ||
          e.module.toLowerCase().includes(filter.toLowerCase())
      )
    : log;

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Activity Log</h1>
          <button
            onClick={load}
            className="text-sm text-white/40 hover:text-white transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        <input
          type="text"
          placeholder="Filter by email, action, module…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full mb-6 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
        />

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          {loading ? (
            <div className="px-6 py-10 text-center text-white/30 text-sm">Loading…</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 text-xs uppercase border-b border-white/10">
                  <th className="px-5 py-3 text-left">Time</th>
                  <th className="px-5 py-3 text-left">User</th>
                  <th className="px-5 py-3 text-left">Action</th>
                  <th className="px-5 py-3 text-left">Module</th>
                  <th className="px-5 py-3 text-left">IP</th>
                  <th className="px-5 py-3 text-left">Duration</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-t border-white/5 hover:bg-white/3">
                    <td className="px-5 py-3 text-white/40 tabular-nums text-xs whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-white/70 text-xs">{e.email || e.user_id}</td>
                    <td className={`px-5 py-3 text-xs font-medium ${ACTION_COLORS[e.action] ?? "text-white/60"}`}>
                      {e.action}
                    </td>
                    <td className="px-5 py-3 text-white/50 text-xs">{e.module}</td>
                    <td className="px-5 py-3 text-white/30 text-xs tabular-nums">{e.ip ?? "—"}</td>
                    <td className="px-5 py-3 text-white/30 text-xs tabular-nums">
                      {e.duration_ms != null ? `${e.duration_ms}ms` : "—"}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-white/30 text-sm">
                      No activity found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
