"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { getClient, getAgents, runAgent, updateClient } from "@/lib/api";
import {
  ArrowLeft, Loader2, Zap, CheckSquare, Square,
  Edit2, Save, X, Plus, Trash2, Copy, Check,
  Download, FileText, Search, PlayCircle, Bot,
  Sparkles, Calendar, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import SavePanel from "@/components/SavePanel";
import MindMapEditor from "@/components/MindMapEditor";

// ── Content generator constants ───────────────────────────────────────────────
const GEN_TYPES: Record<string, string[]> = {
  Instagram: ["Рилс (озвучка)", "Сторис", "Карусель", "Пост"],
  Telegram:  ["Пост в канал", "Бот-серия"],
  TikTok:    ["Скрипт"],
  YouTube:   ["Скрипт"],
  Email:     ["Письмо"],
  Blog:      ["Статья"],
};
const TONES        = ["экспертный", "дружеский", "мотивирующий", "провокационный", "storytelling"];
const FUNNEL_GOALS = ["прогрев аудитории", "продажа продукта", "запись на звонок", "подписка", "лид-магнит"];

const CLIENT_SAVE_FIELDS = [
  { value: "content_plan",    label: "Контент-план" },
  { value: "strategy",        label: "Стратегия" },
  { value: "content_pack",    label: "Контент-пакет" },
  { value: "funnel",          label: "Воронка продаж" },
  { value: "producer_plan",   label: "План продюсера" },
  { value: "ad_creatives",    label: "Рекламные тексты" },
  { value: "analytics_report",label: "Аналитика" },
  { value: "sales_script",    label: "Скрипт продаж" },
];

const TABS = ["Задачи", "Обзор", "Бренд", "Продукты", "Воронка", "Контент", "AI агенты", "Карта смыслов"];

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

// ── Download helper (module-level) ────────────────────────────────────────────
function downloadResult(content: string, filename: string, ext: "txt" | "md") {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
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
  const [editBrand,    setEditBrand]    = useState(false);
  const [editFunnel,   setEditFunnel]   = useState(false);
  const [editContent,  setEditContent]  = useState(false);
  const [editOverview, setEditOverview] = useState(false);

  // Draft values (only used while in edit mode)
  const [draft, setDraft] = useState<Record<string, any>>({});

  // Products
  const [newProduct, setNewProduct] = useState("");

  // AI Задачи tab state
  const [analyzing,      setAnalyzing]      = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState<{ title: string; done: boolean }[]>([]);
  const [newTaskInput,   setNewTaskInput]   = useState("");

  // Checklist task AI execution
  const [taskRunning,    setTaskRunning]    = useState<string | null>(null);
  const [taskResults,    setTaskResults]    = useState<Record<string, string>>({});
  const [taskResultOpen, setTaskResultOpen] = useState<Record<string, boolean>>({});

  // Content generator (tab 5)
  const [contentPlatform,    setContentPlatform]    = useState("Instagram");
  const [contentType,        setContentType]        = useState("Рилс (озвучка)");
  const [contentTone,        setContentTone]        = useState("экспертный");
  const [contentGoal,        setContentGoal]        = useState("прогрев аудитории");
  const [contentTopic,       setContentTopic]       = useState("");
  const [contentRefText,     setContentRefText]     = useState("");
  const [contentMode,        setContentMode]        = useState<"create" | "rewrite">("create");
  const [contentResult,      setContentResult]      = useState("");
  const [contentGenerating,  setContentGenerating]  = useState(false);
  const [contentDate,        setContentDate]        = useState("");
  const [contentPlanEntries, setContentPlanEntries] = useState<{ date: string; platform: string; type: string; topic: string; text: string }[]>([]);

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
    strategist:     "strategy",
    copywriter:     "content_plan",
    funneler:       "funnel",
    productologist: "products_desc",
    planner:        "content_plan",
    unpackager:     "personality",
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

  async function removeChecklistItem(key: string) {
    if (!client) return;
    const checklist = { ...(client.checklist ?? {}) };
    delete checklist[key];
    setClient((prev: any) => ({ ...prev, checklist }));
    await save({ checklist });
  }

  async function addManualTask() {
    const title = newTaskInput.trim();
    if (!title) return;
    const checklist = { ...(client.checklist ?? {}), [title]: false };
    setClient((prev: any) => ({ ...prev, checklist }));
    setNewTaskInput("");
    await save({ checklist });
  }

  // ── Checklist task AI execution ─────────────────────────────────────────────
  async function runChecklistTask(taskTitle: string) {
    setTaskRunning(taskTitle);
    try {
      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          message: `Выполни задачу: «${taskTitle}». Клиент: ${client.name}, ниша: ${client.niche ?? "—"}. Создай детальный план выполнения или конкретный результат этой задачи.`,
          client_id: id,
          history:   [],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTaskResults((p) => ({ ...p, [taskTitle]: data.reply ?? "" }));
        setTaskResultOpen((p) => ({ ...p, [taskTitle]: true }));
      }
    } finally { setTaskRunning(null); }
  }

  // ── AI Analysis ─────────────────────────────────────────────────────────────
  async function analyzeClient() {
    setAnalyzing(true);
    setSuggestedTasks([]);
    try {
      const res = await fetch(`/api/clients/${id}/analyze`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setSuggestedTasks(data.tasks ?? []);
      }
    } finally { setAnalyzing(false); }
  }

  async function addSuggestedTasks() {
    const newChecklist = { ...(client.checklist ?? {}) };
    for (const t of suggestedTasks) {
      if (!Object.prototype.hasOwnProperty.call(newChecklist, t.title)) {
        newChecklist[t.title] = t.done;
      }
    }
    setClient((prev: any) => ({ ...prev, checklist: newChecklist }));
    await save({ checklist: newChecklist });
    setSuggestedTasks([]);
    showToast("Задачи добавлены ✓");
  }

  async function addSingleSuggestedTask(t: { title: string; done: boolean }) {
    const newChecklist = { ...(client.checklist ?? {}), [t.title]: t.done };
    setClient((prev: any) => ({ ...prev, checklist: newChecklist }));
    setSuggestedTasks((prev) => prev.filter((s) => s.title !== t.title));
    await save({ checklist: newChecklist });
  }

  // ── Content generator ───────────────────────────────────────────────────────
  async function generateContent() {
    if (contentMode === "create" && !contentTopic.trim()) { showToast("Введи тему контента"); return; }
    if (contentMode === "rewrite" && !contentRefText.trim()) { showToast("Вставь текст для переработки"); return; }
    setContentGenerating(true);
    setContentResult("⏳ Генерирую...");
    try {
      const user = {
        name:        client.name,
        niche:       client.niche ?? "",
        audience:    "",
        products:    (client.products ?? []).join(", "),
        revenue:     String(client.income_now ?? 0),
        subs:        String(client.followers ?? 0),
        avgCheck:    "",
        budget:      "500",
        channels:    [],
        tone:        contentTone,
        strategy:    client.strategy ?? "",
        personality: client.personality ?? "",
      };
      const res = await fetch("/api/hub", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          action: "content",
          data: {
            user,
            platform:    contentPlatform,
            contentType: contentType,
            tone:        contentTone,
            funnelGoal:  contentGoal,
            topic:       contentTopic,
            refText:     contentMode === "rewrite" ? contentRefText : "",
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "API error");
      setContentResult(json.result ?? "");
    } catch (e: any) {
      setContentResult("❌ " + e.message);
    } finally {
      setContentGenerating(false);
    }
  }

  async function saveContentToCalendar() {
    if (!contentDate) { showToast("Выбери дату"); return; }
    if (!contentResult) { showToast("Сначала сгенерируй контент"); return; }
    const entry = { date: contentDate, platform: contentPlatform, type: contentType, topic: contentTopic, text: contentResult };
    const updatedEntries = [...contentPlanEntries, entry];
    setContentPlanEntries(updatedEntries);
    // Append to client content_plan text
    const planText = updatedEntries
      .map((e) => `[${e.date}] ${e.platform} · ${e.type}\n${e.topic ? `Тема: ${e.topic}\n` : ""}${e.text}`)
      .join("\n\n---\n\n");
    await save({ content_plan: planText });
    showToast("📅 Добавлено в контент-план");
  }

  async function saveContentToField(field: string) {
    if (!contentResult) return;
    await save({ [field]: contentResult });
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

  // Checklist derived values
  const checklistEntries = Object.entries(client.checklist ?? {}) as [string, boolean][];
  const checklistTotal = checklistEntries.length;
  const checklistDone  = checklistEntries.filter(([, v]) => v).length;
  const checklistPct   = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;

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

      {/* ══════════════════ TAB 0 — ЗАДАЧИ ══════════════════════════════════ */}
      {tab === 0 && (
        <div className="space-y-4">
          {/* Header row */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-text">Задачи клиента</h3>
            <div className="flex gap-2">
              <button
                onClick={analyzeClient}
                disabled={analyzing}
                className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3"
              >
                {analyzing
                  ? <><Loader2 size={11} className="animate-spin" /> Анализирую…</>
                  : <><Search size={11} /> Обновить задачи (AI)</>}
              </button>
              {suggestedTasks.length > 0 && (
                <button
                  onClick={addSuggestedTasks}
                  className="btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3 text-green-400 border border-green-400/30 hover:bg-green-400/10"
                >
                  <Plus size={11} /> Добавить все [{suggestedTasks.length}]
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {checklistTotal > 0 && (
            <div className="card py-3">
              <div className="flex justify-between text-xs text-subtext mb-2">
                <span>Прогресс выполнения</span>
                <span className="font-medium text-text">{checklistDone}/{checklistTotal} ({checklistPct}%)</span>
              </div>
              <div className="h-2 bg-nav rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${checklistPct}%` }}
                />
              </div>
            </div>
          )}

          {/* AI analyzing spinner */}
          {analyzing && (
            <div className="card flex items-center gap-3 text-subtext">
              <Loader2 size={16} className="animate-spin text-accent" />
              <span className="text-sm">AI анализирует профиль клиента…</span>
            </div>
          )}

          {/* Suggested tasks preview */}
          {suggestedTasks.length > 0 && (
            <div className="card border border-accent/30 bg-accent/5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-accent">
                  Предлагаемые задачи ({suggestedTasks.length})
                </p>
                <button
                  onClick={addSuggestedTasks}
                  className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1"
                >
                  <Plus size={10} /> Добавить все
                </button>
              </div>
              {suggestedTasks.map((t, i) => (
                <div key={i} className="flex items-center gap-2 group">
                  {t.done
                    ? <CheckSquare size={14} className="text-green-400 shrink-0" />
                    : <Square      size={14} className="text-subtext shrink-0" />}
                  <span className={clsx("text-xs flex-1", t.done ? "text-subtext line-through" : "text-text")}>
                    {t.title}
                  </span>
                  <button
                    onClick={() => addSingleSuggestedTask(t)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-accent hover:text-accent/80 p-1 rounded hover:bg-accent/10"
                    title="Добавить"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Checklist items */}
          <div className="card space-y-1">
            {checklistEntries.length === 0 && (
              <p className="text-sm text-subtext italic py-2">
                Чеклист пуст — нажмите «Обновить задачи (AI)» или добавьте вручную
              </p>
            )}
            {checklistEntries.map(([key, done]) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center gap-2 group py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors">
                  <button onClick={() => toggleChecklist(key)} className="flex items-center gap-2 flex-1 text-left">
                    {done
                      ? <CheckSquare size={16} className="text-green-400 shrink-0" />
                      : <Square      size={16} className="text-subtext shrink-0" />}
                    <span className={clsx("text-sm", done ? "text-subtext line-through" : "text-text")}>
                      {key}
                    </span>
                  </button>

                  {/* Start button */}
                  {!done && (
                    <button
                      onClick={() => runChecklistTask(key)}
                      disabled={taskRunning === key}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/15 text-accent text-[10px] font-medium hover:bg-accent/25 disabled:opacity-50 transition-all"
                    >
                      {taskRunning === key
                        ? <Loader2 size={9} className="animate-spin" />
                        : <PlayCircle size={9} />}
                      {taskRunning === key ? "AI работает…" : "▶ Старт"}
                    </button>
                  )}

                  {/* AI result indicator */}
                  {taskResults[key] && (
                    <button
                      onClick={() => setTaskResultOpen((p) => ({ ...p, [key]: !p[key] }))}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors"
                    >
                      <Bot size={9} /> AI
                    </button>
                  )}

                  <button
                    onClick={() => removeChecklistItem(key)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-400/10"
                    title="Удалить"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* AI result panel */}
                {taskResults[key] && taskResultOpen[key] && (
                  <div className="mx-2 mb-1 space-y-1.5 border-l-2 border-accent/30 pl-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] text-subtext">
                        <Bot size={10} className="text-accent" />
                        <span className="text-accent font-medium">AI результат</span>
                        <span className="text-subtext/40">·</span>
                        <span className="text-emerald-400">выполнено</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(taskResults[key]);
                          }}
                          className="flex items-center gap-0.5 text-[9px] text-subtext hover:text-text px-1 py-0.5 rounded border border-border hover:bg-white/5 transition-colors"
                        >
                          <Copy size={8} /> Копировать
                        </button>
                        <button
                          onClick={() => downloadResult(taskResults[key], `task_${key.slice(0, 20)}`, "txt")}
                          className="text-[9px] text-subtext hover:text-text px-1 py-0.5 rounded border border-border hover:bg-white/5 transition-colors"
                        >
                          .txt
                        </button>
                        <button
                          onClick={() => downloadResult(taskResults[key], `task_${key.slice(0, 20)}`, "md")}
                          className="text-[9px] text-subtext hover:text-text px-1 py-0.5 rounded border border-border hover:bg-white/5 transition-colors"
                        >
                          .md
                        </button>
                        <button
                          onClick={() => setTaskResultOpen((p) => ({ ...p, [key]: false }))}
                          className="p-0.5 text-subtext/40 hover:text-text rounded transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    </div>
                    <pre className="text-[10px] text-text/80 whitespace-pre-wrap leading-relaxed font-sans max-h-48 overflow-y-auto bg-background/50 rounded-lg p-2.5">
                      {taskResults[key]}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add task manually */}
          <div className="flex gap-2">
            <input
              placeholder="Добавить задачу вручную…"
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addManualTask()}
              className="input flex-1 text-sm"
            />
            <button
              onClick={addManualTask}
              disabled={!newTaskInput.trim() || saving}
              className="btn-primary flex items-center gap-1 text-sm"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Добавить
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════ TAB 1 — ОБЗОР ═══════════════════════════════════ */}
      {tab === 1 && (
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
                  { label: "Подписчики",        key: "followers"   },
                  { label: "Охват",              key: "reach"       },
                  { label: "ER (%)",             key: "engagement"  },
                  { label: "Доход сейчас ($)",   key: "income_now"  },
                  { label: "Цель ($)",           key: "income_goal" },
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

      {/* ══════════════════ TAB 2 — БРЕНД ═══════════════════════════════════ */}
      {tab === 2 && (
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

      {/* ══════════════════ TAB 3 — ПРОДУКТЫ ════════════════════════════════ */}
      {tab === 3 && (
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

      {/* ══════════════════ TAB 4 — ВОРОНКА ═════════════════════════════════ */}
      {tab === 4 && (
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

      {/* ══════════════════ TAB 5 — КОНТЕНТ ═════════════════════════════════ */}
      {tab === 5 && (
        <div className="space-y-4">
          {/* Section header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-semibold text-text">Генератор контента</h3>
              <p className="text-xs text-subtext mt-0.5">{client.name} · {client.niche}</p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-2">
            {(["create", "rewrite"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setContentMode(m)}
                className={clsx(
                  "py-2 rounded-xl border-2 text-sm font-semibold transition-all",
                  contentMode === m
                    ? "bg-accent text-white border-accent"
                    : "border-border text-subtext bg-transparent hover:border-accent/40"
                )}
              >
                {m === "create" ? "✦ Создать" : "↺ Переработать"}
              </button>
            ))}
          </div>

          {/* Platform */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-subtext mb-2">Платформа</p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(GEN_TYPES).map((p) => (
                <button
                  key={p}
                  onClick={() => { setContentPlatform(p); setContentType(GEN_TYPES[p][0]); }}
                  className={clsx(
                    "px-3 py-1.5 rounded-full text-xs border transition-all",
                    contentPlatform === p
                      ? "bg-accent/20 text-accent border-accent/50"
                      : "border-border text-subtext hover:border-accent/30 hover:text-text"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-subtext mb-2">Формат</p>
            <div className="flex flex-wrap gap-2">
              {(GEN_TYPES[contentPlatform] || ["Пост"]).map((t) => (
                <button
                  key={t}
                  onClick={() => setContentType(t)}
                  className={clsx(
                    "px-3 py-1.5 rounded-full text-xs border transition-all",
                    contentType === t
                      ? "bg-accent/20 text-accent border-accent/50"
                      : "border-border text-subtext hover:border-accent/30 hover:text-text"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-subtext mb-2">Тон</p>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setContentTone(t)}
                  className={clsx(
                    "px-3 py-1.5 rounded-full text-xs border transition-all",
                    contentTone === t
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/50"
                      : "border-border text-subtext hover:border-purple-500/30 hover:text-text"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Funnel goal */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-subtext mb-2">Цель</p>
            <div className="flex flex-wrap gap-2">
              {FUNNEL_GOALS.map((g) => (
                <button
                  key={g}
                  onClick={() => setContentGoal(g)}
                  className={clsx(
                    "px-3 py-1.5 rounded-full text-xs border transition-all",
                    contentGoal === g
                      ? "bg-green-500/20 text-green-300 border-green-500/50"
                      : "border-border text-subtext hover:border-green-500/30 hover:text-text"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          {contentMode === "create" ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-subtext mb-2">Тема</p>
              <textarea
                rows={3}
                className="input w-full resize-none text-sm"
                placeholder={`Например: Как ${client.name} вышла на $${(client.income_goal ?? 10000).toLocaleString()} за 3 месяца...`}
                value={contentTopic}
                onChange={(e) => setContentTopic(e.target.value)}
              />
            </div>
          ) : (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-subtext mb-2">Текст для переработки</p>
              <textarea
                rows={5}
                className="input w-full resize-y text-sm"
                placeholder="Вставь текст, который нужно переработать под стиль клиента..."
                value={contentRefText}
                onChange={(e) => setContentRefText(e.target.value)}
              />
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={generateContent}
            disabled={contentGenerating}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
          >
            {contentGenerating
              ? <><Loader2 size={15} className="animate-spin" /> Генерирую…</>
              : <><Sparkles size={15} /> Сгенерировать контент</>}
          </button>

          {/* Result */}
          {contentResult && contentResult !== "⏳ Генерирую..." && (
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text">Готовый текст</p>
                <button
                  onClick={generateContent}
                  disabled={contentGenerating}
                  className="btn-ghost flex items-center gap-1 text-xs"
                >
                  <RefreshCw size={11} /> Ещё вариант
                </button>
              </div>

              {/* Platform preview */}
              <div className="rounded-xl overflow-hidden border border-border">
                <div className="flex items-center gap-2 bg-nav/60 px-3 py-2">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs">
                    {contentPlatform === "Instagram" ? "📸" : contentPlatform === "Telegram" ? "✈️" : contentPlatform === "YouTube" ? "▶️" : "📱"}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text">{contentPlatform}</p>
                    <p className="text-[10px] text-subtext">@{client.name?.toLowerCase().replace(/\s/g, "") || "handle"}</p>
                  </div>
                  <span className="ml-auto text-[10px] text-subtext/60 bg-nav px-2 py-0.5 rounded-full">{contentType}</span>
                </div>
                <pre className="text-xs text-text whitespace-pre-wrap bg-surface p-3 max-h-60 overflow-y-auto leading-relaxed font-sans">
                  {contentResult}
                </pre>
              </div>

              {/* Save panel */}
              <SavePanel
                content={contentResult}
                filename={`content_${client.name}_${contentPlatform}`}
                saveFields={CLIENT_SAVE_FIELDS}
                onSave={saveContentToField}
                saving={saving}
              />

              {/* Add to calendar */}
              <div className="flex gap-2 pt-1 border-t border-border">
                <input
                  type="date"
                  className="input flex-1 text-xs py-1.5"
                  value={contentDate}
                  onChange={(e) => setContentDate(e.target.value)}
                />
                <button
                  onClick={saveContentToCalendar}
                  disabled={saving}
                  className="btn-ghost flex items-center gap-1.5 text-xs whitespace-nowrap"
                >
                  <Calendar size={12} /> В контент-план
                </button>
              </div>
            </div>
          )}

          {/* Existing content plan view */}
          {client.content_plan && (
            <div className="card space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-subtext uppercase tracking-wider">Сохранённый контент-план</p>
                <button
                  onClick={() => { setDraft({ content_plan: client.content_plan ?? "" }); setEditContent(true); }}
                  className="btn-ghost flex items-center gap-1 text-xs"
                >
                  <Edit2 size={11} /> Изменить
                </button>
              </div>
              {editContent ? (
                <div className="space-y-2">
                  <textarea
                    rows={8}
                    value={draft.content_plan ?? ""}
                    onChange={(e) => setDraft((d: any) => ({ ...d, content_plan: e.target.value }))}
                    className="input w-full resize-y text-xs font-mono"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setEditContent(false)} className="btn-ghost text-xs flex items-center gap-1">
                      <X size={11} /> Отмена
                    </button>
                    <button disabled={saving} onClick={async () => { await save({ content_plan: draft.content_plan }); setEditContent(false); }}
                      className="btn-primary flex items-center gap-1 text-xs">
                      {saving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />} Сохранить
                    </button>
                  </div>
                </div>
              ) : (
                <pre className="text-xs text-text whitespace-pre-wrap bg-nav rounded-lg p-3 max-h-52 overflow-y-auto font-sans leading-relaxed">
                  {client.content_plan}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ TAB 7 — КАРТА СМЫСЛОВ ══════════════════════════ */}
      {tab === 7 && (
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-text">Карта смыслов и путь клиента</h3>
              <p className="text-xs text-subtext mt-0.5">Визуальная майнд-карта: смыслы бренда, путь покупателя, продукты, воронка</p>
            </div>
          </div>
          <MindMapEditor
            client={client}
            onSave={async (data) => { await save({ mind_map: data }); }}
          />
        </div>
      )}

      {/* ══════════════════ TAB 6 — AI АГЕНТЫ ═══════════════════════════════ */}
      {tab === 6 && (
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
                    <SavePanel
                      content={agentResult[a.id]}
                      filename={`${a.id}_${client.name}`}
                      saveFields={AGENT_FIELD_MAP[a.id] ? CLIENT_SAVE_FIELDS : undefined}
                      onSave={(field) => save({ [field]: agentResult[a.id] })}
                      saving={saving}
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
