"use client";
import { useEffect, useState } from "react";
import { getDashboard } from "@/lib/api";
import KPICard from "@/components/KPICard";
import { DollarSign, Users, TrendingUp, Target, Zap, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { STAGE_LABELS, STAGE_COLORS } from "@/lib/types";
import clsx from "clsx";

export default function Dashboard() {
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setData(await getDashboard()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-subtext">Загрузка…</div>;
  if (!data)   return <div className="text-red-400">Ошибка загрузки. Проверь, запущен ли бэкенд.</div>;

  const { kpi, lead_stages, recent_clients, monthly_chart } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Дашборд</h1>
          <p className="text-sm text-subtext mt-0.5">Producer Center — обзор системы</p>
        </div>
        <button onClick={load} className="btn-ghost flex items-center gap-2">
          <RefreshCw size={14} /> Обновить
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Выручка" value={`$${kpi.total_revenue.toLocaleString()}`}
          sub={`цель $${kpi.monthly_target.toLocaleString()}`} icon={DollarSign} color="green" />
        <KPICard label="Прогресс к цели" value={`${kpi.progress_pct}%`}
          sub="от $20 000 / мес" icon={Target} color="accent" />
        <KPICard label="Клиентов" value={kpi.total_clients} icon={Users} color="yellow" />
        <KPICard label="Лидов" value={kpi.total_leads} icon={TrendingUp} color="red" />
      </div>

      {/* Progress bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-text">Прогресс к цели месяца</span>
          <span className="text-sm font-bold text-accent">{kpi.progress_pct}%</span>
        </div>
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent2 rounded-full transition-all"
            style={{ width: `${Math.min(kpi.progress_pct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-subtext mt-2">
          <span>$0</span>
          <span>$20 000</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline */}
        <div className="card">
          <h2 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <Zap size={14} className="text-accent" /> Воронка лидов
          </h2>
          <div className="space-y-2">
            {Object.entries(lead_stages).map(([stage, count]: any) => (
              <div key={stage} className="flex items-center gap-3">
                <span className={clsx("badge w-24 justify-center shrink-0", STAGE_COLORS[stage])}>
                  {STAGE_LABELS[stage] ?? stage}
                </span>
                <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${(count / (kpi.total_leads || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-subtext w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly chart */}
        {monthly_chart?.length > 0 && (
          <div className="card">
            <h2 className="text-sm font-semibold text-text mb-4">📈 Выручка по месяцам</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthly_chart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#0d1126", border: "1px solid #1a1f3a", borderRadius: 8 }}
                  labelStyle={{ color: "#e2e8f0" }}
                  itemStyle={{ color: "#6c63ff" }}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {monthly_chart.map((_: any, i: number) => (
                    <Cell key={i} fill={i === monthly_chart.length - 1 ? "#6c63ff" : "#1a1f3a"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent clients */}
      {recent_clients?.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-text mb-4">👥 Последние клиенты</h2>
          <div className="divide-y divide-border">
            {recent_clients.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                    {c.name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">{c.name}</p>
                    <p className="text-xs text-subtext">{c.niche}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-400">${(c.income_now ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-subtext">/ мес</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
