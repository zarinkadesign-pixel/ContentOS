/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/settings/page.tsx
 */

"use client";

import { useState, useEffect } from "react";
import AdminLayout from "../_components/AdminLayout";


interface Profile {
  name: string;
  account: string;
  city: string;
  goal: string;
}

interface ApiKeys {
  gemini: string;
  botToken: string;
  chatId: string;
  vizard: string;
}

interface Links {
  calendly: string;
  paypal: string;
  telegramBot: string;
}

const DEFAULT_PROFILE: Profile = {
  name: "Зарина Галымжан",
  account: "@amai.media",
  city: "Нячанг, Вьетнам",
  goal: "$20,000",
};

const DEFAULT_KEYS: ApiKeys = {
  gemini: "",
  botToken: "",
  chatId: "",
  vizard: "",
};

function maskValue(val: string): string {
  if (val.length <= 4) return "****";
  return "••••••••" + val.slice(-4);
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [apiKeys, setApiKeys] = useState<ApiKeys>(DEFAULT_KEYS);
  const [links, setLinks] = useState<Links>({ calendly: "", paypal: "", telegramBot: "@MyContentOS_bot" });
  const [showKeys, setShowKeys] = useState<Record<keyof ApiKeys, boolean>>({
    gemini: false, botToken: false, chatId: false, vizard: false,
  });
  const [savedProfile, setSavedProfile] = useState(false);
  const [savedKeys, setSavedKeys] = useState(false);
  const [savedLinks, setSavedLinks] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        if (data.profile) setProfile({ ...DEFAULT_PROFILE, ...data.profile });
        if (data.links)   setLinks(prev => ({ ...prev, ...data.links }));
      })
      .catch(() => {});
  }, []);

  function saveProfile() {
    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
    }).catch(() => {});
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 1800);
  }

  function saveKeys() {
    // API keys are stored server-side via env vars; this section is informational only
    setSavedKeys(true);
    setTimeout(() => setSavedKeys(false), 1800);
  }

  function saveLinks() {
    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ links }),
    }).catch(() => {});
    setSavedLinks(true);
    setTimeout(() => setSavedLinks(false), 1800);
  }

  async function exportData() {
    try {
      const [dashRes, leadsRes, clientsRes, financeRes, settingsRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/leads"),
        fetch("/api/clients"),
        fetch("/api/finance"),
        fetch("/api/settings"),
      ]);
      const snapshot = {
        dashboard: dashRes.ok ? await dashRes.json() : null,
        leads:     leadsRes.ok ? await leadsRes.json() : null,
        clients:   clientsRes.ok ? await clientsRes.json() : null,
        finance:   financeRes.ok ? await financeRes.json() : null,
        settings:  settingsRes.ok ? await settingsRes.json() : null,
      };
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `amai-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Ошибка экспорта данных.");
    }
  }

  function clearDemo() {
    alert("Демо-данные хранятся на сервере. Обратитесь к администратору для очистки.");
  }

  function resetAll() {
    alert("Сброс данных производится через сервер. Обратитесь к администратору.");
  }

  function toggleKey(key: keyof ApiKeys) {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const bg = "#050710";
  const card = "#0d1126";
  const accent = "#5c6af0";
  const border = "1px solid #1e2442";
  const text = "#e8eaf6";
  const muted = "#8b93c4";
  const inputStyle = {
    width: "100%",
    background: "#131830",
    border,
    borderRadius: 8,
    padding: "9px 12px",
    color: text,
    fontSize: 14,
    boxSizing: "border-box" as const,
  };
  const labelStyle = { fontSize: 13, color: muted, marginBottom: 5, display: "block" as const };
  const btnPrimary = {
    background: accent,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "9px 20px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  };
  const btnDanger = {
    background: "#3a1a2a",
    color: "#f06a6a",
    border: "1px solid #5a2a3a",
    borderRadius: 8,
    padding: "9px 16px",
    cursor: "pointer",
    fontSize: 14,
  };
  const btnMuted = {
    background: "#131830",
    color: text,
    border,
    borderRadius: 8,
    padding: "9px 16px",
    cursor: "pointer",
    fontSize: 14,
  };

  return (
    <AdminLayout>
    <div style={{ background: bg, minHeight: "100vh", padding: "32px 24px", color: text, fontFamily: "Inter, sans-serif", maxWidth: 740 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 28 }}>⚙️ Настройки</h1>

      {/* Section 1 — Profile */}
      <div style={{ background: card, border, borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 18 }}>👤 Профиль</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
          {([ ["Имя", "name"], ["Аккаунт", "account"], ["Город", "city"], ["Цель месяца", "goal"] ] as [string, keyof Profile][]).map(([label, key]) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <input
                type="text"
                value={profile[key]}
                onChange={e => setProfile(prev => ({ ...prev, [key]: e.target.value }))}
                style={inputStyle}
              />
            </div>
          ))}
        </div>
        <button onClick={saveProfile} style={btnPrimary}>
          {savedProfile ? "✅ Сохранено" : "Сохранить профиль"}
        </button>
      </div>

      {/* Section 2 — API Keys */}
      <div style={{ background: card, border, borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 18 }}>🔑 API Ключи</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
          {([
            ["Gemini API Key", "gemini"],
            ["Telegram Bot Token", "botToken"],
            ["Telegram Chat ID", "chatId"],
            ["Vizard API Key", "vizard"],
          ] as [string, keyof ApiKeys][]).map(([label, key]) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="text"
                  readOnly
                  value={showKeys[key] ? apiKeys[key] : maskValue(apiKeys[key])}
                  style={{ ...inputStyle, flex: 1, fontFamily: showKeys[key] ? "monospace" : "inherit", letterSpacing: showKeys[key] ? 0 : 1 }}
                />
                <button
                  onClick={() => toggleKey(key)}
                  title={showKeys[key] ? "Скрыть" : "Показать"}
                  style={{ background: "#131830", border, borderRadius: 8, padding: "9px 12px", cursor: "pointer", color: muted, fontSize: 16, flexShrink: 0 }}
                >
                  {showKeys[key] ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={saveKeys} style={{ ...btnPrimary, fontSize: 13, padding: "7px 16px" }}>
          {savedKeys ? "✅ Сохранено" : "Сохранить ключи"}
        </button>
      </div>

      {/* Section 3 — Links */}
      <div style={{ background: card, border, borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 18 }}>🔗 Ссылки</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
          {([
            ["Calendly ссылка", "calendly", "https://calendly.com/..."],
            ["PayPal $30 ссылка", "paypal", "https://paypal.me/..."],
            ["Telegram бот", "telegramBot", "@MyContentOS_bot"],
          ] as [string, keyof Links, string][]).map(([label, key, placeholder]) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <input
                type="text"
                placeholder={placeholder}
                value={links[key]}
                onChange={e => setLinks(prev => ({ ...prev, [key]: e.target.value }))}
                style={inputStyle}
              />
            </div>
          ))}
        </div>
        <button onClick={saveLinks} style={btnPrimary}>
          {savedLinks ? "✅ Сохранено" : "Сохранить ссылки"}
        </button>
      </div>

      {/* Section 4 — Data */}
      <div style={{ background: card, border, borderRadius: 14, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 18 }}>🗄 Данные</h2>
        <p style={{ fontSize: 13, color: muted, marginBottom: 18, lineHeight: 1.6 }}>
          Управление локальными данными: экспорт, очистка демо-записей или полный сброс.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={exportData} style={btnMuted}>📤 Экспортировать данные</button>
          <button onClick={clearDemo} style={btnDanger}>🗑 Очистить демо-данные</button>
          <button onClick={resetAll} style={{ ...btnDanger, background: "#2a1010", borderColor: "#5a1a1a", color: "#f06a6a" }}>
            ↩️ Сбросить
          </button>
        </div>
      </div>
    </div>
  </AdminLayout>
  );
}
