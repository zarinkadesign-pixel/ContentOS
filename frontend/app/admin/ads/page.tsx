/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/ads/page.tsx
 */

"use client";

import { useState } from "react";
import AdminLayout from "../_components/AdminLayout";


const HOOKS = [
  "Я помогла [N] экспертам выйти на доход от $1500 в месяц через Instagram",
  "Ты ведёшь Instagram, но клиенты не приходят? Проблема не в контенте",
  "Как я заработала $1500 за один созвон — без курсов и вебинаров",
  "Ошибка №1 которая мешает экспертам продавать дорого через соцсети",
  "3 шага которые превращают подписчиков в клиентов с чеком от $700",
];

const FORECAST = [
  { label: "Оптимист",   cpl: "$3", leads: 66, sales: "10-15", nastavnik: "2-3", income: "$5000" },
  { label: "Реалист",    cpl: "$5", leads: 40, sales: "6-10",  nastavnik: "1-2", income: "$2500" },
  { label: "Консерват",  cpl: "$8", leads: 25, sales: "3-5",   nastavnik: "0-1", income: "$700"  },
];

const AD_TYPES = ["Reels-хук", "Текст поста", "Story", "Карусель"];

export default function AdsPage() {
  const [totalBudget, setTotalBudget] = useState(200);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [adType, setAdType] = useState(AD_TYPES[0]);
  const [niche, setNiche] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copiedGen, setCopiedGen] = useState(false);

  const kzBudget = Math.round(totalBudget * 0.75);
  const seaBudget = totalBudget - kzBudget;
  const dailyBudget = (totalBudget / 30).toFixed(2);

  function copyHook(idx: number, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  }

  async function generateAd() {
    if (!niche.trim()) return;
    setGenerating(true);
    setGeneratedText("");
    try {
      const res = await fetch("/api/ai/run-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Напиши рекламный текст для Meta Ads. Тип: ${adType}. Ниша: ${niche}. SMM-продюсер, услуги: наставничество $700-1500, продюсирование $3000. Аудитория: русскоязычные эксперты. Напиши по-русски, цепляющий текст с хуком.`,
          system: "Ты — эксперт по рекламе в Meta Ads для русскоязычной аудитории. Пиши цепляющие тексты с сильными хуками. Только по-русски.",
        }),
      });
      const data = await res.json();
      const text = data?.result ?? data?.error ?? "Ошибка генерации";
      setGeneratedText(text);
    } catch {
      setGeneratedText("Ошибка соединения с AI API");
    } finally {
      setGenerating(false);
    }
  }

  function copyGenerated() {
    navigator.clipboard.writeText(generatedText).then(() => {
      setCopiedGen(true);
      setTimeout(() => setCopiedGen(false), 1500);
    });
  }

  const bg = "#050710";
  const card = "#0d1126";
  const accent = "#5c6af0";
  const border = "1px solid #1e2442";
  const text = "#e8eaf6";
  const muted = "#8b93c4";

  return (
    <AdminLayout>
    <div style={{ background: bg, minHeight: "100vh", padding: "32px 24px", color: text, fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 28 }}>📢 Реклама — Meta Ads</h1>

      {/* Budget block */}
      <div style={{ background: card, border, borderRadius: 14, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: muted }}>Бюджет</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 14 }}>Общий бюджет ($/мес):</span>
          <input
            type="number"
            value={totalBudget}
            onChange={e => setTotalBudget(Number(e.target.value))}
            style={{ width: 90, background: "#131830", border, borderRadius: 8, padding: "6px 10px", color: text, fontSize: 15 }}
          />
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { label: "Казахстан", value: `$${kzBudget}/мес` },
            { label: "ЮВА", value: `$${seaBudget}/мес` },
            { label: "Дневной", value: `$${dailyBudget}/день` },
          ].map(item => (
            <div key={item.label} style={{ background: "#131830", border, borderRadius: 10, padding: "12px 20px", minWidth: 130 }}>
              <div style={{ fontSize: 12, color: muted, marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: accent }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Targeting cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Kazakhstan */}
        <div style={{ background: card, border, borderRadius: 14, padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>🇰🇿 Казахстан</h2>
          {[
            ["Гео", "Алматы + Астана"],
            ["Возраст", "25–45"],
            ["Язык", "Russian"],
            ["Интересы", "Entrepreneurship, Coaching, Digital marketing"],
            ["Бюджет", `$${Math.round(kzBudget / 30 * 10) / 10}/день`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1a2040", padding: "8px 0", fontSize: 14 }}>
              <span style={{ color: muted }}>{k}</span>
              <span style={{ fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* SEA */}
        <div style={{ background: card, border, borderRadius: 14, padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>🌏 ЮВА</h2>
          {[
            ["Гео", "Vietnam + Thailand + Indonesia"],
            ["Возраст", "25–50"],
            ["Язык", "Russian"],
            ["Интересы", "— не добавлять"],
            ["Бюджет", `$${Math.round(seaBudget / 30 * 10) / 10}/день`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1a2040", padding: "8px 0", fontSize: 14 }}>
              <span style={{ color: muted }}>{k}</span>
              <span style={{ fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hooks */}
      <div style={{ background: card, border, borderRadius: 14, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>5 готовых хуков</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {HOOKS.map((hook, idx) => (
            <div key={idx} style={{ background: "#131830", border, borderRadius: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 14, lineHeight: 1.5, flex: 1 }}>{hook}</span>
              <button
                onClick={() => copyHook(idx, hook)}
                style={{ background: copiedIdx === idx ? "#2d3a6e" : accent, color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap", flexShrink: 0 }}
              >
                {copiedIdx === idx ? "✅ Скопировано" : "📋 Скопировать"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Gemini generator */}
      <div style={{ background: card, border, borderRadius: 14, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>✨ Генератор рекламных текстов (Gemini)</h2>
        <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <select
            value={adType}
            onChange={e => setAdType(e.target.value)}
            style={{ background: "#131830", border, borderRadius: 8, padding: "8px 12px", color: text, fontSize: 14, cursor: "pointer" }}
          >
            {AD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            type="text"
            placeholder="Ниша (например: нутрициолог)"
            value={niche}
            onChange={e => setNiche(e.target.value)}
            style={{ flex: 1, minWidth: 180, background: "#131830", border, borderRadius: 8, padding: "8px 12px", color: text, fontSize: 14 }}
          />
          <button
            onClick={generateAd}
            disabled={generating}
            style={{ background: accent, color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", cursor: generating ? "not-allowed" : "pointer", fontSize: 14, opacity: generating ? 0.7 : 1 }}
          >
            {generating ? "⏳ Генерирую..." : "Создать текст"}
          </button>
        </div>
        {generatedText && (
          <div style={{ background: "#131830", border, borderRadius: 10, padding: 16 }}>
            <p style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", margin: "0 0 12px" }}>{generatedText}</p>
            <button
              onClick={copyGenerated}
              style={{ background: copiedGen ? "#2d3a6e" : accent, color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 13 }}
            >
              {copiedGen ? "✅ Скопировано" : "📋 Скопировать"}
            </button>
          </div>
        )}
      </div>

      {/* Forecast table */}
      <div style={{ background: card, border, borderRadius: 14, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>📊 Прогноз результатов</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#131830" }}>
                {["Сценарий", "CPL", "Лидов/мес", "Продаж $30", "Наст-во", "Доход"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: muted, fontWeight: 600, borderBottom: border }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FORECAST.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #1a2040" }}>
                  <td style={{ padding: "11px 14px", fontWeight: 600 }}>{row.label}</td>
                  <td style={{ padding: "11px 14px" }}>{row.cpl}</td>
                  <td style={{ padding: "11px 14px" }}>{row.leads}</td>
                  <td style={{ padding: "11px 14px" }}>{row.sales}</td>
                  <td style={{ padding: "11px 14px" }}>{row.nastavnik}</td>
                  <td style={{ padding: "11px 14px", color: accent, fontWeight: 700 }}>{row.income}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AdminLayout>
  );
}
