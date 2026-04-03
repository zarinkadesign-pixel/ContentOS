/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/users/page.tsx
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import AdminLayout from "../_components/AdminLayout";

interface User {
  id:              string;
  email:           string;
  name:            string;
  role:            "admin" | "hub" | "studio" | "free";
  plan:            string | null;
  plan_active:     boolean;
  plan_expires_at: string | null;
  created_at:      string;
  last_login:      string | null;
}

const PLANS = ["free", "hub_monthly", "hub_yearly", "studio_monthly", "studio_yearly"];
const ROLES = ["admin", "hub", "studio", "free"];

export default function AdminUsers() {
  const [users, setUsers]   = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError]   = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/users");
    if (!r.ok) { setError("Forbidden"); return; }
    setUsers(await r.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function patch(id: string, updates: Partial<User>) {
    setSaving(id);
    const r = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    if (r.ok) {
      const updated: User = await r.json();
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    }
    setSaving(null);
  }

  async function deleteUser(id: string, email: string) {
    if (!confirm(`Delete user ${email}?`)) return;
    await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  const filtered = search
    ? users.filter(
        (u) =>
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.name.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Users</h1>
          <span className="text-sm text-white/40">{users.length} total</span>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Search by email or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-6 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
        />

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 text-xs uppercase border-b border-white/10">
                <th className="px-5 py-3 text-left">User</th>
                <th className="px-5 py-3 text-left">Role</th>
                <th className="px-5 py-3 text-left">Plan</th>
                <th className="px-5 py-3 text-left">Active</th>
                <th className="px-5 py-3 text-left">Last Login</th>
                <th className="px-5 py-3 text-left">Joined</th>
                <th className="px-5 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-white/5 hover:bg-white/3">
                  <td className="px-5 py-3">
                    <p className="text-white/90 font-medium">{u.name || "—"}</p>
                    <p className="text-white/40 text-xs">{u.email}</p>
                  </td>

                  <td className="px-5 py-3">
                    <select
                      value={u.role}
                      disabled={saving === u.id}
                      onChange={(e) => patch(u.id, { role: e.target.value as User["role"] })}
                      className="bg-transparent border border-white/20 rounded px-2 py-1 text-xs text-white/80 disabled:opacity-50"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>

                  <td className="px-5 py-3">
                    <select
                      value={u.plan ?? "free"}
                      disabled={saving === u.id}
                      onChange={(e) => patch(u.id, { plan: e.target.value === "free" ? null : e.target.value })}
                      className="bg-transparent border border-white/20 rounded px-2 py-1 text-xs text-white/80 disabled:opacity-50"
                    >
                      {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>

                  <td className="px-5 py-3">
                    <button
                      disabled={saving === u.id}
                      onClick={() => patch(u.id, { plan_active: !u.plan_active })}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                        u.plan_active
                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      }`}
                    >
                      {u.plan_active ? "Active" : "Inactive"}
                    </button>
                  </td>

                  <td className="px-5 py-3 text-white/40 tabular-nums text-xs">
                    {u.last_login ? new Date(u.last_login).toLocaleDateString() : "Never"}
                  </td>

                  <td className="px-5 py-3 text-white/40 tabular-nums text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>

                  <td className="px-5 py-3">
                    {u.role !== "admin" && (
                      <button
                        onClick={() => deleteUser(u.id, u.email)}
                        className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-white/30 text-sm">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
