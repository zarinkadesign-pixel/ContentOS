/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/finance/page.tsx
 */

"use client";

import { useState, useEffect } from "react";
import AdminLayout from "../_components/AdminLayout";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category: string;
  date: string; // ISO "YYYY-MM-DD"
}

interface MonthlyPoint {
  month: string;
  revenue: number;
  expenses?: number;
}

const GOAL = 20000;

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthly,      setMonthly]      = useState<MonthlyPoint[]>([]);
  const [totalIncome,  setTotalIncome]  = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState({ type: "income", amount: "", desc: "", product: "", date: todayString() });

  useEffect(() => {
    fetch("/api/finance")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        if (Array.isArray(data.transactions)) setTransactions(data.transactions);
        if (Array.isArray(data.monthly))      setMonthly(data.monthly);
        setTotalIncome(data.total_income  ?? 0);
        setTotalExpense(data.total_expense ?? 0);
      })
      .catch(() => {});
  }, []);

  const addTransaction = async () => {
    if (!form.amount || !form.desc || !form.date) return;
    const res = await fetch("/api/finance/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type:        form.type,
        amount:      Number(form.amount),
        description: form.desc,
        category:    form.product,
        date:        form.date,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      if (Array.isArray(updated.transactions)) setTransactions(updated.transactions);
      if (Array.isArray(updated.monthly))      setMonthly(updated.monthly);
      setTotalIncome(updated.total_income  ?? totalIncome + (form.type === "income" ? Number(form.amount) : 0));
      setTotalExpense(updated.total_expense ?? totalExpense + (form.type === "expense" ? Number(form.amount) : 0));
    }
    setForm({ type: "income", amount: "", desc: "", product: "", date: todayString() });
    setShowForm(false);
  };

  const deleteTransaction = async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    await fetch(`/api/finance/transactions/${id}`, { method: "DELETE" }).catch(() => {});
  };

  const profit  = totalIncome - totalExpense;
  const goalPct = Math.min(100, Math.round((totalIncome / GOAL) * 100));

  const barMax = Math.max(...monthly.map(m => m.revenue), 1);

  const s = {
    page:       { background: "#050710", minHeight: "100vh", padding: "32px 24px", fontFamily: "Inter, sans-serif", color: "#e2e8f0" },
    header:     { fontSize: 26, fontWeight: 700, marginBottom: 28, color: "#fff" },
    kpiRow:     { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 },
    kpiCard:    { background: "#0d1126", borderRadius: 12, padding: "20px 24px", border: "1px solid #1e2a4a" },
    kpiLabel:   { fontSize: 13, color: "#8892b0", marginBottom: 8 },
    kpiValue:   { fontSize: 26, fontWeight: 700 },
    progressBg: { background: "#1e2a4a", borderRadius: 6, height: 8, marginTop: 10 },
    progressFill: (pct: number) => ({ background: "#5c6af0", width: `${pct}%`, height: "100%", borderRadius: 6, transition: "width .4s" }),
    pctLabel:   { fontSize: 12, color: "#8892b0", marginTop: 4 },
    addBtn:     { background: "#5c6af0", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 14, fontWeight: 600, marginBottom: 20 },
    formCard:   { background: "#0d1126", border: "1px solid #1e2a4a", borderRadius: 12, padding: 20, marginBottom: 24, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 },
    label:      { display: "block", fontSize: 12, color: "#8892b0", marginBottom: 4 },
    input:      { width: "100%", background: "#050710", border: "1px solid #1e2a4a", borderRadius: 6, padding: "8px 10px", color: "#e2e8f0", fontSize: 14, boxSizing: "border-box" as const },
    formActions: { gridColumn: "1 / -1", display: "flex", gap: 10, marginTop: 4 },
    submitBtn:  { background: "#5c6af0", color: "#fff", border: "none", borderRadius: 7, padding: "9px 22px", cursor: "pointer", fontWeight: 600, fontSize: 14 },
    cancelBtn:  { background: "transparent", color: "#8892b0", border: "1px solid #1e2a4a", borderRadius: 7, padding: "9px 18px", cursor: "pointer", fontSize: 14 },
    tableWrap:  { background: "#0d1126", borderRadius: 12, border: "1px solid #1e2a4a", overflow: "hidden", marginBottom: 28 },
    table:      { width: "100%", borderCollapse: "collapse" as const, fontSize: 14 },
    th:         { padding: "12px 16px", textAlign: "left" as const, color: "#8892b0", fontSize: 12, fontWeight: 600, borderBottom: "1px solid #1e2a4a" },
    td:         { padding: "11px 16px", borderBottom: "1px solid #0d1a30" },
    delBtn:     { background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16, padding: "0 4px" },
    chartCard:  { background: "#0d1126", borderRadius: 12, border: "1px solid #1e2a4a", padding: "20px 24px" },
    chartTitle: { fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 16 },
  };

  return (
    <AdminLayout>
    <div style={s.page}>
      <div style={s.header}>Финансы</div>

      {/* KPI Cards */}
      <div style={s.kpiRow}>
        <div style={s.kpiCard}>
          <div style={s.kpiLabel}>Всего доходов</div>
          <div style={{ ...s.kpiValue, color: "#22c55e" }}>${totalIncome.toLocaleString()}</div>
        </div>
        <div style={s.kpiCard}>
          <div style={s.kpiLabel}>Всего расходов</div>
          <div style={{ ...s.kpiValue, color: "#ef4444" }}>${totalExpense.toLocaleString()}</div>
        </div>
        <div style={s.kpiCard}>
          <div style={s.kpiLabel}>Баланс</div>
          <div style={{ ...s.kpiValue, color: profit >= 0 ? "#22c55e" : "#ef4444" }}>${profit.toLocaleString()}</div>
        </div>
        <div style={s.kpiCard}>
          <div style={s.kpiLabel}>Цель ${GOAL.toLocaleString()}</div>
          <div style={{ ...s.kpiValue, color: "#5c6af0" }}>{goalPct}%</div>
          <div style={s.progressBg}><div style={s.progressFill(goalPct)} /></div>
          <div style={s.pctLabel}>${totalIncome.toLocaleString()} / ${GOAL.toLocaleString()}</div>
        </div>
      </div>

      {/* Add button */}
      <button style={s.addBtn} onClick={() => setShowForm(v => !v)}>+ Добавить транзакцию</button>

      {/* Inline form */}
      {showForm && (
        <div style={s.formCard}>
          <div>
            <label style={s.label}>Тип</label>
            <select style={s.input} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="income">Доход</option>
              <option value="expense">Расход</option>
            </select>
          </div>
          <div>
            <label style={s.label}>Сумма ($)</label>
            <input style={s.input} type="number" placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <label style={s.label}>Дата (ГГГГ-ММ-ДД)</label>
            <input style={s.input} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label style={s.label}>Описание</label>
            <input style={s.input} type="text" placeholder="Описание" value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} />
          </div>
          <div>
            <label style={s.label}>Продукт</label>
            <input style={s.input} type="text" placeholder="Продукт" value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))} />
          </div>
          <div style={s.formActions}>
            <button style={s.submitBtn} onClick={addTransaction}>Добавить</button>
            <button style={s.cancelBtn} onClick={() => setShowForm(false)}>Отмена</button>
          </div>
        </div>
      )}

      {/* Transactions table */}
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              {["Дата", "Тип", "Описание", "Продукт", "Сумма", ""].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 && (
              <tr><td colSpan={6} style={{ ...s.td, textAlign: "center", color: "#8892b0" }}>Нет транзакций</td></tr>
            )}
            {transactions.map(t => (
              <tr key={t.id}>
                <td style={s.td}>{t.date}</td>
                <td style={{ ...s.td, color: t.type === "income" ? "#22c55e" : "#ef4444" }}>
                  {t.type === "income" ? "Доход" : "Расход"}
                </td>
                <td style={s.td}>{t.description}</td>
                <td style={{ ...s.td, color: "#8892b0" }}>{t.category || "—"}</td>
                <td style={{ ...s.td, fontWeight: 600, color: t.type === "income" ? "#22c55e" : "#ef4444" }}>
                  {t.type === "income" ? "+" : "-"}${t.amount.toLocaleString()}
                </td>
                <td style={s.td}>
                  <button style={s.delBtn} onClick={() => deleteTransaction(t.id)} title="Удалить">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bar chart */}
      <div style={s.chartCard}>
        <div style={s.chartTitle}>Доход по месяцам</div>
        {monthly.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#8892b0", fontSize: 13 }}>Нет данных</div>
        )}
        {monthly.length > 0 && (
          <svg width="100%" height={160} viewBox={`0 0 ${monthly.length * 80} 160`} preserveAspectRatio="xMidYMid meet">
            {monthly.map((pt, i) => {
              const barH = Math.round((pt.revenue / barMax) * 110);
              const x = i * 80 + 16;
              const y = 120 - barH;
              return (
                <g key={i}>
                  <rect x={x} y={y} width={48} height={barH} rx={5} fill="#5c6af0" />
                  <text x={x + 24} y={136} textAnchor="middle" fontSize={11} fill="#8892b0">{pt.month}</text>
                  {pt.revenue > 0 && (
                    <text x={x + 24} y={y - 4} textAnchor="middle" fontSize={10} fill="#e2e8f0">${pt.revenue.toLocaleString()}</text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  </AdminLayout>
  );
}
