"use client";
import { useState } from "react";
import clsx from "clsx";
import { STAGE_ORDER, STAGE_LABELS, STAGE_COLORS, type Lead } from "@/lib/types";
import { moveLead, updateLead, deleteLead } from "@/lib/api";
import { User, ArrowRight, Edit2, Trash2, X, Save, Loader2 } from "lucide-react";

interface Props {
  leads: Lead[];
  onUpdate: () => void;
}

const EMPTY_EDIT = { name: "", source: "", contact: "", niche: "", product: "", notes: "" };

export default function KanbanBoard({ leads, onUpdate }: Props) {
  const [moving,   setMoving]   = useState<string | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [draft,    setDraft]    = useState<typeof EMPTY_EDIT>(EMPTY_EDIT);
  const [saving,   setSaving]   = useState(false);

  async function handleMove(leadId: string, stage: string) {
    setMoving(leadId);
    try { await moveLead(leadId, stage); onUpdate(); }
    catch (e) { console.error(e); }
    finally { setMoving(null); }
  }

  function openEdit(lead: Lead) {
    setDraft({
      name:    lead.name    ?? "",
      source:  lead.source  ?? "",
      contact: lead.contact ?? "",
      niche:   lead.niche   ?? "",
      product: lead.product ?? "",
      notes:   lead.notes   ?? "",
    });
    setEditLead(lead);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editLead || !draft.name.trim()) return;
    setSaving(true);
    try {
      await updateLead(editLead.id, draft);
      setEditLead(null);
      onUpdate();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить лида?")) return;
    await deleteLead(id);
    onUpdate();
  }

  const FIELDS: { key: keyof typeof EMPTY_EDIT; label: string }[] = [
    { key: "name",    label: "Имя *"    },
    { key: "source",  label: "Источник" },
    { key: "contact", label: "Контакт"  },
    { key: "niche",   label: "Ниша"     },
    { key: "product", label: "Продукт"  },
  ];

  return (
    <>
      {/* ── Edit modal ──────────────────────────────────────────────────────── */}
      {editLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text">Редактировать лида</h2>
              <button onClick={() => setEditLead(null)} className="text-subtext hover:text-text">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={saveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {FIELDS.map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-xs text-subtext block mb-1">{label}</label>
                    <input className="input w-full" value={draft[key]}
                      onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs text-subtext block mb-1">Заметки</label>
                <textarea rows={2} className="input w-full resize-none" value={draft.notes}
                  onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button type="button" onClick={() => setEditLead(null)} className="btn-ghost">Отмена</button>
                <button type="submit" disabled={saving || !draft.name.trim()} className="btn-primary flex items-center gap-1">
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Board ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {STAGE_ORDER.map((stage) => {
          const col = leads.filter((l) => l.stage === stage);
          return (
            <div key={stage} className="shrink-0 w-52">
              {/* Column header */}
              <div className="flex items-center justify-between mb-2">
                <span className={clsx("badge text-xs", STAGE_COLORS[stage])}>
                  {STAGE_LABELS[stage]}
                </span>
                <span className="text-xs text-subtext">{col.length}</span>
              </div>

              {/* Cards */}
              <div className="space-y-2 min-h-20">
                {col.map((lead) => (
                  <div key={lead.id} className="card p-3 space-y-2 group">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                        <User size={10} className="text-accent" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-text truncate">{lead.name}</p>
                        <p className="text-xs text-subtext truncate">{lead.niche}</p>
                      </div>
                      {/* Action buttons — visible on hover */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => openEdit(lead)}
                          className="p-1 text-subtext hover:text-accent hover:bg-accent/10 rounded transition-colors">
                          <Edit2 size={11} />
                        </button>
                        <button onClick={() => handleDelete(lead.id)}
                          className="p-1 text-subtext hover:text-red-400 hover:bg-red-400/10 rounded transition-colors">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                    {lead.source && <p className="text-xs text-subtext">📍 {lead.source}</p>}
                    {lead.notes  && <p className="text-xs text-subtext/70 italic truncate">💬 {lead.notes}</p>}

                    {/* Move to next stage */}
                    {stage !== "contract" && (
                      <button disabled={moving === lead.id}
                        onClick={() => {
                          const next = STAGE_ORDER[STAGE_ORDER.indexOf(stage) + 1];
                          if (next) handleMove(lead.id, next);
                        }}
                        className="w-full flex items-center justify-center gap-1 text-xs text-accent
                                   hover:text-white bg-accent/10 hover:bg-accent/30 rounded px-2 py-1 transition-colors">
                        {moving === lead.id
                          ? <Loader2 size={10} className="animate-spin" />
                          : <>{STAGE_LABELS[STAGE_ORDER[STAGE_ORDER.indexOf(stage) + 1]]} <ArrowRight size={10} /></>
                        }
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
