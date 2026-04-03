"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Zap, CheckCircle2, XCircle, Clock, PlayCircle, RefreshCw,
  ChevronDown, ChevronRight, Bot, AlertCircle, Loader2, Plus, X,
  Sparkles, DollarSign, Target, User, Download, FileText,
  MessageSquare, Send, Copy, Check,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AutomationStep {
  id: string; name: string; worker_id: string;
  status: "pending" | "running" | "done" | "error";
  result: string; started_at: string | null; completed_at: string | null;
}
interface AutomationRun {
  id: string; client_id: string; client_name: string; client_niche: string;
  status: "queued" | "running" | "done" | "error";
  trigger: "new_client" | "manual" | "scheduled";
  created_at: string; completed_at: string | null;
  steps: AutomationStep[];
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function elapsed(start: string | null, end: string | null): string {
  if (!start) return "";
  const ms = new Date(end ?? new Date()).getTime() - new Date(start).getTime();
  if (ms < 60_000) return `${Math.round(ms / 1000)}с`;
  return `${Math.round(ms / 60_000)}м`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("ru", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

const TRIGGER_LABELS: Record<string, string> = {
  new_client: "Новый клиент",
  manual:     "Вручную",
  scheduled:  "По расписанию",
};

const STATUS_COLORS: Record<string, string> = {
  queued:  "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  running: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  done:    "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  error:   "text-red-400 bg-red-400/10 border-red-400/20",
};

const STATUS_LABELS: Record<string, string> = {
  queued:  "В очереди",
  running: "Работает",
  done:    "Готово",
  error:   "Ошибка",
  pending: "Ожидание",
};

const WORKER_EMOJI: Record<string, string> = {
  producer:   "🎬",
  strategist: "🧠",
  copywriter: "✍️",
  metaads:    "📣",
};

// ── Step card ─────────────────────────────────────────────────────────────────
function StepCard({ step }: { step: AutomationStep }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <span className="text-lg">{WORKER_EMOJI[step.worker_id] ?? "🤖"}</span>
        <span className="flex-1 text-left text-sm font-medium text-text">{step.name}</span>

        {step.started_at && (
          <span className="text-xs text-subtext mr-2">
            {elapsed(step.started_at, step.completed_at)}
          </span>
        )}

        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[step.status]}`}>
          {step.status === "running"
            ? <span className="flex items-center gap-1"><Loader2 size={10} className="animate-spin" />{STATUS_LABELS[step.status]}</span>
            : STATUS_LABELS[step.status]}
        </span>

        {step.result && (open ? <ChevronDown size={14} className="text-subtext ml-1" /> : <ChevronRight size={14} className="text-subtext ml-1" />)}
      </button>

      {open && step.result && (
        <div className="px-4 pb-4 border-t border-border">
          <pre className="mt-3 text-xs text-text/80 whitespace-pre-wrap leading-relaxed font-sans max-h-72 overflow-y-auto">
            {step.result}
          </pre>
          {step.status === "done" && (
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => downloadResult(step.result, `${step.worker_id}_${step.id}`, "txt")}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:bg-white/5 text-subtext hover:text-text transition-colors"
              >
                <Download size={11} /> ⬇ .txt
              </button>
              <button
                onClick={() => downloadResult(step.result, `${step.worker_id}_${step.id}`, "md")}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:bg-white/5 text-subtext hover:text-text transition-colors"
              >
                <FileText size={11} /> ⬇ .md
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Run card ──────────────────────────────────────────────────────────────────
function RunCard({
  run,
  onExecute,
  executing,
}: {
  run: AutomationRun;
  onExecute: (id: string) => void;
  executing: string | null;
}) {
  const [open, setOpen] = useState(false);
  const done  = run.steps.filter((s) => s.status === "done").length;
  const total = run.steps.length;
  const pct   = Math.round((done / total) * 100);

  return (
    <div className={`bg-nav border rounded-xl overflow-hidden transition-all ${
      run.status === "running" ? "border-blue-500/50 shadow-lg shadow-blue-500/5" : "border-border"
    }`}>
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${
            run.status === "done"    ? "bg-emerald-500/15" :
            run.status === "running" ? "bg-blue-500/15" :
            run.status === "error"   ? "bg-red-500/15" : "bg-yellow-500/15"
          }`}>
            {run.status === "done"    ? <CheckCircle2 size={20} className="text-emerald-400" /> :
             run.status === "running" ? <Loader2 size={20} className="text-blue-400 animate-spin" /> :
             run.status === "error"   ? <XCircle size={20} className="text-red-400" /> :
                                        <Clock size={20} className="text-yellow-400" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-text">{run.client_name}</span>
              <span className="text-xs text-subtext bg-white/5 px-2 py-0.5 rounded-full">{run.client_niche}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[run.status]}`}>
                {STATUS_LABELS[run.status]}
              </span>
              <span className="text-xs text-subtext bg-white/5 px-2 py-0.5 rounded-full">
                {TRIGGER_LABELS[run.trigger]}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-subtext">
              <span>Создан: {fmtDate(run.created_at)}</span>
              {run.completed_at && <span>Завершён: {fmtDate(run.completed_at)}</span>}
              {run.completed_at && <span>Время: {elapsed(run.created_at, run.completed_at)}</span>}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    run.status === "error" ? "bg-red-500" :
                    run.status === "done"  ? "bg-emerald-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-subtext w-14 text-right">{done}/{total} шагов</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {(run.status === "queued" || run.status === "error") && (
              <button
                onClick={() => onExecute(run.id)}
                disabled={executing === run.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
              >
                {executing === run.id
                  ? <><Loader2 size={12} className="animate-spin" />Запуск…</>
                  : <><PlayCircle size={12} />Запустить</>}
              </button>
            )}
            <button
              onClick={() => setOpen((p) => !p)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-subtext transition-colors"
            >
              {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="px-5 pb-5 space-y-2 border-t border-border pt-4">
          {run.steps.map((step) => (
            <StepCard key={step.id} step={step} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Launch form ───────────────────────────────────────────────────────────────
const NICHES = [
  "Эксперт / Коуч", "Психолог / Терапевт", "Онлайн-образование",
  "Бизнес / Предприниматель", "Блогер / Инфлюенсер", "Продажа товаров",
  "Фитнес / Здоровье", "Beauty / Бьюти", "Юрист / Финансист", "Другое",
];

interface LaunchForm {
  name: string;
  niche: string;
  nicheCustom: string;
  income_now: string;
  income_goal: string;
  contact: string;
}

const EMPTY_FORM: LaunchForm = {
  name: "", niche: "", nicheCustom: "", income_now: "", income_goal: "", contact: "",
};

function LaunchPanel({ onLaunched }: { onLaunched: (runId: string) => void }) {
  const [open, setOpen]           = useState(false);
  const [form, setForm]           = useState<LaunchForm>(EMPTY_FORM);
  const [launching, setLaunching] = useState(false);
  const [error, setError]         = useState("");

  async function handleLaunch() {
    const name  = form.name.trim();
    const niche = form.niche === "Другое" ? form.nicheCustom.trim() : form.niche.trim();
    if (!name)  { setError("Введите имя или название"); return; }
    if (!niche) { setError("Выберите или введите нишу"); return; }

    setError("");
    setLaunching(true);
    try {
      // 1. Create client → automatically creates queued automation run
      const clientRes = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          niche,
          contact:     form.contact.trim() || undefined,
          income_now:  Number(form.income_now)  || 0,
          income_goal: Number(form.income_goal) || 0,
        }),
      });
      if (!clientRes.ok) {
        const d = await clientRes.json().catch(() => ({}));
        setError(d.error ?? "Ошибка создания клиента");
        return;
      }
      const clientData = await clientRes.json();
      const runId: string | undefined = clientData.automation_run_id;

      // 2. Execute the run immediately
      if (runId) {
        const execRes = await fetch(`/api/automation/${runId}`, { method: "POST" });
        if (execRes.ok) {
          onLaunched(runId);
          setForm(EMPTY_FORM);
          setOpen(false);
          return;
        }
      }

      // Fallback — just notify that client was created (run will be in queue)
      onLaunched(clientData.id);
      setForm(EMPTY_FORM);
      setOpen(false);
    } catch {
      setError("Ошибка соединения. Попробуйте ещё раз.");
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div className="bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/30 rounded-xl overflow-hidden">
      {/* Trigger */}
      <button
        onClick={() => { setOpen((p) => !p); setError(""); }}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
            <Sparkles size={18} className="text-accent" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-text">Запустить автопилот вручную</p>
            <p className="text-xs text-subtext">Введите данные — AI-команда всё сделает сама</p>
          </div>
        </div>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${open ? "bg-accent/20 text-accent" : "bg-white/5 text-subtext"}`}>
          {open ? <X size={14} /> : <Plus size={14} />}
        </div>
      </button>

      {/* Form */}
      {open && (
        <form onSubmit={(e) => { e.preventDefault(); handleLaunch(); }} className="px-5 pb-5 border-t border-accent/20 pt-4 space-y-4">
          <p className="text-xs text-subtext leading-relaxed">
            Заполните основную информацию — Продюсер, Стратег, Копирайтер и Таргетолог
            проработают полный план для вашего проекта.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Name */}
            <div>
              <label className="text-xs text-subtext flex items-center gap-1 mb-1.5">
                <User size={11} /> Ваше имя или название проекта *
              </label>
              <input
                className="input w-full"
                placeholder="Например: Анна Смирнова"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Contact */}
            <div>
              <label className="text-xs text-subtext mb-1.5 block">Контакт / Telegram (необязательно)</label>
              <input
                className="input w-full"
                placeholder="@username или телефон"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
              />
            </div>

            {/* Niche */}
            <div className={form.niche === "Другое" ? "" : "sm:col-span-2"}>
              <label className="text-xs text-subtext mb-1.5 block">Ниша / Тематика *</label>
              <select
                className="input w-full"
                value={form.niche}
                onChange={(e) => setForm({ ...form, niche: e.target.value, nicheCustom: "" })}
              >
                <option value="">— выберите нишу —</option>
                {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            {form.niche === "Другое" && (
              <div>
                <label className="text-xs text-subtext mb-1.5 block">Укажите вашу нишу *</label>
                <input
                  className="input w-full"
                  placeholder="Опишите кратко"
                  value={form.nicheCustom}
                  onChange={(e) => setForm({ ...form, nicheCustom: e.target.value })}
                  autoFocus
                />
              </div>
            )}

            {/* Income */}
            <div>
              <label className="text-xs text-subtext flex items-center gap-1 mb-1.5">
                <DollarSign size={11} /> Текущий доход ($/мес)
              </label>
              <input
                type="number"
                min={0}
                className="input w-full"
                placeholder="0"
                value={form.income_now}
                onChange={(e) => setForm({ ...form, income_now: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-subtext flex items-center gap-1 mb-1.5">
                <Target size={11} /> Цель по доходу ($/мес)
              </label>
              <input
                type="number"
                min={0}
                className="input w-full"
                placeholder="10000"
                value={form.income_goal}
                onChange={(e) => setForm({ ...form, income_goal: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle size={12} /> {error}
            </p>
          )}

          {/* AI team preview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { emoji: "🎬", name: "Продюсер",   task: "План А→Б" },
              { emoji: "🧠", name: "Стратег",    task: "Стратегия роста" },
              { emoji: "✍️", name: "Копирайтер", task: "Контент-пакет" },
              { emoji: "📣", name: "Таргетолог", task: "Рекламные тексты" },
            ].map((a) => (
              <div key={a.name} className="bg-white/5 rounded-lg px-3 py-2 text-center">
                <div className="text-lg mb-0.5">{a.emoji}</div>
                <div className="text-xs font-medium text-text">{a.name}</div>
                <div className="text-[10px] text-subtext">{a.task}</div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={launching}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent hover:bg-accent/90 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
          >
            {launching
              ? <><Loader2 size={15} className="animate-spin" />AI-команда работает…</>
              : <><Sparkles size={15} />Запустить AI-команду</>}
          </button>
        </form>
      )}
    </div>
  );
}

// ── Chat types ────────────────────────────────────────────────────────────────
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  ts: string;
}

// Where to send / apply the AI response
interface ChatDestination {
  type: "none" | "client_field" | "workspace_task" | "automation_run";
  clientId: string;
  field: string;       // for client_field
  fieldLabel: string;
}

const CLIENT_FIELDS: { value: string; label: string }[] = [
  { value: "strategy",      label: "Стратегия"           },
  { value: "content_plan",  label: "Контент-план"        },
  { value: "funnel",        label: "Воронка продаж"      },
  { value: "producer_plan", label: "План продюсера"      },
  { value: "personality",   label: "Бренд / личность"    },
  { value: "ad_creatives",  label: "Рекламные тексты"    },
  { value: "content_pack",  label: "Контент-пакет"       },
  { value: "analytics_report", label: "Аналитика"        },
  { value: "sales_script",  label: "Скрипт продаж"       },
];

// ── Chat panel ────────────────────────────────────────────────────────────────
function ChatPanel() {
  const [chatOpen,     setChatOpen]     = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput,    setChatInput]    = useState("");
  const [chatLoading,  setChatLoading]  = useState(false);
  const [chatClients,  setChatClients]  = useState<{ id: string; name: string; niche?: string }[]>([]);
  const [copiedMsgIdx, setCopiedMsgIdx] = useState<number | null>(null);

  // Destination state
  const [dest, setDest] = useState<ChatDestination>({
    type: "none", clientId: "", field: "", fieldLabel: "",
  });
  const [applying,     setApplying]     = useState<number | null>(null); // message index being applied
  const [applyDone,    setApplyDone]    = useState<number | null>(null);
  const [applyError,   setApplyError]   = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load clients on mount
  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.ok ? r.json() : [])
      .then((data: { id: string; name: string; niche?: string }[]) => setChatClients(data))
      .catch(() => {});
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatOpen]);

  // ── Destination label for display ──────────────────────────────────────────
  function destLabel(): string {
    if (dest.type === "none") return "";
    const clientName = chatClients.find((c) => c.id === dest.clientId)?.name ?? "клиент";
    if (dest.type === "client_field") return `${clientName} → ${dest.fieldLabel}`;
    if (dest.type === "workspace_task") return "Задача в Рабочем пространстве";
    if (dest.type === "automation_run") return `Автопилот для ${clientName}`;
    return "";
  }

  // ── Apply result to selected destination ───────────────────────────────────
  async function applyResult(content: string, msgIdx: number) {
    if (dest.type === "none") return;
    setApplying(msgIdx);
    setApplyError(null);
    try {
      if (dest.type === "client_field") {
        if (!dest.clientId || !dest.field) return;
        const res = await fetch(`/api/clients/${dest.clientId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: { [dest.field]: content } }),
        });
        if (!res.ok) throw new Error("save failed");
      } else if (dest.type === "workspace_task") {
        const title = content.split("\n").find((l) => l.trim()) ?? content.slice(0, 60);
        const res = await fetch("/api/workspace/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.replace(/^#+\s*/, "").slice(0, 100),
            description: content,
            period: "week",
            priority: "medium",
          }),
        });
        if (!res.ok) throw new Error("task failed");
      } else if (dest.type === "automation_run") {
        if (!dest.clientId) return;
        // Create + execute automation run for the selected client
        const runRes = await fetch("/api/automation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: dest.clientId, trigger: "manual" }),
        });
        if (runRes.ok) {
          const run = await runRes.json();
          await fetch(`/api/automation/${run.id}`, { method: "POST" });
        }
      }
      setApplyDone(msgIdx);
      setTimeout(() => setApplyDone(null), 3000);
    } catch {
      setApplyError(msgIdx);
      setTimeout(() => setApplyError(null), 3000);
    } finally {
      setApplying(null);
    }
  }

  // ── Send message — streaming SSE ──────────────────────────────────────────
  async function sendMessage() {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;

    const userMsg: ChatMessage = { role: "user", content: msg, ts: new Date().toISOString() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    // Add placeholder assistant message that fills in as stream arrives
    const assistantTs = new Date().toISOString();
    setChatMessages((prev) => [...prev, { role: "assistant", content: "", ts: assistantTs }]);

    try {
      const params = new URLSearchParams({ message: msg });
      if (dest.clientId) params.set("client_id", dest.clientId);
      const res = await fetch(`/api/chat/stream?${params}`);

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = ""; let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.type === "delta") {
              full += parsed.text;
              setChatMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: full, ts: assistantTs };
                return updated;
              });
            }
            if (parsed.type === "error") {
              setChatMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: `⚠️ ${parsed.message}`, ts: assistantTs };
                return updated;
              });
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch {
      setChatMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "⚠️ Ошибка соединения.", ts: new Date().toISOString() };
        return updated;
      });
    } finally {
      setChatLoading(false);
    }
  }

  async function copyMsg(content: string, idx: number) {
    await navigator.clipboard.writeText(content);
    setCopiedMsgIdx(idx);
    setTimeout(() => setCopiedMsgIdx(null), 1500);
  }

  const hasClientDest = dest.type === "client_field" || dest.type === "automation_run";

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-nav">
      {/* Toggle */}
      <button
        onClick={() => setChatOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
            <MessageSquare size={18} className="text-accent" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-text">🤖 AI-ассистент — вопросы и действия</p>
            <p className="text-xs text-subtext">
              {dest.type !== "none"
                ? <span className="text-accent/80">→ {destLabel()}</span>
                : "Задай вопрос, сгенерируй контент, примени к клиенту или вкладке"}
            </p>
          </div>
        </div>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${chatOpen ? "bg-accent/20 text-accent" : "bg-white/5 text-subtext"}`}>
          {chatOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>

      {chatOpen && (
        <div className="border-t border-border">

          {/* ── Destination panel ──────────────────────────────────────────── */}
          <div className="px-4 pt-3 pb-3 space-y-2 bg-white/[0.02] border-b border-border">
            <p className="text-[10px] font-semibold text-subtext/60 uppercase tracking-wider">Куда применить результат</p>

            {/* Action type */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {([
                { type: "none",           label: "Только показать",   icon: "👁" },
                { type: "client_field",   label: "В профиль клиента", icon: "👤" },
                { type: "workspace_task", label: "Задача",             icon: "✅" },
                { type: "automation_run", label: "Запустить автопилот",icon: "⚡" },
              ] as const).map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => setDest({ type: opt.type, clientId: dest.clientId, field: dest.field, fieldLabel: dest.fieldLabel })}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] border transition-colors ${
                    dest.type === opt.type
                      ? "border-accent/40 bg-accent/10 text-accent font-medium"
                      : "border-border text-subtext hover:bg-white/5"
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span className="truncate">{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Client selector (shown when client-based action) */}
            {(hasClientDest) && (
              <select
                value={dest.clientId}
                onChange={(e) => setDest((d) => ({ ...d, clientId: e.target.value }))}
                className="input w-full text-sm"
              >
                <option value="">— выберите клиента —</option>
                {chatClients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.niche ? ` · ${c.niche}` : ""}</option>
                ))}
              </select>
            )}

            {/* Field selector (shown when saving to client field) */}
            {dest.type === "client_field" && dest.clientId && (
              <select
                value={dest.field}
                onChange={(e) => {
                  const f = CLIENT_FIELDS.find((x) => x.value === e.target.value);
                  setDest((d) => ({ ...d, field: e.target.value, fieldLabel: f?.label ?? "" }));
                }}
                className="input w-full text-sm"
              >
                <option value="">— выберите поле —</option>
                {CLIENT_FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            )}

            {/* Active destination badge */}
            {dest.type !== "none" && destLabel() && (
              <div className="flex items-center gap-2 text-xs text-accent/80 bg-accent/5 border border-accent/20 rounded-lg px-2.5 py-1.5">
                <Sparkles size={11} className="shrink-0" />
                <span className="truncate">Результат → <strong>{destLabel()}</strong></span>
              </div>
            )}
          </div>

          {/* ── Messages area ──────────────────────────────────────────────── */}
          <div className="px-4 py-3 max-h-80 overflow-y-auto space-y-4">
            {chatMessages.length === 0 && (
              <p className="text-xs text-subtext italic py-4 text-center">
                Задайте вопрос или попросите AI сгенерировать контент.<br />
                Выберите куда применить — и нажмите «Применить» под ответом.
              </p>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} className={`flex flex-col gap-1.5 ${m.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`max-w-[88%] rounded-xl px-3 py-2 ${
                  m.role === "user"
                    ? "bg-accent/20 text-text"
                    : "bg-white/5 text-text"
                }`}>
                  <pre className="whitespace-pre-wrap font-sans leading-relaxed text-xs">{m.content}</pre>
                </div>

                {m.role === "assistant" && (
                  <div className="flex flex-wrap gap-1.5 pl-1">
                    {/* Copy */}
                    <button onClick={() => copyMsg(m.content, i)}
                      className="flex items-center gap-1 text-[10px] text-subtext hover:text-text px-1.5 py-0.5 rounded border border-border hover:bg-white/5 transition-colors">
                      {copiedMsgIdx === i ? <><Check size={9} />Скопировано</> : <><Copy size={9} />Скопировать</>}
                    </button>
                    {/* Download */}
                    <button onClick={() => downloadResult(m.content, `chat_${i}`, "txt")}
                      className="flex items-center gap-1 text-[10px] text-subtext hover:text-text px-1.5 py-0.5 rounded border border-border hover:bg-white/5 transition-colors">
                      <Download size={9} />.txt
                    </button>
                    <button onClick={() => downloadResult(m.content, `chat_${i}`, "md")}
                      className="flex items-center gap-1 text-[10px] text-subtext hover:text-text px-1.5 py-0.5 rounded border border-border hover:bg-white/5 transition-colors">
                      <FileText size={9} />.md
                    </button>

                    {/* Apply button — only when destination is set */}
                    {dest.type !== "none" && (
                      <button
                        onClick={() => applyResult(m.content, i)}
                        disabled={applying === i ||
                          (dest.type === "client_field" && (!dest.clientId || !dest.field)) ||
                          (dest.type === "automation_run" && !dest.clientId)
                        }
                        className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border font-medium transition-colors disabled:opacity-40 ${
                          applyDone === i
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                            : applyError === i
                            ? "border-red-500/40 bg-red-500/10 text-red-400"
                            : "border-accent/40 bg-accent/10 text-accent hover:bg-accent/20"
                        }`}
                      >
                        {applying === i
                          ? <><Loader2 size={9} className="animate-spin" />Применяю…</>
                          : applyDone === i
                          ? <><Check size={9} />Применено!</>
                          : applyError === i
                          ? <><AlertCircle size={9} />Ошибка</>
                          : <><Sparkles size={9} />Применить → {destLabel()}</>
                        }
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {chatLoading && (
              <div className="flex items-center gap-2 text-subtext text-xs py-1">
                <Loader2 size={12} className="animate-spin" /> AI думает…
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Input ──────────────────────────────────────────────────────── */}
          <div className="px-4 pb-4 pt-2 border-t border-border flex gap-2 items-end">
            <textarea
              rows={2}
              placeholder={
                dest.type === "client_field" && dest.clientId && dest.field
                  ? `Напиши ${dest.fieldLabel} для ${chatClients.find(c=>c.id===dest.clientId)?.name ?? "клиента"}…`
                  : dest.type === "automation_run"
                  ? "Напиши что нужно сделать или запусти автопилот…"
                  : "Задай вопрос или попроси AI сгенерировать контент… (Enter — отправить)"
              }
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              className="input flex-1 text-sm resize-none"
            />
            <button
              onClick={sendMessage}
              disabled={!chatInput.trim() || chatLoading}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent hover:bg-accent/90 disabled:opacity-50 text-white transition-colors shrink-0"
            >
              {chatLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Autopilot Stack Section ───────────────────────────────────────────────────
const STACK_LAYERS = [
  {
    num: 1, emoji: "🧠", title: "Мозг", subtitle: "Claude API",
    color: "violet",
    tools: ["claude-sonnet-4-6 / claude-opus-4-6", "Генерация текстов", "Chain-of-Thought анализ", "RAG + Memory"],
    cost: "~$20/мес",
  },
  {
    num: 2, emoji: "🖥", title: "Компьютер", subtitle: "browser-use",
    color: "blue",
    tools: ["Python + Playwright", "Браузерная автоматизация", "Скрапинг конкурентов", "Управление сервисами"],
    cost: "$0 (self-hosted)",
  },
  {
    num: 3, emoji: "🎬", title: "Контент", subtitle: "Vizard + Canva API",
    color: "purple",
    tools: ["Авто-нарезка подкаста (10–15 клипов)", "Субтитры lang=ru 30–90 сек", "Брендованные обложки batch", "Stories / карусели по шаблону"],
    cost: "~$33/мес",
  },
  {
    num: 4, emoji: "📤", title: "Публикация", subtitle: "Ayrshare API",
    color: "emerald",
    tools: ["Instagram + TikTok + YouTube", "Telegram одновременно", "Scheduling — расписание на 30 дней", "Аналитика охватов"],
    cost: "$15/мес",
  },
  {
    num: 5, emoji: "⚙️", title: "Оркестрация", subtitle: "n8n",
    color: "orange",
    tools: ["Trigger → Claude → Vizard → Canva → Ayrshare", "10 000 executions/мес", "Webhook + Schedule + Google Drive watch", "Docker self-hosted бесплатно"],
    cost: "$0–$20/мес",
  },
] as const;

type StackColor = "violet" | "blue" | "purple" | "emerald" | "orange";
const STACK_COLORS: Record<StackColor, { border: string; bg: string; badge: string; dot: string }> = {
  violet:  { border: "border-violet-500/30",  bg: "bg-violet-500/5",  badge: "bg-violet-500/20 text-violet-300",  dot: "bg-violet-400" },
  blue:    { border: "border-blue-500/30",    bg: "bg-blue-500/5",    badge: "bg-blue-500/20 text-blue-300",      dot: "bg-blue-400" },
  purple:  { border: "border-purple-500/30",  bg: "bg-purple-500/5",  badge: "bg-purple-500/20 text-purple-300",  dot: "bg-purple-400" },
  emerald: { border: "border-emerald-500/30", bg: "bg-emerald-500/5", badge: "bg-emerald-500/20 text-emerald-300",dot: "bg-emerald-400" },
  orange:  { border: "border-orange-500/30",  bg: "bg-orange-500/5",  badge: "bg-orange-500/20 text-orange-300",  dot: "bg-orange-400" },
};

function AutopilotStackSection() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-nav">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center text-lg">🤖</div>
          <div className="text-left">
            <p className="text-sm font-semibold text-text">Autopilot Stack — как это работает</p>
            <p className="text-xs text-subtext">5 слоёв автоматизации · $78–90/мес вместо $1 500–3 000 SMM</p>
          </div>
        </div>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${open ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-subtext"}`}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-5 py-4 space-y-4">
          {/* Layers grid */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {STACK_LAYERS.map((layer) => {
              const c = STACK_COLORS[layer.color];
              return (
                <div key={layer.num} className={`rounded-xl border p-3 ${c.border} ${c.bg}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{layer.emoji}</span>
                    <div>
                      <p className="text-xs font-semibold text-text">{layer.title}</p>
                      <p className={`text-[10px] px-1.5 py-0.5 rounded-full inline-block ${c.badge}`}>{layer.subtitle}</p>
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {layer.tools.map((t, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[10px] text-subtext">
                        <span className={`w-1 h-1 rounded-full mt-1.5 shrink-0 ${c.dot}`} />
                        {t}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[10px] font-semibold text-text/60">{layer.cost}</p>
                </div>
              );
            })}
          </div>

          {/* Two main flows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white/[0.03] border border-border rounded-xl p-3">
              <p className="text-xs font-semibold text-text mb-2">🎙 Поток 1: Подкаст → 30+ постов</p>
              <div className="flex flex-wrap gap-1 items-center text-[10px]">
                {["📹 Подкаст", "n8n trigger", "Vizard 10–15 клипов", "Claude хуки+тексты", "Canva обложки", "Ayrshare публикация"].map((s, i, arr) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="bg-white/10 px-2 py-0.5 rounded-full text-text/80">{s}</span>
                    {i < arr.length - 1 && <ChevronRight size={9} className="text-subtext/40 shrink-0" />}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white/[0.03] border border-border rounded-xl p-3">
              <p className="text-xs font-semibold text-text mb-2">🖼 Поток 2: Архив фото → Посты</p>
              <div className="flex flex-wrap gap-1 items-center text-[10px]">
                {["📂 Google Drive", "browser-use скан", "Claude текст+хэштеги", "Canva карусель", "Ayrshare расписание"].map((s, i, arr) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="bg-white/10 px-2 py-0.5 rounded-full text-text/80">{s}</span>
                    {i < arr.length - 1 && <ChevronRight size={9} className="text-subtext/40 shrink-0" />}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Cost comparison */}
          <div className="bg-white/[0.03] border border-border rounded-xl p-3">
            <p className="text-xs font-semibold text-text mb-2">💰 Экономика стека</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
                <p className="text-xs font-bold text-emerald-400">$78–90/мес</p>
                <p className="text-[10px] text-subtext">Весь стек</p>
              </div>
              <div className="bg-white/5 border border-border rounded-lg p-2">
                <p className="text-xs font-bold text-text">vs</p>
                <p className="text-[10px] text-subtext">альтернатива</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                <p className="text-xs font-bold text-red-400">$1 500–3 000/мес</p>
                <p className="text-[10px] text-subtext">SMM-сотрудник</p>
              </div>
            </div>
            <p className="text-center text-xs font-semibold text-emerald-400 mt-2">20× дешевле · 30+ единиц контента/мес автоматически</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Agency Pipeline Section ───────────────────────────────────────────────────
interface PipelineStepState {
  loading: boolean;
  result: string;
  done: boolean;
}

const PIPELINE_PHASES = [
  {
    id: "acquisition",
    num: 1,
    color: "blue",
    icon: "🎯",
    title: "Поиск клиентов",
    desc: "Парсинг, реклама, автоматические DM",
    steps: [
      { id: "parsing",  icon: "🔍", label: "Парсинг аудитории",        action: "bulkOutreachScript", hint: "платформы и чаты" },
      { id: "adcopy",   icon: "📣", label: "Рекламные тексты",          action: "adCopy",             hint: "Instagram / YouTube" },
      { id: "outreach", icon: "💬", label: "Скрипт авторассылки",       action: "outreachMessage",    hint: "персональный DM" },
    ],
  },
  {
    id: "content",
    num: 2,
    color: "purple",
    icon: "🎬",
    title: "Создание контента",
    desc: "Хуки, нарезка видео, рекламные креативы",
    steps: [
      { id: "hooks",    icon: "🎣", label: "Хуки и наложения",          action: "videoHooks",         hint: "вирусные триггеры" },
      { id: "cutplan",  icon: "✂️", label: "План нарезки видео",        action: "videoCutPlan",       hint: "Reels из подкастов" },
      { id: "creative", icon: "🖼", label: "Рекламные креативы",         action: "adCopy",             hint: "визуальные концепции" },
    ],
  },
  {
    id: "products",
    num: 3,
    color: "emerald",
    icon: "📦",
    title: "Продукты",
    desc: "Мини, наставничество, VIP-продюсирование",
    steps: [
      { id: "mini",   icon: "🤖", label: "Мини-продукт",               action: "agencyGrowthPlan", hint: "бот + закрытый канал" },
      { id: "group",  icon: "👥", label: "Групповое наставничество",    action: "agencyGrowthPlan", hint: "средний чек" },
      { id: "vip",    icon: "⭐", label: "VIP / Продюсирование",        action: "agencyGrowthPlan", hint: "высокий чек, личная работа" },
    ],
  },
  {
    id: "journey",
    num: 4,
    color: "orange",
    icon: "🛣",
    title: "Путь клиента",
    desc: "3 воронки от контента до покупки",
    steps: [
      { id: "path1", icon: "📱", label: "Контент → Бот → Автопродажа", action: "agencyGrowthPlan",   hint: "автоматическая воронка" },
      { id: "path2", icon: "📩", label: "Парсинг → DM → Консультация", action: "bulkOutreachScript", hint: "прямые продажи" },
      { id: "path3", icon: "🔄", label: "Догрев → Апселл",             action: "agencyGrowthPlan",   hint: "возврат и рост LTV" },
    ],
  },
] as const;

type PhaseColor = "blue" | "purple" | "emerald" | "orange";

const PHASE_COLORS: Record<PhaseColor, { border: string; bg: string; badge: string; btn: string }> = {
  blue:    { border: "border-blue-500/30",    bg: "bg-blue-500/5",    badge: "bg-blue-500/20 text-blue-400",    btn: "bg-blue-500/20 hover:bg-blue-500/30 text-blue-300"    },
  purple:  { border: "border-purple-500/30",  bg: "bg-purple-500/5",  badge: "bg-purple-500/20 text-purple-400",  btn: "bg-purple-500/20 hover:bg-purple-500/30 text-purple-300"  },
  emerald: { border: "border-emerald-500/30", bg: "bg-emerald-500/5", badge: "bg-emerald-500/20 text-emerald-400", btn: "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300" },
  orange:  { border: "border-orange-500/30",  bg: "bg-orange-500/5",  badge: "bg-orange-500/20 text-orange-400",  btn: "bg-orange-500/20 hover:bg-orange-500/30 text-orange-300"  },
};

function AgencyPipelineSection() {
  const [product,  setProduct]  = useState("");
  const [audience, setAudience] = useState("");
  const [niche,    setNiche]    = useState("");
  const [stepStates,      setStepStates]      = useState<Record<string, PipelineStepState>>({});
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});
  const [runningAll, setRunningAll] = useState(false);

  async function runStep(phaseId: string, stepId: string, action: string) {
    const key = `${phaseId}_${stepId}`;
    setStepStates((prev) => ({ ...prev, [key]: { loading: true, result: "", done: false } }));
    try {
      const res = await fetch("/api/hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          data: {
            product:   product  || niche,
            audience:  audience || "предприниматели, эксперты",
            niche:     niche    || product,
            platform:  "Instagram",
            objective: "продажа",
            topic:     product  || niche,
            videoTopic: product || niche,
            goal:      "продажи",
            revenue:   "0",
          },
        }),
      });
      const data = await res.json();
      const result: string = data.result ?? data.content ?? JSON.stringify(data, null, 2);
      setStepStates((prev) => ({ ...prev, [key]: { loading: false, result, done: true } }));
      setExpandedResults((prev) => ({ ...prev, [key]: true }));
    } catch {
      setStepStates((prev) => ({ ...prev, [key]: { loading: false, result: "Ошибка запроса — попробуйте ещё раз", done: false } }));
    }
  }

  async function runAllPhases() {
    setRunningAll(true);
    for (const phase of PIPELINE_PHASES) {
      for (const step of phase.steps) {
        await runStep(phase.id, step.id, step.action);
      }
    }
    setRunningAll(false);
  }

  async function copyResult(text: string) {
    await navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border border-accent/25 rounded-xl p-5">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-text flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              Полный цикл агентства
            </h2>
            <p className="text-xs text-subtext mt-0.5">
              4 фазы от поиска клиентов до повторных продаж — запускайте по шагу или всё сразу
            </p>
          </div>
          <button
            onClick={runAllPhases}
            disabled={runningAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent/90 disabled:opacity-50 text-white text-xs font-semibold transition-colors shrink-0"
          >
            {runningAll
              ? <><Loader2 size={13} className="animate-spin" />Генерирую всё…</>
              : <><Zap size={13} />Автозапуск всего</>}
          </button>
        </div>

        {/* Context inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            className="input text-sm"
            placeholder="Продукт / услуга (напр. онлайн-курс)"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
          />
          <input
            className="input text-sm"
            placeholder="Целевая аудитория (напр. предприниматели)"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
          />
          <input
            className="input text-sm"
            placeholder="Ниша / тематика"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
          />
        </div>
      </div>

      {/* 4-phase cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PIPELINE_PHASES.map((phase) => {
          const c = PHASE_COLORS[phase.color as PhaseColor];
          return (
            <div key={phase.id} className={`border ${c.border} ${c.bg} rounded-xl p-4 space-y-3`}>
              {/* Phase header */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
                  Фаза {phase.num}
                </span>
                <span className="text-base">{phase.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text">{phase.title}</p>
                  <p className="text-[10px] text-subtext">{phase.desc}</p>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-1.5">
                {phase.steps.map((step) => {
                  const key = `${phase.id}_${step.id}`;
                  const state   = stepStates[key];
                  const isOpen  = expandedResults[key];

                  return (
                    <div key={step.id} className="bg-black/20 rounded-lg overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2">
                        <span className="text-sm shrink-0">{step.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-text truncate">{step.label}</p>
                          <p className="text-[10px] text-subtext">{step.hint}</p>
                        </div>

                        {state?.done && (
                          <button
                            onClick={() => setExpandedResults((prev) => ({ ...prev, [key]: !isOpen }))}
                            className="text-[10px] text-subtext hover:text-text px-1.5 py-0.5 rounded border border-border transition-colors shrink-0"
                          >
                            {isOpen ? "скрыть" : "показать"}
                          </button>
                        )}

                        <button
                          onClick={() => runStep(phase.id, step.id, step.action)}
                          disabled={state?.loading}
                          className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors disabled:opacity-50 shrink-0 ${
                            state?.done
                              ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                              : c.btn
                          }`}
                        >
                          {state?.loading
                            ? <Loader2 size={10} className="animate-spin" />
                            : state?.done
                            ? <><CheckCircle2 size={10} />Готово</>
                            : <><PlayCircle size={10} />Запуск</>}
                        </button>
                      </div>

                      {state?.done && isOpen && state.result && (
                        <div className="border-t border-white/5 px-3 pb-3 pt-2">
                          <pre className="text-[10px] text-text/70 whitespace-pre-wrap leading-relaxed font-sans max-h-48 overflow-y-auto">
                            {state.result}
                          </pre>
                          <button
                            onClick={() => copyResult(state.result)}
                            className="mt-2 flex items-center gap-1 text-[10px] text-subtext hover:text-text px-2 py-0.5 rounded border border-border transition-colors"
                          >
                            <Copy size={9} />Скопировать
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Client journey paths */}
      <div className="bg-nav border border-border rounded-xl p-4">
        <p className="text-[10px] font-semibold text-subtext/60 uppercase tracking-wider mb-3">
          3 пути клиента к покупке
        </p>
        <div className="space-y-2">
          {([
            { color: "blue",    path: ["📱 Контент/Реклама", "🤖 Бот", "💳 Автопродажа мини", "🔥 Догрев", "⬆️ Апселл"] },
            { color: "emerald", path: ["🔍 Парсинг",         "💬 Личное сообщение", "📞 Диагностика", "🤝 Продажа", "✅ Онбординг"] },
            { color: "purple",  path: ["📊 Аналитика базы",  "🎯 Ретаргетинг",       "🆕 Новый оффер", "🌐 Все платформы", "⬆️ Апселл"] },
          ] as const).map(({ color, path }, idx) => (
            <div key={idx} className="flex items-center gap-1 flex-wrap">
              {path.map((step, si) => (
                <div key={si} className="flex items-center gap-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    color === "blue"    ? "bg-blue-500/10    text-blue-400    border-blue-500/20"    :
                    color === "emerald" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                         "bg-purple-500/10  text-purple-400  border-purple-500/20"
                  }`}>{step}</span>
                  {si < path.length - 1 && (
                    <ChevronRight size={10} className="text-subtext/30 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AutomationPage() {
  const [runs, setRuns]           = useState<AutomationRun[]>([]);
  const [loading, setLoading]     = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch("/api/automation");
      if (res.ok) setRuns(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  const executeRun = useCallback(async (runId: string) => {
    setExecuting(runId);
    try {
      const res = await fetch(`/api/automation/${runId}`, { method: "POST" });
      if (res.ok) {
        const updated: AutomationRun = await res.json();
        setRuns((prev) => prev.map((r) => (r.id === runId ? updated : r)));
      }
    } finally {
      setExecuting(null);
    }
  }, []);

  const autoExecuteQueued = useCallback(async (currentRuns: AutomationRun[]) => {
    const queued = currentRuns.filter((r) => r.status === "queued");
    for (const run of queued) {
      await executeRun(run.id);
      const res = await fetch("/api/automation");
      if (res.ok) setRuns(await res.json());
    }
  }, [executeRun]);

  useEffect(() => {
    fetchRuns().then(() => {
      setRuns((prev) => {
        autoExecuteQueued(prev);
        return prev;
      });
    });
  }, [fetchRuns, autoExecuteQueued]);

  useEffect(() => {
    const hasRunning = runs.some((r) => r.status === "running");
    if (hasRunning && !pollingRef.current) {
      pollingRef.current = setInterval(fetchRuns, 5_000);
    } else if (!hasRunning && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [runs, fetchRuns]);

  // Called when a new run is launched from the panel
  const handleLaunched = useCallback(async (_runId: string) => {
    await fetchRuns();
  }, [fetchRuns]);

  const total   = runs.length;
  const done    = runs.filter((r) => r.status === "done").length;
  const running = runs.filter((r) => r.status === "running").length;
  const queued  = runs.filter((r) => r.status === "queued").length;
  const errors  = runs.filter((r) => r.status === "error").length;

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-text flex items-center gap-2">
            <Zap size={20} className="text-accent" />
            Автопилот
          </h1>
          <p className="text-sm text-subtext mt-0.5">
            Введите данные — AI-команда из 4 агентов всё сделает сама
          </p>
        </div>
        <button
          onClick={fetchRuns}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-white/5 text-sm text-subtext transition-colors"
        >
          <RefreshCw size={14} />
          Обновить
        </button>
      </div>

      {/* Autopilot Stack info */}
      <AutopilotStackSection />

      {/* 4-phase agency pipeline */}
      <AgencyPipelineSection />

      {/* Launch panel */}
      <LaunchPanel onLaunched={handleLaunched} />

      {/* AI Chat panel */}
      <ChatPanel />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Всего запусков", value: total,   color: "text-text",        bg: "bg-white/5"        },
          { label: "Выполнено",      value: done,    color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "В работе",       value: running, color: "text-blue-400",    bg: "bg-blue-400/10"    },
          { label: "В очереди",      value: queued,  color: "text-yellow-400",  bg: "bg-yellow-400/10"  },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} border border-border rounded-xl p-4`}>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-subtext mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Runs list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-subtext gap-2">
          <Loader2 size={18} className="animate-spin" />
          <span>Загрузка...</span>
        </div>
      ) : runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
            <Bot size={24} className="text-accent" />
          </div>
          <p className="text-text font-medium">Запустите автопилот</p>
          <p className="text-sm text-subtext max-w-xs">
            Нажмите «Запустить автопилот вручную» выше — введите данные, и AI-команда начнёт работу
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {errors > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              <AlertCircle size={14} />
              {errors} запуск{errors > 1 ? "а" : ""} завершились с ошибкой — нажмите «Запустить» для повтора
            </div>
          )}
          {runs.map((run) => (
            <RunCard
              key={run.id}
              run={run}
              onExecute={executeRun}
              executing={executing}
            />
          ))}
        </div>
      )}
    </div>
  );
}
