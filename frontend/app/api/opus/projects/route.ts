import { NextRequest, NextResponse } from "next/server";
import { listOpusProjects } from "@/lib/opus";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page  = Number(searchParams.get("page")  ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);
  const result = await listOpusProjects(page, limit);
  if (result.error) return NextResponse.json({ detail: result.error }, { status: 400 });
  return NextResponse.json(result);
}
