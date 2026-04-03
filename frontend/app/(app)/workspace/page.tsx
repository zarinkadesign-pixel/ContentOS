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
  AlertCircle, Loader2, X, Save, Flame, Target, Bot, Copy, Check,
  Sparkles, Send, User as UserIcon, BarChart2, Instagram,
} from "lucide-react";
import { TEAM_WORKERS } from "@/lib/agents";
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

// ── 90-Day Plan types & data ───────────────────────────────────────────────────
type PlanTaskStatus = "todo" | "done" | "postponed";
interface PlanTaskState { status: PlanTaskStatus; postponedTo?: string; aiAdvice?: string; }
type Plan90State = Record<string, PlanTaskState>;

const PLAN_90 = [
  {
    phase: 1, title: "Дожим и Быстрый Кэш", goal: "Апрель", days: "2 апр – 29 апр", color: "amber",
    weeks: [
      { week: 1, days: "2–8 апр", title: "Финализация и Первые касания", tasks: [
        { id: "w1-0", text: "🌊 Ежедневный ритуал (до 09:00): Океан, песок, зарядка — только для себя, без рабочих мыслей до первого кофе", tool: "Привычка" },
        { id: "w1-1", text: "Дожать 30% мини-курсов: дописать уроки, собрать бота, протестировать всю воронку на 100%", tool: "Telegram" },
        { id: "w1-2", text: "Упаковать 2–3 убойных коммерческих предложения для amaimedia — отправить 20 точечных офферов на SMM/продюсирование", tool: "Notion" },
        { id: "w1-3", text: "Ежедневно гулять по берегу, знакомиться с 1 новым человеком в день — цель: 5 новых контактов в Нячанге", tool: "Нетворк" },
        { id: "w1-4", text: "✅ KPI: Мини-курс и воронка готовы на 100% и протестированы. Отправлено 20 офферов. Собрано 5 контактов", tool: "CRM" },
      ]},
      { week: 2, days: "9–15 апр", title: "Трафик и Первые Сделки", tasks: [
        { id: "w2-1", text: "Включить трафик на автоворонку мини-курса — настроить и запустить рекламу", tool: "Meta Ads" },
        { id: "w2-2", text: "Проводить диагностические созвоны с потенциальными клиентами на высокие чеки — цель: 5 Zoom-звонков", tool: "Zoom" },
        { id: "w2-3", text: "🍽 Нетворк-обед (13:00–15:00): 2 живые встречи за кофе с местными предпринимателями (клиенты или партнёры)", tool: "Нетворк" },
        { id: "w2-4", text: "✅ KPI: 5 зумов с клиентами проведено. Закрыт 1–2 контракта на SMM/продюсирование. Пошли первые автопродажи мини-курса", tool: "CRM" },
      ]},
      { week: 3, days: "16–22 апр", title: "Проявленность и Контент", tasks: [
        { id: "w3-1", text: "Снять и опубликовать 3 сильных экспертных ролика (Shorts/YouTube): закрыть возражения клиентов агентства, продать экспертность", tool: "YouTube" },
        { id: "w3-2", text: "Посетить местный нетворк-ивент или бизнес-ужин в Нячанге — выступить с самопрезентацией", tool: "Нетворк" },
        { id: "w3-3", text: "🎨 Вечерний ритуал (после 19:00): холст, краски или швейные эскизы cottoluxe — отключить менеджера, включить творца", tool: "Творчество" },
        { id: "w3-4", text: "✅ KPI: 3 экспертных ролика опубликовано. Получено 10 тёплых входящих заявок с контента и воронок", tool: "Instagram" },
      ]},
      { week: 4, days: "23–29 апр", title: "Окно Наставничества", tasks: [
        { id: "w4-1", text: "Анонсировать личное наставничество для прошедших мини-курс и подписчиков блога", tool: "Instagram" },
        { id: "w4-2", text: "Провести 10 разборов/диагностик под наставничество (высокий чек)", tool: "Zoom" },
        { id: "w4-3", text: "Организовать первую встречу-прогулку для творческих и digital-людей Нячанга (3–5 человек)", tool: "Нетворк" },
        { id: "w4-4", text: "✅ KPI: 10 диагностик проведено. Закрыто 2–3 человека в личную работу (высокий чек)", tool: "CRM" },
      ]},
    ],
  },
  {
    phase: 2, title: "Масштаб и Делегирование", goal: "Май", days: "30 апр – 27 мая", color: "violet",
    weeks: [
      { week: 5, days: "30 апр – 6 мая", title: "Выполнение и Команда", tasks: [
        { id: "w5-1", text: "Дать крутой результат первым клиентам агентства: доказать ценность, собрать первые отзывы с цифрами", tool: "CRM" },
        { id: "w5-2", text: "Найти ассистента или project-менеджера в amaimedia — начать делегировать рутинные операционные задачи", tool: "Notion" },
        { id: "w5-3", text: "✅ KPI: 20–30 часов/неделю освобождено от операционки. Все клиенты агентства на 100% в работе", tool: "CRM" },
      ]},
      { week: 6, days: "7–13 мая", title: "Разгон Автопродаж", tasks: [
        { id: "w6-1", text: "Докрутить конверсию в автоворонке: проверить каждый шаг, переписать слабые письма/боты", tool: "Telegram" },
        { id: "w6-2", text: "Увеличить рекламный бюджет на мини-курс — продажи идут каждый день без твоего участия", tool: "Meta Ads" },
        { id: "w6-3", text: "✅ KPI: ROI рекламы больше 200%. Стабильный поток оплат на автомате каждый день", tool: "Meta Ads" },
      ]},
      { week: 7, days: "14–20 мая", title: "Продюсерский Масштаб", tasks: [
        { id: "w7-1", text: "Подписать крупного эксперта для запуска под ключ в рамках строящегося продюсерского центра amaimedia", tool: "Zoom" },
        { id: "w7-2", text: "Расписать детальный план запуска эксперта: этапы, сроки, команда, бюджет, KPI", tool: "Notion" },
        { id: "w7-3", text: "✅ KPI: 1 подписанный контракт с экспертом на запуск. Детальный план запуска расписан", tool: "Notion" },
      ]},
      { week: 8, days: "21–27 мая", title: "Медийный Авторитет", tasks: [
        { id: "w8-1", text: "Провести собственный платный или крупный бесплатный мастер-майнд в офлайне — собрать от 15 человек", tool: "Zoom" },
        { id: "w8-2", text: "Стать заметной фигурой в комьюнити: выступления, публикации, истории участников", tool: "Instagram" },
        { id: "w8-3", text: "✅ KPI: Мастер-майнд проведён (15+ человек). Зафиксирован медийный авторитет в нише", tool: "Нетворк" },
      ]},
    ],
  },
  {
    phase: 3, title: "Автономность и cottoluxe", goal: "Июнь", days: "28 мая – 24 июня", color: "emerald",
    weeks: [
      { week: 9, days: "28 мая – 3 июня", title: "Инвестиции в Одежду", tasks: [
        { id: "w9-1", text: "Вернуться к 70% готовности cottoluxe — перезапустить проект, пересмотреть концепцию первого дропа", tool: "Notion" },
        { id: "w9-2", text: "Передать техническое задание на фабрику, закупить эталонные ткани для первого дропа", tool: "Производство" },
        { id: "w9-3", text: "✅ KPI: Утверждён финальный список моделей первого дропа и бюджет на производство", tool: "Notion" },
      ]},
      { week: 10, days: "4–10 июня", title: "Система Контроля", tasks: [
        { id: "w10-1", text: "Упаковать кейсы клиентов апреля-мая: результаты, цифры, скриншоты — использовать для повышения прайса", tool: "Notion" },
        { id: "w10-2", text: "Повысить прайс на услуги агентства — команда закрывает 80% задач, ты только стратегия и прогулки", tool: "CRM" },
        { id: "w10-3", text: "✅ KPI: 80% задач агентства закрывает команда. У тебя только стратегические созвоны и прогулки", tool: "CRM" },
      ]},
      { week: 11, days: "11–17 июня", title: "Прогрев к cottoluxe", tasks: [
        { id: "w11-1", text: "Начать показывать процесс создания бренда в блоге — применить продюсерские навыки для собственного бизнеса", tool: "Instagram" },
        { id: "w11-2", text: "Получить на руки идеальные физические образцы одежды — принять, проверить, согласовать правки с фабрикой", tool: "Производство" },
        { id: "w11-3", text: "Назначить дату и локацию фотосессии для первой коллекции cottoluxe", tool: "Производство" },
        { id: "w11-4", text: "✅ KPI: Физические образцы получены и одобрены. Дата фотосессии назначена", tool: "Производство" },
      ]},
      { week: 12, days: "18–24 июня", title: "Финал Квартала и Триумф", tasks: [
        { id: "w12-1", text: "Снять роскошный контент для cottoluxe — задействовать продюсерскую команду и экспертизу в визуале", tool: "Production" },
        { id: "w12-2", text: "Подвести финансовые итоги 90 дней: выручка, расходы, чистая прибыль — зафиксировать все активы", tool: "CRM" },
        { id: "w12-3", text: "✅ KPI: Целевой стабильный доход достигнут. Работающие активы (агентство + автоворонка) + бренд cottoluxe готов к старту продаж", tool: "Notion" },
      ]},
    ],
  },
];

// ── Download helper ───────────────────────────────────────────────────────────
function downloadResult(content: string, filename: string, ext: "txt" | "md") {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `${filename}.${ext}`; a.click();
  URL.revokeObjectURL(url);
}

// ── Task card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, onUpdate, onDelete }: { task: Task; onUpdate: () => void; onDelete: () => void }) {
  const [loading,      setLoading]      = useState(false);
  const [executing,    setExecuting]    = useState(false);
  const [aiResult,     setAiResult]     = useState<string>(task.ai_result ?? "");
  const [aiWorker,     setAiWorker]     = useState<string>(task.ai_worker_name ?? "");
  const [aiClientName, setAiClientName] = useState<string>(task.ai_client_name ?? "");
  const [resultOpen,   setResultOpen]   = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [startError,   setStartError]   = useState("");

  const overdue = task.status !== "done" && task.due_date < new Date().toISOString().slice(0, 10);

  async function cycleStatus() {
    const next: Record<TaskStatus, TaskStatus> = { todo: "in_progress", in_progress: "done", done: "todo" };
    setLoading(true);
    try { await updateTask(task.id, { status: next[task.status] }); onUpdate(); }
    finally { setLoading(false); }
  }

  async function handleStart(e: React.MouseEvent) {
    e.stopPropagation();
    if (executing) return;
    setExecuting(true);
    setStartError("");
    try {
      const res  = await fetch(`/api/workspace/tasks/${task.id}/start`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "error");
      setAiResult(data.result ?? "");
      setAiWorker(data.worker_name ?? "");
      setAiClientName(data.client_name ?? "");
      setResultOpen(true);
      onUpdate();
    } catch (err: any) {
      setStartError(err.message ?? "Ошибка");
    } finally {
      setExecuting(false);
    }
  }

  async function copyResult() {
    await navigator.clipboard.writeText(aiResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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

        {/* Start button */}
        {task.status !== "done" && (
          <button
            onClick={handleStart}
            disabled={executing}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/15 text-accent text-[10px] font-medium hover:bg-accent/25 disabled:opacity-50 transition-all"
          >
            {executing
              ? <Loader2 size={9} className="animate-spin" />
              : <PlayCircle size={9} />}
            {executing ? "AI работает…" : "Старт"}
          </button>
        )}

        {/* Already executed indicator */}
        {aiResult && !executing && (
          <button
            onClick={(e) => { e.stopPropagation(); setResultOpen((p) => !p); }}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors"
          >
            <Bot size={9} />
            {aiWorker || "AI"}
          </button>
        )}

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

      {/* Error */}
      {startError && (
        <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
          <AlertCircle size={9} /> {startError}
        </p>
      )}

      {/* AI Result panel */}
      {aiResult && resultOpen && (
        <div className="mt-2 pt-2 border-t border-border space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-subtext">
              <Bot size={10} className="text-accent" />
              <span className="font-medium text-accent">{aiWorker}</span>
              {aiClientName && <><span className="text-subtext/40">·</span><span>{aiClientName}</span></>}
              <span className="text-subtext/40">·</span>
              <span className="text-emerald-400">выполнено</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={copyResult}
                className="flex items-center gap-0.5 text-[9px] text-subtext hover:text-text px-1 py-0.5 rounded border border-border hover:bg-white/5 transition-colors">
                {copied ? <><Check size={8} />Скопировано</> : <><Copy size={8} />Копировать</>}
              </button>
              <button onClick={() => downloadResult(aiResult, `task_${task.id}`, "txt")}
                className="text-[9px] text-subtext hover:text-text px-1 py-0.5 rounded border border-border hover:bg-white/5 transition-colors">
                .txt
              </button>
              <button onClick={() => downloadResult(aiResult, `task_${task.id}`, "md")}
                className="text-[9px] text-subtext hover:text-text px-1 py-0.5 rounded border border-border hover:bg-white/5 transition-colors">
                .md
              </button>
              <button onClick={() => setResultOpen(false)}
                className="p-0.5 text-subtext/40 hover:text-text rounded transition-colors">
                <X size={10} />
              </button>
            </div>
          </div>
          {/* Content */}
          <pre className="text-[10px] text-text/80 whitespace-pre-wrap leading-relaxed font-sans max-h-48 overflow-y-auto bg-background/50 rounded-lg p-2.5">
            {aiResult}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Social Media Analysis Section ─────────────────────────────────────────────
const PLATFORMS = ["Instagram", "TikTok", "YouTube", "Telegram", "ВКонтакте"] as const;
const TOP_CONTENT_TYPES = ["Reels/Shorts", "Фото-посты", "Карусели", "Stories", "Видео", "Тексты"] as const;

function SocialAnalysisSection() {
  const [open,      setOpen]      = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState("");
  const [error,     setError]     = useState("");
  const [form, setForm] = useState({
    platform: "Instagram" as string,
    handle: "",
    niche: "",
    followers: "",
    reach: "",
    engagement: "",
    topContent: "Reels/Shorts" as string,
    monthlyIncome: "",
    goal: "$3000/мес",
  });

  async function analyze() {
    setLoading(true); setError(""); setResult("");
    try {
      const r = await fetch("/api/hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "socialAnalysis",
          data: {
            platform:     form.platform,
            handle:       form.handle,
            niche:        form.niche,
            followers:    Number(form.followers) || 0,
            reach:        Number(form.reach) || 0,
            engagement:   Number(form.engagement) || 0,
            topContent:   form.topContent,
            monthlyIncome: Number(form.monthlyIncome) || 0,
            goal:         form.goal,
          },
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || "Ошибка");
      setResult(j.result || "Нет ответа");
    } catch (e: any) {
      setError(e.message || "Ошибка анализа");
    } finally { setLoading(false); }
  }

  return (
    <div className="card border border-accent/20 overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
          <BarChart2 size={13} className="text-accent" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-text">Анализ профиля в соц. сетях</p>
          <p className="text-xs text-subtext mt-0.5">AI анализирует твой профиль и подбирает лучшую стратегию развития</p>
        </div>
        {open ? <ChevronUp size={13} className="text-subtext shrink-0" /> : <ChevronDown size={13} className="text-subtext shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Form */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-subtext block mb-1">Платформа</label>
              <select className="input w-full text-xs" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-subtext block mb-1">@Аккаунт</label>
              <input className="input w-full text-xs" placeholder="username" value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-subtext block mb-1">Ниша</label>
              <input className="input w-full text-xs" placeholder="онлайн-образование" value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-subtext block mb-1">Подписчики</label>
              <input className="input w-full text-xs" type="number" placeholder="5000" value={form.followers} onChange={(e) => setForm({ ...form, followers: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-subtext block mb-1">Охват/пост</label>
              <input className="input w-full text-xs" type="number" placeholder="500" value={form.reach} onChange={(e) => setForm({ ...form, reach: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-subtext block mb-1">ER (вовлечённость %)</label>
              <input className="input w-full text-xs" type="number" step="0.1" placeholder="3.5" value={form.engagement} onChange={(e) => setForm({ ...form, engagement: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-subtext block mb-1">Топ-контент</label>
              <select className="input w-full text-xs" value={form.topContent} onChange={(e) => setForm({ ...form, topContent: e.target.value })}>
                {TOP_CONTENT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-subtext block mb-1">Доход сейчас ($/мес)</label>
              <input className="input w-full text-xs" type="number" placeholder="0" value={form.monthlyIncome} onChange={(e) => setForm({ ...form, monthlyIncome: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-subtext block mb-1">Цель дохода</label>
              <input className="input w-full text-xs" placeholder="$3000/мес" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} />
            </div>
          </div>

          <button
            onClick={analyze}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {loading ? <><Loader2 size={13} className="animate-spin" />Анализирую…</> : <><Sparkles size={13} />Проанализировать профиль</>}
          </button>

          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1.5"><AlertCircle size={11} />{error}</p>
          )}

          {result && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-accent flex items-center gap-1.5">
                  <BarChart2 size={11} /> Результат анализа
                </p>
                <button
                  onClick={() => navigator.clipboard.writeText(result)}
                  className="text-[10px] text-subtext hover:text-text px-1.5 py-0.5 rounded border border-border hover:bg-white/5 flex items-center gap-1 transition-colors"
                >
                  <Copy size={9} /> Копировать
                </button>
              </div>
              <pre className="text-[11px] text-text/80 whitespace-pre-wrap leading-relaxed font-sans bg-background/60 rounded-lg p-3 max-h-96 overflow-y-auto border border-border/50">
                {result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 90-Day Planner Section ────────────────────────────────────────────────────
const PHASE_COLORS = {
  amber:   { border: "border-amber-500/30",   bg: "bg-amber-500/5",   text: "text-amber-400",   bar: "bg-amber-400",   badge: "bg-amber-500/20 text-amber-300" },
  violet:  { border: "border-violet-500/30",  bg: "bg-violet-500/5",  text: "text-violet-400",  bar: "bg-violet-400",  badge: "bg-violet-500/20 text-violet-300" },
  emerald: { border: "border-emerald-500/30", bg: "bg-emerald-500/5", text: "text-emerald-400", bar: "bg-emerald-400", badge: "bg-emerald-500/20 text-emerald-300" },
} as const;

function Plan90Section() {
  const LS_KEY = "contentOS_plan90_v1";
  const [planState, setPlanState] = useState<Plan90State>(() => {
    try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : {}; }
    catch { return {}; }
  });
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([1]));
  const [expandedWeeks,  setExpandedWeeks]  = useState<Set<string>>(new Set(["1-1"]));
  const [aiLoadingTask,  setAiLoadingTask]  = useState<string | null>(null);
  const [postponeTask,   setPostponeTask]   = useState<string | null>(null);
  const [postponeDate,   setPostponeDate]   = useState("");

  function save(next: Plan90State) {
    setPlanState(next);
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
  }

  function setStatus(id: string, status: PlanTaskStatus, extra?: Partial<PlanTaskState>) {
    save({ ...planState, [id]: { ...(planState[id] || {}), status, ...extra } });
  }

  async function getAiAdvice(taskId: string, taskText: string) {
    setAiLoadingTask(taskId);
    try {
      const r = await fetch("/api/hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advise", data: { task: taskText, context: "90-day AMAI marketing plan, goal $9000" } }),
      });
      const j = await r.json();
      const advice = j.result ?? "Нет ответа от AI";
      save({ ...planState, [taskId]: { ...(planState[taskId] || { status: "todo" }), aiAdvice: advice } });
    } catch (e: any) {
      save({ ...planState, [taskId]: { ...(planState[taskId] || { status: "todo" }), aiAdvice: "Ошибка: " + (e?.message || "попробуйте снова") } });
    } finally { setAiLoadingTask(null); }
  }

  function phaseStats(phase: typeof PLAN_90[number]) {
    const all = phase.weeks.flatMap((w) => w.tasks);
    const done = all.filter((t) => planState[t.id]?.status === "done").length;
    return { total: all.length, done, pct: all.length ? Math.round((done / all.length) * 100) : 0 };
  }

  const totalDone  = PLAN_90.flatMap((p) => p.weeks.flatMap((w) => w.tasks)).filter((t) => planState[t.id]?.status === "done").length;
  const totalTasks = PLAN_90.flatMap((p) => p.weeks.flatMap((w) => w.tasks)).length;

  return (
    <div className="space-y-4 pt-2 border-t border-border mt-2">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-accent" />
          <h2 className="text-base font-bold text-text">План 90 дней — $9 000</h2>
        </div>
        <span className="text-xs text-subtext">{totalDone}/{totalTasks} задач выполнено</span>
        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden min-w-[80px] max-w-xs">
          <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${totalTasks ? Math.round((totalDone / totalTasks) * 100) : 0}%` }} />
        </div>
        <span className="text-xs text-accent font-medium">{totalTasks ? Math.round((totalDone / totalTasks) * 100) : 0}%</span>
      </div>

      {PLAN_90.map((phase) => {
        const ph  = phaseStats(phase);
        const col = PHASE_COLORS[phase.color as keyof typeof PHASE_COLORS];
        const isOpen = expandedPhases.has(phase.phase);

        return (
          <div key={phase.phase} className={clsx("rounded-xl border overflow-hidden", col.border)}>
            {/* Phase header */}
            <button
              className={clsx("w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]", col.bg)}
              onClick={() => setExpandedPhases((prev) => { const s = new Set(prev); s.has(phase.phase) ? s.delete(phase.phase) : s.add(phase.phase); return s; })}
            >
              <div className={clsx("w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shrink-0", col.badge)}>
                {phase.phase}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-text">Фаза {phase.phase}: {phase.title}</span>
                  <span className={clsx("text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0", col.badge)}>Дни {phase.days}</span>
                  <span className="text-xs text-subtext shrink-0">Цель: {phase.goal}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1 bg-border rounded-full overflow-hidden max-w-[160px]">
                    <div className={clsx("h-full rounded-full transition-all", col.bar)} style={{ width: `${ph.pct}%` }} />
                  </div>
                  <span className="text-[10px] text-subtext">{ph.done}/{ph.total} ({ph.pct}%)</span>
                </div>
              </div>
              {isOpen ? <ChevronUp size={13} className="text-subtext shrink-0" /> : <ChevronDown size={13} className="text-subtext shrink-0" />}
            </button>

            {/* Weeks */}
            {isOpen && (
              <div className="divide-y divide-border border-t border-border">
                {phase.weeks.map((week) => {
                  const wk = `${phase.phase}-${week.week}`;
                  const isWeekOpen = expandedWeeks.has(wk);
                  const wDone = week.tasks.filter((t) => planState[t.id]?.status === "done").length;

                  return (
                    <div key={week.week}>
                      <button
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors text-left"
                        onClick={() => setExpandedWeeks((prev) => { const s = new Set(prev); s.has(wk) ? s.delete(wk) : s.add(wk); return s; })}
                      >
                        <span className="text-[10px] text-subtext/60 w-20 shrink-0 tabular-nums">Нед.{week.week} · {week.days}</span>
                        <span className="flex-1 text-xs text-text font-medium">{week.title}</span>
                        <span className="text-[10px] text-subtext shrink-0">{wDone}/{week.tasks.length}</span>
                        {isWeekOpen ? <ChevronUp size={11} className="text-subtext shrink-0" /> : <ChevronDown size={11} className="text-subtext shrink-0" />}
                      </button>

                      {isWeekOpen && (
                        <div className="px-4 pb-3 space-y-2 bg-background/30">
                          {week.tasks.map((task) => {
                            const ts = planState[task.id] || { status: "todo" as PlanTaskStatus };
                            const isAiLoading = aiLoadingTask === task.id;
                            const isPostponing = postponeTask === task.id;

                            return (
                              <div key={task.id} className={clsx(
                                "rounded-lg border p-3 space-y-2 transition-all",
                                ts.status === "done"      ? "border-green-500/20 bg-green-500/5 opacity-70" :
                                ts.status === "postponed" ? "border-yellow-500/20 bg-yellow-500/5" :
                                "border-border/60 bg-nav/20"
                              )}>
                                <div className="flex items-start gap-2">
                                  {/* Done toggle */}
                                  <button
                                    className="mt-0.5 shrink-0 transition-transform hover:scale-110"
                                    onClick={() => setStatus(task.id, ts.status === "done" ? "todo" : "done")}
                                  >
                                    {ts.status === "done"      ? <CheckCircle2 size={14} className="text-green-400" /> :
                                     ts.status === "postponed" ? <Clock size={14} className="text-yellow-400" /> :
                                     <Circle size={14} className="text-subtext/50" />}
                                  </button>

                                  <div className="flex-1 min-w-0">
                                    <p className={clsx("text-xs text-text leading-snug", ts.status === "done" && "line-through opacity-50")}>
                                      {task.text}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                      {task.tool && (
                                        <span className="text-[9px] text-subtext/50 bg-border/40 px-1.5 py-0.5 rounded">{task.tool}</span>
                                      )}
                                      {ts.status === "postponed" && ts.postponedTo && (
                                        <span className="text-[9px] text-yellow-400">📅 {ts.postponedTo}</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action buttons */}
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                      onClick={() => getAiAdvice(task.id, task.text)}
                                      disabled={isAiLoading}
                                      title="AI совет"
                                      className="p-1.5 rounded text-subtext/50 hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-40"
                                    >
                                      {isAiLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                                    </button>
                                    {ts.status !== "done" && (
                                      <button
                                        onClick={() => { setPostponeTask(isPostponing ? null : task.id); setPostponeDate(""); }}
                                        title="Перенести"
                                        className={clsx(
                                          "p-1.5 rounded transition-colors",
                                          isPostponing ? "text-yellow-400 bg-yellow-400/10" : "text-subtext/50 hover:text-yellow-400 hover:bg-yellow-400/10"
                                        )}
                                      >
                                        <Clock size={11} />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Postpone picker */}
                                {isPostponing && (
                                  <div className="flex items-center gap-2 pt-1">
                                    <input
                                      type="date"
                                      className="input text-xs py-1 px-2 flex-1 min-w-0"
                                      value={postponeDate}
                                      onChange={(e) => setPostponeDate(e.target.value)}
                                    />
                                    <button
                                      disabled={!postponeDate}
                                      onClick={() => { setStatus(task.id, "postponed", { postponedTo: postponeDate }); setPostponeTask(null); setPostponeDate(""); }}
                                      className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 disabled:opacity-40 transition-colors shrink-0"
                                    >
                                      Перенести
                                    </button>
                                    <button onClick={() => setPostponeTask(null)} className="text-subtext hover:text-text shrink-0">
                                      <X size={12} />
                                    </button>
                                  </div>
                                )}

                                {/* AI advice result */}
                                {ts.aiAdvice && (
                                  <div className="pt-2 border-t border-border/50">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-1">
                                        <Sparkles size={9} className="text-accent" />
                                        <span className="text-[10px] text-accent font-medium">AI совет</span>
                                      </div>
                                      <button
                                        onClick={() => save({ ...planState, [task.id]: { ...ts, aiAdvice: undefined } })}
                                        className="text-subtext/30 hover:text-subtext transition-colors"
                                      >
                                        <X size={9} />
                                      </button>
                                    </div>
                                    <p className="text-[10px] text-text/70 leading-relaxed whitespace-pre-wrap">{ts.aiAdvice}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
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
  const [userRole, setUserRole]   = useState<string | null>(null);
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

  // AI Task Generation
  const [showAiGen, setShowAiGen]       = useState(false);
  const [aiIdeas, setAiIdeas]           = useState("");
  const [aiPeriod, setAiPeriod]         = useState<TaskPeriod>("week");
  const [aiPriority, setAiPriority]     = useState<TaskPriority>("medium");
  const [aiDueDate, setAiDueDate]       = useState("");
  const [aiAssignee, setAiAssignee]     = useState("self");
  const [aiLoading, setAiLoading]       = useState(false);
  const [aiTasks, setAiTasks]           = useState<Array<{ title: string; description: string; priority: TaskPriority; period: TaskPeriod; due_date: string; tags: string; selected: boolean }>>([]);
  const [aiError, setAiError]           = useState("");
  const [addingAi, setAddingAi]         = useState(false);

  // Fetch user role (to gate admin-only sections)
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setUserRole(d?.role ?? null))
      .catch(() => {});
  }, []);

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

  async function handleAiGenerate() {
    if (!aiIdeas.trim()) return;
    setAiLoading(true);
    setAiError("");
    setAiTasks([]);
    try {
      const r = await fetch("/api/hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generateTasks", data: { ideas: aiIdeas, period: aiPeriod, priority: aiPriority, dueDate: aiDueDate } }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || "Ошибка");
      const raw: string = j.result ?? "[]";
      const jsonStr = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(jsonStr);
      setAiTasks(parsed.map((t: any) => ({ ...t, selected: true })));
    } catch (e: any) {
      setAiError(e.message || "Ошибка генерации");
    } finally { setAiLoading(false); }
  }

  async function handleAddAiTasks() {
    const selected = aiTasks.filter((t) => t.selected);
    if (!selected.length) return;
    setAddingAi(true);
    try {
      for (const t of selected) {
        const created = await createTask({
          title: t.title,
          description: t.description,
          period: t.period || aiPeriod,
          due_date: t.due_date || aiDueDate || new Date().toISOString().slice(0, 10),
          priority: t.priority || aiPriority,
          tags: t.tags ? t.tags.split(",").map((x: string) => x.trim()).filter(Boolean) : [],
        });
        // If AI worker selected — send to execution immediately
        if (aiAssignee !== "self" && created?.id) {
          try {
            await fetch(`/api/workspace/tasks/${created.id}/start`, { method: "POST" });
          } catch { /* non-critical */ }
        }
      }
      setAiTasks([]);
      setAiIdeas("");
      setShowAiGen(false);
      await load();
    } finally { setAddingAi(false); }
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
      {/* ── AI Task Generation Modal ─────────────────────────────────────────── */}
      {showAiGen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-accent/30 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Sparkles size={14} className="text-accent" />
                </div>
                <h2 className="text-sm font-semibold text-text">AI Генерация задач</h2>
              </div>
              <button onClick={() => setShowAiGen(false)} className="text-subtext hover:text-text transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Ideas textarea */}
              <div>
                <label className="text-xs text-subtext block mb-1.5">Опиши свои идеи и что нужно сделать *</label>
                <textarea
                  rows={4}
                  className="input w-full resize-none"
                  placeholder="Например: нужно записать видео для клиентов, сделать контент-план, созвониться с Алиной, написать стратегию на апрель..."
                  value={aiIdeas}
                  onChange={(e) => setAiIdeas(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAiGenerate(); }}
                />
                <p className="text-[10px] text-subtext/60 mt-1">Ctrl+Enter — генерировать</p>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-subtext block mb-1">Период</label>
                  <select className="input w-full" value={aiPeriod} onChange={(e) => setAiPeriod(e.target.value as TaskPeriod)}>
                    <option value="day">Сегодня</option>
                    <option value="week">Неделя</option>
                    <option value="month">Месяц</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-subtext block mb-1">Приоритет</label>
                  <select className="input w-full" value={aiPriority} onChange={(e) => setAiPriority(e.target.value as TaskPriority)}>
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-subtext block mb-1">Дедлайн</label>
                  <input type="date" className="input w-full" value={aiDueDate} onChange={(e) => setAiDueDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-subtext block mb-1">Исполнитель</label>
                  <select className="input w-full" value={aiAssignee} onChange={(e) => setAiAssignee(e.target.value)}>
                    <option value="self">👤 Я сам</option>
                    {TEAM_WORKERS.map((w) => (
                      <option key={w.id} value={w.id}>{w.emoji} {w.name} ({w.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              {aiAssignee !== "self" && (
                <div className="flex items-center gap-2 p-3 bg-accent/5 border border-accent/20 rounded-lg">
                  <Bot size={13} className="text-accent shrink-0" />
                  <p className="text-xs text-subtext">
                    Задачи будут отправлены на выполнение AI-сотруднику <strong className="text-text">{TEAM_WORKERS.find(w => w.id === aiAssignee)?.name}</strong> сразу после добавления
                  </p>
                </div>
              )}

              {/* Generate button */}
              {aiTasks.length === 0 && (
                <button
                  onClick={handleAiGenerate}
                  disabled={aiLoading || !aiIdeas.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent hover:bg-accent/90 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                >
                  {aiLoading ? <><Loader2 size={14} className="animate-spin" />Генерирую задачи…</> : <><Sparkles size={14} />Сгенерировать задачи</>}
                </button>
              )}

              {aiError && (
                <p className="text-xs text-red-400 flex items-center gap-1.5"><AlertCircle size={12} />{aiError}</p>
              )}

              {/* Generated tasks list */}
              {aiTasks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-text">Сгенерировано {aiTasks.length} задач</p>
                    <div className="flex gap-2">
                      <button onClick={() => setAiTasks(t => t.map(x => ({ ...x, selected: true })))} className="text-xs text-accent hover:underline">Все</button>
                      <button onClick={() => setAiTasks(t => t.map(x => ({ ...x, selected: false })))} className="text-xs text-subtext hover:underline">Снять</button>
                    </div>
                  </div>
                  {aiTasks.map((t, i) => (
                    <label key={i} className={clsx("flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors", t.selected ? "border-accent/40 bg-accent/5" : "border-border bg-nav/50")}>
                      <input
                        type="checkbox"
                        checked={t.selected}
                        onChange={() => setAiTasks(prev => prev.map((x, j) => j === i ? { ...x, selected: !x.selected } : x))}
                        className="mt-0.5 shrink-0 accent-accent"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text leading-snug">{t.title}</p>
                        {t.description && <p className="text-xs text-subtext mt-0.5 leading-relaxed">{t.description}</p>}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={clsx("text-[10px] px-1.5 py-0.5 rounded font-medium", t.priority === "high" ? "bg-red-900 text-red-300" : t.priority === "medium" ? "bg-yellow-900 text-yellow-300" : "bg-slate-700 text-slate-300")}>
                            {t.priority === "high" ? "Высокий" : t.priority === "medium" ? "Средний" : "Низкий"}
                          </span>
                          {t.due_date && <span className="text-[10px] text-subtext/70">{t.due_date}</span>}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {aiTasks.length > 0 && (
              <div className="px-5 py-4 border-t border-border flex gap-2 justify-between shrink-0">
                <button onClick={() => { setAiTasks([]); setAiError(""); }} className="btn-ghost text-sm">
                  ← Назад
                </button>
                <button
                  onClick={handleAddAiTasks}
                  disabled={addingAi || !aiTasks.some(t => t.selected)}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  {addingAi ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Добавить {aiTasks.filter(t => t.selected).length} задач
                  {aiAssignee !== "self" && " → AI"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Header: live clock ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-text">Мой кабинет</h1>
          <p className="text-sm text-subtext mt-0.5 capitalize">{fmtDate(now)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl sm:text-2xl font-mono font-bold text-accent tabular-nums">{fmtClock(now)}</p>
          <p className="text-xs text-subtext mt-0.5">UTC+5</p>
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
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-text">{PERIOD_LABELS[activeTab]}</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => { setShowAiGen(true); setAiTasks([]); setAiError(""); }} className="btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3 border border-accent/30 text-accent hover:bg-accent/10">
                <Sparkles size={12} /> AI Генерация
              </button>
              <button onClick={() => setShowAdd(!showAdd)} className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3">
                <Plus size={12} /> Задача
              </button>
            </div>
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
                onKeyDown={(e) => { if (e.key === "Enter") handleTimerToggle(); }}
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

      {/* ── Admin-only sections ──────────────────────────────────────────────── */}
      {userRole === "admin" && (
        <>
          {/* ── Social Media Analysis ──────────────────────────────────────────── */}
          <SocialAnalysisSection />

          {/* ── 90-Day Planner ─────────────────────────────────────────────────── */}
          <Plan90Section />
        </>
      )}
    </div>
  );
}
