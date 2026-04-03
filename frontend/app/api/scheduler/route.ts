import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

// ── KV helpers (reuse existing pattern) ───────────────────────────────────────
import { Redis } from "@upstash/redis";
const mem: Record<string, unknown> = {};
function isRedis() { return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN); }
function redis() { return new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! }); }
async function kvGet<T>(k: string): Promise<T | null> { return isRedis() ? redis().get<T>(k) : (mem[k] as T) ?? null; }
async function kvSet(k: string, v: unknown) { if (isRedis()) { await redis().set(k, v); } else { mem[k] = v; } }

export interface ScheduledPost {
  id: string;
  platform:   "telegram" | "instagram" | "youtube" | "facebook" | "threads" | "vk";
  text:       string;
  imageUrl?:  string;
  videoUrl?:  string;
  scheduledAt: string;   // ISO datetime
  status:     "scheduled" | "published" | "failed" | "draft";
  channelId?: string;    // Telegram channel ID override
  publishedAt?: string;
  error?: string;
}

async function getPosts(): Promise<ScheduledPost[]> {
  return (await kvGet<ScheduledPost[]>("scheduled_posts")) ?? [];
}
async function savePosts(posts: ScheduledPost[]) { await kvSet("scheduled_posts", posts); }

// GET — list all scheduled posts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform");
  const status   = searchParams.get("status");

  let posts = await getPosts();
  if (platform) posts = posts.filter((p) => p.platform === platform);
  if (status)   posts = posts.filter((p) => p.status === status);

  return NextResponse.json(posts.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)));
}

// POST — create scheduled post
export async function POST(req: NextRequest) {
  const body: Omit<ScheduledPost, "id" | "status"> = await req.json();

  if (!body.text?.trim() || !body.platform || !body.scheduledAt) {
    return NextResponse.json({ error: "text, platform, scheduledAt required" }, { status: 400 });
  }

  const post: ScheduledPost = {
    ...body,
    id:     `post_${randomUUID()}`,
    status: "scheduled",
  };

  const posts = await getPosts();
  posts.push(post);
  await savePosts(posts);

  return NextResponse.json(post, { status: 201 });
}
