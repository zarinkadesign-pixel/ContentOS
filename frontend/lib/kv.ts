// Upstash Redis wrapper — production: Upstash Redis, dev: in-memory fallback
import { Redis } from "@upstash/redis";

// ── In-memory fallback for local dev without Redis credentials ───────────────
const mem: Record<string, unknown> = {};
function isRedisAvailable() {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
function getRedis() {
  return new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}
async function kvGet<T>(key: string): Promise<T | null> {
  if (isRedisAvailable()) return getRedis().get<T>(key);
  return (mem[key] as T) ?? null;
}
async function kvSet(key: string, value: unknown): Promise<void> {
  if (isRedisAvailable()) { await getRedis().set(key, value); return; }
  mem[key] = value;
}

// ── Demo seed data ────────────────────────────────────────────────────────────
function makeDemoClients() {
  return [{
    id: "client_1",
    name: "Алина Мороз",
    niche: "Нутрициология",
    contact: "@alina_moroz",
    income_now: 8000,
    income_goal: 25000,
    followers: 7800,
    reach: 12000,
    engagement: 4.2,
    personality: "Эксперт, тёплый тон, истории из практики",
    products: ["Марафон питания $97", "Менторинг $1500", "Продакшн $3000/мес"],
    funnel: "Reels → подписка → бесплатный гайд → созвон → оффер",
    strategy: "Образовательный контент + кейсы клиентов",
    content_plan: "Пн: совет по питанию\nСр: кейс клиента\nПт: Reels\nВс: подкаст",
    checklist: {
      "Онбординг завершён": true,
      "Распаковка бренда": true,
      "Продукты настроены": false,
      "Воронка создана": false,
      "Контент-план утверждён": false,
    },
    alerts: ["Нет новых Reels за 7 дней"],
    transactions: [],
    journey_step: 2,
  }];
}

function makeDemoLeads() {
  return [
    { id: "lead_1", name: "Марина К.", source: "Instagram", contact: "@marina_k", niche: "Коучинг", product: "Менторинг", stage: "interested", date: "2026-03-28", notes: "" },
    { id: "lead_2", name: "Дмитрий В.", source: "Telegram", contact: "@dvl", niche: "Фитнес", product: "Марафон", stage: "call", date: "2026-03-29", notes: "Хочет начать с апреля" },
    { id: "lead_3", name: "Ольга С.", source: "2GIS", contact: "+7 777 123 45 67", niche: "Нутрициология", product: "Продакшн", stage: "replied", date: "2026-03-30", notes: "" },
    { id: "lead_4", name: "Алексей П.", source: "Реклама", contact: "@alex_p", niche: "Бизнес", product: "Менторинг", stage: "new", date: "2026-03-31", notes: "" },
  ];
}

function makeDemoFinance() {
  return {
    transactions: [
      { id: "t1", description: "Мини-курс питания", amount: 1455, type: "income", category: "Курсы", date: "2026-03-01" },
      { id: "t2", description: "Менторинг Алина", amount: 3000, type: "income", category: "Менторинг", date: "2026-03-05" },
      { id: "t3", description: "Продакшн-пакет", amount: 2400, type: "income", category: "Продакшн", date: "2026-03-10" },
      { id: "t4", description: "Vizard", amount: 30, type: "expense", category: "SaaS", date: "2026-03-01" },
      { id: "t5", description: "Canva", amount: 15, type: "expense", category: "SaaS", date: "2026-03-01" },
    ],
    monthly: [
      { month: "Окт", revenue: 1200 },
      { month: "Ноя", revenue: 2100 },
      { month: "Дек", revenue: 3400 },
      { month: "Янв", revenue: 4200 },
      { month: "Фев", revenue: 5600 },
      { month: "Мар", revenue: 6855 },
    ],
    expenses: [
      { label: "Vizard", amount: 30 },
      { label: "Canva", amount: 15 },
    ],
  };
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function getClients(): Promise<any[]> {
  let data = await kvGet<any[]>("clients");
  if (!data) { data = makeDemoClients(); await kvSet("clients", data); }
  return data;
}
export async function saveClients(clients: any[]): Promise<void> { await kvSet("clients", clients); }

export async function getLeads(): Promise<any[]> {
  let data = await kvGet<any[]>("leads");
  if (!data) { data = makeDemoLeads(); await kvSet("leads", data); }
  return data;
}
export async function saveLeads(leads: any[]): Promise<void> { await kvSet("leads", leads); }

export async function getFinance(): Promise<any> {
  let data = await kvGet<any>("finance");
  if (!data) { data = makeDemoFinance(); await kvSet("finance", data); }
  return data;
}
export async function saveFinance(finance: any): Promise<void> { await kvSet("finance", finance); }
