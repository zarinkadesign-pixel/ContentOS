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

// PATCH — update post (reschedule, change text, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id }   = await params;
  const updates  = await req.json();
  const posts    = await getPosts();
  const idx      = posts.findIndex((p) => p.id === id);
  if (idx < 0)   return NextResponse.json({ error: "Not found" }, { status: 404 });

  posts[idx] = { ...posts[idx], ...updates };
  await savePosts(posts);
  return NextResponse.json(posts[idx]);
}

// DELETE — remove scheduled post
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const posts  = await getPosts();
  const next   = posts.filter((p) => p.id !== id);
  await savePosts(next);
  return NextResponse.json({ ok: true });
}
