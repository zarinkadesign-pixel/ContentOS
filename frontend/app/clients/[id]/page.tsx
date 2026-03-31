"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { getClient, getAgents, runAgent, updateClient } from "@/lib/api";
import {
  ArrowLeft, Loader2, Zap, CheckSquare, Square,
  Edit2, Save, X, Plus, Trash2, Copy, Check,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const TABS = ["Обзор", "Бренд", "Продукты", "Воронка", "Контент", "AI агенты", "Чеклист"];

const JOURNEY = [
  "Онбординг", "Распаковка", "Продукты", "Воронка",
  "Контент-план", "Подкаст", "Автоклипы", "Реклама", "Аналитика",
];

// ── Small helpers ──────────────────────────────────────────────────────────────
function Toast({ msg }: { msg: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-green-800 text-green-100 text-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
      <Check size={14} /> {msg}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();

  const [client,      setClient]      = useState<any>(null);
  const [agents,      setAgents]      = useState<any[]>([]);
  const [tab,         setTab]         = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [agentResult, setAgentResult] = useState<Record<string, string>>({});
  const [running,     setRunning]     = useState<string | null>(null);
  const [toast,       setToast]       = useState("");
  const [saving,      setSaving]      = useState(false);
  const [copied,      setCopied]      = useState<string | null>(null);

  // Edit-mode state per-tab
  const [editBrand,   setEditBrand]   = useState(false);
  const [editFunnel,  setEditFunnel]  = useState(false);
  const [editContent, setEditContent] = useState(false);
  const [editOverview,setEditOverview]= useState(false);

  // Draft values (only used while in edit mode)
  const [draft, setDraft] = useState<Record<string, any>>({});

  // Products
  const [newProduct, setNewProduct] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [c, a] = await Promise.all([getClient(id), getAgents()]);
      setClient(c); setAgents(a);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  // ── Show toast for 2.5 s ────────────────────────────────────────────────────
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  // ── Generic save helper ─────────────────────────────────────────────────────
  async function save(data: Record<string, any>) {
    setSaving(true);
    try {
      const updated = await updateClient(id, data);
      setClient((prev: any) => ({ ...prev, ...updated }));
      showToast("Сохранено ✓");
    } catch {
      showToast("Ошибка сохранения");
    } finally { setSaving(false); }
  }

  // ── Agents ──────────────────────────────────────────────────────────────────
  async function callAgent(agentType: string) {
    setRunning(agentType);
    try {
      const res = await runAgent(agentType, id);
      setAgentResult((prev) => ({ ...prev, [agentType]: res.result }));
    } catch (e: any) {
      setAgentResult((prev) => ({ ...prev, [agentType]: `Ошибка: ${e.message}` }));
    } finally { setRunning(null); }
  }

  // Save agent result to the matching client field
  const AGENT_FIELD_MAP: Record<string, string> = {
    strategist:    "strategy",
    copywriter:    "content_plan",
    funneler:      "funnel",
    productologist:"products_desc",
    planner:       "content_plan",
    unpackager:    "personality",
  };
  async function saveAgentResult(agentId: string) {
    const field = AGENT_FIELD_MAP[agentId];
    if (!field || !agentResult[agentId]) return;
    await save({ [field]: agentResult[agentId] });
  }

  async function copyAgent(agentId: string) {
    await navigator.clipboard.writeText(agentResult[agentId] ?? "");
    setCopied(agentId);
    setTimeout(() => setCopied(null), 1500);
  }

  // ── Checklist ───────────────────────────────────────────────────────────────
  async function toggleChecklist(key: string) {
    if (!client) return;
    const checklist = { ...(client.checklist ?? {}), [key]: !client.checklist?.[key] };
    setClient((prev: any) => ({ ...prev, checklist }));
    await save({ checklist });
  }

  // ── Products ────────────────────────────────────────────────────────────────
  async function addProduct() {
    const trimmed = newProduct.trim();
    if (!trimmed) return;
    const products = [...(client.products ?? []), trimmed];
    setNewProduct("");
    setClient((prev: any) => ({ ...prev, products }));
    await save({ products });
  }

  async function removeProduct(i: number) {
    const products = (client.products ?? []).filter((_: any, idx: number) => idx !== i);
    setClient((prev: any) => ({ ...prev, products }));
    await save({ products });
  }

  // ── Journey step ────────────────────────────────────────────────────────────
  async function setJourneyStep(step: number) {
    setClient((prev: any) => ({ ...prev, journey_step: step }));
    await save({ journey_step: step });
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-subtext">
      <Loader2 size={20} className="animate-spin mr-2" /> Загрузка…
    </div>
  );
  if (!client) return <div className="text-red-400">Клиент не найден</div>;

  const journeyStep = client.journey_step ?? 0;

  return (
    <div className="space-y-5">
      {toast && <Toast msg={toast} />}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
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

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={clsx("px-3 py-2 text-sm whitespace-nowrap transition-colors",
              tab === i
                ? "text-accent border-b-2 border-accent -mb-px"
                : "text-subtext hover:text-text")}>
            {t}
          </button>
        ))}
      </div>

      {/* ══════════════════ TAB 0 — ОБЗОР ═══════════════════════════════════ */}
      {tab === 0 && (
        <div className="space-y-4">
          {/* Metrics */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text">Метрики</h3>
              {!editOverview
                ? <button onClick={() => { setDraft({ ...client }); setEditOverview(true); }}
                    className="btn-ghost flex items-center gap-1 text-xs">
                    <Edit2 size={12} /> Изменить
                  </button>
                : <div className="flex gap-2">
                    <button onClick={() => setEditOverview(false)} className="btn-ghost text-xs flex items-center gap-1">
                      <X size={12} /> Отмена
                    </button>
                    <button disabled={saving} onClick={async () => {
                      await save({
                        followers:   Number(draft.followers),
                        reach:       Number(draft.reach),
                        engagement:  Number(draft.engagement),
                        income_now:  Number(draft.income_now),
                        income_goal: Number(draft.income_goal),
                      });
                      setEditOverview(false);
                    }} className="btn-primary flex items-center gap-1 text-xs">
                      {saving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                      Сохранить
                    </button>
                  </div>
              }
            </div>

            {!editOverview ? (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Подписчики", value: (client.followers ?? 0).toLocaleString() },
                  { label: "Охват",      value: (client.reach ?? 0).toLocaleString() },
                  { label: "ER",         value: `${client.engagement ?? 0}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-nav rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-text">{value}</p>
                    <p className="text-xs text-subtext mt-1">{label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Подписчики", key: "followers" },
                  { label: "Охват",      key: "reach" },
                  { label: "ER (%)",     key: "engagement" },
                  { label: "Доход сейчас ($)", key: "income_now" },
                  { label: "Цель ($)",   key: "income_goal" },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="text-xs text-subtext block mb-1">{label}</label>
                    <input type="number" value={draft[key] ?? ""} onChange={e => setDraft((d: any) => ({ ...d, [key]: e.target.value }))}
                      className="input w-full" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Journey */}
          <div className="card">
            <h3 className="text-sm font-semibold text-text mb-3">Journey ({journeyStep}/{JOURNEY.length})</h3>
            <div className="flex gap-2 flex-wrap">
              {JOURNEY.map((step, i) => (
                <button key={step} onClick={() => setJourneyStep(i + 1)}
                  className={clsx("badge text-xs transition-all cursor-pointer hover:opacity-80",
                    i < journeyStep
                      ? "bg-green-900 text-green-300"
                      : i === journeyStep
                      ? "bg-accent/20 text-accent border border-accent/40"
                      : "bg-nav text-subtext")}>
                  {i + 1}. {step}
                </button>
              ))}
            </div>
            <p className="text-xs text-subtext mt-2">Нажми на шаг чтобы отметить выполненным</p>
          </div>

          {/* Alerts */}
          {client.alerts?.length > 0 && (
            <div className="card border border-yellow-500/30 bg-yellow-500/5">
              <h3 className="text-sm font-semibold text-yellow-400 mb-2">⚠️ Уведомления</h3>
              {client.alerts.map((a: string, i: number) => (
                <p key={i} className="text-xs text-yellow-300">{a}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ TAB 1 — БРЕНД ═══════════════════════════════════ */}
      {tab === 1 && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text">Бренд</h3>
            {!editBrand
              ? <button onClick={() => { setDraft({ personality: client.personality ?? "", strategy: client.strategy ?? "" }); setEditBrand(true); }}
                  className="btn-ghost flex items-center gap-1 text-xs">
                  <Edit2 size={12} /> Изменить
                </button>
              : <div className="flex gap-2">
                  <button onClick={() => setEditBrand(false)} className="btn-ghost text-xs flex items-center gap-1">
                    <X size={12} /> Отмена
                  </button>
                  <button disabled={saving} onClick={async () => {
                    await save({ personality: draft.personality, strategy: draft.strategy });
                    setEditBrand(false);
                  }} className="btn-primary flex items-center gap-1 text-xs">
                    {saving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                    Сохранить
                  </button>
                </div>
            }
          </div>

          {[
            { label: "Личность бренда", key: "personality", hint: "Голос, тон, стиль общения" },
            { label: "Стратегия",       key: "strategy",    hint: "Основной вектор продвижения" },
          ].map(({ label, key, hint }) => (
            <div key={key}>
              <p className="text-xs text-subtext mb-1">{label}</p>
              {editBrand
                ? <>
                    <p className="text-xs text-subtext/60 mb-1">{hint}</p>
                    <textarea rows={4} value={draft[key] ?? ""} onChange={e => setDraft((d: any) => ({ ...d, [key]: e.target.value }))}
                      className="input w-full resize-y text-sm" />
                  </>
                : <p className="text-sm text-text bg-nav rounded-lg p-3 min-h-[44px]">{client[key] || <span className="text-subtext/50 italic">Не заполнено</span>}</p>
              }
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════ TAB 2 — ПРОДУКТЫ ════════════════════════════════ */}
      {tab === 2 && (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-text">Продукты</h3>

          {/* Product list */}
          {client.products?.length > 0 ? (
            <ul className="space-y-2">
              {client.products.map((p: string, i: number) => (
                <li key={i} className="flex items-center gap-2 group">
                  <span className="w-5 h-5 shrink-0 rounded bg-accent/20 text-accent text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <span className="text-sm text-text flex-1">{p}</span>
                  <button onClick={() => removeProduct(i)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-400/10">
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-subtext italic">Продукты не добавлены</p>
          )}

          {/* Add new product */}
          <div className="flex gap-2 pt-1 border-t border-border">
            <input
              placeholder="Название и цена, напр. «Менторинг $1500»"
              value={newProduct}
              onChange={e => setNewProduct(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addProduct()}
              className="input flex-1 text-sm"
            />
            <button onClick={addProduct} disabled={!newProduct.trim() || saving}
              className="btn-primary flex items-center gap-1 text-sm">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Добавить
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════ TAB 3 — ВОРОНКА ═════════════════════════════════ */}
      {tab === 3 && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text">Воронка продаж</h3>
            {!editFunnel
              ? <button onClick={() => { setDraft({ funnel: client.funnel ?? "" }); setEditFunnel(true); }}
                  className="btn-ghost flex items-center gap-1 text-xs">
                  <Edit2 size={12} /> Изменить
                </button>
              : <div className="flex gap-2">
                  <button onClick={() => setEditFunnel(false)} className="btn-ghost text-xs flex items-center gap-1">
                    <X size={12} /> Отмена
                  </button>
                  <button disabled={saving} onClick={async () => {
                    await save({ funnel: draft.funnel });
                    setEditFunnel(false);
                  }} className="btn-primary flex items-center gap-1 text-xs">
                    {saving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                    Сохранить
                  </button>
                </div>
            }
          </div>

          {editFunnel ? (
            <textarea rows={8} value={draft.funnel ?? ""} onChange={e => setDraft((d: any) => ({ ...d, funnel: e.target.value }))}
              placeholder="Reels → подписка → бесплатный гайд → созвон → оффер"
              className="input w-full resize-y text-sm font-mono" />
          ) : (
            <pre className="text-sm text-text whitespace-pre-wrap bg-nav rounded-lg p-3 font-sans min-h-[60px]">
              {client.funnel || <span className="text-subtext/50 italic">Воронка не настроена</span>}
            </pre>
          )}
        </div>
      )}

      {/* ══════════════════ TAB 4 — КОНТЕНТ ═════════════════════════════════ */}
      {tab === 4 && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text">Контент-план</h3>
            {!editContent
              ? <button onClick={() => { setDraft({ content_plan: client.content_plan ?? "" }); setEditContent(true); }}
                  className="btn-ghost flex items-center gap-1 text-xs">
                  <Edit2 size={12} /> Изменить
                </button>
              : <div className="flex gap-2">
                  <button onClick={() => setEditContent(false)} className="btn-ghost text-xs flex items-center gap-1">
                    <X size={12} /> Отмена
                  </button>
                  <button disabled={saving} onClick={async () => {
                    await save({ content_plan: draft.content_plan });
                    setEditContent(false);
                  }} className="btn-primary flex items-center gap-1 text-xs">
                    {saving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                    Сохранить
                  </button>
                </div>
            }
          </div>

          {editContent ? (
            <textarea rows={10} value={draft.content_plan ?? ""} onChange={e => setDraft((d: any) => ({ ...d, content_plan: e.target.value }))}
              placeholder={"Пн: совет по питанию\nСр: кейс клиента\nПт: Reels\nВс: подкаст"}
              className="input w-full resize-y text-sm font-mono" />
          ) : (
            <pre className="text-sm text-text whitespace-pre-wrap bg-nav rounded-lg p-3 font-sans min-h-[60px]">
              {client.content_plan || <span className="text-subtext/50 italic">Контент-план не создан</span>}
            </pre>
          )}
        </div>
      )}

      {/* ══════════════════ TAB 5 — AI АГЕНТЫ ═══════════════════════════════ */}
      {tab === 5 && (
        <div className="space-y-3">
          <p className="text-sm text-subtext">Запусти AI-агента — результат можно сохранить в профиль клиента</p>
          <div className="grid grid-cols-1 gap-3">
            {agents.map((a: any) => (
              <div key={a.id} className="card space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text">{a.name}</p>
                  <button onClick={() => callAgent(a.id)} disabled={running === a.id}
                    className="btn-primary flex items-center gap-1 py-1 px-3 text-xs">
                    {running === a.id
                      ? <><Loader2 size={10} className="animate-spin" /> Генерирую…</>
                      : <><Zap size={10} /> Запустить</>}
                  </button>
                </div>

                {agentResult[a.id] && (
                  <>
                    <pre className="text-xs text-text whitespace-pre-wrap bg-nav rounded p-3 max-h-52 overflow-y-auto font-sans leading-relaxed">
                      {agentResult[a.id]}
                    </pre>
                    <div className="flex gap-2">
                      <button onClick={() => copyAgent(a.id)}
                        className="btn-ghost flex items-center gap-1 text-xs">
                        {copied === a.id ? <><Check size={11} /> Скопировано</> : <><Copy size={11} /> Копировать</>}
                      </button>
                      {AGENT_FIELD_MAP[a.id] && (
                        <button onClick={() => saveAgentResult(a.id)} disabled={saving}
                          className="btn-ghost flex items-center gap-1 text-xs text-accent hover:text-accent/80">
                          {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                          Сохранить в профиль
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════ TAB 6 — ЧЕКЛИСТ ═════════════════════════════════ */}
      {tab === 6 && (
        <div className="card space-y-1">
          <h3 className="text-sm font-semibold text-text mb-3">Чеклист онбординга</h3>
          {Object.entries(client.checklist ?? {}).length === 0 && (
            <p className="text-sm text-subtext italic">Чеклист пуст</p>
          )}
          {Object.entries(client.checklist ?? {}).map(([key, done]: any) => (
            <button key={key} onClick={() => toggleChecklist(key)}
              className="w-full flex items-center gap-3 py-2.5 hover:bg-white/5 rounded-lg px-2 transition-colors text-left">
              {done
                ? <CheckSquare size={16} className="text-green-400 shrink-0" />
                : <Square      size={16} className="text-subtext shrink-0" />}
              <span className={clsx("text-sm", done ? "text-subtext line-through" : "text-text")}>{key}</span>
            </button>
          ))}

          {/* Progress bar */}
          {Object.keys(client.checklist ?? {}).length > 0 && (() => {
            const total = Object.keys(client.checklist).length;
            const done  = Object.values(client.checklist).filter(Boolean).length;
            const pct   = Math.round((done / total) * 100);
            return (
              <div className="pt-3 border-t border-border mt-2">
                <div className="flex justify-between text-xs text-subtext mb-1">
                  <span>Прогресс</span><span>{done}/{total}</span>
                </div>
                <div className="h-1.5 bg-nav rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
