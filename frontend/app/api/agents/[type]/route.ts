import { NextRequest, NextResponse } from "next/server";
import { AGENTS } from "@/lib/agents";
import { callGemini, buildClientContext } from "@/lib/gemini";
import { getClients } from "@/lib/kv";
import { verifyToken } from "@/lib/auth";
import { logActivity, getIpFromRequest } from "@/lib/activity";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  const agent = AGENTS[type];
  if (!agent) return NextResponse.json({ detail: `Unknown agent: ${type}` }, { status: 400 });

  const { client_id, extra = "" } = await req.json();
  const clients = await getClients();
  const client  = clients.find((c) => c.id === client_id);
  if (!client) return NextResponse.json({ detail: "Client not found" }, { status: 404 });

  const start   = Date.now();
  const context = buildClientContext(client);
  const prompt  = agent.prompt.replace("{context}", context).replace("{extra}", extra);
  const result  = await callGemini(agent.system, prompt);

  const token   = req.cookies.get("contentOS_token")?.value ?? "";
  const payload = verifyToken(token);
  if (payload) {
    logActivity({
      userId:     payload.sub,
      email:      payload.email,
      action:     "generate_content",
      module:     `agent:${type}`,
      ip:         getIpFromRequest(req),
      durationMs: Date.now() - start,
    });
  }

  return NextResponse.json({ agent: type, result });
}
