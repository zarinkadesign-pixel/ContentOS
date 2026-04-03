/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. lib/gemini.ts
 *
 * Groq API wrapper — supports GROQ_KEY or GROQ_API_KEY env vars.
 * Includes specialized shortcut generators for Studio/Hub pages.
 */

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";

export const GROQ_MODELS = {
  fast:    "llama-3.1-8b-instant",       // ~100 tok/s — простые задачи
  default: "llama-3.3-70b-versatile",    // баланс скорость/качество
  long:    "mixtral-8x7b-32768",         // 32k контекст
  smart:   "llama-3.1-70b-specdec",      // speculative decoding
} as const;

type ModelKey = keyof typeof GROQ_MODELS;

function getKey(): string {
  return process.env.GROQ_KEY ?? process.env.GROQ_API_KEY ?? "";
}

// ── Smart model router ─────────────────────────────────────────────────────────
// Selects the right model based on task complexity to balance speed vs quality
export function routeModel(hint: "fast" | "default" | "long" | "smart", promptLen: number): ModelKey {
  if (hint !== "default") return hint;
  if (promptLen > 8000)  return "long";   // long context → mixtral 32k
  if (promptLen > 2000)  return "default"; // medium → llama 70b
  return "fast";                           // short → llama 8b (instant)
}

// ── Core call ──────────────────────────────────────────────────────────────────
export async function callGemini(
  system: string,
  prompt: string,
  maxTokens = 3000,
  model: ModelKey = "default",
  temperature = 0.8,
): Promise<string> {
  const key = getKey();
  if (!key) return "⚠️ GROQ_KEY не задан в переменных окружения.";

  // Auto-route: pick the optimal model if hint is "default"
  const resolvedModel = routeModel(model, (system + prompt).length);

  const body = {
    model:       GROQ_MODELS[resolvedModel],
    messages:    [
      { role: "system", content: system },
      { role: "user",   content: prompt },
    ],
    temperature,
    max_tokens:  maxTokens,
  };

  try {
    const res = await fetch(GROQ_API, {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(45_000),
    });

    if (res.status === 429) return "⚠️ Лимит Groq API. Попробуй через минуту.";
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return `⚠️ Ошибка Groq ${res.status}: ${(err as any)?.error?.message ?? res.statusText}`;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "Нет ответа от модели.";
  } catch (e: any) {
    if (e.name === "TimeoutError") return "⚠️ Groq не ответил за 45 сек. Повтори запрос.";
    return `⚠️ Ошибка: ${e.message}`;
  }
}

// ── Streaming call — returns ReadableStream of SSE chunks ─────────────────────
// Each chunk: { type: "delta", text: string } | { type: "done" } | { type: "error", message: string }
export async function callGeminiStream(
  system: string,
  prompt: string,
  maxTokens = 3000,
  model: ModelKey = "default",
  temperature = 0.8,
): Promise<ReadableStream<Uint8Array>> {
  const key = getKey();
  const encoder = new TextEncoder();

  function sseChunk(data: object): Uint8Array {
    return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
  }

  if (!key) {
    return new ReadableStream({
      start(c) {
        c.enqueue(sseChunk({ type: "error", message: "GROQ_KEY не задан." }));
        c.close();
      },
    });
  }

  const resolvedModel = routeModel(model, (system + prompt).length);

  const groqRes = await fetch(GROQ_API, {
    method:  "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body:    JSON.stringify({
      model:       GROQ_MODELS[resolvedModel],
      messages:    [{ role: "system", content: system }, { role: "user", content: prompt }],
      temperature,
      max_tokens:  maxTokens,
      stream:      true,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!groqRes.ok || !groqRes.body) {
    const errText = await groqRes.text().catch(() => groqRes.statusText);
    return new ReadableStream({
      start(c) {
        c.enqueue(sseChunk({ type: "error", message: `Groq ${groqRes.status}: ${errText.slice(0, 200)}` }));
        c.close();
      },
    });
  }

  // Pipe Groq SSE → our SSE format
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader  = groqRes.body!.getReader();
      const decoder = new TextDecoder();
      let   buf     = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") {
              controller.enqueue(sseChunk({ type: "done" }));
              continue;
            }
            try {
              const json  = JSON.parse(raw);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(sseChunk({ type: "delta", text: delta }));
            } catch { /* skip malformed */ }
          }
        }
        controller.enqueue(sseChunk({ type: "done" }));
      } catch (e: any) {
        controller.enqueue(sseChunk({ type: "error", message: e.message }));
      } finally {
        controller.close();
      }
    },
  });
}

// ── Specialized shortcut generators ───────────────────────────────────────────

/** 3 вирусных хука для Reels (быстро) */
export async function generateHook(topic: string): Promise<string> {
  return callGemini(
    "Ты топ-копирайтер вирального контента. Пишешь цепляющие хуки.",
    `Напиши 3 варианта хука для Reels на тему: "${topic}"\nКаждый хук — 1 предложение до 10 слов, останавливает скролл.\nФормат: 1. ... 2. ... 3. ...`,
    200, "fast", 0.9,
  );
}

/** Полный скрипт Reels / TikTok */
export async function generateReelsScript(opts: {
  topic: string;
  platform: "Reels" | "TikTok";
  tone: string;
  goal: string;
  extraContext?: string;
}): Promise<string> {
  const { topic, platform, tone, goal, extraContext = "" } = opts;
  return callGemini(
    "Ты топ-копирайтер в нише онлайн-образования. Пишешь вирусные скрипты.",
    `Создай ${platform} скрипт.
Тема: ${topic}
Тон: ${tone}
Цель: ${goal}
${extraContext ? `Контекст: ${extraContext}` : ""}

Структура:
ХУК (0-3 сек): [текст + действие]
КОНТЕНТ (4-45 сек): [3 пункта пользы, каждый 1-2 предложения]
CTA (46-60 сек): [конкретное действие]
ПОДПИСЬ: [до 100 слов + 5 хэштегов]`,
    800, "default", 0.75,
  );
}

/** Продающий пост */
export async function generateSalesPost(opts: {
  product: string;
  platform: string;
  audience: string;
  price: string | number;
}): Promise<string> {
  const { product, platform, audience, price } = opts;
  return callGemini(
    "Ты эксперт по direct-response копирайтингу. Пишешь конвертирующие тексты.",
    `Продающий пост для ${platform}.
Продукт: ${product}
Цена: ${price}
Аудитория: ${audience}

Используй формулу: Боль → Агитация → Решение → Оффер → CTA
Живой язык, без шаблонных фраз. До 300 слов.`,
    600, "default", 0.75,
  );
}

/** Контент-план в JSON */
export async function generateContentPlan(opts: {
  niche: string;
  audience: string;
  postsCount: number;
  platforms: string[];
}): Promise<Record<string, unknown>[]> {
  const { niche, audience, postsCount, platforms } = opts;
  const raw = await callGemini(
    "Ты контент-стратег. Всегда отвечаешь ТОЛЬКО валидным JSON без markdown.",
    `Контент-план: ${postsCount} постов, ниша "${niche}", аудитория "${audience}", платформы: ${platforms.join(", ")}.
Верни JSON массив:
[{"day":"Пн","platform":"...","type":"Reels|Пост|Stories","topic":"...","hook":"...","cta":"...","tone":"..."}]`,
    2000, "default", 0.6,
  );
  try { return JSON.parse(raw.replace(/```json|```/g, "").trim()); }
  catch { return []; }
}

/** Цепочка Telegram-сообщений в JSON */
export async function generateBotChain(opts: {
  chainType: string;
  product: string;
  messagesCount?: number;
}): Promise<Record<string, unknown>[]> {
  const { chainType, product, messagesCount = 7 } = opts;
  const raw = await callGemini(
    "Ты эксперт по чат-маркетингу. Отвечаешь ТОЛЬКО валидным JSON без markdown.",
    `Создай цепочку "${chainType}" из ${messagesCount} сообщений для Telegram-бота.
Продукт: ${product}

Верни JSON массив:
[{"day":1,"title":"...","text":"...","cta":"...","button_text":"..."}]
Тексты живые, без давления, до 150 слов каждое.`,
    3000, "default", 0.7,
  );
  try { return JSON.parse(raw.replace(/```json|```/g, "").trim()); }
  catch { return []; }
}

// ── Full client context for AI agents ─────────────────────────────────────────
export function buildClientContext(client: any): string {
  const products = Array.isArray(client.products)
    ? client.products.map((p: any) => typeof p === "string" ? p : `${p.name ?? p} ($${p.price ?? "?"})`)
                     .join(", ")
    : "не указаны";

  const checklist = client.checklist
    ? Object.entries(client.checklist as Record<string, boolean>)
        .map(([k, v]) => `${v ? "✅" : "⬜"} ${k}`)
        .join(", ")
    : "нет";

  const alerts = Array.isArray(client.alerts) && client.alerts.length
    ? client.alerts.join("; ")
    : "нет";

  const journeyStep = client.journey_step ?? 0;
  const stages = ["Онбординг", "Распаковка", "Продукты", "Воронка",
                  "Контент-план", "Подкаст", "Авто-нарезка", "Реклама", "Аналитика"];
  const currentStage = stages[journeyStep - 1] ?? "не начат";

  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ПРОФИЛЬ КЛИЕНТА: ${client.name}
Ниша: ${client.niche ?? "—"}
Контакт: ${client.contact ?? "—"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 МЕТРИКИ
• Подписчиков: ${(client.followers ?? 0).toLocaleString("ru")}
• Охват: ${(client.reach ?? 0).toLocaleString("ru")}
• Вовлечённость (ER): ${client.engagement ?? 0}%
• Доход сейчас: $${(client.income_now ?? 0).toLocaleString("ru")}/мес
• Цель по доходу: $${(client.income_goal ?? 0).toLocaleString("ru")}/мес
• Разрыв А→Б: $${((client.income_goal ?? 0) - (client.income_now ?? 0)).toLocaleString("ru")}/мес

🎭 БРЕНД И ЛИЧНОСТЬ
• Тон и стиль: ${client.personality ?? "не определён"}
• УТП / Позиционирование: ${client.strategy ?? "не задано"}

📦 ПРОДУКТОВАЯ ЛИНЕЙКА
${products}

🌀 ВОРОНКА ПРОДАЖ
${client.funnel ?? "не настроена"}

📋 КОНТЕНТ-ПЛАН
${client.content_plan ?? "не составлен"}

🗺 КАРТА БИЗНЕСА
• Текущий этап: ${journeyStep}/9 — ${currentStage}
• Чеклист: ${checklist}

⚠️ АЛЕРТЫ
${alerts}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`.trim();
}
