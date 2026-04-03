import { NextRequest, NextResponse } from "next/server";
import { getFinance } from "@/lib/kv";
import { demoGetGuard } from "@/lib/demo-guard";

const DEMO_FINANCE = {
  transactions: [
    { id: "demo_t1", type: "income", amount: 8000, description: "Оплата — Алина Мороз", date: "2026-03-15", category: "Продюсирование" },
    { id: "demo_t2", type: "income", amount: 3500, description: "Оплата — Максим Кузнецов", date: "2026-03-10", category: "Продюсирование" },
    { id: "demo_t3", type: "expense", amount: 2500, description: "Реклама Instagram", date: "2026-03-08", category: "Реклама" },
    { id: "demo_t4", type: "income", amount: 5200, description: "Оплата — Юлия Захарова", date: "2026-03-01", category: "Продюсирование" },
    { id: "demo_t5", type: "expense", amount: 1345, description: "Сервисы и инструменты", date: "2026-02-28", category: "Прочее" },
  ],
  monthly: [
    { month: "Окт", revenue: 1200 }, { month: "Ноя", revenue: 2100 },
    { month: "Дек", revenue: 3400 }, { month: "Янв", revenue: 4200 },
    { month: "Фев", revenue: 5600 }, { month: "Мар", revenue: 6855 },
  ],
  total_income: 16700,
  total_expense: 3845,
  balance: 12855,
};

export async function GET(req: NextRequest) {
  const demoRes = demoGetGuard(req, DEMO_FINANCE);
  if (demoRes) return demoRes;
  return NextResponse.json(await getFinance());
}
