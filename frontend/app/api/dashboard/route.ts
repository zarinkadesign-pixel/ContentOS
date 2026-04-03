import { NextRequest, NextResponse } from "next/server";
import { getClients, getLeads, getFinance, getSettings, getAutomationRuns } from "@/lib/kv";
import { demoGetGuard } from "@/lib/demo-guard";

const DEMO_DASHBOARD = {
  kpi: { total_revenue: 6855, monthly_target: 20000, progress_pct: 34.3, total_clients: 3, total_leads: 4 },
  lead_stages: { new: 1, replied: 1, interested: 1, call: 1 },
  recent_clients: [
    { id: "demo_1", name: "Алина Мороз", niche: "Нутрициология", income_now: 8000 },
    { id: "demo_2", name: "Максим Кузнецов", niche: "Фитнес-тренер", income_now: 3500 },
  ],
  monthly_chart: [
    { month: "Окт", revenue: 1200 }, { month: "Ноя", revenue: 2100 },
    { month: "Дек", revenue: 3400 }, { month: "Янв", revenue: 4200 },
    { month: "Фев", revenue: 5600 }, { month: "Мар", revenue: 6855 },
  ],
  automation: { total: 2, done: 2, running: 0, queued: 0, recent: [] },
};

export async function GET(req: NextRequest) {
  const demoRes = demoGetGuard(req, DEMO_DASHBOARD);
  if (demoRes) return demoRes;
  const [clients, leads, finance, settings, automationRuns] = await Promise.all([
    getClients(), getLeads(), getFinance(), getSettings(), getAutomationRuns(),
  ]);

  const transactions = finance.transactions ?? [];
  const totalRevenue = transactions
    .filter((t: any) => t.type === "income")
    .reduce((s: number, t: any) => s + t.amount, 0);
  const monthlyTarget = settings?.monthly_target ?? 20_000;

  const stageCount: Record<string, number> = {};
  for (const lead of leads) {
    const s = lead.stage ?? "new";
    stageCount[s] = (stageCount[s] ?? 0) + 1;
  }

  const automationDone    = automationRuns.filter((r: any) => r.status === "done").length;
  const automationRunning = automationRuns.filter((r: any) => r.status === "running").length;
  const automationQueued  = automationRuns.filter((r: any) => r.status === "queued").length;

  return NextResponse.json({
    kpi: {
      total_revenue:  totalRevenue,
      monthly_target: monthlyTarget,
      progress_pct:   monthlyTarget ? Math.round(totalRevenue / monthlyTarget * 100 * 10) / 10 : 0,
      total_clients:  clients.length,
      total_leads:    leads.length,
    },
    lead_stages:    stageCount,
    recent_clients: clients.slice(0, 3),
    monthly_chart:  (finance.monthly ?? []).slice(-6),
    automation: {
      total:   automationRuns.length,
      done:    automationDone,
      running: automationRunning,
      queued:  automationQueued,
      recent:  automationRuns.slice(0, 3),
    },
  });
}
