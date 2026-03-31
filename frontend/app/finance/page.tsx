"use client";
import { useEffect, useState } from "react";
import { getFinance, addTransaction } from "@/lib/api";
import KPICard from "@/components/KPICard";
import { DollarSign, TrendingUp, TrendingDown, Plus, X } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import clsx from "clsx";

const EMPTY = { description: "", amount: 0, type: "income", category: "" };

export default function Finance() {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);

  async function load() {
    setLoading(true);
    try { setData(await getFinance()); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description || !form.amount) return;
    setSaving(true);
    try {
      await addTransaction(form);
      setForm(EMPTY);
      setShowForm(false);
      await load();
    } finally { setSaving(false); }
  }

  if (loading) return <div className="text-subtext text-sm">Загрузка…</div>;
  if (!data)   return <div className="text-red-400">Ошибка загрузки</div>;

  const { transactions = [], monthly = [], expenses = [] } = data;
  const income  = transactions.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + t.amount, 0);
  const expense = transactions.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + t.amount, 0);
  const profit  = income - expense;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Финансы</h1>
          <p className="text-sm text-subtext mt-0.5">Доходы и расходы</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> Транзакция
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KPICard label="Доходы" value={`$${income.toLocaleString()}`} icon={TrendingUp} color="green" />
        <KPICard label="Расходы" value={`$${expense.toLocaleString()}`} icon={TrendingDown} color="red" />
        <KPICard label="Прибыль" value={`$${profit.toLocaleString()}`} icon={DollarSign}
          color={profit >= 0 ? "green" : "red"} />
      </div>

      {showForm && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">Новая транзакция</h2>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-subtext" /></button>
          </div>
          <form onSubmit={submit} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-subtext block mb-1">Описание *</label>
              <input className="input" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-subtext block mb-1">Сумма ($) *</label>
              <input className="input" type="number" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs text-subtext block mb-1">Тип</label>
              <select className="input" value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="income">Доход</option>
                <option value="expense">Расход</option>
              </select>
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Отмена</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Сохраняем…" : "Добавить"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Chart */}
      {monthly.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-text mb-4">📈 Выручка по месяцам</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6c63ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#0d1126", border: "1px solid #1a1f3a", borderRadius: 8 }}
                labelStyle={{ color: "#e2e8f0" }} itemStyle={{ color: "#6c63ff" }} />
              <Area type="monotone" dataKey="revenue" stroke="#6c63ff" strokeWidth={2} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Transactions */}
      <div className="card">
        <h2 className="text-sm font-semibold text-text mb-4">История транзакций</h2>
        {transactions.length === 0 ? (
          <p className="text-subtext text-sm">Транзакций пока нет</p>
        ) : (
          <div className="divide-y divide-border">
            {[...transactions].reverse().map((t: any) => (
              <div key={t.id ?? t.description} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-text">{t.description}</p>
                  <p className="text-xs text-subtext">{t.category} · {t.date}</p>
                </div>
                <span className={clsx("text-sm font-bold", t.type === "income" ? "text-green-400" : "text-red-400")}>
                  {t.type === "income" ? "+" : "−"}${t.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
