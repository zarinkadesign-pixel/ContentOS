import { NextRequest, NextResponse } from "next/server";
import {
  getClients,
  getLeads,
  getFinance,
  getAutomationRuns,
  getTeamTasks,
  getTasks,
} from "@/lib/kv";
import { callGemini } from "@/lib/gemini";
import { demoWriteGuard } from "@/lib/demo-guard";

const SYSTEM_PROMPT = `Ты — AI-ассистент продюсерского центра AMAI MEDIA. У тебя есть доступ ко всем данным системы ContentOS. Отвечай на русском. Давай конкретные ответы с цифрами. Используй Markdown-форматирование.`;

const DEMO_REPLY = `**ContentOS AI-ассистент** готов к работе!

В демо-режиме доступны следующие данные:
- 👤 **Клиенты**: Алина Мороз (Нутрициология) — доход $8,000 → цель $25,000
- 📊 **Лиды**: 4 лида в разных стадиях воронки
- 💰 **Финансы**: Доход $6,855, расходы $45, прибыль $6,810
- 🤖 **Автопилот**: AI-агенты для стратегии, контента, воронки и рекламы

Чтобы получить полный доступ к аналитике — подключите реальные данные в настройках.`;

export async function POST(req: NextRequest) {
  // Demo guard
  const demoRes = demoWriteGuard(req, {
    reply: DEMO_REPLY,
    timestamp: new Date().toISOString(),
  });
  if (demoRes) return demoRes;

  let body: {
    message?: string;
    client_id?: string;
    history?: { role: "user" | "assistant"; content: string }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
  const clientId = body.client_id ?? "";

  // Load all data in parallel
  const [clients, leads, finance, automationRuns, teamTasks, workspaceTasks] =
    await Promise.all([
      getClients(),
      getLeads(),
      getFinance(),
      getAutomationRuns(),
      getTeamTasks(),
      getTasks(),
    ]);

  // Build finance totals
  const txs: { amount: number; type: string }[] = finance?.transactions ?? [];
  const totalIncome = txs
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + (t.amount ?? 0), 0);
  const totalExpenses = txs
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + (t.amount ?? 0), 0);
  const profit = totalIncome - totalExpenses;

  // Build compact context
  const clientsSummary = clients
    .map(
      (c: any) =>
        `• ${c.name} (${c.niche ?? "—"}): $${c.income_now ?? 0} → $${c.income_goal ?? 0}`
    )
    .join("\n");

  const leadsSummary = leads
    .map((l: any) => `• ${l.name} — стадия: ${l.stage}`)
    .join("\n");

  const automationStats = {
    total: automationRuns.length,
    done: automationRuns.filter((r) => r.status === "done").length,
  };

  const teamTasksDone = (teamTasks as any[]).filter((t: any) => t.done).length;

  const workspacePending = (workspaceTasks as any[])
    .filter((t: any) => t.status !== "done" && t.status !== "completed")
    .map((t: any) => `• ${t.title}`)
    .join("\n");

  let context = `━━━ ДАННЫЕ СИСТЕМЫ ContentOS ━━━

📋 КЛИЕНТЫ (${clients.length}):
${clientsSummary || "нет"}

🎯 ЛИДЫ (${leads.length}):
${leadsSummary || "нет"}

💰 ФИНАНСЫ:
• Доход: $${totalIncome.toLocaleString("ru")}
• Расходы: $${totalExpenses.toLocaleString("ru")}
• Прибыль: $${profit.toLocaleString("ru")}

🤖 АВТОПИЛОТ:
• Всего запусков: ${automationStats.total}
• Выполнено: ${automationStats.done}

👥 КОМАНДНЫЕ ЗАДАЧИ: ${teamTasksDone} выполнено из ${(teamTasks as any[]).length}

📌 ЗАДАЧИ РАБОЧЕГО ПРОСТРАНСТВА (ожидающие):
${workspacePending || "нет"}`;

  // If specific client requested, load and prepend full profile
  if (clientId) {
    const specificClient = clients.find((c: any) => c.id === clientId);
    if (specificClient) {
      const { buildClientContext } = await import("@/lib/gemini");
      const clientCtx = buildClientContext(specificClient);
      context = `${clientCtx}\n\n${context}`;
    }
  }

  // Build messages for history context
  const historyText = history
    .map(
      (m) =>
        `${m.role === "user" ? "Пользователь" : "Ассистент"}: ${m.content}`
    )
    .join("\n\n");

  const fullPrompt = historyText
    ? `${context}\n\n━━━ ИСТОРИЯ ДИАЛОГА ━━━\n${historyText}\n\n━━━ ВОПРОС ━━━\n${message}`
    : `${context}\n\n━━━ ВОПРОС ━━━\n${message}`;

  const reply = await callGemini(SYSTEM_PROMPT, fullPrompt);

  return NextResponse.json({
    reply,
    timestamp: new Date().toISOString(),
  });
}
