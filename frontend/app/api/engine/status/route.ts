/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/api/engine/status/route.ts
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

// Static engine state for web — the live state is read by the Python desktop app.
// The web version shows the same schema with real agent data from KV store.

const AGENT_DEFINITIONS = [
  { id: "hunter",      name: "Охотник",     icon: "🔍", description: "Поиск лидов в Telegram" },
  { id: "salesman",    name: "Продажник",   icon: "💼", description: "Персональный первый контакт" },
  { id: "scorer",      name: "Скорщик",     icon: "⚡", description: "AI Score 0-100 для лидов" },
  { id: "nurturer",    name: "Прогревщик",  icon: "🔥", description: "7-дневная цепочка прогрева" },
  { id: "content",     name: "Контент",     icon: "✍️", description: "Контент в голосе бренда" },
  { id: "publisher",   name: "Публикатор",  icon: "📤", description: "Публикация через Vizard" },
  { id: "advertiser",  name: "Рекламщик",   icon: "📢", description: "9 рекламных текстов/неделю" },
  { id: "kp_master",   name: "КП-мастер",   icon: "📄", description: "Коммерческое предложение за 30 сек" },
  { id: "analyst",     name: "Аналитик",    icon: "📊", description: "Брифинг 09:00 ежедневно" },
  { id: "strategist",  name: "Стратег",     icon: "🎯", description: "План на неделю по пн 08:00" },
  { id: "onboarder",   name: "Онбордер",    icon: "📋", description: "RAG база знаний клиента" },
  { id: "reporter",    name: "Отчётчик",    icon: "📈", description: "Ежемесячные отчёты клиентам" },
];

const SCHEDULE_INFO = [
  { id: "daily_briefing",   name: "☀️ Брифинг дня",        when: "09:00 ежедневно",   interval_min: 1440 },
  { id: "lead_scoring",     name: "⚡ Скоринг лидов",       when: "каждые 15 мин",     interval_min: 15 },
  { id: "nurture_sequence", name: "🔥 Прогрев цепочка",     when: "каждый час",        interval_min: 60 },
  { id: "content_publish",  name: "📤 Публикация контента", when: "каждые 2ч в 10:00", interval_min: 120 },
  { id: "weekly_report",    name: "📊 Недельный отчёт",     when: "вс 20:00",          interval_min: 10080 },
  { id: "weekly_strategy",  name: "🎯 Стратегия недели",    when: "пн 08:00",          interval_min: 10080 },
];

export async function GET(req: NextRequest) {
  // Auth check
  const cookieStore = await cookies();
  const token = cookieStore.get("contentOS_token")?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Return engine schema with agent definitions and schedule
  // In production this would read from a shared Redis/KV store
  // that engine.py writes to. For now, returns the static schema.
  return NextResponse.json({
    agents: AGENT_DEFINITIONS,
    schedule: SCHEDULE_INFO,
    note: "Engine runs locally via engine.py. Start with START_ALL.bat",
  });
}
