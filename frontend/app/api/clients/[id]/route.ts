import { NextRequest, NextResponse } from "next/server";
import { getClients, saveClients } from "@/lib/kv";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const clients = await getClients();
  const client  = clients.find((c) => c.id === id);
  if (!client) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data } = await req.json();
  const clients = await getClients();
  const idx     = clients.findIndex((c) => c.id === id);
  if (idx === -1) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  clients[idx] = { ...clients[idx], ...data };
  await saveClients(clients);
  return NextResponse.json(clients[idx]);
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const clients = await getClients();
  const updated = clients.filter((c) => c.id !== id);
  if (updated.length === clients.length) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  await saveClients(updated);
  return new NextResponse(null, { status: 204 });
}
