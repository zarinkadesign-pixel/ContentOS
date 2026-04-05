/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/_components/AdminLayout.tsx
 */
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_SECTIONS = [
  {
    title: "Система",
    items: [
      { href: "/admin",           label: "Обзор",            icon: "📊" },
      { href: "/admin/users",     label: "Пользователи",     icon: "👤" },
      { href: "/admin/activity",  label: "Лог активности",   icon: "📋" },
      { href: "/admin/security",  label: "Безопасность API", icon: "🔒" },
      { href: "/admin/roadmap",   label: "Дорожная карта",   icon: "🗺️" },
    ],
  },
  {
    title: "Бизнес",
    items: [
      { href: "/dashboard", label: "Дашборд",   icon: "🏠" },
      { href: "/crm",       label: "CRM / Лиды", icon: "🎯" },
      { href: "/clients",   label: "Клиенты",   icon: "👥" },
      { href: "/finance",   label: "Финансы",   icon: "💰" },
      { href: "/products",  label: "Продукты",  icon: "📦" },
      { href: "/funnels",   label: "Воронки",   icon: "🌀" },
    ],
  },
  {
    title: "Контент",
    items: [
      { href: "/studio",    label: "Студия",    icon: "🎬" },
      { href: "/content",   label: "Контент",   icon: "📹" },
      { href: "/generate",  label: "Генерация", icon: "✨" },
      { href: "/scheduler", label: "Постинг",   icon: "📅" },
    ],
  },
  {
    title: "AI Система",
    items: [
      { href: "/admin/monitor", label: "Engine Monitor", icon: "⚡" },
      { href: "/admin/skills",  label: "Claude Skills",  icon: "🧩" },
      { href: "/automation",    label: "Агенты / Engine", icon: "🤖" },
      { href: "/team",          label: "AI Команда",      icon: "🧠" },
      { href: "/hub",           label: "AI Хаб",          icon: "🌐" },
      { href: "/workspace",     label: "Кабинет",         icon: "🖥️" },
    ],
  },
  {
    title: "Привлечение",
    items: [
      { href: "/prospecting",  label: "Поиск клиентов", icon: "🔍" },
      { href: "/campaigns",    label: "Рассылки",       icon: "📧" },
      { href: "/viral-finder", label: "Тренды",         icon: "📈" },
    ],
  },
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
      <aside className="w-60 shrink-0 border-r border-[#1e1e38] flex flex-col bg-[#08091c]">
        <div className="px-5 py-4 border-b border-[#1e1e38]">
          <div className="text-sm font-bold tracking-widest text-[#5c6af0] uppercase">
            Producer Center
          </div>
          <div className="text-[10px] text-white/30 mt-0.5">Admin · AMAImedia</div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="px-3 mb-1 text-[9px] font-bold uppercase tracking-widest text-white/25">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map(({ href, label, icon }) => {
                  const isAdminRoute = href.startsWith("/admin");
                  const active = isAdminRoute
                    ? pathname === href || (href !== "/admin" && pathname.startsWith(href))
                    : pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? "bg-[#5c6af0]/20 text-[#818cf8]"
                          : "text-white/50 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="text-sm leading-none">{icon}</span>
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-[#1e1e38]">
          <div className="px-3 py-1 mb-1 text-[10px] text-white/25">
            admin@amai.media
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-white/40 hover:bg-white/5 hover:text-white transition-colors"
          >
            ← Выйти
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-[#050710]">
        {children}
      </main>
    </div>
  );
}
