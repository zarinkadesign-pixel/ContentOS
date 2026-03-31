import { NextRequest, NextResponse } from "next/server";
import { getLeads, saveLeads } from "@/lib/kv";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data   = await req.json();
  const leads  = await getLeads();
  const idx    = leads.findIndex((l) => l.id === id);
  if (idx === -1) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  leads[idx] = { ...leads[idx], ...data };
  await saveLeads(leads);
  return NextResponse.json(leads[idx]);
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const leads   = await getLeads();
  const updated = leads.filter((l) => l.id !== id);
  if (updated.length === leads.length) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  await saveLeads(updated);
  return new NextResponse(null, { status: 204 });
}
