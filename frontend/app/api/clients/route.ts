import { NextRequest, NextResponse } from "next/server";
import { getClients, saveClients } from "@/lib/kv";
import { randomUUID } from "crypto";

export async function GET() {
  return NextResponse.json(await getClients());
}

export async function POST(req: NextRequest) {
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
  return NextResponse.json(client, { status: 201 });
}
