/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/crm/page.tsx
 */

"use client";

import { useState, useEffect } from "react";
import AdminLayout from "../_components/AdminLayout";

interface Lead {
  id: string;
  name: string;
  contact: string;
  niche: string;
  source: string;
  stage: string;
  date: string;
  notes: string;
}

const STAGES: { key: string; label: string }[] = [
  { key: "new",      label: "🆕 Новый"    },
  { key: "replied",  label: "💬 Диалог"   },
  { key: "call",     label: "📞 Созвон"   },
  { key: "contract", label: "✅ Контракт" },
  { key: "client",   label: "🏆 Клиент"   },
];

const SOURCES = ["Все", "instagram", "telegram", "ads", "2gis", "organics"];

const EMPTY_FORM = { name: "", contact: "", niche: "", source: "instagram", notes: "" };

export default function CRMPage() {
  const [leads, setLeads]           = useState<Lead[]>([]);
  const [sourceFilter, setFilter]   = useState("Все");
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);

  useEffect(() => {
    fetch("/api/leads")
      .then(r => r.ok ? r.json() : [])
      .then((data: Lead[]) => { if (Array.isArray(data)) setLeads(data); })
      .catch(() => {});
  }, []);

  const moveToNext = async (id: string) => {
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;
    const idx = STAGES.findIndex((s) => s.key === lead.stage);
    if (idx === STAGES.length - 1) return;
    const newStage = STAGES[idx + 1].key;
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage: newStage } : l));
    await fetch(`/api/leads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    }).catch(() => {});
  };

  const deleteLead = async (id: string) => {
    if (!confirm("Удалить лид?")) return;
    setLeads(prev => prev.filter(l => l.id !== id));
    await fetch(`/api/leads/${id}`, { method: "DELETE" }).catch(() => {});
  };

  const addLead = async () => {
    if (!form.name.trim() || !form.contact.trim()) return;
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:    form.name.trim(),
        contact: form.contact.trim(),
        niche:   form.niche.trim(),
        source:  form.source,
        notes:   form.notes.trim(),
      }),
    });
    if (res.ok) {
      const newLead: Lead = await res.json();
      setLeads(prev => [...prev, newLead]);
    }
    setForm(EMPTY_FORM);
    setShowModal(false);
  };

  const filtered = sourceFilter === "Все" ? leads : leads.filter((l) => l.source === sourceFilter);

  // ── styles ──────────────────────────────────────────────────────────────────
  const s = {
    page:       { minHeight: "100vh", background: "#050710", color: "#e4e9ff", fontFamily: "Inter, sans-serif", padding: "28px 32px" } as React.CSSProperties,
    header:     { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 } as React.CSSProperties,
    title:      { fontSize: 22, fontWeight: 700, color: "#e4e9ff", margin: 0 } as React.CSSProperties,
    btnPrimary: { background: "#5c6af0", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" } as React.CSSProperties,
    toolbar:    { display: "flex", alignItems: "center", gap: 12, marginBottom: 24 } as React.CSSProperties,
    select:     { background: "#0d1126", color: "#e4e9ff", border: "1px solid #1e2a4a", borderRadius: 8, padding: "7px 12px", fontSize: 13 } as React.CSSProperties,
    board:      { display: "flex", gap: 16, overflowX: "auto" as const, paddingBottom: 16 },
    col:        { minWidth: 240, flex: "0 0 240px", background: "#0a0f20", borderRadius: 12, padding: 14, border: "1px solid #1a2240" } as React.CSSProperties,
    colHeader:  { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 } as React.CSSProperties,
    colLabel:   { fontSize: 13, fontWeight: 600, color: "#e4e9ff" } as React.CSSProperties,
    badge:      { background: "#1e2a4a", color: "#6b7db3", borderRadius: 20, padding: "2px 8px", fontSize: 12 } as React.CSSProperties,
    card:       {
      background:  "#0d1126",
      borderRadius: 10,
      padding:     12,
      marginBottom: 10,
      borderLeft:  `3px solid #1e2a4a`,
      cursor:      "default",
    } as React.CSSProperties,
    cardName:   { fontWeight: 700, fontSize: 14, color: "#e4e9ff", marginBottom: 2 } as React.CSSProperties,
    cardContact:{ fontSize: 12, color: "#6b7db3", marginBottom: 8 } as React.CSSProperties,
    badgeRow:   { display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" as const },
    tagNiche:   { background: "#1a2550", color: "#8090d0", borderRadius: 6, padding: "2px 7px", fontSize: 11 } as React.CSSProperties,
    tagSource:  { background: "#1e3030", color: "#50b090", borderRadius: 6, padding: "2px 7px", fontSize: 11 } as React.CSSProperties,
    cardDate:   { fontSize: 11, color: "#6b7db3", marginBottom: 10 } as React.CSSProperties,
    cardBtns:   { display: "flex", gap: 6 } as React.CSSProperties,
    btnMove:    { flex: 1, background: "#1a2550", color: "#8090d0", border: "none", borderRadius: 6, padding: "5px 8px", fontSize: 12, cursor: "pointer" } as React.CSSProperties,
    btnDel:     { background: "#2a1a2a", color: "#c06070", border: "none", borderRadius: 6, padding: "5px 9px", fontSize: 12, cursor: "pointer" } as React.CSSProperties,
    overlay:    { position: "fixed" as const, inset: 0, background: "rgba(5,7,16,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
    modal:      { background: "#0d1126", border: "1px solid #1e2a4a", borderRadius: 14, padding: 28, width: 360, display: "flex", flexDirection: "column" as const, gap: 14 } as React.CSSProperties,
    modalTitle: { fontSize: 17, fontWeight: 700, color: "#e4e9ff", margin: 0 } as React.CSSProperties,
    input:      { background: "#050710", color: "#e4e9ff", border: "1px solid #1e2a4a", borderRadius: 8, padding: "9px 12px", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" as const } as React.CSSProperties,
    label:      { fontSize: 12, color: "#6b7db3", marginBottom: 4, display: "block" } as React.CSSProperties,
    modalBtns:  { display: "flex", gap: 10, marginTop: 4 } as React.CSSProperties,
    btnCancel:  { flex: 1, background: "#1a2240", color: "#6b7db3", border: "none", borderRadius: 8, padding: "9px", fontSize: 14, cursor: "pointer" } as React.CSSProperties,
  };

  return (
    <AdminLayout>
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}>CRM — Лиды</h1>
        <button style={s.btnPrimary} onClick={() => setShowModal(true)}>+ Новый лид</button>
      </div>

      {/* Toolbar */}
      <div style={s.toolbar}>
        <span style={{ fontSize: 13, color: "#6b7db3" }}>Источник:</span>
        <select style={s.select} value={sourceFilter} onChange={(e) => setFilter(e.target.value)}>
          {SOURCES.map((src) => <option key={src} value={src}>{src}</option>)}
        </select>
      </div>

      {/* Kanban board */}
      <div style={s.board}>
        {STAGES.map((stage) => {
          const colLeads = filtered.filter((l) => l.stage === stage.key);
          const isLast   = stage.key === "client";
          return (
            <div key={stage.key} style={s.col}>
              <div style={s.colHeader}>
                <span style={s.colLabel}>{stage.label}</span>
                <span style={s.badge}>{colLeads.length}</span>
              </div>

              {colLeads.map((lead) => (
                <div key={lead.id} style={s.card}>
                  <div style={s.cardName}>{lead.name}</div>
                  <div style={s.cardContact}>{lead.contact}</div>
                  <div style={s.badgeRow}>
                    {lead.niche  && <span style={s.tagNiche}>{lead.niche}</span>}
                    {lead.source && <span style={s.tagSource}>{lead.source}</span>}
                  </div>
                  <div style={s.cardDate}>{lead.date}</div>
                  <div style={s.cardBtns}>
                    {!isLast && (
                      <button style={s.btnMove} onClick={() => moveToNext(lead.id)}>→ Перенести</button>
                    )}
                    <button style={s.btnDel} onClick={() => deleteLead(lead.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={s.overlay} onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={s.modal}>
            <h2 style={s.modalTitle}>Новый лид</h2>

            <div>
              <label style={s.label}>Имя *</label>
              <input style={s.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Имя контакта" />
            </div>

            <div>
              <label style={s.label}>Контакт *</label>
              <input style={s.input} value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="@username или телефон" />
            </div>

            <div>
              <label style={s.label}>Ниша</label>
              <input style={s.input} value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} placeholder="Фитнес, Коучинг…" />
            </div>

            <div>
              <label style={s.label}>Источник</label>
              <select style={{ ...s.input, ...s.select }} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                {SOURCES.filter((s) => s !== "Все").map((src) => <option key={src} value={src}>{src}</option>)}
              </select>
            </div>

            <div>
              <label style={s.label}>Заметки</label>
              <input style={s.input} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Доп. информация" />
            </div>

            <div style={s.modalBtns}>
              <button style={s.btnCancel} onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}>Отмена</button>
              <button style={s.btnPrimary} onClick={addLead}>Добавить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  </AdminLayout>
  );
}
