import { NextRequest, NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { verifyToken } from "@/lib/auth";
import { logActivity, getIpFromRequest } from "@/lib/activity";

export async function POST(req: NextRequest) {
  const start = Date.now();
  const { prompt, system } = await req.json();
  if (!prompt) return NextResponse.json({ detail: "prompt required" }, { status: 400 });

  const token   = req.cookies.get("contentOS_token")?.value ?? "";
  const payload = verifyToken(token);

  const result = await callGemini(system ?? "Ты профессиональный копирайтер. Пишешь на русском языке.", prompt);

  if (payload) {
    logActivity({
      userId:     payload.sub,
      email:      payload.email,
      action:     "generate_content",
      module:     "studio",
      ip:         getIpFromRequest(req),
      durationMs: Date.now() - start,
    });
  }

  return NextResponse.json({ result });
}
