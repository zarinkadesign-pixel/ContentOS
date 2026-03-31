import { NextResponse } from "next/server";
import { listAgents } from "@/lib/agents";

export async function GET() {
  return NextResponse.json(listAgents());
}
