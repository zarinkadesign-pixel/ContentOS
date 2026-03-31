const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export async function callGemini(system: string, prompt: string): Promise<string> {
  const key = process.env.GEMINI_KEY;
  if (!key) return "⚠️ GEMINI_KEY не задан в переменных окружения.";

  const body = {
    system_instruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.8, maxOutputTokens: 2000 },
  };

  try {
    const res = await fetch(`${GEMINI_API}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });

    if (res.status === 429) return "⚠️ Лимит Gemini API. Попробуй через минуту.";
    if (!res.ok) return `⚠️ Ошибка Gemini: ${res.status}`;

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Нет ответа от модели.";
  } catch (e: any) {
    return `⚠️ Ошибка: ${e.message}`;
  }
}

export function buildClientContext(client: any): string {
  return `
Клиент: ${client.name}
Ниша: ${client.niche}
Аудитория: ${client.followers ?? 0} подписчиков, охват ${client.reach ?? 0}
Доход сейчас: $${client.income_now ?? 0}/мес, цель: $${client.income_goal ?? 0}/мес
Личность бренда: ${client.personality ?? "не указана"}
Продукты: ${(client.products ?? []).join(", ") || "не указаны"}
Воронка: ${client.funnel ?? "не настроена"}
Стратегия: ${client.strategy ?? "не задана"}
`.trim();
}
