"use client";
import { useEffect, useState } from "react";
import { getFinance, addTransaction, deleteTransaction } from "@/lib/api";
import KPICard from "@/components/KPICard";
import { DollarSign, TrendingUp, TrendingDown, Plus, X, Trash2 } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import clsx from "clsx";

const EMPTY = { description: "", amount: 0, type: "income", category: "" };

export default function Finance() {
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  async function handleDelete(id: string) {
    if (!confirm("Удалить транзакцию?")) return;
    setDeleting(id);
    try {
      await deleteTransaction(id);
      await load();
    } catch (e) { console.error(e); }
    finally { setDeleting(null); }
  }

  if (loading) return <div className="text-subtext text-sm">Загрузка…</div>;
  if (!data)   return <div className="text-red-400">Ошибка загрузки</div>;

  const { transactions = [], monthly = [] } = data;
  const income  = transactions.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + t.amount, 0);
  const expense = transactions.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + t.amount, 0);
  const profit  = income - expense;

  // Ensure every monthly entry has both fields
  const chartData = monthly.map((m: any) => ({
    month:    m.month,
    revenue:  m.revenue  ?? 0,
    expenses: m.expenses ?? 0,
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-text">Финансы</h1>
          <p className="text-sm text-subtext mt-0.5">Доходы и расходы</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus size={14} /> Транзакция
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 stagger">
        <KPICard label="Доходы"  value={`$${income.toLocaleString()}`}  icon={TrendingUp}   color="green" />
        <KPICard label="Расходы" value={`$${expense.toLocaleString()}`} icon={TrendingDown}  color="red"   />
        <KPICard label="Прибыль" value={`$${profit.toLocaleString()}`}  icon={DollarSign}
          color={profit >= 0 ? "green" : "red"} />
      </div>

      {showForm && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">Новая транзакция</h2>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-subtext" /></button>
          </div>
          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-subtext block mb-1">Описание *</label>
              <input className="input w-full" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-subtext block mb-1">Сумма ($) *</label>
              <input className="input w-full" type="number" min={0} value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs text-subtext block mb-1">Тип</label>
              <select className="input w-full" value={form.type}
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

      {/* Dual-line chart: revenue + expenses */}
      {chartData.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-text mb-4">📈 Доходы и расходы по месяцам</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6c63ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f87171" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#0d1126", border: "1px solid #1a1f3a", borderRadius: 8 }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#64748b" }}
                formatter={(v) => v === "revenue" ? "Доходы" : "Расходы"} />
              <Area type="monotone" dataKey="revenue"  stroke="#6c63ff" strokeWidth={2}
                fill="url(#gradRev)" name="revenue" />
              <Area type="monotone" dataKey="expenses" stroke="#f87171" strokeWidth={2}
                fill="url(#gradExp)" name="expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Transactions list */}
      <div className="card">
        <h2 className="text-sm font-semibold text-text mb-4">История транзакций</h2>
        {transactions.length === 0 ? (
          <p className="text-subtext text-sm">Транзакций пока нет</p>
        ) : (
          <div className="divide-y divide-border">
            {[...transactions].reverse().map((t: any) => (
              <div key={t.id ?? t.description}
                className="flex items-center gap-2 py-3 first:pt-0 last:pb-0 group">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text truncate">{t.description}</p>
                  <p className="text-xs text-subtext truncate">{t.category} · {t.date}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={clsx("text-sm font-bold",
                    t.type === "income" ? "text-green-400" : "text-red-400")}>
                    {t.type === "income" ? "+" : "−"}${t.amount.toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deleting === t.id}
                    className="opacity-0 group-hover:opacity-100 p-1 text-subtext hover:text-red-400
                               hover:bg-red-400/10 rounded transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
