"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  getTeamTasks, runTeamTask, deleteTeamTask, getClients,
  getAgentKnowledge, addAgentKnowledge, deleteAgentKnowledge,
} from "@/lib/api";
import { TEAM_WORKERS } from "@/lib/agents";
import {
  Loader2, Play, Trash2, ChevronDown, ChevronUp, CheckCircle2,
  AlertCircle, Clock, Users, Zap, X, RefreshCw, Copy, Check,
  BookOpen, Plus, Brain, Send, ChevronRight, Wifi, WifiOff,
  ExternalLink, Sparkles,
} from "lucide-react";
import clsx from "clsx";

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}с`;
  if (diff < 3600) return `${Math.floor(diff / 60)}м`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}ч`;
  return `${Math.floor(diff / 86400)}д`;
}

function useLiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    function tick() {
      const d = new Date();
      setTime(d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ── Pixel character SVG sprites (8 unique pixel avatars) ─────────────────────
const PIXEL_AVATARS: Record<string, string> = {
  producer: `<svg width="32" height="40" viewBox="0 0 8 10" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    <rect x="3" y="0" width="2" height="2" fill="#f4c874"/>
    <rect x="2" y="2" width="4" height="3" fill="#6c63ff"/>
    <rect x="1" y="5" width="2" height="3" fill="#6c63ff"/>
    <rect x="5" y="5" width="2" height="3" fill="#6c63ff"/>
    <rect x="2" y="8" width="2" height="2" fill="#4a4480"/>
    <rect x="4" y="8" width="2" height="2" fill="#4a4480"/>
    <rect x="3" y="1" width="1" height="1" fill="#1a1a2e"/>
    <rect x="4" y="1" width="1" height="1" fill="#1a1a2e"/>
  </svg>`,
  strategist: `<svg width="32" height="40" viewBox="0 0 8 10" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    <rect x="3" y="0" width="2" height="2" fill="#f9a8d4"/>
    <rect x="2" y="2" width="4" height="3" fill="#3b82f6"/>
    <rect x="1" y="5" width="2" height="3" fill="#3b82f6"/>
    <rect x="5" y="5" width="2" height="3" fill="#3b82f6"/>
    <rect x="2" y="8" width="2" height="2" fill="#1e40af"/>
    <rect x="4" y="8" width="2" height="2" fill="#1e40af"/>
    <rect x="2" y="0" width="4" height="1" fill="#f9a8d4"/>
    <rect x="3" y="1" width="1" height="1" fill="#1a1a2e"/>
    <rect x="4" y="1" width="1" height="1" fill="#1a1a2e"/>
  </svg>`,
  copywriter: `<svg width="32" height="40" viewBox="0 0 8 10" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    <rect x="3" y="0" width="2" height="2" fill="#fcd34d"/>
    <rect x="2" y="2" width="4" height="3" fill="#ec4899"/>
    <rect x="1" y="5" width="2" height="3" fill="#ec4899"/>
    <rect x="5" y="5" width="2" height="3" fill="#ec4899"/>
    <rect x="2" y="8" width="2" height="2" fill="#9d174d"/>
    <rect x="4" y="8" width="2" height="2" fill="#9d174d"/>
    <rect x="3" y="1" width="1" height="1" fill="#1a1a2e"/>
    <rect x="4" y="1" width="1" height="1" fill="#1a1a2e"/>
    <rect x="3" y="2" width="1" height="1" fill="#f472b6"/>
  </svg>`,
  smm: `<svg width="32" height="40" viewBox="0 0 8 10" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    <rect x="3" y="0" width="2" height="2" fill="#86efac"/>
    <rect x="2" y="2" width="4" height="3" fill="#22c55e"/>
    <rect x="1" y="5" width="2" height="3" fill="#22c55e"/>
    <rect x="5" y="5" width="2" height="3" fill="#22c55e"/>
    <rect x="2" y="8" width="2" height="2" fill="#15803d"/>
    <rect x="4" y="8" width="2" height="2" fill="#15803d"/>
    <rect x="3" y="1" width="1" height="1" fill="#1a1a2e"/>
    <rect x="4" y="1" width="1" height="1" fill="#1a1a2e"/>
  </svg>`,
  sales: `<svg width="32" height="40" viewBox="0 0 8 10" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    <rect x="3" y="0" width="2" height="2" fill="#fde68a"/>
    <rect x="2" y="2" width="4" height="3" fill="#f59e0b"/>
    <rect x="1" y="5" width="2" height="3" fill="#f59e0b"/>
    <rect x="5" y="5" width="2" height="3" fill="#f59e0b"/>
    <rect x="2" y="8" width="2" height="2" fill="#b45309"/>
    <rect x="4" y="8" width="2" height="2" fill="#b45309"/>
    <rect x="3" y="1" width="1" height="1" fill="#1a1a2e"/>
    <rect x="4" y="1" width="1" height="1" fill="#1a1a2e"/>
    <rect x="3" y="3" width="2" height="1" fill="#fcd34d"/>
  </svg>`,
  metaads: `<svg width="32" height="40" viewBox="0 0 8 10" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    <rect x="3" y="0" width="2" height="2" fill="#fca5a5"/>
    <rect x="2" y="2" width="4" height="3" fill="#ef4444"/>
    <rect x="1" y="5" width="2" height="3" fill="#ef4444"/>
    <rect x="5" y="5" width="2" height="3" fill="#ef4444"/>
    <rect x="2" y="8" width="2" height="2" fill="#991b1b"/>
    <rect x="4" y="8" width="2" height="2" fill="#991b1b"/>
    <rect x="3" y="1" width="1" height="1" fill="#1a1a2e"/>
    <rect x="4" y="1" width="1" height="1" fill="#1a1a2e"/>
    <rect x="1" y="2" width="1" height="2" fill="#fca5a5"/>
    <rect x="6" y="2" width="1" height="2" fill="#fca5a5"/>
  </svg>`,
  analyst: `<svg width="32" height="40" viewBox="0 0 8 10" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    <rect x="3" y="0" width="2" height="2" fill="#d8b4fe"/>
    <rect x="2" y="2" width="4" height="3" fill="#a855f7"/>
    <rect x="1" y="5" width="2" height="3" fill="#a855f7"/>
    <rect x="5" y="5" width="2" height="3" fill="#a855f7"/>
    <rect x="2" y="8" width="2" height="2" fill="#6b21a8"/>
    <rect x="4" y="8" width="2" height="2" fill="#6b21a8"/>
    <rect x="3" y="1" width="1" height="1" fill="#1a1a2e"/>
    <rect x="4" y="1" width="1" height="1" fill="#1a1a2e"/>
    <rect x="2" y="0" width="1" height="1" fill="#d8b4fe"/>
    <rect x="5" y="0" width="1" height="1" fill="#d8b4fe"/>
  </svg>`,
  businessmap: `<svg width="32" height="40" viewBox="0 0 8 10" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    <rect x="3" y="0" width="2" height="2" fill="#fdba74"/>
    <rect x="2" y="2" width="4" height="3" fill="#f97316"/>
    <rect x="1" y="5" width="2" height="3" fill="#f97316"/>
    <rect x="5" y="5" width="2" height="3" fill="#f97316"/>
    <rect x="2" y="8" width="2" height="2" fill="#c2410c"/>
    <rect x="4" y="8" width="2" height="2" fill="#c2410c"/>
    <rect x="3" y="1" width="1" height="1" fill="#1a1a2e"/>
    <rect x="4" y="1" width="1" height="1" fill="#1a1a2e"/>
  </svg>`,
  dailybrief: `<svg width="32" height="40" viewBox="0 0 8 10" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    <rect x="3" y="0" width="2" height="2" fill="#99f6e4"/>
    <rect x="2" y="2" width="4" height="3" fill="#14b8a6"/>
    <rect x="1" y="5" width="2" height="3" fill="#14b8a6"/>
    <rect x="5" y="5" width="2" height="3" fill="#14b8a6"/>
    <rect x="2" y="8" width="2" height="2" fill="#0f766e"/>
    <rect x="4" y="8" width="2" height="2" fill="#0f766e"/>
    <rect x="3" y="1" width="1" height="1" fill="#1a1a2e"/>
    <rect x="4" y="1" width="1" height="1" fill="#1a1a2e"/>
    <rect x="1" y="0" width="6" height="1" fill="#99f6e4"/>
  </svg>`,
};

// Pixel character component with idle/working/done animations
function PixelCharacter({ workerId, isWorking, isDone, isError }: {
  workerId: string; isWorking: boolean; isDone: boolean; isError: boolean;
}) {
  const svg = PIXEL_AVATARS[workerId] ?? PIXEL_AVATARS.producer;
  return (
    <div className={clsx(
      "relative flex items-end justify-center",
      isWorking && "animate-bounce [animation-duration:0.6s]",
    )} style={{ imageRendering: "pixelated", width: 32, height: 40 }}>
      <div
        dangerouslySetInnerHTML={{ __html: svg }}
        className={clsx(
          "transition-all duration-300",
          isWorking && "brightness-125 saturate-150",
          isDone    && "brightness-110",
          isError   && "hue-rotate-[340deg] brightness-90",
        )}
        style={{ width: 32, height: 40, imageRendering: "pixelated" }}
      />
      {/* Working sparkles */}
      {isWorking && (
        <>
          <span className="absolute -top-2 -right-1 text-[8px] animate-ping">✨</span>
          <span className="absolute -top-1 -left-1 text-[8px] animate-ping [animation-delay:0.3s]">⚡</span>
        </>
      )}
      {isDone && !isWorking && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px]">✅</span>
      )}
      {isError && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px]">❌</span>
      )}
    </div>
  );
}

// Pixel desk SVG
function PixelDesk({ glowColor }: { glowColor: string }) {
  return (
    <svg width="80" height="32" viewBox="0 0 20 8" xmlns="http://www.w3.org/2000/svg"
      shape-rendering="crispEdges" className="w-full" style={{ imageRendering: "pixelated" }}>
      {/* Desk surface */}
      <rect x="1" y="0" width="18" height="2" fill="#2a2d4a"/>
      <rect x="0" y="1" width="20" height="1" fill="#1e2038"/>
      {/* Monitor */}
      <rect x="7" y="0" width="6" height="4" fill="#0a0d1f"/>
      <rect x="8" y="0" width="4" height="3" fill={glowColor}/>
      <rect x="9" y="3" width="2" height="1" fill="#2a2d4a"/>
      {/* Keyboard */}
      <rect x="5" y="2" width="4" height="1" fill="#1a1d30"/>
      <rect x="11" y="2" width="4" height="1" fill="#1a1d30"/>
      {/* Desk legs */}
      <rect x="2" y="3" width="1" height="5" fill="#1a1d30"/>
      <rect x="17" y="3" width="1" height="5" fill="#1a1d30"/>
    </svg>
  );
}

// ── Desk Station — pixel game workstation card ────────────────────────────────
function DeskStationBase({
  worker, tasks, isSelected, onClick,
}: {
  worker: typeof TEAM_WORKERS[0];
  tasks: any[];
  isSelected: boolean;
  onClick: () => void;
}) {
  const myTasks   = tasks.filter((t) => t.worker_id === worker.id);
  const isWorking = myTasks.some((t) => t.status === "running");
  const lastDone  = myTasks.find((t) => t.status === "done");
  const hasError  = myTasks.some((t) => t.status === "error") && !isWorking && !lastDone;
  const doneCount = myTasks.filter((t) => t.status === "done").length;

  // Speech bubble on task completion
  const [bubble, setBubble] = useState("");
  const prevWorking = useRef(false);
  useEffect(() => {
    if (prevWorking.current && !isWorking && lastDone?.result) {
      const snippet = lastDone.result.replace(/^#+\s*/gm, "").split("\n").find((l: string) => l.trim().length > 5) ?? "";
      setBubble(snippet.slice(0, 55));
      const t = setTimeout(() => setBubble(""), 9000);
      return () => clearTimeout(t);
    }
    prevWorking.current = isWorking;
  }, [isWorking, lastDone]);

  // Screen color for desk monitor
  const screenGlow = isWorking ? "#7c3aed" : lastDone ? "#059669" : hasError ? "#dc2626" : "#1e2038";

  const borderColor = isSelected
    ? "border-accent shadow-[0_0_16px_rgba(108,99,255,0.5)]"
    : isWorking
    ? "border-violet-500/60 shadow-[0_0_12px_rgba(124,58,237,0.4)]"
    : lastDone
    ? "border-emerald-500/30"
    : "border-white/6 hover:border-white/20";

  return (
    <button
      onClick={onClick}
      className={clsx(
        "relative flex flex-col items-center gap-1 pt-3 pb-2 px-1 rounded-xl border transition-all duration-300 cursor-pointer group w-full",
        borderColor,
        isSelected && "bg-accent/5 scale-[1.03]",
        !isSelected && "hover:bg-white/3"
      )}
      style={{ background: isSelected ? undefined : "rgba(255,255,255,0.01)" }}
    >
      {/* Speech bubble */}
      {bubble && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
          style={{ width: "max-content", maxWidth: 160 }}>
          <div className="bg-nav border border-accent/30 text-[9px] text-text/90 px-2 py-1 rounded-lg shadow-xl leading-tight text-center">
            {bubble}…
          </div>
          <div className="mx-auto w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent"
            style={{ borderTopColor: "rgba(108,99,255,0.3)" }} />
        </div>
      )}

      {/* Pixel character above desk */}
      <div className="relative" style={{ height: 44 }}>
        <PixelCharacter
          workerId={worker.id}
          isWorking={isWorking}
          isDone={!!lastDone && !isWorking}
          isError={hasError}
        />
        {/* Working typing indicator */}
        {isWorking && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 bg-nav/80 px-1.5 py-0.5 rounded-full border border-violet-500/30">
            {[0,1,2].map(i => (
              <span key={i} className="w-1 h-1 bg-violet-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i*0.18}s` }} />
            ))}
          </div>
        )}
      </div>

      {/* Pixel desk */}
      <div className="w-full px-1" style={{ imageRendering: "pixelated" }}>
        <PixelDesk glowColor={screenGlow} />
      </div>

      {/* Name + role */}
      <div className="text-center space-y-0.5 px-1">
        <p className="text-[11px] font-bold text-text leading-none">{worker.name}</p>
        <p className="text-[9px] text-subtext/60 leading-none truncate">{worker.role}</p>
        {/* Status pill */}
        {isWorking ? (
          <span className="inline-flex items-center gap-0.5 text-[8px] bg-violet-500/20 text-violet-300 px-1 py-0.5 rounded-full font-medium">
            <span className="w-1 h-1 bg-violet-400 rounded-full animate-ping shrink-0" />
            думает…
          </span>
        ) : doneCount > 0 ? (
          <span className="inline-flex items-center gap-0.5 text-[8px] bg-emerald-500/15 text-emerald-400 px-1 py-0.5 rounded-full">
            ✓ {doneCount}
          </span>
        ) : (
          <span className="text-[8px] text-subtext/30">{worker.schedule}</span>
        )}
      </div>

      {/* Selected underline */}
      {isSelected && (
        <div className="absolute -bottom-px left-1/4 right-1/4 h-0.5 bg-accent rounded-full" />
      )}
    </button>
  );
}
const DeskStation = React.memo(DeskStationBase);

// ── Knowledge panel ───────────────────────────────────────────────────────────
function KnowledgePanel({ agentId, agentName }: { agentId: string; agentName: string }) {
  const [items, setItems]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [adding, setAdding]     = useState(false);
  const [title, setTitle]       = useState("");
  const [content, setContent]   = useState("");
  const [saving, setSaving]     = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await getAgentKnowledge(agentId)); }
    finally { setLoading(false); }
  }, [agentId]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const item = await addAgentKnowledge(agentId, title, content);
      setItems((prev) => [...prev, item]);
      setTitle(""); setContent(""); setAdding(false);
    } finally { setSaving(false); }
  }

  async function handleDelete(itemId: string) {
    await deleteAgentKnowledge(agentId, itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain size={14} className="text-accent" />
          <span className="text-xs font-semibold text-text">База знаний — {agentName}</span>
          <span className="text-xs text-subtext/60 bg-nav px-1.5 py-0.5 rounded">{items.length}</span>
        </div>
        <button onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1 text-xs bg-accent/10 text-accent hover:bg-accent/20 px-2 py-1 rounded-lg transition-colors">
          <Plus size={10} /> Добавить
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="mb-3 p-3 bg-nav rounded-lg border border-accent/20 space-y-2">
          <p className="text-xs text-subtext/70">Добавь знания, которые будут влиять на каждую задачу этого сотрудника</p>
          <input
            className="input w-full text-xs"
            placeholder="Заголовок (напр. «Стиль написания», «Инфо о нише»)…"
            value={title} onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            rows={4}
            className="input w-full text-xs resize-none"
            placeholder="Содержимое — любой текст, инструкции, данные, правила…"
            value={content} onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving || !title || !content}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
              {saving ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
              Сохранить
            </button>
            <button onClick={() => { setAdding(false); setTitle(""); setContent(""); }}
              className="text-xs text-subtext hover:text-text transition-colors px-2">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Items */}
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-subtext py-4">
          <Loader2 size={12} className="animate-spin" /> Загрузка…
        </div>
      ) : items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center gap-2">
          <Brain size={28} className="text-subtext/30" />
          <p className="text-xs text-subtext">База знаний пуста</p>
          <p className="text-[11px] text-subtext/50">Добавь информацию — сотрудник будет её учитывать в каждой задаче</p>
        </div>
      ) : (
        <div className="space-y-1.5 overflow-y-auto flex-1 pr-0.5">
          {items.map((item) => (
            <div key={item.id}
              className="bg-nav rounded-lg border border-border hover:border-accent/20 transition-colors">
              <div className="flex items-center justify-between p-2 cursor-pointer"
                onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen size={10} className="text-accent shrink-0" />
                  <span className="text-xs font-medium text-text truncate">{item.title}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-subtext/50">{timeAgo(item.added_at)} назад</span>
                  {expanded === item.id
                    ? <ChevronUp size={10} className="text-subtext" />
                    : <ChevronDown size={10} className="text-subtext" />}
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                    className="p-0.5 text-subtext/40 hover:text-red-400 transition-colors">
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
              {expanded === item.id && (
                <div className="px-2 pb-2 text-[11px] text-text/70 whitespace-pre-wrap leading-relaxed border-t border-border/50 pt-2">
                  {item.content}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── External resources ──────────────────────────────────────────────── */}
      <div className="mt-3 pt-3 border-t border-border/50">
        <p className="text-[10px] font-semibold text-subtext/50 uppercase tracking-wider mb-2">Ресурсы для агентов</p>
        <a
          href="https://github.com/github/awesome-copilot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-nav border border-border hover:border-accent/30 hover:bg-accent/5 transition-colors group"
        >
          <div className="w-6 h-6 rounded bg-accent/10 flex items-center justify-center shrink-0">
            <span className="text-[11px]">⭐</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-text group-hover:text-accent transition-colors truncate">
              awesome-copilot
            </p>
            <p className="text-[10px] text-subtext/60 truncate">
              Агенты, инструкции, хуки, промпты для AI
            </p>
          </div>
          <ExternalLink size={10} className="text-subtext/40 group-hover:text-accent/60 transition-colors shrink-0" />
        </a>
      </div>
    </div>
  );
}

// ── Pipeline runner (run ALL 4 agents for a client) ──────────────────────────
const PIPELINE_AGENTS = [
  { id: "producer",   emoji: "🎬", name: "Продюсер"    },
  { id: "strategist", emoji: "🧠", name: "Стратег"     },
  { id: "copywriter", emoji: "✍️", name: "Копирайтер"  },
  { id: "metaads",    emoji: "📣", name: "Таргетолог"  },
];

function PipelineRunner({ clients, onRunOne }: {
  clients: any[];
  onRunOne: (wId: string, cId: string, pointA: string, extra: string) => Promise<void>;
}) {
  const [clientId, setClientId] = useState("");
  const [running,  setRunning]  = useState(false);
  const [progress, setProgress] = useState<Record<string, "idle"|"running"|"done"|"error">>({});
  const [open,     setOpen]     = useState(false);

  async function handleRunAll() {
    if (!clientId) return;
    setRunning(true);
    const next: Record<string, "idle"|"running"|"done"|"error"> = {};
    PIPELINE_AGENTS.forEach((a) => { next[a.id] = "idle"; });
    setProgress({ ...next });

    for (const agent of PIPELINE_AGENTS) {
      setProgress((p) => ({ ...p, [agent.id]: "running" }));
      try {
        await onRunOne(agent.id, clientId, "", "");
        setProgress((p) => ({ ...p, [agent.id]: "done" }));
      } catch {
        setProgress((p) => ({ ...p, [agent.id]: "error" }));
      }
    }
    setRunning(false);
  }

  const allDone = Object.keys(progress).length > 0 &&
    PIPELINE_AGENTS.every((a) => progress[a.id] === "done");

  return (
    <div className="bg-gradient-to-br from-accent/8 to-accent/3 border border-accent/25 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center">
            <Sparkles size={14} className="text-accent" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-text">Запустить всю AI-команду</p>
            <p className="text-[10px] text-subtext">Все 4 агента → результаты сохранятся в профиль клиента</p>
          </div>
        </div>
        <ChevronRight size={13} className={clsx("text-subtext transition-transform", open && "rotate-90")} />
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-accent/15 pt-3 space-y-3">
          <select
            className="input w-full text-xs"
            value={clientId}
            onChange={(e) => { setClientId(e.target.value); setProgress({}); }}
          >
            <option value="">— выбрать клиента —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name} · {c.niche}</option>
            ))}
          </select>

          {/* Agent progress */}
          {Object.keys(progress).length > 0 && (
            <div className="grid grid-cols-2 gap-1.5">
              {PIPELINE_AGENTS.map((a) => {
                const s = progress[a.id] ?? "idle";
                return (
                  <div key={a.id} className={clsx(
                    "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] border transition-colors",
                    s === "running" ? "border-blue-500/30 bg-blue-500/10 text-blue-300"  :
                    s === "done"    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" :
                    s === "error"   ? "border-red-500/30 bg-red-500/10 text-red-300" :
                    "border-border bg-nav text-subtext"
                  )}>
                    {s === "running" ? <Loader2 size={9} className="animate-spin shrink-0" /> :
                     s === "done"    ? <CheckCircle2 size={9} className="shrink-0" /> :
                     s === "error"   ? <AlertCircle size={9} className="shrink-0" /> :
                     <Clock size={9} className="shrink-0" />}
                    <span>{a.emoji} {a.name}</span>
                  </div>
                );
              })}
            </div>
          )}

          {allDone && (
            <p className="text-[11px] text-emerald-400 text-center">
              ✅ Готово — все результаты сохранены в профиль клиента
            </p>
          )}

          <button
            onClick={handleRunAll}
            disabled={running || !clientId}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-accent hover:bg-accent/90 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
          >
            {running
              ? <><Loader2 size={12} className="animate-spin" />Команда работает…</>
              : <><Sparkles size={12} />Запустить всю команду</>}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Task runner panel ─────────────────────────────────────────────────────────
function TaskRunner({
  worker, clients, tasks, onRun, onDelete,
}: {
  worker: typeof TEAM_WORKERS[0];
  clients: any[];
  tasks: any[];
  onRun: (wId: string, cId: string, pointA: string, extra: string) => Promise<void>;
  onDelete: (id: string) => void;
}) {
  const [clientId, setClientId] = useState("");
  const [pointA, setPointA]     = useState("");
  const [extra, setExtra]       = useState("");
  const [running, setRunning]   = useState(false);
  const [copied, setCopied]     = useState<string | null>(null);
  const [openTask, setOpenTask] = useState<string | null>(null);

  const myTasks = tasks.filter((t) => t.worker_id === worker.id);
  const isWorking = myTasks.some((t) => t.status === "running");

  async function handleRun() {
    if (!clientId) return;
    setRunning(true);
    try {
      await onRun(worker.id, clientId, pointA, extra);
      setClientId(""); setPointA(""); setExtra("");
    } finally { setRunning(false); }
  }

  async function copyResult(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Run form */}
      <div className="space-y-2.5 p-3 bg-nav rounded-xl border border-border">
        <p className="text-xs font-semibold text-text flex items-center gap-1.5">
          <Zap size={11} className="text-accent" /> Запустить задачу
        </p>

        <div>
          <label className="text-[10px] text-subtext block mb-1">Клиент *</label>
          <select className="input w-full text-xs" value={clientId}
            onChange={(e) => setClientId(e.target.value)}>
            <option value="">— выбрать клиента —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name} · {c.niche}</option>
            ))}
          </select>
        </div>

        {(worker.id === "producer" || worker.id === "businessmap") && (
          <div>
            <label className="text-[10px] text-subtext block mb-1">📍 Точка А — стартовое состояние</label>
            <textarea rows={2} className="input w-full text-xs resize-none"
              placeholder="Доход $500/мес, 2000 подписчиков, нет воронки…"
              value={pointA} onChange={(e) => setPointA(e.target.value)} />
          </div>
        )}

        {worker.id === "businessmap" && (
          <div>
            <label className="text-[10px] text-subtext block mb-1">Текущий этап</label>
            <select className="input w-full text-xs" value={extra} onChange={(e) => setExtra(e.target.value)}>
              <option value="">— выбрать —</option>
              {["1 — Онбординг","2 — Распаковка","3 — Продукты","4 — Воронка",
                "5 — Контент-план","6 — Подкаст","7 — Авто-нарезка","8 — Реклама","9 — Аналитика"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        {worker.id === "dailybrief" && (
          <p className="text-[11px] text-subtext/70 italic bg-background rounded px-2 py-1.5">
            📅 Протокол П-01: топ-3 задачи дня, аутрич-план, статус рекламы, задачи AI-команде
          </p>
        )}

        {!["businessmap","dailybrief"].includes(worker.id) && (
          <div>
            <label className="text-[10px] text-subtext block mb-1">
              {worker.id === "producer" ? "🎯 Цель / Точка Б"
               : worker.id === "smm"        ? "Фокус / акция недели"
               : worker.id === "copywriter" ? "Тема поста или продукт"
               : worker.id === "sales"      ? "Продукт для продажи"
               : worker.id === "analyst"    ? "Период или вопрос анализа"
               : worker.id === "metaads"    ? "Продукт и бюджет рекламы"
               : "Доп. контекст / задача"}
            </label>
            <input className="input w-full text-xs"
              placeholder={
                worker.id === "producer"   ? "Выйти на $5000/мес за 3 месяца…"
                : worker.id === "smm"      ? "Акция: аудит $135 на этой неделе…"
                : worker.id === "metaads"  ? "Аудит $150, бюджет $10/день…"
                : "Дополнительный контекст…"
              }
              value={extra} onChange={(e) => setExtra(e.target.value)} />
          </div>
        )}

        <button onClick={handleRun} disabled={running || isWorking || !clientId}
          className="btn-primary w-full flex items-center justify-center gap-2 text-xs py-2">
          {running || isWorking
            ? <><Loader2 size={12} className="animate-spin" /> Groq думает… (15–30 сек)</>
            : <><Play size={12} /> Запустить {worker.name}</>
          }
        </button>
      </div>

      {/* Task history */}
      <div className="flex-1 min-h-0 flex flex-col gap-2">
        <p className="text-[10px] font-semibold text-subtext uppercase tracking-wider flex items-center gap-1">
          <Clock size={9} /> История ({myTasks.length})
        </p>
        <div className="overflow-y-auto space-y-2 flex-1">
          {myTasks.length === 0 ? (
            <p className="text-[11px] text-subtext/50 text-center py-4">Задач ещё не было</p>
          ) : (
            myTasks.map((task) => (
              <div key={task.id}
                className={clsx(
                  "rounded-lg border text-[11px] overflow-hidden",
                  task.status === "running" && "border-violet-400/30 bg-violet-400/5",
                  task.status === "done"    && "border-emerald-500/20 bg-emerald-500/5",
                  task.status === "error"   && "border-red-500/20 bg-red-500/5",
                )}>
                <div className="flex items-center justify-between p-2 gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {task.status === "running" && <Loader2 size={10} className="text-violet-400 animate-spin shrink-0" />}
                    {task.status === "done"    && <CheckCircle2 size={10} className="text-emerald-400 shrink-0" />}
                    {task.status === "error"   && <AlertCircle size={10} className="text-red-400 shrink-0" />}
                    <span className="text-text/80 truncate">{task.client_name} · {task.client_niche}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-subtext/50">{timeAgo(task.created_at)}</span>
                    <button onClick={() => onDelete(task.id)}
                      className="p-0.5 text-subtext/30 hover:text-red-400 transition-colors">
                      <Trash2 size={9} />
                    </button>
                  </div>
                </div>

                {task.result && (
                  <div>
                    <button onClick={() => setOpenTask(openTask === task.id ? null : task.id)}
                      className="w-full flex items-center gap-1 px-2 pb-1 text-[10px] text-accent hover:text-accent/80 transition-colors">
                      {openTask === task.id ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                      {openTask === task.id ? "Скрыть" : "Показать результат"}
                    </button>
                    {openTask === task.id && (
                      <div className="mx-2 mb-2 p-2 bg-nav rounded border border-border text-[11px] text-text/80 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                        <div className="flex justify-end mb-1">
                          <button onClick={() => copyResult(task.result, task.id)}
                            className="flex items-center gap-1 text-[10px] text-subtext hover:text-text transition-colors">
                            {copied === task.id ? <Check size={9} className="text-green-400" /> : <Copy size={9} />}
                            {copied === task.id ? "Скопировано" : "Копировать"}
                          </button>
                        </div>
                        {task.result}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TeamPage() {
  const [tasks, setTasks]         = useState<any[]>([]);
  const [clients, setClients]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"knowledge" | "task" | "history">("task");
  const time = useLiveClock();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, c] = await Promise.all([getTeamTasks(), getClients()]);
      setTasks(t); setClients(c);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh while a task is running — exponential backoff 4s→8s→16s (max)
  useEffect(() => {
    const running = tasks.some((t) => t.status === "running");
    if (!running) return;
    let delay = 4000;
    let id: ReturnType<typeof setTimeout>;
    function schedule() {
      id = setTimeout(async () => {
        await load();
        delay = Math.min(delay * 2, 16000);
        if (tasks.some((t) => t.status === "running")) schedule();
      }, delay);
    }
    schedule();
    return () => clearTimeout(id);
  }, [tasks, load]);

  async function handleRun(wId: string, cId: string, pointA: string, extra: string) {
    const worker = TEAM_WORKERS.find((w) => w.id === wId)!;
    const client = clients.find((c) => c.id === cId)!;
    const optimistic = {
      id: `opt_${Date.now()}`,
      worker_id: wId, worker_name: worker.name,
      client_id: cId, client_name: client?.name ?? "Клиент", client_niche: client?.niche ?? "",
      status: "running", created_at: new Date().toISOString(),
      completed_at: null, point_a: pointA, extra, result: "",
    };
    setTasks((prev) => [optimistic, ...prev]);
    await runTeamTask({ worker_id: wId, client_id: cId, point_a: pointA, extra });
    await load();
  }

  async function handleDelete(id: string) {
    await deleteTeamTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  const selectedWorker = TEAM_WORKERS.find((w) => w.id === selectedId) ?? null;
  const runningCount   = tasks.filter((t) => t.status === "running").length;
  const doneCount      = tasks.filter((t) => t.status === "done").length;
  const totalKnowledge = 0; // loaded per agent lazily

  // Stats
  const todayStr   = new Date().toISOString().slice(0, 10);
  const todayCount = tasks.filter((t) => t.created_at?.slice(0, 10) === todayStr).length;

  return (
    <div className="space-y-4">

      {/* ── Office Room ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border"
        style={{ background: "linear-gradient(160deg, #0c0f24 0%, #070a1a 60%, #050710 100%)" }}>

        {/* Pixel floor tiles */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(108,99,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(108,99,255,0.06) 1px, transparent 1px),
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px, 64px 64px, 16px 16px, 16px 16px",
        }} />

        {/* Ambient glow orbs */}
        <div className="absolute top-8 left-1/5 w-48 h-48 bg-accent/6 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-4 right-1/4 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 bg-violet-500/3 rounded-full blur-3xl pointer-events-none" />

        {/* Room header */}
        <div className="relative z-10 px-3 sm:px-5 pt-4 pb-3 border-b border-white/6 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            {/* Pixel office icon */}
            <div style={{ imageRendering: "pixelated" }}>
              <svg width="28" height="28" viewBox="0 0 7 7" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
                <rect x="1" y="0" width="5" height="5" fill="#1a1d30"/>
                <rect x="0" y="1" width="7" height="4" fill="#1e2238"/>
                <rect x="2" y="1" width="3" height="2" fill="#6c63ff" opacity="0.8"/>
                <rect x="1" y="5" width="2" height="2" fill="#2a2d4a"/>
                <rect x="4" y="5" width="2" height="2" fill="#2a2d4a"/>
                <rect x="3" y="3" width="1" height="1" fill="#a78bfa"/>
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-text tracking-wide">Офис AMAI MEDIA</h1>
              <p className="text-[11px] text-subtext/60">Нячанг, Вьетнам · @amai.media · Зарина Галымжан</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Stats pills */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[11px] bg-nav/60 border border-border/50 px-2.5 py-1 rounded-full text-text/70">
                <Users size={9} className="text-accent" /> {TEAM_WORKERS.length} сотрудников
              </span>
              <span className="flex items-center gap-1.5 text-[11px] bg-nav/60 border border-border/50 px-2.5 py-1 rounded-full text-text/70">
                <CheckCircle2 size={9} className="text-emerald-400" /> {doneCount} задач
              </span>
              <span className="flex items-center gap-1.5 text-[11px] bg-nav/60 border border-border/50 px-2.5 py-1 rounded-full text-text/70">
                <Zap size={9} className="text-yellow-400" /> {todayCount} сегодня
              </span>
            </div>
            {/* Live clock */}
            <div className="flex items-center gap-2">
              {runningCount > 0
                ? <Wifi size={11} className="text-violet-400 animate-pulse" />
                : <WifiOff size={11} className="text-subtext/30" />
              }
              <span className="font-mono text-xs text-subtext/60">{time}</span>
              <button onClick={load}
                className="p-1.5 text-subtext/40 hover:text-accent transition-colors rounded">
                <RefreshCw size={11} />
              </button>
            </div>
          </div>
        </div>

        {/* Running banner */}
        {runningCount > 0 && (
          <div className="relative z-10 mx-5 mt-3 flex items-center gap-2 px-3 py-2 bg-violet-500/10 border border-violet-500/20 rounded-lg">
            <Loader2 size={12} className="text-violet-400 animate-spin shrink-0" />
            <p className="text-xs text-violet-300">
              <strong>{runningCount}</strong> сотрудник{runningCount > 1 ? "а" : ""} в работе — AI генерирует ответ
            </p>
          </div>
        )}

        {/* Office floor */}
        <div className="relative z-10 p-4 pb-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-sm text-subtext">
              <Loader2 size={16} className="animate-spin text-accent" /> Загрузка офиса…
            </div>
          ) : (
            <>
              {/* Room zone label */}
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[9px] tracking-[0.2em] uppercase text-subtext/30 font-medium">Open Floor · AMAI MEDIA HQ</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              {/* Desks: 3 rows × 3 cols on mobile, all in one row on xl */}
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-3">
                {TEAM_WORKERS.map((worker) => (
                  <DeskStation
                    key={worker.id}
                    worker={worker}
                    tasks={tasks}
                    isSelected={selectedId === worker.id}
                    onClick={() => {
                      setSelectedId(selectedId === worker.id ? null : worker.id);
                      setActiveTab("task");
                    }}
                  />
                ))}
              </div>

              {/* Floor hint */}
              <p className="text-center text-[9px] text-subtext/20 mt-4 tracking-widest uppercase font-medium">
                ↑ нажми на сотрудника чтобы управлять ↑
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Pipeline runner: run all 4 agents at once ───────────────────── */}
      <PipelineRunner clients={clients} onRunOne={handleRun} />

      {/* ── Worker control panel (slides in when selected) ───────────────── */}
      {selectedWorker && (
        <div className="card border-accent/20 animate-fade-in">
          {/* Panel header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={clsx(
                "w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0",
                selectedWorker.color
              )}>
                {selectedWorker.emoji}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-text">{selectedWorker.name}</p>
                  <span className="text-xs text-subtext">{selectedWorker.role}</span>
                  <span className="text-[10px] text-subtext/50 bg-nav px-1.5 py-0.5 rounded">
                    {selectedWorker.schedule}
                  </span>
                </div>
                <p className="text-xs text-subtext/60 mt-0.5">{selectedWorker.desc}</p>
              </div>
            </div>
            <button onClick={() => setSelectedId(null)}
              className="p-1.5 text-subtext/40 hover:text-text transition-colors rounded">
              <X size={14} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-nav rounded-xl p-1">
            {([
              { id: "task",      label: "Запустить",  icon: <Play size={11} /> },
              { id: "knowledge", label: "База знаний", icon: <Brain size={11} /> },
            ] as const).map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg transition-all",
                  activeTab === tab.id
                    ? "bg-accent text-white font-medium shadow-sm"
                    : "text-subtext hover:text-text"
                )}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="min-h-[400px]">
            {activeTab === "task" && (
              <TaskRunner
                worker={selectedWorker}
                clients={clients}
                tasks={tasks}
                onRun={handleRun}
                onDelete={handleDelete}
              />
            )}
            {activeTab === "knowledge" && (
              <KnowledgePanel
                agentId={selectedWorker.id}
                agentName={selectedWorker.name}
              />
            )}
          </div>
        </div>
      )}

      {/* ── No selection hint ─────────────────────────────────────────────── */}
      {!selectedWorker && !loading && (
        <div className="card border-dashed border-border/50 flex flex-col items-center justify-center py-10 gap-3 text-center">
          <div className="text-4xl">👆</div>
          <p className="text-sm font-medium text-text">Выбери сотрудника в офисе</p>
          <p className="text-xs text-subtext/60 max-w-sm">
            Нажми на рабочее место чтобы запустить задачу, просмотреть историю или добавить знания в базу сотрудника
          </p>
          <div className="flex gap-2 mt-1 flex-wrap justify-center">
            {TEAM_WORKERS.slice(0, 4).map((w) => (
              <button key={w.id} onClick={() => { setSelectedId(w.id); setActiveTab("task"); }}
                className="flex items-center gap-1.5 text-xs bg-nav hover:bg-border border border-border px-2.5 py-1.5 rounded-lg transition-colors">
                {w.emoji} {w.name}
                <ChevronRight size={10} className="text-subtext/50" />
              </button>
            ))}
            <span className="text-xs text-subtext/40 self-center">и ещё {TEAM_WORKERS.length - 4}…</span>
          </div>
        </div>
      )}
    </div>
  );
}
