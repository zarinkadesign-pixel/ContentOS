"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  getTasks, createTask, updateTask, deleteTask,
  getTimeSessions, startTimer, stopTimer, getWorkspaceStats,
} from "@/lib/api";
import type { Task, TaskPeriod, TaskStatus, TaskPriority } from "@/lib/types";
import {
  CheckCircle2, Circle, Clock, PlayCircle, StopCircle, Plus, Trash2,
  ChevronDown, ChevronUp, Timer, TrendingUp, CalendarDays, BarChart3,
  AlertCircle, Loader2, X, Save, Flame, Target,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import clsx from "clsx";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}ч ${m}м` : `${m}м`;
}
function fmtClock(d: Date) {
  return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function fmtDate(d: Date) {
  return d.toLocaleDateString("ru", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low:    "bg-slate-700 text-slate-300",
  medium: "bg-yellow-900 text-yellow-300",
  high:   "bg-red-900 text-red-300",
};
const PRIORITY_LABELS: Record<TaskPriority, string> = { low: "низкий", medium: "средний", high: "высокий" };
const STATUS_LABELS:   Record<TaskStatus, string>   = { todo: "К выполнению", in_progress: "В работе", done: "Готово" };
const PERIOD_LABELS:   Record<TaskPeriod, string>   = { day: "Сегодня", week: "Неделя", month: "Месяц" };

const EMPTY_TASK = { title: "", description: "", period: "week" as TaskPeriod, due_date: "", priority: "medium" as TaskPriority, tags: "" };

// ── Task card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, onUpdate, onDelete }: { task: Task; onUpdate: () => void; onDelete: () => void }) {
  const [loading, setLoading] = useState(false);
  const overdue = task.status !== "done" && task.due_date < new Date().toISOString().slice(0, 10);

  async function cycleStatus() {
    const next: Record<TaskStatus, TaskStatus> = { todo: "in_progress", in_progress: "done", done: "todo" };
    setLoading(true);
    try { await updateTask(task.id, { status: next[task.status] }); onUpdate(); }
    finally { setLoading(false); }
  }

  return (
    <div className={clsx(
      "card p-3 space-y-2 group transition-all",
      task.status === "done" && "opacity-60",
      overdue && task.status !== "done" && "border-red-500/40"
    )}>
      <div className="flex items-start gap-2">
        <button onClick={cycleStatus} disabled={loading} className="mt-0.5 shrink-0 text-subtext hover:text-accent transition-colors">
          {loading
            ? <Loader2 size={15} className="animate-spin" />
            : task.status === "done"
              ? <CheckCircle2 size={15} className="text-green-400" />
              : task.status === "in_progress"
                ? <Clock size={15} className="text-yellow-400" />
                : <Circle size={15} />
          }
        </button>
        <div className="flex-1 min-w-0">
          <p className={clsx("text-sm font-medium text-text", task.status === "done" && "line-through")}>{task.title}</p>
          {task.description && <p className="text-xs text-subtext truncate">{task.description}</p>}
        </div>
        <button onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 text-subtext hover:text-red-400 hover:bg-red-400/10 rounded transition-all shrink-0">
          <Trash2 size={11} />
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={clsx("badge text-xs", PRIORITY_COLORS[task.priority as TaskPriority])}>
          {PRIORITY_LABELS[task.priority as TaskPriority]}
        </span>
        {task.due_date && (
          <span className={clsx("text-xs flex items-center gap-1",
            overdue ? "text-red-400" : "text-subtext")}>
            {overdue && <AlertCircle size={10} />}
            до {new Date(task.due_date + "T00:00:00").toLocaleDateString("ru", { day: "numeric", month: "short" })}
          </span>
        )}
        {task.tags?.map((tag: string) => (
          <span key={tag} className="text-xs text-accent/70 bg-accent/10 px-1.5 py-0.5 rounded">#{tag}</span>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Workspace() {
  const [now, setNow]             = useState(new Date());
  const [tasks, setTasks]         = useState<Task[]>([]);
  const [stats, setStats]         = useState<any>(null);
  const [timeData, setTimeData]   = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [timerSec, setTimerSec]   = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerLoading, setTimerLoading] = useState(false);
  const [timerCategory, setTimerCategory] = useState("");
  const [showAdd, setShowAdd]     = useState(false);
  const [addForm, setAddForm]     = useState(EMPTY_TASK);
  const [addLoading, setAddLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TaskPeriod>("day");
  const [statsOpen, setStatsOpen] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Timer tick
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSec((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, s, td] = await Promise.all([getTasks(), getWorkspaceStats(), getTimeSessions()]);
      setTasks(t);
      setStats(s);
      setTimeData(td);
      // Restore active timer if exists
      if (td.active) {
        const elapsed = Math.floor((Date.now() - new Date(td.active.start).getTime()) / 1000);
        setTimerSec(elapsed);
        setTimerCategory(td.active.category ?? "");
        setTimerRunning(true);
      } else {
        setTimerRunning(false);
        setTimerSec(0);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleTimerToggle() {
    setTimerLoading(true);
    try {
      if (timerRunning) {
        await stopTimer();
        setTimerRunning(false);
        setTimerSec(0);
      } else {
        await startTimer(timerCategory);
        setTimerRunning(true);
        setTimerSec(0);
      }
      await load();
    } catch (e) { console.error(e); }
    finally { setTimerLoading(false); }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.title.trim()) return;
    setAddLoading(true);
    try {
      const due = addForm.due_date || (() => {
        const d = new Date();
        if (addForm.period === "week") d.setDate(d.getDate() + (7 - d.getDay()));
        if (addForm.period === "month") return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
        return d.toISOString().slice(0, 10);
      })();
      await createTask({
        ...addForm,
        due_date: due,
        tags: addForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      setAddForm(EMPTY_TASK);
      setShowAdd(false);
      await load();
    } finally { setAddLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить задачу?")) return;
    await deleteTask(id);
    await load();
  }

  const tasksByPeriod = (period: TaskPeriod) => tasks.filter((t) => t.period === period);
  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueTasks = tasks.filter((t) => t.status !== "done" && t.due_date < todayStr);

  // Timer display
  const timerH  = Math.floor(timerSec / 3600);
  const timerM  = Math.floor((timerSec % 3600) / 60);
  const timerS  = timerSec % 60;
  const timerStr = `${String(timerH).padStart(2, "0")}:${String(timerM).padStart(2, "0")}:${String(timerS).padStart(2, "0")}`;

  if (loading) return <div className="flex items-center justify-center h-64 text-subtext">Загрузка…</div>;

  return (
    <div className="space-y-5">
      {/* ── Header: live clock ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Мой кабинет</h1>
          <p className="text-sm text-subtext mt-0.5 capitalize">{fmtDate(now)}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono font-bold text-accent tabular-nums">{fmtClock(now)}</p>
          <p className="text-xs text-subtext mt-0.5">Москва / Астана UTC+5</p>
        </div>
      </div>

      {/* ── KPI row ─────────────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Today tasks */}
          <div className="card p-4 space-y-1">
            <div className="flex items-center gap-2 text-subtext text-xs"><CalendarDays size={12} /> Задачи сегодня</div>
            <p className="text-2xl font-bold text-text">{stats.today.done}<span className="text-subtext text-sm font-normal">/{stats.today.total}</span></p>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: `${stats.today.completion_pct}%` }} />
            </div>
            <p className="text-xs text-subtext">{stats.today.completion_pct}% выполнено</p>
          </div>
          {/* Week progress */}
          <div className="card p-4 space-y-1">
            <div className="flex items-center gap-2 text-subtext text-xs"><Target size={12} /> Успеваемость, неделя</div>
            <p className="text-2xl font-bold text-text">{stats.week.on_time_pct}<span className="text-subtext text-sm font-normal">%</span></p>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${stats.week.on_time_pct}%` }} />
            </div>
            <p className="text-xs text-subtext">сдано вовремя</p>
          </div>
          {/* Hours today */}
          <div className="card p-4 space-y-1">
            <div className="flex items-center gap-2 text-subtext text-xs"><Timer size={12} /> Рабочее время</div>
            <p className="text-2xl font-bold text-text">{stats.today.hours}<span className="text-subtext text-sm font-normal">ч</span></p>
            <p className="text-xs text-subtext">сегодня · {stats.week.hours}ч за неделю</p>
          </div>
          {/* Month progress */}
          <div className="card p-4 space-y-1">
            <div className="flex items-center gap-2 text-subtext text-xs"><Flame size={12} /> Месяц</div>
            <p className="text-2xl font-bold text-text">{stats.month.done}<span className="text-subtext text-sm font-normal">/{stats.month.total}</span></p>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${stats.month.completion_pct}%` }} />
            </div>
            <p className="text-xs text-subtext">{stats.month.completion_pct}% выполнено</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Left: tasks (2/3) ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Overdue alert */}
          {overdueTasks.length > 0 && (
            <div className="card border-red-500/30 bg-red-500/5 flex items-center gap-2 p-3">
              <AlertCircle size={14} className="text-red-400 shrink-0" />
              <p className="text-sm text-red-400">
                <strong>{overdueTasks.length}</strong> просроченных задач: {overdueTasks.slice(0, 3).map((t) => t.title).join(", ")}
                {overdueTasks.length > 3 ? "…" : ""}
              </p>
            </div>
          )}

          {/* Tab switcher */}
          <div className="flex items-center gap-2">
            {(["day", "week", "month"] as TaskPeriod[]).map((p) => {
              const cnt = tasksByPeriod(p).length;
              const done = tasksByPeriod(p).filter((t) => t.status === "done").length;
              return (
                <button key={p} onClick={() => setActiveTab(p)}
                  className={clsx("flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2",
                    activeTab === p ? "bg-accent text-white" : "bg-nav text-subtext hover:text-text")}>
                  {PERIOD_LABELS[p]}
                  <span className={clsx("text-xs px-1.5 py-0.5 rounded",
                    activeTab === p ? "bg-white/20" : "bg-border text-subtext")}>
                    {done}/{cnt}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Add task button */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">{PERIOD_LABELS[activeTab]}</h2>
            <button onClick={() => setShowAdd(!showAdd)} className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3">
              <Plus size={12} /> Задача
            </button>
          </div>

          {/* Add task form */}
          {showAdd && (
            <div className="card space-y-3 border-accent/30">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text">Новая задача</h3>
                <button onClick={() => setShowAdd(false)} className="text-subtext hover:text-text"><X size={14} /></button>
              </div>
              <form onSubmit={handleAddTask} className="space-y-3">
                <div>
                  <label className="text-xs text-subtext block mb-1">Название *</label>
                  <input className="input w-full" placeholder="Что нужно сделать?" value={addForm.title}
                    onChange={(e) => setAddForm({ ...addForm, title: e.target.value })} autoFocus />
                </div>
                <div>
                  <label className="text-xs text-subtext block mb-1">Описание</label>
                  <input className="input w-full" placeholder="Подробности…" value={addForm.description}
                    onChange={(e) => setAddForm({ ...addForm, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-subtext block mb-1">Период</label>
                    <select className="input w-full" value={addForm.period}
                      onChange={(e) => setAddForm({ ...addForm, period: e.target.value as TaskPeriod })}>
                      <option value="day">Сегодня</option>
                      <option value="week">Неделя</option>
                      <option value="month">Месяц</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-subtext block mb-1">Приоритет</label>
                    <select className="input w-full" value={addForm.priority}
                      onChange={(e) => setAddForm({ ...addForm, priority: e.target.value as TaskPriority })}>
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-subtext block mb-1">Дедлайн</label>
                    <input className="input w-full" type="date" value={addForm.due_date}
                      onChange={(e) => setAddForm({ ...addForm, due_date: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-subtext block mb-1">Теги (через запятую)</label>
                  <input className="input w-full" placeholder="контент, клиенты…" value={addForm.tags}
                    onChange={(e) => setAddForm({ ...addForm, tags: e.target.value })} />
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost">Отмена</button>
                  <button type="submit" disabled={addLoading || !addForm.title.trim()} className="btn-primary flex items-center gap-1.5">
                    {addLoading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    Добавить
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Task list */}
          <div className="space-y-2">
            {tasksByPeriod(activeTab).length === 0 ? (
              <div className="card text-sm text-subtext text-center py-8">
                Нет задач на {PERIOD_LABELS[activeTab].toLowerCase()} 🎉
              </div>
            ) : (
              // Sort: todo/in_progress first, then done; within group by priority desc
              [...tasksByPeriod(activeTab)]
                .sort((a, b) => {
                  if (a.status === "done" && b.status !== "done") return 1;
                  if (a.status !== "done" && b.status === "done") return -1;
                  const pOrder = { high: 0, medium: 1, low: 2 };
                  return (pOrder[a.priority as TaskPriority] ?? 1) - (pOrder[b.priority as TaskPriority] ?? 1);
                })
                .map((task) => (
                  <TaskCard key={task.id} task={task} onUpdate={load} onDelete={() => handleDelete(task.id)} />
                ))
            )}
          </div>
        </div>

        {/* ── Right: timer + stats (1/3) ────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Timer widget */}
          <div className={clsx(
            "card p-5 space-y-4 text-center border-2 transition-colors",
            timerRunning ? "border-accent/50 bg-accent/5" : "border-border"
          )}>
            <div className="flex items-center justify-center gap-2 text-subtext text-xs">
              <Timer size={12} />
              <span>Таймер работы</span>
            </div>
            <p className="text-4xl font-mono font-bold text-text tabular-nums">{timerStr}</p>

            {!timerRunning && (
              <input
                className="input w-full text-sm text-center"
                placeholder="Категория (опционально)"
                value={timerCategory}
                onChange={(e) => setTimerCategory(e.target.value)}
              />
            )}

            <button
              onClick={handleTimerToggle}
              disabled={timerLoading}
              className={clsx(
                "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-colors",
                timerRunning
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : "bg-accent text-white hover:bg-accent/80"
              )}>
              {timerLoading
                ? <Loader2 size={16} className="animate-spin" />
                : timerRunning
                  ? <><StopCircle size={16} /> Стоп</>
                  : <><PlayCircle size={16} /> Старт</>
              }
            </button>

            {timerRunning && timerCategory && (
              <p className="text-xs text-subtext">📂 {timerCategory}</p>
            )}
          </div>

          {/* Recent sessions */}
          {stats?.recent_sessions?.length > 0 && (
            <div className="card space-y-3">
              <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                <Clock size={12} className="text-subtext" /> Последние сессии
              </h3>
              {stats.recent_sessions.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-text">{s.category || "Работа"}</p>
                    <p className="text-xs text-subtext">{new Date(s.start).toLocaleDateString("ru", { day: "numeric", month: "short" })}</p>
                  </div>
                  <span className="text-xs text-accent font-medium">{fmtDuration(s.duration)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Success chart toggle */}
          <div className="card space-y-3">
            <button
              onClick={() => setStatsOpen((v) => !v)}
              className="w-full flex items-center justify-between text-sm font-semibold text-text">
              <span className="flex items-center gap-2"><BarChart3 size={13} className="text-accent" /> Динамика успеваемости</span>
              {statsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {statsOpen && stats?.weekly_chart?.length > 0 && (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={stats.weekly_chart} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6c63ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="got" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" tick={{ fill: "#64748b", fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: "#0d1126", border: "1px solid #1a1f3a", borderRadius: 8, fontSize: 11 }}
                    formatter={(v: any, name: string) => [`${v}%`, name === "completion" ? "Выполнено" : "Вовремя"]}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, color: "#64748b" }}
                    formatter={(v) => v === "completion" ? "Выполнено" : "Вовремя"} />
                  <Area type="monotone" dataKey="completion" stroke="#6c63ff" strokeWidth={2} fill="url(#gc)" name="completion" />
                  <Area type="monotone" dataKey="on_time"    stroke="#34d399" strokeWidth={2} fill="url(#got)" name="on_time" />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {/* Numeric summary */}
            {stats && (
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border">
                <div>
                  <p className="text-xs text-subtext">Неделя</p>
                  <p className="text-sm font-bold text-text">{stats.week.completion_pct}%</p>
                  <p className="text-xs text-subtext">{stats.week.done}/{stats.week.total} задач</p>
                </div>
                <div>
                  <p className="text-xs text-subtext">Успеваемость</p>
                  <p className={clsx("text-sm font-bold",
                    stats.week.on_time_pct >= 80 ? "text-green-400" : stats.week.on_time_pct >= 50 ? "text-yellow-400" : "text-red-400")}>
                    {stats.week.on_time_pct}%
                  </p>
                  <p className="text-xs text-subtext">сдано вовремя</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
