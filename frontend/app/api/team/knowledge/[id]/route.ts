import { NextRequest, NextResponse } from "next/server";
import { getAgentKnowledge, saveAgentKnowledge } from "@/lib/kv";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agentId = req.nextUrl.searchParams.get("agentId") ?? "";
  if (!agentId) return NextResponse.json({ detail: "agentId required" }, { status: 400 });

  const items = await getAgentKnowledge(agentId);
  const filtered = items.filter((i) => i.id !== id);
  await saveAgentKnowledge(agentId, filtered);
  return NextResponse.json({ ok: true });
}
