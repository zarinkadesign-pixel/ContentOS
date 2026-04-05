/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/clips/page.tsx
 */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import AdminLayout from "../_components/AdminLayout";

/* ── types ──────────────────────────────────────────────────────── */
interface Clip {
  id: string;
  title: string;
  start_time: number;
  end_time: number;
  duration: number;
  virality_score: number;
  download_url: string;
  thumbnail_url: string;
  transcript: string;
  hook: string;
}

interface Project {
  id: string;
  status: "processing" | "completed" | "failed" | "pending";
  progress?: number;
  clips?: Clip[];
  video_url?: string;
  created_at?: string;
}

interface SocialCopy {
  caption: string;
  hashtags: string[];
  hooks: string[];
}

type Tab = "create" | "projects" | "clips";

/* ── helpers ────────────────────────────────────────────────────── */
function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function ViralBadge({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";
  const bg    = score >= 80 ? "rgba(34,197,94,0.12)" : score >= 60 ? "rgba(234,179,8,0.12)" : "rgba(239,68,68,0.12)";
  const label = score >= 80 ? "Высокий" : score >= 60 ? "Средний" : "Низкий";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div style={{ flex: 1, height: "4px", borderRadius: "4px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: "4px", boxShadow: `0 0 6px ${color}` }} />
      </div>
      <span style={{ fontSize: "10px", fontWeight: 700, color, background: bg, padding: "2px 7px", borderRadius: "20px", whiteSpace: "nowrap" }}>
        🔥 {score} · {label}
      </span>
    </div>
  );
}

function StatusBadge({ status, progress }: { status: string; progress?: number }) {
  const map: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    completed:  { bg: "rgba(34,197,94,0.1)",  text: "#86efac", dot: "#22c55e", label: "Готово" },
    processing: { bg: "rgba(234,179,8,0.1)",  text: "#fde68a", dot: "#eab308", label: `Обработка${progress ? ` ${progress}%` : ""}` },
    pending:    { bg: "rgba(99,102,241,0.1)", text: "#a5b4fc", dot: "#6366f1", label: "В очереди" },
    failed:     { bg: "rgba(239,68,68,0.1)",  text: "#fca5a5", dot: "#ef4444", label: "Ошибка" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "20px", background: s.bg, color: s.text, fontSize: "10px", fontWeight: 600, whiteSpace: "nowrap" }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: s.dot, boxShadow: status === "processing" ? `0 0 6px ${s.dot}` : "none" }} />
      {s.label}
    </span>
  );
}

/* ── main component ─────────────────────────────────────────────── */
export default function ClipsPage() {
  const [tab, setTab]                   = useState<Tab>("create");
  const [projects, setProjects]         = useState<Project[]>([]);
  const [selectedProject, setSelected] = useState<Project | null>(null);
  const [selectedClip, setClip]         = useState<Clip | null>(null);
  const [socialCopy, setSocialCopy]     = useState<SocialCopy | null>(null);
  const [socialLoading, setSocialLoad]  = useState(false);

  /* create form */
  const [videoUrl, setVideoUrl]   = useState("");
  const [language, setLanguage]   = useState("ru");
  const [clipLen, setClipLen]     = useState("30-90");
  const [aspect, setAspect]       = useState("9:16");
  const [creating, setCreating]   = useState(false);
  const [createError, setCreateErr] = useState("");
  const [createSuccess, setCreateOk] = useState("");

  /* polling */
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const r = await fetch("/api/opus/projects");
      const d = await r.json();
      if (d.data) setProjects(d.data);
      else if (Array.isArray(d)) setProjects(d);
    } catch { /* ignore */ }
  }, []);

  const pollProject = useCallback(async (id: string) => {
    const r = await fetch(`/api/opus/project/${id}`);
    const d = await r.json();
    if (d.status === "completed" || d.status === "failed") {
      setSelected(d);
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...d } : p));
      if (pollRef.current) clearInterval(pollRef.current);
    } else {
      setSelected(d);
    }
  }, []);

  useEffect(() => { if (tab === "projects") fetchProjects(); }, [tab, fetchProjects]);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  async function handleCreate() {
    if (!videoUrl.trim()) return;
    setCreating(true);
    setCreateErr("");
    setCreateOk("");
    try {
      const r = await fetch("/api/opus/clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_url: videoUrl, language, clip_length: clipLen, aspect_ratio: aspect }),
      });
      const d = await r.json();
      if (!r.ok || d.detail) {
        setCreateErr(d.detail ?? "Ошибка создания проекта");
      } else {
        setCreateOk(`Проект создан: ${d.id ?? ""}. Переходите во вкладку Проекты для отслеживания.`);
        setVideoUrl("");
        fetchProjects();
      }
    } catch (e: any) {
      setCreateErr(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function openProject(p: Project) {
    setSelected(p);
    setClip(null);
    setSocialCopy(null);
    setTab("clips");
    if (p.status === "processing" || p.status === "pending") {
      pollRef.current = setInterval(() => pollProject(p.id), 4000);
    } else if (p.status === "completed" && !p.clips) {
      await pollProject(p.id);
    }
  }

  async function fetchSocialCopy(clipId: string) {
    setSocialLoad(true);
    setSocialCopy(null);
    try {
      const r = await fetch("/api/opus/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clip_id: clipId }),
      });
      const d = await r.json();
      if (!d.detail) setSocialCopy(d);
    } finally {
      setSocialLoad(false);
    }
  }

  /* ── render ──────────────────────────────────────────────────── */
  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ padding: "28px 32px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#a855f7", marginBottom: "6px" }}>
              Opus Clip · AI Reels Generator
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
              Clips Studio
            </h1>
          </div>
          <a
            href="https://clip.opus.pro"
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, textDecoration: "none", background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(139,92,246,0.1))", border: "1px solid rgba(168,85,247,0.3)", color: "#c084fc" }}
          >
            Открыть Opus ↗
          </a>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px" }}>
          {([
            ["create",   "✨ Создать клипы"],
            ["projects", "📁 Проекты"],
            ["clips",    `🎬 Клипы${selectedProject?.clips ? ` (${selectedProject.clips.length})` : ""}`],
          ] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "8px 16px", borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600,
                background: tab === t ? "rgba(168,85,247,0.15)" : "transparent",
                color: tab === t ? "#c084fc" : "rgba(255,255,255,0.4)",
                borderBottom: tab === t ? "2px solid #a855f7" : "2px solid transparent",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 32px 32px" }}>

        {/* ── CREATE TAB ─────────────────────────────────────── */}
        {tab === "create" && (
          <div style={{ maxWidth: "640px" }}>
            {/* How it works */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "24px" }}>
              {[
                { icon: "🔗", title: "1. Вставь ссылку", desc: "YouTube, Loom, MP4 — любой формат" },
                { icon: "🤖", title: "2. AI нарезает", desc: "Авто-субтитры, хуки, оценка виральности" },
                { icon: "📱", title: "3. Скачай Reels", desc: "9:16 готово для TikTok, Reels, Shorts" },
              ].map(s => (
                <div key={s.icon} style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)", borderRadius: "12px", padding: "14px 16px" }}>
                  <div style={{ fontSize: "20px", marginBottom: "6px" }}>{s.icon}</div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#c084fc", marginBottom: "3px" }}>{s.title}</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{s.desc}</div>
                </div>
              ))}
            </div>

            {/* Form */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "24px" }}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: "8px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Ссылка на видео
                </label>
                <input
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... или прямая ссылка на MP4"
                  style={{
                    width: "100%", boxSizing: "border-box", padding: "12px 16px", borderRadius: "10px",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff", fontSize: "13px", outline: "none",
                    transition: "border 0.15s",
                  }}
                  onFocus={e => (e.target.style.borderColor = "rgba(168,85,247,0.5)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "24px" }}>
                {/* Language */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: "8px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Язык</label>
                  <select value={language} onChange={e => setLanguage(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", background: "#0d0e24", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "12px", outline: "none", cursor: "pointer" }}>
                    <option value="ru">🇷🇺 Русский</option>
                    <option value="en">🇺🇸 English</option>
                    <option value="kz">🇰🇿 Казахский</option>
                    <option value="de">🇩🇪 Deutsch</option>
                    <option value="es">🇪🇸 Español</option>
                    <option value="pt">🇧🇷 Português</option>
                    <option value="fr">🇫🇷 Français</option>
                    <option value="zh">🇨🇳 中文</option>
                  </select>
                </div>

                {/* Clip length */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: "8px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Длина клипа</label>
                  <select value={clipLen} onChange={e => setClipLen(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", background: "#0d0e24", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "12px", outline: "none", cursor: "pointer" }}>
                    <option value="0-30">До 30 сек (Shorts)</option>
                    <option value="30-90">30–90 сек (Reels)</option>
                    <option value="90-180">1.5–3 мин (LinkedIn)</option>
                  </select>
                </div>

                {/* Aspect ratio */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: "8px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Формат</label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {(["9:16", "1:1", "16:9"] as const).map(r => (
                      <button
                        key={r}
                        onClick={() => setAspect(r)}
                        style={{
                          flex: 1, padding: "10px 4px", borderRadius: "8px", border: `1px solid ${aspect === r ? "rgba(168,85,247,0.5)" : "rgba(255,255,255,0.1)"}`,
                          background: aspect === r ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.03)",
                          color: aspect === r ? "#c084fc" : "rgba(255,255,255,0.4)", fontSize: "10px", fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Auto-features */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
                {[["✅ Субтитры", "#22c55e"], ["✅ Эмодзи", "#eab308"], ["✅ Virality Score", "#a855f7"], ["✅ AI Хук", "#3b82f6"]].map(([label, color]) => (
                  <div key={label} style={{ padding: "4px 12px", borderRadius: "20px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: "11px", fontWeight: 600, color: color as string }}>
                    {label}
                  </div>
                ))}
              </div>

              {createError && (
                <div style={{ marginBottom: "14px", padding: "10px 14px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: "12px" }}>
                  ⚠️ {createError}
                </div>
              )}
              {createSuccess && (
                <div style={{ marginBottom: "14px", padding: "10px 14px", borderRadius: "8px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#86efac", fontSize: "12px" }}>
                  ✅ {createSuccess}
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={creating || !videoUrl.trim()}
                style={{
                  width: "100%", padding: "13px", borderRadius: "10px", border: "none", cursor: creating || !videoUrl.trim() ? "not-allowed" : "pointer",
                  background: creating || !videoUrl.trim() ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #a855f7, #7c3aed)",
                  color: creating || !videoUrl.trim() ? "rgba(255,255,255,0.3)" : "#fff",
                  fontSize: "14px", fontWeight: 700, letterSpacing: "0.02em",
                  boxShadow: creating || !videoUrl.trim() ? "none" : "0 4px 20px rgba(168,85,247,0.35)",
                  transition: "all 0.2s",
                }}
              >
                {creating ? "⏳ Создаём проект…" : "✨ Нарезать клипы с AI"}
              </button>
            </div>
          </div>
        )}

        {/* ── PROJECTS TAB ───────────────────────────────────── */}
        {tab === "projects" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>{projects.length} проект(ов)</span>
              <button
                onClick={fetchProjects}
                style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", fontSize: "11px", cursor: "pointer" }}
              >
                ↻ Обновить
              </button>
            </div>

            {projects.length === 0 ? (
              <div style={{ padding: "60px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", color: "rgba(255,255,255,0.2)", fontSize: "13px" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎬</div>
                <div>Проектов пока нет. Создайте первый во вкладке «Создать клипы».</div>
                <div style={{ marginTop: "6px", fontSize: "11px", color: "rgba(255,255,255,0.15)" }}>Убедитесь, что OPUS_KEY добавлен в .env.local</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {projects.map(p => (
                  <div
                    key={p.id}
                    onClick={() => openProject(p)}
                    style={{
                      display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px",
                      background: selectedProject?.id === p.id ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${selectedProject?.id === p.id ? "rgba(168,85,247,0.25)" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: "12px", cursor: "pointer", transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { if (selectedProject?.id !== p.id) (e.currentTarget.style.background = "rgba(255,255,255,0.03)"); }}
                    onMouseLeave={e => { if (selectedProject?.id !== p.id) (e.currentTarget.style.background = "rgba(255,255,255,0.02)"); }}
                  >
                    <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(168,85,247,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                      🎬
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.7)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.video_url ?? p.id}
                      </div>
                      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>
                        ID: {p.id} {p.created_at ? `· ${new Date(p.created_at).toLocaleDateString("ru-RU")}` : ""}
                      </div>
                    </div>
                    <StatusBadge status={p.status} progress={p.progress} />
                    {p.clips && (
                      <div style={{ fontSize: "11px", color: "#a5b4fc", fontWeight: 600 }}>
                        {p.clips.length} клипов
                      </div>
                    )}
                    <div style={{ color: "rgba(255,255,255,0.2)", fontSize: "16px" }}>›</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CLIPS TAB ──────────────────────────────────────── */}
        {tab === "clips" && (
          <div>
            {!selectedProject ? (
              <div style={{ padding: "60px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", color: "rgba(255,255,255,0.2)", fontSize: "13px" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>👈</div>
                Откройте проект из вкладки «Проекты» чтобы увидеть клипы
              </div>
            ) : selectedProject.status === "processing" || selectedProject.status === "pending" ? (
              <div style={{ padding: "60px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>⚙️</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: "8px" }}>AI нарезает видео…</div>
                {selectedProject.progress != null && (
                  <div style={{ maxWidth: "300px", margin: "0 auto" }}>
                    <div style={{ height: "6px", borderRadius: "6px", background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                      <div style={{ width: `${selectedProject.progress}%`, height: "100%", background: "linear-gradient(90deg, #a855f7, #7c3aed)", borderRadius: "6px", transition: "width 0.5s" }} />
                    </div>
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "#c084fc", fontWeight: 700 }}>{selectedProject.progress}%</div>
                  </div>
                )}
                <div style={{ marginTop: "12px", fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>Страница обновляется автоматически каждые 4 сек</div>
              </div>
            ) : selectedProject.status === "failed" ? (
              <div style={{ padding: "40px", textAlign: "center", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "16px", color: "#fca5a5" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>❌</div>
                Проект завершился с ошибкой. Попробуйте другую ссылку.
              </div>
            ) : !selectedProject.clips || selectedProject.clips.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: "13px" }}>Клипы не найдены в этом проекте</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "20px" }}>
                {/* Clip list */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", marginBottom: "4px" }}>
                    {selectedProject.clips.length} клипов · отсортированы по виральности
                  </div>
                  {[...selectedProject.clips]
                    .sort((a, b) => b.virality_score - a.virality_score)
                    .map((clip, i) => (
                    <div
                      key={clip.id}
                      onClick={() => { setClip(clip); setSocialCopy(null); }}
                      style={{
                        display: "flex", gap: "14px", padding: "14px 16px",
                        background: selectedClip?.id === clip.id ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${selectedClip?.id === clip.id ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.06)"}`,
                        borderRadius: "12px", cursor: "pointer", transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { if (selectedClip?.id !== clip.id) (e.currentTarget.style.background = "rgba(255,255,255,0.03)"); }}
                      onMouseLeave={e => { if (selectedClip?.id !== clip.id) (e.currentTarget.style.background = "rgba(255,255,255,0.02)"); }}
                    >
                      {/* Thumbnail */}
                      {clip.thumbnail_url ? (
                        <img src={clip.thumbnail_url} alt={clip.title} style={{ width: "72px", height: "128px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: "72px", height: "128px", borderRadius: "8px", background: "rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>
                          🎬
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                          <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: i < 3 ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 800, color: i < 3 ? "#c084fc" : "rgba(255,255,255,0.3)", flexShrink: 0 }}>
                            #{i + 1}
                          </span>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {clip.title || `Клип ${i + 1}`}
                          </span>
                        </div>
                        <ViralBadge score={clip.virality_score} />
                        {clip.hook && (
                          <div style={{ marginTop: "8px", fontSize: "11px", color: "rgba(255,255,255,0.45)", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                            💡 {clip.hook}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: "10px", marginTop: "8px", alignItems: "center" }}>
                          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
                            {fmtTime(clip.start_time)} – {fmtTime(clip.end_time)} · {clip.duration}с
                          </span>
                          {clip.download_url && (
                            <a
                              href={clip.download_url}
                              download
                              onClick={e => e.stopPropagation()}
                              style={{ fontSize: "10px", fontWeight: 600, color: "#a855f7", textDecoration: "none", padding: "2px 8px", borderRadius: "6px", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}
                            >
                              ↓ Скачать
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Clip detail panel */}
                <div>
                  {!selectedClip ? (
                    <div style={{ padding: "40px 20px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", color: "rgba(255,255,255,0.2)", fontSize: "12px" }}>
                      Выберите клип для просмотра деталей и генерации текста
                    </div>
                  ) : (
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "18px", position: "sticky", top: "20px" }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: "14px" }}>
                        {selectedClip.title || "Клип"}
                      </div>

                      {selectedClip.thumbnail_url && (
                        <img src={selectedClip.thumbnail_url} alt="" style={{ width: "100%", aspectRatio: "9/16", objectFit: "cover", borderRadius: "10px", marginBottom: "14px" }} />
                      )}

                      <ViralBadge score={selectedClip.virality_score} />

                      <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <div style={{ padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.04)", fontSize: "10px", color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
                          ⏱ {fmtTime(selectedClip.start_time)}–{fmtTime(selectedClip.end_time)}
                        </div>
                        <div style={{ padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.04)", fontSize: "10px", color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
                          {selectedClip.duration}с
                        </div>
                      </div>

                      {selectedClip.hook && (
                        <div style={{ marginTop: "12px", padding: "10px 12px", borderRadius: "10px", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)" }}>
                          <div style={{ fontSize: "9px", fontWeight: 700, color: "#c084fc", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>AI Хук</div>
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{selectedClip.hook}</div>
                        </div>
                      )}

                      {selectedClip.transcript && (
                        <div style={{ marginTop: "12px" }}>
                          <div style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>Транскрипт</div>
                          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", lineHeight: 1.6, maxHeight: "80px", overflow: "hidden" }}>
                            {selectedClip.transcript}
                          </div>
                        </div>
                      )}

                      {/* Social copy */}
                      <button
                        onClick={() => fetchSocialCopy(selectedClip.id)}
                        disabled={socialLoading}
                        style={{
                          width: "100%", marginTop: "14px", padding: "10px", borderRadius: "10px", border: "none", cursor: socialLoading ? "not-allowed" : "pointer",
                          background: socialLoading ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(139,92,246,0.15))",
                          border: "1px solid rgba(168,85,247,0.3)", color: socialLoading ? "rgba(255,255,255,0.3)" : "#c084fc",
                          fontSize: "12px", fontWeight: 600, transition: "all 0.15s",
                        }}
                      >
                        {socialLoading ? "⏳ Генерируем…" : "📝 Сгенерировать пост + хэштеги"}
                      </button>

                      {socialCopy && (
                        <div style={{ marginTop: "12px" }}>
                          <div style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Готовый пост</div>
                          <textarea
                            readOnly
                            value={socialCopy.caption}
                            rows={4}
                            style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontSize: "11px", lineHeight: 1.6, resize: "none", outline: "none" }}
                          />
                          {socialCopy.hashtags?.length > 0 && (
                            <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                              {socialCopy.hashtags.map(h => (
                                <span key={h} style={{ padding: "2px 8px", borderRadius: "20px", background: "rgba(168,85,247,0.1)", color: "#c084fc", fontSize: "10px", fontWeight: 600 }}>
                                  #{h.replace(/^#/, "")}
                                </span>
                              ))}
                            </div>
                          )}
                          <button
                            onClick={() => navigator.clipboard.writeText(socialCopy.caption + "\n\n" + socialCopy.hashtags.join(" "))}
                            style={{ width: "100%", marginTop: "8px", padding: "7px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", fontSize: "11px", cursor: "pointer" }}
                          >
                            📋 Копировать всё
                          </button>
                        </div>
                      )}

                      {selectedClip.download_url && (
                        <a
                          href={selectedClip.download_url}
                          download
                          style={{ display: "block", width: "100%", boxSizing: "border-box", marginTop: "10px", padding: "10px", borderRadius: "10px", textAlign: "center", textDecoration: "none", background: "linear-gradient(135deg, #a855f7, #7c3aed)", color: "#fff", fontSize: "12px", fontWeight: 700, boxShadow: "0 4px 16px rgba(168,85,247,0.3)" }}
                        >
                          ↓ Скачать клип
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
