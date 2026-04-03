import { NextRequest, NextResponse } from "next/server";
import { createOpusProject } from "@/lib/opus";

export async function POST(req: NextRequest) {
  const { video_url, language, clip_length, aspect_ratio } = await req.json();
  if (!video_url) return NextResponse.json({ detail: "video_url required" }, { status: 400 });

  const result = await createOpusProject(
    video_url,
    language     ?? "ru",
    clip_length  ?? "30-90",
    aspect_ratio ?? "9:16"
  );

  if (result.error) return NextResponse.json({ detail: result.error }, { status: 400 });
  return NextResponse.json(result);
}
