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

// ── Generic exports for use by activity logger ────────────────────────────────
export { kvGet, kvSet };

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

export async function getSettings(): Promise<any> {
  let data = await kvGet<any>("settings");
  if (!data) { data = { monthly_target: 20000, company_name: "AMAImedia" }; await kvSet("settings", data); }
  return data;
}
export async function saveSettings(settings: any): Promise<void> { await kvSet("settings", settings); }

// ── Workspace ─────────────────────────────────────────────────────────────────
function makeDemoTasks() {
  const today = new Date().toISOString().slice(0, 10);
  const eow   = (() => { const d = new Date(); d.setDate(d.getDate() + (7 - d.getDay())); return d.toISOString().slice(0, 10); })();
  const eom   = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10);
  return [
    { id: "task_1", title: "Снять Reels для клиента", description: "Алина Мороз — рецепт недели", period: "day",   due_date: today, priority: "high",   status: "todo",        created_at: new Date().toISOString(), completed_at: null, tags: ["контент"] },
    { id: "task_2", title: "Написать контент-план",   description: "На следующую неделю",             period: "week",  due_date: eow,   priority: "medium", status: "in_progress", created_at: new Date().toISOString(), completed_at: null, tags: ["стратегия"] },
    { id: "task_3", title: "Онбординг нового клиента",description: "Заполнить анкету бренда",          period: "week",  due_date: eow,   priority: "high",   status: "todo",        created_at: new Date().toISOString(), completed_at: null, tags: ["клиенты"] },
    { id: "task_4", title: "Закрыть 3 лида",          description: "Конверсия из звонка в договор",   period: "month", due_date: eom,   priority: "high",   status: "todo",        created_at: new Date().toISOString(), completed_at: null, tags: ["продажи"] },
    { id: "task_5", title: "Обновить стратегию",      description: "Ревизия воронки Q2",              period: "month", due_date: eom,   priority: "low",    status: "todo",        created_at: new Date().toISOString(), completed_at: null, tags: ["стратегия"] },
  ];
}

export async function getTasks(): Promise<any[]> {
  let data = await kvGet<any[]>("workspace_tasks");
  if (!data) { data = makeDemoTasks(); await kvSet("workspace_tasks", data); }
  return data;
}
export async function saveTasks(tasks: any[]): Promise<void> { await kvSet("workspace_tasks", tasks); }

export async function getTimeSessions(): Promise<any[]> {
  const data = await kvGet<any[]>("workspace_sessions");
  return data ?? [];
}
export async function saveTimeSessions(sessions: any[]): Promise<void> { await kvSet("workspace_sessions", sessions); }

export async function getActiveSession(): Promise<any | null> {
  return kvGet<any>("workspace_active");
}
export async function saveActiveSession(session: any | null): Promise<void> { await kvSet("workspace_active", session); }

// ── AI Agency Team Tasks ───────────────────────────────────────────────────────
export async function getTeamTasks(): Promise<any[]> {
  const data = await kvGet<any[]>("team_tasks");
  return data ?? [];
}
export async function saveTeamTasks(tasks: any[]): Promise<void> { await kvSet("team_tasks", tasks); }

// ── Agent Knowledge Base ──────────────────────────────────────────────────────
export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  added_at: string;
}

export async function getAgentKnowledge(agentId: string): Promise<KnowledgeItem[]> {
  const data = await kvGet<KnowledgeItem[]>(`agent_knowledge:${agentId}`);
  return data ?? [];
}

export async function saveAgentKnowledge(agentId: string, items: KnowledgeItem[]): Promise<void> {
  await kvSet(`agent_knowledge:${agentId}`, items);
}

// ── Automation Runs ───────────────────────────────────────────────────────────
export interface AutomationStep {
  id: string;
  name: string;
  worker_id: string;
  status: "pending" | "running" | "done" | "error";
  result: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface AutomationRun {
  id: string;
  client_id: string;
  client_name: string;
  client_niche: string;
  status: "queued" | "running" | "done" | "error";
  trigger: "new_client" | "manual" | "scheduled";
  created_at: string;
  completed_at: string | null;
  steps: AutomationStep[];
}

export async function getAutomationRuns(): Promise<AutomationRun[]> {
  const data = await kvGet<AutomationRun[]>("automation_runs");
  return data ?? [];
}
export async function saveAutomationRuns(runs: AutomationRun[]): Promise<void> {
  await kvSet("automation_runs", runs);
}

// ── Users (auth) ──────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  password_salt: string;
  role: "admin" | "hub" | "studio" | "free";
  plan: "hub_monthly" | "hub_yearly" | "studio_monthly" | "studio_yearly" | "free" | null;
  plan_expires_at: string | null;
  plan_active: boolean;
  created_at: string;
  last_login: string | null;
}

export async function getUsers(): Promise<User[]> {
  const data = await kvGet<User[]>("users");
  return data ?? [];
}

export async function saveUsers(users: User[]): Promise<void> {
  await kvSet("users", users);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await getUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}
