import { NextRequest, NextResponse } from "next/server";
import { getAiSocial } from "@/lib/vizard";

export async function POST(req: NextRequest) {
  const { project_id } = await req.json();
  if (!project_id) return NextResponse.json({ detail: "project_id required" }, { status: 400 });
  const result = await getAiSocial(project_id);
  if (result.error) return NextResponse.json({ detail: result.error }, { status: 400 });
  return NextResponse.json(result);
}
