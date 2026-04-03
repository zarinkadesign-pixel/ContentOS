import { NextRequest, NextResponse } from "next/server";

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN ?? "";
const REPLICATE_BASE  = "https://api.replicate.com/v1";

// minimax/video-01 — fast text-to-video, 6s clips, Apache 2.0
const VIDEO_MODEL = "minimax/video-01";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { prompt, firstFrameImage } = body;

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "prompt required" }, { status: 400 });
  }

  if (!REPLICATE_TOKEN) {
    return NextResponse.json({
      id:      "demo_video_id",
      status:  "demo",
      demo:    true,
      message: "Демо-режим. Добавь REPLICATE_API_TOKEN для реальной генерации видео.",
    });
  }

  try {
    const input: Record<string, any> = { prompt };
    if (firstFrameImage) input.first_frame_image = firstFrameImage;

    const createRes = await fetch(`${REPLICATE_BASE}/models/${VIDEO_MODEL}/predictions`, {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${REPLICATE_TOKEN}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({ input }),
    });

    const prediction = await createRes.json();
    if (!createRes.ok) {
      return NextResponse.json({ error: prediction.detail ?? "Replicate error" }, { status: 502 });
    }

    return NextResponse.json({ id: prediction.id, status: prediction.status, urls: prediction.urls });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET — poll generation status
export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (!REPLICATE_TOKEN || id === "demo_video_id") {
    return NextResponse.json({ id, status: "succeeded", output: null, demo: true });
  }

  try {
    const res  = await fetch(`${REPLICATE_BASE}/predictions/${id}`, {
      headers: { "Authorization": `Bearer ${REPLICATE_TOKEN}` },
    });
    const data = await res.json();
    return NextResponse.json({ id, status: data.status, output: data.output, error: data.error });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
