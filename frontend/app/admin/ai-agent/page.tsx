/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/ai-agent/page.tsx
 */

"use client";

import { useState, useEffect, useRef } from "react";
import AdminLayout from "../_components/AdminLayout";

const SYSTEM_PROMPT = `Ты — личный AI ассистент Зарины Галымжан, SMM-продюсера и директора агентства AMAImedia. Зарина живёт в Нячанге, Вьетнам. Работает с русскоязычными экспертами. Продукты: Мини-курс $30 (автоворонка), Наставничество $700-1500, Продюсирование $3000. Целевая аудитория: Казахстан + русскоязычные в ЮВА. Бюджет на рекламу: $200/мес в Meta Ads. Отвечай по-русски. Кратко и по делу. Давай конкретные советы.`;
const LS_KEY = "aiChat";
const MAX_MESSAGES = 20;

type Message = { role: "user" | "ai"; text: string; ts: number };

const QUICK_ACTIONS = [
  {
    label: "✍️ Текст для Story",
    text: "Напиши текст для Instagram Story о преимуществах продюсирования для экспертов",
  },
  {
    label: "📞 Скрипт созвона",
    text: "Составь скрипт созвона с потенциальным клиентом-экспертом для продажи наставничества",
  },
  {
    label: "🎯 Хук для рекламы",
    text: "Придумай 3 цепляющих хука для рекламного Reels в Meta Ads",
  },
  {
    label: "💼 Разбор кейса",
    text: "Как лучше упаковать кейс клиента для продаж через контент?",
  },
];

export default function AIAgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {
      // ignore parse errors
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function saveMessages(msgs: Message[]) {
    const trimmed = msgs.slice(-MAX_MESSAGES);
    localStorage.setItem(LS_KEY, JSON.stringify(trimmed));
    return trimmed;
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", text: trimmed, ts: Date.now() };
    const next = saveMessages([...messages, userMsg]);
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/run-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          system: SYSTEM_PROMPT,
        }),
      });
      const data = await res.json();
      const reply = data?.result ?? data?.error ?? "Ошибка API";
      const aiMsg: Message = { role: "ai", text: reply, ts: Date.now() };
      setMessages(saveMessages([...next, aiMsg]));
    } catch {
      const aiMsg: Message = {
        role: "ai",
        text: "Ошибка сети. Попробуй ещё раз.",
        ts: Date.now(),
      };
      setMessages(saveMessages([...next, aiMsg]));
    } finally {
      setLoading(false);
    }
  }

  function handleQuickAction(text: string) {
    setInput(text);
    sendMessage(text);
  }

  function clearHistory() {
    setMessages([]);
    localStorage.removeItem(LS_KEY);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <AdminLayout>
    <div
      style={{
        minHeight: "100vh",
        background: "#050710",
        color: "#e4e9ff",
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
        padding: "24px 16px 0",
        maxWidth: 780,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#fff" }}>
          🤖 AI Агент
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b74b0" }}>
          Groq LLaMA · персональный ассистент
        </p>
      </div>

      {/* Quick action buttons */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
          marginBottom: 16,
        }}
      >
        {QUICK_ACTIONS.map((qa) => (
          <button
            key={qa.label}
            onClick={() => handleQuickAction(qa.text)}
            disabled={loading}
            style={{
              background: "#0d1126",
              border: "1px solid rgba(92,106,240,0.3)",
              borderRadius: 10,
              padding: "9px 6px",
              color: "#a0aaee",
              fontSize: 12,
              cursor: loading ? "not-allowed" : "pointer",
              textAlign: "center",
              lineHeight: 1.4,
              transition: "background 0.15s, border-color 0.15s",
              opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#131832";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "#5c6af0";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "#0d1126";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(92,106,240,0.3)";
            }}
          >
            {qa.label}
          </button>
        ))}
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          background: "#0d1126",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.06)",
          padding: 16,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          minHeight: 340,
          maxHeight: "calc(100vh - 320px)",
          marginBottom: 12,
        }}
      >
        {messages.length === 0 && !loading && (
          <div
            style={{
              margin: "auto",
              textAlign: "center",
              color: "#3d4470",
              fontSize: 14,
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>✨</div>
            <div>Задай вопрос или выбери быстрое действие выше</div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.ts}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "78%",
                padding: "10px 14px",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: msg.role === "user" ? "#5c6af0" : "#0d1126",
                border:
                  msg.role === "ai"
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "none",
                color: msg.role === "user" ? "#fff" : "#e4e9ff",
                fontSize: 14,
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "18px 18px 18px 4px",
                background: "#0d1126",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#6b74b0",
                fontSize: 14,
              }}
            >
              ⏳ Думаю...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Напиши вопрос..."
          disabled={loading}
          style={{
            flex: 1,
            background: "#0d1126",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: "12px 16px",
            color: "#e4e9ff",
            fontSize: 14,
            outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#5c6af0";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          style={{
            background: "#5c6af0",
            border: "none",
            borderRadius: 12,
            padding: "12px 20px",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            opacity: loading || !input.trim() ? 0.5 : 1,
            transition: "opacity 0.15s, background 0.15s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            if (!loading && input.trim()) {
              (e.currentTarget as HTMLButtonElement).style.background = "#4a58e0";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#5c6af0";
          }}
        >
          Отправить
        </button>
      </div>

      {/* Clear history */}
      <div style={{ textAlign: "center", paddingBottom: 20 }}>
        <button
          onClick={clearHistory}
          style={{
            background: "none",
            border: "none",
            color: "#3d4470",
            fontSize: 12,
            cursor: "pointer",
            textDecoration: "underline",
            padding: 4,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#6b74b0";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#3d4470";
          }}
        >
          Очистить историю
        </button>
      </div>
    </div>
  </AdminLayout>
  );
}
