/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/page.tsx
 */
"use client";

import { useEffect, useState } from "react";
import AdminLayout from "./_components/AdminLayout";

// ── types ──────────────────────────────────────────────────────────────────
interface Lead {
  id: string;
  name: string;
  contact?: string;
  stage: string;
  date: string;
  niche?: string;
  source?: string;
}

interface Task {
  id: string;
  title: string;
  status: string; // "todo" | "in_progress" | "done"
}

interface MonthlyPoint {
  month: string;
  revenue: number;
}

// ── constants ──────────────────────────────────────────────────────────────
const BG     = "#050710";
const CARD   = "#0d1126";
const CARD2  = "#121630";
const ACCENT = "#5c6af0";
const TEXT   = "#e4e9ff";
const TEXT2  = "#6b7db3";

const STAGE_LABELS: Record<string, string> = {
  new:        "Новый",
  replied:    "Диалог",
  call:       "Созвон",
  interested: "Созвон",
  contract:   "Контракт",
  client:     "Клиент",
};

const STAGE_COLORS: Record<string, { bg: string; color: string }> = {
  new:        { bg: "rgba(92,106,240,0.18)", color: "#a5b4fc" },
  replied:    { bg: "rgba(34,197,94,0.15)",  color: "#86efac" },
  call:       { bg: "rgba(234,179,8,0.15)",  color: "#fde68a" },
  interested: { bg: "rgba(234,179,8,0.15)",  color: "#fde68a" },
  contract:   { bg: "rgba(168,85,247,0.15)", color: "#e879f9" },
  client:     { bg: "rgba(16,185,129,0.18)", color: "#6ee7b7" },
};

// ── sub-components ─────────────────────────────────────────────────────────
function KpiCard({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div style={{
      background: CARD,
      border: `1px solid rgba(92,106,240,0.18)`,
      borderRadius: 14,
      padding: "20px 22px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>
      <div style={{ fontSize: 11, color: TEXT2, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: TEXT, letterSpacing: "-0.02em", lineHeight: 1 }}>
        {value}
      </div>
      {sub}
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: TEXT2 }}>Прогресс</span>
        <span style={{ fontSize: 10, color: ACCENT, fontWeight: 700 }}>{clamped.toFixed(1)}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: CARD2, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${clamped}%`,
          borderRadius: 99,
          background: `linear-gradient(90deg, ${ACCENT} 0%, #8b93f8 100%)`,
          transition: "width 0.5s ease",
        }} />
      </div>
    </div>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const c = STAGE_COLORS[stage] ?? { bg: "rgba(255,255,255,0.07)", color: TEXT2 };
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 9px",
      borderRadius: 20,
      fontSize: 10,
      fontWeight: 600,
      background: c.bg,
      color: c.color,
    }}>
      {STAGE_LABELS[stage] ?? stage}
    </span>
  );
}

// ── main component ─────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [income,       setIncome]       = useState(0);
  const [goal,         setGoal]         = useState(20000);
  const [goalPct,      setGoalPct]      = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [totalLeads,   setTotalLeads]   = useState(0);
  const [leads,        setLeads]        = useState<Lead[]>([]);
  const [tasks,        setTasks]        = useState<Task[]>([]);
  const [monthlyChart, setMonthlyChart] = useState<MonthlyPoint[]>([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, leadsRes, tasksRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/leads"),
          fetch("/api/workspace/tasks"),
        ]);

        if (dashRes.ok) {
          const dash = await dashRes.json();
          setIncome(dash.kpi?.total_revenue ?? 0);
          setGoal(dash.kpi?.monthly_target ?? 20000);
          setGoalPct(dash.kpi?.progress_pct ?? 0);
          setTotalClients(dash.kpi?.total_clients ?? 0);
          setTotalLeads(dash.kpi?.total_leads ?? 0);
          if (Array.isArray(dash.monthly_chart)) setMonthlyChart(dash.monthly_chart);
        }

        if (leadsRes.ok) {
          const leadsData = await leadsRes.json();
          if (Array.isArray(leadsData)) setLeads(leadsData);
        }

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          if (Array.isArray(tasksData)) setTasks(tasksData);
        }
      } catch {
        // keep empty state on network error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const chartMax = Math.max(...monthlyChart.map(p => p.revenue), 1);
  const last5Leads = [...leads].reverse().slice(0, 5);
  const pendingTasks = tasks.filter(t => t.status !== "done").slice(0, 5);

  return (
    <AdminLayout>
      <div style={{ padding: "28px 32px 0" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: TEXT }}>Дашборд</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: TEXT2 }}>
            Обзор показателей · AMAImedia Producer Center
          </p>
        </div>

        {/* ── KPI grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
          <KpiCard
            label="Доход"
            value={loading ? "…" : `$${income.toLocaleString()}`}
          />
          <KpiCard
            label={`Цель $${goal.toLocaleString()}`}
            value={loading ? "…" : `${goalPct.toFixed(1)}%`}
            sub={<ProgressBar pct={goalPct} />}
          />
          <KpiCard
            label="Лидов"
            value={loading ? "…" : String(totalLeads)}
          />
          <KpiCard
            label="Клиентов"
            value={loading ? "…" : String(totalClients)}
          />
        </div>

        {/* ── two-column section ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {/* LEFT — recent leads */}
          <div style={{ background: CARD, border: `1px solid rgba(92,106,240,0.15)`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Последние лиды</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["Имя", "Контакт", "Статус", "Дата"].map(h => (
                    <th key={h} style={{ padding: "8px 16px", textAlign: "left", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT2 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!loading && last5Leads.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: "24px 16px", textAlign: "center", color: TEXT2, fontSize: 12 }}>Нет лидов</td></tr>
                )}
                {last5Leads.map((lead, i) => (
                  <tr key={lead.id} style={{ borderTop: `1px solid rgba(255,255,255,0.04)` }}>
                    <td style={{ padding: "10px 16px", color: TEXT, fontWeight: 500 }}>{lead.name}</td>
                    <td style={{ padding: "10px 16px", color: TEXT2 }}>{lead.contact ?? lead.source ?? "—"}</td>
                    <td style={{ padding: "10px 16px" }}><StageBadge stage={lead.stage} /></td>
                    <td style={{ padding: "10px 16px", color: TEXT2, fontFamily: "monospace", fontSize: 11 }}>{lead.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* RIGHT — upcoming tasks */}
          <div style={{ background: CARD, border: `1px solid rgba(92,106,240,0.15)`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Ближайшие задачи</span>
            </div>
            <div style={{ padding: "8px 0" }}>
              {!loading && pendingTasks.length === 0 && (
                <div style={{ padding: "24px 20px", textAlign: "center", color: TEXT2, fontSize: 12 }}>Нет активных задач</div>
              )}
              {pendingTasks.map((task, i) => (
                <div key={task.id} style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 20px",
                  borderBottom: i < pendingTasks.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none",
                }}>
                  <div style={{
                    flexShrink: 0,
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    border: `1.5px solid rgba(92,106,240,0.4)`,
                    background: task.status === "in_progress" ? "rgba(92,106,240,0.2)" : "transparent",
                    marginTop: 1,
                  }} />
                  <span style={{ fontSize: 12, color: TEXT, lineHeight: 1.5 }}>{task.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── bar chart ── */}
        <div style={{ background: CARD, border: `1px solid rgba(92,106,240,0.15)`, borderRadius: 14, padding: "20px 24px", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>Доходы по месяцам</span>
          </div>

          {monthlyChart.length === 0 && !loading && (
            <div style={{ textAlign: "center", padding: "32px 0", color: TEXT2, fontSize: 13 }}>Нет данных</div>
          )}

          {monthlyChart.length > 0 && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 120 }}>
              {monthlyChart.map((pt, i) => {
                const barH = chartMax > 0 ? Math.max(4, (pt.revenue / chartMax) * 100) : 4;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 9, color: pt.revenue > 0 ? TEXT2 : "transparent", fontWeight: 600 }}>
                      ${pt.revenue.toLocaleString()}
                    </span>
                    <div style={{
                      width: "100%",
                      height: `${barH}%`,
                      borderRadius: "4px 4px 0 0",
                      background: pt.revenue > 0
                        ? `linear-gradient(180deg, ${ACCENT} 0%, #3a47c8 100%)`
                        : `rgba(255,255,255,0.05)`,
                      transition: "height 0.4s ease",
                    }} />
                    <span style={{ fontSize: 10, color: TEXT2, fontWeight: 600 }}>{pt.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
