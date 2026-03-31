import { NextRequest, NextResponse } from "next/server";
import { publishVideoClip } from "@/lib/vizard";

export async function POST(req: NextRequest) {
  const { project_id, caption, publish_at } = await req.json();
  if (!project_id || !caption) return NextResponse.json({ detail: "project_id and caption required" }, { status: 400 });
  const result = await publishVideoClip(project_id, caption, publish_at ?? "");
  if (result.error) return NextResponse.json({ detail: result.error }, { status: 400 });
  return NextResponse.json(result);
}
