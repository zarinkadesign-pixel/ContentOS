/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/api/chat/stream/route.ts
 *
 * GET /api/chat/stream?message=...&client_id=...
 * Streams AI reply via Server-Sent Events so text appears in real-time.
 *
 * SSE events:
 *   { type: "delta", text: "..." }   — incremental text chunk
 *   { type: "done" }                 — generation complete
 *   { type: "error", message: "..." }
 */
import { NextRequest } from "next/server";
import {
  getClients, getLeads, getFinance,
  getAutomationRuns, getTeamTasks, getTasks,
} from "@/lib/kv";
import { callGeminiStream, buildClientContext } from "@/lib/gemini";
import { demoGetGuard } from "@/lib/demo-guard";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `Ты — AI-ассистент продюсерского центра AMAI MEDIA. У тебя есть доступ ко всем данным системы ContentOS. Отвечай на русском. Давай конкретные ответы с цифрами. Используй Markdown-форматирование.`;

const DEMO_REPLY = `**ContentOS AI-ассистент** готов к работе!\n\nВ демо-режиме доступны следующие данные:\n- 👤 **Клиенты**: Алина Мороз (Нутрициология) — доход $8,000 → цель $25,000\n- 📊 **Лиды**: 4 лида в разных стадиях воронки\n- 💰 **Финансы**: Доход $6,855, расходы $45, прибыль $6,810\n- 🤖 **Автопилот**: AI-агенты для стратегии, контента, воронки и рекламы\n\nЧтобы получить полный доступ к аналитике — подключите реальные данные в настройках.`;

export async function GET(req: NextRequest) {
  // Demo guard — stream the demo reply char by char
  const isDemoHeader = req.headers.get("x-content-os-demo") === "1";
  if (isDemoHeader) {
    const encoder = new TextEncoder();
    const stream  = new ReadableStream<Uint8Array>({
      async start(c) {
        const words = DEMO_REPLY.split(" ");
        for (const word of words) {
          c.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", text: word + " " })}\n\n`));
          await new Promise((r) => setTimeout(r, 18));
        }
        c.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        c.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type":      "text/event-stream",
        "Cache-Control":     "no-cache, no-transform",
        "Connection":        "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  const { searchParams } = req.nextUrl;
  const message  = (searchParams.get("message") ?? "").trim();
  const clientId = searchParams.get("client_id") ?? "";

  if (!message) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "message is required" })}\n\n`,
      { headers: { "Content-Type": "text/event-stream" } }
    );
  }

  // Load data in parallel
  const [clients, leads, finance, automationRuns, teamTasks, workspaceTasks] =
    await Promise.all([
      getClients(), getLeads(), getFinance(),
      getAutomationRuns(), getTeamTasks(), getTasks(),
    ]);

  const txs: { amount: number; type: string }[] = (finance as any)?.transactions ?? [];
  const totalIncome   = txs.filter((t) => t.type === "income").reduce((s, t) => s + (t.amount ?? 0), 0);
  const totalExpenses = txs.filter((t) => t.type === "expense").reduce((s, t) => s + (t.amount ?? 0), 0);

  const clientsSummary    = (clients as any[]).map((c) => `• ${c.name} (${c.niche ?? "—"}): $${c.income_now ?? 0} → $${c.income_goal ?? 0}`).join("\n");
  const leadsSummary      = (leads   as any[]).map((l) => `• ${l.name} — ${l.stage}`).join("\n");
  const workspacePending  = (workspaceTasks as any[]).filter((t) => t.status !== "done").map((t) => `• ${t.title}`).join("\n");
  const automationDone    = (automationRuns as any[]).filter((r) => r.status === "done").length;

  let context = `━━━ ДАННЫЕ ContentOS ━━━

📋 КЛИЕНТЫ (${(clients as any[]).length}):
${clientsSummary || "нет"}

🎯 ЛИДЫ (${(leads as any[]).length}):
${leadsSummary || "нет"}

💰 ФИНАНСЫ:
• Доход: $${totalIncome.toLocaleString("ru")}  Расходы: $${totalExpenses.toLocaleString("ru")}  Прибыль: $${(totalIncome - totalExpenses).toLocaleString("ru")}

🤖 АВТОПИЛОТ: ${automationDone}/${(automationRuns as any[]).length} выполнено
👥 КОМАНДА: ${(teamTasks as any[]).filter((t: any) => t.done).length}/${(teamTasks as any[]).length} задач выполнено
📌 РАБОЧЕЕ ПРОСТРАНСТВО (ожидает): ${workspacePending || "нет"}`;

  if (clientId) {
    const c = (clients as any[]).find((c) => c.id === clientId);
    if (c) context = `${buildClientContext(c)}\n\n${context}`;
  }

  const fullPrompt = `${context}\n\n━━━ ВОПРОС ━━━\n${message}`;

  const sseStream = await callGeminiStream(SYSTEM_PROMPT, fullPrompt, 3000);

  return new Response(sseStream, {
    headers: {
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache, no-transform",
      "Connection":        "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
