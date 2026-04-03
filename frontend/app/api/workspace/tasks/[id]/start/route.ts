import { NextRequest, NextResponse } from "next/server";
import { getTasks, saveTasks, getClients, saveClients, getAgentKnowledge } from "@/lib/kv";
import { callGemini, buildClientContext } from "@/lib/gemini";
import { AGENTS } from "@/lib/agents";
import { demoWriteGuard } from "@/lib/demo-guard";

// ── Worker field map: which client field gets the AI result ───────────────────
const WORKER_FIELD: Record<string, string> = {
  copywriter:  "content_pack",
  strategist:  "strategy",
  metaads:     "ad_creatives",
  smm:         "content_plan",
  sales:       "sales_script",
  analyst:     "analytics_report",
  producer:    "producer_plan",
  businessmap: "business_map",
};

// ── Task keyword classifier ───────────────────────────────────────────────────
function classifyTask(title: string, description: string): string {
  const text = `${title} ${description ?? ""}`.toLowerCase();

  if (/контент|reels|рилс|пост|видео|сторис|контент-план|тексты|скрипт/.test(text)) return "copywriter";
  if (/стратег|план а|позиционир|рост доход|масштаб|развитие/.test(text))             return "strategist";
  if (/реклам|таргет|meta ads|объявлени|ads|промо/.test(text))                         return "metaads";
  if (/анализ|аналит|метрик|отчёт|статистик|kpi|показател/.test(text))                return "analyst";
  if (/воронк|конверс|закрыт|сделк|продаж|лид/.test(text))                            return "sales";
  if (/смм|smm|публикац|посев|продвиж|охват|instagram|telegram/.test(text))           return "smm";
  if (/бизнес.?карт|путь клиент|этап|journey|дорожн/.test(text))                     return "businessmap";

  return "producer";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Load task first (needed even in demo mode for the mock message)
  const tasks = await getTasks();
  const idx   = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  const task = tasks[idx];

  // ── Demo guard ───────────────────────────────────────────────────────────────
  const demoGuard = demoWriteGuard(req);
  if (demoGuard) {
    return NextResponse.json({
      result: `✅ Демо-режим: AI выполнил задачу «${task.title}».\n\nВ реальном режиме здесь будет развёрнутый результат от AI-сотрудника на основе данных вашего клиента.`,
      worker_id:    "producer",
      worker_name:  "Продюсер",
      client_name:  "Алина Мороз",
      client_field: null,
      ai_status:    "done",
    });
  }

  // ── Classify task to determine which agent to use ────────────────────────────
  const workerId = classifyTask(task.title, task.description ?? "");
  const agent = (AGENTS[workerId] ?? AGENTS["producer"]) as { name: string; system: string; prompt: string };

  // ── Find matching client by scanning task title + description ────────────────
  const allClients = await getClients();
  let matchedClient: any | null = null;
  let matchedClientIndex = -1;

  if (allClients.length > 0) {
    const textToSearch = `${task.title} ${task.description ?? ""}`.toLowerCase();
    for (let i = 0; i < allClients.length; i++) {
      const c = allClients[i];
      if (c.name && textToSearch.includes(c.name.toLowerCase())) {
        matchedClient = c;
        matchedClientIndex = i;
        break;
      }
    }
    // Fallback to first client if no name matched
    if (!matchedClient) {
      matchedClient = allClients[0];
      matchedClientIndex = 0;
    }
  }

  // ── Build context ─────────────────────────────────────────────────────────────
  const clientCtx = matchedClient ? buildClientContext(matchedClient) : "";

  // ── Load agent knowledge base ─────────────────────────────────────────────────
  const knowledge = await getAgentKnowledge(workerId);
  const knowledgeBlock = knowledge.length > 0
    ? "\n\n━━━━ БАЗА ЗНАНИЙ ━━━━\n" + knowledge.map((k) => `### ${k.title}\n${k.content}`).join("\n\n")
    : "";

  const system = agent.system + knowledgeBlock;

  // ── Build prompt ──────────────────────────────────────────────────────────────
  const extra = `Задача: ${task.title}. Описание: ${task.description ?? "—"}. Выполни эту задачу полностью.`;
  const prompt = agent.prompt
    .replace("{context}", clientCtx)
    .replace("{extra}", extra);

  // ── Call AI ───────────────────────────────────────────────────────────────────
  const result = await callGemini(system, prompt);
  const aiStatus: "done" | "error" = result.startsWith("⚠️") ? "error" : "done";

  // ── Update task in KV ─────────────────────────────────────────────────────────
  tasks[idx] = {
    ...tasks[idx],
    status:          "in_progress",
    ai_result:       result,
    ai_worker:       workerId,
    ai_worker_name:  agent.name,
    ai_executed_at:  new Date().toISOString(),
    ai_client_id:    matchedClient?.id ?? null,
    ai_client_name:  matchedClient?.name ?? null,
    ai_status:       aiStatus,
  };
  await saveTasks(tasks);

  // ── Save result to matched client field (if result is good) ──────────────────
  const clientField = WORKER_FIELD[workerId] ?? null;
  if (matchedClient && matchedClientIndex !== -1 && aiStatus === "done" && clientField) {
    allClients[matchedClientIndex] = {
      ...allClients[matchedClientIndex],
      [clientField]: result,
    };
    await saveClients(allClients);
  }

  return NextResponse.json({
    result,
    worker_id:    workerId,
    worker_name:  agent.name,
    client_name:  matchedClient?.name ?? null,
    client_field: clientField,
    ai_status:    aiStatus,
  });
}
