/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/api/studio/stream/route.ts
 *
 * GET /api/studio/stream?prompt=...&system=...
 * Streams AI generation via SSE — text appears word by word in the UI.
 */
import { NextRequest } from "next/server";
import { callGeminiStream } from "@/lib/gemini";
import { verifyToken } from "@/lib/auth";
import { logActivity, getIpFromRequest } from "@/lib/activity";

export const runtime = "nodejs";

const DEFAULT_SYSTEM = "Ты профессиональный копирайтер. Пишешь на русском языке.";

export async function POST(req: NextRequest) {
  const { prompt, system } = await req.json();

  if (!prompt?.trim()) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "prompt required" })}\n\n`,
      { headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const start   = Date.now();
  const token   = req.cookies.get("contentOS_token")?.value ?? "";
  const payload = verifyToken(token);

  const sseStream = await callGeminiStream(
    system ?? DEFAULT_SYSTEM,
    prompt,
    3000,
  );

  // Log after stream is initiated (non-blocking)
  if (payload) {
    logActivity({
      userId:     payload.sub,
      email:      payload.email,
      action:     "generate_content",
      module:     "studio:stream",
      ip:         getIpFromRequest(req),
      durationMs: Date.now() - start,
    });
  }

  return new Response(sseStream, {
    headers: {
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache, no-transform",
      "Connection":        "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
