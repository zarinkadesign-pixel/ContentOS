import { NextRequest, NextResponse } from "next/server";
import { AGENTS } from "@/lib/agents";
import { callGemini, buildClientContext } from "@/lib/gemini";
import { getClients } from "@/lib/kv";

type Params = { params: { type: string } };

export async function POST(req: NextRequest, { params }: Params) {
  const agent = AGENTS[params.type];
  if (!agent) return NextResponse.json({ detail: `Unknown agent: ${params.type}` }, { status: 400 });

  const { client_id, extra = "" } = await req.json();
  const clients = await getClients();
  const client  = clients.find((c) => c.id === client_id);
  if (!client) return NextResponse.json({ detail: "Client not found" }, { status: 404 });

  const context = buildClientContext(client);
  const prompt  = agent.prompt.replace("{context}", context).replace("{extra}", extra);
  const result  = await callGemini(agent.system, prompt);

  return NextResponse.json({ agent: params.type, result });
}
