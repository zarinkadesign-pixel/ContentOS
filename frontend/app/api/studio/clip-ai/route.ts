/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/api/studio/clip-ai/route.ts
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createJob, listJobs }       from "@/lib/clip-store";
import { runClipPipeline }           from "@/lib/clip-engine";

export async function POST(req: NextRequest) {
  const { video_url, language, clip_length, aspect_ratio } = await req.json();
  if (!video_url?.trim()) return NextResponse.json({ error: "video_url required" }, { status: 400 });

  const job = createJob({
    video_url:   video_url.trim(),
    language:    language    ?? "ru",
    clip_length: clip_length ?? "30-90",
    aspect_ratio: aspect_ratio ?? "9:16",
  });

  // Fire-and-forget background processing
  runClipPipeline(job.id).catch(err =>
    console.error(`[clip-ai] Pipeline error for ${job.id}:`, err)
  );

  return NextResponse.json({ id: job.id, status: job.status });
}

export async function GET() {
  return NextResponse.json({ jobs: listJobs() });
}
