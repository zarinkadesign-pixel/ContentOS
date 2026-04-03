"use client";
import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap, Loader2, AlertCircle, CheckCircle2, Play, ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";

  // Free access form state
  const [freeName, setFreeName]   = useState("");
  const [freeEmail, setFreeEmail] = useState("");
  const [freeLoading, setFreeLoading] = useState(false);
  const [freeError, setFreeError] = useState("");

  // Login form state
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Ошибка входа"); return; }
      router.push(data.redirectTo ?? "/dashboard");
    } catch {
      setError("Ошибка соединения. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0d1126] flex flex-col items-center justify-center p-4 relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#6c63ff]/6 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 animate-fade-up">
        {/* Logo */}
        <Link href="/" className="flex flex-col items-center mb-8 group">
          <div className="w-12 h-12 rounded-2xl bg-[#6c63ff] flex items-center justify-center shadow-2xl shadow-[#6c63ff]/40 mb-3 group-hover:shadow-[#6c63ff]/60 transition-shadow">
            <Zap size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-[#e2e8f0]">ContentOS</h1>
          <p className="text-xs text-[#64748b] mt-0.5">Producer Center</p>
        </Link>

        {/* Free access card */}
        <div className="w-full mb-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl px-5 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <Play size={16} className="text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-300">Начать бесплатно</p>
              <p className="text-xs text-[#64748b]">Все 10 модулей · без карты · 1 минута</p>
            </div>
          </div>

          {freeError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 mb-3">
              <AlertCircle size={13} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{freeError}</p>
            </div>
          )}

          <div className="space-y-2.5">
            <input
              type="text"
              autoFocus
              required
              value={freeName}
              onChange={(e) => setFreeName(e.target.value)}
              placeholder="Ваше имя"
              className="w-full bg-[#080d1e] border border-amber-500/30 rounded-xl px-3 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b]/60 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <input
              type="email"
              required
              value={freeEmail}
              onChange={(e) => setFreeEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-[#080d1e] border border-amber-500/30 rounded-xl px-3 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b]/60 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              onClick={async () => {
                if (!freeName.trim() || !freeEmail.trim()) {
                  setFreeError("Заполните имя и email");
                  return;
                }
                setFreeError("");
                setFreeLoading(true);
                try {
                  const res = await fetch("/api/auth/free", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: freeName.trim(), email: freeEmail.trim() }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    setFreeError(data.error ?? "Ошибка");
                    return;
                  }
                  window.location.href = data.redirectTo ?? "/dashboard";
                } catch {
                  setFreeError("Ошибка соединения. Попробуйте ещё раз.");
                } finally {
                  setFreeLoading(false);
                }
              }}
              disabled={freeLoading}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20"
            >
              {freeLoading
                ? <Loader2 size={14} className="animate-spin" />
                : <ArrowRight size={14} />}
              {freeLoading ? "Открываем приложение…" : "Войти в приложение бесплатно →"}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-[#1a1f3a]" />
          <span className="text-xs text-[#64748b] shrink-0">или войдите в аккаунт</span>
          <div className="flex-1 h-px bg-[#1a1f3a]" />
        </div>

        {/* Login card */}
        <div className="bg-[#0d1527] border border-[#1a1f3a] rounded-2xl p-6 shadow-2xl">
          {registered && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5 mb-4">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <p className="text-sm text-emerald-400">Аккаунт создан. После оплаты войдите в систему.</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 mb-4">
              <AlertCircle size={14} className="text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-[#64748b] mb-1.5 font-medium">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#080d1e] border border-[#1a1f3a] rounded-xl px-3 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b]/60 focus:outline-none focus:border-[#6c63ff] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-[#64748b] mb-1.5 font-medium">Пароль</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#080d1e] border border-[#1a1f3a] rounded-xl px-3 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b]/60 focus:outline-none focus:border-[#6c63ff] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6c63ff] hover:bg-[#5b53ee] disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#6c63ff]/20"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Входим…" : "Войти"}
            </button>
          </form>
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-4 mt-5 text-xs text-[#64748b]">
          <Link href="/" className="hover:text-[#e2e8f0] transition-colors">← Главная</Link>
          <span className="text-[#1a1f3a]">·</span>
          <Link href="/register" className="text-[#6c63ff] hover:underline font-medium">
            Зарегистрироваться
          </Link>
          <span className="text-[#1a1f3a]">·</span>
          <Link href="/pricing" className="hover:text-[#e2e8f0] transition-colors">Тарифы</Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 overflow-y-auto bg-[#0d1126] flex items-center justify-center">
        <Loader2 size={24} className="text-[#6c63ff] animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
