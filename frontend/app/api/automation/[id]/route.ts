import { NextRequest, NextResponse } from "next/server";
import {
  getAutomationRuns,
  saveAutomationRuns,
  getClients,
  getAgentKnowledge,
  saveClients,
} from "@/lib/kv";
import { AGENTS } from "@/lib/agents";
import { callGemini, buildClientContext } from "@/lib/gemini";

// GET — single run status
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const runs = await getAutomationRuns();
  const run  = runs.find((r) => r.id === id);
  if (!run) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json(run);
}

// POST — execute this run (processes all pending steps sequentially)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // ── Load run
  let runs  = await getAutomationRuns();
  let run   = runs.find((r) => r.id === id);
  if (!run) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  if (run.status === "running")
    return NextResponse.json({ detail: "Already running" }, { status: 409 });
  if (run.status === "done")
    return NextResponse.json(run, { status: 200 });

  // ── Load client
  const clients = await getClients();
  const client  = clients.find((c: any) => c.id === run!.client_id);
  if (!client)
    return NextResponse.json({ detail: "Client not found" }, { status: 404 });

  // ── Mark run as running
  run.status = "running";
  runs = await getAutomationRuns();
  const runIdx = runs.findIndex((r) => r.id === id);
  if (runIdx >= 0) runs[runIdx] = run;
  await saveAutomationRuns(runs);

  // ── Execute steps sequentially
  const context = buildClientContext(client);
  let hasError  = false;

  for (let i = 0; i < run.steps.length; i++) {
    const step = run.steps[i];
    if (step.status === "done") continue;

    const agent = AGENTS[step.worker_id];
    if (!agent) {
      step.status       = "error";
      step.result       = `⚠️ Неизвестный воркер: ${step.worker_id}`;
      step.completed_at = new Date().toISOString();
      hasError = true;
      continue;
    }

    // Mark step running
    step.status     = "running";
    step.started_at = new Date().toISOString();
    runs = await getAutomationRuns();
    const ri = runs.findIndex((r) => r.id === id);
    if (ri >= 0) runs[ri] = run;
    await saveAutomationRuns(runs);

    // Load knowledge base
    const knowledgeItems = await getAgentKnowledge(step.worker_id);
    let systemPrompt = agent.system;
    if (knowledgeItems.length > 0) {
      const kb = knowledgeItems.map((k) => `📌 ${k.title}\n${k.content}`).join("\n\n");
      systemPrompt += `\n\n━━━━━━━━ ЛИЧНАЯ БАЗА ЗНАНИЙ СОТРУДНИКА ━━━━━━━━\n${kb}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    }

    // Build prompt
    const prompt = agent.prompt
      .replace("{context}", context)
      .replace("{extra}", `Автоматический запуск для нового клиента. Ниша: ${client.niche ?? "—"}. Онбординг.`);

    const result = await callGemini(systemPrompt, prompt);

    step.status       = result.startsWith("⚠️") ? "error" : "done";
    step.result       = result;
    step.completed_at = new Date().toISOString();

    if (step.status === "error") hasError = true;

    // Persist step result
    runs = await getAutomationRuns();
    const ri2 = runs.findIndex((r) => r.id === id);
    if (ri2 >= 0) runs[ri2] = run;
    await saveAutomationRuns(runs);

    // Save step result back to client record
    if (step.status === "done") {
      const allClients = await getClients();
      const ci = allClients.findIndex((c: any) => c.id === run!.client_id);
      if (ci >= 0) {
        const workerFieldMap: Record<string, string> = {
          producer:   "producer_plan",
          strategist: "strategy",
          copywriter: "content_pack",
          metaads:    "ad_creatives",
        };
        const field = workerFieldMap[step.worker_id];
        if (field) {
          allClients[ci][field] = result;
          // Mark checklist items automatically
          if (step.worker_id === "producer")   allClients[ci].checklist["Онбординг завершён"] = true;
          if (step.worker_id === "strategist") allClients[ci].checklist["Стратегия готова"]   = true;
          if (step.worker_id === "copywriter") allClients[ci].checklist["Контент-план утверждён"] = true;
          await saveClients(allClients);
        }
      }
    }
  }

  // ── Finalize run
  run.status       = hasError ? "error" : "done";
  run.completed_at = new Date().toISOString();

  runs = await getAutomationRuns();
  const finalIdx = runs.findIndex((r) => r.id === id);
  if (finalIdx >= 0) runs[finalIdx] = run;
  await saveAutomationRuns(runs);

  return NextResponse.json(run);
}
