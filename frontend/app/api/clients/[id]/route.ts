import { NextRequest, NextResponse } from "next/server";
import { getClients, saveClients } from "@/lib/kv";

type Params = { params: { id: string } };

export async function GET(_: NextRequest, { params }: Params) {
  const clients = await getClients();
  const client  = clients.find((c) => c.id === params.id);
  if (!client) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { data } = await req.json();
  const clients = await getClients();
  const idx     = clients.findIndex((c) => c.id === params.id);
  if (idx === -1) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  clients[idx] = { ...clients[idx], ...data };
  await saveClients(clients);
  return NextResponse.json(clients[idx]);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const clients = await getClients();
  const updated = clients.filter((c) => c.id !== params.id);
  if (updated.length === clients.length) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  await saveClients(updated);
  return new NextResponse(null, { status: 204 });
}
