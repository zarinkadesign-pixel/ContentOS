import { NextRequest, NextResponse } from "next/server";
import {
  getAutomationRuns,
  saveAutomationRuns,
  getClients,
  AutomationRun,
  AutomationStep,
} from "@/lib/kv";
import { PIPELINE_STEPS } from "@/lib/automation";
import { randomUUID } from "crypto";
import { demoGetGuard, demoWriteGuard } from "@/lib/demo-guard";

function buildRun(client: any, trigger: AutomationRun["trigger"]): AutomationRun {
  const steps: AutomationStep[] = PIPELINE_STEPS.map((s) => ({
    id:           `step_${randomUUID()}`,
    name:         s.name,
    worker_id:    s.worker_id,
    status:       "pending",
    result:       "",
    started_at:   null,
    completed_at: null,
  }));

  return {
    id:           `run_${randomUUID()}`,
    client_id:    client.id,
    client_name:  client.name,
    client_niche: client.niche ?? "—",
    status:       "queued",
    trigger,
    created_at:   new Date().toISOString(),
    completed_at: null,
    steps,
  };
}

// GET — return all automation runs (latest first)
export async function GET(req: NextRequest) {
  const demoRes = demoGetGuard(req, []);
  if (demoRes) return demoRes;
  const runs = await getAutomationRuns();
  return NextResponse.json(runs.sort((a, b) =>
    b.created_at.localeCompare(a.created_at)));
}

// POST — create a new automation run for a client
export async function POST(req: NextRequest) {
  const demoRes = demoWriteGuard(req);
  if (demoRes) return demoRes;
  const { client_id, trigger = "manual" } = await req.json();
  if (!client_id)
    return NextResponse.json({ detail: "client_id required" }, { status: 400 });

  const clients = await getClients();
  const client  = clients.find((c: any) => c.id === client_id);
  if (!client)
    return NextResponse.json({ detail: "Client not found" }, { status: 404 });

  // Prevent duplicate queued runs for the same client
  const runs = await getAutomationRuns();
  const existing = runs.find(
    (r) => r.client_id === client_id && (r.status === "queued" || r.status === "running")
  );
  if (existing)
    return NextResponse.json(existing, { status: 200 });

  const run = buildRun(client, trigger as AutomationRun["trigger"]);
  runs.unshift(run);
  await saveAutomationRuns(runs);

  return NextResponse.json(run, { status: 201 });
}
