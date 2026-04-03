import { NextRequest, NextResponse } from "next/server";
import { getClients, saveClients } from "@/lib/kv";
import { isDemoRequest, demoWriteGuard } from "@/lib/demo-guard";

const DEMO_CLIENTS: Record<string, any> = {
  demo_1: { id: "demo_1", name: "Алина Мороз", niche: "Нутрициология", income_now: 8000, income_goal: 25000, followers: 45000, reach: 12000, engagement: 4.2, personality: "Эксперт, тёплый тон, истории из практики", products: ["Марафон питания $97", "Менторинг $1500", "Продакшн $3000/мес"], funnel: "Reels → подписка → бесплатный гайд → созвон → оффер", strategy: "Образовательный контент + кейсы клиентов", content_plan: "Пн: совет по питанию\nСр: кейс клиента\nПт: Reels\nВс: подкаст", checklist: { "Онбординг завершён": true, "Распаковка бренда": true, "Продукты настроены": false, "Воронка создана": false }, alerts: ["Нет новых Reels за 7 дней"], transactions: [], journey_step: 2 },
  demo_2: { id: "demo_2", name: "Максим Кузнецов", niche: "Фитнес-тренер", income_now: 3500, income_goal: 15000, followers: 28000, reach: 7500, engagement: 3.8, personality: "Мотиватор, прямой тон", products: ["Онлайн-тренировки $49/мес", "Персональный план $297"], funnel: "Reels → ссылка в bio → лендинг → продажа", strategy: "Трансформации до/после + тренировки", content_plan: "Ежедневные короткие видео", checklist: { "Онбординг завершён": true, "Распаковка бренда": false }, alerts: [], transactions: [], journey_step: 1 },
  demo_3: { id: "demo_3", name: "Юлия Захарова", niche: "Психология", income_now: 5200, income_goal: 20000, followers: 62000, reach: 18000, engagement: 5.1, personality: "Мягкий, профессиональный тон", products: ["Консультация $150", "Групповая терапия $500/мес"], funnel: "Подкаст → сайт → запись на консультацию", strategy: "Экспертный контент + личные истории", content_plan: "3 поста в неделю + истории ежедневно", checklist: { "Онбординг завершён": true, "Распаковка бренда": true, "Продукты настроены": true }, alerts: [], transactions: [], journey_step: 3 },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (isDemoRequest(req)) {
    const demo = DEMO_CLIENTS[id] ?? DEMO_CLIENTS["demo_1"];
    return NextResponse.json(demo);
  }
  const clients = await getClients();
  const client  = clients.find((c) => c.id === id);
  if (!client) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = demoWriteGuard(req);
  if (guard) return guard;
  const { id } = await params;
  const { data } = await req.json();
  const clients = await getClients();
  const idx     = clients.findIndex((c) => c.id === id);
  if (idx === -1) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  clients[idx] = { ...clients[idx], ...data };
  await saveClients(clients);
  return NextResponse.json(clients[idx]);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = demoWriteGuard(req);
  if (guard) return guard;
  const { id } = await params;
  const clients = await getClients();
  const updated = clients.filter((c) => c.id !== id);
  if (updated.length === clients.length) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  await saveClients(updated);
  return new NextResponse(null, { status: 204 });
}
