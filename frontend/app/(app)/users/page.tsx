"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Users, RefreshCw, CheckCircle2, XCircle, Loader2,
  Globe, Clapperboard, Trash2, ToggleLeft, ToggleRight,
} from "lucide-react";
import clsx from "clsx";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "hub" | "studio";
  plan: string | null;
  plan_expires_at: string | null;
  plan_active: boolean;
  created_at: string;
  last_login: string | null;
}

const PLAN_LABELS: Record<string, string> = {
  hub_monthly:    "Хаб · Месяц",
  hub_yearly:     "Хаб · Год",
  studio_monthly: "Студия · Месяц",
  studio_yearly:  "Студия · Год",
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return true;
  return new Date(expiresAt) < new Date();
}

export default function UsersPage() {
  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(user: User) {
    setActionId(user.id);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, plan_active: !user.plan_active }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      }
    } finally {
      setActionId(null);
    }
  }

  async function extendPlan(user: User, days: number) {
    setActionId(user.id);
    try {
      const base = user.plan_expires_at && !isExpired(user.plan_expires_at)
        ? new Date(user.plan_expires_at)
        : new Date();
      base.setDate(base.getDate() + days);
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, plan_expires_at: base.toISOString(), plan_active: true }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      }
    } finally {
      setActionId(null);
    }
  }

  async function deleteUser(user: User) {
    if (!confirm(`Удалить пользователя ${user.name} (${user.email})?`)) return;
    setActionId(user.id);
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id }),
      });
      if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } finally {
      setActionId(null);
    }
  }

  const hubUsers    = users.filter((u) => u.role === "hub");
  const studioUsers = users.filter((u) => u.role === "studio");
  const activeCount = users.filter((u) => u.plan_active && !isExpired(u.plan_expires_at)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text flex items-center gap-2">
            <Users size={20} className="text-accent" />
            Пользователи
          </h1>
          <p className="text-sm text-subtext mt-0.5">Управление подписчиками ContentOS</p>
        </div>
        <button onClick={load} className="btn-ghost flex items-center gap-2">
          <RefreshCw size={14} /> Обновить
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Всего", value: users.length,    color: "text-text",        bg: "bg-white/5"        },
          { label: "Активных", value: activeCount,  color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Хаб",      value: hubUsers.length,    color: "text-accent",      bg: "bg-accent/10"      },
          { label: "Студия",   value: studioUsers.length, color: "text-purple-400",  bg: "bg-purple-400/10"  },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} border border-border rounded-xl p-4`}>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-subtext mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-subtext">
          <Loader2 size={18} className="animate-spin" /> Загрузка...
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-subtext">
          <Users size={32} className="mx-auto mb-3 opacity-30" />
          <p>Нет зарегистрированных пользователей</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Пользователь", "Тариф", "Статус", "Действует до", "Последний вход", "Действия"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-subtext font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => {
                  const expired = isExpired(user.plan_expires_at);
                  const isWorking = actionId === user.id;
                  return (
                    <tr key={user.id} className="hover:bg-white/3 transition-colors">
                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                            user.role === "hub" ? "bg-accent/20 text-accent" : "bg-purple-400/20 text-purple-400"
                          )}>
                            {user.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-text">{user.name}</p>
                            <p className="text-xs text-subtext">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {user.role === "hub"
                            ? <Globe size={12} className="text-accent" />
                            : <Clapperboard size={12} className="text-purple-400" />}
                          <span className="text-subtext text-xs">
                            {user.plan ? PLAN_LABELS[user.plan] ?? user.plan : "—"}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {user.plan_active && !expired ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-400">
                            <CheckCircle2 size={12} /> Активна
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-red-400">
                            <XCircle size={12} /> {expired ? "Истекла" : "Неактивна"}
                          </span>
                        )}
                      </td>

                      {/* Expires */}
                      <td className="px-4 py-3 text-xs text-subtext">
                        {fmtDate(user.plan_expires_at)}
                      </td>

                      {/* Last login */}
                      <td className="px-4 py-3 text-xs text-subtext">
                        {fmtDate(user.last_login)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* Toggle active */}
                          <button
                            onClick={() => toggleActive(user)}
                            disabled={isWorking}
                            title={user.plan_active ? "Деактивировать" : "Активировать"}
                            className={clsx(
                              "p-1.5 rounded-lg transition-colors text-xs",
                              user.plan_active
                                ? "text-emerald-400 hover:bg-emerald-400/10"
                                : "text-subtext hover:bg-white/10"
                            )}
                          >
                            {isWorking ? <Loader2 size={14} className="animate-spin" /> :
                              user.plan_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                          </button>

                          {/* +30 days */}
                          <button
                            onClick={() => extendPlan(user, 30)}
                            disabled={isWorking}
                            title="+30 дней"
                            className="px-2 py-1 rounded-lg text-xs text-accent hover:bg-accent/10 transition-colors"
                          >
                            +30д
                          </button>

                          {/* +365 days */}
                          <button
                            onClick={() => extendPlan(user, 365)}
                            disabled={isWorking}
                            title="+365 дней"
                            className="px-2 py-1 rounded-lg text-xs text-accent hover:bg-accent/10 transition-colors"
                          >
                            +год
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => deleteUser(user)}
                            disabled={isWorking}
                            title="Удалить"
                            className="p-1.5 rounded-lg text-subtext hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Integration note */}
      <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 text-sm text-subtext">
        <p className="font-medium text-text mb-1">🔌 Интеграция с Prodamus</p>
        <p className="text-xs leading-relaxed">
          При успешной оплате Prodamus отправляет webhook на <code className="text-accent bg-accent/10 px-1 py-0.5 rounded text-xs">/api/payments/webhook</code>.
          Подписка активируется автоматически. Укажите этот URL в личном кабинете Prodamus → Настройки → Webhook.
        </p>
      </div>
    </div>
  );
}
