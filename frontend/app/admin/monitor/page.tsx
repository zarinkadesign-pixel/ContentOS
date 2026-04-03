/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/monitor/page.tsx
 */
"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../_components/AdminLayout";

interface AgentDef {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface ScheduleItem {
  id: string;
  name: string;
  when: string;
  interval_min: number;
}

const SCORE_CRITERIA = [
  { label: "Бюджет подходит",              pts: 30 },
  { label: "Боль совпадает с продуктом",   pts: 25 },
  { label: "Готов действовать сейчас",     pts: 20 },
  { label: "Открыт к новому",              pts: 15 },
  { label: "Отвечает быстро",              pts: 10 },
];

const NURTURE_DAYS = [
  "День 1 — Знакомство (Зарина, история)",
  "День 2 — Боль (словами лида)",
  "День 3 — Решение (система 24/7)",
  "День 4 — Кейс (цифры из ниши)",
  "День 5 — Тест (3 диагностических вопроса)",
  "День 6 — Приглашение на разбор",
  "День 7 — Финальный оффер (3 пакета + 48ч дедлайн)",
];

const N8N_WEBHOOKS = [
  { method: "POST", path: "/webhook/score",        workflow: "06", desc: "Скоринг лида" },
  { method: "POST", path: "/webhook/generate-kp",  workflow: "07", desc: "Генерация КП" },
  { method: "POST", path: "/webhook/onboard",       workflow: "11", desc: "Онбординг клиента" },
  { method: "POST", path: "/webhook/new-lead",      workflow: "15", desc: "Квалификация нового лида" },
];

export default function MonitorPage() {
  const [agents, setAgents]     = useState<AgentDef[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/engine/status")
      .then((r) => r.json())
      .then((d) => {
        setAgents(d.agents ?? []);
        setSchedule(d.schedule ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="p-8 space-y-8 max-w-6xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">⚡ Engine Monitor</h1>
          <p className="text-sm text-white/40 mt-1">
            Autonomous Engine v4.0 — 12 AI агентов работают 24/7
          </p>
        </div>

        {/* Start banner */}
        <div className="flex items-center gap-4 px-5 py-4 rounded-xl bg-[#5c6af0]/10 border border-[#5c6af0]/30">
          <span className="text-2xl">🚀</span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-[#818cf8]">Запуск системы</div>
            <div className="text-xs text-white/40 mt-0.5">
              Двойной клик → <code className="bg-white/10 px-1 rounded">START_ALL.bat</code>&nbsp;
              запускает n8n + engine.py + Producer Center UI
            </div>
          </div>
          <div className="text-xs text-white/30">
            n8n: <span className="text-white/50">localhost:5678</span>
          </div>
        </div>

        {/* 12 agents grid */}
        <section>
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">
            12 AI Агентов
          </h2>
          {loading ? (
            <div className="text-sm text-white/30">Загрузка...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="bg-[#0d1126] border border-[#1e1e38] rounded-xl p-4 hover:border-[#5c6af0]/40 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{agent.icon}</span>
                    <span className="text-sm font-semibold text-white">{agent.name}</span>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">{agent.description}</p>
                  <div className="mt-3 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                    <span className="text-[10px] text-white/30">idle</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Schedule */}
        <section>
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">
            Расписание задач
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {schedule.map((item) => (
              <div key={item.id} className="bg-[#0d1126] border border-[#1e1e38] rounded-xl p-4">
                <div className="text-sm font-medium text-white">{item.name}</div>
                <div className="text-xs text-[#5c6af0] mt-1">⏰ {item.when}</div>
              </div>
            ))}
          </div>
        </section>

        {/* AI Score criteria */}
        <section>
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">
            AI Score — критерии квалификации
          </h2>
          <div className="bg-[#0d1126] border border-[#1e1e38] rounded-xl p-5">
            <div className="space-y-3">
              {SCORE_CRITERIA.map((c) => (
                <div key={c.label} className="flex items-center gap-3">
                  <div className="w-8 text-right text-xs font-bold text-[#22c55e]">+{c.pts}</div>
                  <div className="flex-1 h-1.5 bg-[#1e1e38] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#5c6af0] rounded-full"
                      style={{ width: `${c.pts}%` }}
                    />
                  </div>
                  <div className="text-xs text-white/60 w-52">{c.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[#1e1e38] grid grid-cols-3 gap-3 text-center">
              <div className="bg-[#22c55e]/10 rounded-lg p-2">
                <div className="text-xs font-bold text-[#22c55e]">≥ 80</div>
                <div className="text-[10px] text-white/40 mt-0.5">Зарине + Calendly</div>
              </div>
              <div className="bg-[#f59e0b]/10 rounded-lg p-2">
                <div className="text-xs font-bold text-[#f59e0b]">50–79</div>
                <div className="text-[10px] text-white/40 mt-0.5">7 дней прогрева</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-xs font-bold text-white/40">&lt; 50</div>
                <div className="text-[10px] text-white/40 mt-0.5">Архив 30 дней</div>
              </div>
            </div>
          </div>
        </section>

        {/* 7-day nurture */}
        <section>
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">
            7-дневная прогрев-цепочка
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {NURTURE_DAYS.map((day, i) => (
              <div key={i} className="bg-[#0d1126] border border-[#1e1e38] rounded-lg p-3">
                <div className="text-[10px] font-bold text-[#5c6af0] mb-1">
                  ДЕНЬ {i + 1}
                </div>
                <div className="text-xs text-white/60 leading-relaxed">{day.split(" — ")[1]}</div>
              </div>
            ))}
          </div>
        </section>

        {/* n8n webhooks */}
        <section>
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">
            n8n Webhook эндпоинты
          </h2>
          <div className="bg-[#0d1126] border border-[#1e1e38] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e1e38]">
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/30">Метод</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/30">Эндпоинт</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/30">Воркфлоу</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/30">Описание</th>
                </tr>
              </thead>
              <tbody>
                {N8N_WEBHOOKS.map((wh) => (
                  <tr key={wh.path} className="border-b border-[#1e1e38]/50 hover:bg-white/2">
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold bg-[#5c6af0]/20 text-[#818cf8] px-2 py-0.5 rounded">
                        {wh.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#22c55e]">{wh.path}</td>
                    <td className="px-4 py-3 text-xs text-white/40">#{wh.workflow}</td>
                    <td className="px-4 py-3 text-xs text-white/60">{wh.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
