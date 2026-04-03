import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Redis } from "@upstash/redis";

const mem: Record<string, unknown> = {};
function isRedis() { return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN); }
function redis() { return new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! }); }
async function kvGet<T>(k: string): Promise<T | null> { return isRedis() ? redis().get<T>(k) : (mem[k] as T) ?? null; }
async function kvSet(k: string, v: unknown) { if (isRedis()) { await redis().set(k, v); } else { mem[k] = v; } }

export interface Campaign {
  id:          string;
  name:        string;
  type:        "telegram_broadcast" | "email" | "telegram_sequence";
  status:      "draft" | "active" | "paused" | "completed";
  targetNiche: string;
  message:     string;
  subject?:    string;         // email subject
  recipients:  string[];       // telegram usernames / emails
  sentCount:   number;
  openRate:    number;
  replyCount:  number;
  createdAt:   string;
  sentAt?:     string;
  sequence?:   { delay: number; message: string }[];
}

async function getCampaigns(): Promise<Campaign[]> { return (await kvGet<Campaign[]>("campaigns")) ?? []; }
async function saveCampaigns(c: Campaign[]) { await kvSet("campaigns", c); }

export async function GET() {
  const campaigns = await getCampaigns();
  return NextResponse.json(campaigns.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const campaign: Campaign = {
    id:          `campaign_${randomUUID()}`,
    name:        body.name        ?? "Новая кампания",
    type:        body.type        ?? "telegram_broadcast",
    status:      "draft",
    targetNiche: body.targetNiche ?? "",
    message:     body.message     ?? "",
    subject:     body.subject,
    recipients:  body.recipients  ?? [],
    sentCount:   0,
    openRate:    0,
    replyCount:  0,
    createdAt:   new Date().toISOString(),
    sequence:    body.sequence,
  };

  const all = await getCampaigns();
  all.unshift(campaign);
  await saveCampaigns(all);
  return NextResponse.json(campaign, { status: 201 });
}
