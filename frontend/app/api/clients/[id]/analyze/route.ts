import { NextRequest, NextResponse } from "next/server";
import { getClients, saveClients, getAutomationRuns } from "@/lib/kv";
import { callGemini, buildClientContext } from "@/lib/gemini";
import { isDemoRequest } from "@/lib/demo-guard";

const ANALYZE_SYSTEM = `Ты — AI-аналитик онлайн-продюсерского центра AMAI MEDIA.
Проанализируй профиль клиента и создай список конкретных задач.
Верни ТОЛЬКО валидный JSON массив без пояснений:
[{"title":"Название задачи","done":false},...]
Требования:
- 8-15 конкретных задач
- Учитывай нишу клиента, текущий этап, что уже заполнено
- Задачи: онбординг, контент, воронка, реклама, аналитика, монетизация
- Отмечай как done:true только то, что реально выполнено (поля заполнены)`;

const DEMO_TASKS = [
  { title: "Завершить онбординг клиента", done: true },
  { title: "Провести распаковку бренда", done: true },
  { title: "Настроить продуктовую линейку", done: false },
  { title: "Создать воронку продаж", done: false },
  { title: "Разработать контент-план на месяц", done: false },
  { title: "Записать первый подкаст-эпизод", done: false },
  { title: "Настроить автоклипы из лонгридов", done: false },
  { title: "Запустить таргетированную рекламу", done: false },
  { title: "Настроить аналитику и дашборд", done: false },
  { title: "Провести 3 тест-продажи нового продукта", done: false },
];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Demo guard
  if (isDemoRequest(req)) {
    return NextResponse.json({ tasks: DEMO_TASKS });
  }

  // Load client
  const clients = await getClients();
  const client = clients.find((c: any) => c.id === id);
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Load automation runs for this client
  const allRuns = await getAutomationRuns();
  const clientRuns = allRuns.filter((r) => r.client_id === id);

  // Build base context
  const baseContext = buildClientContext(client);

  // Build completeness summary
  const filled: string[] = [];
  const missing: string[] = [];
  for (const field of ["personality", "strategy", "content_plan", "funnel", "products"] as const) {
    const val = client[field];
    const hasValue = Array.isArray(val) ? val.length > 0 : typeof val === "string" && val.trim().length > 0;
    (hasValue ? filled : missing).push(field);
  }

  const checklistItems = Object.entries(client.checklist ?? {})
    .map(([k, v]) => `${v ? "✅" : "⬜"} ${k}`)
    .join("\n");

  // Which automation results are available
  const availableResults: string[] = [];
  for (const run of clientRuns) {
    for (const step of run.steps) {
      if (step.status === "done" && step.result) {
        availableResults.push(step.worker_id);
      }
    }
  }

  const completeness = `
━━━ ЗАПОЛНЕННОСТЬ ПРОФИЛЯ ━━━
Заполнено: ${filled.join(", ") || "ничего"}
Не заполнено: ${missing.join(", ") || "всё заполнено"}

━━━ ЧЕКЛИСТ ━━━
${checklistItems || "пуст"}

━━━ РЕЗУЛЬТАТЫ АВТОПИЛОТА ━━━
Доступны: ${availableResults.length > 0 ? [...new Set(availableResults)].join(", ") : "нет"}
`;

  const fullPrompt = `${baseContext}\n\n${completeness}`;

  const raw = await callGemini(ANALYZE_SYSTEM, fullPrompt);

  // Strip markdown code blocks if present
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  try {
    const tasks: { title: string; done: boolean }[] = JSON.parse(stripped);
    return NextResponse.json({ tasks });
  } catch {
    // Try extracting JSON array from anywhere in the string
    const match = stripped.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const tasks: { title: string; done: boolean }[] = JSON.parse(match[0]);
        return NextResponse.json({ tasks });
      } catch {
        // fall through
      }
    }
    return NextResponse.json({ tasks: [] });
  }
}
