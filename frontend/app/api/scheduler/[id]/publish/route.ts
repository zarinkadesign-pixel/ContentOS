import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const mem: Record<string, unknown> = {};
function isRedis() { return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN); }
function redis() { return new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! }); }
async function kvGet<T>(k: string): Promise<T | null> { return isRedis() ? redis().get<T>(k) : (mem[k] as T) ?? null; }
async function kvSet(k: string, v: unknown) { if (isRedis()) { await redis().set(k, v); } else { mem[k] = v; } }

interface ScheduledPost {
  id: string; platform: string; text: string; imageUrl?: string; videoUrl?: string;
  scheduledAt: string; status: string; channelId?: string; publishedAt?: string; error?: string;
}

async function getPosts(): Promise<ScheduledPost[]> { return (await kvGet<ScheduledPost[]>("scheduled_posts")) ?? []; }
async function savePosts(p: ScheduledPost[]) { await kvSet("scheduled_posts", p); }

const TG_TOKEN    = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TG_CHANNEL  = process.env.TELEGRAM_CHANNEL_ID ?? "";
const TG_BASE     = "https://api.telegram.org";

// ── Telegram sender ─────────────────────────────────────────────────────────
async function sendToTelegram(post: ScheduledPost): Promise<{ ok: boolean; error?: string }> {
  if (!TG_TOKEN) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN not configured" };
  }

  const chatId = post.channelId || TG_CHANNEL;
  if (!chatId) {
    return { ok: false, error: "No Telegram channel ID configured. Set TELEGRAM_CHANNEL_ID or provide channelId." };
  }

  try {
    // Send photo with caption, or plain text
    const method  = post.imageUrl ? "sendPhoto" : post.videoUrl ? "sendVideo" : "sendMessage";
    const payload: Record<string, any> = {
      chat_id:    chatId,
      parse_mode: "HTML",
    };

    if (post.imageUrl) {
      payload.photo   = post.imageUrl;
      payload.caption = post.text;
    } else if (post.videoUrl) {
      payload.video   = post.videoUrl;
      payload.caption = post.text;
    } else {
      payload.text = post.text;
    }

    const res  = await fetch(`${TG_BASE}/bot${TG_TOKEN}/${method}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();

    if (!data.ok) {
      return { ok: false, error: data.description ?? "Telegram API error" };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

// POST — immediately publish this post
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const posts  = await getPosts();
  const idx    = posts.findIndex((p) => p.id === id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const post = posts[idx];

  if (post.platform === "telegram") {
    const result = await sendToTelegram(post);
    if (result.ok) {
      posts[idx].status      = "published";
      posts[idx].publishedAt = new Date().toISOString();
    } else {
      posts[idx].status = "failed";
      posts[idx].error  = result.error;
    }
    await savePosts(posts);
    return NextResponse.json({ ok: result.ok, post: posts[idx], error: result.error });
  }

  // For other platforms — mark as published (manual workflow)
  // Instagram Graph API requires Business account approval and is not trivially automated
  posts[idx].status      = "published";
  posts[idx].publishedAt = new Date().toISOString();
  await savePosts(posts);

  return NextResponse.json({
    ok:      true,
    post:    posts[idx],
    message: post.platform === "instagram"
      ? "Instagram: скопируй текст и опубликуй вручную или через Buffer/Meta Business Suite"
      : "Пост помечен как опубликованный",
  });
}
