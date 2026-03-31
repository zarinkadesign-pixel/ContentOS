import { NextResponse } from "next/server";
import { getClients, getLeads, getFinance, getSettings } from "@/lib/kv";

export async function GET() {
  const [clients, leads, finance, settings] = await Promise.all([
    getClients(), getLeads(), getFinance(), getSettings(),
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
  });
}
