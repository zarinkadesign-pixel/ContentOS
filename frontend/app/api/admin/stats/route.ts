/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/api/admin/stats/route.ts
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin }      from "@/lib/auth";
import { getUsers }                  from "@/lib/kv";
import { getActivityLog }            from "@/lib/activity";

function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("contentOS_token")?.value;
  if (!token) return false;
  const p = verifyToken(token);
  return p && isAdmin(p);
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [users, log] = await Promise.all([getUsers(), getActivityLog(500)]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const stats = {
    total_users:        users.length,
    paid_users:         users.filter((u) => u.plan_active && u.plan !== "free" && u.plan !== null).length,
    active_today:       users.filter((u) => u.last_login?.slice(0, 10) === todayStr).length,
    total_generations:  log.filter((e) => e.action === "generate_content").length,
    generations_today:  log.filter((e) => e.action === "generate_content" && e.created_at.slice(0, 10) === todayStr).length,
    recent_activity:    log.slice(0, 10),
  };

  return NextResponse.json(stats);
}
