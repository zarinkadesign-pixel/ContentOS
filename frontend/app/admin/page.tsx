/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/page.tsx
 */
"use client";

import { useEffect, useState } from "react";
import AdminLayout from "./_components/AdminLayout";

interface Stats {
  total_users:        number;
  paid_users:         number;
  active_today:       number;
  total_generations:  number;
  generations_today:  number;
  recent_activity:    Array<{
    id: string;
    email: string;
    action: string;
    module: string;
    created_at: string;
  }>;
}

const CARDS = [
  {
    key: "total_users",
    label: "Всего пользователей",
    icon: "👤",
    gradient: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 100%)",
    border: "rgba(99,102,241,0.25)",
    glow: "rgba(99,102,241,0.12)",
    color: "#a5b4fc",
  },
  {
    key: "paid_users",
    label: "Платные",
    icon: "💎",
    gradient: "linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(16,185,129,0.08) 100%)",
    border: "rgba(34,197,94,0.25)",
    glow: "rgba(34,197,94,0.12)",
    color: "#86efac",
  },
  {
    key: "active_today",
    label: "Активны сегодня",
    icon: "⚡",
    gradient: "linear-gradient(135deg, rgba(234,179,8,0.15) 0%, rgba(245,158,11,0.08) 100%)",
    border: "rgba(234,179,8,0.25)",
    glow: "rgba(234,179,8,0.12)",
    color: "#fde68a",
  },
  {
    key: "total_generations",
    label: "Всего генераций",
    icon: "✨",
    gradient: "linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(217,70,239,0.08) 100%)",
    border: "rgba(168,85,247,0.25)",
    glow: "rgba(168,85,247,0.12)",
    color: "#e879f9",
  },
  {
    key: "generations_today",
    label: "Генераций сегодня",
    icon: "🚀",
    gradient: "linear-gradient(135deg, rgba(236,72,153,0.15) 0%, rgba(244,114,182,0.08) 100%)",
    border: "rgba(236,72,153,0.25)",
    glow: "rgba(236,72,153,0.12)",
    color: "#f9a8d4",
  },
] as const;

const MODULE_COLORS: Record<string, { bg: string; text: string }> = {
  auth:      { bg: "rgba(99,102,241,0.15)",  text: "#a5b4fc" },
  generate:  { bg: "rgba(168,85,247,0.15)",  text: "#e879f9" },
  content:   { bg: "rgba(34,197,94,0.15)",   text: "#86efac" },
  crm:       { bg: "rgba(234,179,8,0.15)",   text: "#fde68a" },
  admin:     { bg: "rgba(239,68,68,0.15)",   text: "#fca5a5" },
  default:   { bg: "rgba(255,255,255,0.08)", text: "rgba(255,255,255,0.5)" },
};

function ModuleBadge({ module }: { module: string }) {
  const c = MODULE_COLORS[module.toLowerCase()] ?? MODULE_COLORS.default;
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: "20px",
      fontSize: "10px",
      fontWeight: 600,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      background: c.bg,
      color: c.text,
    }}>
      {module}
    </span>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setStats(d);
      })
      .catch(() => setError("Failed to load stats"));
  }, []);

  return (
    <AdminLayout>
      {/* Page header */}
      <div style={{
        padding: "28px 32px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        marginBottom: "28px",
      }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: "20px" }}>
          <div>
            <div style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(99,102,241,0.8)",
              marginBottom: "6px",
            }}>
              Admin Panel
            </div>
            <h1 style={{
              fontSize: "22px",
              fontWeight: 700,
              background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: 0,
            }}>
              Обзор системы
            </h1>
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            borderRadius: "20px",
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.2)",
            fontSize: "11px",
            color: "#86efac",
            fontWeight: 600,
          }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
            Система онлайн
          </div>
        </div>
      </div>

      <div style={{ padding: "0 32px 32px" }}>
        {error && (
          <div style={{
            marginBottom: "24px",
            padding: "14px 18px",
            borderRadius: "12px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#fca5a5",
            fontSize: "13px",
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Stats grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "14px",
          marginBottom: "28px",
        }}>
          {CARDS.map(({ key, label, icon, gradient, border, glow, color }) => (
            <div
              key={key}
              style={{
                background: gradient,
                border: `1px solid ${border}`,
                borderRadius: "14px",
                padding: "18px",
                boxShadow: `0 4px 20px ${glow}`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{
                position: "absolute",
                top: "-20px",
                right: "-10px",
                fontSize: "52px",
                opacity: 0.07,
                lineHeight: 1,
                userSelect: "none",
              }}>{icon}</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
                {label}
              </div>
              <div style={{ fontSize: "30px", fontWeight: 800, color, lineHeight: 1, letterSpacing: "-0.02em" }}>
                {stats ? (stats[key] as number).toLocaleString() : "—"}
              </div>
              <div style={{ marginTop: "8px", fontSize: "10px", color: "rgba(255,255,255,0.2)" }}>
                {icon} обновлено только что
              </div>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "16px",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "16px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
                Последняя активность
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
                Реальное время · обновляется автоматически
              </p>
            </div>
            {stats && (
              <div style={{
                padding: "4px 12px",
                borderRadius: "20px",
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.2)",
                fontSize: "11px",
                color: "#a5b4fc",
                fontWeight: 600,
              }}>
                {stats.recent_activity.length} событий
              </div>
            )}
          </div>

          {!stats ? (
            <div style={{ padding: "48px", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: "13px" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.4 }}>⏳</div>
              Загрузка данных…
            </div>
          ) : stats.recent_activity.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: "13px" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.4 }}>📭</div>
              Активности пока нет
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {["Пользователь", "Действие", "Модуль", "Время"].map(h => (
                    <th key={h} style={{
                      padding: "10px 24px",
                      textAlign: "left",
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.25)",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recent_activity.map((e, i) => (
                  <tr
                    key={e.id}
                    style={{
                      borderBottom: i < stats.recent_activity.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={el => (el.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={el => (el.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 24px", color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>
                      {e.email || "—"}
                    </td>
                    <td style={{ padding: "12px 24px" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: "6px",
                        background: "rgba(168,85,247,0.12)",
                        color: "#c084fc",
                        fontSize: "12px",
                        fontWeight: 500,
                      }}>
                        {e.action}
                      </span>
                    </td>
                    <td style={{ padding: "12px 24px" }}>
                      <ModuleBadge module={e.module} />
                    </td>
                    <td style={{ padding: "12px 24px", color: "rgba(255,255,255,0.3)", fontFamily: "monospace", fontSize: "11px" }}>
                      {new Date(e.created_at).toLocaleString("ru-RU", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
