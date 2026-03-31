import { NextRequest, NextResponse } from "next/server";
import { getLeads, saveLeads } from "@/lib/kv";
import { randomUUID } from "crypto";

export async function GET() {
  return NextResponse.json(await getLeads());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ detail: "name required" }, { status: 400 });

  const lead = {
    id:    `lead_${randomUUID()}`,
    stage: "new",
    date:  new Date().toISOString().slice(0, 10),
    notes: "",
    source: "", contact: "", niche: "", product: "",
    ...body,
  };
  const leads = await getLeads();
  leads.push(lead);
  await saveLeads(leads);
  return NextResponse.json(lead, { status: 201 });
}
