import { NextRequest, NextResponse } from "next/server";
import { getTimeSessions, saveTimeSessions, getActiveSession, saveActiveSession } from "@/lib/kv";
import { isDemoRequest, demoWriteGuard } from "@/lib/demo-guard";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  if (isDemoRequest(req)) return NextResponse.json({ sessions: [], active: null });
  const [sessions, active] = await Promise.all([getTimeSessions(), getActiveSession()]);
  return NextResponse.json({ sessions, active });
}

export async function POST(req: NextRequest) {
  const guard = demoWriteGuard(req);
  if (guard) return guard;
  const { action, category = "", note = "" } = await req.json();

  if (action === "start") {
    const existing = await getActiveSession();
    if (existing) return NextResponse.json({ detail: "Timer already running" }, { status: 400 });
    const session = { start: new Date().toISOString(), category, note };
    await saveActiveSession(session);
    return NextResponse.json({ active: session });
  }

  if (action === "stop") {
    const active = await getActiveSession();
    if (!active) return NextResponse.json({ detail: "No active timer" }, { status: 400 });

    const end      = new Date();
    const start    = new Date(active.start);
    const duration = Math.round((end.getTime() - start.getTime()) / 60000); // minutes

    const session = {
      id:       `ts_${randomUUID()}`,
      start:    active.start,
      end:      end.toISOString(),
      duration: Math.max(duration, 1),
      category: active.category,
      note:     active.note,
    };

    const sessions = await getTimeSessions();
    sessions.push(session);
    await saveTimeSessions(sessions);
    await saveActiveSession(null);
    return NextResponse.json({ session, active: null });
  }

  return NextResponse.json({ detail: "action must be start or stop" }, { status: 400 });
}
