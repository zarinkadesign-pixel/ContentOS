/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/clients/page.tsx
 */

"use client";

import { useState, useEffect } from "react";
import AdminLayout from "../_components/AdminLayout";

interface Transaction {
  date: string;
  amount: number;
  desc: string;
}

interface Client {
  id: string;
  name: string;
  niche: string;
  type: string;
  amount: number;
  startDate: string;
  progress: number;
  goal: string;
  audience: string;
  socials: string;
  incomeBefore: string;
  incomeTarget: string;
  assets: string;
  notes: string;
  stages: boolean[];
  transactions: Transaction[];
}

const STAGES = [
  "Упаковка",
  "Контент-план",
  "Запуск воронки",
  "Первые продажи",
  "Масштаб",
  "Аналитика",
  "Оптимизация",
  "Итоговый результат",
];

const DEMO_DATA: Client[] = [
  {
    id: "1",
    name: "Алина Морозова",
    niche: "Нутрициология",
    type: "продюсирование",
    amount: 3000,
    startDate: "01.03.2026",
    progress: 68,
    goal: "Выйти на $15k/мес",
    audience: "Женщины 30-45",
    socials: "Instagram 8k",
    incomeBefore: "$2k",
    incomeTarget: "$15k",
    assets: "3 курса",
    notes: "Отличный прогресс",
    stages: [true, true, true, true, false, false, false, false],
    transactions: [
      { date: "01.03.2026", amount: 900, desc: "Аванс 30%" },
      { date: "01.04.2026", amount: 900, desc: "Платёж 2" },
    ],
  },
];

const EMPTY_CLIENT: Omit<Client, "id"> = {
  name: "",
  niche: "",
  type: "наставничество",
  amount: 0,
  startDate: "",
  progress: 0,
  goal: "",
  audience: "",
  socials: "",
  incomeBefore: "",
  incomeTarget: "",
  assets: "",
  notes: "",
  stages: Array(8).fill(false) as boolean[],
  transactions: [],
};

const bg = "#050710";
const card = "#0d1126";
const accent = "#5c6af0";
const border = "#1a2040";
const textMuted = "#7b88b8";
const textMain = "#e8eaf6";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [profileClient, setProfileClient] = useState<Client | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newClient, setNewClient] = useState<Omit<Client, "id">>(EMPTY_CLIENT);
  const [activeTab, setActiveTab] = useState<"stages" | "notes" | "transactions">("stages");

  useEffect(() => {
    fetch("/api/clients")
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        const mapped: Client[] = data.map(c => ({
          id:           String(c.id),
          name:         c.name         ?? "",
          niche:        c.niche        ?? "",
          type:         c.type         ?? "наставничество",
          amount:       c.amount       ?? c.income_now ?? 0,
          startDate:    c.startDate    ?? "",
          progress:     c.progress     ?? 0,
          goal:         c.goal         ?? "",
          audience:     c.audience     ?? "",
          socials:      c.socials      ?? "",
          incomeBefore: c.incomeBefore ?? "",
          incomeTarget: c.incomeTarget ?? "",
          assets:       c.assets       ?? "",
          notes:        c.notes        ?? "",
          stages:       Array.isArray(c.stages) ? c.stages : Array(8).fill(false) as boolean[],
          transactions: Array.isArray(c.transactions) ? c.transactions : [],
        }));
        setClients(mapped);
      })
      .catch(() => {});
  }, []);

  const saveProfile = async () => {
    if (!profileClient) return;
    setClients(prev => prev.map(c => c.id === profileClient.id ? profileClient : c));
    await fetch(`/api/clients/${profileClient.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: profileClient }),
    }).catch(() => {});
    setProfileClient(null);
  };

  const addClient = async () => {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newClient),
    });
    if (res.ok) {
      const created = await res.json();
      const mapped: Client = {
        id:           String(created.id),
        name:         created.name         ?? newClient.name,
        niche:        created.niche        ?? newClient.niche,
        type:         created.type         ?? newClient.type,
        amount:       created.amount       ?? newClient.amount,
        startDate:    created.startDate    ?? newClient.startDate,
        progress:     created.progress     ?? 0,
        goal:         created.goal         ?? newClient.goal,
        audience:     created.audience     ?? "",
        socials:      created.socials      ?? "",
        incomeBefore: created.incomeBefore ?? "",
        incomeTarget: created.incomeTarget ?? "",
        assets:       created.assets       ?? "",
        notes:        created.notes        ?? "",
        stages:       Array.isArray(created.stages) ? created.stages : Array(8).fill(false) as boolean[],
        transactions: created.transactions ?? [],
      };
      setClients(prev => [...prev, mapped]);
    }
    setNewClient(EMPTY_CLIENT);
    setShowAdd(false);
  };

  const toggleStage = (idx: number) => {
    if (!profileClient) return;
    const stages = [...profileClient.stages];
    stages[idx] = !stages[idx];
    setProfileClient({ ...profileClient, stages });
  };

  const inputStyle: React.CSSProperties = {
    background: "#0a0f24",
    border: `1px solid ${border}`,
    borderRadius: 8,
    color: textMain,
    padding: "8px 12px",
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    color: textMuted,
    fontSize: 12,
    marginBottom: 4,
    display: "block",
  };

  const modalOverlay: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 16,
  };

  const modalBox: React.CSSProperties = {
    background: card,
    border: `1px solid ${border}`,
    borderRadius: 16,
    width: "100%",
    maxWidth: 600,
    maxHeight: "90vh",
    overflowY: "auto",
    padding: 28,
  };

  return (
    <AdminLayout>
    <div style={{ background: bg, minHeight: "100vh", padding: 32, fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <h1 style={{ color: textMain, fontSize: 28, fontWeight: 700, margin: 0 }}>Клиенты</h1>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            background: accent,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Добавить клиента
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
        {clients.map((c) => (
          <div
            key={c.id}
            style={{
              background: card,
              border: `1px solid ${border}`,
              borderRadius: 14,
              padding: 22,
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: textMain, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{c.name}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ background: "#1a2040", color: accent, fontSize: 12, borderRadius: 6, padding: "3px 10px" }}>
                  {c.niche}
                </span>
                <span style={{ background: "#1a2040", color: "#a0aec0", fontSize: 12, borderRadius: 6, padding: "3px 10px" }}>
                  {c.type}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
              <div>
                <div style={{ color: textMuted, fontSize: 11 }}>Сумма</div>
                <div style={{ color: "#4ade80", fontSize: 16, fontWeight: 700 }}>${c.amount.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ color: textMuted, fontSize: 11 }}>Старт</div>
                <div style={{ color: textMain, fontSize: 14 }}>{c.startDate}</div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ color: textMuted, fontSize: 12 }}>Прогресс</span>
                <span style={{ color: accent, fontSize: 12, fontWeight: 600 }}>{c.progress}%</span>
              </div>
              <div style={{ background: border, borderRadius: 99, height: 7 }}>
                <div
                  style={{
                    background: `linear-gradient(90deg, ${accent}, #8b9bf8)`,
                    width: `${c.progress}%`,
                    height: "100%",
                    borderRadius: 99,
                    transition: "width 0.4s",
                  }}
                />
              </div>
            </div>

            <div style={{ color: textMuted, fontSize: 13, marginBottom: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {c.goal}
            </div>

            <button
              onClick={() => { setProfileClient(c); setActiveTab("stages"); }}
              style={{
                background: "transparent",
                border: `1px solid ${accent}`,
                color: accent,
                borderRadius: 8,
                padding: "7px 16px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Профиль →
            </button>
          </div>
        ))}
      </div>

      {/* Profile Modal */}
      {profileClient && (
        <div style={modalOverlay} onClick={() => setProfileClient(null)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: textMain, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{profileClient.name}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                <span style={{ background: "#1a2040", color: accent, fontSize: 12, borderRadius: 6, padding: "3px 10px" }}>{profileClient.niche}</span>
                <span style={{ background: "#1a2040", color: "#a0aec0", fontSize: 12, borderRadius: 6, padding: "3px 10px" }}>{profileClient.type}</span>
              </div>
              <div style={{ display: "flex", gap: 24, marginBottom: 14 }}>
                <div>
                  <div style={{ color: textMuted, fontSize: 11 }}>Сумма</div>
                  <div style={{ color: "#4ade80", fontSize: 18, fontWeight: 700 }}>${profileClient.amount.toLocaleString()}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: textMuted, fontSize: 12 }}>Прогресс: {profileClient.progress}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={profileClient.progress}
                    onChange={(e) => setProfileClient({ ...profileClient, progress: Number(e.target.value) })}
                    style={{ width: "100%", accentColor: accent }}
                  />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: `1px solid ${border}`, paddingBottom: 0 }}>
              {(["stages", "notes", "transactions"] as const).map((tab) => {
                const labels = { stages: "Этапы", notes: "Заметки", transactions: "Транзакции" };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      background: "transparent",
                      border: "none",
                      borderBottom: activeTab === tab ? `2px solid ${accent}` : "2px solid transparent",
                      color: activeTab === tab ? accent : textMuted,
                      padding: "8px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      marginBottom: -1,
                    }}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {activeTab === "stages" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {STAGES.map((s, i) => (
                  <label key={i} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={profileClient.stages[i] ?? false}
                      onChange={() => toggleStage(i)}
                      style={{ width: 16, height: 16, accentColor: accent }}
                    />
                    <span style={{ color: profileClient.stages[i] ? textMain : textMuted, fontSize: 14 }}>{s}</span>
                  </label>
                ))}
              </div>
            )}

            {activeTab === "notes" && (
              <textarea
                value={profileClient.notes}
                onChange={(e) => setProfileClient({ ...profileClient, notes: e.target.value })}
                rows={6}
                placeholder="Заметки о клиенте..."
                style={{ ...inputStyle, resize: "vertical" }}
              />
            )}

            {activeTab === "transactions" && (
              <div>
                {profileClient.transactions.length === 0 && (
                  <div style={{ color: textMuted, fontSize: 13 }}>Транзакций пока нет.</div>
                )}
                {profileClient.transactions.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 0",
                      borderBottom: `1px solid ${border}`,
                    }}
                  >
                    <div>
                      <div style={{ color: textMain, fontSize: 13, fontWeight: 600 }}>{t.desc}</div>
                      <div style={{ color: textMuted, fontSize: 12 }}>{t.date}</div>
                    </div>
                    <div style={{ color: "#4ade80", fontWeight: 700, fontSize: 15 }}>+${t.amount}</div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={saveProfile}
              style={{
                marginTop: 22,
                background: accent,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 24px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                width: "100%",
              }}
            >
              Сохранить
            </button>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAdd && (
        <div style={modalOverlay} onClick={() => setShowAdd(false)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: textMain, fontSize: 20, fontWeight: 700, marginTop: 0, marginBottom: 20 }}>+ Добавить клиента</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Имя</label>
                <input style={inputStyle} value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} placeholder="Имя клиента" />
              </div>
              <div>
                <label style={labelStyle}>Ниша</label>
                <input style={inputStyle} value={newClient.niche} onChange={(e) => setNewClient({ ...newClient, niche: e.target.value })} placeholder="Нутрициология..." />
              </div>
              <div>
                <label style={labelStyle}>Тип</label>
                <select style={inputStyle} value={newClient.type} onChange={(e) => setNewClient({ ...newClient, type: e.target.value })}>
                  <option value="наставничество">Наставничество</option>
                  <option value="продюсирование">Продюсирование</option>
                  <option value="аудит">Аудит</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Сумма ($)</label>
                <input style={inputStyle} type="number" value={newClient.amount || ""} onChange={(e) => setNewClient({ ...newClient, amount: Number(e.target.value) })} placeholder="3000" />
              </div>
              <div>
                <label style={labelStyle}>Дата старта</label>
                <input style={inputStyle} value={newClient.startDate} onChange={(e) => setNewClient({ ...newClient, startDate: e.target.value })} placeholder="01.03.2026" />
              </div>
              <div>
                <label style={labelStyle}>Цель</label>
                <input style={inputStyle} value={newClient.goal} onChange={(e) => setNewClient({ ...newClient, goal: e.target.value })} placeholder="Выйти на $15k/мес" />
              </div>
            </div>
            <button
              onClick={addClient}
              style={{
                marginTop: 20,
                background: accent,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 24px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                width: "100%",
              }}
            >
              Добавить
            </button>
          </div>
        </div>
      )}
    </div>
  </AdminLayout>
  );
}
