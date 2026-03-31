"use client";
import { useEffect, useState, useCallback } from "react";
import { getTeamTasks, runTeamTask, deleteTeamTask, getClients } from "@/lib/api";
import { TEAM_WORKERS } from "@/lib/agents";
import {
  Loader2, Play, Trash2, ChevronDown, ChevronUp, CheckCircle2,
  AlertCircle, Clock, Users, Zap, X, ArrowRight, RefreshCw,
  Copy, Check, CalendarClock,
} from "lucide-react";
import clsx from "clsx";

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}с назад`;
  if (diff < 3600) return `${Math.floor(diff / 60)}м назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}ч назад`;
  return `${Math.floor(diff / 86400)}д назад`;
}

const STATUS_COLOR: Record<string, string> = {
  running: "text-yellow-400",
  done:    "text-green-400",
  error:   "text-red-400",
  pending: "text-subtext",
};
const STATUS_LABEL: Record<string, string> = {
  running: "В работе…",
  done:    "Готово",
  error:   "Ошибка",
  pending: "Ожидает",
};

// ── Task result card ──────────────────────────────────────────────────────────
function TaskCard({ task, onDelete }: { task: any; onDelete: () => void }) {
  const [open, setOpen]     = useState(false);
  const [copied, setCopied] = useState(false);
  const worker = TEAM_WORKERS.find((w) => w.id === task.worker_id);

  async function copyResult() {
    await navigator.clipboard.writeText(task.result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={clsx(
      "card space-y-2 transition-all",
      task.status === "error"   && "border-red-500/30",
      task.status === "running" && "border-yellow-400/30"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className={clsx(
            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm",
            worker?.color ?? "bg-accent/10 text-accent"
          )}>
            {worker?.emoji ?? "🤖"}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-text">{task.worker_name}</p>
            <p className="text-xs text-subtext truncate">
              {task.client_name} · {task.client_niche}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={clsx("text-xs font-medium flex items-center gap-1", STATUS_COLOR[task.status])}>
            {task.status === "running" && <Loader2 size={10} className="animate-spin" />}
            {task.status === "done"    && <CheckCircle2 size={10} />}
            {task.status === "error"   && <AlertCircle size={10} />}
            {STATUS_LABEL[task.status]}
          </span>
          <button onClick={onDelete}
            className="p-1 text-subtext hover:text-red-400 hover:bg-red-400/10 rounded transition-colors">
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {task.point_a && (
        <p className="text-xs text-subtext bg-nav rounded px-2 py-1 italic line-clamp-2">
          📍 {task.point_a}
        </p>
      )}

      {task.result && (
        <div>
          <div className="flex items-center gap-2">
            <button onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors flex-1">
              {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {open ? "Скрыть" : "Показать результат"}
            </button>
            {open && (
              <button onClick={copyResult}
                className="flex items-center gap-1 text-xs text-subtext hover:text-text transition-colors">
                {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                {copied ? "Скопировано" : "Копировать"}
              </button>
            )}
          </div>
          {open && (
            <div className="mt-2 p-3 bg-nav rounded-lg border border-border text-xs text-text/90
                            whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
              {task.result}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-subtext/60">
        <span>{timeAgo(task.created_at)}</span>
        {task.completed_at && (
          <span>завершено {timeAgo(task.completed_at)}</span>
        )}
      </div>
    </div>
  );
}

// ── Worker card ───────────────────────────────────────────────────────────────
function WorkerCard({
  worker, tasks, clients, onRun,
}: {
  worker: typeof TEAM_WORKERS[0];
  tasks: any[];
  clients: any[];
  onRun: (wId: string, cId: string, pointA: string, extra: string) => Promise<void>;
}) {
  const [open, setOpen]       = useState(false);
  const [clientId, setClientId] = useState("");
  const [pointA, setPointA]   = useState("");
  const [extra, setExtra]     = useState("");
  const [running, setRunning] = useState(false);

  const myTasks     = tasks.filter((t) => t.worker_id === worker.id);
  const doneTasks   = myTasks.filter((t) => t.status === "done").length;
  const activeTasks = myTasks.filter((t) => t.status === "running").length;
  const lastTask    = myTasks[0];

  async function handleRun() {
    if (!clientId) return;
    setRunning(true);
    try {
      await onRun(worker.id, clientId, pointA, extra);
      setOpen(false);
      setClientId(""); setPointA(""); setExtra("");
    } finally { setRunning(false); }
  }

  return (
    <div className={clsx(
      "card space-y-3 transition-all",
      activeTasks > 0 && "border-yellow-400/40 bg-yellow-400/5",
      doneTasks > 0 && !activeTasks && "border-green-400/20"
    )}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={clsx(
          "w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0",
          worker.color
        )}>
          {worker.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-text">{worker.name}</p>
            <span className="text-xs text-subtext">{worker.role}</span>
            <span className="text-xs text-subtext/50 flex items-center gap-0.5">
              <CalendarClock size={9} /> {worker.schedule}
            </span>
          </div>
          <p className="text-xs text-subtext/70">{worker.desc}</p>
        </div>
        {activeTasks > 0 && (
          <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded
                           flex items-center gap-1 shrink-0">
            <Loader2 size={9} className="animate-spin" /> В работе
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-xs text-subtext">
        <span className="flex items-center gap-1">
          <CheckCircle2 size={10} className="text-green-400" /> {doneTasks} выполнено
        </span>
        <span className="flex items-center gap-1">
          <Clock size={10} /> {myTasks.length} всего
        </span>
        {lastTask && (
          <span className="flex items-center gap-1 text-subtext/60">
            последний: {timeAgo(lastTask.created_at)}
          </span>
        )}
      </div>

      {/* Last result preview */}
      {lastTask?.status === "done" && lastTask.result && !open && (
        <p className="text-xs text-subtext/70 bg-nav rounded px-2 py-1 line-clamp-2 italic">
          💬 {lastTask.result.slice(0, 150)}…
        </p>
      )}

      {/* Launch button */}
      <button onClick={() => setOpen((v) => !v)}
        className={clsx(
          "w-full text-xs py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5",
          open
            ? "bg-border text-subtext"
            : "bg-accent/10 text-accent hover:bg-accent/20"
        )}>
        {open ? <><X size={11} /> Закрыть</> : <><Play size={11} /> Запустить задачу</>}
      </button>

      {/* Launch form */}
      {open && (
        <div className="space-y-2 pt-2 border-t border-border">
          <div>
            <label className="text-xs text-subtext block mb-1">Клиент *</label>
            <select className="input w-full text-sm" value={clientId}
              onChange={(e) => setClientId(e.target.value)}>
              <option value="">— выбрать клиента —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name} · {c.niche}</option>
              ))}
            </select>
          </div>

          {(worker.id === "producer" || worker.id === "businessmap") && (
            <div>
              <label className="text-xs text-subtext block mb-1">
                📍 Точка А — опиши стартовое состояние клиента
              </label>
              <textarea rows={3} className="input w-full text-sm resize-none"
                placeholder="Доход $500/мес, нет продуктов, 2000 подписчиков, хаотичный контент, нет воронки…"
                value={pointA} onChange={(e) => setPointA(e.target.value)} />
            </div>
          )}

          {worker.id === "businessmap" && (
            <div>
              <label className="text-xs text-subtext block mb-1">Текущий этап (1–9)</label>
              <select className="input w-full text-sm" value={extra} onChange={(e) => setExtra(e.target.value)}>
                <option value="">— выбрать —</option>
                {["1 — Онбординг", "2 — Распаковка", "3 — Продукты", "4 — Воронка",
                  "5 — Контент-план", "6 — Подкаст", "7 — Авто-нарезка",
                  "8 — Реклама", "9 — Аналитика"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {worker.id === "dailybrief" && (
            <p className="text-xs text-subtext italic bg-nav rounded px-2 py-1.5">
              📅 Брифинг по протоколу П-01: топ-3 задачи, алерты клиентов, что запустить сегодня
            </p>
          )}

          {!["producer", "businessmap", "dailybrief"].includes(worker.id) && (
            <div>
              <label className="text-xs text-subtext block mb-1">
                {worker.id === "producer" ? "🎯 Цель / Точка Б" : "Тема / дополнительный контекст"}
              </label>
              <input className="input w-full text-sm"
                placeholder={
                  worker.id === "smm"        ? "Фокус недели или акция…" :
                  worker.id === "copywriter" ? "Тема поста или продукт…" :
                  worker.id === "sales"      ? "Продукт для продажи…" :
                  worker.id === "analyst"    ? "Вопрос или период анализа…" :
                  "Дополнительный контекст…"
                }
                value={extra} onChange={(e) => setExtra(e.target.value)} />
            </div>
          )}

          {worker.id === "producer" && (
            <div>
              <label className="text-xs text-subtext block mb-1">🎯 Цель / Точка Б</label>
              <input className="input w-full text-sm"
                placeholder="Выйти на $5000/мес за 3 месяца…"
                value={extra} onChange={(e) => setExtra(e.target.value)} />
            </div>
          )}

          <button onClick={handleRun} disabled={running || !clientId}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2">
            {running
              ? <><Loader2 size={13} className="animate-spin" /> Gemini думает… (15–30 сек)</>
              : <><Zap size={13} /> Запустить {worker.name}</>
            }
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TeamPage() {
  const [tasks, setTasks]     = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [workerFilter, setWorkerFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, c] = await Promise.all([getTeamTasks(), getClients()]);
      setTasks(t);
      setClients(c);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleRun(wId: string, cId: string, pointA: string, extra: string) {
    const optimistic = {
      id:           `opt_${Date.now()}`,
      worker_id:    wId,
      worker_name:  TEAM_WORKERS.find((w) => w.id === wId)?.name ?? wId,
      client_id:    cId,
      client_name:  clients.find((c) => c.id === cId)?.name ?? "Клиент",
      client_niche: clients.find((c) => c.id === cId)?.niche ?? "",
      status:       "running",
      created_at:   new Date().toISOString(),
      completed_at: null,
      point_a:      pointA,
      extra,
      result:       "",
    };
    setTasks((prev) => [optimistic, ...prev]);
    await runTeamTask({ worker_id: wId, client_id: cId, point_a: pointA, extra });
    await load();
  }

  async function handleDelete(id: string) {
    await deleteTeamTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  const filteredTasks = tasks
    .filter((t) => statusFilter === "all" || t.status === statusFilter)
    .filter((t) => workerFilter  === "all" || t.worker_id === workerFilter);

  const runningCount = tasks.filter((t) => t.status === "running").length;
  const doneCount    = tasks.filter((t) => t.status === "done").length;
  const todayCount   = tasks.filter((t) => t.created_at?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">AI Команда агентства</h1>
          <p className="text-sm text-subtext mt-0.5">
            {TEAM_WORKERS.length} сотрудников · следят за клиентами · работают по протоколу AMAImedia
          </p>
        </div>
        <button onClick={load} className="btn-ghost flex items-center gap-2 text-xs">
          <RefreshCw size={13} /> Обновить
        </button>
      </div>

      {/* Running alert */}
      {runningCount > 0 && (
        <div className="card border-yellow-400/30 bg-yellow-400/5 flex items-center gap-2 p-3">
          <Loader2 size={14} className="text-yellow-400 animate-spin shrink-0" />
          <p className="text-sm text-yellow-400">
            <strong>{runningCount}</strong> сотрудник{runningCount > 1 ? "а" : ""} работает — Gemini отвечает 15–30 сек
          </p>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-text">{TEAM_WORKERS.length}</p>
          <p className="text-xs text-subtext mt-1 flex items-center justify-center gap-1">
            <Users size={10} /> Сотрудников
          </p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{doneCount}</p>
          <p className="text-xs text-subtext mt-1 flex items-center justify-center gap-1">
            <CheckCircle2 size={10} /> Выполнено
          </p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-accent">{todayCount}</p>
          <p className="text-xs text-subtext mt-1 flex items-center justify-center gap-1">
            <Zap size={10} /> Сегодня
          </p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-text">{clients.length}</p>
          <p className="text-xs text-subtext mt-1 flex items-center justify-center gap-1">
            <Users size={10} /> Клиентов
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Workers (2/3) */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-text flex items-center gap-2">
            <Users size={13} className="text-accent" /> Сотрудники
          </h2>
          {loading ? (
            <div className="text-subtext text-sm flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Загрузка…
            </div>
          ) : (
            <div className="space-y-3">
              {TEAM_WORKERS.map((worker) => (
                <WorkerCard
                  key={worker.id}
                  worker={worker}
                  tasks={tasks}
                  clients={clients}
                  onRun={handleRun}
                />
              ))}
            </div>
          )}
        </div>

        {/* Task feed (1/3) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">Лента задач</h2>
            <span className="text-xs text-subtext">{tasks.length}</span>
          </div>

          {/* Status filter */}
          <div className="flex gap-1 flex-wrap">
            {(["all", "running", "done", "error"] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={clsx(
                  "text-xs px-2 py-1 rounded transition-colors",
                  statusFilter === s ? "bg-accent text-white" : "bg-nav text-subtext hover:text-text"
                )}>
                {s === "all" ? "Все" : STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          {/* Worker filter */}
          <select className="input w-full text-xs" value={workerFilter}
            onChange={(e) => setWorkerFilter(e.target.value)}>
            <option value="all">Все сотрудники</option>
            {TEAM_WORKERS.map((w) => (
              <option key={w.id} value={w.id}>{w.emoji} {w.name} — {w.role}</option>
            ))}
          </select>

          {filteredTasks.length === 0 ? (
            <div className="card text-sm text-subtext text-center py-8 space-y-2">
              <p className="text-2xl">🤖</p>
              <p>Задач пока нет</p>
              <p className="text-xs text-subtext/60">
                Выбери сотрудника и нажми «Запустить»
              </p>
              <ArrowRight size={14} className="mx-auto text-accent/40" />
            </div>
          ) : (
            <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} onDelete={() => handleDelete(task.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
