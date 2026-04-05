/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/claude-guide/page.tsx
 */
"use client";

import { useState } from "react";

const TABS = [
  { id: "carousels", label: "🎠 Гид по каруселям", file: "/guide_carousels_with_claude.html" },
  { id: "prompts",   label: "✨ 60 промптов Claude", file: "/60_prompts_claude.pdf" },
];

export default function ClaudeGuidePage() {
  const [activeTab, setActiveTab] = useState("carousels");

  const current = TABS.find(t => t.id === activeTab)!;
  const isPDF = current.file.endsWith(".pdf");

  return (
    <div style={{ minHeight: "100vh", background: "#030412", padding: "28px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{
            background: "linear-gradient(135deg, #a78bfa 0%, #818cf8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: "22px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}>
            Claude Knowledge Base
          </div>
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", marginTop: "4px" }}>
            Руководства и промпты для работы с Claude AI
          </div>
        </div>

        {/* Download button */}
        <a
          href={current.file}
          download
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 18px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.12) 100%)",
            border: "1px solid rgba(99,102,241,0.3)",
            color: "#a5b4fc",
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "none",
            transition: "all 0.15s ease",
          }}
        >
          ↓ Скачать
        </a>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: "4px",
        padding: "4px",
        background: "rgba(255,255,255,0.03)",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.06)",
        width: "fit-content",
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 20px",
              borderRadius: "9px",
              fontSize: "13px",
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? "#a5b4fc" : "rgba(255,255,255,0.4)",
              background: activeTab === tab.id
                ? "linear-gradient(135deg, rgba(99,102,241,0.22) 0%, rgba(139,92,246,0.14) 100%)"
                : "transparent",
              border: activeTab === tab.id ? "1px solid rgba(99,102,241,0.28)" : "1px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content viewer */}
      <div style={{
        flex: 1,
        borderRadius: "16px",
        border: "1px solid rgba(99,102,241,0.15)",
        overflow: "hidden",
        background: isPDF ? "#1a1b2e" : "#fff",
        minHeight: "calc(100vh - 200px)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
      }}>
        {isPDF ? (
          <div style={{ width: "100%", height: "calc(100vh - 200px)", display: "flex", flexDirection: "column" }}>
            <object
              data={current.file}
              type="application/pdf"
              width="100%"
              style={{ flex: 1, border: "none" }}
            >
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: "20px",
                color: "rgba(255,255,255,0.5)",
              }}>
                <div style={{ fontSize: "48px" }}>📄</div>
                <div style={{ fontSize: "16px", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                  PDF не открылся в браузере
                </div>
                <div style={{ fontSize: "13px" }}>
                  Нажмите кнопку "Скачать" выше, чтобы открыть файл
                </div>
                <a
                  href={current.file}
                  download
                  style={{
                    padding: "10px 24px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "14px",
                    textDecoration: "none",
                    marginTop: "8px",
                  }}
                >
                  ↓ Скачать PDF
                </a>
              </div>
            </object>
          </div>
        ) : (
          <iframe
            src={current.file}
            style={{
              width: "100%",
              height: "calc(100vh - 200px)",
              border: "none",
              display: "block",
            }}
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </div>
    </div>
  );
}
