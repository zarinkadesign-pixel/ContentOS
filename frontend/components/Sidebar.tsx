"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, Kanban, DollarSign,
  Video, ChevronRight, Zap, LayoutGrid, BrainCircuit, Clapperboard, Globe, Bot,
  LogOut, Loader2, UserCog, TrendingUp, Search, Package, GitBranch,
  ChevronDown, Sparkles, Calendar, Mail, Activity,
} from "lucide-react";
import clsx from "clsx";

interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "hub" | "studio" | "demo" | "free";
  plan: string | null;
}

// ── Sectioned nav structure ───────────────────────────────────────────────────
interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const ADMIN_SECTIONS: NavSection[] = [
  {
    title: "Обзор",
    items: [
      { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
      { href: "/workspace", label: "Кабинет", icon: LayoutGrid      },
    ],
  },
  {
    title: "Привлечение",
    items: [
      { href: "/prospecting", label: "Поиск клиентов", icon: Search     },
      { href: "/crm",         label: "CRM / Лиды",     icon: Kanban     },
      { href: "/viral-finder",label: "Тренды",          icon: TrendingUp },
    ],
  },
  {
    title: "Контент",
    items: [
      { href: "/generate", label: "Генерация медиа", icon: Sparkles    },
      { href: "/studio",   label: "Студия",          icon: Clapperboard },
      { href: "/content",  label: "Контент",         icon: Video        },
      { href: "/scheduler",label: "Постинг",         icon: Calendar    },
    ],
  },
  {
    title: "Продажи",
    items: [
      { href: "/products",  label: "Продукты",  icon: Package    },
      { href: "/funnels",   label: "Воронки",   icon: GitBranch  },
      { href: "/campaigns", label: "Рассылки",  icon: Mail       },
      { href: "/clients",   label: "Клиенты",   icon: Users      },
      { href: "/finance",   label: "Финансы",   icon: DollarSign },
    ],
  },
  {
    title: "Управление",
    items: [
      { href: "/admin/monitor", label: "Engine Monitor", icon: Activity     },
      { href: "/automation",    label: "Автопилот",      icon: Bot          },
      { href: "/team",          label: "AI Команда",     icon: BrainCircuit },
      { href: "/hub",           label: "Хаб",            icon: Globe        },
      { href: "/users",         label: "Подписчики",     icon: UserCog      },
    ],
  },
];

const DEMO_SECTIONS: NavSection[] = ADMIN_SECTIONS.map((s) =>
  s.title === "Управление"
    ? { ...s, items: s.items.filter((i) => i.href !== "/users") }
    : s
);

const HUB_SECTIONS: NavSection[]    = [{ title: "", items: [{ href: "/hub",    label: "Хаб",    icon: Globe        }] }];
const STUDIO_SECTIONS: NavSection[] = [{ title: "", items: [{ href: "/studio", label: "Студия", icon: Clapperboard }] }];

export default function Sidebar() {
  const path   = usePathname();
  const router = useRouter();
  const [user, setUser]           = useState<CurrentUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setUserLoading(false));
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch {
      router.push("/");
    } finally {
      setLoggingOut(false);
    }
  }

  function toggleSection(title: string) {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));
  }

  const sections: NavSection[] =
    !user                    ? ADMIN_SECTIONS :
    user.role === "admin"    ? ADMIN_SECTIONS :
    user.role === "demo"     ? DEMO_SECTIONS  :
    user.role === "free"     ? DEMO_SECTIONS  :
    user.role === "hub"      ? HUB_SECTIONS   :
                               STUDIO_SECTIONS;

  const initials    = user?.name ? user.name[0].toUpperCase() : "A";
  const displayName = user?.name ?? "AMAImedia";
  const displaySub  = user?.email ?? "";

  return (
    <aside className="w-14 sm:w-56 bg-nav border-r border-border flex flex-col shrink-0 overflow-hidden">

      {/* ── Logo ──────────────────────────────────────────────────────────────── */}
      <div className="px-3 sm:px-5 py-4 sm:py-5 border-b border-border">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <Zap size={14} className="text-white" />
          </div>
          <span className="hidden sm:block font-semibold text-text text-sm">ContentOS</span>
        </div>
        <p className="hidden sm:block text-xs text-subtext mt-1">Producer Center</p>
      </div>

      {/* ── Nav ───────────────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-1.5 sm:px-3 py-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {sections.map(({ title, items }) => {
          const isCollapsed = collapsed[title] ?? false;
          return (
            <div key={title || "root"}>
              {/* Section label */}
              {title && (
                <button
                  onClick={() => toggleSection(title)}
                  className="hidden sm:flex w-full items-center justify-between px-1 pt-3 pb-1 text-[10px] font-semibold text-subtext/60 uppercase tracking-widest hover:text-subtext transition-colors"
                >
                  <span>{title}</span>
                  <ChevronDown
                    size={10}
                    className={clsx("transition-transform", isCollapsed && "-rotate-90")}
                  />
                </button>
              )}

              {/* Items */}
              {!isCollapsed && (
                <div className="space-y-0.5">
                  {items.map(({ href, label, icon: Icon }) => {
                    const active = path === href || (href !== "/" && path.startsWith(href));
                    return (
                      <Link
                        key={href}
                        href={href}
                        title={label}
                        className={clsx(
                          "flex items-center justify-center sm:justify-start gap-0 sm:gap-3",
                          "px-0 sm:px-3 py-2.5 rounded-lg text-sm transition-colors group",
                          active
                            ? "bg-accent/20 text-accent"
                            : "text-subtext hover:text-text hover:bg-white/5"
                        )}
                      >
                        <Icon size={16} className="shrink-0" />
                        <span className="hidden sm:block flex-1 truncate">{label}</span>
                        {active && <ChevronRight size={12} className="hidden sm:block opacity-60 shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <div className="p-2 sm:p-4 border-t border-border space-y-2 sm:space-y-3">
        <div className="flex items-center justify-center sm:justify-start gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-accent/30 flex items-center justify-center text-xs text-accent font-bold shrink-0">
            {userLoading ? <Loader2 size={12} className="animate-spin" /> : initials}
          </div>
          <div className="hidden sm:block min-w-0 flex-1">
            <p className="text-xs font-medium text-text truncate">{displayName}</p>
            {displaySub && <p className="text-xs text-subtext truncate">{displaySub}</p>}
          </div>
        </div>

        {user?.role === "free" && (
          <div className="hidden sm:block px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
            <span className="text-[10px] text-amber-400 font-semibold">Бесплатный доступ</span>
          </div>
        )}

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title="Выйти"
          className="w-full flex items-center justify-center sm:justify-start gap-2 px-0 sm:px-3 py-2 rounded-lg text-xs text-subtext hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          {loggingOut ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
          <span className="hidden sm:block">Выйти</span>
        </button>
      </div>
    </aside>
  );
}
