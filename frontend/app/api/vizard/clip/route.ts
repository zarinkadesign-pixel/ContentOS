import { NextRequest, NextResponse } from "next/server";
import { createProject } from "@/lib/vizard";

export async function POST(req: NextRequest) {
  const { video_url, language } = await req.json();
  if (!video_url) return NextResponse.json({ detail: "video_url required" }, { status: 400 });
  const result = await createProject(video_url, language ?? "ru");
  if (result.error) return NextResponse.json({ detail: result.error }, { status: 400 });
  return NextResponse.json(result);
}
