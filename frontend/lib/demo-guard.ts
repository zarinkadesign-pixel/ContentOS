import { NextRequest, NextResponse } from "next/server";

// Header injected by middleware for demo users
const DEMO_HEADER = "x-content-os-demo";

export function isDemoRequest(req: NextRequest): boolean {
  return req.headers.get(DEMO_HEADER) === "1";
}

// For GET routes: if demo, return the seed data immediately
// Returns null if not a demo request (caller should continue normally)
export function demoGetGuard(req: NextRequest, seedData: unknown): NextResponse | null {
  if (!isDemoRequest(req)) return null;
  return NextResponse.json(seedData);
}

// For write routes: if demo, return fake success immediately
// Returns null if not a demo request (caller should continue normally)
export function demoWriteGuard(req: NextRequest, mockResponse?: unknown): NextResponse | null {
  if (!isDemoRequest(req)) return null;
  return NextResponse.json(
    mockResponse ?? { ok: true, demo: true, message: "В демо-режиме данные не сохраняются" }
  );
}
