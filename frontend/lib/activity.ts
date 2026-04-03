/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. lib/activity.ts
 *
 * Activity logging — stores to Redis KV (compatible with existing stack, no Supabase).
 */
import { kvGet, kvSet } from "./kv";

export interface ActivityEntry {
  id:          string;
  user_id:     string;
  email:       string;
  action:      string;
  module:      string;
  metadata:    Record<string, unknown>;
  ip:          string | null;
  duration_ms: number | null;
  created_at:  string;
}

const ACTIVITY_KEY = "activity_log";
const MAX_ENTRIES  = 500;

export async function logActivity({
  userId, email = "", action, module = "unknown",
  metadata = {}, ip, durationMs,
}: {
  userId:      string;
  email?:      string;
  action:      string;
  module?:     string;
  metadata?:   Record<string, unknown>;
  ip?:         string | null;
  durationMs?: number | null;
}): Promise<void> {
  try {
    const log = (await kvGet<ActivityEntry[]>(ACTIVITY_KEY)) ?? [];
    const entry: ActivityEntry = {
      id:          `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      user_id:     userId,
      email,
      action,
      module,
      metadata,
      ip:          ip ?? null,
      duration_ms: durationMs ?? null,
      created_at:  new Date().toISOString(),
    };
    await kvSet(ACTIVITY_KEY, [entry, ...log].slice(0, MAX_ENTRIES));
  } catch (err) {
    console.error("[logActivity] failed:", (err as Error).message);
  }
}

export async function getActivityLog(limit = 100): Promise<ActivityEntry[]> {
  const log = (await kvGet<ActivityEntry[]>(ACTIVITY_KEY)) ?? [];
  return log.slice(0, limit);
}

export function getIpFromRequest(req: Request): string {
  const h = req.headers as unknown as { get(k: string): string | null };
  return (
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
