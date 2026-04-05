/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/api/scheduler/ai-caption/route.ts
 *
 * Generate platform-optimised captions via Groq LLaMA.
 */
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";

const PLATFORM_RULES: Record<string, { maxChars: number; style: string }> = {
  telegram:  { maxChars: 4096, style: "conversational, emoji-rich, storytelling, use bold **text**" },
  instagram: { maxChars: 2200, style: "engaging, lifestyle, call-to-action, 3-5 emojis, 5-10 hashtags at end" },
  tiktok:    { maxChars: 2200, style: "trendy, short punchy hook, Gen-Z voice, 3-5 hashtags" },
  youtube:   { maxChars: 5000, style: "SEO-optimised description, include keywords, timestamps if applicable, subscribe CTA" },
  facebook:  { maxChars: 63206, style: "conversational, community-focused, question to drive comments" },
  vk:        { maxChars: 20000, style: "Russian-language community post, friendly tone, emojis" },
  threads:   { maxChars: 500,  style: "concise, witty, Twitter-like, one key insight" },
  linkedin:  { maxChars: 3000, style: "professional, thought leadership, value-driven, 3 hashtags" },
};

export async function POST(req: NextRequest) {
  const { topic, platform, language, tone, extra } = await req.json();
  if (!topic || !platform) {
    return NextResponse.json({ error: "topic and platform required" }, { status: 400 });
  }

  const GROQ_KEY = process.env.GROQ_API_KEY ?? process.env.GROQ_KEY ?? "";
  if (!GROQ_KEY) return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 500 });

  const rule = PLATFORM_RULES[platform] ?? PLATFORM_RULES.instagram;
  const lang = language ?? "ru";

  const prompt = `Write a ${platform} post caption.

Topic / context: ${topic}
Language: ${lang}
Tone: ${tone ?? "engaging"}
Platform style: ${rule.style}
Max characters: ${rule.maxChars}
${extra ? `Extra instructions: ${extra}` : ""}

Return ONLY the caption text — no explanations, no quotes, no markdown wrapper.
For Instagram/TikTok include relevant hashtags at the end.
For YouTube include a short description + relevant keywords.`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a professional social media copywriter. Write compelling, platform-native captions." },
          { role: "user",   content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.error?.message ?? "Groq error" }, { status: 500 });
    const caption = data.choices?.[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ caption, platform, chars: caption.length, limit: rule.maxChars });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
