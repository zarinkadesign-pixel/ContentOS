/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/api/claude/route.ts
 *
 * POST /api/claude
 * Body: { prompt, system?, model?, maxTokens?, stream? }
 * Returns: { result, model, timeMs } or SSE stream
 */
import { NextRequest, NextResponse } from "next/server";
import { callClaude, callClaudeStream, isClaudeAvailable, CLAUDE_MODELS, type ClaudeModel } from "@/lib/anthropic";
import { verifyToken } from "@/lib/auth";
import { logActivity, getIpFromRequest } from "@/lib/activity";

export const runtime = "nodejs";

const DEFAULT_SYSTEM = "Ты профессиональный AI-стратег и копирайтер. Пишешь на русском языке. Структурируй ответ, используй примеры и цифры.";

export async function POST(req: NextRequest) {
  if (!isClaudeAvailable()) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY не задан" }, { status: 503 });
  }

  const { prompt, system, model = "sonnet", maxTokens = 4096, stream = false } =
    await req.json() as {
      prompt: string;
      system?: string;
      model?: ClaudeModel;
      maxTokens?: number;
      stream?: boolean;
    };

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "prompt required" }, { status: 400 });
  }

  const start   = Date.now();
  const token   = req.cookies.get("contentOS_token")?.value ?? "";
  const payload = verifyToken(token);

  if (stream) {
    const sseStream = await callClaudeStream(
      system ?? DEFAULT_SYSTEM,
      prompt,
      maxTokens,
      model,
    );
    if (payload) {
      logActivity({
        userId:     payload.sub,
        email:      payload.email,
        action:     "generate_content",
        module:     `claude:${model}`,
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

  const result = await callClaude(
    system ?? DEFAULT_SYSTEM,
    prompt,
    maxTokens,
    model,
  );

  if (payload) {
    logActivity({
      userId:     payload.sub,
      email:      payload.email,
      action:     "generate_content",
      module:     `claude:${model}`,
      ip:         getIpFromRequest(req),
      durationMs: Date.now() - start,
    });
  }

  return NextResponse.json({
    result,
    model: CLAUDE_MODELS[model],
    timeMs: Date.now() - start,
  });
}

// GET — check if Claude is available
export async function GET() {
  return NextResponse.json({
    available: isClaudeAvailable(),
    models:    CLAUDE_MODELS,
  });
}
