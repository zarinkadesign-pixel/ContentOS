import { NextRequest, NextResponse } from "next/server";
import { getTeamTasks, saveTeamTasks, getClients, saveClients, getAgentKnowledge } from "@/lib/kv";
import { AGENTS } from "@/lib/agents";
import { callGemini, buildClientContext } from "@/lib/gemini";
import { randomUUID } from "crypto";
import { isDemoRequest, demoGetGuard } from "@/lib/demo-guard";

const DEMO_CLIENTS_MAP: Record<string, any> = {
  demo_1: { id: "demo_1", name: "Алина Мороз", niche: "Нутрициология", income_now: 8000, followers: 45000, reach: 12000, engagement: 4.2, personality: "Эксперт, тёплый тон", products: ["Марафон питания $97", "Менторинг $1500"], funnel: "Reels → подписка → гайд → созвон → оффер", strategy: "Образовательный контент + кейсы", content_plan: "Пн: совет по питанию\nСр: кейс клиента\nПт: Reels", checklist: {}, alerts: [], journey_step: 2 },
  demo_2: { id: "demo_2", name: "Максим Кузнецов", niche: "Фитнес-тренер", income_now: 3500, followers: 28000, reach: 7500, engagement: 3.8, personality: "Мотиватор, прямой тон", products: ["Онлайн-тренировки $49/мес", "Персональный план $297"], funnel: "Reels → ссылка в bio → лендинг → продажа", strategy: "Трансформации до/после + тренировки", content_plan: "Ежедневные короткие видео", checklist: {}, alerts: [], journey_step: 1 },
  demo_3: { id: "demo_3", name: "Юлия Захарова", niche: "Психология", income_now: 5200, followers: 62000, reach: 18000, engagement: 5.1, personality: "Мягкий, профессиональный тон", products: ["Консультация $150", "Групповая терапия $500/мес"], funnel: "Подкаст → сайт → запись на консультацию", strategy: "Экспертный контент + личные истории", content_plan: "3 поста в неделю + истории ежедневно", checklist: {}, alerts: [], journey_step: 3 },
};

export async function GET(req: NextRequest) {
  const demoRes = demoGetGuard(req, []);
  if (demoRes) return demoRes;
  return NextResponse.json(await getTeamTasks());
}

export async function POST(req: NextRequest) {
  const isDemo = isDemoRequest(req);
  const body = await req.json();
  const { worker_id, client_id, point_a = "", extra = "" } = body;

  if (!worker_id || !client_id)
    return NextResponse.json({ detail: "worker_id and client_id required" }, { status: 400 });

  const agent = AGENTS[worker_id];
  if (!agent)
    return NextResponse.json({ detail: `Unknown worker: ${worker_id}` }, { status: 400 });

  // For demo: use demo client data, skip DB reads/writes
  let client: any;
  if (isDemo) {
    client = DEMO_CLIENTS_MAP[client_id] ?? DEMO_CLIENTS_MAP["demo_1"];
  } else {
    const clients = await getClients();
    client = clients.find((c: any) => c.id === client_id);
    if (!client)
      return NextResponse.json({ detail: "Client not found" }, { status: 404 });
  }

  const task: any = {
    id:           `tt_${randomUUID()}`,
    worker_id,
    worker_name:  agent.name,
    client_id:    client.id,
    client_name:  client.name,
    client_niche: client.niche,
    status:       "running",
    created_at:   new Date().toISOString(),
    completed_at: null,
    point_a,
    extra,
    result:       "",
  };

  // Save to DB only for real users
  if (!isDemo) {
    const tasks = await getTeamTasks();
    tasks.unshift(task);
    await saveTeamTasks(tasks);
  }

  // Load knowledge base (skip for demo)
  let systemWithKnowledge = agent.system;
  if (!isDemo) {
    const knowledgeItems = await getAgentKnowledge(worker_id);
    if (knowledgeItems.length > 0) {
      const knowledgeSection = knowledgeItems
        .map((k) => `📌 ${k.title}\n${k.content}`)
        .join("\n\n");
      systemWithKnowledge += `\n\n━━━━━━━━ ЛИЧНАЯ БАЗА ЗНАНИЙ СОТРУДНИКА ━━━━━━━━\n${knowledgeSection}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    }
  }

  const context = buildClientContext(client);
  const prompt  = agent.prompt
    .replace("{context}", context)
    .replace("{extra}", point_a || extra || "—");

  const result = await callGemini(systemWithKnowledge, prompt);

  task.result       = result;
  task.status       = result.startsWith("⚠️") ? "error" : "done";
  task.completed_at = new Date().toISOString();

  // Persist result only for real users
  if (!isDemo) {
    const updated = await getTeamTasks();
    const idx     = updated.findIndex((t: any) => t.id === task.id);
    if (idx >= 0) updated[idx] = task;
    await saveTeamTasks(updated);

    // ── Save result back to client profile field ─────────────────────────────
    const WORKER_CLIENT_FIELD: Record<string, string> = {
      producer:   "producer_plan",
      strategist: "strategy",
      copywriter: "content_pack",
      metaads:    "ad_creatives",
      smm:        "content_plan",
      unpackager: "personality",
      funneler:   "funnel",
      analyst:    "analytics_report",
      businessmap:"business_map",
      sales:      "sales_script",
    };
    const clientField = WORKER_CLIENT_FIELD[worker_id];
    if (clientField && task.status === "done") {
      const allClients = await getClients();
      const ci = allClients.findIndex((c: any) => c.id === client_id);
      if (ci >= 0) {
        allClients[ci][clientField] = result;
        await saveClients(allClients);
      }
    }
    // ─────────────────────────────────────────────────────────────────────────
  }

  return NextResponse.json(task, { status: 201 });
}
