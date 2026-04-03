import { NextRequest } from "next/server";
import {
  getAutomationRuns,
  saveAutomationRuns,
  getClients,
  getAgentKnowledge,
  saveClients,
} from "@/lib/kv";
import { AGENTS } from "@/lib/agents";
import { buildClientContext } from "@/lib/gemini";
import { ai } from "@/lib/ai";

// ── SSE helper ─────────────────────────────────────────────────────────────────
function sse(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// ── GET — stream automation run via Server-Sent Events ────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(sse(data)));
      }

      try {
        // ── Load run
        let runs = await getAutomationRuns();
        let run  = runs.find((r) => r.id === id);

        if (!run) {
          send({ type: "error", message: "Run not found" });
          controller.close();
          return;
        }

        if (run.status === "done") {
          send({ type: "done", run });
          controller.close();
          return;
        }

        if (run.status === "running") {
          send({ type: "error", message: "Already running" });
          controller.close();
          return;
        }

        // ── Load client
        const clients = await getClients();
        const client  = clients.find((c: any) => c.id === run!.client_id);

        if (!client) {
          send({ type: "error", message: "Client not found" });
          controller.close();
          return;
        }

        // ── Mark run as running
        run.status = "running";
        runs = await getAutomationRuns();
        const startIdx = runs.findIndex((r) => r.id === id);
        if (startIdx >= 0) runs[startIdx] = run;
        await saveAutomationRuns(runs);

        send({ type: "start", run });

        // ── Execute steps sequentially, streaming each step
        const context = buildClientContext(client);
        let hasError  = false;

        for (let i = 0; i < run.steps.length; i++) {
          const step = run.steps[i];
          if (step.status === "done") {
            send({ type: "step_skip", stepIndex: i, step });
            continue;
          }

          const agent = AGENTS[step.worker_id];
          if (!agent) {
            step.status       = "error";
            step.result       = `⚠️ Неизвестный воркер: ${step.worker_id}`;
            step.completed_at = new Date().toISOString();
            hasError = true;
            send({ type: "step_error", stepIndex: i, step });
            continue;
          }

          // Mark step running
          step.status     = "running";
          step.started_at = new Date().toISOString();
          runs = await getAutomationRuns();
          const ri = runs.findIndex((r) => r.id === id);
          if (ri >= 0) runs[ri] = run;
          await saveAutomationRuns(runs);

          send({ type: "step_start", stepIndex: i, step, total: run.steps.length });

          // Load knowledge base
          const knowledgeItems = await getAgentKnowledge(step.worker_id);
          let systemPrompt = agent.system;
          if (knowledgeItems.length > 0) {
            const kb = knowledgeItems.map((k) => `📌 ${k.title}\n${k.content}`).join("\n\n");
            systemPrompt += `\n\n━━━━━━━━ ЛИЧНАЯ БАЗА ЗНАНИЙ СОТРУДНИКА ━━━━━━━━\n${kb}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
          }

          const prompt = agent.prompt
            .replace("{context}", context)
            .replace("{extra}", `Автоматический запуск для нового клиента. Ниша: ${client.niche ?? "—"}. Онбординг.`);

          // Route: strategist/producer → Claude if available; others → Groq
          const aiTask = (step.worker_id === "strategist" || step.worker_id === "producer")
            ? "strategy" as const
            : step.worker_id === "metaads"
            ? "ads" as const
            : "content" as const;
          const result = await ai(systemPrompt, prompt, { task: aiTask, maxTokens: 4096 });

          step.status       = result.startsWith("⚠️") ? "error" : "done";
          step.result       = result;
          step.completed_at = new Date().toISOString();

          if (step.status === "error") hasError = true;

          runs = await getAutomationRuns();
          const ri2 = runs.findIndex((r) => r.id === id);
          if (ri2 >= 0) runs[ri2] = run;
          await saveAutomationRuns(runs);

          send({ type: step.status === "done" ? "step_done" : "step_error", stepIndex: i, step });

          // Save result to client record
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
                if (step.worker_id === "producer")   allClients[ci].checklist["Онбординг завершён"] = true;
                if (step.worker_id === "strategist") allClients[ci].checklist["Стратегия готова"]   = true;
                if (step.worker_id === "copywriter") allClients[ci].checklist["Контент-план утверждён"] = true;
                await saveClients(allClients);
              }
            }
          }
        }

        // ── Finalize
        run.status       = hasError ? "error" : "done";
        run.completed_at = new Date().toISOString();

        runs = await getAutomationRuns();
        const finalIdx = runs.findIndex((r) => r.id === id);
        if (finalIdx >= 0) runs[finalIdx] = run;
        await saveAutomationRuns(runs);

        send({ type: "done", run });
      } catch (err: any) {
        send({ type: "error", message: err.message ?? "Unknown error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
