"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Kanban, DollarSign,
  Video, ChevronRight, Zap, LayoutGrid,
} from "lucide-react";
import clsx from "clsx";

const NAV = [
  { href: "/",          label: "Дашборд",  icon: LayoutDashboard },
  { href: "/workspace", label: "Кабинет",  icon: LayoutGrid },
  { href: "/crm",       label: "CRM",      icon: Kanban },
  { href: "/clients",   label: "Клиенты",  icon: Users },
  { href: "/finance",   label: "Финансы",  icon: DollarSign },
  { href: "/content",   label: "Контент",  icon: Video },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-56 bg-nav border-r border-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-semibold text-text text-sm">ContentOS</span>
        </div>
        <p className="text-xs text-subtext mt-1">Producer Center</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== "/" && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group",
                active
                  ? "bg-accent/20 text-accent"
                  : "text-subtext hover:text-text hover:bg-white/5"
              )}
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={12} className="opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-accent/30 flex items-center justify-center text-xs text-accent font-bold">
            A
          </div>
          <span className="text-xs text-subtext">AMAImedia</span>
        </div>
      </div>
    </aside>
  );
}
