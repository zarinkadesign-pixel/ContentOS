/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/clips/page.tsx
 *
 * OWN AI clip engine — no Opus API, powered by Groq Whisper + LLaMA + ffmpeg.
 */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import AdminLayout from "../_components/AdminLayout";
import type { ClipJob, OwnClip } from "@/lib/clip-store";

/* ── helpers ─────────────────────────────────────────────────────── */
function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

function ViralBar({ score }: { score: number }) {
  const c = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";
  const label = score >= 80 ? "Высокий" : score >= 60 ? "Средний" : "Низкий";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ flex: 1, height: "4px", borderRadius: "4px", background: "rgba(255,255,255,0.07)" }}>
        <div style={{ width: `${score}%`, height: "100%", borderRadius: "4px", background: c, boxShadow: `0 0 6px ${c}88`, transition: "width 0.4s" }} />
      </div>
      <span style={{ fontSize: "10px", fontWeight: 700, color: c, whiteSpace: "nowrap" }}>🔥 {score} · {label}</span>
    </div>
  );
}

function StatusPill({ status, progress }: { status: string; progress: number }) {
  const map: Record<string, [string, string, string]> = {
    pending:      ["rgba(99,102,241,0.12)",  "#a5b4fc", "#6366f1"],
    downloading:  ["rgba(59,130,246,0.12)",  "#93c5fd", "#3b82f6"],
    transcribing: ["rgba(234,179,8,0.12)",   "#fde68a", "#eab308"],
    analyzing:    ["rgba(168,85,247,0.12)",  "#c084fc", "#a855f7"],
    cutting:      ["rgba(249,115,22,0.12)",  "#fdba74", "#f97316"],
    completed:    ["rgba(34,197,94,0.12)",   "#86efac", "#22c55e"],
    failed:       ["rgba(239,68,68,0.12)",   "#fca5a5", "#ef4444"],
  };
  const [bg, text, dot] = map[status] ?? map.pending;
  const label = {
    pending: "В очереди", downloading: `Загружаем ${progress}%`, transcribing: "Транскрибируем",
    analyzing: "AI анализ", cutting: `Нарезаем ${progress}%`, completed: "Готово", failed: "Ошибка",
  }[status] ?? status;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "20px", background: bg, color: text, fontSize: "10px", fontWeight: 600 }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: dot, boxShadow: status !== "completed" && status !== "failed" ? `0 0 5px ${dot}` : "none" }} />
      {label}
    </span>
  );
}

type Tab = "create" | "jobs" | "clips" | "setup";

interface Tools { ffmpeg: boolean; ytdlp: boolean; groq: boolean; mode: string; }

/* ── component ───────────────────────────────────────────────────── */
export default function ClipsPage() {
  const [tab, setTab]               = useState<Tab>("create");
  const [tools, setTools]           = useState<Tools | null>(null);
  const [jobs, setJobs]             = useState<ClipJob[]>([]);
  const [activeJob, setActiveJob]   = useState<ClipJob | null>(null);
  const [activeClip, setActiveClip] = useState<OwnClip | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  /* form */
  const [videoUrl, setUrl]   = useState("");
  const [language, setLang]  = useState("ru");
  const [clipLen, setLen]    = useState("30-90");
  const [aspect, setAspect]  = useState("9:16");
  const [creating, setCreate] = useState(false);
  const [createErr, setErr]   = useState("");
  const [createOk, setOk]     = useState("");

  /* tool check on mount */
  useEffect(() => {
    fetch("/api/studio/clip-ai/tools")
      .then(r => r.json())
      .then(setTools)
      .catch(() => setTools({ ffmpeg: false, ytdlp: false, groq: false, mode: "unknown" }));
  }, []);

  const loadJobs = useCallback(async () => {
    const r = await fetch("/api/studio/clip-ai");
    const d = await r.json();
    setJobs(d.jobs ?? []);
  }, []);

  const pollJob = useCallback(async (id: string) => {
    const r = await fetch(`/api/studio/clip-ai/${id}`);
    const d: ClipJob = await r.json();
    setActiveJob(d);
    setJobs(prev => prev.map(j => j.id === id ? d : j));
    if (d.status === "completed" || d.status === "failed") {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }
  }, []);

  useEffect(() => { if (tab === "jobs") loadJobs(); }, [tab, loadJobs]);
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function handleCreate() {
    setErr(""); setOk("");
    if (!videoUrl.trim()) { setErr("Вставьте ссылку на видео"); return; }
    setCreate(true);
    try {
      const r = await fetch("/api/studio/clip-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_url: videoUrl, language, clip_length: clipLen, aspect_ratio: aspect }),
      });
      const d = await r.json();
      if (d.error) { setErr(d.error); return; }
      setOk(`Задача ${d.id} запущена — переходите во вкладку Задачи`);
      setUrl("");
      loadJobs();
      // auto-switch to jobs tab and start polling
      setTab("jobs");
      setActiveJob({ id: d.id, status: "pending", progress: 0, video_url: videoUrl, language, clip_length: clipLen, aspect_ratio: aspect, mode: "analysis_only", created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      pollRef.current = setInterval(() => pollJob(d.id), 3000);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setCreate(false);
    }
  }

  function openJob(job: ClipJob) {
    setActiveJob(job);
    setActiveClip(null);
    setTab("clips");
    if (job.status !== "completed" && job.status !== "failed") {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => pollJob(job.id), 3000);
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
              AI Clips Engine · Groq Whisper + LLaMA
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
              Clips Studio
            </h1>
          </div>
          {/* mode badge */}
          {tools && (
            <div style={{
              padding: "6px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
              background: tools.mode === "full" ? "rgba(34,197,94,0.1)" : "rgba(234,179,8,0.1)",
              border: `1px solid ${tools.mode === "full" ? "rgba(34,197,94,0.25)" : "rgba(234,179,8,0.25)"}`,
              color: tools.mode === "full" ? "#86efac" : "#fde68a",
              display: "flex", alignItems: "center", gap: "7px",
            }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: tools.mode === "full" ? "#22c55e" : "#eab308", boxShadow: `0 0 6px ${tools.mode === "full" ? "#22c55e" : "#eab308"}` }} />
              {tools.mode === "full" ? "Полный режим (нарезка + скачивание)" : "Режим анализа (нет ffmpeg/yt-dlp)"}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "4px" }}>
          {([
            ["create", "✨ Создать"],
            ["jobs",   "📋 Задачи"],
            ["clips",  `🎬 Клипы${activeJob?.clips ? ` (${activeJob.clips.length})` : ""}`],
            ["setup",  "⚙️ Установка"],
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

        {/* ── CREATE ──────────────────────────────────────────── */}
        {tab === "create" && (
          <div style={{ maxWidth: "660px" }}>
            {/* Status strip */}
            {tools && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "20px" }}>
                {[
                  { label: "Groq Whisper", ok: tools.groq, note: "Транскрипция" },
                  { label: "yt-dlp", ok: tools.ytdlp, note: "Скачивание YouTube" },
                  { label: "ffmpeg", ok: tools.ffmpeg, note: "Нарезка видео" },
                ].map(s => (
                  <div key={s.label} style={{ padding: "10px 14px", borderRadius: "10px", background: s.ok ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)", border: `1px solid ${s.ok ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.15)"}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                      <span style={{ fontSize: "11px" }}>{s.ok ? "✅" : "❌"}</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: s.ok ? "#86efac" : "#fca5a5" }}>{s.label}</span>
                    </div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>{s.note}</div>
                  </div>
                ))}
              </div>
            )}

            {!tools?.ffmpeg && (
              <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "10px", background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)", fontSize: "12px", color: "#fde68a" }}>
                ⚠️ <b>Режим анализа:</b> без ffmpeg/yt-dlp получите транскрипт + вирусные моменты с таймстемпами, но без видеофайлов. Установите инструменты → вкладка ⚙️ Установка.
              </div>
            )}

            {/* Form card */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "24px" }}>
              {/* URL */}
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                  Ссылка на видео
                </label>
                <input
                  value={videoUrl}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreate()}
                  placeholder="https://youtube.com/watch?v=... или прямая MP4-ссылка"
                  style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "13px", outline: "none" }}
                  onFocus={e => (e.target.style.borderColor = "rgba(168,85,247,0.5)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
                {/* Language */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Язык видео</label>
                  <select value={language} onChange={e => setLang(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", background: "#0d0e24", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "12px", outline: "none" }}>
                    <option value="ru">🇷🇺 Русский</option>
                    <option value="en">🇺🇸 English</option>
                    <option value="kz">🇰🇿 Қазақ</option>
                    <option value="de">🇩🇪 Deutsch</option>
                    <option value="es">🇪🇸 Español</option>
                    <option value="pt">🇧🇷 Português</option>
                    <option value="fr">🇫🇷 Français</option>
                    <option value="zh">🇨🇳 中文</option>
                  </select>
                </div>

                {/* Clip length */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Длина клипа</label>
                  <select value={clipLen} onChange={e => setLen(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", background: "#0d0e24", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "12px", outline: "none" }}>
                    <option value="0-30">До 30 сек — TikTok / Shorts</option>
                    <option value="30-90">30–90 сек — Instagram Reels</option>
                    <option value="90-180">1.5–3 мин — LinkedIn / YouTube</option>
                  </select>
                </div>
              </div>

              {/* Aspect ratio */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Формат</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {(["9:16", "1:1", "16:9"] as const).map(r => (
                    <button key={r} onClick={() => setAspect(r)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: `1px solid ${aspect === r ? "rgba(168,85,247,0.5)" : "rgba(255,255,255,0.08)"}`, background: aspect === r ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.02)", color: aspect === r ? "#c084fc" : "rgba(255,255,255,0.35)", fontSize: "13px", fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}>
                      {r}<div style={{ fontSize: "9px", fontWeight: 400, marginTop: "3px", color: "rgba(255,255,255,0.3)" }}>{r === "9:16" ? "Reels/TikTok" : r === "1:1" ? "Feed" : "YouTube"}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* What AI does */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
                {[["🎙️ Groq Whisper", "транскрипция"], ["🧠 LLaMA 3.3 70B", "анализ вирусности"], ["✂️ ffmpeg", "нарезка"], ["📱 9:16 resize", "вертикальный формат"]].map(([icon, desc]) => (
                  <div key={desc} style={{ padding: "4px 10px", borderRadius: "20px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>
                    {icon} <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span> {desc}
                  </div>
                ))}
              </div>

              {createErr && <div style={{ marginBottom: "12px", padding: "10px 14px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: "12px" }}>⚠️ {createErr}</div>}
              {createOk  && <div style={{ marginBottom: "12px", padding: "10px 14px", borderRadius: "8px", background: "rgba(34,197,94,0.08)",  border: "1px solid rgba(34,197,94,0.2)",  color: "#86efac",  fontSize: "12px" }}>✅ {createOk}</div>}

              <button
                onClick={handleCreate}
                disabled={creating || !videoUrl.trim()}
                style={{
                  width: "100%", padding: "13px", borderRadius: "10px", border: "none",
                  background: creating || !videoUrl.trim() ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg, #a855f7, #7c3aed)",
                  color: creating || !videoUrl.trim() ? "rgba(255,255,255,0.25)" : "#fff",
                  fontSize: "14px", fontWeight: 700, cursor: creating || !videoUrl.trim() ? "not-allowed" : "pointer",
                  boxShadow: creating || !videoUrl.trim() ? "none" : "0 4px 20px rgba(168,85,247,0.35)",
                  transition: "all 0.2s",
                }}
              >
                {creating ? "⏳ Запускаем пайплайн…" : "🚀 Запустить AI нарезку"}
              </button>
            </div>
          </div>
        )}

        {/* ── JOBS ──────────────────────────────────────────── */}
        {tab === "jobs" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>{jobs.length} задач(и)</span>
              <button onClick={loadJobs} style={{ padding: "5px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", fontSize: "11px", cursor: "pointer" }}>↻ Обновить</button>
            </div>
            {jobs.length === 0 ? (
              <div style={{ padding: "60px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", color: "rgba(255,255,255,0.2)", fontSize: "13px" }}>
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>🎬</div>
                Задач нет — создайте первую во вкладке Создать
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {jobs.map(j => (
                  <div key={j.id} onClick={() => openJob(j)} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px", background: activeJob?.id === j.id ? "rgba(168,85,247,0.07)" : "rgba(255,255,255,0.02)", border: `1px solid ${activeJob?.id === j.id ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: "12px", cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={e => { if (activeJob?.id !== j.id) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }} onMouseLeave={e => { if (activeJob?.id !== j.id) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>✂️</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.video_url}</div>
                      <div style={{ display: "flex", gap: "8px", marginTop: "3px", fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
                        <span>{j.clip_length}с · {j.aspect_ratio} · {j.language}</span>
                        <span>·</span>
                        <span>{j.mode === "full" ? "Полный" : "Анализ"}</span>
                        <span>·</span>
                        <span>{new Date(j.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                    {j.status !== "completed" && j.status !== "failed" && (
                      <div style={{ width: "80px", height: "4px", borderRadius: "4px", background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                        <div style={{ width: `${j.progress}%`, height: "100%", background: "#a855f7", transition: "width 0.5s" }} />
                      </div>
                    )}
                    <StatusPill status={j.status} progress={j.progress} />
                    {j.clips && <span style={{ fontSize: "11px", color: "#a5b4fc", fontWeight: 600 }}>{j.clips.length} клипов</span>}
                    <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CLIPS ─────────────────────────────────────────── */}
        {tab === "clips" && (
          <div>
            {!activeJob ? (
              <div style={{ padding: "60px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", color: "rgba(255,255,255,0.2)", fontSize: "13px" }}>
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>👈</div>
                Откройте задачу из вкладки Задачи
              </div>
            ) : (activeJob.status !== "completed" && activeJob.status !== "failed") ? (
              <div style={{ padding: "60px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>⚙️</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: "16px" }}>
                  {{
                    pending: "В очереди на обработку…",
                    downloading: "Скачиваем видео…",
                    transcribing: "Groq Whisper транскрибирует речь…",
                    analyzing: "LLaMA 3.3 ищет вирусные моменты…",
                    cutting: "ffmpeg нарезает клипы…",
                  }[activeJob.status] ?? "Обрабатываем…"}
                </div>
                <div style={{ maxWidth: "320px", margin: "0 auto" }}>
                  <div style={{ height: "6px", borderRadius: "6px", background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                    <div style={{ width: `${activeJob.progress}%`, height: "100%", background: "linear-gradient(90deg, #a855f7, #7c3aed)", borderRadius: "6px", transition: "width 0.5s" }} />
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "#c084fc", fontWeight: 700 }}>{activeJob.progress}%</div>
                </div>
                <div style={{ marginTop: "12px", fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>Обновляется каждые 3 сек</div>
              </div>
            ) : activeJob.status === "failed" ? (
              <div style={{ padding: "40px", textAlign: "center", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "16px" }}>
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>❌</div>
                <div style={{ fontSize: "14px", color: "#fca5a5", fontWeight: 600 }}>Ошибка обработки</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "8px" }}>{activeJob.error}</div>
              </div>
            ) : !activeJob.clips?.length ? (
              <div style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: "13px" }}>Клипы не найдены</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "20px" }}>
                {/* List */}
                <div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", marginBottom: "12px", display: "flex", justifyContent: "space-between" }}>
                    <span>{activeJob.clips.length} клипов · по виральности</span>
                    <span style={{ color: activeJob.mode === "full" ? "#86efac" : "#fde68a", fontWeight: 600 }}>
                      {activeJob.mode === "full" ? "✅ Видеофайлы готовы" : "📊 Только анализ (нет ffmpeg)"}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {[...activeJob.clips].sort((a, b) => b.virality_score - a.virality_score).map((clip, i) => (
                      <div key={clip.id} onClick={() => setActiveClip(clip)} style={{ display: "flex", gap: "12px", padding: "14px 16px", background: activeClip?.id === clip.id ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.02)", border: `1px solid ${activeClip?.id === clip.id ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius: "12px", cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={e => { if (activeClip?.id !== clip.id) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }} onMouseLeave={e => { if (activeClip?.id !== clip.id) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}>
                        {clip.thumbnail_url ? (
                          <img src={clip.thumbnail_url} style={{ width: "54px", height: "96px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }} alt="" />
                        ) : (
                          <div style={{ width: "54px", height: "96px", borderRadius: "6px", background: "rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>✂️</div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
                            <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: i < 3 ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 800, color: i < 3 ? "#c084fc" : "rgba(255,255,255,0.3)", flexShrink: 0 }}>#{i + 1}</span>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clip.title}</span>
                          </div>
                          <ViralBar score={clip.virality_score} />
                          {clip.hook && <div style={{ marginTop: "6px", fontSize: "11px", color: "rgba(255,255,255,0.4)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>💡 {clip.hook}</div>}
                          <div style={{ display: "flex", gap: "8px", marginTop: "7px", alignItems: "center" }}>
                            <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>{fmtTime(clip.start_time)}–{fmtTime(clip.end_time)} · {clip.duration}с</span>
                            {clip.download_url && <a href={clip.download_url} download onClick={e => e.stopPropagation()} style={{ fontSize: "10px", fontWeight: 600, color: "#a855f7", textDecoration: "none", padding: "2px 8px", borderRadius: "6px", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}>↓ MP4</a>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detail panel */}
                <div>
                  {!activeClip ? (
                    <div style={{ padding: "40px 20px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", color: "rgba(255,255,255,0.2)", fontSize: "12px" }}>
                      Выберите клип
                    </div>
                  ) : (
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "18px", position: "sticky", top: "20px" }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: "12px" }}>{activeClip.title}</div>
                      {activeClip.thumbnail_url ? (
                        <img src={activeClip.thumbnail_url} style={{ width: "100%", aspectRatio: "9/16", objectFit: "cover", borderRadius: "10px", marginBottom: "12px" }} alt="" />
                      ) : (
                        <div style={{ width: "100%", aspectRatio: "9/16", background: "rgba(168,85,247,0.08)", borderRadius: "10px", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px", border: "1px solid rgba(168,85,247,0.15)" }}>✂️</div>
                      )}
                      <ViralBar score={activeClip.virality_score} />
                      <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
                        <div style={{ padding: "3px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.04)", fontSize: "10px", color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>⏱ {fmtTime(activeClip.start_time)}–{fmtTime(activeClip.end_time)}</div>
                        <div style={{ padding: "3px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.04)", fontSize: "10px", color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>{activeClip.duration}с</div>
                      </div>
                      {activeClip.hook && (
                        <div style={{ marginTop: "12px", padding: "10px 12px", borderRadius: "10px", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)" }}>
                          <div style={{ fontSize: "9px", fontWeight: 700, color: "#c084fc", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>AI Хук</div>
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{activeClip.hook}</div>
                        </div>
                      )}
                      {activeClip.transcript && (
                        <div style={{ marginTop: "12px" }}>
                          <div style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Транскрипт</div>
                          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", lineHeight: 1.6, maxHeight: "90px", overflow: "hidden" }}>{activeClip.transcript}</div>
                        </div>
                      )}
                      <button onClick={() => { const text = `${activeClip.title}\n\n${activeClip.hook}\n\n⏱ ${fmtTime(activeClip.start_time)}–${fmtTime(activeClip.end_time)}`; navigator.clipboard.writeText(text); }} style={{ width: "100%", marginTop: "12px", padding: "8px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", fontSize: "11px", cursor: "pointer" }}>
                        📋 Копировать описание
                      </button>
                      {activeClip.download_url && (
                        <a href={activeClip.download_url} download style={{ display: "block", width: "100%", boxSizing: "border-box", marginTop: "8px", padding: "10px", borderRadius: "10px", textAlign: "center", textDecoration: "none", background: "linear-gradient(135deg, #a855f7, #7c3aed)", color: "#fff", fontSize: "12px", fontWeight: 700, boxShadow: "0 4px 16px rgba(168,85,247,0.3)" }}>
                          ↓ Скачать клип MP4
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SETUP ─────────────────────────────────────────── */}
        {tab === "setup" && (
          <div style={{ maxWidth: "680px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: "14px", padding: "18px" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#c084fc", marginBottom: "8px" }}>🏗️ Архитектура движка</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px" }}>
                {[
                  ["🔗", "URL", "YouTube или MP4"],
                  ["⬇️", "yt-dlp", "Скачивает видео"],
                  ["🎙️", "Groq Whisper", "Транскрибирует речь"],
                  ["🧠", "LLaMA 3.3", "Находит хуки"],
                ].map(([icon, title, desc]) => (
                  <div key={title} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: "22px" }}>{icon}</div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#c084fc", marginTop: "4px" }}>{title}</div>
                    <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>{desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", fontSize: "12px", color: "rgba(255,255,255,0.3)", margin: "8px 0" }}>↓</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" }}>
                {[
                  ["✂️", "ffmpeg", "Нарезает клипы"],
                  ["📐", "Resize", "9:16 / 1:1 / 16:9"],
                  ["💾", "Клипы", "В public/generated/"],
                ].map(([icon, title, desc]) => (
                  <div key={title} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: "22px" }}>{icon}</div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#fb923c", marginTop: "4px" }}>{title}</div>
                    <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Install ffmpeg */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>1. Установить ffmpeg</div>
                <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, background: tools?.ffmpeg ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: tools?.ffmpeg ? "#86efac" : "#fca5a5" }}>{tools?.ffmpeg ? "✅ Установлен" : "❌ Не найден"}</span>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: "12px", background: "rgba(0,0,0,0.4)", borderRadius: "8px", padding: "12px 14px", color: "#a5b4fc", lineHeight: 1.8 }}>
                {`# Вариант 1: Chocolatey (рекомендуется)\nchoco install ffmpeg\n\n# Вариант 2: Winget\nwinget install Gyan.FFmpeg\n\n# Вариант 3: Скачать вручную\n# https://www.gyan.dev/ffmpeg/builds/ → ffmpeg-release-full.7z\n# Распаковать в C:\\ffmpeg\\, добавить C:\\ffmpeg\\bin в PATH`}
              </div>
            </div>

            {/* Install yt-dlp */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>2. Установить yt-dlp</div>
                <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, background: tools?.ytdlp ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: tools?.ytdlp ? "#86efac" : "#fca5a5" }}>{tools?.ytdlp ? "✅ Установлен" : "❌ Не найден"}</span>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: "12px", background: "rgba(0,0,0,0.4)", borderRadius: "8px", padding: "12px 14px", color: "#a5b4fc", lineHeight: 1.8 }}>
                {`# Pip\npip install yt-dlp\n\n# Chocolatey\nchoco install yt-dlp\n\n# Winget\nwinget install yt-dlp.yt-dlp`}
              </div>
            </div>

            {/* Groq key */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>3. Groq API Key</div>
                <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, background: tools?.groq ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: tools?.groq ? "#86efac" : "#fca5a5" }}>{tools?.groq ? "✅ Настроен" : "❌ Не найден"}</span>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: "12px", background: "rgba(0,0,0,0.4)", borderRadius: "8px", padding: "12px 14px", color: "#86efac", lineHeight: 1.8 }}>
                {`# frontend/.env.local\nGROQ_API_KEY=gsk_...  # уже настроен ✅\n\n# Модели:\n# - whisper-large-v3-turbo (транскрипция)\n# - llama-3.3-70b-versatile (анализ)`}
              </div>
            </div>

            <button onClick={() => { setTools(null); fetch("/api/studio/clip-ai/tools").then(r => r.json()).then(setTools); }} style={{ padding: "10px", borderRadius: "10px", border: "1px solid rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.08)", color: "#c084fc", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              ↻ Проверить инструменты снова
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
