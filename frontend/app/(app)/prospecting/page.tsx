"use client";
import { useState, useCallback } from "react";
import {
  Search, Sparkles, Copy, Check, Send, User, MessageSquare,
  Instagram, RefreshCw, ChevronDown, ChevronUp, Plus, X, Zap,
  AlertCircle, Globe, Youtube, CheckCircle2, Clock, Filter,
} from "lucide-react";
import clsx from "clsx";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Lead {
  id: string;
  name: string;
  platform: string;
  niche: string;
  followers?: string;
  description: string;
  contactHint: string;
  status: "new" | "contacted" | "replied" | "qualified" | "closed";
}

interface OutreachMessage {
  platform: string;
  subject?: string;
  message: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: "instagram", label: "Instagram",  icon: Instagram },
  { id: "telegram",  label: "Telegram",   icon: Send       },
  { id: "youtube",   label: "YouTube",    icon: Youtube    },
  { id: "facebook",  label: "Facebook",   icon: Globe      },
  { id: "threads",   label: "Threads",    icon: Globe      },
];

const NICHES = [
  "онлайн-образование", "коучинг", "инфобизнес", "фитнес", "психология",
  "бизнес", "маркетинг", "финансы", "нутрициология", "йога", "handmade",
  "дети и родители", "юриспруденция", "медицина", "стиль и мода",
];

const STATUS_CONFIG: Record<Lead["status"], { label: string; color: string }> = {
  new:       { label: "Новый",       color: "text-subtext bg-white/5 border-border"                        },
  contacted: { label: "Написали",    color: "text-blue-400 bg-blue-400/10 border-blue-400/20"              },
  replied:   { label: "Ответили",    color: "text-amber-400 bg-amber-400/10 border-amber-400/20"           },
  qualified: { label: "Квалифиц.",   color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"     },
  closed:    { label: "Закрыт",      color: "text-purple-400 bg-purple-400/10 border-purple-400/20"        },
};

// ── Mock lead generator ────────────────────────────────────────────────────────
function generateMockLeads(niche: string, platform: string): Lead[] {
  const names = [
    "Алия Сейткали", "Марат Оспанов", "Дина Берекова", "Асель Нурова",
    "Тимур Касымов", "Жанна Абдукова", "Бауыржан Серов", "Айгерим Тлеу",
    "Санжар Мусин", "Карина Жумагали",
  ];
  return names.map((name, i) => ({
    id: `lead_${Date.now()}_${i}`,
    name,
    platform,
    niche,
    followers: ["1.2K", "5.4K", "12K", "890", "34K", "2.1K", "8.7K", "450", "67K", "3.3K"][i],
    description: [
      `Эксперт по ${niche}. Делюсь опытом и кейсами.`,
      `Помогаю людям в нише ${niche}. Автор курса.`,
      `${niche} для начинающих. Бесплатные материалы.`,
      `Практик в ${niche} с 5-летним опытом.`,
      `Онлайн-школа ${niche}. Более 300 учеников.`,
      `Личный бренд в ${niche}. Консультации.`,
      `Монетизирую знания в ${niche}.`,
      `Только начинаю путь в ${niche}.`,
      `${niche} — моя страсть и профессия.`,
      `Группы и наставничество по ${niche}.`,
    ][i],
    contactHint: platform === "instagram" ? `@${name.toLowerCase().replace(" ", "_")}` :
                 platform === "telegram"  ? `t.me/${name.toLowerCase().replace(" ", "")}` :
                                            `${name}`,
    status: "new",
  }));
}

// ── Lead card ─────────────────────────────────────────────────────────────────
function LeadCard({
  lead, onStatusChange, onGenerateMessage, onAddToCRM,
}: {
  lead: Lead;
  onStatusChange:    (id: string, status: Lead["status"]) => void;
  onGenerateMessage: (lead: Lead) => void;
  onAddToCRM:        (lead: Lead) => void;
}) {
  const [copied,    setCopied]    = useState(false);
  const [showMenu,  setShowMenu]  = useState(false);
  const [addedCRM,  setAddedCRM]  = useState(false);
  const cfg = STATUS_CONFIG[lead.status];

  async function copyContact() {
    await navigator.clipboard.writeText(lead.contactHint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card p-3 flex flex-col gap-2 group hover:border-accent/30 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm shrink-0">
            {lead.name[0]}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-text truncate">{lead.name}</p>
            <p className="text-[10px] text-subtext">{lead.platform} · {lead.followers}</p>
          </div>
        </div>
        {/* Status dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu((v) => !v)}
            className={clsx("text-[10px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1", cfg.color)}
          >
            {cfg.label}
            <ChevronDown size={9} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 z-10 bg-surface border border-border rounded-xl shadow-xl py-1 min-w-[130px]">
              {(Object.entries(STATUS_CONFIG) as [Lead["status"], typeof STATUS_CONFIG[Lead["status"]]][]).map(([s, c]) => (
                <button
                  key={s}
                  onClick={() => { onStatusChange(lead.id, s); setShowMenu(false); }}
                  className={clsx("w-full text-left px-3 py-1.5 text-[11px] hover:bg-white/5 transition-colors", c.color.split(" ")[0])}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-[11px] text-subtext leading-snug line-clamp-2">{lead.description}</p>

      {/* Contact */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-subtext font-mono truncate flex-1 bg-surface2 px-2 py-1 rounded">
          {lead.contactHint}
        </span>
        <button onClick={copyContact} className="p-1 rounded hover:bg-white/5 text-subtext hover:text-accent transition-colors shrink-0">
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
        </button>
      </div>

      {/* Actions */}
      <button
        onClick={() => onGenerateMessage(lead)}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent text-[11px] font-medium transition-colors"
      >
        <Sparkles size={11} /> Написать сообщение AI
      </button>
      <button
        disabled={addedCRM}
        onClick={() => { onAddToCRM(lead); setAddedCRM(true); }}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-medium transition-colors disabled:opacity-50"
      >
        {addedCRM ? <><Check size={11} /> В CRM добавлен</> : <>+ Добавить в CRM</>}
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProspectingPage() {
  const [platform,  setPlatform]   = useState("instagram");
  const [niche,     setNiche]      = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [leads,     setLeads]      = useState<Lead[]>([]);
  const [searching, setSearching]  = useState(false);
  const [filterStatus, setFilterStatus] = useState<Lead["status"] | "all">("all");

  // Project context — what we're selling
  const [projectCtx, setProjectCtx] = useState({ product: "", audience: "", goal: "" });
  const [showCtx, setShowCtx] = useState(true);

  // Outreach generator
  const [genLead,    setGenLead]    = useState<Lead | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [messages,   setMessages]   = useState<OutreachMessage[]>([]);
  const [copiedIdx,  setCopiedIdx]  = useState<number | null>(null);

  // Bulk outreach
  const [bulkNiche,   setBulkNiche]   = useState("");
  const [bulkGoal,    setBulkGoal]    = useState("продажа продукта");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMsg,     setBulkMsg]     = useState("");
  const [bulkCopied,  setBulkCopied]  = useState(false);

  // Ads section
  const [adPlatform,  setAdPlatform]  = useState("Instagram");
  const [adObjective, setAdObjective] = useState("лиды");
  const [adLoading,   setAdLoading]   = useState(false);
  const [adResult,    setAdResult]    = useState("");
  const [adCopied,    setAdCopied]    = useState(false);

  const activeNiche = niche || customNiche;

  async function handleSearch() {
    if (!activeNiche) return;
    setSearching(true);
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 800));
    const newLeads = generateMockLeads(activeNiche, platform);
    setLeads(newLeads);
    setSearching(false);
  }

  function handleStatusChange(id: string, status: Lead["status"]) {
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
  }

  async function handleAddToCRM(lead: Lead) {
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:    lead.name,
          source:  lead.platform,
          niche:   lead.niche,
          notes:   lead.description,
          stage:   "new",
          contact: lead.contactHint,
        }),
      });
    } catch { /* silent — user sees disabled button as feedback */ }
  }

  async function handleGenerateMessage(lead: Lead) {
    setGenLead(lead);
    setMessages([]);
    setGenLoading(true);

    try {
      const res = await fetch("/api/hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "outreachMessage",
          data: {
            lead: {
              name:     lead.name,
              platform: lead.platform,
              niche:    lead.niche,
              followers: lead.followers,
              description: lead.description,
            },
            product:  projectCtx.product  || undefined,
            audience: projectCtx.audience || undefined,
            goal:     projectCtx.goal     || undefined,
          },
        }),
      });
      const json = await res.json();
      const raw  = json.result ?? "";
      // Parse variants from response
      const variants = raw.split(/━━━ ВАРИАНТ \d+/).filter(Boolean).map((v: string) => ({
        platform: lead.platform,
        message:  v.trim(),
      }));
      setMessages(variants.length > 0 ? variants : [{ platform: lead.platform, message: raw }]);
    } catch {
      setMessages([{ platform: lead.platform, message: "Ошибка генерации. Проверь API-ключ." }]);
    } finally {
      setGenLoading(false);
    }
  }

  async function handleAdCopy() {
    if (!projectCtx.product && !activeNiche) return;
    setAdLoading(true);
    setAdResult("");
    try {
      const res = await fetch("/api/hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adCopy",
          data: {
            platform:  adPlatform,
            product:   projectCtx.product || activeNiche,
            audience:  projectCtx.audience || "предприниматели 25-40",
            objective: adObjective,
          },
        }),
      });
      const json = await res.json();
      setAdResult(json.result ?? "");
    } catch {
      setAdResult("Ошибка генерации.");
    } finally {
      setAdLoading(false);
    }
  }

  async function handleBulkOutreach() {
    if (!bulkNiche) return;
    setBulkLoading(true);
    setBulkMsg("");

    try {
      const res = await fetch("/api/hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulkOutreachScript",
          data: {
            niche:    bulkNiche || activeNiche || "онлайн-образование",
            goal:     bulkGoal,
            platform,
            product:  projectCtx.product  || undefined,
            audience: projectCtx.audience || undefined,
          },
        }),
      });
      const json = await res.json();
      setBulkMsg(json.result ?? "");
    } catch {
      setBulkMsg("Ошибка генерации.");
    } finally {
      setBulkLoading(false);
    }
  }

  async function copyMessage(msg: string, i: number) {
    await navigator.clipboard.writeText(msg);
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  const filtered = filterStatus === "all" ? leads : leads.filter((l) => l.status === filterStatus);

  const stats = {
    total:     leads.length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    replied:   leads.filter((l) => l.status === "replied").length,
    qualified: leads.filter((l) => l.status === "qualified").length,
  };

  return (
    <div className="space-y-5">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-text flex items-center gap-2">
          <Search size={20} className="text-accent" /> Поиск клиентов
        </h1>
        <p className="text-sm text-subtext mt-0.5">
          Парсинг аудитории, AI-рассылки и автоматизированный первый контакт
        </p>
      </div>

      {/* ── Project context card ─────────────────────────────────────────────── */}
      <div className="card border-accent/20 bg-accent/5">
        <button
          onClick={() => setShowCtx((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-accent" />
            <span className="text-sm font-semibold text-text">Что продаём и кому</span>
            {projectCtx.product && (
              <span className="text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded-full truncate max-w-[160px]">{projectCtx.product}</span>
            )}
          </div>
          {showCtx ? <ChevronUp size={14} className="text-subtext" /> : <ChevronDown size={14} className="text-subtext" />}
        </button>
        {showCtx && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-4 pb-4">
            <div className="space-y-1">
              <label className="text-[10px] text-subtext uppercase tracking-wide">Продукт / услуга</label>
              <input
                className="input w-full text-sm"
                placeholder="Курс по маркетингу, коучинг, SMM..."
                value={projectCtx.product}
                onChange={(e) => setProjectCtx((c) => ({ ...c, product: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-subtext uppercase tracking-wide">Целевая аудитория</label>
              <input
                className="input w-full text-sm"
                placeholder="Эксперты, коучи, предприниматели..."
                value={projectCtx.audience}
                onChange={(e) => setProjectCtx((c) => ({ ...c, audience: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-subtext uppercase tracking-wide">Цель коммуникации</label>
              <select
                className="input w-full text-sm"
                value={projectCtx.goal}
                onChange={(e) => setProjectCtx((c) => ({ ...c, goal: e.target.value }))}
              >
                <option value="">Продажа продукта</option>
                <option value="записаться на консультацию">Запись на консультацию</option>
                <option value="попробовать бесплатно">Бесплатный пробный период</option>
                <option value="партнёрство">Партнёрство</option>
                <option value="подписка на канал">Подписка на канал</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Left: Search + Bulk ───────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Search panel */}
          <div className="card p-4 space-y-3">
            <p className="text-sm font-semibold text-text">🔍 Парсинг аудитории</p>

            {/* Platform */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-subtext uppercase tracking-wide">Платформа</label>
              <div className="grid grid-cols-3 gap-1.5">
                {PLATFORMS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setPlatform(id)}
                    className={clsx(
                      "flex flex-col items-center gap-1 py-2 rounded-lg border text-[10px] transition-colors",
                      platform === id
                        ? "bg-accent/20 border-accent/40 text-accent"
                        : "border-border text-subtext hover:border-accent/30 hover:text-text"
                    )}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Niche pills */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-subtext uppercase tracking-wide">Ниша</label>
              <div className="flex flex-wrap gap-1">
                {NICHES.slice(0, 8).map((n) => (
                  <button
                    key={n}
                    onClick={() => { setNiche(n); setCustomNiche(""); }}
                    className={clsx(
                      "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                      niche === n
                        ? "bg-accent/20 border-accent/40 text-accent"
                        : "border-border text-subtext hover:text-text hover:border-accent/30"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Своя ниша..."
                value={customNiche}
                onChange={(e) => { setCustomNiche(e.target.value); setNiche(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                className="input w-full text-xs"
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={searching || !activeNiche}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {searching ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
              {searching ? "Ищем..." : "Найти потенциальных клиентов"}
            </button>
          </div>

          {/* Bulk outreach panel */}
          <div className="card p-4 space-y-3">
            <p className="text-sm font-semibold text-text">📨 Массовая рассылка</p>
            <p className="text-xs text-subtext">
              AI создаёт персональные шаблоны сообщений для холодного охвата
            </p>

            <input
              type="text"
              placeholder="Ниша получателей..."
              value={bulkNiche}
              onChange={(e) => setBulkNiche(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && bulkNiche) handleBulkOutreach(); }}
              className="input w-full text-xs"
            />

            <select
              value={bulkGoal}
              onChange={(e) => setBulkGoal(e.target.value)}
              className="input w-full text-xs"
            >
              <option value="продажа продукта">Продажа продукта</option>
              <option value="запись на консультацию">Запись на консультацию</option>
              <option value="партнёрство">Партнёрство / Коллаборация</option>
              <option value="прогрев к покупке">Прогрев к покупке</option>
              <option value="приглашение в канал">Приглашение в канал</option>
            </select>

            <button
              onClick={handleBulkOutreach}
              disabled={bulkLoading || !bulkNiche}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {bulkLoading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Сгенерировать шаблоны
            </button>

            {bulkMsg && (
              <div className="space-y-2">
                <div className="relative">
                  <pre className="text-xs text-text leading-relaxed whitespace-pre-wrap font-sans bg-surface2 rounded-xl p-3 max-h-64 overflow-y-auto">
                    {bulkMsg}
                  </pre>
                  <button
                    onClick={async () => { await navigator.clipboard.writeText(bulkMsg); setBulkCopied(true); setTimeout(() => setBulkCopied(false), 2000); }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-surface border border-border hover:text-accent transition-colors"
                  >
                    {bulkCopied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} className="text-subtext" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ads panel */}
          <div className="card p-4 space-y-3">
            <p className="text-sm font-semibold text-text">🎯 Таргетированная реклама</p>
            <p className="text-xs text-subtext">AI создаёт готовые объявления для Instagram, Facebook, Threads, YouTube</p>

            {/* Ad platform */}
            <div className="grid grid-cols-4 gap-1.5">
              {["Instagram", "Facebook", "Threads", "YouTube"].map((p) => (
                <button
                  key={p}
                  onClick={() => setAdPlatform(p)}
                  className={clsx(
                    "text-[10px] py-1.5 rounded-lg border transition-colors",
                    adPlatform === p
                      ? "bg-accent/20 border-accent/40 text-accent"
                      : "border-border text-subtext hover:border-accent/30"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>

            <select className="input w-full text-xs" value={adObjective} onChange={(e) => setAdObjective(e.target.value)}>
              <option value="лиды">Цель: Лиды (заявки)</option>
              <option value="продажи">Цель: Прямые продажи</option>
              <option value="трафик на сайт">Цель: Трафик на сайт</option>
              <option value="подписчики">Цель: Подписчики/охват</option>
              <option value="просмотры видео">Цель: Просмотры видео</option>
            </select>

            <button
              onClick={handleAdCopy}
              disabled={adLoading || (!projectCtx.product && !activeNiche)}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {adLoading ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
              {adLoading ? "Генерируем объявления…" : "Создать рекламные объявления"}
            </button>

            {adResult && (
              <div className="relative">
                <pre className="text-xs text-text leading-relaxed whitespace-pre-wrap font-sans bg-surface2 rounded-xl p-3 max-h-64 overflow-y-auto">
                  {adResult}
                </pre>
                <button
                  onClick={async () => { await navigator.clipboard.writeText(adResult); setAdCopied(true); setTimeout(() => setAdCopied(false), 2000); }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-surface border border-border hover:text-accent transition-colors"
                >
                  {adCopied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} className="text-subtext" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Leads grid ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Stats */}
          {leads.length > 0 && (
            <div className="grid grid-cols-4 gap-2 stagger">
              {[
                { label: "Найдено",    value: stats.total,     color: "text-text" },
                { label: "Написали",  value: stats.contacted, color: "text-blue-400"    },
                { label: "Ответили",  value: stats.replied,   color: "text-amber-400"   },
                { label: "Годных",    value: stats.qualified, color: "text-emerald-400" },
              ].map((s) => (
                <div key={s.label} className="card p-2 text-center">
                  <p className={clsx("text-lg font-bold", s.color)}>{s.value}</p>
                  <p className="text-[10px] text-subtext">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Filter bar */}
          {leads.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={13} className="text-subtext" />
              {(["all", "new", "contacted", "replied", "qualified", "closed"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={clsx(
                    "text-[10px] px-2.5 py-1 rounded-full border transition-colors",
                    filterStatus === s
                      ? "bg-accent/20 border-accent/40 text-accent"
                      : "border-border text-subtext hover:text-text"
                  )}
                >
                  {s === "all" ? "Все" : STATUS_CONFIG[s].label}
                  {s !== "all" && (
                    <span className="ml-1 opacity-60">
                      {leads.filter((l) => l.status === s).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Loading skeleton */}
          {searching && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card p-3 space-y-2 animate-pulse">
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-surface2" />
                    <div className="space-y-1 flex-1">
                      <div className="h-3 bg-surface2 rounded w-3/4" />
                      <div className="h-2 bg-surface2 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-2 bg-surface2 rounded" />
                  <div className="h-7 bg-surface2 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!searching && leads.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Search size={24} className="text-accent" />
              </div>
              <p className="text-sm font-medium text-text">Выбери нишу и платформу</p>
              <p className="text-xs text-subtext max-w-xs">
                AI найдёт потенциальных клиентов и сгенерирует персональные сообщения для каждого
              </p>
            </div>
          )}

          {/* Leads grid */}
          {!searching && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger">
              {filtered.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onStatusChange={handleStatusChange}
                  onGenerateMessage={handleGenerateMessage}
                  onAddToCRM={handleAddToCRM}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── AI message modal ─────────────────────────────────────────────────── */}
      {genLead && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div>
                <p className="text-sm font-semibold text-text">Сообщение для {genLead.name}</p>
                <p className="text-xs text-subtext">{genLead.platform} · {genLead.niche}</p>
              </div>
              <button onClick={() => { setGenLead(null); setMessages([]); }} className="p-2 rounded-lg hover:bg-white/5 text-subtext">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {genLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-subtext text-sm">
                  <RefreshCw size={16} className="animate-spin" /> Пишем персональное сообщение…
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-subtext text-xs">Нет сообщений</div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className="relative bg-surface2 rounded-xl p-4">
                    <pre className="text-xs text-text leading-relaxed whitespace-pre-wrap font-sans">
                      {msg.message}
                    </pre>
                    <button
                      onClick={() => copyMessage(msg.message, i)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      {copiedIdx === i
                        ? <Check size={12} className="text-emerald-400" />
                        : <Copy size={12} className="text-subtext" />}
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="px-5 py-3 border-t border-border shrink-0">
              <button
                onClick={() => handleGenerateMessage(genLead)}
                disabled={genLoading}
                className="btn-ghost w-full flex items-center justify-center gap-2 text-sm"
              >
                <RefreshCw size={13} className={genLoading ? "animate-spin" : ""} />
                Сгенерировать ещё варианты
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Process guide ─────────────────────────────────────────────────────── */}
      <div className="card p-4 border-accent/20 bg-accent/5">
        <p className="text-xs font-semibold text-text mb-3">🗺 Путь лида: от контакта до клиента</p>
        <div className="flex flex-wrap gap-2 items-center text-xs text-subtext">
          {["Парсинг ниши", "→", "AI-рассылка", "→", "Первый контакт", "→", "Квалификация", "→", "Консультация", "→", "Продажа"].map((step, i) => (
            <span key={i} className={clsx(
              step === "→" ? "text-border" : "px-2.5 py-1 rounded-full border border-border bg-surface2 text-text"
            )}>
              {step}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
