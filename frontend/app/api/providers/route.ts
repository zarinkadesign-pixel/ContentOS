/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/api/providers/route.ts
 *
 * GET /api/providers — returns which AI providers are configured
 */
import { NextResponse } from "next/server";
import { getProviderInfo } from "@/lib/ai";

export async function GET() {
  return NextResponse.json(getProviderInfo());
}
