import { NextRequest, NextResponse } from "next/server";

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN ?? "";
const REPLICATE_BASE  = "https://api.replicate.com/v1";

// FLUX Schnell — ultra-fast, ~4 steps, Apache 2.0
const FLUX_MODEL = "black-forest-labs/flux-schnell";

export interface ImageGenRequest {
  prompt: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:5" | "3:2";
  numOutputs?: number;
}

// ── Mock images for demo (no API key) ─────────────────────────────────────────
function getMockImages(prompt: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) =>
    `https://picsum.photos/seed/${encodeURIComponent(prompt)}${i}/768/768`
  );
}

export async function POST(req: NextRequest) {
  const body: ImageGenRequest = await req.json();
  const { prompt, aspectRatio = "1:1", numOutputs = 2 } = body;

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "prompt required" }, { status: 400 });
  }

  // Demo fallback
  if (!REPLICATE_TOKEN) {
    return NextResponse.json({
      images: getMockImages(prompt, numOutputs),
      demo: true,
      message: "Демо-режим. Добавь REPLICATE_API_TOKEN для реальной генерации.",
    });
  }

  try {
    // Create prediction
    const createRes = await fetch(`${REPLICATE_BASE}/models/${FLUX_MODEL}/predictions`, {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${REPLICATE_TOKEN}`,
        "Content-Type":  "application/json",
        "Prefer":        "wait",   // Wait up to 60s for result
      },
      body: JSON.stringify({
        input: {
          prompt,
          aspect_ratio:  aspectRatio,
          num_outputs:   numOutputs,
          output_format: "webp",
          output_quality: 80,
          go_fast: true,
        },
      }),
    });

    const prediction = await createRes.json();

    if (!createRes.ok) {
      return NextResponse.json({ error: prediction.detail ?? "Replicate error" }, { status: 502 });
    }

    // If still processing, poll
    if (prediction.status === "starting" || prediction.status === "processing") {
      const pollRes = await fetch(`${REPLICATE_BASE}/predictions/${prediction.id}`, {
        headers: { "Authorization": `Bearer ${REPLICATE_TOKEN}` },
      });
      const polled = await pollRes.json();
      return NextResponse.json({ images: polled.output ?? [], id: prediction.id, status: polled.status });
    }

    return NextResponse.json({ images: prediction.output ?? [], id: prediction.id, status: prediction.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
