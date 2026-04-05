/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/producer/page.tsx
 *
 * ContentOS Producer v8 — embedded strategic marketing center + AI video engine.
 */
"use client";

import { useEffect, useState, useRef } from "react";
import AdminLayout from "../_components/AdminLayout";

/* ── AI Engine types ─────────────────────────────────────────────── */
interface EngineTask {
  task_id:     string;
  status:      string;   // pending | processing | clipped | ready | failed:...
  clips_count: number;
  created_at?: string;
}

type View = "producer" | "engine";

/* ── AI Engine status checker (FastAPI on :8000) ─────────────────── */
const ENGINE_BASE = "http://localhost:8000";

async function checkEngineAlive(): Promise<boolean> {
  try {
    const r = await fetch(`${ENGINE_BASE}/docs`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch { return false; }
}

/* ── component ───────────────────────────────────────────────────── */
export default function ProducerPage() {
  const [view, setView]               = useState<View>("producer");
  const [iframeKey, setIframeKey]     = useState(0);
  const [engineAlive, setEngineAlive] = useState<boolean | null>(null);
  const [tasks, setTasks]             = useState<EngineTask[]>([]);
  const [uploading, setUploading]     = useState(false);
  const [uploadMsg, setUploadMsg]     = useState("");
  const [pollingId, setPollingId]     = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkEngineAlive().then(setEngineAlive);
    // Load tasks from local storage
    const saved = localStorage.getItem("engine_tasks");
    if (saved) setTasks(JSON.parse(saved));
  }, []);

  function saveTasks(t: EngineTask[]) {
    setTasks(t);
    localStorage.setItem("engine_tasks", JSON.stringify(t));
  }

  /* ── poll task status ─────────────────────────────────────────── */
  async function pollTask(taskId: string) {
    try {
      const r = await fetch(`${ENGINE_BASE}/status/${taskId}`);
      if (!r.ok) return;
      const d: EngineTask = await r.json();
      setTasks(prev => {
        const next = prev.map(t => t.task_id === taskId ? d : t);
        localStorage.setItem("engine_tasks", JSON.stringify(next));
        return next;
      });
      if (d.status === "ready" || d.status.startsWith("failed")) {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        setPollingId(null);
      }
    } catch { /* engine offline */ }
  }

  /* ── upload file ──────────────────────────────────────────────── */
  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setUploadMsg("Выберите файл (.mp4 / .mov / .avi)"); return; }
    if (!engineAlive) { setUploadMsg("AI Engine не запущен. Запустите FastAPI (см. инструкцию ниже)."); return; }

    setUploading(true);
    setUploadMsg("");
    try {
      const form = new FormData();
      form.append("file", file);
      const r = await fetch(`${ENGINE_BASE}/upload`, { method: "POST", body: form });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d: EngineTask = await r.json();
      const newTask: EngineTask = { ...d, created_at: new Date().toISOString() };
      saveTasks([newTask, ...tasks]);
      setPollingId(d.task_id);
      setUploadMsg(`✅ Задача создана: ${d.task_id}`);
      // Start polling
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => pollTask(d.task_id), 3000);
    } catch (e: any) {
      setUploadMsg(`❌ Ошибка: ${e.message}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  /* ── status helpers ───────────────────────────────────────────── */
  function statusColor(s: string) {
    if (s === "ready")       return "#86efac";
    if (s === "processing" || s === "clipped") return "#fde68a";
    if (s.startsWith("failed")) return "#fca5a5";
    return "#a5b4fc";
  }
  function statusLabel(s: string) {
    if (s === "ready")       return "✅ Готово";
    if (s === "processing")  return "⚙️ Обработка…";
    if (s === "clipped")     return "✂️ Нарезается…";
    if (s === "pending")     return "⏳ В очереди";
    if (s.startsWith("failed")) return "❌ " + s.replace("failed: ", "");
    return s;
  }

  /* ─────────────────────────────────────────────────────────────── */
  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ padding: "0 0 0", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px 0" }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#f59e0b", marginBottom: "4px" }}>
              ContentOS · Producer Center
            </div>
            <h1 style={{ fontSize: "18px", fontWeight: 700, background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
              Producer v8 + AI Engine
            </h1>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {engineAlive !== null && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 12px", borderRadius: "20px", background: engineAlive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)", border: `1px solid ${engineAlive ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.15)"}`, fontSize: "10px", fontWeight: 600, color: engineAlive ? "#86efac" : "#fca5a5" }}>
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: engineAlive ? "#22c55e" : "#ef4444", boxShadow: engineAlive ? "0 0 5px #22c55e" : "none" }} />
                AI Engine {engineAlive ? "Online :8000" : "Offline"}
              </div>
            )}
            <button onClick={() => setIframeKey(k => k + 1)} style={{ padding: "5px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", fontSize: "10px", cursor: "pointer" }}>↻ Обновить</button>
          </div>
        </div>

        {/* View switcher */}
        <div style={{ display: "flex", gap: "4px", padding: "10px 24px 0" }}>
          {([
            ["producer", "🎬 Producer v8 (Стратегия / Контент / Воронка)"],
            ["engine",   `⚡ AI Video Engine${tasks.length ? ` (${tasks.length})` : ""}`],
          ] as [View, string][]).map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: "7px 16px", borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600, background: view === v ? "rgba(245,158,11,0.15)" : "transparent", color: view === v ? "#f59e0b" : "rgba(255,255,255,0.4)", borderBottom: view === v ? "2px solid #f59e0b" : "2px solid transparent", transition: "all 0.15s" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── PRODUCER v8 IFRAME ──────────────────────────────────── */}
      {view === "producer" && (
        <div style={{ height: "calc(100vh - 118px)", display: "flex", flexDirection: "column" }}>
          <iframe
            key={iframeKey}
            src="/producer-v8.html"
            style={{ flex: 1, border: "none", width: "100%", display: "block" }}
            title="ContentOS Producer v8"
            sandbox="allow-scripts allow-same-origin allow-modals allow-downloads"
          />
        </div>
      )}

      {/* ── AI ENGINE ───────────────────────────────────────────── */}
      {view === "engine" && (
        <div style={{ padding: "24px 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: "20px" }}>

            {/* Upload card */}
            <div>
              {/* Architecture diagram */}
              <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: "14px", padding: "16px", marginBottom: "14px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#f59e0b", marginBottom: "12px" }}>🏗️ AI Video Pipeline</div>
                <div style={{ display: "flex", alignItems: "center", gap: "0", flexWrap: "wrap" }}>
                  {[
                    ["📁", "Upload", "MP4/MOV"],
                    ["🎙️", "Whisper", "Транскрипт"],
                    ["🧠", "GPT-4o", "Сегменты"],
                    ["✂️", "ffmpeg", "Нарезка 9:16"],
                    ["📢", "Publisher", "Авто-пост"],
                  ].map(([icon, title, sub], i, arr) => (
                    <>
                      <div key={title} style={{ textAlign: "center", flex: 1 }}>
                        <div style={{ fontSize: "18px" }}>{icon}</div>
                        <div style={{ fontSize: "10px", fontWeight: 700, color: "#f59e0b", marginTop: "3px" }}>{title}</div>
                        <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.3)" }}>{sub}</div>
                      </div>
                      {i < arr.length - 1 && <div key={`a${i}`} style={{ color: "rgba(255,255,255,0.2)", fontSize: "12px" }}>›</div>}
                    </>
                  ))}
                </div>
              </div>

              {/* Upload form */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "18px", marginBottom: "14px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Загрузить видео</div>

                {/* Drop zone */}
                <label
                  htmlFor="video-upload"
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", padding: "28px 20px", borderRadius: "12px", border: "2px dashed rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.03)", cursor: "pointer", transition: "all 0.15s", marginBottom: "12px" }}
                  onDragOver={e => { e.preventDefault(); (e.currentTarget.style.borderColor = "rgba(245,158,11,0.5)"); (e.currentTarget.style.background = "rgba(245,158,11,0.06)"); }}
                  onDragLeave={e => { (e.currentTarget.style.borderColor = "rgba(245,158,11,0.25)"); (e.currentTarget.style.background = "rgba(245,158,11,0.03)"); }}
                  onDrop={e => {
                    e.preventDefault();
                    if (fileRef.current && e.dataTransfer.files[0]) {
                      const dt = new DataTransfer();
                      dt.items.add(e.dataTransfer.files[0]);
                      fileRef.current.files = dt.files;
                      (e.currentTarget.style.borderColor = "rgba(245,158,11,0.5)");
                    }
                  }}
                >
                  <div style={{ fontSize: "32px" }}>🎬</div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Перетащите видео сюда</div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>или кликните для выбора</div>
                  <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)" }}>MP4 · MOV · AVI</div>
                </label>
                <input id="video-upload" ref={fileRef} type="file" accept=".mp4,.mov,.avi,video/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) { const label = document.querySelector('label[for="video-upload"] div:nth-child(2)') as HTMLElement; if (label) label.textContent = e.target.files[0].name; }}} />

                {uploadMsg && (
                  <div style={{ marginBottom: "10px", padding: "9px 12px", borderRadius: "8px", background: uploadMsg.startsWith("✅") ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${uploadMsg.startsWith("✅") ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, color: uploadMsg.startsWith("✅") ? "#86efac" : "#fca5a5", fontSize: "11px" }}>
                    {uploadMsg}
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  style={{ width: "100%", padding: "11px", borderRadius: "10px", border: "none", cursor: uploading ? "not-allowed" : "pointer", background: uploading ? "rgba(255,255,255,0.05)" : engineAlive ? "linear-gradient(135deg, #f59e0b, #d97706)" : "rgba(255,255,255,0.04)", color: uploading || !engineAlive ? "rgba(255,255,255,0.3)" : "#000", fontSize: "13px", fontWeight: 700, boxShadow: uploading || !engineAlive ? "none" : "0 4px 16px rgba(245,158,11,0.3)", transition: "all 0.2s" }}
                >
                  {uploading ? "⏳ Загружаем…" : "⚡ Отправить в AI Engine"}
                </button>
              </div>

              {/* Engine setup */}
              {!engineAlive && (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "16px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#fde68a", marginBottom: "10px" }}>⚙️ Запустить AI Engine</div>
                  <div style={{ fontFamily: "monospace", fontSize: "11px", background: "rgba(0,0,0,0.4)", borderRadius: "8px", padding: "12px 14px", color: "#86efac", lineHeight: 1.8 }}>
                    {`# 1. Создать venv\npython -m venv venv\nvenv\\Scripts\\activate\n\n# 2. Установить зависимости\npip install fastapi uvicorn[standard] openai ffmpeg-python aiosqlite python-multipart python-dotenv\n\n# 3. Настроить .env\n# OPENAI_API_KEY=sk-...\n# FFMPEG_PATH=ffmpeg\n\n# 4. Запустить\nuvicorn main:app --host 0.0.0.0 --port 8000`}
                  </div>
                  <button
                    onClick={() => checkEngineAlive().then(setEngineAlive)}
                    style={{ marginTop: "10px", width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)", color: "#f59e0b", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                  >
                    ↻ Проверить подключение
                  </button>
                </div>
              )}
            </div>

            {/* Tasks list */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>История задач</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {pollingId && <span style={{ fontSize: "10px", color: "#fde68a", fontWeight: 600 }}>⟳ Следим за {pollingId.slice(0, 8)}…</span>}
                  {tasks.length > 0 && <button onClick={() => { saveTasks([]); }} style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", padding: "3px 8px", cursor: "pointer" }}>Очистить</button>}
                </div>
              </div>

              {tasks.length === 0 ? (
                <div style={{ padding: "60px", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "14px", color: "rgba(255,255,255,0.2)", fontSize: "13px" }}>
                  <div style={{ fontSize: "40px", marginBottom: "10px" }}>📭</div>
                  Загрузите первое видео для обработки
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {tasks.map(task => (
                    <div key={task.task_id} style={{ padding: "14px 18px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                            <code style={{ fontSize: "11px", color: "#f59e0b", fontFamily: "monospace", background: "rgba(245,158,11,0.08)", padding: "2px 8px", borderRadius: "4px" }}>{task.task_id.slice(0, 8)}…</code>
                            <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, background: statusColor(task.status) + "15", color: statusColor(task.status) }}>
                              {statusLabel(task.status)}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "12px", fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
                            {task.clips_count > 0 && <span>✂️ {task.clips_count} клипов</span>}
                            {task.created_at && <span>🕐 {new Date(task.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                          {(task.status === "processing" || task.status === "pending" || task.status === "clipped") && (
                            <button onClick={() => { if (pollRef.current) clearInterval(pollRef.current); setPollingId(task.task_id); pollRef.current = setInterval(() => pollTask(task.task_id), 3000); }} style={{ padding: "5px 10px", borderRadius: "7px", border: "1px solid rgba(234,179,8,0.3)", background: "rgba(234,179,8,0.08)", color: "#fde68a", fontSize: "10px", cursor: "pointer" }}>
                              ↻ Следить
                            </button>
                          )}
                          {task.status === "ready" && engineAlive && (
                            <a href={`${ENGINE_BASE}/outputs`} target="_blank" rel="noopener noreferrer" style={{ padding: "5px 10px", borderRadius: "7px", border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)", color: "#86efac", fontSize: "10px", textDecoration: "none" }}>
                              ↓ Клипы
                            </a>
                          )}
                          <button onClick={() => saveTasks(tasks.filter(t => t.task_id !== task.task_id))} style={{ padding: "5px 8px", borderRadius: "7px", border: "1px solid rgba(239,68,68,0.15)", background: "transparent", color: "rgba(239,68,68,0.5)", fontSize: "10px", cursor: "pointer" }}>
                            🗑
                          </button>
                        </div>
                      </div>
                      {/* Progress bar for active tasks */}
                      {(task.status === "processing" || task.status === "clipped") && (
                        <div style={{ marginTop: "10px", height: "3px", borderRadius: "3px", background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                          <div style={{ width: task.status === "clipped" ? "75%" : "40%", height: "100%", background: "linear-gradient(90deg, #f59e0b, #fbbf24)", borderRadius: "3px", transition: "width 0.5s" }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* API docs link */}
              {engineAlive && (
                <div style={{ marginTop: "14px", padding: "12px 16px", borderRadius: "10px", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>FastAPI Swagger UI доступен</div>
                  <a href={`${ENGINE_BASE}/docs`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", fontWeight: 600, color: "#f59e0b", textDecoration: "none", padding: "4px 10px", borderRadius: "6px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                    Открыть Swagger ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
