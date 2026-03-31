import { NextRequest, NextResponse } from "next/server";
import { getFinance, saveFinance } from "@/lib/kv";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const body    = await req.json();
  if (!body.description || !body.amount) return NextResponse.json({ detail: "description and amount required" }, { status: 400 });

  const finance = await getFinance();
  const tx = {
    id:       `t_${randomUUID()}`,
    date:     new Date().toISOString().slice(0, 10),
    category: "",
    type:     "income",
    ...body,
  };
  finance.transactions = [tx, ...(finance.transactions ?? [])];

  // Update monthly chart for current month (income → revenue, expense → expenses)
  const month  = new Date().toLocaleString("ru", { month: "short" });
  const monthly = finance.monthly ?? [];
  const mIdx    = monthly.findIndex((m: any) => m.month === month);
  if (tx.type === "income") {
    if (mIdx >= 0) monthly[mIdx].revenue = (monthly[mIdx].revenue ?? 0) + tx.amount;
    else monthly.push({ month, revenue: tx.amount, expenses: 0 });
  } else {
    if (mIdx >= 0) monthly[mIdx].expenses = (monthly[mIdx].expenses ?? 0) + tx.amount;
    else monthly.push({ month, revenue: 0, expenses: tx.amount });
  }
  finance.monthly = monthly;

  await saveFinance(finance);
  return NextResponse.json(finance, { status: 201 });
}
