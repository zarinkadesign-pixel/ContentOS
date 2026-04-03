"use client";
import { useEffect, useState, useRef } from "react";
import { getLeads, createLead, deleteLead } from "@/lib/api";
import KanbanBoard from "@/components/KanbanBoard";
import { Plus, X, RefreshCw, Zap } from "lucide-react";
import type { Lead } from "@/lib/types";

const EMPTY = { name: "", source: "", contact: "", niche: "", product: "", notes: "" };

export default function CRM() {
  const [leads, setLeads]         = useState<Lead[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastCount, setLastCount] = useState(0);
  const [newLeadBadge, setNewLeadBadge] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const fetched = await getLeads();
      setLeads(fetched);
      if (silent && fetched.length > lastCount) {
        setNewLeadBadge(fetched.length - lastCount);
      }
      setLastCount(fetched.length);
    }
    catch (e) { console.error(e); }
    finally { if (!silent) setLoading(false); }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => load(true), 30_000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, lastCount]); // eslint-disable-line

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await createLead(form);
      setForm(EMPTY);
      setShowForm(false);
      await load();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm("Удалить лида?")) return;
    await deleteLead(id);
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-text">CRM / Лиды</h1>
          <p className="text-sm text-subtext mt-0.5">Воронка продаж — {leads.length} лидов</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors ${
              autoRefresh ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-border text-subtext hover:border-accent/30"
            }`}
            title="Автообновление каждые 30 секунд"
          >
            <RefreshCw size={11} className={autoRefresh ? "animate-spin [animation-duration:3s]" : ""} />
            {autoRefresh ? "Авто" : "Ручной"}
          </button>
          <button onClick={() => { setNewLeadBadge(0); load(); }} className="btn-ghost flex items-center gap-2 shrink-0">
            <RefreshCw size={13} /> Обновить
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 shrink-0">
            <Plus size={14} /> Добавить лида
          </button>
        </div>
      </div>

      {/* New leads notification */}
      {newLeadBadge > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
          <Zap size={14} className="text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-400 flex-1">
            +{newLeadBadge} новых лидов обнаружено! Обновите воронку.
          </p>
          <button onClick={() => setNewLeadBadge(0)} className="text-xs text-emerald-400/60 hover:text-emerald-400">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">Новый лид</h2>
            <button onClick={() => setShowForm(false)} className="text-subtext hover:text-text">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(["name", "source", "contact", "niche", "product"] as const).map((field) => (
              <div key={field}>
                <label className="text-xs text-subtext capitalize block mb-1">
                  {field === "name" ? "Имя *" : field === "source" ? "Источник" : field === "contact" ? "Контакт" : field === "niche" ? "Ниша" : "Продукт"}
                </label>
                <input
                  className="input"
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  placeholder={field === "name" ? "Имя клиента" : ""}
                />
              </div>
            ))}
            <div className="col-span-2">
              <label className="text-xs text-subtext block mb-1">Заметки</label>
              <textarea
                className="input resize-none"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
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

      {/* Board */}
      {loading ? (
        <div className="text-subtext text-sm">Загрузка…</div>
      ) : (
        <KanbanBoard leads={leads} onUpdate={load} />
      )}
    </div>
  );
}
