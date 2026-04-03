import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import type { Campaign } from "../../route";

const mem: Record<string, unknown> = {};
function isRedis() { return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN); }
function redis() { return new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! }); }
async function kvGet<T>(k: string): Promise<T | null> { return isRedis() ? redis().get<T>(k) : (mem[k] as T) ?? null; }
async function kvSet(k: string, v: unknown) { if (isRedis()) { await redis().set(k, v); } else { mem[k] = v; } }

async function getCampaigns(): Promise<Campaign[]> { return (await kvGet<Campaign[]>("campaigns")) ?? []; }
async function saveCampaigns(c: Campaign[]) { await kvSet("campaigns", c); }

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TG_BASE  = "https://api.telegram.org";

// ── Send one Telegram message ─────────────────────────────────────────────────
async function tgSend(chatId: string, text: string): Promise<boolean> {
  if (!TG_TOKEN) return false;
  try {
    const res  = await fetch(`${TG_BASE}/bot${TG_TOKEN}/sendMessage`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

// ── Send email via Resend API ─────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey  = process.env.RESEND_API_KEY ?? "";
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  if (!apiKey) return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({ from: fromEmail, to: [to], subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// POST — execute the campaign send
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id }   = await params;
  const campaigns = await getCampaigns();
  const idx       = campaigns.findIndex((c) => c.id === id);
  if (idx < 0)    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const campaign = campaigns[idx];
  const results: { recipient: string; ok: boolean }[] = [];
  let sentCount = 0;

  if (campaign.type === "telegram_broadcast") {
    // Send to each recipient (username or chat_id)
    for (const recipient of campaign.recipients) {
      const ok = await tgSend(recipient, campaign.message);
      results.push({ recipient, ok });
      if (ok) sentCount++;
    }
  } else if (campaign.type === "email") {
    for (const email of campaign.recipients) {
      const html = campaign.message.replace(/\n/g, "<br>");
      const ok   = await sendEmail(email, campaign.subject ?? "Сообщение", html);
      results.push({ recipient: email, ok });
      if (ok) sentCount++;
    }
  } else {
    // Sequence campaign — just mark as active, real sends happen via cron
    campaigns[idx].status = "active";
    campaigns[idx].sentAt = new Date().toISOString();
    await saveCampaigns(campaigns);
    return NextResponse.json({ ok: true, message: "Sequence campaign activated" });
  }

  // Has bot token / email key — actual sends happened
  const hasIntegration = !!(TG_TOKEN || process.env.RESEND_API_KEY);

  if (hasIntegration) {
    campaigns[idx].sentCount = sentCount;
    campaigns[idx].status    = "completed";
    campaigns[idx].sentAt    = new Date().toISOString();
  } else {
    // Demo mode — simulate
    campaigns[idx].sentCount = campaign.recipients.length;
    campaigns[idx].status    = "completed";
    campaigns[idx].sentAt    = new Date().toISOString();
  }

  await saveCampaigns(campaigns);

  return NextResponse.json({
    ok:          true,
    sentCount:   campaigns[idx].sentCount,
    results:     hasIntegration ? results : null,
    demo:        !hasIntegration,
    message:     !hasIntegration
      ? "Демо-режим. Добавь TELEGRAM_BOT_TOKEN или RESEND_API_KEY для реальной отправки."
      : `Отправлено ${sentCount} из ${campaign.recipients.length}`,
  });
}
