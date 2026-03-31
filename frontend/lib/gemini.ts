const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export async function callGemini(system: string, prompt: string): Promise<string> {
  const key = process.env.GEMINI_KEY;
  if (!key) return "⚠️ GEMINI_KEY не задан в переменных окружения.";

  const body = {
    system_instruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.8, maxOutputTokens: 3000 },
  };

  try {
    const res = await fetch(`${GEMINI_API}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45_000),
    });

    if (res.status === 429) return "⚠️ Лимит Gemini API (1500/день). Попробуй через минуту.";
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return `⚠️ Ошибка Gemini ${res.status}: ${err?.error?.message ?? res.statusText}`;
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Нет ответа от модели.";
  } catch (e: any) {
    if (e.name === "TimeoutError") return "⚠️ Gemini не ответил за 45 сек. Повтори запрос.";
    return `⚠️ Ошибка: ${e.message}`;
  }
}

// ── Full client context for AI agents ────────────────────────────────────────
// Based on CONTENT_OS_MASTER — uses ALL available client fields
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

  // Journey progress
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
