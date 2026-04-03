import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/kv";
import { demoWriteGuard } from "@/lib/demo-guard";

export async function GET() {
  return NextResponse.json(await getSettings());
}

export async function PUT(req: NextRequest) {
  const demoRes = demoWriteGuard(req);
  if (demoRes) return demoRes;
  const body = await req.json();
  const settings = await getSettings();
  const updated  = { ...settings, ...body };
  await saveSettings(updated);
  return NextResponse.json(updated);
}
