"use client";
import { useState, useRef } from "react";
import {
  Image as ImageIcon, Video, Sparkles, RefreshCw, Download,
  Copy, Check, AlertCircle, Zap, Play, Clock, ChevronDown,
  Plus, X,
} from "lucide-react";
import clsx from "clsx";

// ── Types ──────────────────────────────────────────────────────────────────────
type MediaTab = "image" | "video";
type AspectRatio = "1:1" | "16:9" | "9:16" | "4:5";

// ── Prompt templates ──────────────────────────────────────────────────────────
const IMAGE_PRESETS = [
  { label: "Портрет эксперта",    prompt: "Professional portrait photo of a confident expert in business attire, studio lighting, clean background, 4K, photorealistic" },
  { label: "Рилс обложка",        prompt: "Eye-catching social media thumbnail, bold text overlay area, vibrant colors, modern design, 9:16 vertical format" },
  { label: "Рекламный баннер",    prompt: "Clean modern advertising banner, product showcase, minimal design, professional lighting, white background, commercial photography" },
  { label: "Лайфстайл фото",     prompt: "Authentic lifestyle photo, natural lighting, warm tones, person working on laptop in cozy cafe, candid style" },
  { label: "Инфографика",         prompt: "Clean infographic design, data visualization, modern flat icons, professional color palette, white background" },
  { label: "Продуктовое фото",   prompt: "Minimalist product photography, clean white background, dramatic shadows, professional studio lighting, commercial quality" },
];

const VIDEO_PRESETS = [
  { label: "Промо-ролик",   prompt: "Dynamic promotional video, fast cuts, text overlays, modern corporate style, energetic music vibe, 6 seconds" },
  { label: "Лого-анимация", prompt: "Smooth logo animation, particles, glowing effects, dark background, professional reveal sequence" },
  { label: "Природа",       prompt: "Cinematic aerial landscape shot, mountains and clouds, golden hour lighting, smooth camera movement, 4K quality" },
  { label: "Городской таймлапс", prompt: "City timelapse at night, light trails, neon reflections, urban skyline, cinematic wide angle" },
  { label: "Рилс переход",  prompt: "Smooth social media transition effect, trendy style, fast paced, vibrant colors, vertical 9:16 format" },
];

const ASPECT_RATIOS: { value: AspectRatio; label: string; w: number; h: number }[] = [
  { value: "1:1",  label: "1:1 (квадрат)",    w: 1, h: 1  },
  { value: "16:9", label: "16:9 (горизонталь)", w: 16, h: 9 },
  { value: "9:16", label: "9:16 (Reels)",       w: 9, h: 16 },
  { value: "4:5",  label: "4:5 (Instagram)",    w: 4, h: 5  },
];

// ── Video status polling ───────────────────────────────────────────────────────
const VIDEO_STATUS_LABELS: Record<string, string> = {
  starting:    "Запускаем модель…",
  processing:  "Генерируем видео…",
  succeeded:   "Готово!",
  failed:      "Ошибка генерации",
  canceled:    "Отменено",
  demo:        "Демо-режим",
};

// ── Helpers ────────────────────────────────────────────────────────────────────
async function downloadFile(url: string, filename: string) {
  const res  = await fetch(url);
  const blob = await res.blob();
  const a    = document.createElement("a");
  a.href     = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── Prompt enhancer via hub API ────────────────────────────────────────────────
async function enhancePrompt(raw: string, type: "image" | "video"): Promise<string> {
  const res = await fetch("/api/hub", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "enhancePrompt",
      data:   { rawPrompt: raw, mediaType: type },
    }),
  });
  const json = await res.json();
  return json.result?.trim() ?? raw;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function GeneratePage() {
  const [tab, setTab] = useState<MediaTab>("image");

  // Image state
  const [imgPrompt,  setImgPrompt]   = useState("");
  const [imgTopic,   setImgTopic]    = useState("");
  const [imgAspect,  setImgAspect]   = useState<AspectRatio>("1:1");
  const [imgCount,   setImgCount]    = useState(2);
  const [imgLoading, setImgLoading]  = useState(false);
  const [images,     setImages]      = useState<string[]>([]);
  const [imgError,   setImgError]    = useState("");
  const [imgDemo,    setImgDemo]     = useState(false);
  const [enhancing,  setEnhancing]   = useState(false);
  const [autoGen,    setAutoGen]     = useState(false);

  // Video state
  const [vidPrompt,  setVidPrompt]   = useState("");
  const [vidLoading, setVidLoading]  = useState(false);
  const [vidId,      setVidId]       = useState<string | null>(null);
  const [vidStatus,  setVidStatus]   = useState("");
  const [vidUrl,     setVidUrl]      = useState<string | null>(null);
  const [vidError,   setVidError]    = useState("");
  const [vidDemo,    setVidDemo]     = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [copied, setCopied] = useState<string | null>(null);

  // ── Image generation ──────────────────────────────────────────────────────
  async function generateImages() {
    if (!imgPrompt.trim()) return;
    setImgLoading(true); setImgError(""); setImages([]); setImgDemo(false);

    try {
      const res  = await fetch("/api/generate/image", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ prompt: imgPrompt, aspectRatio: imgAspect, numOutputs: imgCount }),
      });
      const data = await res.json();
      if (!res.ok) { setImgError(data.error ?? "Ошибка"); return; }
      setImages(data.images ?? []);
      setImgDemo(!!data.demo);
    } catch (e: any) {
      setImgError(e.message);
    } finally {
      setImgLoading(false);
    }
  }

  async function enhanceImagePrompt() {
    if (!imgPrompt.trim()) return;
    setEnhancing(true);
    try {
      const improved = await enhancePrompt(imgPrompt, "image");
      setImgPrompt(improved);
    } finally {
      setEnhancing(false);
    }
  }

  async function autoGeneratePrompt() {
    if (!imgTopic.trim()) return;
    setAutoGen(true);
    try {
      // Use hub to generate a prompt from just a topic
      const res = await fetch("/api/hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enhancePrompt",
          data: {
            rawPrompt: `Тема: ${imgTopic}. Создай профессиональный промпт для AI-генерации изображения.`,
            mediaType: "image",
          },
        }),
      });
      const json = await res.json();
      if (json.result) setImgPrompt(json.result.trim());
    } finally {
      setAutoGen(false);
    }
  }

  async function autoGenerateVideoPrompt() {
    if (!vidPrompt.trim()) return;
    setEnhancing(true);
    try {
      const improved = await enhancePrompt(vidPrompt, "video");
      setVidPrompt(improved);
    } finally {
      setEnhancing(false);
    }
  }

  // ── Video generation ──────────────────────────────────────────────────────
  async function generateVideo() {
    if (!vidPrompt.trim()) return;
    setVidLoading(true); setVidError(""); setVidUrl(null); setVidDemo(false);
    setVidStatus("starting");

    try {
      const res  = await fetch("/api/generate/video", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ prompt: vidPrompt }),
      });
      const data = await res.json();
      if (!res.ok) { setVidError(data.error ?? "Ошибка"); setVidLoading(false); return; }

      if (data.demo) {
        setVidDemo(true); setVidStatus("demo"); setVidLoading(false); return;
      }

      setVidId(data.id);
      setVidStatus(data.status);

      if (data.status === "succeeded" && data.output) {
        setVidUrl(Array.isArray(data.output) ? data.output[0] : data.output);
        setVidLoading(false);
        return;
      }

      // Poll every 5 seconds
      pollRef.current = setInterval(async () => {
        try {
          const p    = await fetch(`/api/generate/video?id=${data.id}`);
          const poll = await p.json();
          setVidStatus(poll.status);
          if (poll.status === "succeeded") {
            setVidUrl(Array.isArray(poll.output) ? poll.output[0] : poll.output);
            clearInterval(pollRef.current!);
            setVidLoading(false);
          } else if (poll.status === "failed" || poll.status === "canceled") {
            setVidError(poll.error ?? "Генерация не удалась");
            clearInterval(pollRef.current!);
            setVidLoading(false);
          }
        } catch { /* ignore */ }
      }, 5000);
    } catch (e: any) {
      setVidError(e.message);
      setVidLoading(false);
    }
  }

  async function copyPrompt(p: string) {
    await navigator.clipboard.writeText(p);
    setCopied(p);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-5">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-text flex items-center gap-2">
          <Sparkles size={20} className="text-accent" /> Генерация медиа
        </h1>
        <p className="text-sm text-subtext mt-0.5">
          AI-генерация фотографий и видео для контента и рекламы
        </p>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div className="flex gap-2">
        {([
          { id: "image", label: "Фото / Изображение", icon: ImageIcon },
          { id: "video", label: "Видео",              icon: Video     },
        ] as { id: MediaTab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors",
              tab === id
                ? "bg-accent/20 border-accent/40 text-accent"
                : "border-border text-subtext hover:text-text hover:border-accent/30"
            )}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
           IMAGE TAB
         ════════════════════════════════════════════════════════════════════════ */}
      {tab === "image" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Controls */}
          <div className="space-y-4">
            <div className="card p-4 space-y-4">
              <p className="text-sm font-semibold text-text flex items-center gap-2">
                <ImageIcon size={14} className="text-accent" /> Настройки генерации
              </p>

              {/* Auto-generate from topic */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-subtext uppercase tracking-wide">Тема (для автогенерации)</label>
                <div className="flex gap-2">
                  <input
                    className="input flex-1 text-sm"
                    placeholder="Портрет эксперта, реклама курса..."
                    value={imgTopic}
                    onChange={(e) => setImgTopic(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") autoGeneratePrompt(); }}
                  />
                  <button
                    onClick={autoGeneratePrompt}
                    disabled={autoGen || !imgTopic.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent text-xs font-medium transition-colors disabled:opacity-40 shrink-0"
                  >
                    {autoGen ? <RefreshCw size={11} className="animate-spin" /> : <Sparkles size={11} />}
                    {autoGen ? "Генерируем…" : "AI промпт"}
                  </button>
                </div>
              </div>

              {/* Prompt */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-subtext uppercase tracking-wide">Промпт</label>
                  <button
                    onClick={enhanceImagePrompt}
                    disabled={enhancing || !imgPrompt.trim()}
                    className="flex items-center gap-1 text-[10px] text-accent hover:text-accent/80 disabled:opacity-40 transition-colors"
                  >
                    {enhancing ? <RefreshCw size={9} className="animate-spin" /> : <Sparkles size={9} />}
                    Улучшить
                  </button>
                </div>
                <textarea
                  value={imgPrompt}
                  onChange={(e) => setImgPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) generateImages(); }}
                  placeholder="Опиши что хочешь сгенерировать... (Ctrl+Enter = генерировать)"
                  className="input w-full h-24 resize-none text-sm"
                />
              </div>

              {/* Aspect ratio */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-subtext uppercase tracking-wide">Формат</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {ASPECT_RATIOS.map((ar) => (
                    <button
                      key={ar.value}
                      onClick={() => setImgAspect(ar.value)}
                      className={clsx(
                        "py-1.5 rounded-lg border text-[11px] transition-colors",
                        imgAspect === ar.value
                          ? "bg-accent/20 border-accent/40 text-accent"
                          : "border-border text-subtext hover:text-text"
                      )}
                    >
                      {ar.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Count */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-subtext uppercase tracking-wide">
                  Кол-во вариантов: {imgCount}
                </label>
                <input
                  type="range" min={1} max={4} value={imgCount}
                  onChange={(e) => setImgCount(Number(e.target.value))}
                  className="w-full accent-[var(--color-accent)]"
                />
              </div>

              <button
                onClick={generateImages}
                disabled={imgLoading || !imgPrompt.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {imgLoading
                  ? <RefreshCw size={14} className="animate-spin" />
                  : <Sparkles size={14} />}
                {imgLoading ? "Генерируем…" : "Сгенерировать фото"}
              </button>

              {imgError && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 rounded-xl p-3">
                  <AlertCircle size={12} /> {imgError}
                </div>
              )}

              {imgDemo && (
                <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 rounded-xl p-3">
                  <AlertCircle size={12} /> Демо-режим. Добавь <code className="mx-1 bg-amber-400/20 px-1 rounded font-mono">REPLICATE_API_TOKEN</code> для реальных фото.
                </div>
              )}
            </div>

            {/* Presets */}
            <div className="card p-4 space-y-2">
              <p className="text-xs font-semibold text-text mb-2">Шаблоны промптов</p>
              {IMAGE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setImgPrompt(p.prompt)}
                  className="w-full text-left text-xs text-subtext hover:text-text hover:bg-white/5 px-2 py-1.5 rounded-lg transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {imgLoading && (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: imgCount }).map((_, i) => (
                  <div key={i} className="aspect-square bg-surface2 rounded-xl animate-pulse flex items-center justify-center">
                    <Sparkles size={24} className="text-accent/30" />
                  </div>
                ))}
              </div>
            )}

            {!imgLoading && images.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 h-64 text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <ImageIcon size={28} className="text-accent" />
                </div>
                <p className="text-sm font-medium text-text">Введи промпт и нажми «Сгенерировать»</p>
                <p className="text-xs text-subtext max-w-xs">
                  Использует FLUX Schnell — быстрая генерация за 3–5 секунд
                </p>
              </div>
            )}

            {!imgLoading && images.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {images.map((url, i) => (
                  <div key={i} className="group relative rounded-xl overflow-hidden bg-surface2">
                    <img
                      src={url}
                      alt={`Generated ${i + 1}`}
                      className="w-full h-full object-cover"
                      style={{ aspectRatio: imgAspect.replace(":", "/") }}
                    />
                    {/* Overlay actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => downloadFile(url, `generated_${i + 1}.webp`)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 backdrop-blur text-white text-xs font-medium hover:bg-white/30 transition-colors"
                      >
                        <Download size={12} /> Скачать
                      </button>
                      <button
                        onClick={() => copyPrompt(url)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 backdrop-blur text-white text-xs font-medium hover:bg-white/30 transition-colors"
                      >
                        {copied === url ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        URL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
           VIDEO TAB
         ════════════════════════════════════════════════════════════════════════ */}
      {tab === "video" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Controls */}
          <div className="space-y-4">
            <div className="card p-4 space-y-4">
              <p className="text-sm font-semibold text-text flex items-center gap-2">
                <Video size={14} className="text-accent" /> Генерация видео
              </p>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-subtext uppercase tracking-wide">Описание видео</label>
                  <button
                    onClick={autoGenerateVideoPrompt}
                    disabled={enhancing || !vidPrompt.trim()}
                    className="flex items-center gap-1 text-[10px] text-accent hover:text-accent/80 disabled:opacity-40 transition-colors"
                  >
                    {enhancing ? <RefreshCw size={9} className="animate-spin" /> : <Sparkles size={9} />}
                    Улучшить AI
                  </button>
                </div>
                <textarea
                  value={vidPrompt}
                  onChange={(e) => setVidPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) generateVideo(); }}
                  placeholder="Опиши сцену... Например: 'Cinematic drone shot over mountains at sunset, golden hour lighting' (Ctrl+Enter)"
                  className="input w-full h-28 resize-none text-sm"
                />
              </div>

              <div className="rounded-xl bg-accent/5 border border-accent/20 p-3 text-xs text-subtext space-y-1">
                <p className="text-accent font-semibold">💡 Советы для лучшего результата</p>
                <p>• Пиши на английском для лучшего качества</p>
                <p>• Указывай стиль: cinematic, realistic, animation</p>
                <p>• Описывай движение камеры: pan, zoom, aerial</p>
                <p>• Генерация занимает 1–3 минуты</p>
              </div>

              <button
                onClick={generateVideo}
                disabled={vidLoading || !vidPrompt.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {vidLoading
                  ? <RefreshCw size={14} className="animate-spin" />
                  : <Video size={14} />}
                {vidLoading ? VIDEO_STATUS_LABELS[vidStatus] ?? "Генерируем…" : "Сгенерировать видео"}
              </button>

              {vidError && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 rounded-xl p-3">
                  <AlertCircle size={12} /> {vidError}
                </div>
              )}

              {vidDemo && (
                <div className="text-xs text-amber-400 bg-amber-400/10 rounded-xl p-3">
                  Демо-режим. Добавь <code className="bg-amber-400/20 px-1 rounded font-mono">REPLICATE_API_TOKEN</code> для реальной генерации.
                </div>
              )}
            </div>

            {/* Video presets */}
            <div className="card p-4 space-y-2">
              <p className="text-xs font-semibold text-text mb-2">Готовые промпты</p>
              {VIDEO_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setVidPrompt(p.prompt)}
                  className="w-full text-left text-xs text-subtext hover:text-text hover:bg-white/5 px-2 py-1.5 rounded-lg transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Video result */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {vidLoading && !vidUrl && (
              <div className="aspect-video bg-surface2 rounded-xl flex flex-col items-center justify-center gap-3">
                <RefreshCw size={28} className="text-accent animate-spin" />
                <p className="text-sm text-text font-medium">
                  {VIDEO_STATUS_LABELS[vidStatus] ?? "Обрабатываем…"}
                </p>
                <p className="text-xs text-subtext">Генерация занимает 1–3 минуты</p>
                {vidId && (
                  <p className="text-[10px] font-mono text-subtext/50">ID: {vidId}</p>
                )}
              </div>
            )}

            {!vidLoading && !vidUrl && !vidDemo && (
              <div className="aspect-video bg-surface2 rounded-xl flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <Video size={28} className="text-accent" />
                </div>
                <p className="text-sm font-medium text-text">Видео появится здесь</p>
                <p className="text-xs text-subtext">Используем Minimax Video-01 — 6-секундные клипы</p>
              </div>
            )}

            {vidDemo && (
              <div className="aspect-video bg-surface2 rounded-xl flex flex-col items-center justify-center gap-3 border-2 border-dashed border-accent/30">
                <Zap size={32} className="text-accent" />
                <p className="text-sm font-bold text-text">Демо-режим активен</p>
                <p className="text-xs text-subtext text-center max-w-xs">
                  В реальном режиме здесь появится сгенерированное видео. Добавь REPLICATE_API_TOKEN.
                </p>
              </div>
            )}

            {vidUrl && (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden bg-black">
                  <video src={vidUrl} controls autoPlay loop className="w-full" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadFile(vidUrl, "generated_video.mp4")}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent/20 hover:bg-accent/30 text-accent text-sm font-medium transition-colors"
                  >
                    <Download size={14} /> Скачать MP4
                  </button>
                  <button
                    onClick={() => copyPrompt(vidUrl)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-subtext hover:text-text text-sm transition-colors"
                  >
                    {copied === vidUrl ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    Копировать URL
                  </button>
                </div>
              </div>
            )}

            {/* Usage guide */}
            <div className="card p-4 border-accent/20 bg-accent/5">
              <p className="text-xs font-semibold text-text mb-2 flex items-center gap-1.5">
                <Zap size={12} className="text-accent" /> Как использовать в контенте
              </p>
              <div className="space-y-1.5 text-xs text-subtext">
                <p>🎬 <strong className="text-text">Фото</strong> — обложки Reels, рекламные баннеры, визуалы для постов</p>
                <p>🎥 <strong className="text-text">Видео</strong> — B-roll, фоновое видео, переходы, промо-ролики</p>
                <p>✂️ После генерации → <strong className="text-text">Студия</strong> для нарезки клипов через Opus</p>
                <p>📅 Готовый контент → <strong className="text-text">Планировщик</strong> для автопостинга</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
