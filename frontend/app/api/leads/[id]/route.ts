import { NextRequest, NextResponse } from "next/server";
import { getLeads, saveLeads } from "@/lib/kv";

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
