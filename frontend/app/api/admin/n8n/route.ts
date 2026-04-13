/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/api/admin/n8n/route.ts
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const N8N_BASE = process.env.N8N_URL ?? "http://localhost:5678";
const N8N_API_KEY = process.env.N8N_API_KEY ?? "";

async function adminOnly() {
  const jar = await cookies();
  const token = jar.get("admin_token")?.value;
  if (!token || token !== process.env.ADMIN_TOKEN) return false;
  return true;
}

async function n8nFetch(path: string, init?: RequestInit) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(N8N_API_KEY ? { "X-N8N-API-KEY": N8N_API_KEY } : {}),
  };
  const res = await fetch(`${N8N_BASE}${path}`, { ...init, headers });
  return res;
}

export async function GET(req: NextRequest) {
  if (!await adminOnly()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const action = req.nextUrl.searchParams.get("action") ?? "workflows";

  try {
    if (action === "health") {
      const r = await n8nFetch("/healthz");
      const data = await r.json().catch(() => ({}));
      return NextResponse.json({ ok: r.ok, status: r.status, ...data });
    }

    if (action === "workflows") {
      const r = await n8nFetch("/api/v1/workflows?limit=50");
      if (!r.ok) {
        // n8n not configured — return mock data so UI still renders
        return NextResponse.json({ workflows: [], total: 0, offline: true });
      }
      const data = await r.json();
      return NextResponse.json({ workflows: data.data ?? [], total: data.count ?? 0 });
    }

    if (action === "executions") {
      const r = await n8nFetch("/api/v1/executions?limit=20&includeData=false");
      if (!r.ok) return NextResponse.json({ executions: [], offline: true });
      const data = await r.json();
      return NextResponse.json({ executions: data.data ?? [] });
    }

    if (action === "credentials") {
      const r = await n8nFetch("/api/v1/credentials");
      if (!r.ok) return NextResponse.json({ credentials: [], offline: true });
      const data = await r.json();
      return NextResponse.json({ credentials: data.data ?? [] });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "n8n unreachable", offline: true });
  }
}

export async function POST(req: NextRequest) {
  if (!await adminOnly()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, workflowId, active } = body;

  try {
    if (action === "toggle") {
      const r = await n8nFetch(`/api/v1/workflows/${workflowId}`, {
        method: "PATCH",
        body: JSON.stringify({ active }),
      });
      if (!r.ok) return NextResponse.json({ error: "Failed to toggle workflow" }, { status: r.status });
      const data = await r.json();
      return NextResponse.json({ ok: true, active: data.active });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "n8n unreachable", offline: true });
  }
}
