import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { Zap } from "lucide-react";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("contentOS_token")?.value;
  const payload = token ? verifyToken(token) : null;
  const isDemoUser = payload?.role === "demo";
  const isFreeUser = payload?.role === "free";

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {isDemoUser && (
          <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs">
            <div className="flex items-center gap-2">
              <Zap size={12} className="text-amber-400 shrink-0" />
              <span className="text-amber-300">
                <strong>Демо-режим</strong> — данные не сохраняются. Вы видите пример того, как выглядит система.
              </span>
            </div>
            <Link
              href="/register"
              className="shrink-0 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold px-3 py-1 rounded-lg transition-colors"
            >
              Зарегистрироваться →
            </Link>
          </div>
        )}
        {isFreeUser && (
          <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs">
            <div className="flex items-center gap-2">
              <Zap size={12} className="text-amber-400 shrink-0" />
              <span className="text-amber-300">
                🎭 <strong>Бесплатный доступ</strong> — данные сохраняются. Хотите больше возможностей? Обновите тариф →
              </span>
            </div>
            <Link
              href="/pricing"
              className="shrink-0 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold px-3 py-1 rounded-lg transition-colors"
            >
              Тарифы →
            </Link>
          </div>
        )}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 animate-fade-up">{children}</main>
      </div>
    </>
  );
}
