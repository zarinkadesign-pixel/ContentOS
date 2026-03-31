import { NextRequest, NextResponse } from "next/server";
import { getLeads, saveLeads } from "@/lib/kv";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { stage } = await req.json();
  const leads = await getLeads();
  const idx   = leads.findIndex((l) => l.id === id);
  if (idx === -1) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  leads[idx] = { ...leads[idx], stage };
  await saveLeads(leads);
  return NextResponse.json(leads[idx]);
}
