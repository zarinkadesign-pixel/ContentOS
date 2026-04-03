"use client";
import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap, Globe, Clapperboard, Check, Loader2, AlertCircle, ArrowLeft, Play } from "lucide-react";
import clsx from "clsx";

type PlanId = "hub_monthly" | "hub_yearly" | "studio_monthly" | "studio_yearly";
type BillingCycle = "monthly" | "yearly";

const PLAN_PRICES: Record<PlanId, number> = {
  hub_monthly: 29,
  hub_yearly: 249,
  studio_monthly: 15,
  studio_yearly: 129,
};

function getPlanId(type: "hub" | "studio", cycle: BillingCycle): PlanId {
  return `${type}_${cycle}` as PlanId;
}

function DemoCallout() {
  const [loading, setLoading] = useState(false);
  async function handleDemo() {
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/demo", { method: "POST" });
      const data = await res.json();
      window.location.href = data.redirectTo ?? "/dashboard";
    } catch { setLoading(false); }
  }
  return (
    <div className="mt-4 bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-medium text-amber-300">Хотите сначала посмотреть?</p>
        <p className="text-xs text-[#64748b] mt-0.5">Демо-доступ ко всем модулям — бесплатно</p>
      </div>
      <button
        onClick={handleDemo}
        disabled={loading}
        className="shrink-0 flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
        {loading ? "…" : "Демо →"}
      </button>
    </div>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialPlan = searchParams.get("plan") as PlanId | null;
  const initialType = initialPlan?.startsWith("hub") ? "hub" : "studio";
  const initialCycle: BillingCycle = initialPlan?.endsWith("yearly") ? "yearly" : "monthly";

  const [step, setStep] = useState<1 | 2>(initialPlan ? 2 : 1);
  const [selectedType, setSelectedType] = useState<"hub" | "studio">(initialType as "hub" | "studio");
  const [billing, setBilling] = useState<BillingCycle>(initialCycle);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const planId = getPlanId(selectedType, billing);
  const price = PLAN_PRICES[planId];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, plan: planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Ошибка регистрации");
        return;
      }
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        // No Prodamus configured
        router.push("/login?registered=1");
      }
    } catch {
      setError("Ошибка соединения. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0d1126] flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#6c63ff] shadow-xl shadow-[#6c63ff]/30 mb-4">
            <Zap size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-[#e2e8f0]">ContentOS</h1>
          <p className="text-sm text-[#64748b] mt-1">Создать аккаунт</p>
        </div>

        <div className="bg-[#0d1527] border border-[#1a1f3a] rounded-2xl p-6 shadow-2xl">
          {step === 1 ? (
            <>
              <h2 className="text-lg font-semibold text-[#e2e8f0] mb-1">Выберите план</h2>
              <p className="text-sm text-[#64748b] mb-6">Вы сможете изменить его позже</p>

              {/* Billing toggle */}
              <div className="flex items-center gap-2 bg-[#080d1e] border border-[#1a1f3a] rounded-xl p-1 mb-6">
                <button
                  onClick={() => setBilling("monthly")}
                  className={clsx(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                    billing === "monthly" ? "bg-[#6c63ff] text-white" : "text-[#64748b] hover:text-[#e2e8f0]"
                  )}
                >
                  Ежемесячно
                </button>
                <button
                  onClick={() => setBilling("yearly")}
                  className={clsx(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2",
                    billing === "yearly" ? "bg-[#6c63ff] text-white" : "text-[#64748b] hover:text-[#e2e8f0]"
                  )}
                >
                  Ежегодно
                  <span className={clsx("text-xs px-1.5 py-0.5 rounded", billing === "yearly" ? "bg-white/20" : "bg-green-500/15 text-green-400")}>
                    −30%
                  </span>
                </button>
              </div>

              {/* Plan cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {(["hub", "studio"] as const).map((type) => {
                  const pid = getPlanId(type, billing);
                  const p = PLAN_PRICES[pid];
                  const isHub = type === "hub";
                  const selected = selectedType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={clsx(
                        "text-left p-4 rounded-xl border-2 transition-all",
                        selected
                          ? "border-[#6c63ff] bg-[#6c63ff]/10"
                          : "border-[#1a1f3a] hover:border-[#6c63ff]/30"
                      )}
                    >
                      <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center mb-3", isHub ? "bg-[#6c63ff]/15" : "bg-[#a78bfa]/15")}>
                        {isHub ? <Globe size={16} className="text-[#6c63ff]" /> : <Clapperboard size={16} className="text-[#a78bfa]" />}
                      </div>
                      <p className="font-semibold text-[#e2e8f0] text-sm mb-1">{isHub ? "Хаб" : "Студия"}</p>
                      <p className="text-xs text-[#64748b] mb-2">{isHub ? "Управление бизнесом" : "Создание контента"}</p>
                      <p className="text-lg font-bold text-[#e2e8f0]">
                        ${p}
                        <span className="text-xs font-normal text-[#64748b]"> / {billing === "monthly" ? "мес" : "год"}</span>
                      </p>
                      {selected && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-[#6c63ff]">
                          <Check size={12} /> Выбрано
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full bg-[#6c63ff] hover:bg-[#5b53ee] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-lg shadow-[#6c63ff]/20"
              >
                Продолжить →
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep(1)} className="text-[#64748b] hover:text-[#e2e8f0] transition-colors">
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h2 className="text-lg font-semibold text-[#e2e8f0]">Данные аккаунта</h2>
                  <p className="text-xs text-[#64748b]">
                    {selectedType === "hub" ? "Хаб" : "Студия"} · ${price} / {billing === "monthly" ? "мес" : "год"}
                  </p>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-4">
                  <AlertCircle size={14} className="text-red-400 shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-[#64748b] mb-1.5 font-medium">Ваше имя</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Иван Иванов"
                    className="w-full bg-[#080d1e] border border-[#1a1f3a] rounded-lg px-3 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#6c63ff] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#64748b] mb-1.5 font-medium">Email</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#080d1e] border border-[#1a1f3a] rounded-lg px-3 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#6c63ff] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#64748b] mb-1.5 font-medium">Пароль</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Минимум 6 символов"
                    className="w-full bg-[#080d1e] border border-[#1a1f3a] rounded-lg px-3 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#6c63ff] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#6c63ff] hover:bg-[#5b53ee] disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#6c63ff]/20"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? "Создаём аккаунт…" : `Создать и перейти к оплате — $${price}`}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-[#64748b] mt-5">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-[#6c63ff] hover:underline font-medium">
            Войти
          </Link>
        </p>

        {/* Demo CTA */}
        <DemoCallout />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 overflow-y-auto bg-[#0d1126] flex items-center justify-center">
        <Loader2 size={24} className="text-[#6c63ff] animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
