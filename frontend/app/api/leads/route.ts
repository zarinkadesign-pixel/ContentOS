import { NextRequest, NextResponse } from "next/server";
import { getLeads, saveLeads } from "@/lib/kv";
import { randomUUID } from "crypto";
import { demoGetGuard, demoWriteGuard } from "@/lib/demo-guard";

const DEMO_LEADS = [
  { id: "demo_lead_1", name: "Дмитрий Орлов", stage: "new", niche: "Коучинг", source: "Instagram", date: "2026-03-28", notes: "" },
  { id: "demo_lead_2", name: "Светлана Петрова", stage: "replied", niche: "Маркетинг", source: "Telegram", date: "2026-03-25", notes: "" },
  { id: "demo_lead_3", name: "Андрей Соколов", stage: "interested", niche: "Продажи", source: "Сайт", date: "2026-03-22", notes: "" },
  { id: "demo_lead_4", name: "Марина Белова", stage: "call", niche: "HR", source: "Рекомендация", date: "2026-03-20", notes: "" },
];

export async function GET(req: NextRequest) {
  const demoRes = demoGetGuard(req, DEMO_LEADS);
  if (demoRes) return demoRes;
  return NextResponse.json(await getLeads());
}

export async function POST(req: NextRequest) {
  const demoRes = demoWriteGuard(req);
  if (demoRes) return demoRes;
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
