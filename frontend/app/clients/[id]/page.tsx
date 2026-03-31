"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getClient, getAgents, runAgent, updateClient } from "@/lib/api";
import { ArrowLeft, Loader2, Zap, CheckSquare, Square } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const TABS = ["Обзор", "Бренд", "Продукты", "Воронка", "Контент", "AI агенты", "Чеклист"];

const JOURNEY = [
  "Онбординг", "Распаковка", "Продукты", "Воронка",
  "Контент-план", "Подкаст", "Автоклипы", "Реклама", "Аналитика",
];

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient]   = useState<any>(null);
  const [agents, setAgents]   = useState<any[]>([]);
  const [tab, setTab]         = useState(0);
  const [loading, setLoading] = useState(true);
  const [agentResult, setAgentResult] = useState<Record<string, string>>({});
  const [running, setRunning] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [c, a] = await Promise.all([getClient(id), getAgents()]);
      setClient(c); setAgents(a);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  async function callAgent(agentType: string) {
    setRunning(agentType);
    try {
      const res = await runAgent(agentType, id);
      setAgentResult((prev) => ({ ...prev, [agentType]: res.result }));
    } catch (e: any) {
      setAgentResult((prev) => ({ ...prev, [agentType]: `Ошибка: ${e.message}` }));
    } finally { setRunning(null); }
  }

  async function toggleChecklist(key: string) {
    if (!client) return;
    const checklist = { ...(client.checklist ?? {}), [key]: !client.checklist?.[key] };
    await updateClient(id, { checklist });
    setClient({ ...client, checklist });
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-subtext">Загрузка…</div>;
  if (!client) return <div className="text-red-400">Клиент не найден</div>;

  const journeyStep = client.journey_step ?? 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/clients" className="text-subtext hover:text-text transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xl">
            {client.name?.[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-text">{client.name}</h1>
            <p className="text-sm text-subtext">{client.niche} · {client.contact}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-green-400">${(client.income_now ?? 0).toLocaleString()}</p>
          <p className="text-xs text-subtext">→ ${(client.income_goal ?? 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={clsx("px-3 py-2 text-sm whitespace-nowrap transition-colors",
              tab === i ? "text-accent border-b-2 border-accent -mb-px" : "text-subtext hover:text-text")}>
            {t}
          </button>
        ))}
      </div>

      {/* Обзор */}
      {tab === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Подписчики", value: (client.followers ?? 0).toLocaleString() },
              { label: "Охват", value: (client.reach ?? 0).toLocaleString() },
              { label: "ER", value: `${client.engagement ?? 0}%` },
            ].map(({ label, value }) => (
              <div key={label} className="card text-center">
                <p className="text-2xl font-bold text-text">{value}</p>
                <p className="text-xs text-subtext mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-text mb-3">Journey ({journeyStep}/{JOURNEY.length})</h3>
            <div className="flex gap-2 flex-wrap">
              {JOURNEY.map((step, i) => (
                <span key={step} className={clsx("badge text-xs", i < journeyStep
                  ? "bg-green-900 text-green-300" : i === journeyStep
                  ? "bg-accent/20 text-accent border border-accent/40" : "bg-nav text-subtext")}>
                  {i + 1}. {step}
                </span>
              ))}
            </div>
          </div>

          {client.alerts?.length > 0 && (
            <div className="card border-yellow-500/30 bg-yellow-500/5">
              <h3 className="text-sm font-semibold text-yellow-400 mb-2">⚠️ Уведомления</h3>
              {client.alerts.map((a: string, i: number) => (
                <p key={i} className="text-xs text-yellow-300">{a}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Бренд */}
      {tab === 1 && (
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-text">Бренд</h3>
          {[
            { label: "Личность", key: "personality" },
            { label: "Стратегия", key: "strategy" },
          ].map(({ label, key }) => (
            <div key={key}>
              <p className="text-xs text-subtext mb-1">{label}</p>
              <p className="text-sm text-text bg-nav rounded-lg p-3">{client[key] || "—"}</p>
            </div>
          ))}
        </div>
      )}

      {/* Продукты */}
      {tab === 2 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-text mb-3">Продукты</h3>
          {client.products?.length > 0 ? (
            <ul className="space-y-2">
              {client.products.map((p: string, i: number) => (
                <li key={i} className="flex items-center gap-2 text-sm text-text">
                  <span className="w-5 h-5 rounded bg-accent/20 text-accent text-xs flex items-center justify-center font-bold">{i + 1}</span>
                  {p}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-subtext">Продукты не добавлены</p>}
        </div>
      )}

      {/* Воронка */}
      {tab === 3 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-text mb-3">Воронка продаж</h3>
          <pre className="text-sm text-text whitespace-pre-wrap bg-nav rounded-lg p-3 font-sans">
            {client.funnel || "Воронка не настроена"}
          </pre>
        </div>
      )}

      {/* Контент */}
      {tab === 4 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-text mb-3">Контент-план</h3>
          <pre className="text-sm text-text whitespace-pre-wrap bg-nav rounded-lg p-3 font-sans">
            {client.content_plan || "Контент-план не создан"}
          </pre>
        </div>
      )}

      {/* AI агенты */}
      {tab === 5 && (
        <div className="space-y-3">
          <p className="text-sm text-subtext">Запусти AI-агента для генерации контента</p>
          <div className="grid grid-cols-2 gap-3">
            {agents.map((a: any) => (
              <div key={a.id} className="card space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text">{a.name}</p>
                  <button
                    onClick={() => callAgent(a.id)}
                    disabled={running === a.id}
                    className="btn-primary flex items-center gap-1 py-1 px-2 text-xs"
                  >
                    {running === a.id ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} />}
                    Запустить
                  </button>
                </div>
                {agentResult[a.id] && (
                  <pre className="text-xs text-text whitespace-pre-wrap bg-nav rounded p-2 max-h-40 overflow-y-auto font-sans">
                    {agentResult[a.id]}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Чеклист */}
      {tab === 6 && (
        <div className="card space-y-2">
          <h3 className="text-sm font-semibold text-text mb-3">Чеклист онбординга</h3>
          {Object.entries(client.checklist ?? {}).map(([key, done]: any) => (
            <button key={key} onClick={() => toggleChecklist(key)}
              className="w-full flex items-center gap-3 py-2 hover:bg-white/5 rounded px-2 transition-colors">
              {done
                ? <CheckSquare size={16} className="text-green-400 shrink-0" />
                : <Square size={16} className="text-subtext shrink-0" />}
              <span className={clsx("text-sm", done ? "text-subtext line-through" : "text-text")}>{key}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
