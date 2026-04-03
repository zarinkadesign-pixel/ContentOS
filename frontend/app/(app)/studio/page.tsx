"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { AGENTS } from "@/lib/agents";
import { useStream } from "@/lib/useStream";
import {
  Loader2, Copy, Check, Zap, FileText, Megaphone, CalendarDays,
  Bot, ChevronRight, RefreshCw, Scissors, Download, Star,
  Play, AlertCircle, ExternalLink, Link as LinkIcon,
} from "lucide-react";
import clsx from "clsx";

// ── Constants ─────────────────────────────────────────────────────────────────
const PLATFORMS = ["Instagram", "Telegram", "YouTube", "TikTok", "VK", "Email"] as const;
const PLATFORM_ICONS: Record<string, string> = {
  Instagram: "📸", Telegram: "✈️", YouTube: "▶️", TikTok: "🎵", VK: "🔵", Email: "📧",
};
const CONTENT_TYPES: Record<string, string[]> = {
  Instagram: ["Reels скрипт", "Пост-карусель", "Stories CTA", "Caption с хуком", "Bio"],
  Telegram:  ["Пост в канал", "Цепочка прогрева", "Анонс", "Продающий пост"],
  YouTube:   ["Скрипт видео", "Описание", "Заголовок + превью", "Shorts скрипт"],
  TikTok:    ["Скрипт Reels", "Хук 3 сек", "Текст к видео"],
  VK:        ["Пост", "Рассылка", "Реклама"],
  Email:     ["Письмо-прогрев", "Продающее письмо", "Welcome-цепочка"],
};
const TONES = ["Нейтральный", "Дружелюбный", "Провокационный", "Экспертный", "Юмористический"];
const FUNNEL_GOALS = ["Прогрев к курсу", "Новые подписчики", "Консультация", "TG-бот", "Вебинар"];
const AD_FORMATS = [
  { key: "image",   icon: "🖼",  label: "Картинка + Описание", desc: "Статичный баннер. FB/IG Feed, VK, Telegram Ads." },
  { key: "video",   icon: "🎬",  label: "Видео + Описание",    desc: "Видеоролик с подписью. Максимальный охват в Reels." },
  { key: "voiceover", icon: "🎙", label: "Озвучка + Монтаж",   desc: "Скрипт для озвучки + монтажные тайм-коды." },
];
const TARGET_PLATFORMS = ["📸 Instagram", "🎵 TikTok", "🔵 VK", "▶️ YouTube", "✈️ Telegram", "🔍 Google"];
const BOT_CHAINS = [
  { key: "warm7",   label: "🔥 Прогрев 7 дней",    color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { key: "sell5",   label: "💰 Продающая серия",   color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { key: "welcome", label: "👋 Welcome цепочка",   color: "bg-accent/20 text-accent border-accent/30" },
  { key: "call",    label: "📞 Созвон-воронка",     color: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
  { key: "onboard", label: "🎓 Онбординг клиента", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
];

// ── AI call helper — uses streaming endpoint, falls back to non-streaming ──────
async function generate(prompt: string, system: string): Promise<string> {
  try {
    const res = await fetch("/api/studio/stream", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ prompt, system }),
    });
    if (!res.ok || !res.body) throw new Error("stream unavailable");

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = ""; let full = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n"); buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const msg = JSON.parse(line.slice(6));
          if (msg.type === "delta") full += msg.text;
          if (msg.type === "done")  return full;
          if (msg.type === "error") return `⚠️ ${msg.message}`;
        } catch { /* skip */ }
      }
    }
    return full;
  } catch {
    // Fallback to non-streaming
    const res  = await fetch("/api/studio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, system }) });
    const data = await res.json();
    return data.result ?? "⚠️ Ошибка генерации";
  }
}

// ── Shared: Result box ─────────────────────────────────────────────────────────
function ResultBox({ value, label = "Результат" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="card border-accent/20 mt-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-accent flex items-center gap-1.5">
          <Zap size={11} /> {label}
        </span>
        <button onClick={copy}
          className="flex items-center gap-1 text-xs text-subtext hover:text-text transition-colors">
          {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
          {copied ? "Скопировано" : "Копировать"}
        </button>
      </div>
      <div className="text-xs text-text/85 whitespace-pre-wrap leading-relaxed bg-nav rounded-lg p-3 border border-border max-h-[500px] overflow-y-auto">
        {value}
      </div>
    </div>
  );
}

// ── Pill button ───────────────────────────────────────────────────────────────
function Pill({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button onClick={onClick}
      className={clsx(
        "text-xs px-3 py-1.5 rounded-full border transition-all",
        active
          ? color ?? "bg-accent text-white border-accent"
          : "bg-nav text-subtext border-border hover:border-accent/30 hover:text-text"
      )}>
      {label}
    </button>
  );
}

// ── Tab: Create Text ──────────────────────────────────────────────────────────
function CreateTextTab() {
  const [platform, setPlatform] = useState("Instagram");
  const [type, setType]         = useState("Reels скрипт");
  const [tone, setTone]         = useState("Нейтральный");
  const [goal, setGoal]         = useState("Прогрев к курсу");
  const [customGoal, setCustomGoal] = useState("");
  const [topic, setTopic]       = useState("");
  const [provider, setProvider] = useState<"auto" | "groq" | "claude">("auto");
  const [claudeAvail, setClaudeAvail] = useState(false);
  const stream = useStream();
  const loading = stream.loading;
  const result  = stream.text || stream.error;

  useEffect(() => {
    fetch("/api/providers").then(r => r.json()).then(d => setClaudeAvail(d.claude)).catch(() => {});
  }, []);

  const types = CONTENT_TYPES[platform] ?? ["Пост", "Reels"];

  function switchPlatform(p: string) {
    setPlatform(p);
    const t = CONTENT_TYPES[p]?.[0] ?? "Пост";
    setType(t);
  }

  async function handleGenerate() {
    if (!topic.trim()) return;
    const effectiveGoal = customGoal.trim() || goal;
    const prompt = `Создай ${type} для ${platform}.
Тема: ${topic}
Тон: ${tone}
Цель: ${effectiveGoal}

Структура:
1. Хук (0–3 сек — остановить скролл)
2. Проблема (она узнаёт себя)
3. Основная часть (польза / история / решение)
4. Доказательство (цифра, кейс, факт)
5. CTA (одно конкретное действие)
6. 5 хэштегов

Живой разговорный язык. Без воды. До 100 слов.`;
    const agentSystem = platform === "Instagram" && (type === "Reels скрипт" || type === "Caption с хуком")
      ? AGENTS.viralreels.system
      : platform === "TikTok"
      ? AGENTS.tiktokstrategist.system
      : AGENTS.copywriter.system;

    if (provider === "claude" && claudeAvail) {
      await stream.start({
        url: "/api/claude", method: "POST",
        body: { prompt, system: agentSystem, stream: true },
      });
    } else {
      await stream.start({ url: "/api/studio/stream", method: "POST", body: { prompt, system: agentSystem } });
    }
  }

  return (
    <div className="space-y-4">
      {/* Platform */}
      <div className="card space-y-3">
        <p className="text-xs font-semibold text-subtext uppercase tracking-wider">Платформа</p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <Pill key={p} label={`${PLATFORM_ICONS[p]} ${p}`} active={platform === p} onClick={() => switchPlatform(p)} />
          ))}
        </div>
      </div>

      {/* Content type */}
      <div className="card space-y-3">
        <p className="text-xs font-semibold text-subtext uppercase tracking-wider">Тип контента</p>
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <Pill key={t} label={t} active={type === t} onClick={() => setType(t)}
              color="bg-blue-500/20 text-blue-400 border-blue-500/30" />
          ))}
        </div>
      </div>

      {/* Tone */}
      <div className="card space-y-3">
        <p className="text-xs font-semibold text-subtext uppercase tracking-wider">Тон</p>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => (
            <Pill key={t} label={t} active={tone === t} onClick={() => setTone(t)}
              color="bg-pink-500/20 text-pink-400 border-pink-500/30" />
          ))}
        </div>
      </div>

      {/* Goal */}
      <div className="card space-y-3">
        <p className="text-xs font-semibold text-subtext uppercase tracking-wider">Цель / Воронка</p>
        <div className="flex flex-wrap gap-2">
          {FUNNEL_GOALS.map((g) => (
            <Pill key={g} label={g} active={goal === g && !customGoal} onClick={() => { setGoal(g); setCustomGoal(""); }}
              color="bg-violet-500/20 text-violet-400 border-violet-500/30" />
          ))}
        </div>
        <input className="input w-full text-xs mt-1"
          placeholder="Или своя цель (опционально)…"
          value={customGoal} onChange={(e) => setCustomGoal(e.target.value)} />
      </div>

      {/* Topic */}
      <div className="card space-y-3">
        <p className="text-xs font-semibold text-subtext uppercase tracking-wider">Тема контента *</p>
        <textarea rows={3} className="input w-full text-sm resize-none"
          placeholder="Например: 3 причины почему деньги не приходят... / Кейс клиента с 0 до 10к…"
          value={topic} onChange={(e) => setTopic(e.target.value)} />

        {/* Provider selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">AI:</span>
          {(["auto", "groq", "claude"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              disabled={p === "claude" && !claudeAvail}
              className={clsx(
                "text-xs px-2.5 py-1 rounded-full border transition-all disabled:opacity-30",
                provider === p
                  ? "bg-accent/20 text-accent border-accent/40"
                  : "bg-transparent text-white/40 border-white/10 hover:border-white/30 hover:text-white/70"
              )}
            >
              {p === "auto" ? "⚡ Авто" : p === "groq" ? "🟢 Groq" : "🟣 Claude"}
            </button>
          ))}
        </div>

        <button onClick={handleGenerate} disabled={loading || !topic.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5">
          {loading ? <><Loader2 size={13} className="animate-spin" /> Генерирую…</> : <><Zap size={13} /> Сгенерировать</>}
        </button>
      </div>

      <ResultBox value={result} label={`${type} · ${platform}`} />
    </div>
  );
}

// ── Tab: Ads ──────────────────────────────────────────────────────────────────
function AdsTab() {
  const [format, setFormat]       = useState("image");
  const [offer, setOffer]         = useState("");
  const [targetPlatform, setTargetPlatform] = useState("📸 Instagram");
  const [loadingAd, setLoadingAd] = useState(false);
  const [loadingTgt, setLoadingTgt] = useState(false);
  const [adResult, setAdResult]   = useState("");
  const [tgtResult, setTgtResult] = useState("");

  const fmtLabel = AD_FORMATS.find((f) => f.key === format)?.label ?? "";

  async function handleGenerateAd() {
    if (!offer.trim()) return;
    setLoadingAd(true); setAdResult("");
    try {
      const prompt = `Создай рекламный креатив формата «${fmtLabel}».
Продукт/оффер: ${offer}

Напиши:
1. Заголовок (до 40 символов) — цепляющий
2. Основной текст (до 125 символов)
3. Описание (до 30 символов)
4. CTA кнопка
5. Хуки для A/B теста (3 варианта)
6. Целевая аудитория — кому показывать
7. Антипозиционирование — чего избегать в тексте`;
      const r = await generate(prompt, AGENTS.metaads.system);
      setAdResult(r);
    } finally { setLoadingAd(false); }
  }

  async function handleGenerateTargeting() {
    setLoadingTgt(true); setTgtResult("");
    try {
      const plat = targetPlatform.split(" ").pop() ?? "Instagram";
      const prompt = `Создай план запуска таргетированной рекламы на ${plat}.
Продукт: ${offer.trim() || "продюсерский центр для экспертов"}
ГЕО: Россия, Казахстан, Беларусь, Украина (русскоязычные)
Возраст: 22–42 года

Включи:
1. Аудитории (холодная / тёплая / горячая / look-alike)
2. Бюджет на тест (дни 1–7)
3. Ad Sets структура (3 варианта)
4. Форматы объявлений
5. Расписание запуска по фазам
6. KPI метрики (CPM / CTR / CPL / ROAS)
7. Когда остановить объявление`;
      const r = await generate(prompt, AGENTS.metaads.system);
      setTgtResult(r);
    } finally { setLoadingTgt(false); }
  }

  return (
    <div className="space-y-4">
      {/* Format selector */}
      <div className="card space-y-3">
        <p className="text-xs font-semibold text-subtext uppercase tracking-wider">Формат креатива</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {AD_FORMATS.map((f) => (
            <button key={f.key} onClick={() => setFormat(f.key)}
              className={clsx(
                "flex flex-col items-start p-3 rounded-xl border transition-all text-left",
                format === f.key
                  ? "border-accent bg-accent/5 shadow-[0_0_12px_rgba(108,99,255,0.2)]"
                  : "border-border hover:border-border/80 bg-nav"
              )}>
              <span className="text-2xl mb-1">{f.icon}</span>
              <p className="text-xs font-semibold text-text">{f.label}</p>
              <p className="text-[10px] text-subtext/70 mt-0.5 leading-snug">{f.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Offer */}
      <div className="card space-y-3">
        <p className="text-xs font-semibold text-subtext uppercase tracking-wider">Продукт / Оффер *</p>
        <textarea rows={3} className="input w-full text-sm resize-none"
          placeholder="Аудит Instagram $150 — разбор за 48 часов, голосовой разбор + PDF…"
          value={offer} onChange={(e) => setOffer(e.target.value)} />
        <button onClick={handleGenerateAd} disabled={loadingAd || !offer.trim()}
          className="w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-xl bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 border border-pink-500/20 transition-colors font-medium">
          {loadingAd ? <><Loader2 size={13} className="animate-spin" /> Генерирую…</> : <><Megaphone size={13} /> Создать рекламный креатив</>}
        </button>
      </div>

      <ResultBox value={adResult} label={`Креатив · ${fmtLabel}`} />

      {/* Targeting plan */}
      <div className="card space-y-3">
        <p className="text-xs font-semibold text-subtext uppercase tracking-wider flex items-center gap-1.5">
          <span>📡</span> План таргета
        </p>
        <div className="flex flex-wrap gap-2">
          {TARGET_PLATFORMS.map((p) => (
            <Pill key={p} label={p} active={targetPlatform === p} onClick={() => setTargetPlatform(p)}
              color="bg-cyan-500/20 text-cyan-400 border-cyan-500/30" />
          ))}
        </div>
        <button onClick={handleGenerateTargeting} disabled={loadingTgt}
          className="w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors font-medium">
          {loadingTgt ? <><Loader2 size={13} className="animate-spin" /> Генерирую…</> : <><ChevronRight size={13} /> Создать план таргета</>}
        </button>
      </div>

      <ResultBox value={tgtResult} label={`Таргет · ${targetPlatform}`} />
    </div>
  );
}

// ── Tab: Content Plan ─────────────────────────────────────────────────────────
function ContentPlanTab() {
  const [niche, setNiche]         = useState("");
  const [audience, setAudience]   = useState("");
  const [count, setCount]         = useState("7");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState("");

  async function handleGenerate() {
    if (!niche.trim()) return;
    setLoading(true); setResult("");
    try {
      const prompt = `Создай контент-план на неделю (${count} постов).
Ниша: ${niche}
Аудитория: ${audience.trim() || "эксперты и предприниматели, 22–42 года"}

Для каждого поста укажи таблицей:
День | Платформа | Тип (Reels/Пост/Stories) | Тема | Хук (первые 3 сек) | CTA

Чередуй доминанты: экспертный → личная история → кейс → лайфстайл → продающий.
Используй систему AMAI MEDIA: 15+20+9 (из подкаста + broad + рекламный).
В конце добавь 3 готовых текста для ключевых постов.`;
      const r = await generate(prompt, AGENTS.smm.system);
      setResult(r);
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-subtext uppercase tracking-wider">Ниша *</label>
          <input className="input w-full text-sm"
            placeholder="Нутрициология, коучинг, дизайн, SMM, бизнес…"
            value={niche} onChange={(e) => setNiche(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-subtext uppercase tracking-wider">Целевая аудитория</label>
          <input className="input w-full text-sm"
            placeholder="Женщины 25–40, хотят зарабатывать онлайн…"
            value={audience} onChange={(e) => setAudience(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-subtext uppercase tracking-wider">Постов в неделю</label>
          <div className="flex gap-2">
            {["3", "5", "7", "10", "14"].map((n) => (
              <Pill key={n} label={n} active={count === n} onClick={() => setCount(n)}
                color="bg-accent/20 text-accent border-accent/30" />
            ))}
          </div>
        </div>
        <button onClick={handleGenerate} disabled={loading || !niche.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5">
          {loading ? <><Loader2 size={13} className="animate-spin" /> Генерирую…</> : <><CalendarDays size={13} /> Создать контент-план</>}
        </button>
      </div>
      <ResultBox value={result} label={`Контент-план на ${count} постов · ${niche}`} />
    </div>
  );
}

// ── Tab: Bot Chains ───────────────────────────────────────────────────────────
function BotChainsTab() {
  const [chain, setChain]       = useState("warm7");
  const [product, setProduct]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState("");

  const chainNames: Record<string, string> = {
    warm7:   "прогрев 7 дней",
    sell5:   "продающая серия 5 сообщений",
    welcome: "welcome цепочка",
    call:    "воронка на созвон",
    onboard: "онбординг нового клиента",
  };

  async function handleGenerate() {
    if (!product.trim()) return;
    setLoading(true); setResult("");
    try {
      const chainName = chainNames[chain] ?? chain;
      const prompt = `Создай ${chainName} для Telegram бота (SendPulse / ManyChat).
Продукт: ${product}

Для каждого сообщения укажи:
СООБЩЕНИЕ N | День/интервал отправки
---
Текст сообщения (живой, разговорный, без спама)
CTA: кодовое слово или кнопка

Правила:
- Стиль: тепло, по-человечески, без давления
- Каждое сообщение заканчивается одним CTA
- Не спамить — полезно на каждом шаге
- Квалификационные вопросы в начале (3 вопроса)`;
      const r = await generate(prompt, AGENTS.botbuilder.system);
      setResult(r);
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-subtext uppercase tracking-wider">Тип цепочки</p>
          <div className="flex flex-wrap gap-2">
            {BOT_CHAINS.map((c) => (
              <button key={c.key} onClick={() => setChain(c.key)}
                className={clsx(
                  "text-xs px-3 py-1.5 rounded-full border transition-all",
                  chain === c.key ? c.color : "bg-nav text-subtext border-border hover:text-text"
                )}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-subtext uppercase tracking-wider">Продукт для продажи *</label>
          <textarea rows={3} className="input w-full text-sm resize-none"
            placeholder="Наставничество $1,500 — 3 месяца, 5 мест в месяц. Помогаю экспертам выстроить системный бизнес…"
            value={product} onChange={(e) => setProduct(e.target.value)} />
        </div>

        <button onClick={handleGenerate} disabled={loading || !product.trim()}
          className="w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-xl bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20 transition-colors font-medium">
          {loading ? <><Loader2 size={13} className="animate-spin" /> Генерирую…</> : <><Bot size={13} /> Создать цепочку</>}
        </button>
      </div>
      <ResultBox value={result} label={`${BOT_CHAINS.find(c => c.key === chain)?.label ?? chain}`} />
    </div>
  );
}

// ── Tab: Auto Clips (Opus Clip) ───────────────────────────────────────────────
const CLIP_LENGTHS  = ["0-30",   "30-90",  "90-180"] as const;
const CLIP_RATIOS   = ["9:16",   "1:1",    "16:9"]   as const;
const CLIP_LABELS: Record<string, string> = {
  "0-30": "До 30 сек",  "30-90": "30–90 сек",  "90-180": "90–180 сек",
  "9:16": "Reels/Shorts (9:16)", "1:1": "Квадрат (1:1)", "16:9": "YouTube (16:9)",
};

type ClipStatus = "idle" | "processing" | "done" | "error";
interface OpusClip {
  id:            string;
  title:         string;
  duration:      number;
  virality_score:number;
  download_url:  string;
  thumbnail_url: string;
  hook:          string;
  transcript:    string;
}

function AutoClipsTab() {
  const [url,         setUrl]        = useState("");
  const [clipLength,  setClipLength] = useState<typeof CLIP_LENGTHS[number]>("30-90");
  const [ratio,       setRatio]      = useState<typeof CLIP_RATIOS[number]>("9:16");
  const [status,      setStatus]     = useState<ClipStatus>("idle");
  const [progress,    setProgress]   = useState(0);
  const [projectId,   setProjectId]  = useState("");
  const [clips,       setClips]      = useState<OpusClip[]>([]);
  const [error,       setError]      = useState("");
  const [socialCopy,  setSocialCopy] = useState<Record<string, { caption: string; hashtags: string[] }>>({});
  const [loadingSocial, setLoadingSocial] = useState<Record<string, boolean>>({});
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // ── Start clipping ────────────────────────────────────────────────────────
  async function handleStart() {
    if (!url.trim()) return;
    setStatus("processing"); setError(""); setClips([]); setProgress(5);

    const res = await fetch("/api/opus/clip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video_url: url, language: "ru", clip_length: clipLength, aspect_ratio: ratio }),
    });
    const data = await res.json();
    if (!res.ok || data.detail) { setStatus("error"); setError(data.detail ?? "Ошибка"); return; }

    const pid = data.id ?? data.project_id ?? data.clipId;
    setProjectId(pid);

    // Poll every 8 seconds
    pollRef.current = setInterval(async () => {
      const r  = await fetch(`/api/opus/project/${pid}`);
      const d  = await r.json();
      if (d.detail) { setStatus("error"); setError(d.detail); clearInterval(pollRef.current!); return; }

      setProgress(d.progress ?? 50);

      if (d.status === "completed" || d.status === "done") {
        clearInterval(pollRef.current!);
        setClips(d.clips ?? []);
        setStatus("done");
        setProgress(100);
      } else if (d.status === "failed") {
        clearInterval(pollRef.current!);
        setStatus("error");
        setError("Opus Clip не смог обработать видео");
      }
    }, 8000);
  }

  // ── Get social copy for a clip ────────────────────────────────────────────
  async function loadSocialCopy(clipId: string) {
    setLoadingSocial(p => ({ ...p, [clipId]: true }));
    const res  = await fetch("/api/opus/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clip_id: clipId }),
    });
    const data = await res.json();
    if (!data.detail) setSocialCopy(p => ({ ...p, [clipId]: data }));
    setLoadingSocial(p => ({ ...p, [clipId]: false }));
  }

  // ── Score colour ──────────────────────────────────────────────────────────
  function scoreColor(s: number) {
    if (s >= 80) return "text-green-400 bg-green-400/10";
    if (s >= 55) return "text-yellow-400 bg-yellow-400/10";
    return "text-subtext bg-white/5";
  }

  return (
    <div className="space-y-4">
      {/* Input card */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center">
            <Scissors size={13} className="text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">Opus Clip — AI автонарезка</p>
            <p className="text-xs text-subtext">Вставь ссылку на YouTube/TikTok/Loom → AI найдёт лучшие моменты</p>
          </div>
        </div>

        {/* URL */}
        <div>
          <label className="text-xs text-subtext block mb-1.5">Ссылка на видео *</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtext/50" />
              <input
                className="input w-full pl-8 text-sm"
                placeholder="https://youtu.be/... или https://www.tiktok.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleStart(); }}
              />
            </div>
          </div>
        </div>

        {/* Settings row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-subtext block mb-1.5">Длина клипов</label>
            <div className="flex gap-1.5 flex-wrap">
              {CLIP_LENGTHS.map((l) => (
                <button key={l} onClick={() => setClipLength(l)}
                  className={clsx("text-xs px-2.5 py-1 rounded-lg border transition-all",
                    clipLength === l
                      ? "bg-accent/20 text-accent border-accent/40"
                      : "bg-nav text-subtext border-border hover:text-text")}>
                  {CLIP_LABELS[l]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-subtext block mb-1.5">Соотношение сторон</label>
            <div className="flex gap-1.5 flex-wrap">
              {CLIP_RATIOS.map((r) => (
                <button key={r} onClick={() => setRatio(r)}
                  className={clsx("text-xs px-2.5 py-1 rounded-lg border transition-all",
                    ratio === r
                      ? "bg-accent/20 text-accent border-accent/40"
                      : "bg-nav text-subtext border-border hover:text-text")}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={!url.trim() || status === "processing"}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent hover:bg-accent/90 disabled:opacity-50 text-white text-sm font-semibold transition-all">
          {status === "processing"
            ? <><Loader2 size={14} className="animate-spin" />Обрабатываю…</>
            : <><Scissors size={14} />Нарезать клипы</>}
        </button>
      </div>

      {/* Progress */}
      {status === "processing" && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text flex items-center gap-2">
              <Loader2 size={13} className="animate-spin text-accent" />
              Opus Clip анализирует видео…
            </p>
            <span className="text-xs text-accent font-mono">{progress}%</span>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-purple-400 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-subtext">
            AI ищет вирусные моменты, расставляет субтитры и эмодзи. Обычно 2–5 минут.
          </p>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="card border-red-500/30 bg-red-500/5 flex items-start gap-2">
          <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-400 font-medium">Ошибка обработки</p>
            <p className="text-xs text-subtext mt-0.5">{error}</p>
            <button onClick={() => setStatus("idle")} className="text-xs text-accent hover:underline mt-1">
              Попробовать снова
            </button>
          </div>
        </div>
      )}

      {/* Clips grid */}
      {status === "done" && clips.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-text">
              🎬 Готово — {clips.length} клипов
            </p>
            <button onClick={() => setStatus("idle")} className="btn-ghost text-xs flex items-center gap-1">
              <RefreshCw size={11} /> Новое видео
            </button>
          </div>

          {clips
            .sort((a, b) => b.virality_score - a.virality_score)
            .map((clip) => (
              <div key={clip.id} className="card space-y-3">
                {/* Clip header */}
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  {clip.thumbnail_url ? (
                    <img src={clip.thumbnail_url} alt=""
                      className="w-16 h-28 object-cover rounded-lg shrink-0 bg-nav" />
                  ) : (
                    <div className="w-16 h-28 rounded-lg bg-nav flex items-center justify-center shrink-0">
                      <Play size={18} className="text-subtext/40" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-text leading-snug line-clamp-2">{clip.title}</p>
                      <span className={clsx("text-xs px-2 py-0.5 rounded-full font-bold shrink-0 flex items-center gap-1", scoreColor(clip.virality_score))}>
                        <Star size={9} /> {clip.virality_score}
                      </span>
                    </div>

                    <p className="text-xs text-subtext">{clip.duration}с · {ratio}</p>

                    {clip.hook && (
                      <div className="bg-accent/5 border border-accent/20 rounded-lg p-2">
                        <p className="text-[10px] text-accent font-semibold uppercase tracking-wider mb-0.5">Хук</p>
                        <p className="text-xs text-text/80 leading-relaxed">{clip.hook}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {clip.download_url && (
                        <a href={clip.download_url} download
                          className="flex items-center gap-1 text-xs bg-accent/10 hover:bg-accent/20 text-accent px-2.5 py-1.5 rounded-lg transition-colors">
                          <Download size={11} /> Скачать
                        </a>
                      )}
                      {clip.download_url && (
                        <a href={clip.download_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs bg-white/5 hover:bg-white/10 text-subtext hover:text-text px-2.5 py-1.5 rounded-lg transition-colors">
                          <ExternalLink size={11} /> Открыть
                        </a>
                      )}
                      <button
                        onClick={() => loadSocialCopy(clip.id)}
                        disabled={loadingSocial[clip.id]}
                        className="flex items-center gap-1 text-xs bg-white/5 hover:bg-white/10 text-subtext hover:text-text px-2.5 py-1.5 rounded-lg transition-colors">
                        {loadingSocial[clip.id]
                          ? <Loader2 size={11} className="animate-spin" />
                          : <Zap size={11} />}
                        Caption + хэштеги
                      </button>
                    </div>
                  </div>
                </div>

                {/* Social copy */}
                {socialCopy[clip.id] && (
                  <div className="border-t border-border pt-3 space-y-2">
                    <p className="text-[10px] font-semibold text-subtext uppercase tracking-wider">Описание для публикации</p>
                    <div className="bg-nav rounded-lg p-2.5 text-xs text-text/80 leading-relaxed whitespace-pre-wrap">
                      {socialCopy[clip.id].caption}
                    </div>
                    {socialCopy[clip.id].hashtags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {socialCopy[clip.id].hashtags.map((h) => (
                          <span key={h} className="text-[11px] text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                            {h.startsWith("#") ? h : `#${h}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Transcript preview */}
                {clip.transcript && (
                  <details className="text-xs text-subtext">
                    <summary className="cursor-pointer hover:text-text transition-colors select-none">
                      📝 Транскрипция
                    </summary>
                    <p className="mt-2 leading-relaxed text-text/70 bg-nav rounded-lg p-2.5 max-h-24 overflow-y-auto">
                      {clip.transcript}
                    </p>
                  </details>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Empty state */}
      {status === "done" && clips.length === 0 && (
        <div className="card text-center py-10 text-subtext space-y-2">
          <Scissors size={28} className="mx-auto text-subtext/30" />
          <p className="text-sm">Клипы не найдены. Попробуй другое видео или длину клипов.</p>
          <button onClick={() => setStatus("idle")} className="btn-ghost text-xs">← Назад</button>
        </div>
      )}

      {/* Setup hint */}
      {status === "idle" && !url && (
        <div className="card border-dashed border-accent/20 text-center py-6 space-y-1">
          <p className="text-xs text-subtext">
            Нужен API ключ Opus Clip →{" "}
            <a href="https://www.opus.pro/api" target="_blank" rel="noopener noreferrer"
              className="text-accent hover:underline inline-flex items-center gap-0.5">
              opus.pro/api <ExternalLink size={10} />
            </a>
          </p>
          <p className="text-[11px] text-subtext/60">Добавь <code className="bg-nav px-1 rounded text-accent">OPUS_KEY=...</code> в .env</p>
        </div>
      )}
    </div>
  );
}

// ── Tab: Video Hooks & Cut Plan ───────────────────────────────────────────────
function VideoHooksTab() {
  const [mode, setMode]         = useState<"hooks" | "cutplan">("hooks");
  const [topic, setTopic]       = useState("");
  const [niche, setNiche]       = useState("");
  const [platform, setPlatform] = useState("Instagram/TikTok");
  const [goal, setGoal]         = useState("подписка");
  const [videoUrl, setVideoUrl] = useState("");
  const [clipsCount, setClipsCount] = useState(5);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState("");

  async function handleGenerate() {
    if (!topic.trim() && !videoUrl.trim()) return;
    setLoading(true); setResult("");
    try {
      const action = mode === "hooks" ? "videoHooks" : "videoCutPlan";
      const res = await fetch("/api/hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          data: mode === "hooks"
            ? { topic, niche, platform, goal }
            : { topic, niche, videoUrl, clipsCount, platform },
        }),
      });
      const json = await res.json();
      setResult(json.result ?? "Ошибка генерации.");
    } catch {
      setResult("Ошибка. Проверьте API-ключ.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        {[
          { id: "hooks",   label: "🎣 Хуки и наложения" },
          { id: "cutplan", label: "✂️ План нарезки"     },
        ].map((m) => (
          <button key={m.id} onClick={() => { setMode(m.id as any); setResult(""); }}
            className={clsx(
              "text-xs px-4 py-2 rounded-xl border font-medium transition-colors",
              mode === m.id ? "bg-accent/20 border-accent/40 text-accent" : "border-border text-subtext hover:border-accent/30"
            )}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="card p-4 space-y-3">
        <p className="text-sm font-semibold text-text">
          {mode === "hooks" ? "🎣 Генератор хуков и текстовых наложений" : "✂️ Техзадание для нарезки видео"}
        </p>

        {mode === "cutplan" && (
          <div className="space-y-1.5">
            <label className="text-[10px] text-subtext uppercase tracking-wide">URL видео (YouTube, Loom, Drive)</label>
            <input className="input w-full text-sm" placeholder="https://youtube.com/watch?v=..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] text-subtext uppercase tracking-wide">Тема видео</label>
            <input className="input w-full text-sm" placeholder="Как я вышел на $10K в месяц..." value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-subtext uppercase tracking-wide">Ниша</label>
            <input className="input w-full text-sm" placeholder="маркетинг, коучинг..." value={niche} onChange={(e) => setNiche(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] text-subtext uppercase tracking-wide">Платформа</label>
            <select className="input w-full text-sm" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              <option>Instagram/TikTok</option>
              <option>YouTube Shorts</option>
              <option>Telegram</option>
              <option>Facebook Reels</option>
            </select>
          </div>
          {mode === "hooks" ? (
            <div className="space-y-1.5">
              <label className="text-[10px] text-subtext uppercase tracking-wide">Цель</label>
              <select className="input w-full text-sm" value={goal} onChange={(e) => setGoal(e.target.value)}>
                <option value="подписка">Подписка</option>
                <option value="продажа мини-продукта">Продажа мини-продукта</option>
                <option value="переход в Telegram">Переход в Telegram</option>
                <option value="запись на консультацию">Запись на консультацию</option>
                <option value="вирусный охват">Вирусный охват</option>
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-[10px] text-subtext uppercase tracking-wide">Кол-во клипов</label>
              <select className="input w-full text-sm" value={clipsCount} onChange={(e) => setClipsCount(Number(e.target.value))}>
                {[3,5,7,10].map(n => <option key={n} value={n}>{n} клипов</option>)}
              </select>
            </div>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || (!topic.trim() && !videoUrl.trim())}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 size={13} className="animate-spin" /> Генерируем…</> : <><Zap size={13} /> {mode === "hooks" ? "Создать хуки и наложения" : "Создать план нарезки"}</>}
        </button>
      </div>

      <ResultBox value={result} label={mode === "hooks" ? "Хуки + текстовые наложения" : "Техзадание для монтажёра"} />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: "create", label: "✍️ Создать текст",  icon: <FileText   size={13} /> },
  { id: "ads",    label: "📢 Реклама",         icon: <Megaphone  size={13} /> },
  { id: "plan",   label: "📅 Контент-план",    icon: <CalendarDays size={13} /> },
  { id: "bot",    label: "🤖 Бот-цепочки",     icon: <Bot        size={13} /> },
  { id: "hooks",  label: "🎣 Хуки / Нарезка",  icon: <Scissors   size={13} /> },
  { id: "clips",  label: "✂️ Auto Clips",      icon: <Scissors   size={13} /> },
] as const;

export default function StudioPage() {
  const [tab, setTab] = useState<typeof TABS[number]["id"]>("create");

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text">Студия контента</h1>
        <p className="text-sm text-subtext mt-0.5">
          AI генерация текстов, рекламных креативов, контент-планов, бот-цепочек и автонарезка видео
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto bg-nav p-1.5 rounded-xl">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={clsx(
              "flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-lg transition-all whitespace-nowrap shrink-0",
              tab === t.id
                ? "bg-accent text-white font-medium shadow"
                : "text-subtext hover:text-text"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === "create" && <CreateTextTab />}
        {tab === "ads"    && <AdsTab />}
        {tab === "plan"   && <ContentPlanTab />}
        {tab === "bot"    && <BotChainsTab />}
        {tab === "hooks"  && <VideoHooksTab />}
        {tab === "clips"  && <AutoClipsTab />}
      </div>
    </div>
  );
}
