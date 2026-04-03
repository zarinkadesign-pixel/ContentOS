import { NextRequest, NextResponse } from "next/server";
import { getClients, saveClients, getAutomationRuns, saveAutomationRuns, AutomationRun, AutomationStep } from "@/lib/kv";
import { PIPELINE_STEPS } from "@/lib/automation";
import { randomUUID } from "crypto";
import { demoGetGuard, demoWriteGuard } from "@/lib/demo-guard";

const DEMO_CLIENTS = [
  { id: "demo_1", name: "Алина Мороз", niche: "Нутрициология", income_now: 8000, followers: 45000, reach: 12000, engagement: 4.2, stage: "active" },
  { id: "demo_2", name: "Максим Кузнецов", niche: "Фитнес-тренер", income_now: 3500, followers: 28000, reach: 7500, engagement: 3.8, stage: "active" },
  { id: "demo_3", name: "Юлия Захарова", niche: "Психология", income_now: 5200, followers: 62000, reach: 18000, engagement: 5.1, stage: "active" },
];

export async function GET(req: NextRequest) {
  const demoRes = demoGetGuard(req, DEMO_CLIENTS);
  if (demoRes) return demoRes;
  return NextResponse.json(await getClients());
}

export async function POST(req: NextRequest) {
  const demoRes = demoWriteGuard(req);
  if (demoRes) return demoRes;
  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ detail: "name required" }, { status: 400 });

  const client = {
    id: `client_${randomUUID()}`,
    followers: 0, reach: 0, engagement: 0,
    personality: "", products: [], funnel: "", strategy: "", content_plan: "",
    checklist: {}, alerts: [], transactions: [], journey_step: 0,
    ...body,
  };
  const clients = await getClients();
  clients.push(client);
  await saveClients(clients);

  // ── Auto-trigger automation pipeline for new client ──────────────────────
  const steps: AutomationStep[] = PIPELINE_STEPS.map((s) => ({
    id:           `step_${randomUUID()}`,
    name:         s.name,
    worker_id:    s.worker_id,
    status:       "pending",
    result:       "",
    started_at:   null,
    completed_at: null,
  }));
  const run: AutomationRun = {
    id:           `run_${randomUUID()}`,
    client_id:    client.id,
    client_name:  client.name,
    client_niche: client.niche ?? "—",
    status:       "queued",
    trigger:      "new_client",
    created_at:   new Date().toISOString(),
    completed_at: null,
    steps,
  };
  const runs = await getAutomationRuns();
  runs.unshift(run);
  await saveAutomationRuns(runs);
  // ─────────────────────────────────────────────────────────────────────────

  return NextResponse.json({ ...client, automation_run_id: run.id }, { status: 201 });
}
