/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/api/admin/activity/route.ts
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import { getActivityLog } from "@/lib/activity";

function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("contentOS_token")?.value;
  if (!token) return false;
  const p = verifyToken(token);
  return p && isAdmin(p);
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "500"), 500);
  const log = await getActivityLog(limit);
  return NextResponse.json(log);
}
