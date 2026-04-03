"use client";
import { useEffect, useState } from "react";
import { getClients, createClient } from "@/lib/api";
import Link from "next/link";
import { Plus, X, TrendingUp, User } from "lucide-react";
import type { Client } from "@/lib/types";

const EMPTY = { name: "", niche: "", contact: "", income_now: 0, income_goal: 0 };

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);

  async function load() {
    setLoading(true);
    try { setClients(await getClients()); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await createClient(form);
      setForm(EMPTY);
      setShowForm(false);
      await load();
    } finally { setSaving(false); }
  }

  const totalRevenue = clients.reduce((s, c) => s + (c.income_now ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-text">Клиенты</h1>
          <p className="text-sm text-subtext mt-0.5">{clients.length} клиентов · ${totalRevenue.toLocaleString()} / мес</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus size={14} /> Добавить клиента
        </button>
      </div>

      {showForm && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">Новый клиент</h2>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-subtext" /></button>
          </div>
          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-subtext block mb-1">Имя *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-subtext block mb-1">Ниша</label>
              <input className="input" value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-subtext block mb-1">Контакт</label>
              <input className="input" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-subtext block mb-1">Доход сейчас ($)</label>
              <input className="input" type="number" value={form.income_now}
                onChange={(e) => setForm({ ...form, income_now: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs text-subtext block mb-1">Цель дохода ($)</label>
              <input className="input" type="number" value={form.income_goal}
                onChange={(e) => setForm({ ...form, income_goal: Number(e.target.value) })} />
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

      {loading ? (
        <div className="text-subtext text-sm">Загрузка…</div>
      ) : clients.length === 0 ? (
        <div className="card text-center py-10 text-subtext">Клиентов пока нет</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
          {clients.map((c) => {
            const pct = c.income_goal ? Math.round((c.income_now / c.income_goal) * 100) : 0;
            return (
              <Link key={c.id} href={`/clients/${c.id}`}
                className="card hover:border-accent/50 transition-colors group cursor-pointer">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-lg shrink-0">
                    {c.name?.[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-text group-hover:text-accent transition-colors truncate">{c.name}</p>
                    <p className="text-xs text-subtext truncate">{c.niche}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-xs text-subtext">Доход</p>
                    <p className="text-base font-bold text-green-400">${(c.income_now ?? 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-subtext">Цель</p>
                    <p className="text-base font-bold text-text">${(c.income_goal ?? 0).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-subtext mb-1">
                    <span>Прогресс</span><span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-accent to-green-400 rounded-full"
                      style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1 text-xs text-subtext">
                  <TrendingUp size={11} />
                  <span>Открыть профиль →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
