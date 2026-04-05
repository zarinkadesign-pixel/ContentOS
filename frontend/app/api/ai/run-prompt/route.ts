/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/api/ai/run-prompt/route.ts
 *
 * Generic prompt runner via Groq LLaMA.
 */
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { prompt, system = "You are a helpful AI assistant. Be concise and practical.", temperature = 0.7 } = await req.json();
  if (!prompt) return NextResponse.json({ error: "prompt required" }, { status: 400 });

  const GROQ_KEY = process.env.GROQ_API_KEY ?? process.env.GROQ_KEY ?? "";
  if (!GROQ_KEY) return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 500 });

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: system },
          { role: "user",   content: prompt },
        ],
        temperature,
        max_tokens: 2000,
      }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.error?.message ?? "Groq error" }, { status: 500 });
    const result = data.choices?.[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ result, tokens: data.usage?.total_tokens });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
