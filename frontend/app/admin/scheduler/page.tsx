/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/scheduler/page.tsx
 *
 * Full social media auto-scheduler: compose → schedule → queue → publish.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../_components/AdminLayout";

/* ── platform config ─────────────────────────────────────────────── */
const PLATFORMS = [
  { id: "telegram",  label: "Telegram",  icon: "✈️",  color: "#2aabee", limit: 4096,  realPost: true  },
  { id: "instagram", label: "Instagram", icon: "📸",  color: "#e1306c", limit: 2200,  realPost: false },
  { id: "tiktok",    label: "TikTok",    icon: "🎵",  color: "#ff0050", limit: 2200,  realPost: false },
  { id: "youtube",   label: "YouTube",   icon: "▶️",  color: "#ff0000", limit: 5000,  realPost: false },
  { id: "vk",        label: "VK",        icon: "💙",  color: "#4c75a3", limit: 20000, realPost: false },
  { id: "facebook",  label: "Facebook",  icon: "👤",  color: "#1877f2", limit: 63206, realPost: false },
  { id: "threads",   label: "Threads",   icon: "🔗",  color: "#101010", limit: 500,   realPost: false },
  { id: "linkedin",  label: "LinkedIn",  icon: "💼",  color: "#0a66c2", limit: 3000,  realPost: false },
] as const;

type PlatformId = typeof PLATFORMS[number]["id"];

const TONES = ["engaging", "professional", "funny", "inspirational", "educational", "storytelling"];

/* ── types ───────────────────────────────────────────────────────── */
interface ScheduledPost {
  id: string;
  platform: string;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  scheduledAt: string;
  status: "scheduled" | "published" | "failed" | "draft";
  publishedAt?: string;
  error?: string;
  title?: string;
}

type Tab = "compose" | "queue" | "published" | "integrations";

/* ── helpers ─────────────────────────────────────────────────────── */
function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function localNow(offsetMinutes = 30) {
  const d = new Date(Date.now() + offsetMinutes * 60000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function CharBar({ current, limit, color }: { current: number; limit: number; color: string }) {
  const pct = Math.min(100, (current / limit) * 100);
  const over = current > limit;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div style={{ flex: 1, height: "3px", borderRadius: "3px", background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: over ? "#ef4444" : color, transition: "width 0.2s, background 0.2s" }} />
      </div>
      <span style={{ fontSize: "9px", fontFamily: "monospace", color: over ? "#fca5a5" : "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>
        {current}/{limit}
      </span>
    </div>
  );
}

const STATUS_MAP: Record<string, [string, string, string]> = {
  scheduled:  ["rgba(99,102,241,0.12)",  "#a5b4fc", "В очереди"],
  published:  ["rgba(34,197,94,0.12)",   "#86efac", "Опубликован"],
  failed:     ["rgba(239,68,68,0.12)",   "#fca5a5", "Ошибка"],
  draft:      ["rgba(255,255,255,0.06)", "rgba(255,255,255,0.4)", "Черновик"],
};

function StatusBadge({ status }: { status: string }) {
  const [bg, text, label] = STATUS_MAP[status] ?? STATUS_MAP.draft;
  return <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, background: bg, color: text }}>{label}</span>;
}

/* ── main component ──────────────────────────────────────────────── */
export default function SchedulerPage() {
  const [tab, setTab] = useState<Tab>("compose");

  /* compose state */
  const [selPlatforms, setSelPlatforms] = useState<Set<PlatformId>>(new Set(["telegram"]));
  const [captions, setCaptions]         = useState<Record<string, string>>({});
  const [activePlat, setActivePlat]     = useState<PlatformId>("telegram");
  const [mediaUrl, setMediaUrl]         = useState("");
  const [mediaType, setMediaType]       = useState<"image" | "video">("video");
  const [scheduleAt, setScheduleAt]     = useState(localNow());
  const [postNow, setPostNow]           = useState(false);
  const [topic, setTopic]               = useState("");
  const [tone, setTone]                 = useState("engaging");
  const [aiLoading, setAiLoading]       = useState<PlatformId | "all" | null>(null);
  const [submitting, setSubmitting]     = useState(false);
  const [submitMsg, setSubmitMsg]       = useState<{ ok: boolean; text: string } | null>(null);

  /* queue state */
  const [posts, setPosts]           = useState<ScheduledPost[]>([]);
  const [filterPlat, setFilterPlat] = useState("all");
  const [filterStat, setFilterStat] = useState("all");
  const [publishing, setPublishing] = useState<string | null>(null);
  const [pubMsg, setPubMsg]         = useState<Record<string, string>>({});

  const loadPosts = useCallback(async () => {
    const r = await fetch("/api/scheduler");
    const d = await r.json();
    if (Array.isArray(d)) setPosts(d);
  }, []);

  useEffect(() => { if (tab === "queue" || tab === "published") loadPosts(); }, [tab, loadPosts]);

  /* ── AI caption generation ─────────────────────────────────────── */
  async function generateCaption(platform: PlatformId | "all") {
    if (!topic.trim()) { alert("Введите тему поста перед генерацией"); return; }
    setAiLoading(platform);
    const targets = platform === "all" ? [...selPlatforms] : [platform];
    try {
      await Promise.all(targets.map(async plat => {
        const r = await fetch("/api/scheduler/ai-caption", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, platform: plat, language: "ru", tone }),
        });
        const d = await r.json();
        if (d.caption) setCaptions(prev => ({ ...prev, [plat]: d.caption }));
      }));
    } finally {
      setAiLoading(null);
    }
  }

  /* ── submit scheduled posts ───────────────────────────────────── */
  async function handleSubmit() {
    if (selPlatforms.size === 0) { setSubmitMsg({ ok: false, text: "Выберите хотя бы одну платформу" }); return; }
    const hasCaption = [...selPlatforms].some(p => captions[p]?.trim());
    if (!hasCaption) { setSubmitMsg({ ok: false, text: "Введите текст хотя бы для одной платформы" }); return; }

    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const r = await fetch("/api/scheduler/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platforms:   [...selPlatforms],
          captions,
          imageUrl:    mediaType === "image" ? mediaUrl || undefined : undefined,
          videoUrl:    mediaType === "video" ? mediaUrl || undefined : undefined,
          scheduledAt: postNow ? new Date().toISOString() : new Date(scheduleAt).toISOString(),
        }),
      });
      const d = await r.json();
      if (d.count > 0) {
        setSubmitMsg({ ok: true, text: `✅ Создано ${d.count} пост(ов) в очереди` });
        if (postNow) {
          // immediately publish Telegram posts
          for (const post of (d.created ?? [])) {
            if (post.platform === "telegram") {
              await fetch(`/api/scheduler/${post.id}/publish`, { method: "POST" });
            }
          }
        }
        setCaptions({});
        setMediaUrl("");
        setTopic("");
      } else {
        setSubmitMsg({ ok: false, text: "Нет постов с текстом — заполните подписи" });
      }
    } catch (e: any) {
      setSubmitMsg({ ok: false, text: e.message });
    } finally {
      setSubmitting(false);
    }
  }

  /* ── publish now from queue ───────────────────────────────────── */
  async function publishNow(post: ScheduledPost) {
    setPublishing(post.id);
    const r = await fetch(`/api/scheduler/${post.id}/publish`, { method: "POST" });
    const d = await r.json();
    setPubMsg(prev => ({ ...prev, [post.id]: d.message ?? (d.ok ? "✅ Опубликован" : `❌ ${d.error}`) }));
    await loadPosts();
    setPublishing(null);
  }

  async function deletePost(id: string) {
    await fetch(`/api/scheduler/${id}`, { method: "DELETE" });
    await loadPosts();
  }

  /* ── queue filters ────────────────────────────────────────────── */
  const filteredPosts = posts.filter(p =>
    (filterPlat === "all" || p.platform === filterPlat) &&
    (filterStat === "all" || p.status === filterStat)
  );
  const queuePosts     = filteredPosts.filter(p => p.status === "scheduled" || p.status === "draft");
  const publishedPosts = filteredPosts.filter(p => p.status === "published" || p.status === "failed");

  /* ── stats ──────────────────────────────────────────────────────── */
  const stats = {
    total:     posts.length,
    scheduled: posts.filter(p => p.status === "scheduled").length,
    published: posts.filter(p => p.status === "published").length,
    failed:    posts.filter(p => p.status === "failed").length,
  };

  /* ── platform helpers ───────────────────────────────────────────── */
  function togglePlatform(id: PlatformId) {
    setSelPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); if (activePlat === id) setActivePlat([...next][0] as PlatformId); }
      else { next.add(id); }
      return next;
    });
  }

  const platConfig = PLATFORMS.find(p => p.id === activePlat)!;
  const activeCaption = captions[activePlat] ?? "";

  /* ─────────────────────────────────────────────────────────────────
     RENDER
  ─────────────────────────────────────────────────────────────────── */
  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ padding: "28px 32px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#38bdf8", marginBottom: "6px" }}>
              Авто-постинг · 8 соц.сетей
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
              Планировщик публикаций
            </h1>
          </div>
          {/* Quick stats */}
          <div style={{ display: "flex", gap: "10px" }}>
            {[
              { label: "В очереди", value: stats.scheduled, color: "#a5b4fc" },
              { label: "Опубликовано", value: stats.published, color: "#86efac" },
              { label: "Ошибок", value: stats.failed, color: "#fca5a5" },
            ].map(s => (
              <div key={s.label} style={{ padding: "8px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px" }}>
          {([
            ["compose",      "✍️ Создать пост"],
            ["queue",        `📅 Очередь${stats.scheduled ? ` (${stats.scheduled})` : ""}`],
            ["published",    "✅ История"],
            ["integrations", "🔌 Интеграции"],
          ] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600, background: tab === t ? "rgba(56,189,248,0.15)" : "transparent", color: tab === t ? "#38bdf8" : "rgba(255,255,255,0.4)", borderBottom: tab === t ? "2px solid #38bdf8" : "2px solid transparent", transition: "all 0.15s" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 32px 40px" }}>

        {/* ════════════════════════════════════════════════════
            TAB: COMPOSE
        ════════════════════════════════════════════════════ */}
        {tab === "compose" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>

            {/* Left: editor */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Platform selector */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Платформы</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {PLATFORMS.map(p => {
                    const sel = selPlatforms.has(p.id);
                    const act = activePlat === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => { togglePlatform(p.id); if (!sel) setActivePlat(p.id); else if (act) { const next = [...selPlatforms].find(x => x !== p.id); if (next) setActivePlat(next as PlatformId); } }}
                        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "20px", border: `1px solid ${sel ? p.color + "55" : "rgba(255,255,255,0.08)"}`, background: sel ? p.color + "15" : "rgba(255,255,255,0.02)", color: sel ? p.color : "rgba(255,255,255,0.35)", fontSize: "12px", fontWeight: sel ? 600 : 400, cursor: "pointer", transition: "all 0.15s" }}
                      >
                        <span>{p.icon}</span> {p.label}
                        {sel && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: p.color, boxShadow: `0 0 6px ${p.color}`, marginLeft: "2px" }} />}
                      </button>
                    );
                  })}
                </div>
                {selPlatforms.size > 0 && (
                  <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", alignSelf: "center" }}>Редактировать:</span>
                    {[...selPlatforms].map(pid => {
                      const plat = PLATFORMS.find(p => p.id === pid)!;
                      return (
                        <button key={pid} onClick={() => setActivePlat(pid)} style={{ padding: "3px 10px", borderRadius: "6px", border: `1px solid ${activePlat === pid ? plat.color + "55" : "rgba(255,255,255,0.06)"}`, background: activePlat === pid ? plat.color + "15" : "transparent", color: activePlat === pid ? plat.color : "rgba(255,255,255,0.4)", fontSize: "10px", fontWeight: 600, cursor: "pointer", transition: "all 0.12s" }}>
                          {plat.icon} {plat.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Topic + AI */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>AI-генерация подписи</div>
                <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                  <input
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="Тема поста или описание контента…"
                    style={{ flex: 1, padding: "9px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "12px", outline: "none" }}
                    onFocus={e => (e.target.style.borderColor = "rgba(56,189,248,0.5)")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                  <select value={tone} onChange={e => setTone(e.target.value)} style={{ padding: "9px 10px", borderRadius: "8px", background: "#0d0e24", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "11px", outline: "none" }}>
                    {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => generateCaption("all")}
                    disabled={!topic.trim() || aiLoading !== null}
                    style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(56,189,248,0.3)", background: "rgba(56,189,248,0.1)", color: aiLoading !== null ? "rgba(56,189,248,0.4)" : "#38bdf8", fontSize: "11px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                  >
                    {aiLoading === "all" ? "⏳ Генерируем…" : "🧠 Для всех платформ"}
                  </button>
                  {[...selPlatforms].map(pid => {
                    const plat = PLATFORMS.find(p => p.id === pid)!;
                    return (
                      <button key={pid} onClick={() => generateCaption(pid)} disabled={!topic.trim() || aiLoading !== null} style={{ padding: "7px 12px", borderRadius: "8px", border: `1px solid ${plat.color}33`, background: plat.color + "10", color: aiLoading === pid ? plat.color + "66" : plat.color, fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                        {aiLoading === pid ? "⏳" : plat.icon} {plat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Caption editor */}
              {selPlatforms.size > 0 && (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {platConfig.icon} Подпись для {platConfig.label}
                    </div>
                    <button onClick={() => setCaptions(prev => { const next = { ...prev }; [...selPlatforms].forEach(p => { if (p !== activePlat) next[p] = prev[activePlat] ?? ""; }); return next; })} style={{ fontSize: "10px", color: "#38bdf8", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: "6px", padding: "3px 10px", cursor: "pointer", fontWeight: 600 }}>
                      Скопировать на все
                    </button>
                  </div>
                  <textarea
                    value={activeCaption}
                    onChange={e => setCaptions(prev => ({ ...prev, [activePlat]: e.target.value }))}
                    rows={8}
                    placeholder={`Введите текст для ${platConfig.label}…\n\nПример: 🚀 Новый способ автоматизировать контент-маркетинг...\n\n#контент #маркетинг #автоматизация`}
                    style={{ width: "100%", boxSizing: "border-box", padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)", fontSize: "13px", lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit" }}
                    onFocus={e => (e.target.style.borderColor = platConfig.color + "44")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                  <div style={{ marginTop: "8px" }}>
                    <CharBar current={activeCaption.length} limit={platConfig.limit} color={platConfig.color} />
                  </div>

                  {/* Filled status for all selected platforms */}
                  <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
                    {[...selPlatforms].map(pid => {
                      const plat = PLATFORMS.find(p => p.id === pid)!;
                      const filled = !!(captions[pid]?.trim());
                      return (
                        <div key={pid} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "20px", background: filled ? plat.color + "12" : "rgba(255,255,255,0.04)", border: `1px solid ${filled ? plat.color + "33" : "rgba(255,255,255,0.06)"}`, fontSize: "10px", color: filled ? plat.color : "rgba(255,255,255,0.25)" }}>
                          <span>{filled ? "✓" : "○"}</span> {plat.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Media */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Медиа (опционально)</div>
                <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
                  {(["video", "image"] as const).map(t => (
                    <button key={t} onClick={() => setMediaType(t)} style={{ padding: "6px 14px", borderRadius: "8px", border: `1px solid ${mediaType === t ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"}`, background: mediaType === t ? "rgba(255,255,255,0.06)" : "transparent", color: mediaType === t ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                      {t === "video" ? "🎬 Видео" : "🖼️ Фото"}
                    </button>
                  ))}
                </div>
                <input
                  value={mediaUrl}
                  onChange={e => setMediaUrl(e.target.value)}
                  placeholder={mediaType === "video" ? "URL видео (MP4, YouTube, /generated/clips/...)" : "URL изображения (JPEG, PNG)"}
                  style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "12px", outline: "none" }}
                />
                {mediaUrl && mediaType === "image" && (
                  <img src={mediaUrl} alt="" style={{ marginTop: "10px", maxHeight: "120px", borderRadius: "8px", objectFit: "cover", border: "1px solid rgba(255,255,255,0.08)" }} onError={e => (e.currentTarget.style.display = "none")} />
                )}
                {mediaUrl && mediaType === "video" && (
                  <div style={{ marginTop: "8px", padding: "8px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", fontSize: "11px", color: "#38bdf8" }}>
                    🎬 {mediaUrl.split("/").pop()?.slice(0, 50)}
                  </div>
                )}
              </div>
            </div>

            {/* Right: schedule panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              {/* Schedule */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "18px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>Расписание</div>

                <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderRadius: "8px", background: postNow ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${postNow ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)"}`, cursor: "pointer", marginBottom: "10px", transition: "all 0.15s" }}>
                  <input type="checkbox" checked={postNow} onChange={e => setPostNow(e.target.checked)} style={{ width: "14px", height: "14px", accentColor: "#22c55e" }} />
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: postNow ? "#86efac" : "rgba(255,255,255,0.6)" }}>Опубликовать сейчас</div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>Telegram отправится немедленно</div>
                  </div>
                </label>

                {!postNow && (
                  <div>
                    <label style={{ display: "block", fontSize: "10px", color: "rgba(255,255,255,0.35)", marginBottom: "6px" }}>Дата и время</label>
                    <input
                      type="datetime-local"
                      value={scheduleAt}
                      onChange={e => setScheduleAt(e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: "8px", background: "#0d0e24", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "12px", outline: "none" }}
                    />

                    {/* Quick schedule buttons */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "10px" }}>
                      {[
                        ["Через 1 час", 60], ["Через 3 часа", 180],
                        ["Завтра 9:00", null, "tomorrow_9"], ["В пятницу 18:00", null, "friday_18"],
                      ].map(([label, mins, key]) => (
                        <button
                          key={label as string}
                          onClick={() => {
                            if (mins) {
                              setScheduleAt(localNow(mins as number));
                            } else if (key === "tomorrow_9") {
                              const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0);
                              setScheduleAt(d.toISOString().slice(0, 16));
                            } else {
                              const d = new Date(); const day = d.getDay(); const diff = (5 - day + 7) % 7 || 7;
                              d.setDate(d.getDate() + diff); d.setHours(18, 0, 0, 0);
                              setScheduleAt(d.toISOString().slice(0, 16));
                            }
                          }}
                          style={{ padding: "6px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.4)", fontSize: "10px", cursor: "pointer", transition: "all 0.12s" }}
                          onMouseEnter={e => { (e.currentTarget.style.background = "rgba(56,189,248,0.08)"); (e.currentTarget.style.color = "#38bdf8"); }}
                          onMouseLeave={e => { (e.currentTarget.style.background = "rgba(255,255,255,0.02)"); (e.currentTarget.style.color = "rgba(255,255,255,0.4)"); }}
                        >
                          {label as string}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Preview card */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Предпросмотр</div>
                <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", minHeight: "80px" }}>
                  {platConfig && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: platConfig.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>{platConfig.icon}</div>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>AMAImedia</div>
                        <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>{platConfig.label}</div>
                      </div>
                    </div>
                  )}
                  {mediaUrl && mediaType === "image" && (
                    <img src={mediaUrl} alt="" style={{ width: "100%", borderRadius: "8px", marginBottom: "8px", maxHeight: "120px", objectFit: "cover" }} onError={e => (e.currentTarget.style.display = "none")} />
                  )}
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {activeCaption || <span style={{ color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>Введите текст…</span>}
                  </div>
                </div>
              </div>

              {/* Submit */}
              {submitMsg && (
                <div style={{ padding: "10px 14px", borderRadius: "10px", background: submitMsg.ok ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${submitMsg.ok ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, color: submitMsg.ok ? "#86efac" : "#fca5a5", fontSize: "12px" }}>
                  {submitMsg.text}
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={submitting || selPlatforms.size === 0}
                style={{
                  padding: "13px", borderRadius: "12px", border: "none", cursor: submitting || selPlatforms.size === 0 ? "not-allowed" : "pointer",
                  background: submitting || selPlatforms.size === 0 ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #0ea5e9, #38bdf8)",
                  color: submitting || selPlatforms.size === 0 ? "rgba(255,255,255,0.2)" : "#fff",
                  fontSize: "13px", fontWeight: 700,
                  boxShadow: submitting || selPlatforms.size === 0 ? "none" : "0 4px 20px rgba(56,189,248,0.3)",
                  transition: "all 0.2s",
                }}
              >
                {submitting ? "⏳ Добавляем в очередь…" : postNow ? `🚀 Опубликовать сейчас (${selPlatforms.size} платф.)` : `📅 Запланировать (${selPlatforms.size} платф.)`}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            TAB: QUEUE
        ════════════════════════════════════════════════════ */}
        {tab === "queue" && (
          <div>
            {/* Filters */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
              <select value={filterPlat} onChange={e => setFilterPlat(e.target.value)} style={{ padding: "7px 10px", borderRadius: "8px", background: "#0d0e24", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "11px", outline: "none" }}>
                <option value="all">Все платформы</option>
                {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}
              </select>
              <select value={filterStat} onChange={e => setFilterStat(e.target.value)} style={{ padding: "7px 10px", borderRadius: "8px", background: "#0d0e24", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "11px", outline: "none" }}>
                <option value="all">Все статусы</option>
                <option value="scheduled">В очереди</option>
                <option value="draft">Черновики</option>
              </select>
              <button onClick={loadPosts} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.5)", fontSize: "11px", cursor: "pointer" }}>↻ Обновить</button>
              <button onClick={() => setTab("compose")} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(56,189,248,0.3)", background: "rgba(56,189,248,0.08)", color: "#38bdf8", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>+ Создать пост</button>
            </div>

            {queuePosts.length === 0 ? (
              <div style={{ padding: "60px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", color: "rgba(255,255,255,0.2)" }}>
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>📭</div>
                <div>Очередь пуста</div>
                <button onClick={() => setTab("compose")} style={{ marginTop: "14px", padding: "8px 20px", borderRadius: "8px", border: "1px solid rgba(56,189,248,0.3)", background: "rgba(56,189,248,0.1)", color: "#38bdf8", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Создать первый пост</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {queuePosts.map(post => {
                  const plat = PLATFORMS.find(p => p.id === post.platform);
                  return (
                    <div key={post.id} style={{ display: "flex", gap: "14px", padding: "14px 18px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", alignItems: "flex-start" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: (plat?.color ?? "#888") + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>{plat?.icon ?? "📢"}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: plat?.color ?? "#fff" }}>{plat?.label ?? post.platform}</span>
                          <StatusBadge status={post.status} />
                          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>🕐 {fmtDate(post.scheduledAt)}</span>
                        </div>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", maxWidth: "600px" }}>
                          {post.text}
                        </div>
                        {(post.imageUrl || post.videoUrl) && (
                          <div style={{ marginTop: "4px", fontSize: "10px", color: "#38bdf8" }}>{post.videoUrl ? "🎬" : "🖼️"} {(post.videoUrl || post.imageUrl)?.split("/").pop()?.slice(0, 40)}</div>
                        )}
                        {pubMsg[post.id] && <div style={{ marginTop: "4px", fontSize: "11px", color: pubMsg[post.id].startsWith("✅") ? "#86efac" : "#fca5a5" }}>{pubMsg[post.id]}</div>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
                        <button onClick={() => publishNow(post)} disabled={publishing === post.id} style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)", color: publishing === post.id ? "rgba(34,197,94,0.4)" : "#86efac", fontSize: "11px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                          {publishing === post.id ? "⏳" : "▶ Сейчас"}
                        </button>
                        <button onClick={() => deletePost(post.id)} style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)", color: "#fca5a5", fontSize: "11px", cursor: "pointer" }}>
                          🗑 Удалить
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            TAB: PUBLISHED HISTORY
        ════════════════════════════════════════════════════ */}
        {tab === "published" && (
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <select value={filterPlat} onChange={e => setFilterPlat(e.target.value)} style={{ padding: "7px 10px", borderRadius: "8px", background: "#0d0e24", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "11px", outline: "none" }}>
                <option value="all">Все платформы</option>
                {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}
              </select>
              <button onClick={loadPosts} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.5)", fontSize: "11px", cursor: "pointer" }}>↻ Обновить</button>
            </div>

            {/* Stats by platform */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
              {PLATFORMS.map(plat => {
                const count = posts.filter(p => p.platform === plat.id && p.status === "published").length;
                if (!count) return null;
                return (
                  <div key={plat.id} style={{ padding: "6px 14px", borderRadius: "20px", background: plat.color + "10", border: `1px solid ${plat.color}30`, fontSize: "11px", fontWeight: 600, color: plat.color }}>
                    {plat.icon} {plat.label}: {count}
                  </div>
                );
              })}
            </div>

            {publishedPosts.length === 0 ? (
              <div style={{ padding: "60px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", color: "rgba(255,255,255,0.2)" }}>
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>📭</div>Историй публикаций нет
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {publishedPosts.sort((a, b) => (b.publishedAt ?? b.scheduledAt).localeCompare(a.publishedAt ?? a.scheduledAt)).map(post => {
                  const plat = PLATFORMS.find(p => p.id === post.platform);
                  return (
                    <div key={post.id} style={{ display: "flex", gap: "14px", padding: "12px 18px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", alignItems: "center", opacity: post.status === "failed" ? 0.7 : 1 }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: (plat?.color ?? "#888") + "12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>{plat?.icon ?? "📢"}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "3px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: plat?.color ?? "#fff" }}>{plat?.label}</span>
                          <StatusBadge status={post.status} />
                          {post.publishedAt && <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>✅ {fmtDate(post.publishedAt)}</span>}
                          {post.error && <span style={{ fontSize: "10px", color: "#fca5a5" }}>⚠️ {post.error}</span>}
                        </div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "500px" }}>{post.text}</div>
                      </div>
                      <button onClick={() => deletePost(post.id)} style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.15)", background: "transparent", color: "rgba(239,68,68,0.5)", fontSize: "10px", cursor: "pointer" }}>
                        🗑
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            TAB: INTEGRATIONS
        ════════════════════════════════════════════════════ */}
        {tab === "integrations" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", maxWidth: "800px" }}>
            {[
              {
                plat: PLATFORMS[0], status: "active",
                desc: "Реальная публикация через Bot API",
                env: "TELEGRAM_BOT_TOKEN + TELEGRAM_CHANNEL_ID",
                features: ["Текст", "Фото", "Видео", "HTML-форматирование"],
                setup: "Уже настроен ✅",
              },
              {
                plat: PLATFORMS[1], status: "manual",
                desc: "Требует Meta Business Suite + Graph API",
                env: "META_ACCESS_TOKEN",
                features: ["Фото", "Видео", "Reels", "Stories"],
                setup: "Через Meta Business Suite",
              },
              {
                plat: PLATFORMS[2], status: "manual",
                desc: "TikTok for Business API (OAuth required)",
                env: "TIKTOK_ACCESS_TOKEN",
                features: ["Видео до 10 мин", "Автохэштеги"],
                setup: "Ручная публикация",
              },
              {
                plat: PLATFORMS[3], status: "manual",
                desc: "YouTube Data API v3 (OAuth2)",
                env: "YOUTUBE_OAUTH_TOKEN",
                features: ["Shorts", "Длинные видео", "Описание", "Теги"],
                setup: "YouTube Studio",
              },
              {
                plat: PLATFORMS[4], status: "manual",
                desc: "VK API — возможна полная интеграция",
                env: "VK_ACCESS_TOKEN",
                features: ["Текст", "Фото", "Видео", "Ссылки"],
                setup: "Добавить VK_ACCESS_TOKEN",
              },
              {
                plat: PLATFORMS[5], status: "manual",
                desc: "Facebook Graph API (Page Token)",
                env: "FB_PAGE_ACCESS_TOKEN",
                features: ["Посты", "Видео", "Фото"],
                setup: "Facebook Business",
              },
              {
                plat: PLATFORMS[6], status: "manual",
                desc: "Meta Threads API (бета)",
                env: "THREADS_ACCESS_TOKEN",
                features: ["Текст до 500 симв.", "Фото"],
                setup: "Ручная публикация",
              },
              {
                plat: PLATFORMS[7], status: "manual",
                desc: "LinkedIn Marketing API",
                env: "LINKEDIN_ACCESS_TOKEN",
                features: ["Статьи", "Посты", "Видео"],
                setup: "LinkedIn Marketing Solutions",
              },
            ].map(({ plat, status, desc, env, features, setup }) => (
              <div key={plat.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${status === "active" ? plat.color + "30" : "rgba(255,255,255,0.07)"}`, borderRadius: "14px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: plat.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>{plat.icon}</div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{plat.label}</div>
                      <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>{plat.limit.toLocaleString()} симв. макс.</div>
                    </div>
                  </div>
                  <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, background: status === "active" ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)", color: status === "active" ? "#86efac" : "rgba(255,255,255,0.35)" }}>
                    {status === "active" ? "✅ Активен" : "⚙️ Ручной"}
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginBottom: "8px", lineHeight: 1.5 }}>{desc}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "10px" }}>
                  {features.map(f => (
                    <span key={f} style={{ padding: "2px 7px", borderRadius: "4px", background: plat.color + "0d", border: `1px solid ${plat.color}22`, fontSize: "9px", color: plat.color + "cc", fontWeight: 600 }}>{f}</span>
                  ))}
                </div>
                <div style={{ padding: "8px 10px", borderRadius: "8px", background: "rgba(0,0,0,0.3)", fontSize: "10px", fontFamily: "monospace", color: status === "active" ? "#86efac" : "rgba(255,255,255,0.35)" }}>
                  {status === "active" ? `# .env.local\n${env}=✅` : `# .env.local\n${env}=your_token`}
                </div>
                <div style={{ marginTop: "8px", fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>📌 {setup}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
