/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/api/studio/clip-ai/tools/route.ts
 */
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { checkTools }   from "@/lib/clip-engine";

export async function GET() {
  const tools = await checkTools();
  return NextResponse.json({
    ffmpeg: !!tools.ffmpeg,
    ytdlp:  !!tools.ytdlp,
    ffmpeg_path: tools.ffmpeg,
    ytdlp_path:  tools.ytdlp,
    groq:   !!(process.env.GROQ_API_KEY ?? process.env.GROQ_KEY),
    mode:   tools.ffmpeg && tools.ytdlp ? "full" : "analysis_only",
  });
}
