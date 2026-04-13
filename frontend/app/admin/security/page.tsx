/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/security/page.tsx
 */
"use client";

import { useState } from "react";
import AdminLayout from "../_components/AdminLayout";

/* ─── DATA ─── */
interface ApiEntry {
  name: string;
  env: string;
  usage: string;
  scope: string;
  console: string;
  risk: string;
  note?: string;
}

interface ApiGroup {
  id: string;
  icon: string;
  title: string;
  color: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  apis: ApiEntry[];
}

const API_GROUPS: ApiGroup[] = [
  {
    id: "ai",
    icon: "🧠",
    title: "AI / Нейросети",
    color: "#7C3AED",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-400",
    apis: [
      {
        name: "Google Gemini 2.0 Flash",
        env: "GEMINI_KEY",
        usage: "Генерация контента, скоринг лидов, стратегии, рекламные тексты, ответы в Telegram",
        scope: "engine.py + n8n workflows 01–17",
        console: "console.cloud.google.com → AI Studio",
        risk: "high",
      },
      {
        name: "Groq (LLaMA 3)",
        env: "GROQ_API_KEY",
        usage: "Быстрая генерация текста, транскрипция, анализ контента в frontend",
        scope: "frontend API routes",
        console: "console.groq.com",
        risk: "high",
      },
      {
        name: "Replicate (FLUX + MiniMax)",
        env: "REPLICATE_API_TOKEN",
        usage: "Генерация изображений (FLUX Schnell), генерация видео (MiniMax)",
        scope: "frontend/app/api/generate",
        console: "replicate.com/account/api-tokens",
        risk: "high",
      },
    ],
  },
  {
    id: "social",
    icon: "📡",
    title: "Мессенджеры и соцсети",
    color: "#3B82F6",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-400",
    apis: [
      {
        name: "Telegram Bot API",
        env: "BOT_TOKEN / TELEGRAM_BOT_TOKEN",
        usage: "Уведомления Зарине, мониторинг сообщений, автоответы, публикация контента",
        scope: "engine.py + n8n + frontend",
        console: "t.me/BotFather → /mybots",
        risk: "high",
      },
      {
        name: "YouTube Data API v3",
        env: "YOUTUBE_API_KEY",
        usage: "Поиск вирусных видео, анализ трендов (Viral Finder)",
        scope: "frontend/app/api/viral-finder",
        console: "console.cloud.google.com → YouTube Data API",
        risk: "medium",
      },
    ],
  },
  {
    id: "content",
    icon: "🎬",
    title: "Контент и видео",
    color: "#F59E0B",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-400",
    apis: [
      {
        name: "Vizard.ai",
        env: "VIZARD_KEY",
        usage: "Автоматическая нарезка длинных видео на Reels/Shorts, публикация клипов",
        scope: "engine.py task_publish() + send_to_vizard.py",
        console: "app.vizard.ai → Settings → API",
        risk: "medium",
      },
    ],
  },
  {
    id: "payments",
    icon: "💳",
    title: "Платёжные системы",
    color: "#22C55E",
    borderColor: "border-green-500/30",
    bgColor: "bg-green-500/10",
    textColor: "text-green-400",
    apis: [
      {
        name: "Prodamus",
        env: "PRODAMUS_SHOP + PRODAMUS_KEY",
        usage: "Приём оплаты за подписки Hub и Studio, HMAC-SHA256 верификация вебхуков",
        scope: "frontend/app/api/payments/webhook + products/payment-link",
        console: "prodamus.ru → Магазин → API",
        risk: "critical",
        note: "Вебхук защищён HMAC-SHA256 подписью",
      },
    ],
  },
  {
    id: "infra",
    icon: "⚙️",
    title: "Инфраструктура",
    color: "#06B6D4",
    borderColor: "border-cyan-500/30",
    bgColor: "bg-cyan-500/10",
    textColor: "text-cyan-400",
    apis: [
      {
        name: "JWT Secret",
        env: "JWT_SECRET",
        usage: "Подпись и верификация токенов авторизации пользователей",
        scope: "frontend/lib/auth.ts",
        console: "Генерировать: openssl rand -base64 64",
        risk: "critical",
      },
      {
        name: "Google Sheets / Service Account",
        env: "GOOGLE_SA_EMAIL + GOOGLE_SA_PRIVATE_KEY",
        usage: "Экспорт данных пользователей и платежей в Google Sheets",
        scope: "frontend/lib/sheets.ts",
        console: "console.cloud.google.com → Service Accounts",
        risk: "medium",
      },
    ],
  },
];

const SECURITY_RULES = [
  {
    icon: "🔐",
    title: "Хранение ключей",
    level: "Уровень 1 — Базовый",
    color: "text-green-400",
    rules: [
      "Все ключи только в .env файлах — НИКОГДА в коде",
      ".env добавлен в .gitignore — не попадает в GitHub",
      "На сервере (Vercel/Railway) — только через переменные окружения в дашборде",
      "Локально — отдельный .env.local, не синхронизируется",
    ],
  },
  {
    icon: "🛡️",
    title: "Защита API endpoint'ов",
    level: "Уровень 2 — Сервер",
    color: "text-blue-400",
    rules: [
      "Все AI-запросы делаются ТОЛЬКО через серверный код (Next.js API routes) — ключи недоступны в браузере",
      "Rate limiting: максимум 10 запросов в минуту на IP",
      "Webhook Prodamus верифицируется через HMAC-SHA256 подпись",
      "JWT токены с истечением срока (24 часа)",
      "Admin маршруты защищены middleware с проверкой роли",
    ],
  },
  {
    icon: "🤖",
    title: "Защита от AI-атак и промпт-инъекций",
    level: "Уровень 3 — AI Security",
    color: "text-purple-400",
    rules: [
      "Никогда не передавать API ключи в промпты — ни в каком виде",
      "Ограничение длины пользовательского ввода (max 2000 символов)",
      "Санитизация входящих данных перед вставкой в промпт",
      "System prompt изолирован от user input — никогда не конкатенировать",
      "Запрет на выполнение кода из пользовательских сообщений",
      "Логирование всех AI-запросов для детекции аномалий",
    ],
  },
  {
    icon: "🚨",
    title: "Защита от социальной инженерии",
    level: "Уровень 4 — Human/AI Phishing",
    color: "text-red-400",
    rules: [
      "Claude (и любой AI) не может выдать ключи по 'сказке про бабушку' — ключи не передаются в контекст",
      "API ключи НИКОГДА не появляются в ответах AI — только в серверном коде",
      "Все запросы к AI-сервисам проходят через твой сервер — ключ никогда не в браузере",
      "При компрометации — ротируй ключ немедленно в консоли сервиса + в Vercel env vars",
      "Храни резервные ключи в менеджере паролей (1Password, Bitwarden) — не в мессенджерах",
      "Никогда не отправляй ключи в Telegram, email, Discord — даже 'временно'",
    ],
  },
  {
    icon: "🔄",
    title: "Ротация и мониторинг",
    level: "Уровень 5 — Операционный",
    color: "text-amber-400",
    rules: [
      "Ротация всех ключей каждые 90 дней",
      "Google Cloud: включи alerts на quota/billing превышения",
      "Telegram: используй IP whitelist для webhook endpoint",
      "Мониторинг: если usage резко вырос — немедленная ротация",
      "JWT_SECRET: сменить после утечки → все сессии сбросятся автоматически",
    ],
  },
];

const RISK_COLORS: Record<string, string> = {
  critical: "bg-red-500/20 text-red-300 border border-red-500/30",
  high:     "bg-orange-500/20 text-orange-300 border border-orange-500/30",
  medium:   "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
  low:      "bg-green-500/20 text-green-300 border border-green-500/30",
};
const RISK_LABELS: Record<string, string> = {
  critical: "⚠️ Критический",
  high:     "🔴 Высокий",
  medium:   "🟡 Средний",
  low:      "🟢 Низкий",
};

type Tab = "apis" | "security" | "checklist";

export default function SecurityPage() {
  const [tab, setTab] = useState<Tab>("apis");
  const [expanded, setExpanded] = useState<string | null>(null);

  const totalApis = API_GROUPS.reduce((a, g) => a + g.apis.length, 0);
  const criticalCount = API_GROUPS.flatMap(g => g.apis).filter(a => a.risk === "critical").length;
  const highCount = API_GROUPS.flatMap(g => g.apis).filter(a => a.risk === "high").length;

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            🔒 Безопасность API
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Все интеграции · Защита от взлома, промпт-инъекций и социальной инженерии
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Всего ключей", value: totalApis, color: "text-white" },
            { label: "Критических", value: criticalCount, color: "text-red-400" },
            { label: "Высокий риск", value: highCount, color: "text-orange-400" },
            { label: "Уровней защиты", value: 5, color: "text-[#C8F135]" },
          ].map((s) => (
            <div key={s.label} className="bg-[#0d0d1c] border border-[#1e1e38] rounded-xl p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-white/40 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Warning banner */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex gap-3">
          <div className="text-2xl">🛡️</div>
          <div>
            <div className="font-bold text-red-300 text-sm mb-1">Защита от «сказки про бабушку»</div>
            <div className="text-white/50 text-xs leading-relaxed">
              Все API ключи хранятся только в серверных переменных окружения (.env) и никогда не передаются в контекст AI-модели.
              Даже если злоумышленник попросит Claude «от лица бабушки» раскрыть ключ — это невозможно физически,
              потому что ключи недоступны в промпте. Никакая социальная инженерия не поможет получить ключи через AI.
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {(["apis", "security", "checklist"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === t
                  ? "bg-[#5c6af0] text-white"
                  : "bg-[#0d0d1c] text-white/40 hover:text-white border border-[#1e1e38]"
              }`}
            >
              {t === "apis" ? "🔑 Все API" : t === "security" ? "🛡️ Правила защиты" : "✅ Чеклист"}
            </button>
          ))}
        </div>

        {/* ALL APIs TAB */}
        {tab === "apis" && (
          <div className="space-y-5">
            {API_GROUPS.map((group) => (
              <div key={group.id} className={`border ${group.borderColor} rounded-xl overflow-hidden`}>
                <div className={`${group.bgColor} px-5 py-3 flex items-center gap-3`}>
                  <span className="text-xl">{group.icon}</span>
                  <div className="font-bold text-white">{group.title}</div>
                  <div className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${group.bgColor} ${group.textColor} border ${group.borderColor}`}>
                    {group.apis.length} {group.apis.length === 1 ? "ключ" : "ключа"}
                  </div>
                </div>
                <div className="divide-y divide-[#1e1e38]">
                  {group.apis.map((api) => (
                    <div key={api.env} className="bg-[#0d0d1c] p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="font-bold text-white text-sm">{api.name}</div>
                          <div className="font-mono text-xs text-[#C8F135]/70 mt-0.5">{api.env}</div>
                        </div>
                        <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full ${RISK_COLORS[api.risk]}`}>
                          {RISK_LABELS[api.risk]}
                        </span>
                      </div>
                      <div className="text-white/50 text-xs mb-2">{api.usage}</div>
                      <div className="flex flex-wrap gap-3 text-[11px]">
                        <span className="text-white/25">📁 {api.scope}</span>
                        <span className="text-white/25">🔗 {api.console}</span>
                      </div>
                      {api.note && (
                        <div className="mt-2 text-[11px] text-green-400/70">✓ {api.note}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SECURITY RULES TAB */}
        {tab === "security" && (
          <div className="space-y-4">
            {SECURITY_RULES.map((rule) => (
              <div key={rule.title} className="bg-[#0d0d1c] border border-[#1e1e38] rounded-xl overflow-hidden">
                <button
                  className="w-full px-5 py-4 flex items-center gap-3 text-left"
                  onClick={() => setExpanded(expanded === rule.title ? null : rule.title)}
                >
                  <span className="text-xl">{rule.icon}</span>
                  <div className="flex-1">
                    <div className="font-bold text-white text-sm">{rule.title}</div>
                    <div className={`text-xs ${rule.color}`}>{rule.level}</div>
                  </div>
                  <span className="text-white/30">{expanded === rule.title ? "▲" : "▼"}</span>
                </button>
                {expanded === rule.title && (
                  <div className="border-t border-[#1e1e38] px-5 py-4 space-y-2">
                    {rule.rules.map((r, i) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <span className="text-white/20 shrink-0">→</span>
                        <span className="text-white/60 leading-relaxed">{r}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CHECKLIST TAB */}
        {tab === "checklist" && (
          <div className="space-y-4">
            <div className="bg-[#0d0d1c] border border-[#1e1e38] rounded-xl p-5">
              <h3 className="font-bold text-white mb-4">🚨 Сделай прямо сейчас</h3>
              <div className="space-y-3">
                {[
                  { done: true,  text: ".env в .gitignore — ключи не в GitHub" },
                  { done: true,  text: "Prodamus webhook защищён HMAC-SHA256" },
                  { done: true,  text: "AI-запросы только через серверный код" },
                  { done: false, text: "Добавить реальный PRODAMUS_SHOP и PRODAMUS_KEY в Vercel env vars" },
                  { done: false, text: "Сменить JWT_SECRET на production-ready (64 символа): openssl rand -base64 64" },
                  { done: false, text: "Включить Google Cloud billing alerts (лимит $50/месяц)" },
                  { done: false, text: "Добавить rate limiting middleware (max 10 req/min/IP)" },
                  { done: false, text: "Ротировать все ключи и сохранить в 1Password/Bitwarden" },
                  { done: false, text: "Включить 2FA на всех сервисных аккаунтах (Google Cloud, Replicate, Groq)" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs ${
                      item.done ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-[#1e1e38] text-white/20 border border-[#1e1e38]"
                    }`}>
                      {item.done ? "✓" : "○"}
                    </div>
                    <span className={`text-sm leading-relaxed ${item.done ? "text-white/40 line-through" : "text-white/70"}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0d0d1c] border border-[#1e1e38] rounded-xl p-5">
              <h3 className="font-bold text-white mb-4">🔑 Где хранить ключи безопасно</h3>
              <div className="space-y-3">
                {[
                  { where: "Vercel Dashboard", how: "Settings → Environment Variables → добавить для Production", ok: true },
                  { where: "1Password / Bitwarden", how: "Менеджер паролей — резервная копия всех ключей", ok: true },
                  { where: ".env.local", how: "Только для локальной разработки, никогда не в git", ok: true },
                  { where: "Telegram/WhatsApp", how: "НИКОГДА — даже себе", ok: false },
                  { where: "Google Docs / Notion", how: "НИКОГДА — облачные документы могут быть взломаны", ok: false },
                  { where: "Email", how: "НИКОГДА — email регулярно взламывают", ok: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className={`shrink-0 text-sm ${item.ok ? "text-green-400" : "text-red-400"}`}>{item.ok ? "✅" : "❌"}</span>
                    <div>
                      <div className="font-semibold text-white text-sm">{item.where}</div>
                      <div className="text-white/40 text-xs">{item.how}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
