/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/page.tsx
 */
"use client";

import { useEffect, useState } from "react";
import AdminLayout from "./_components/AdminLayout";

interface Stats {
  total_users:        number;
  paid_users:         number;
  active_today:       number;
  total_generations:  number;
  generations_today:  number;
  recent_activity:    Array<{
    id: string;
    email: string;
    action: string;
    module: string;
    created_at: string;
  }>;
}

const CARDS = [
  { key: "total_users",       label: "Total Users",         color: "text-blue-400"   },
  { key: "paid_users",        label: "Paid Users",          color: "text-green-400"  },
  { key: "active_today",      label: "Active Today",        color: "text-yellow-400" },
  { key: "total_generations", label: "Total Generations",   color: "text-purple-400" },
  { key: "generations_today", label: "Generations Today",   color: "text-pink-400"   },
] as const;

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setStats(d);
      })
      .catch(() => setError("Failed to load stats"));
  }, []);

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
          {CARDS.map(({ key, label, color }) => (
            <div
              key={key}
              className="bg-white/5 border border-white/10 rounded-xl p-5"
            >
              <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">{label}</p>
              <p className={`text-3xl font-bold ${color}`}>
                {stats ? (stats[key] as number) : "—"}
              </p>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white/80">Recent Activity</h2>
          </div>
          {!stats ? (
            <div className="px-6 py-8 text-center text-white/30 text-sm">Loading…</div>
          ) : stats.recent_activity.length === 0 ? (
            <div className="px-6 py-8 text-center text-white/30 text-sm">No activity yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 text-xs uppercase">
                  <th className="px-6 py-3 text-left">User</th>
                  <th className="px-6 py-3 text-left">Action</th>
                  <th className="px-6 py-3 text-left">Module</th>
                  <th className="px-6 py-3 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_activity.map((e) => (
                  <tr key={e.id} className="border-t border-white/5 hover:bg-white/3">
                    <td className="px-6 py-3 text-white/70">{e.email || "—"}</td>
                    <td className="px-6 py-3 text-purple-300">{e.action}</td>
                    <td className="px-6 py-3 text-white/50">{e.module}</td>
                    <td className="px-6 py-3 text-white/40 tabular-nums">
                      {new Date(e.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
