/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/api/scheduler/batch/route.ts
 *
 * Create one scheduled post per selected platform simultaneously.
 */
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Redis } from "@upstash/redis";

const mem: Record<string, unknown> = {};
function isRedis() { return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN); }
function redis()   { return new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! }); }
async function kvGet<T>(k: string): Promise<T | null> { return isRedis() ? redis().get<T>(k) : (mem[k] as T) ?? null; }
async function kvSet(k: string, v: unknown) { if (isRedis()) { await redis().set(k, v); } else { mem[k] = v; } }

interface ScheduledPost {
  id: string; platform: string; text: string; imageUrl?: string; videoUrl?: string;
  scheduledAt: string; status: string; channelId?: string; publishedAt?: string; error?: string;
  title?: string; hashtags?: string[];
}

async function getPosts(): Promise<ScheduledPost[]> { return (await kvGet<ScheduledPost[]>("scheduled_posts")) ?? []; }
async function savePosts(p: ScheduledPost[]) { await kvSet("scheduled_posts", p); }

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    platforms,            // string[]
    captions,             // Record<platform, string>
    imageUrl, videoUrl,
    scheduledAt,
    title,
    hashtags,
  } = body;

  if (!platforms?.length || !scheduledAt) {
    return NextResponse.json({ error: "platforms[] and scheduledAt required" }, { status: 400 });
  }

  const posts = await getPosts();
  const created: ScheduledPost[] = [];

  for (const platform of platforms as string[]) {
    const text = captions?.[platform] ?? captions?.["default"] ?? "";
    if (!text.trim()) continue;
    const post: ScheduledPost = {
      id:          `post_${randomUUID()}`,
      platform,
      text,
      imageUrl,
      videoUrl,
      scheduledAt,
      status:      "scheduled",
      title,
      hashtags,
    };
    posts.push(post);
    created.push(post);
  }

  await savePosts(posts);
  return NextResponse.json({ created, count: created.length }, { status: 201 });
}
