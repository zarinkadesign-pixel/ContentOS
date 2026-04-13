/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/_components/AdminLayout.tsx
 */
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin/monitor",    label: "Монитор",    icon: "⚡" },
  { href: "/admin",            label: "Дашборд",    icon: "📊" },
  { href: "/admin/crm",        label: "CRM",         icon: "🔍" },
  { href: "/admin/clients",    label: "Клиенты",    icon: "👥" },
  { href: "/admin/products",   label: "Продукты",   icon: "📦" },
  { href: "/admin/producer",   label: "Контент",    icon: "🎬" },
  { href: "/admin/finance",    label: "Финансы",    icon: "💰" },
  { href: "/admin/ai-agent",   label: "AI Агент",   icon: "🤖" },
  { href: "/admin/plan90",     label: "90 дней",    icon: "📅" },
  { href: "/admin/claude-guide", label: "Шаблоны",  icon: "🎨" },
  { href: "/admin/ads",        label: "Реклама",    icon: "📢" },
  { href: "/admin/settings",   label: "Настройки",  icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen bg-[#050710] text-white">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 flex flex-col" style={{
        background: "linear-gradient(180deg, #08091c 0%, #06071a 100%)",
        borderRight: "1px solid rgba(92,106,240,0.12)",
        boxShadow: "4px 0 24px rgba(0,0,0,0.4)",
      }}>
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(92,106,240,0.12)" }}>
          <div style={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: "14px",
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}>
            AMAImedia
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "5px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em" }}>
              Producer Center
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {NAV_ITEMS.map(({ href, label, icon }) => {
              const active = href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: active ? 600 : 400,
                    color: active ? "#a5b4fc" : "rgba(255,255,255,0.45)",
                    background: active
                      ? "linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.1) 100%)"
                      : "transparent",
                    border: active ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent",
                    boxShadow: active ? "0 0 12px rgba(99,102,241,0.08)" : "none",
                    transition: "all 0.15s ease",
                    textDecoration: "none",
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                      (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)";
                    }
                  }}
                >
                  <span style={{ fontSize: "15px", lineHeight: 1, minWidth: "20px", textAlign: "center" }}>{icon}</span>
                  <span>{label}</span>
                  {active && (
                    <span style={{ marginLeft: "auto", width: "4px", height: "4px", borderRadius: "50%", background: "#818cf8", boxShadow: "0 0 6px #818cf8" }} />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div style={{ padding: "12px", borderTop: "1px solid rgba(92,106,240,0.12)" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px",
            borderRadius: "10px", background: "rgba(255,255,255,0.03)", marginBottom: "6px",
          }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "8px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "11px", fontWeight: 700, flexShrink: 0,
            }}>З</div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Зарина
              </div>
              <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)" }}>@amai.media</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: "100%", textAlign: "left", padding: "7px 10px", borderRadius: "8px",
              fontSize: "12px", color: "rgba(255,255,255,0.3)", background: "transparent",
              border: "none", cursor: "pointer", transition: "all 0.15s ease",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)";
              (e.currentTarget as HTMLElement).style.color = "#f87171";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)";
            }}
          >
            ← Выйти
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto" style={{ background: "#050710" }}>
        {children}
      </main>
    </div>
  );
}
