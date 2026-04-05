/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/n8n/page.tsx
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../_components/AdminLayout";

/* ── known local workflows from project ──────────────────────────── */
const KNOWN_WORKFLOWS = [
  { id: "90f1e42b-f911-44f1-90ac-919e4819ed02", name: "09 · Monitor Engine",      trigger: "Cron 60 min",         icon: "⚡" },
  { id: "3d2453d5-b023-4559-853f-78a59aaff9ef", name: "10 · Strategy Weekly",     trigger: "Cron Mon 08:00",      icon: "📊" },
  { id: "b8bd6602-2e85-405a-a24e-f42231483841", name: "11 · Onboard Webhook",      trigger: "Webhook /onboard",    icon: "🚀" },
  { id: "1eea03d2-5c1b-4c14-b33a-57d2a6196e20", name: "12 · Monthly Report",      trigger: "Cron 1st/mo 09:00",   icon: "📋" },
  { id: "cbb9d941-daee-4f2e-9bab-2f5599492bff", name: "13 · Ads Monitor",         trigger: "Cron Mon 08:00",      icon: "📢" },
  { id: "48318ceb-dc98-48fa-b364-b1d69fc60cbb", name: "14 · Return Campaign",     trigger: "Cron daily 14:00",    icon: "🔄" },
  { id: "00ff48c1-2a0c-4fcd-919f-cf6a6ac40f83", name: "15 · Voice Lead",          trigger: "Webhook /new-lead",   icon: "🎤" },
  { id: "d62dcf47-784c-44fd-8e66-4edd97170a03", name: "16 · Multiplatform Post",  trigger: "Webhook /publish",    icon: "📡" },
  { id: "1b3b7904-d2a9-4e81-ad71-06a607984f33", name: "17 · Lead Score",          trigger: "Webhook /score",      icon: "🎯" },
];

interface Workflow {
  id: string;
  name: string;
  active: boolean;
  updatedAt?: string;
  tags?: { id: string; name: string }[];
}

interface Execution {
  id: string;
  workflowId: string;
  workflowName?: string;
  status: "success" | "error" | "running" | "waiting";
  startedAt: string;
  stoppedAt?: string;
}

type Tab = "workflows" | "executions" | "mcp" | "docs";

const STATUS_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  success: { bg: "rgba(34,197,94,0.1)",   text: "#86efac", dot: "#22c55e" },
  error:   { bg: "rgba(239,68,68,0.1)",   text: "#fca5a5", dot: "#ef4444" },
  running: { bg: "rgba(234,179,8,0.1)",   text: "#fde68a", dot: "#eab308" },
  waiting: { bg: "rgba(99,102,241,0.1)",  text: "#a5b4fc", dot: "#6366f1" },
};

const MCP_CONFIG = `{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": ["n8n-mcp"],
      "env": {
        "N8N_API_URL": "http://localhost:5678/api/v1",
        "N8N_API_KEY": "<your-n8n-api-key>"
      }
    }
  }
}`;

const MCP_TOOLS = [
  { name: "search_nodes",       desc: "Найти n8n-ноды по ключевому слову" },
  { name: "get_node",           desc: "Получить полную схему ноды" },
  { name: "validate_node",      desc: "Проверить конфигурацию ноды" },
  { name: "validate_workflow",  desc: "Валидация всего workflow" },
  { name: "search_templates",   desc: "Поиск по 2700+ шаблонов" },
  { name: "get_template",       desc: "Получить шаблон workflow" },
  { name: "list_workflows",     desc: "Список всех workflows в n8n" },
  { name: "create_workflow",    desc: "Создать новый workflow" },
  { name: "update_workflow",    desc: "Обновить существующий workflow" },
  { name: "execute_workflow",   desc: "Запустить workflow вручную" },
  { name: "list_executions",    desc: "История выполнений" },
  { name: "security_audit",     desc: "Аудит безопасности n8n" },
];

export default function N8NPage() {
  const [tab, setTab]               = useState<Tab>("workflows");
  const [health, setHealth]         = useState<"ok" | "error" | "loading">("loading");
  const [workflows, setWorkflows]   = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [offline, setOffline]       = useState(false);
  const [toggling, setToggling]     = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/n8n?action=health");
      const d = await r.json();
      setHealth(d.ok ? "ok" : "error");
    } catch {
      setHealth("error");
    }
  }, []);

  const fetchWorkflows = useCallback(async () => {
    const r = await fetch("/api/admin/n8n?action=workflows");
    const d = await r.json();
    if (d.offline) {
      setOffline(true);
      // merge with known workflows (shown as static)
      setWorkflows([]);
    } else {
      setOffline(false);
      setWorkflows(d.workflows ?? []);
    }
  }, []);

  const fetchExecutions = useCallback(async () => {
    const r = await fetch("/api/admin/n8n?action=executions");
    const d = await r.json();
    setExecutions(d.executions ?? []);
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  useEffect(() => {
    if (tab === "workflows") fetchWorkflows();
    if (tab === "executions") fetchExecutions();
  }, [tab, fetchWorkflows, fetchExecutions]);

  async function toggleWorkflow(id: string, currentActive: boolean) {
    setToggling(id);
    await fetch("/api/admin/n8n", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle", workflowId: id, active: !currentActive }),
    });
    await fetchWorkflows();
    setToggling(null);
  }

  /* helpers */
  const liveWorkflows = offline ? [] : workflows;
  // merge live data with known list (fallback to known when offline/not in API)
  const knownWithLive = KNOWN_WORKFLOWS.map(k => {
    const live = liveWorkflows.find(w => w.id === k.id);
    return { ...k, active: live?.active ?? true, live: !!live, updatedAt: live?.updatedAt };
  });
  const liveOnly = liveWorkflows.filter(w => !KNOWN_WORKFLOWS.find(k => k.id === w.id));

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ padding: "28px 32px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#f97316", marginBottom: "6px" }}>
              n8n · Workflow Automation
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
              n8n MCP Dashboard
            </h1>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {/* Health badge */}
            <div style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "6px 14px", borderRadius: "20px",
              background: health === "ok" ? "rgba(34,197,94,0.1)" : health === "error" ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${health === "ok" ? "rgba(34,197,94,0.25)" : health === "error" ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.1)"}`,
              fontSize: "11px", fontWeight: 600,
              color: health === "ok" ? "#86efac" : health === "error" ? "#fca5a5" : "rgba(255,255,255,0.4)",
            }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: health === "ok" ? "#22c55e" : health === "error" ? "#ef4444" : "#888", boxShadow: health === "ok" ? "0 0 6px #22c55e" : "none" }} />
              {health === "ok" ? "n8n Online" : health === "error" ? "n8n Offline" : "Checking…"}
            </div>
            <a
              href="http://localhost:5678"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "6px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, textDecoration: "none",
                background: "linear-gradient(135deg, rgba(249,115,22,0.2), rgba(234,88,12,0.1))",
                border: "1px solid rgba(249,115,22,0.3)", color: "#fb923c",
              }}
            >
              Открыть n8n ↗
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px" }}>
          {([
            ["workflows",  "⚡ Workflows"],
            ["executions", "📋 Выполнения"],
            ["mcp",        "🔌 MCP Setup"],
            ["docs",       "📚 MCP Tools"],
          ] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "8px 16px", borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600,
                background: tab === t ? "rgba(249,115,22,0.15)" : "transparent",
                color: tab === t ? "#fb923c" : "rgba(255,255,255,0.4)",
                borderBottom: tab === t ? "2px solid #f97316" : "2px solid transparent",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 32px 32px" }}>

        {/* ── WORKFLOWS TAB ─────────────────────────── */}
        {tab === "workflows" && (
          <div>
            {offline && (
              <div style={{ marginBottom: "16px", padding: "12px 18px", borderRadius: "10px", background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", color: "#fde68a", fontSize: "12px" }}>
                ⚠️ n8n API недоступна или требует API-ключ. Показаны статические данные. Добавьте <code style={{ background: "rgba(255,255,255,0.07)", padding: "1px 5px", borderRadius: "4px" }}>N8N_API_KEY</code> в .env.local
              </div>
            )}

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
              {[
                { label: "Всего workflows", value: offline ? KNOWN_WORKFLOWS.length : workflows.length, color: "#a5b4fc" },
                { label: "Активных", value: offline ? KNOWN_WORKFLOWS.length : workflows.filter(w => w.active).length, color: "#86efac" },
                { label: "Неактивных", value: offline ? 0 : workflows.filter(w => !w.active).length, color: "#fca5a5" },
                { label: "Webhook-триггеры", value: offline ? 3 : 3, color: "#fde68a" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "16px" }}>
                  <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>{s.label}</div>
                  <div style={{ fontSize: "26px", fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Known workflows list */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>Зарегистрированные workflows</span>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>WF09 – WF17</span>
              </div>
              {knownWithLive.map((wf, i) => (
                <div
                  key={wf.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "14px", padding: "12px 20px",
                    borderBottom: i < knownWithLive.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ fontSize: "18px", width: "28px", textAlign: "center", flexShrink: 0 }}>{wf.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{wf.name}</div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "2px", fontFamily: "monospace" }}>{wf.trigger}</div>
                  </div>
                  <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)", fontFamily: "monospace", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {wf.id}
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "6px", padding: "3px 10px", borderRadius: "20px",
                    background: wf.active ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)",
                    border: `1px solid ${wf.active ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.15)"}`,
                    fontSize: "10px", fontWeight: 600, flexShrink: 0,
                    color: wf.active ? "#86efac" : "#fca5a5",
                  }}>
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: wf.active ? "#22c55e" : "#ef4444", boxShadow: wf.active ? "0 0 5px #22c55e" : "none" }} />
                    {wf.active ? "ON" : "OFF"}
                  </div>
                  {!offline && (
                    <button
                      onClick={() => toggleWorkflow(wf.id, wf.active)}
                      disabled={toggling === wf.id}
                      style={{
                        padding: "5px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", fontSize: "11px", fontWeight: 500,
                        background: toggling === wf.id ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.05)",
                        color: "rgba(255,255,255,0.5)",
                        transition: "all 0.15s",
                        flexShrink: 0,
                      }}
                    >
                      {toggling === wf.id ? "…" : wf.active ? "Выкл" : "Вкл"}
                    </button>
                  )}
                </div>
              ))}
              {/* extra live workflows not in known list */}
              {liveOnly.map(wf => (
                <div key={wf.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ fontSize: "18px", width: "28px", textAlign: "center" }}>🔧</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{wf.name}</div>
                    <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>{wf.id}</div>
                  </div>
                  <div style={{ padding: "3px 10px", borderRadius: "20px", background: wf.active ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)", fontSize: "10px", fontWeight: 600, color: wf.active ? "#86efac" : "rgba(255,255,255,0.3)" }}>
                    {wf.active ? "ON" : "OFF"}
                  </div>
                  <button onClick={() => toggleWorkflow(wf.id, wf.active)} disabled={toggling === wf.id} style={{ padding: "5px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", fontSize: "11px", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}>
                    {toggling === wf.id ? "…" : wf.active ? "Выкл" : "Вкл"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EXECUTIONS TAB ──────────────────────────── */}
        {tab === "executions" && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>Последние 20 выполнений</span>
            </div>
            {executions.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: "13px" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>📭</div>
                {offline ? "n8n API недоступна — добавьте N8N_API_KEY в .env.local" : "Выполнений пока нет"}
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    {["Workflow", "Статус", "Начало", "Длительность"].map(h => (
                      <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {executions.map((ex, i) => {
                    const sc = STATUS_COLOR[ex.status] ?? STATUS_COLOR.waiting;
                    const started = new Date(ex.startedAt);
                    const stopped = ex.stoppedAt ? new Date(ex.stoppedAt) : null;
                    const dur = stopped ? `${((stopped.getTime() - started.getTime()) / 1000).toFixed(1)}s` : "–";
                    return (
                      <tr key={ex.id} style={{ borderBottom: i < executions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                        <td style={{ padding: "10px 20px", color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{ex.workflowName ?? ex.workflowId}</td>
                        <td style={{ padding: "10px 20px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "2px 8px", borderRadius: "20px", background: sc.bg, color: sc.text, fontSize: "10px", fontWeight: 600 }}>
                            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: sc.dot }} />
                            {ex.status}
                          </span>
                        </td>
                        <td style={{ padding: "10px 20px", color: "rgba(255,255,255,0.35)", fontFamily: "monospace", fontSize: "10px" }}>
                          {started.toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td style={{ padding: "10px 20px", color: "rgba(255,255,255,0.35)", fontFamily: "monospace", fontSize: "10px" }}>{dur}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── MCP SETUP TAB ───────────────────────────── */}
        {tab === "mcp" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: "14px", padding: "20px" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#fb923c", marginBottom: "8px" }}>🔌 n8n-MCP — что это?</div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                <b style={{ color: "rgba(255,255,255,0.8)" }}>n8n-MCP</b> — MCP-сервер от <code style={{ background: "rgba(255,255,255,0.07)", padding: "1px 5px", borderRadius: "4px" }}>czlonkowski</code>, который даёт Claude доступ к 1396 n8n-нодам, 2700+ шаблонам и управлению вашими workflows через чат. Среднее время ответа ~12 мс.
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "20px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: "12px" }}>1. Установка</div>
              <div style={{ fontFamily: "monospace", fontSize: "12px", background: "rgba(0,0,0,0.4)", borderRadius: "10px", padding: "14px 16px", color: "#a5b4fc", lineHeight: 1.8 }}>
                # Быстрый запуск через npx<br/>
                npx n8n-mcp<br/><br/>
                # Или через Docker<br/>
                docker run -e N8N_API_URL=http://localhost:5678/api/v1 \<br/>
                &nbsp;&nbsp;-e N8N_API_KEY=your-key czlonkowski/n8n-mcp
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "20px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: "4px" }}>2. Конфиг Claude Desktop / Claude Code</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "12px" }}>Добавить в <code style={{ background: "rgba(255,255,255,0.07)", padding: "1px 5px", borderRadius: "4px" }}>claude_desktop_config.json</code></div>
              <pre style={{ fontFamily: "monospace", fontSize: "11px", background: "rgba(0,0,0,0.4)", borderRadius: "10px", padding: "14px 16px", color: "#86efac", lineHeight: 1.7, margin: 0, overflowX: "auto", whiteSpace: "pre" }}>
                {MCP_CONFIG}
              </pre>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "20px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: "12px" }}>3. Получить N8N_API_KEY</div>
              <ol style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", lineHeight: 2, margin: 0, paddingLeft: "16px" }}>
                <li>Открыть <a href="http://localhost:5678" target="_blank" rel="noopener noreferrer" style={{ color: "#fb923c" }}>localhost:5678</a></li>
                <li>Settings → API → Create API Key</li>
                <li>Скопировать ключ в конфиг выше</li>
                <li>Добавить <code style={{ background: "rgba(255,255,255,0.07)", padding: "1px 5px", borderRadius: "4px" }}>N8N_API_KEY=...</code> в .env.local</li>
              </ol>
            </div>

            <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "14px", padding: "20px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#a5b4fc", marginBottom: "8px" }}>✅ Hosted вариант (бесплатно)</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                Используйте <code style={{ background: "rgba(255,255,255,0.07)", padding: "1px 5px", borderRadius: "4px" }}>dashboard.n8n-mcp.com</code> — 100 tool calls/день бесплатно, без установки.
              </div>
            </div>
          </div>
        )}

        {/* ── MCP TOOLS TAB ───────────────────────────── */}
        {tab === "docs" && (
          <div>
            <div style={{ marginBottom: "16px", fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
              12 MCP-инструментов доступны после подключения n8n-MCP к Claude
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
              {MCP_TOOLS.map(tool => (
                <div key={tool.name} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "14px 16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6366f1", boxShadow: "0 0 6px #6366f155", marginTop: "4px", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#a5b4fc", fontFamily: "monospace", marginBottom: "4px" }}>{tool.name}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{tool.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "18px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: "10px" }}>Примеры запросов к Claude</div>
              {[
                "Найди все n8n-ноды для работы с Telegram",
                "Создай workflow для автоматической отправки отчёта в Telegram каждый понедельник",
                "Проверь мой workflow на ошибки конфигурации",
                "Покажи шаблоны для CRM-автоматизации",
                "Запусти workflow 16 (multiplatform post) вручную",
              ].map(q => (
                <div key={q} style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.1)", fontSize: "12px", color: "rgba(255,255,255,0.55)", marginBottom: "6px" }}>
                  💬 {q}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
