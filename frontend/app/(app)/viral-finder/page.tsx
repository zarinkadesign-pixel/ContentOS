"use client";
import { useState, useCallback, useEffect } from "react";
import {
  TrendingUp, Search, RefreshCw, ExternalLink, ThumbsUp, MessageCircle,
  Eye, Clock, Flame, Filter, ChevronDown, Zap, AlertCircle, Copy, Check,
  BarChart2, Play,
} from "lucide-react";
import clsx from "clsx";

// ── Types ──────────────────────────────────────────────────────────────────────
interface TrendVideo {
  id: string;
  platform: "youtube" | "tiktok";
  title: string;
  channel: string;
  thumbnail: string;
  url: string;
  views: number;
  likes: number;
  comments: number;
  duration: string;
  publishedAt: string;
  er: number;
  tags: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1)     + "K";
  return String(n);
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600)  return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return `${Math.floor(diff / 86400)} дн назад`;
}

function erColor(er: number) {
  if (er >= 5)  return "text-emerald-400 bg-emerald-400/10";
  if (er >= 2)  return "text-amber-400 bg-amber-400/10";
  return "text-subtext bg-white/5";
}

// ── Niches / suggestions ───────────────────────────────────────────────────────
const NICHES = [
  "маркетинг", "контент", "продажи", "личный бренд", "SMM", "YouTube", "reels",
  "AI инструменты", "нейросети", "заработок онлайн", "инфобизнес", "коучинг",
  "дропшиппинг", "инвестиции", "крипто", "саморазвитие", "продуктивность",
];

const ORDER_OPTIONS = [
  { value: "relevance", label: "По релевантности" },
  { value: "viewCount", label: "По просмотрам"    },
  { value: "date",      label: "По дате"           },
];

const DATE_OPTIONS = [
  { value: "",                                          label: "За всё время" },
  { value: new Date(Date.now() - 7  * 86400000).toISOString(), label: "За 7 дней"   },
  { value: new Date(Date.now() - 30 * 86400000).toISOString(), label: "За 30 дней"  },
  { value: new Date(Date.now() - 90 * 86400000).toISOString(), label: "За 90 дней"  },
];

// ── Video card ─────────────────────────────────────────────────────────────────
function VideoCard({ v, onCopy }: { v: TrendVideo; onCopy: (title: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  async function copyTitle() {
    await navigator.clipboard.writeText(v.title);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy(v.title);
  }

  return (
    <div className="card rounded-xl overflow-hidden flex flex-col group hover:border-accent/30 transition-all duration-300">
      {/* Thumbnail */}
      <div className="relative bg-surface2 aspect-video overflow-hidden">
        {!imgError ? (
          <img
            src={v.thumbnail}
            alt={v.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play size={32} className="text-subtext/40" />
          </div>
        )}

        {/* Duration badge */}
        {v.duration && (
          <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
            {v.duration}
          </span>
        )}

        {/* ER badge */}
        <span className={clsx(
          "absolute top-1.5 left-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full",
          erColor(v.er)
        )}>
          ER {v.er}%
        </span>

        {/* Play overlay */}
        <a
          href={v.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play size={20} className="text-white fill-white ml-1" />
          </div>
        </a>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Title */}
        <p className="text-xs font-medium text-text leading-snug line-clamp-2 flex-1">
          {v.title}
        </p>

        {/* Channel + date */}
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] text-subtext truncate">{v.channel}</span>
          <span className="text-[10px] text-subtext shrink-0">{timeAgo(v.publishedAt)}</span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[10px] text-subtext">
          <span className="flex items-center gap-1"><Eye size={10} />{fmtNum(v.views)}</span>
          <span className="flex items-center gap-1"><ThumbsUp size={10} />{fmtNum(v.likes)}</span>
          <span className="flex items-center gap-1"><MessageCircle size={10} />{fmtNum(v.comments)}</span>
        </div>

        {/* Tags */}
        {v.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {v.tags.slice(0, 3).map((t) => (
              <span key={t} className="text-[9px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full">
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-1.5 mt-auto pt-1">
          <a
            href={v.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/5 hover:bg-accent/20 hover:text-accent text-subtext text-[10px] transition-colors"
          >
            <ExternalLink size={10} /> Открыть
          </a>
          <button
            onClick={copyTitle}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/5 hover:bg-accent/20 hover:text-accent text-subtext text-[10px] transition-colors"
          >
            {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
            {copied ? "Скопировано" : "Заголовок"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ViralFinderPage() {
  const [query,    setQuery]    = useState("");
  const [order,    setOrder]    = useState("relevance");
  const [after,    setAfter]    = useState("");
  const [minER,    setMinER]    = useState(0);
  const [videos,   setVideos]   = useState<TrendVideo[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [hasKey,   setHasKey]   = useState(true);
  const [searched, setSearched] = useState(false);
  const [copied,   setCopied]   = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Auto-search a default niche on first load
  useEffect(() => { handleSearch("маркетинг"); }, []); // eslint-disable-line

  const handleSearch = useCallback(async (overrideQuery?: string) => {
    const q = (overrideQuery ?? query).trim();
    if (!q) return;

    setLoading(true);
    setError("");
    setSearched(true);
    if (overrideQuery) setQuery(overrideQuery);

    try {
      const params = new URLSearchParams({ q, order, ...(after ? { after } : {}) });
      const res    = await fetch(`/api/trends?${params}`);
      const data   = await res.json();

      if (!res.ok) { setError(data.error ?? "Ошибка запроса"); return; }

      setHasKey(data.hasKey);
      setVideos(data.videos ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [query, order, after]);

  const filtered = videos.filter((v) => v.er >= minER);

  // ER distribution
  const erBuckets = { high: 0, mid: 0, low: 0 };
  videos.forEach((v) => {
    if (v.er >= 5)      erBuckets.high++;
    else if (v.er >= 2) erBuckets.mid++;
    else                erBuckets.low++;
  });

  function handleCopy(title: string) {
    setCopied(title);
    setTimeout(() => setCopied(null), 2500);
  }

  return (
    <div className="space-y-5">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text flex items-center gap-2">
            <TrendingUp size={20} className="text-accent" /> Тренды
          </h1>
          <p className="text-sm text-subtext mt-0.5">
            Ищи вирусный контент по нише — анализ вовлечённости и идей для роста
          </p>
        </div>
        {!hasKey && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
            <AlertCircle size={13} /> Демо-режим — добавь <code className="mx-1 font-mono bg-amber-500/20 px-1 rounded">YOUTUBE_API_KEY</code> для реальных данных
          </div>
        )}
      </div>

      {/* ── Search bar ────────────────────────────────────────────────────────── */}
      <div className="card p-3 sm:p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtext pointer-events-none" />
            <input
              type="text"
              placeholder="Введи нишу, хэштег или тему..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              className="input w-full pl-9 text-sm"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="btn-primary flex items-center gap-2 px-4 shrink-0"
          >
            {loading
              ? <RefreshCw size={14} className="animate-spin" />
              : <Search size={14} />
            }
            <span className="hidden sm:inline">Найти</span>
          </button>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={clsx("btn-ghost flex items-center gap-1.5 shrink-0", showFilters && "text-accent")}
          >
            <Filter size={14} />
            <ChevronDown size={12} className={clsx("transition-transform", showFilters && "rotate-180")} />
          </button>
        </div>

        {/* Niche pills */}
        <div className="flex flex-wrap gap-1.5">
          {NICHES.map((n) => (
            <button
              key={n}
              onClick={() => handleSearch(n)}
              className={clsx(
                "text-[11px] px-2.5 py-1 rounded-full border transition-colors",
                query === n
                  ? "bg-accent/20 border-accent/40 text-accent"
                  : "border-border text-subtext hover:text-text hover:border-accent/30"
              )}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Filters row */}
        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-border animate-fade-up">
            {/* Order */}
            <div className="space-y-1">
              <label className="text-[10px] text-subtext uppercase tracking-wide">Сортировка</label>
              <select
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className="input w-full text-xs"
              >
                {ORDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div className="space-y-1">
              <label className="text-[10px] text-subtext uppercase tracking-wide">Период</label>
              <select
                value={after}
                onChange={(e) => setAfter(e.target.value)}
                className="input w-full text-xs"
              >
                {DATE_OPTIONS.map((o) => (
                  <option key={o.label} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Min ER */}
            <div className="space-y-1">
              <label className="text-[10px] text-subtext uppercase tracking-wide">
                Мин. ER ≥ {minER}%
              </label>
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={minER}
                onChange={(e) => setMinER(Number(e.target.value))}
                className="w-full accent-[var(--color-accent)]"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Stats bar (shown when results exist) ──────────────────────────────── */}
      {searched && !loading && videos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 stagger">
          <div className="card p-3 text-center">
            <p className="text-lg font-bold text-text">{videos.length}</p>
            <p className="text-[10px] text-subtext mt-0.5">Видео найдено</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-lg font-bold text-emerald-400">{erBuckets.high}</p>
            <p className="text-[10px] text-subtext mt-0.5">Высокий ER ≥5%</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-lg font-bold text-amber-400">{erBuckets.mid}</p>
            <p className="text-[10px] text-subtext mt-0.5">Средний ER 2-5%</p>
          </div>
          <div className="hidden sm:block card p-3 text-center">
            <p className="text-lg font-bold text-accent">
              {videos.length > 0 ? (videos.reduce((s, v) => s + v.er, 0) / videos.length).toFixed(1) : 0}%
            </p>
            <p className="text-[10px] text-subtext mt-0.5">Средний ER</p>
          </div>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* ── Copied toast ──────────────────────────────────────────────────────── */}
      {copied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border shadow-lg text-xs text-text animate-fade-up">
          <Check size={12} className="text-emerald-400 shrink-0" />
          <span className="max-w-[300px] truncate">Скопировано: {copied}</span>
        </div>
      )}

      {/* ── Loading skeleton ──────────────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-video bg-surface2" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-surface2 rounded w-full" />
                <div className="h-3 bg-surface2 rounded w-3/4" />
                <div className="h-2 bg-surface2 rounded w-1/2 mt-3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────────── */}
      {!loading && searched && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
            <BarChart2 size={24} className="text-accent" />
          </div>
          <p className="text-sm font-medium text-text">Ничего не найдено</p>
          <p className="text-xs text-subtext max-w-xs">
            Попробуй другую нишу или снизь фильтр ER
          </p>
        </div>
      )}

      {/* ── Grid ──────────────────────────────────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-subtext">
              {filtered.length} видео
              {minER > 0 && ` · ER ≥ ${minER}%`}
              {` · сортировка: ${ORDER_OPTIONS.find(o => o.value === order)?.label}`}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-subtext">
              <Flame size={12} className="text-amber-400" />
              <span>Топ по вовлечённости</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 stagger">
            {filtered.map((v) => (
              <VideoCard key={v.id} v={v} onCopy={handleCopy} />
            ))}
          </div>

          {/* Load more */}
          <div className="flex justify-center pt-2">
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="btn-ghost flex items-center gap-2 text-sm"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Обновить выборку
            </button>
          </div>
        </>
      )}

      {/* ── Pro tip banner ────────────────────────────────────────────────────── */}
      {!loading && searched && (
        <div className="card p-4 flex items-start gap-3 border-accent/20 bg-accent/5">
          <Zap size={16} className="text-accent shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-text mb-1">Как использовать тренды</p>
            <p className="text-xs text-subtext leading-relaxed">
              Копируй заголовки с ER {'>'} 5% → отправляй в <strong className="text-text">AI Команду</strong> для переработки под свою нишу →
              создавай контент в <strong className="text-text">Студии</strong> → автоматически нарезай клипы через Opus Clip.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
