/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/api/carousel/generate/route.ts
 *
 * Generate structured carousel slide data via Groq LLaMA.
 */
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const {
    topic,
    niche    = "",
    numSlides = 6,
    style    = "engaging",
    language = "ru",
    theme    = "dark",
    brand    = "",
  } = await req.json();

  if (!topic) return NextResponse.json({ error: "topic required" }, { status: 400 });

  const GROQ_KEY = process.env.GROQ_API_KEY ?? process.env.GROQ_KEY ?? "";
  if (!GROQ_KEY) return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 500 });

  const userPrompt = `Create a ${numSlides}-slide social media carousel post.
Topic: "${topic}"
${niche ? `Niche: ${niche}` : ""}
Style: ${style}
Language: ${language === "ru" ? "Russian" : language}
${brand ? `Brand: ${brand}` : ""}

Return ONLY valid JSON matching this schema exactly:
{
  "title": "series title (short)",
  "slides": [
    {
      "index": 1,
      "type": "hook",
      "emoji": "🎯",
      "headline": "Bold 6-8 word headline",
      "subtext": "One punchy hook sentence",
      "points": [],
      "cta": null
    }
  ],
  "hashtags": ["#tag1","#tag2","#tag3","#tag4","#tag5"]
}

Rules:
- Slide 1: type="hook" — big bold opener, fill "subtext", empty "points"
- Slides 2 to ${numSlides - 1}: type="content" — headline + 3 concise bullet "points", empty "subtext"
- Last slide: type="cta" — fill "cta" with save/follow/share action, empty "points"
- Keep all text SHORT and punchy
- Write everything in ${language === "ru" ? "Russian" : language}`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a professional social media carousel content creator. Respond with valid JSON only." },
          { role: "user",   content: userPrompt },
        ],
        temperature: 0.85,
        max_tokens: 2500,
        response_format: { type: "json_object" },
      }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.error?.message ?? "Groq error" }, { status: 500 });

    const content = data.choices?.[0]?.message?.content ?? "{}";
    const parsed  = JSON.parse(content);
    return NextResponse.json({ ...parsed, theme, brand });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
