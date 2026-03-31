"use client";
import { useEffect, useState } from "react";
import { getLeads, createLead, deleteLead } from "@/lib/api";
import KanbanBoard from "@/components/KanbanBoard";
import { Plus, X } from "lucide-react";
import type { Lead } from "@/lib/types";

const EMPTY = { name: "", source: "", contact: "", niche: "", product: "", notes: "" };

export default function CRM() {
  const [leads, setLeads]     = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);

  async function load() {
    setLoading(true);
    try { setLeads(await getLeads()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">CRM</h1>
          <p className="text-sm text-subtext mt-0.5">Воронка продаж — {leads.length} лидов</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> Добавить лида
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">Новый лид</h2>
            <button onClick={() => setShowForm(false)} className="text-subtext hover:text-text">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={submit} className="grid grid-cols-2 gap-3">
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
