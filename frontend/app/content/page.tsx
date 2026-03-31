"use client";
import { useEffect, useState } from "react";
import { getClients, clipVideo, getProject, getSocial, publishVideo } from "@/lib/api";
import { Video, Loader2, Play, Copy, Check, Upload } from "lucide-react";
import clsx from "clsx";

type Step = "upload" | "clip" | "social" | "publish";

export default function Content() {
  const [step, setStep]           = useState<Step>("upload");
  const [videoUrl, setVideoUrl]   = useState("");
  const [projectId, setProjectId] = useState("");
  const [clips, setClips]         = useState<any[]>([]);
  const [captions, setCaptions]   = useState<string[]>([]);
  const [caption, setCaption]     = useState("");
  const [publishAt, setPublishAt] = useState("");
  const [loading, setLoading]     = useState(false);
  const [status, setStatus]       = useState("");
  const [copied, setCopied]       = useState<number | null>(null);

  async function handleClip() {
    if (!videoUrl.trim()) return;
    setLoading(true); setStatus("Создаём проект…");
    try {
      const res = await clipVideo(videoUrl);
      setProjectId(res.project_id ?? res.id ?? "");
      setStatus("Проект создан. Нарезаем клипы…");
      // poll
      let attempts = 0;
      while (attempts < 20) {
        await new Promise((r) => setTimeout(r, 3000));
        const poll = await getProject(res.project_id ?? res.id);
        if (poll.status === "done" || poll.clips?.length) {
          setClips(poll.clips ?? []);
          setStep("clip");
          setStatus("");
          break;
        }
        attempts++;
        setStatus(`Обработка… ${attempts * 15}%`);
      }
    } catch (e: any) {
      setStatus(`Ошибка: ${e.message}`);
    } finally { setLoading(false); }
  }

  async function handleSocial() {
    if (!projectId) return;
    setLoading(true); setStatus("Генерируем подписи…");
    try {
      const res = await getSocial(projectId);
      setCaptions(res.captions ?? [res.caption ?? ""]);
      setStep("social");
    } catch (e: any) {
      setStatus(`Ошибка: ${e.message}`);
    } finally { setLoading(false); setStatus(""); }
  }

  async function handlePublish() {
    if (!caption) return;
    setLoading(true); setStatus("Публикуем…");
    try {
      await publishVideo(projectId, caption, publishAt);
      setStatus("✅ Опубликовано!");
      setStep("upload");
      setVideoUrl(""); setProjectId(""); setClips([]); setCaptions([]);
    } catch (e: any) {
      setStatus(`Ошибка: ${e.message}`);
    } finally { setLoading(false); }
  }

  async function copyText(text: string, i: number) {
    await navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 2000);
  }

  const STEPS: { id: Step; label: string }[] = [
    { id: "upload",  label: "1. Загрузка" },
    { id: "clip",    label: "2. Клипы" },
    { id: "social",  label: "3. Подписи" },
    { id: "publish", label: "4. Публикация" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text">Контент / Vizard</h1>
        <p className="text-sm text-subtext mt-0.5">AI автоклипы из подкастов и видео</p>
      </div>

      {/* Steps */}
      <div className="flex gap-2">
        {STEPS.map(({ id, label }) => (
          <div key={id} className={clsx("flex-1 text-center text-xs py-1.5 rounded-lg",
            step === id ? "bg-accent text-white font-medium" : "bg-nav text-subtext")}>
            {label}
          </div>
        ))}
      </div>

      {status && (
        <div className="card border-accent/30 bg-accent/5 text-sm text-accent flex items-center gap-2">
          {loading && <Loader2 size={14} className="animate-spin" />}
          {status}
        </div>
      )}

      {/* Upload */}
      {step === "upload" && (
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-text flex items-center gap-2">
            <Upload size={14} className="text-accent" /> Загрузить видео / подкаст
          </h2>
          <div>
            <label className="text-xs text-subtext block mb-1">URL видео (YouTube, Drive, прямая ссылка)</label>
            <input className="input" placeholder="https://..." value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)} />
          </div>
          <button onClick={handleClip} disabled={loading || !videoUrl.trim()} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Нарезать клипы
          </button>
        </div>
      )}

      {/* Clips */}
      {step === "clip" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">Готовые клипы ({clips.length})</h2>
            <button onClick={handleSocial} disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Video size={14} />}
              Генерировать подписи
            </button>
          </div>
          {clips.length === 0 ? (
            <div className="card text-sm text-subtext">Клипы обрабатываются…</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {clips.map((c: any, i: number) => (
                <div key={i} className="card space-y-2">
                  <p className="text-xs font-medium text-text">Клип #{i + 1}</p>
                  {c.url && (
                    <a href={c.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-accent hover:underline">Смотреть →</a>
                  )}
                  {c.score && <p className="text-xs text-subtext">Viral score: {c.score}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Social captions */}
      {step === "social" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">AI подписи</h2>
            <button onClick={() => setStep("publish")} disabled={!caption} className="btn-primary">
              Далее → Публикация
            </button>
          </div>
          {captions.map((c, i) => (
            <div key={i} className={clsx("card cursor-pointer transition-colors",
              caption === c ? "border-accent bg-accent/5" : "hover:border-accent/40")}
              onClick={() => setCaption(c)}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-text whitespace-pre-wrap flex-1">{c}</p>
                <button onClick={(e) => { e.stopPropagation(); copyText(c, i); }}
                  className="text-subtext hover:text-text shrink-0">
                  {copied === i ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Publish */}
      {step === "publish" && (
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-text">Публикация</h2>
          <div>
            <label className="text-xs text-subtext block mb-1">Подпись</label>
            <textarea className="input resize-none" rows={4} value={caption}
              onChange={(e) => setCaption(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-subtext block mb-1">Время публикации (необязательно)</label>
            <input className="input" type="datetime-local" value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep("social")} className="btn-ghost">← Назад</button>
            <button onClick={handlePublish} disabled={loading || !caption} className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              Опубликовать
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
