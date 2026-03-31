import { NextRequest, NextResponse } from "next/server";
import { getTeamTasks, saveTeamTasks, getClients } from "@/lib/kv";
import { AGENTS } from "@/lib/agents";
import { callGemini, buildClientContext } from "@/lib/gemini";
import { randomUUID } from "crypto";

export async function GET() {
  return NextResponse.json(await getTeamTasks());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { worker_id, client_id, point_a = "", extra = "" } = body;

  if (!worker_id || !client_id)
    return NextResponse.json({ detail: "worker_id and client_id required" }, { status: 400 });

  const agent = AGENTS[worker_id];
  if (!agent)
    return NextResponse.json({ detail: `Unknown worker: ${worker_id}` }, { status: 400 });

  const clients = await getClients();
  const client  = clients.find((c: any) => c.id === client_id);
  if (!client)
    return NextResponse.json({ detail: "Client not found" }, { status: 404 });

  // Create task record as "running"
  const task: any = {
    id:           `tt_${randomUUID()}`,
    worker_id,
    worker_name:  agent.name,
    client_id,
    client_name:  client.name,
    client_niche: client.niche,
    status:       "running",
    created_at:   new Date().toISOString(),
    completed_at: null,
    point_a,
    extra,
    result:       "",
  };

  const tasks = await getTeamTasks();
  tasks.unshift(task);
  await saveTeamTasks(tasks);

  // Call Gemini synchronously (Next.js API route — streaming not needed here)
  const context = buildClientContext(client);
  const prompt  = agent.prompt
    .replace("{context}", context)
    .replace("{extra}", point_a || extra || "—");

  const result = await callGemini(agent.system, prompt);

  // Update task record
  task.result       = result;
  task.status       = result.startsWith("⚠️") ? "error" : "done";
  task.completed_at = new Date().toISOString();

  const updated = await getTeamTasks();
  const idx     = updated.findIndex((t: any) => t.id === task.id);
  if (idx >= 0) updated[idx] = task;
  await saveTeamTasks(updated);

  return NextResponse.json(task, { status: 201 });
}
