export interface Lead {
  id: string;
  name: string;
  source: string;
  contact: string;
  niche: string;
  product: string;
  stage: string;
  date: string;
  notes: string;
}

export interface Client {
  id: string;
  name: string;
  niche: string;
  contact: string;
  income_now: number;
  income_goal: number;
  followers: number;
  reach: number;
  engagement: number;
  personality: string;
  products: string[];
  funnel: string;
  strategy: string;
  content_plan: string;
  checklist: Record<string, boolean>;
  alerts: string[];
  transactions: Transaction[];
  journey_step: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
}

export interface Finance {
  transactions: Transaction[];
  monthly: { month: string; revenue: number }[];
  expenses: { label: string; amount: number }[];
}

export interface KPI {
  total_revenue: number;
  monthly_target: number;
  progress_pct: number;
  total_clients: number;
  total_leads: number;
}

// ── Workspace / Personal cabinet ─────────────────────────────────────────────
export type TaskPeriod   = "day" | "week" | "month";
export type TaskStatus   = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id:           string;
  title:        string;
  description:  string;
  period:       TaskPeriod;
  due_date:     string;          // ISO date YYYY-MM-DD
  priority:     TaskPriority;
  status:       TaskStatus;
  created_at:   string;          // ISO datetime
  completed_at: string | null;
  tags:         string[];
}

export interface TimeSession {
  id:        string;
  start:     string;   // ISO datetime
  end:       string;   // ISO datetime
  duration:  number;   // minutes
  category:  string;
  note:      string;
}

// ── Leads pipeline ─────────────────────────────────────────────────────────────
export const STAGE_ORDER = ["new", "contacted", "replied", "interested", "call", "contract"] as const;
export type Stage = typeof STAGE_ORDER[number];

export const STAGE_LABELS: Record<string, string> = {
  new:        "Новый",
  contacted:  "Написали",
  replied:    "Ответили",
  interested: "Интерес",
  call:       "Звонок",
  contract:   "Договор",
};

export const STAGE_COLORS: Record<string, string> = {
  new:        "bg-slate-700 text-slate-200",
  contacted:  "bg-blue-900 text-blue-200",
  replied:    "bg-indigo-900 text-indigo-200",
  interested: "bg-violet-900 text-violet-200",
  call:       "bg-yellow-900 text-yellow-200",
  contract:   "bg-green-900 text-green-200",
};
