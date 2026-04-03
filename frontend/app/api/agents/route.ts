import { NextRequest, NextResponse } from "next/server";
import { listAgents } from "@/lib/agents";
import { demoGetGuard } from "@/lib/demo-guard";

export async function GET(req: NextRequest) {
  // Demo users can see the agents list (read-only)
  const demoRes = demoGetGuard(req, listAgents());
  if (demoRes) return demoRes;
  return NextResponse.json(listAgents());
}
