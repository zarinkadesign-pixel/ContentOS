"use client";
import { useEffect, useState, useRef } from "react";
import { getDashboard, getSettings, updateSettings } from "@/lib/api";
import KPICard from "@/components/KPICard";
import { DollarSign, Users, TrendingUp, Target, Zap, RefreshCw, Edit2, Check, X, Bot, CheckCircle2, Clock, Loader2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { STAGE_LABELS, STAGE_COLORS } from "@/lib/types";
import clsx from "clsx";

export default function Dashboard() {
  const [data, setData]           = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [editTarget, setEditTarget] = useState(false);
  const [targetDraft, setTargetDraft] = useState("");
  const [savingTarget, setSavingTarget] = useState(false);
  const [digest, setDigest]       = useState("");
  const [digestLoading, setDigestLoading] = useState(false);
  const [digestOpen, setDigestOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load() {
    setLoading(true);
    try { setData(await getDashboard()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    load();
    // Auto-refresh every 60 seconds
    intervalRef.current = setInterval(load, 60_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []); // eslint-disable-line

  async function generateDigest() {
    if (!data) return;
    setDigestLoading(true);
    setDigestOpen(true);
    try {
      const res = await fetch("/api/hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "weeklyDigest",
          data: {
            metrics: {
              revenue:     data.kpi?.total_revenue    ?? 0,
              target:      data.kpi?.monthly_target   ?? 0,
              clients:     data.kpi?.total_clients    ?? 0,
              leads:       data.kpi?.total_leads      ?? 0,
              automations: data.automation?.running   ?? 0,
            },
          },
        }),
      });
      const json = await res.json();
      setDigest(json.result ?? "Не удалось получить аналитику.");
    } catch {
      setDigest("Ошибка генерации. Проверь API-ключ Gemini.");
    } finally {
      setDigestLoading(false);
    }
  }

  async function saveTarget() {
    const val = parseInt(targetDraft, 10);
    if (isNaN(val) || val <= 0) return;
    setSavingTarget(true);
    try {
      await updateSettings({ monthly_target: val });
      await load();
      setEditTarget(false);
    } catch (e) { console.error(e); }
    finally { setSavingTarget(false); }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-subtext">Загрузка…</div>;
  if (!data)   return <div className="text-red-400">Ошибка загрузки. Проверь, запущен ли бэкенд.</div>;

  const { kpi, lead_stages, recent_clients, monthly_chart, automation } = data;

  function openTargetEdit() {
    setTargetDraft(String(kpi.monthly_target));
    setEditTarget(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-text">Дашборд</h1>
          <p className="text-sm text-subtext mt-0.5">Producer Center — обзор системы</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateDigest}
            disabled={digestLoading}
            className="btn-primary flex items-center gap-2 shrink-0 text-xs px-3 py-1.5"
          >
            {digestLoading
              ? <Loader2 size={12} className="animate-spin" />
              : <Sparkles size={12} />}
            AI Дайджест
          </button>
          <button onClick={load} className="btn-ghost flex items-center gap-2 shrink-0">
            <RefreshCw size={14} /> Обновить
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 stagger">
        <KPICard label="Выручка" value={`$${kpi.total_revenue.toLocaleString()}`}
          sub={`цель $${kpi.monthly_target.toLocaleString()}`} icon={DollarSign} color="green" />
        <KPICard label="Прогресс к цели" value={`${kpi.progress_pct}%`}
          sub={`от $${kpi.monthly_target.toLocaleString()} / мес`} icon={Target} color="accent" />
        <KPICard label="Клиентов" value={kpi.total_clients} icon={Users} color="yellow" />
        <KPICard label="Лидов" value={kpi.total_leads} icon={TrendingUp} color="red" />
      </div>

      {/* AI Digest panel */}
      {digestOpen && (
        <div className="card border-accent/30 bg-accent/5 animate-fade-up">
          <button
            onClick={() => setDigestOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2 mb-0"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-accent" />
              <span className="text-sm font-semibold text-text">AI Дайджест</span>
              {digestLoading && <Loader2 size={12} className="animate-spin text-subtext" />}
            </div>
            {digestOpen ? <ChevronUp size={14} className="text-subtext" /> : <ChevronDown size={14} className="text-subtext" />}
          </button>
          {digestOpen && (
            <div className="mt-3 pt-3 border-t border-border">
              {digestLoading ? (
                <div className="flex items-center gap-2 text-xs text-subtext">
                  <Loader2 size={12} className="animate-spin" /> Анализируем данные…
                </div>
              ) : (
                <pre className="text-xs text-text leading-relaxed whitespace-pre-wrap font-sans">{digest}</pre>
              )}
            </div>
          )}
        </div>
      )}

      {/* Progress bar with editable target */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-text">Прогресс к цели месяца</span>
          <div className="flex items-center gap-2">
            {editTarget ? (
              <>
                <span className="text-xs text-subtext">$</span>
                <input
                  className="input w-28 text-right text-sm py-1"
                  type="number"
                  min={1}
                  value={targetDraft}
                  onChange={e => setTargetDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveTarget(); if (e.key === "Escape") setEditTarget(false); }}
                  autoFocus
                />
                <button onClick={saveTarget} disabled={savingTarget}
                  className="p-1 text-accent hover:bg-accent/10 rounded transition-colors">
                  <Check size={14} />
                </button>
                <button onClick={() => setEditTarget(false)}
                  className="p-1 text-subtext hover:text-text hover:bg-white/5 rounded transition-colors">
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <span className="text-sm font-bold text-accent">{kpi.progress_pct}%</span>
                <button onClick={openTargetEdit}
                  className="p-1 text-subtext hover:text-accent hover:bg-accent/10 rounded transition-colors"
                  title="Изменить цель">
                  <Edit2 size={12} />
                </button>
              </>
            )}
          </div>
        </div>
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent2 rounded-full transition-all"
            style={{ width: `${Math.min(kpi.progress_pct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-subtext mt-2">
          <span>$0</span>
          <span className="flex items-center gap-1">
            ${kpi.monthly_target.toLocaleString()}
          </span>
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

      {/* Automation status */}
      {automation && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text flex items-center gap-2">
              <Bot size={14} className="text-accent" /> Автопилот — AI-команда
            </h2>
            <Link href="/automation" className="text-xs text-accent hover:underline">
              Все запуски →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
            <div className="text-center p-3 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
              <div className="text-xl font-bold text-emerald-400">{automation.done}</div>
              <div className="text-xs text-subtext mt-0.5">Выполнено</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-400/10 border border-blue-400/20">
              <div className="text-xl font-bold text-blue-400">{automation.running}</div>
              <div className="text-xs text-subtext mt-0.5">В работе</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-yellow-400/10 border border-yellow-400/20">
              <div className="text-xl font-bold text-yellow-400">{automation.queued}</div>
              <div className="text-xs text-subtext mt-0.5">В очереди</div>
            </div>
          </div>
          {automation.recent?.length > 0 && (
            <div className="space-y-2">
              {automation.recent.map((run: any) => (
                <div key={run.id} className="flex items-center gap-3 py-2 border-t border-border first:border-0 first:pt-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    run.status === "done"    ? "bg-emerald-500/15" :
                    run.status === "running" ? "bg-blue-500/15" : "bg-yellow-500/15"
                  }`}>
                    {run.status === "done"    ? <CheckCircle2 size={12} className="text-emerald-400" /> :
                     run.status === "running" ? <Loader2 size={12} className="text-blue-400 animate-spin" /> :
                                                <Clock size={12} className="text-yellow-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{run.client_name}</p>
                    <p className="text-xs text-subtext">{run.client_niche}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    run.status === "done"    ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" :
                    run.status === "running" ? "text-blue-400 bg-blue-400/10 border-blue-400/20" :
                                               "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
                  }`}>
                    {run.status === "done" ? "Готово" : run.status === "running" ? "Работает" : "В очереди"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent clients */}
      {recent_clients?.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-text mb-4">👥 Последние клиенты</h2>
          <div className="divide-y divide-border">
            {recent_clients.map((c: any) => (
              <div key={c.id} className="flex items-center gap-2 py-3 first:pt-0 last:pb-0">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm shrink-0">
                  {c.name?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text truncate">{c.name}</p>
                  <p className="text-xs text-subtext truncate">{c.niche}</p>
                </div>
                <div className="text-right shrink-0">
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
