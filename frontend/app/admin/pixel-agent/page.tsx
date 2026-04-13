/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/pixel-agent/page.tsx
 *
 * Pixel Agent — ElizaOS multi-platform AI agent management panel.
 * Based on: https://github.com/anabelle/pixel-agent
 */
"use client";

import { useState } from "react";
import AdminLayout from "../_components/AdminLayout";

// ─────────────────────────────────────────────────── TYPES ──
interface AgentStatus {
  running: boolean;
  platform: string;
  uptime: string;
  memory: string;
  lastActivity: string;
}

interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
  desc: string;
  envKey: string;
}

interface CharacterTrait {
  label: string;
  key: string;
  value: string;
  placeholder: string;
}

// ───────────────────────────────────────────── PLATFORMS ──
const PLATFORMS: Platform[] = [
  { id: "telegram",  name: "Telegram",      icon: "✈️",  color: "#229ED9", desc: "Bot token + channel posting", envKey: "TELEGRAM_BOT_TOKEN" },
  { id: "discord",   name: "Discord",       icon: "🎮",  color: "#5865F2", desc: "Guild bot + slash commands",  envKey: "DISCORD_API_TOKEN" },
  { id: "twitter",   name: "Twitter / X",   icon: "🐦",  color: "#1DA1F2", desc: "Auto-posting + engagement",   envKey: "TWITTER_API_KEY" },
  { id: "nostr",     name: "Nostr",         icon: "⚡",  color: "#f59e0b", desc: "Decentralized social relay",  envKey: "NOSTR_PRIVATE_KEY" },
];

const MODELS = [
  { id: "mistral",  label: "Mistral Large" },
  { id: "gpt4",     label: "GPT-4o" },
  { id: "claude",   label: "Claude Sonnet" },
  { id: "gemini",   label: "Gemini 1.5 Pro" },
  { id: "deepseek", label: "DeepSeek V3" },
];

const INIT_TRAITS: CharacterTrait[] = [
  { label: "Имя агента",      key: "name",        value: "Pixel",       placeholder: "Pixel" },
  { label: "Личность",        key: "personality", value: "Остроумный, умный AI-агент из цифровой пустоты", placeholder: "Опишите личность..." },
  { label: "Стиль общения",   key: "style",       value: "Умный и немного саркастичный, но всегда полезный", placeholder: "Стиль ответов..." },
  { label: "Основная цель",   key: "goal",        value: "Создавать вирусный контент и вовлекать аудиторию", placeholder: "Главная задача агента..." },
  { label: "Запрещённые темы",key: "avoid",       value: "Политика, личные данные, финансовые советы",      placeholder: "Темы которые агент не обсуждает..." },
];

// ──────────────────────────────────────────────── STATS ──
function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: "14px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px",
    }}>
      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "20px", fontWeight: 800, color: "#fff", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "3px", letterSpacing: "0.05em" }}>{label}</div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────── PLATFORM ROW ──
function PlatformRow({ p, enabled, onToggle }: { p: Platform; enabled: boolean; onToggle: () => void }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px",
      borderRadius: "12px", background: enabled ? p.color + "12" : "rgba(255,255,255,0.02)",
      border: `1px solid ${enabled ? p.color + "35" : "rgba(255,255,255,0.07)"}`,
      transition: "all 0.2s",
    }}>
      <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: p.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
        {p.icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: enabled ? "#fff" : "rgba(255,255,255,0.5)" }}>{p.name}</div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>{p.desc}</div>
        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", marginTop: "1px", fontFamily: "monospace" }}>{p.envKey}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {enabled && (
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
            <span style={{ fontSize: "10px", color: "#22c55e", fontWeight: 600 }}>Active</span>
          </div>
        )}
        <button
          onClick={onToggle}
          style={{
            width: "38px", height: "22px", borderRadius: "11px", border: "none", cursor: "pointer",
            background: enabled ? p.color : "rgba(255,255,255,0.1)",
            position: "relative", transition: "background 0.2s",
          }}
        >
          <div style={{
            position: "absolute", top: "3px", left: enabled ? "18px" : "3px",
            width: "16px", height: "16px", borderRadius: "50%", background: "#fff",
            transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
          }} />
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────── MAIN PAGE ──
export default function PixelAgentPage() {
  const [activeTab, setActiveTab]         = useState<"overview" | "character" | "platforms" | "logs">("overview");
  const [enabledPlatforms, setEnabled]    = useState<Record<string, boolean>>({ telegram: true });
  const [selectedModel, setModel]         = useState("claude");
  const [traits, setTraits]               = useState<CharacterTrait[]>(INIT_TRAITS);
  const [agentRunning, setAgentRunning]   = useState(false);
  const [logs]                            = useState<string[]>([
    "[pixel-agent] 09:14:32 — Agent initialized with Claude Sonnet model",
    "[pixel-agent] 09:14:35 — Telegram adapter connected (@your_bot)",
    "[pixel-agent] 09:14:36 — Memory system loaded: 42 contexts",
    "[pixel-agent] 09:15:01 — New message from @user123: 'привет'",
    "[pixel-agent] 09:15:02 — Response sent: 'Привет! Чем могу помочь?' (0.38s)",
    "[pixel-agent] 09:22:17 — Scheduled post published to Telegram channel",
    "[pixel-agent] 09:40:05 — Memory snapshot saved (52 contexts)",
  ]);

  const tabs = [
    { id: "overview",   label: "Обзор",      icon: "📊" },
    { id: "character",  label: "Персонаж",   icon: "🎭" },
    { id: "platforms",  label: "Платформы",  icon: "🔌" },
    { id: "logs",       label: "Логи",       icon: "📋" },
  ] as const;

  function togglePlatform(id: string) {
    setEnabled(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function updateTrait(key: string, val: string) {
    setTraits(prev => prev.map(t => t.key === key ? { ...t, value: val } : t));
  }

  function exportCharacter() {
    const char = {
      name: traits.find(t => t.key === "name")?.value ?? "Pixel",
      clients: Object.entries(enabledPlatforms).filter(([, v]) => v).map(([k]) => k),
      modelProvider: selectedModel,
      settings: { model: selectedModel },
      bio: [traits.find(t => t.key === "personality")?.value ?? ""],
      style: { all: [traits.find(t => t.key === "style")?.value ?? ""] },
      topics: [traits.find(t => t.key === "goal")?.value ?? ""],
      adjectives: traits.find(t => t.key === "personality")?.value?.split(",") ?? [],
    };
    const blob = new Blob([JSON.stringify(char, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "character.json";
    link.click();
  }

  const activePlatformsCount = Object.values(enabledPlatforms).filter(Boolean).length;

  return (
    <AdminLayout>
    <div style={{ minHeight: "100vh", background: "#030412", padding: "28px 32px 60px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <div style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em",
            }}>
              ⚡ Pixel Agent
            </div>
            <div style={{
              padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 700,
              background: agentRunning ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${agentRunning ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}`,
              color: agentRunning ? "#22c55e" : "rgba(255,255,255,0.35)",
              letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              {agentRunning ? "● Running" : "○ Stopped"}
            </div>
          </div>
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>
            ElizaOS · Multi-platform AI Agent · Telegram · Discord · Twitter · Nostr
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <a
            href="https://github.com/anabelle/pixel-agent"
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: "9px 18px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}
          >
            📦 GitHub
          </a>
          <button
            onClick={() => setAgentRunning(p => !p)}
            style={{
              padding: "9px 22px", borderRadius: "10px", fontSize: "13px", fontWeight: 700,
              background: agentRunning
                ? "linear-gradient(135deg, #ef4444, #dc2626)"
                : "linear-gradient(135deg, #22c55e, #16a34a)",
              border: "none", color: "#fff", cursor: "pointer",
            }}
          >
            {agentRunning ? "⏹ Остановить" : "▶ Запустить"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
        <StatCard label="Платформы"      value={`${activePlatformsCount} / ${PLATFORMS.length}`} icon="🔌" color="#6366f1" />
        <StatCard label="AI Модель"      value={MODELS.find(m => m.id === selectedModel)?.label ?? "—"} icon="🧠" color="#8b5cf6" />
        <StatCard label="Uptime"         value={agentRunning ? "2h 14m" : "—"}  icon="⏱️" color="#22c55e" />
        <StatCard label="Контекстов"     value="52"    icon="💬" color="#f59e0b" />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", padding: "4px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", width: "fit-content" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "8px 18px", borderRadius: "9px", fontSize: "13px", fontWeight: activeTab === t.id ? 700 : 400, cursor: "pointer",
            color: activeTab === t.id ? "#a5b4fc" : "rgba(255,255,255,0.4)",
            background: activeTab === t.id ? "linear-gradient(135deg, rgba(99,102,241,0.22), rgba(139,92,246,0.14))" : "transparent",
            border: activeTab === t.id ? "1px solid rgba(99,102,241,0.28)" : "1px solid transparent",
            whiteSpace: "nowrap",
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "24px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "16px" }}>О проекте</div>
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", lineHeight: 1.75 }}>
              <strong style={{ color: "#fff" }}>Pixel Agent</strong> — это продвинутый AI-агент на базе{" "}
              <span style={{ color: "#a5b4fc" }}>ElizaOS</span>, разработанный для многоплатформенного взаимодействия.
              Агент обладает системой памяти (контекстная, нарративная, профили пользователей, саморефлексия),
              адаптивным поведением под каждую платформу и поддержкой множества AI-моделей через{" "}
              <span style={{ color: "#a5b4fc" }}>OpenRouter</span>.
            </div>

            <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {[
                { label: "Runtime",    value: "Bun v1.3+",       icon: "⚡" },
                { label: "Язык",       value: "TypeScript",       icon: "📝" },
                { label: "База данных",value: "PostgreSQL + pgvector", icon: "🗄️" },
                { label: "Фреймворк",  value: "ElizaOS",          icon: "🤖" },
              ].map(i => (
                <div key={i.label} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "12px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: "18px" }}>{i.icon}</span>
                  <div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em" }}>{i.label}</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>{i.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Setup instructions */}
          <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "24px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "16px" }}>Быстрый старт</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { step: "1", cmd: "git clone https://github.com/anabelle/pixel-agent", desc: "Клонировать репозиторий" },
                { step: "2", cmd: "cp .env.example .env", desc: "Настроить переменные окружения" },
                { step: "3", cmd: "bun install", desc: "Установить зависимости" },
                { step: "4", cmd: "bun run start", desc: "Запустить агента" },
              ].map(s => (
                <div key={s.step} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#a5b4fc", flexShrink: 0, marginTop: "2px" }}>{s.step}</div>
                  <div>
                    <code style={{ fontSize: "12px", color: "#a5b4fc", background: "rgba(99,102,241,0.1)", padding: "3px 8px", borderRadius: "5px", fontFamily: "monospace" }}>{s.cmd}</code>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "3px" }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Character */}
      {activeTab === "character" && (
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Персонаж агента (character.json)</div>
            <button
              onClick={exportCharacter}
              style={{ padding: "7px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", cursor: "pointer" }}
            >
              ⬇ Экспортировать JSON
            </button>
          </div>

          {/* AI Model selector */}
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "8px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>AI Модель (OpenRouter)</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  style={{
                    padding: "7px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                    background: selectedModel === m.id ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.04)",
                    border: selectedModel === m.id ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.08)",
                    color: selectedModel === m.id ? "#a5b4fc" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trait inputs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {traits.map(trait => (
              <div key={trait.key}>
                <label style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "6px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{trait.label}</label>
                <textarea
                  value={trait.value}
                  onChange={e => updateTrait(trait.key, e.target.value)}
                  placeholder={trait.placeholder}
                  rows={trait.key === "personality" || trait.key === "goal" ? 3 : 2}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "13px", outline: "none", resize: "vertical", lineHeight: 1.6, fontFamily: "inherit" }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Platforms */}
      {activeTab === "platforms" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", marginBottom: "4px" }}>
            Включи платформы и убедись, что соответствующие переменные окружения настроены в .env
          </div>
          {PLATFORMS.map(p => (
            <PlatformRow key={p.id} p={p} enabled={!!enabledPlatforms[p.id]} onToggle={() => togglePlatform(p.id)} />
          ))}

          <div style={{ marginTop: "8px", padding: "16px 18px", borderRadius: "12px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <div style={{ fontSize: "12px", color: "#fbbf24", fontWeight: 600, marginBottom: "6px" }}>⚠ Конфигурация .env</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
              Для каждой включённой платформы добавь ключ API в файл <code style={{ color: "#a5b4fc" }}>.env</code> проекта pixel-agent.
              Агент работает отдельным сервисом — запусти его командой <code style={{ color: "#a5b4fc" }}>bun run start</code> в директории pixel-agent.
            </div>
          </div>
        </div>
      )}

      {/* Tab: Logs */}
      {activeTab === "logs" && (
        <div style={{ background: "#0a0b0d", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Лог активности</div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: agentRunning ? "#22c55e" : "#ef4444", boxShadow: agentRunning ? "0 0 6px #22c55e" : "none" }} />
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>{agentRunning ? "Live" : "Stopped"}</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {logs.map((line, i) => {
              const isError   = line.includes("ERROR") || line.includes("error");
              const isWarning = line.includes("WARN");
              const isSuccess = line.includes("connected") || line.includes("published") || line.includes("saved");
              return (
                <div key={i} style={{
                  fontSize: "12px", fontFamily: "monospace", lineHeight: 1.6,
                  color: isError ? "#f87171" : isWarning ? "#fbbf24" : isSuccess ? "#86efac" : "rgba(255,255,255,0.55)",
                  padding: "4px 8px", borderRadius: "6px",
                  background: isError ? "rgba(239,68,68,0.06)" : "transparent",
                }}>
                  {line}
                </div>
              );
            })}
          </div>
          {!agentRunning && (
            <div style={{ textAlign: "center", padding: "20px", color: "rgba(255,255,255,0.2)", fontSize: "13px" }}>
              Запусти агента чтобы увидеть live логи
            </div>
          )}
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
