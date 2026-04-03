"use client";
import { useState, useEffect } from "react";
import {
  Calendar, Plus, X, Send, Clock, CheckCircle2, AlertCircle,
  Sparkles, RefreshCw, Copy, Check, Trash2, Instagram,
  Youtube, Globe, MessageSquare, Edit2,
} from "lucide-react";
import clsx from "clsx";

// ── Types ──────────────────────────────────────────────────────────────────────
type Platform = "telegram" | "instagram" | "youtube" | "facebook" | "threads" | "vk";
type PostStatus = "scheduled" | "published" | "failed" | "draft";

interface ScheduledPost {
  id: string;
  platform: Platform;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  scheduledAt: string;
  status: PostStatus;
  channelId?: string;
  publishedAt?: string;
  error?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const PLATFORMS: { id: Platform; label: string; color: string; icon: React.ElementType }[] = [
  { id: "telegram",  label: "Telegram",  color: "text-blue-400",    icon: Send      },
  { id: "instagram", label: "Instagram", color: "text-pink-400",    icon: Instagram },
  { id: "youtube",   label: "YouTube",   color: "text-red-400",     icon: Youtube   },
  { id: "facebook",  label: "Facebook",  color: "text-blue-500",    icon: Globe     },
  { id: "threads",   label: "Threads",   color: "text-text",        icon: MessageSquare },
  { id: "vk",        label: "VK",        color: "text-blue-300",    icon: Globe     },
];

const STATUS_CONFIG: Record<PostStatus, { label: string; color: string; icon: React.ElementType }> = {
  scheduled:  { label: "Запланирован", color: "text-amber-400 bg-amber-400/10 border-amber-400/20",     icon: Clock        },
  published:  { label: "Опубликован",  color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle2 },
  failed:     { label: "Ошибка",       color: "text-red-400 bg-red-400/10 border-red-400/20",            icon: AlertCircle  },
  draft:      { label: "Черновик",     color: "text-subtext bg-white/5 border-border",                   icon: Edit2        },
};

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ru", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function getPlatform(id: Platform) { return PLATFORMS.find((p) => p.id === id)!; }

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SchedulerPage() {
  const [posts,         setPosts]         = useState<ScheduledPost[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [showModal,     setShowModal]     = useState(false);
  const [filterPlatform, setFilterPlatform] = useState<Platform | "all">("all");
  const [filterStatus,  setFilterStatus]  = useState<PostStatus | "all">("all");
  const [publishing,    setPublishing]    = useState<Record<string, boolean>>({});
  const [copied,        setCopied]        = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    platform:    "telegram" as Platform,
    text:        "",
    imageUrl:    "",
    videoUrl:    "",
    scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    channelId:   "",
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => { loadPosts(); }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      const res  = await fetch("/api/scheduler");
      const data = await res.json();
      setPosts(data);
    } finally { setLoading(false); }
  }

  async function createPost() {
    if (!form.text.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/scheduler", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          ...form,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          imageUrl:    form.imageUrl || undefined,
          videoUrl:    form.videoUrl || undefined,
          channelId:   form.channelId || undefined,
        }),
      });
      await loadPosts();
      setShowModal(false);
      setForm({ platform: "telegram", text: "", imageUrl: "", videoUrl: "", scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16), channelId: "" });
    } finally { setSaving(false); }
  }

  async function publishNow(post: ScheduledPost) {
    setPublishing((prev) => ({ ...prev, [post.id]: true }));
    try {
      const res  = await fetch(`/api/scheduler/${post.id}/publish`, { method: "POST" });
      const data = await res.json();
      await loadPosts();
      if (data.message) alert(data.message);
    } finally {
      setPublishing((prev) => ({ ...prev, [post.id]: false }));
    }
  }

  async function deletePost(id: string) {
    await fetch(`/api/scheduler/${id}`, { method: "DELETE" });
    await loadPosts();
  }

  async function generateAIText() {
    if (!form.platform) return;
    setAiLoading(true);
    try {
      const res  = await fetch("/api/hub", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          action: "content",
          data: {
            platform: form.platform === "telegram" ? "Telegram" : "Instagram",
            contentType: form.platform === "telegram" ? "Пост в канал" : "Пост",
            topic: "экспертный пост для аудитории",
            tone: "экспертный",
            funnelGoal: "прогрев аудитории",
          },
        }),
      });
      const json = await res.json();
      if (json.result) setForm((f) => ({ ...f, text: json.result }));
    } finally { setAiLoading(false); }
  }

  const filtered = posts
    .filter((p) => filterPlatform === "all" || p.platform === filterPlatform)
    .filter((p) => filterStatus   === "all" || p.status   === filterStatus);

  const stats = {
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    published: posts.filter((p) => p.status === "published").length,
    failed:    posts.filter((p) => p.status === "failed").length,
  };

  return (
    <div className="space-y-5">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text flex items-center gap-2">
            <Calendar size={20} className="text-accent" /> Планировщик постов
          </h1>
          <p className="text-sm text-subtext mt-0.5">
            Автоматический постинг в Telegram · Instagram · YouTube
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> Запланировать пост
        </button>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 stagger">
        <div className="card p-3 text-center">
          <p className="text-lg font-bold text-amber-400">{stats.scheduled}</p>
          <p className="text-[10px] text-subtext">Запланировано</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-lg font-bold text-emerald-400">{stats.published}</p>
          <p className="text-[10px] text-subtext">Опубликовано</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-lg font-bold text-red-400">{stats.failed}</p>
          <p className="text-[10px] text-subtext">Ошибок</p>
        </div>
      </div>

      {/* ── Telegram auto-post info banner ─────────────────────────────────────── */}
      <div className="card p-4 border-blue-400/20 bg-blue-400/5 flex items-start gap-3">
        <Send size={16} className="text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="text-text font-semibold mb-1">Telegram: автоматическая публикация</p>
          <p className="text-subtext">
            Добавь <code className="bg-blue-400/20 px-1 rounded font-mono">TELEGRAM_BOT_TOKEN</code> и <code className="bg-blue-400/20 px-1 rounded font-mono">TELEGRAM_CHANNEL_ID</code> в .env для прямого постинга.
            Instagram/YouTube — копируй текст и публикуй через Meta Business Suite или Hootsuite.
          </p>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-subtext">Платформа:</span>
        {(["all", ...PLATFORMS.map((p) => p.id)] as (Platform | "all")[]).map((p) => (
          <button
            key={p}
            onClick={() => setFilterPlatform(p)}
            className={clsx(
              "text-[11px] px-2.5 py-1 rounded-full border transition-colors",
              filterPlatform === p
                ? "bg-accent/20 border-accent/40 text-accent"
                : "border-border text-subtext hover:text-text"
            )}
          >
            {p === "all" ? "Все" : PLATFORMS.find((pl) => pl.id === p)?.label ?? p}
          </button>
        ))}
      </div>

      {/* ── Posts list ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => <div key={i} className="card p-4 animate-pulse h-20" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
            <Calendar size={24} className="text-accent" />
          </div>
          <p className="text-sm font-medium text-text">Нет запланированных постов</p>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={13} /> Создать первый пост
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => {
            const plt    = getPlatform(post.platform);
            const PltIcon = plt.icon;
            const stCfg  = STATUS_CONFIG[post.status];
            const StIcon = stCfg.icon;

            return (
              <div key={post.id} className="card p-4 flex items-start gap-3 group hover:border-accent/30 transition-all">
                {/* Platform icon */}
                <div className={clsx("w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0", plt.color)}>
                  <PltIcon size={16} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-text">{plt.label}</span>
                    <span className={clsx("text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1", stCfg.color)}>
                      <StIcon size={9} /> {stCfg.label}
                    </span>
                    <span className="text-[10px] text-subtext flex items-center gap-1 ml-auto">
                      <Clock size={9} /> {fmtDateTime(post.scheduledAt)}
                    </span>
                  </div>
                  <p className="text-xs text-text line-clamp-2">{post.text}</p>
                  {post.imageUrl && (
                    <p className="text-[10px] text-subtext mt-1">📎 Изображение прикреплено</p>
                  )}
                  {post.error && (
                    <p className="text-[10px] text-red-400 mt-1">{post.error}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 shrink-0">
                  {post.status !== "published" && (
                    <button
                      onClick={() => publishNow(post)}
                      disabled={publishing[post.id]}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent text-[11px] transition-colors"
                    >
                      {publishing[post.id] ? <RefreshCw size={10} className="animate-spin" /> : <Send size={10} />}
                      Опубликовать
                    </button>
                  )}
                  <button
                    onClick={async () => { await navigator.clipboard.writeText(post.text); setCopied(post.id); setTimeout(() => setCopied(null), 2000); }}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-subtext hover:text-text transition-colors"
                  >
                    {copied === post.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="p-1.5 rounded-lg hover:bg-red-400/10 text-subtext hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create post modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <p className="text-sm font-semibold text-text">Новый пост</p>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-white/5 text-subtext"><X size={16} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Platform */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-subtext uppercase tracking-wide">Платформа</label>
                <div className="grid grid-cols-3 gap-2">
                  {PLATFORMS.map(({ id, label, icon: Icon, color }) => (
                    <button
                      key={id}
                      onClick={() => setForm((f) => ({ ...f, platform: id }))}
                      className={clsx(
                        "flex items-center gap-2 p-2.5 rounded-xl border text-[11px] font-medium transition-colors",
                        form.platform === id
                          ? "border-accent/40 bg-accent/10 text-accent"
                          : "border-border text-subtext hover:border-accent/30 hover:text-text"
                      )}
                    >
                      <Icon size={13} className={form.platform === id ? "text-accent" : color} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-subtext uppercase tracking-wide">Текст поста</label>
                  <button
                    onClick={generateAIText}
                    disabled={aiLoading}
                    className="flex items-center gap-1 text-[10px] text-accent hover:text-accent/80"
                  >
                    {aiLoading ? <RefreshCw size={10} className="animate-spin" /> : <Sparkles size={10} />}
                    AI текст
                  </button>
                </div>
                <textarea
                  value={form.text}
                  onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                  placeholder="Текст публикации..."
                  className="input w-full h-28 resize-none text-sm"
                />
              </div>

              {/* Media */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-subtext uppercase tracking-wide">URL изображения</label>
                  <input
                    className="input w-full text-xs"
                    placeholder="https://..."
                    value={form.imageUrl}
                    onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-subtext uppercase tracking-wide">URL видео</label>
                  <input
                    className="input w-full text-xs"
                    placeholder="https://..."
                    value={form.videoUrl}
                    onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
                  />
                </div>
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-subtext uppercase tracking-wide">Дата и время</label>
                  <input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                    className="input w-full text-sm"
                  />
                </div>
                {form.platform === "telegram" && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-subtext uppercase tracking-wide">Channel ID (опц.)</label>
                    <input
                      className="input w-full text-xs"
                      placeholder="-100123456789"
                      value={form.channelId}
                      onChange={(e) => setForm((f) => ({ ...f, channelId: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 px-5 py-4 border-t border-border shrink-0">
              <button onClick={() => setShowModal(false)} className="btn-ghost flex-1">Отмена</button>
              <button onClick={createPost} disabled={!form.text.trim() || saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <RefreshCw size={13} className="animate-spin" /> : <Calendar size={13} />}
                Запланировать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
