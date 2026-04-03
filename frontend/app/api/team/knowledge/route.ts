import { NextRequest, NextResponse } from "next/server";
import { getAgentKnowledge, saveAgentKnowledge, KnowledgeItem } from "@/lib/kv";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const agentId = req.nextUrl.searchParams.get("agentId") ?? "";
  if (!agentId) return NextResponse.json([], { status: 200 });
  const items = await getAgentKnowledge(agentId);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const { agentId, title, content } = await req.json();
  if (!agentId || !title || !content)
    return NextResponse.json({ detail: "agentId, title and content are required" }, { status: 400 });

  const items = await getAgentKnowledge(agentId);
  const newItem: KnowledgeItem = {
    id: `k_${randomUUID()}`,
    title: title.trim(),
    content: content.trim(),
    added_at: new Date().toISOString(),
  };
  items.push(newItem);
  await saveAgentKnowledge(agentId, items);
  return NextResponse.json(newItem, { status: 201 });
}
