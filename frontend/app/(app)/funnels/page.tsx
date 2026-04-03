"use client";
import { useState, useEffect, useCallback } from "react";
import {
  GitBranch, Plus, X, ArrowRight, Users, DollarSign,
  MessageSquare, Sparkles, RefreshCw, ChevronRight,
  Copy, Check, Zap, Target, TrendingUp, Play, Bot,
} from "lucide-react";
import clsx from "clsx";

// ── Types ──────────────────────────────────────────────────────────────────────
type FunnelStage =
  | "content"     // Контент/Реклама
  | "bot"         // Бот / лид-магнит
  | "mini_sale"   // Автопродажа мини-продукта
  | "nurture"     // Догрев
  | "consult"     // Консультация
  | "sale"        // Продажа
  | "upsell";     // Апселл / другие платформы

interface FunnelLead {
  id: string;
  name: string;
  source: string;
  stage: FunnelStage;
  enteredAt: string;
  notes: string;
  value: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STAGES: { id: FunnelStage; label: string; description: string; icon: React.ElementType; color: string }[] = [
  { id: "content",   label: "Контент / Реклама", description: "Первый контакт через пост или рекламу",  icon: Play,         color: "border-blue-400/30 bg-blue-400/5   text-blue-400"    },
  { id: "bot",       label: "Бот / Лид-магнит",  description: "Подписка, получение бесплатного ценного", icon: Bot,          color: "border-accent/30 bg-accent/5       text-accent"       },
  { id: "mini_sale", label: "Мини-продукт",       description: "Автоматическая продажа недорогого оффера", icon: DollarSign,  color: "border-amber-400/30 bg-amber-400/5 text-amber-400"    },
  { id: "nurture",   label: "Догрев",             description: "Прогрев через контент на всех платформах", icon: TrendingUp,  color: "border-orange-400/30 bg-orange-400/5 text-orange-400" },
  { id: "consult",   label: "Консультация",       description: "Квалификация и первый личный контакт",    icon: MessageSquare, color: "border-purple-400/30 bg-purple-400/5 text-purple-400"},
  { id: "sale",      label: "Продажа",            description: "Закрытие на основной продукт",            icon: Target,      color: "border-emerald-400/30 bg-emerald-400/5 text-emerald-400"},
  { id: "upsell",    label: "Апселл / Перевод",   description: "Переход на следующий уровень или платформу", icon: ArrowRight, color: "border-pink-400/30 bg-pink-400/5 text-pink-400"      },
];

const SOURCES = ["Instagram", "Telegram", "YouTube", "Facebook", "Threads", "Реклама", "Рекомендация"];

const MOCK_LEADS: FunnelLead[] = [
  { id: "fl1", name: "Айдана М.",    source: "Instagram",    stage: "nurture",   enteredAt: new Date(Date.now() - 5*86400000).toISOString(), notes: "Открывала 3 сторис, лайкнула пост", value: 500 },
  { id: "fl2", name: "Тимур Б.",     source: "Telegram",     stage: "consult",   enteredAt: new Date(Date.now() - 2*86400000).toISOString(), notes: "Скачал PDF-гайд, написал вопросы",   value: 500 },
  { id: "fl3", name: "Жанна А.",     source: "Реклама",      stage: "mini_sale", enteredAt: new Date(Date.now() - 1*86400000).toISOString(), notes: "Кликнула на рекламу",                value: 29  },
  { id: "fl4", name: "Марат С.",     source: "YouTube",      stage: "bot",       enteredAt: new Date(Date.now() - 7*86400000).toISOString(), notes: "Подписался после видео",             value: 0   },
  { id: "fl5", name: "Карина Л.",    source: "Рекомендация", stage: "sale",      enteredAt: new Date(Date.now() - 3*86400000).toISOString(), notes: "Пришла от Дины. Горячая.",          value: 3000},
  { id: "fl6", name: "Бауыржан К.",  source: "Instagram",    stage: "content",   enteredAt: new Date(Date.now() - 9*86400000).toISOString(), notes: "Лайкает, не пишет",                 value: 0   },
];

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return `${Math.floor(diff / 86400)} д назад`;
}

// ── Lead chip ─────────────────────────────────────────────────────────────────
function LeadChip({ lead, onMove }: { lead: FunnelLead; onMove: (id: string, stage: FunnelStage) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-surface2 border border-border rounded-lg p-2 text-xs hover:border-accent/30 transition-colors">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[9px] font-bold shrink-0">
            {lead.name[0]}
          </div>
          <span className="font-medium text-text truncate">{lead.name}</span>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="text-subtext hover:text-accent shrink-0">
          <ChevronRight size={10} />
        </button>
      </div>
      <p className="text-[10px] text-subtext mt-1 truncate">{lead.source} · {timeAgo(lead.enteredAt)}</p>
      {lead.value > 0 && <p className="text-[10px] text-emerald-400">${lead.value}</p>}

      {open && (
        <div className="mt-2 pt-2 border-t border-border space-y-1">
          <p className="text-[10px] text-subtext">{lead.notes}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {STAGES.filter((s) => s.id !== lead.stage).map((s) => (
              <button
                key={s.id}
                onClick={() => { onMove(lead.id, s.id); setOpen(false); }}
                className="text-[9px] px-1.5 py-0.5 rounded border border-border text-subtext hover:text-text hover:border-accent/30 transition-colors"
              >
                → {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Agency Growth Plan Card ───────────────────────────────────────────────────
function AgencyGrowthPlanCard() {
  const [product,  setProduct]  = useState("");
  const [audience, setAudience] = useState("");
  const [revenue,  setRevenue]  = useState("");
  const [goal,     setGoal]     = useState("10000");
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState("");
  const [copied,   setCopied]   = useState(false);
  const [open,     setOpen]     = useState(false);

  async function generate() {
    setLoading(true); setResult("");
    try {
      const res = await fetch("/api/hub", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "agencyGrowthPlan",
          data: { product, audience, monthlyRevenue: Number(revenue) || 0, revenueGoal: Number(goal) || 10000 },
        }),
      });
      const json = await res.json();
      setResult(json.result ?? "");
      setOpen(false);
    } catch { setResult("Ошибка."); }
    finally { setLoading(false); }
  }

  return (
    <div className="card p-4 space-y-3 border-accent/20 bg-accent/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-accent" />
          <p className="text-sm font-semibold text-text">План роста и масштабирования агентства</p>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="text-xs text-accent hover:text-accent/80">
          {open ? "Свернуть" : "Настроить →"}
        </button>
      </div>

      {open && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] text-subtext uppercase tracking-wide">Что продаёте</label>
            <input className="input w-full text-sm" placeholder="Продюсирование, SMM, курсы..." value={product} onChange={(e) => setProduct(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-subtext uppercase tracking-wide">Целевая аудитория</label>
            <input className="input w-full text-sm" placeholder="Эксперты, предприниматели..." value={audience} onChange={(e) => setAudience(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-subtext uppercase tracking-wide">Текущая выручка $/мес</label>
            <input className="input w-full text-sm" placeholder="2000" type="number" value={revenue} onChange={(e) => setRevenue(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-subtext uppercase tracking-wide">Цель $/мес</label>
            <select className="input w-full text-sm" value={goal} onChange={(e) => setGoal(e.target.value)}>
              {["5000","10000","25000","50000","100000"].map(g => <option key={g} value={g}>${g}</option>)}
            </select>
          </div>
        </div>
      )}

      <button
        onClick={generate}
        disabled={loading}
        className="btn-primary flex items-center gap-2"
      >
        {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {loading ? "Генерируем план…" : "Сгенерировать полный план роста"}
      </button>

      {result && (
        <div className="relative">
          <pre className="text-xs text-text leading-relaxed whitespace-pre-wrap font-sans bg-surface2 rounded-xl p-4 max-h-96 overflow-y-auto">
            {result}
          </pre>
          <button
            onClick={async () => { await navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-surface border border-border hover:text-accent transition-colors"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} className="text-subtext" />}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Stage mapping: CRM stages → FunnelStage ──────────────────────────────────
function mapStage(s: string): FunnelStage {
  const map: Record<string, FunnelStage> = {
    new: "content", contacted: "bot", replied: "nurture",
    interested: "consult", call: "consult", sale: "sale", closed: "upsell",
  };
  return (map[s] as FunnelStage) ?? "content";
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FunnelsPage() {
  const [leads, setLeads] = useState<FunnelLead[]>(MOCK_LEADS);
  const [addingTo, setAddingTo]   = useState<FunnelStage | null>(null);

  // Load real leads from CRM on mount
  const loadLeads = useCallback(async () => {
    try {
      const r = await fetch("/api/leads");
      if (!r.ok) return;
      const data = await r.json();
      if (Array.isArray(data) && data.length > 0) {
        setLeads(data.map((l: any) => ({
          id:        l.id,
          name:      l.name,
          source:    l.source || "—",
          stage:     mapStage(l.stage),
          enteredAt: l.date ? new Date(l.date).toISOString() : new Date().toISOString(),
          notes:     l.notes || "",
          value:     Number(l.value) || 0,
        })));
      }
    } catch { /* keep mock data on error */ }
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);
  const [newName, setNewName]     = useState("");
  const [newSource, setNewSource] = useState("Instagram");
  const [newNotes, setNewNotes]   = useState("");
  const [newValue, setNewValue]   = useState(0);

  // AI sequence generator
  const [seqStage, setSeqStage]     = useState<FunnelStage>("nurture");
  const [seqLoading, setSeqLoading] = useState(false);
  const [seqResult, setSeqResult]   = useState("");
  const [seqCopied, setSeqCopied]   = useState(false);

  async function moveLead(id: string, stage: FunnelStage) {
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, stage } : l));
    // Persist to CRM (best-effort, no await blocking UI)
    fetch(`/api/leads/${id}/stage`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    }).catch(() => {});
  }

  async function addLead() {
    if (!newName.trim()) return;
    const optimisticId = `fl_${Date.now()}`;
    const lead: FunnelLead = {
      id:        optimisticId,
      name:      newName.trim(),
      source:    newSource,
      stage:     addingTo!,
      enteredAt: new Date().toISOString(),
      notes:     newNotes.trim(),
      value:     newValue,
    };
    setLeads((prev) => [lead, ...prev]);
    setNewName(""); setNewNotes(""); setNewValue(0);
    setAddingTo(null);
    // Save to CRM API
    try {
      const r = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:   lead.name,
          source: lead.source,
          stage:  "new",
          notes:  lead.notes,
          value:  lead.value,
        }),
      });
      if (r.ok) {
        const saved = await r.json();
        // Replace optimistic ID with real ID
        setLeads((prev) => prev.map((l) => l.id === optimisticId ? { ...l, id: saved.id } : l));
      }
    } catch { /* keep optimistic entry */ }
  }

  async function generateSequence() {
    setSeqLoading(true);
    setSeqResult("");
    const stageLabel = STAGES.find((s) => s.id === seqStage)?.label ?? seqStage;
    try {
      const res = await fetch("/api/hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "funnelSequence",
          data: { stage: seqStage, stageLabel },
        }),
      });
      const json = await res.json();
      setSeqResult(json.result ?? "");
    } catch {
      setSeqResult("Ошибка генерации.");
    } finally {
      setSeqLoading(false);
    }
  }

  // Stats
  const totalValue = leads.filter((l) => l.stage === "sale" || l.stage === "upsell").reduce((s, l) => s + l.value, 0);
  const conversionRate = leads.length > 0 ? Math.round((leads.filter((l) => l.stage === "sale").length / leads.length) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text flex items-center gap-2">
            <GitBranch size={20} className="text-accent" /> Воронки продаж
          </h1>
          <p className="text-sm text-subtext mt-0.5">
            Путь клиента: от контента до покупки и апселла
          </p>
        </div>
      </div>

      {/* ── KPI ───────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger">
        <div className="card p-3 text-center">
          <p className="text-lg font-bold text-text">{leads.length}</p>
          <p className="text-[10px] text-subtext">Всего лидов</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-lg font-bold text-amber-400">{leads.filter(l => l.stage === "consult").length}</p>
          <p className="text-[10px] text-subtext">На консультации</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-lg font-bold text-emerald-400">${totalValue.toLocaleString()}</p>
          <p className="text-[10px] text-subtext">Закрыто</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-lg font-bold text-accent">{conversionRate}%</p>
          <p className="text-[10px] text-subtext">Конверсия</p>
        </div>
      </div>

      {/* ── Kanban funnel ─────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-max">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage === stage.id);
            const StageIcon  = stage.icon;
            return (
              <div key={stage.id} className="w-44 flex flex-col gap-2 shrink-0">
                {/* Column header */}
                <div className={clsx("rounded-xl p-2.5 border", stage.color)}>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      <StageIcon size={12} />
                      <span className="text-[11px] font-semibold">{stage.label}</span>
                    </div>
                    <span className="text-[11px] font-bold">{stageLeads.length}</span>
                  </div>
                  <p className="text-[9px] opacity-70 leading-snug">{stage.description}</p>
                </div>

                {/* Leads */}
                <div className="flex flex-col gap-1.5 flex-1 min-h-[120px]">
                  {stageLeads.map((lead) => (
                    <LeadChip key={lead.id} lead={lead} onMove={moveLead} />
                  ))}
                </div>

                {/* Add button */}
                <button
                  onClick={() => setAddingTo(stage.id)}
                  className="flex items-center justify-center gap-1 py-1.5 rounded-lg border border-dashed border-border text-subtext hover:text-accent hover:border-accent/40 text-[11px] transition-colors"
                >
                  <Plus size={11} /> Добавить
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── AI Sequence Generator ──────────────────────────────────────────────── */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-accent" />
          <p className="text-sm font-semibold text-text">AI-сценарий для этапа</p>
        </div>
        <p className="text-xs text-subtext">Выбери этап воронки — AI напишет готовые сообщения и сценарий догрева</p>

        <div className="flex gap-2 flex-wrap">
          {STAGES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSeqStage(s.id)}
              className={clsx(
                "text-[11px] px-2.5 py-1 rounded-full border transition-colors",
                seqStage === s.id
                  ? "bg-accent/20 border-accent/40 text-accent"
                  : "border-border text-subtext hover:text-text hover:border-accent/30"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button
          onClick={generateSequence}
          disabled={seqLoading}
          className="btn-primary flex items-center gap-2"
        >
          {seqLoading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
          Сгенерировать сценарий
        </button>

        {seqResult && (
          <div className="relative">
            <pre className="text-xs text-text leading-relaxed whitespace-pre-wrap font-sans bg-surface2 rounded-xl p-4 max-h-64 overflow-y-auto">
              {seqResult}
            </pre>
            <button
              onClick={async () => { await navigator.clipboard.writeText(seqResult); setSeqCopied(true); setTimeout(() => setSeqCopied(false), 2000); }}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-surface border border-border hover:text-accent transition-colors"
            >
              {seqCopied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} className="text-subtext" />}
            </button>
          </div>
        )}
      </div>

      {/* ── 3 Client Journey Paths ───────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target size={15} className="text-accent" />
          <h2 className="text-sm font-semibold text-text">3 пути клиента к покупке</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              id: "path1",
              title: "Контент → Автопродажа",
              color: "border-blue-400/30 bg-blue-400/5",
              headerColor: "text-blue-400",
              emoji: "📱",
              steps: [
                { icon: "📱", label: "Контент / Реклама",    desc: "Reels, пост, таргет" },
                { icon: "🤖", label: "Бот / Лид-магнит",    desc: "Подписка, PDF, гайд" },
                { icon: "💰", label: "Автопродажа мини",     desc: "$9–99, оплата в боте" },
                { icon: "🔥", label: "Догрев на платформах", desc: "TG, IG, email" },
                { icon: "🚀", label: "Апселл",               desc: "Наставничество / VIP" },
              ],
            },
            {
              id: "path2",
              title: "Парсинг → Консультация",
              color: "border-emerald-400/30 bg-emerald-400/5",
              headerColor: "text-emerald-400",
              emoji: "🎯",
              steps: [
                { icon: "🔍", label: "Парсинг аудитории",   desc: "Чаты, платформы" },
                { icon: "✉️", label: "Личное сообщение",    desc: "AI-аутрич, 3 варианта" },
                { icon: "📞", label: "Диагностика",          desc: "Зум/телефон, 30 мин" },
                { icon: "🤝", label: "Продажа",              desc: "Закрытие на продукт" },
                { icon: "📈", label: "Онбординг",            desc: "Старт работы" },
              ],
            },
            {
              id: "path3",
              title: "Ретаргетинг → Апселл",
              color: "border-purple-400/30 bg-purple-400/5",
              headerColor: "text-purple-400",
              emoji: "♻️",
              steps: [
                { icon: "📊", label: "Аналитика базы",      desc: "Кто не купил / не дошёл" },
                { icon: "🔄", label: "Ретаргетинг / догрев", desc: "Email, Telegram, реклама" },
                { icon: "🎁", label: "Новый оффер",          desc: "Бонус, скидка, ивент" },
                { icon: "📲", label: "Перевод на платформы", desc: "TG-бот, канал, школа" },
                { icon: "💎", label: "Апселл / Follow-up",  desc: "VIP продукт, рефералы" },
              ],
            },
          ].map((path) => (
            <div key={path.id} className={`card border ${path.color} p-4 space-y-3`}>
              <p className={`text-sm font-bold ${path.headerColor}`}>{path.emoji} {path.title}</p>
              <div className="space-y-1.5">
                {path.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold text-subtext">{i + 1}</div>
                      <span className="text-sm">{step.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-text leading-tight">{step.label}</p>
                      <p className="text-[10px] text-subtext">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Agency Growth Plan ───────────────────────────────────────────────── */}
      <AgencyGrowthPlanCard />

      {/* ── Add lead modal ────────────────────────────────────────────────────── */}
      {addingTo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <p className="text-sm font-semibold text-text">
                + Лид → {STAGES.find((s) => s.id === addingTo)?.label}
              </p>
              <button onClick={() => setAddingTo(null)} className="p-2 rounded-lg hover:bg-white/5 text-subtext">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <input
                className="input w-full text-sm"
                placeholder="Имя лида"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addLead(); }}
                autoFocus
              />
              <select className="input w-full text-sm" value={newSource} onChange={(e) => setNewSource(e.target.value)}>
                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input
                type="number"
                className="input w-full text-sm"
                placeholder="Потенциальная ценность ($)"
                value={newValue || ""}
                onChange={(e) => setNewValue(Number(e.target.value))}
                min={0}
              />
              <textarea
                className="input w-full text-sm h-16 resize-none"
                placeholder="Заметки..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setAddingTo(null)} className="btn-ghost flex-1">Отмена</button>
              <button onClick={addLead} disabled={!newName.trim()} className="btn-primary flex-1">Добавить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
