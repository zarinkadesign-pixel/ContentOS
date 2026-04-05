/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/roadmap/page.tsx
 */
"use client";

import { useState } from "react";
import AdminLayout from "../_components/AdminLayout";

type Tab = "competitors" | "gtm" | "investment" | "phases" | "domain";

/* ── COMPETITOR DATA ── */
const COMPETITORS = [
  {
    name: "n8n",
    logo: "⚙️",
    category: "Автоматизация",
    price: "$20–$50/мес (self-hosted бесплатно)",
    features: ["400+ интеграций", "Self-hosted / Cloud", "AI nodes (LangChain, OpenAI)", "Webhooks, cron, RBAC"],
    missing: ["Нет CRM", "Нет AI контента", "Нет видео", "Требует технических знаний"],
    apiSecurity: "AES-256 хранение, OAuth 2.0, RBAC, env injection",
    score: 6,
    target: "Разработчики, DevOps",
  },
  {
    name: "Make (Integromat)",
    logo: "🔄",
    category: "Автоматизация",
    price: "$9–$29/мес (Free: 1000 ops)",
    features: ["1500+ коннекторов", "Visual scenario builder", "Data stores", "SOC 2 Type II"],
    missing: ["Нет AI генерации", "Нет CRM", "Нет видео", "Нет Telegram-native"],
    apiSecurity: "OAuth tokens зашифрованы, SOC 2, IP whitelist (Enterprise)",
    score: 5,
    target: "Маркетологи, агентства",
  },
  {
    name: "Zapier",
    logo: "⚡",
    category: "Автоматизация",
    price: "$19.99–$99/мес (Free: 100 задач)",
    features: ["6000+ приложений", "AI Zap builder", "Zapier Tables", "SOC 2, GDPR"],
    missing: ["Нет видео", "Нет CRM", "Нет AI контента", "Дорого при масштабе"],
    apiSecurity: "AES-256, zero plaintext, OAuth 2.0, SSO (Company)",
    score: 5,
    target: "SMB, non-technical бизнес",
  },
  {
    name: "HubSpot",
    logo: "🏆",
    category: "CRM + Marketing",
    price: "$18–$3600/мес (Professional $800!)",
    features: ["Full CRM + pipeline", "Lead scoring", "Email automation", "AI контент (базовый)"],
    missing: ["Огромный ценовой разрыв", "Нет AI видео", "Нет Telegram", "Избыточен для экспертов"],
    apiSecurity: "Private App tokens (scoped), OAuth 2.0, SOC 2, ISO 27001, SSO",
    score: 8,
    target: "Enterprise B2B, крупные агентства",
  },
  {
    name: "ActiveCampaign",
    logo: "📧",
    category: "Email CRM + Automation",
    price: "$15–$145/мес (1K контактов), $186/мес (10K)",
    features: ["CRM + deal pipeline", "Lead scoring", "870+ интеграций", "Predictive sending"],
    missing: ["Нет видео AI", "Нет Telegram", "Цена растёт с базой", "Нет русского рынка"],
    apiSecurity: "API v3 keys (account-level), TLS + AES-256, SOC 2, GDPR, CCPA",
    score: 7,
    target: "SMB, e-commerce, онлайн-обучение",
  },
  {
    name: "ManyChat",
    logo: "💬",
    category: "Chatbot / Messenger",
    price: "$15/мес (1K) → $365/мес (100K контактов)",
    features: ["Instagram / Facebook / Telegram боты", "Flow builder", "Broadcasting", "AI reply suggestions"],
    missing: ["Нет контент-генерации", "Нет видео", "Базовый CRM", "Telegram вторичен"],
    apiSecurity: "OAuth 2.0 (Facebook), API keys для webhook, GDPR tools",
    score: 6,
    target: "E-commerce, блогеры, коучи",
  },
  {
    name: "Jasper.ai",
    logo: "✍️",
    category: "AI Content Generation",
    price: "$39–$59/мес (Business — Custom)",
    features: ["50+ шаблонов", "Brand voice", "Multi-language (30+, рус. есть)", "SEO mode"],
    missing: ["Только текст", "Нет CRM", "Нет видео", "Нет автоматизации", "Нет Telegram"],
    apiSecurity: "API только Business tier, SOC 2, data not used for training",
    score: 6,
    target: "Маркетинговые команды, копирайтеры",
  },
  {
    name: "Opus Clip",
    logo: "✂️",
    category: "Видео AI (репостинг)",
    price: "$9–$99/мес (Free: 60 мин)",
    features: ["Auto-clips из длинных видео", "Virality score", "Auto-captions", "Brand kit"],
    missing: ["Только видео", "Нет CRM", "Нет автоматизации", "Нет Telegram", "Нет API публично"],
    apiSecurity: "OAuth для YouTube/Zoom, HTTPS, нет публичного SOC 2",
    score: 6,
    target: "YouTubers, подкастеры",
  },
  {
    name: "ContentStudio",
    logo: "📱",
    category: "Social Media Management",
    price: "$19–$299/мес (Agency Unlimited — white-label)",
    features: ["AI Writer", "Multi-platform scheduling", "Content calendar", "Analytics"],
    missing: ["Нет CRM", "Нет видео AI", "Нет Telegram-native", "Нет lead scoring"],
    apiSecurity: "OAuth для соцсетей, HTTPS, SOC 2 в процессе (2024)",
    score: 6,
    target: "Агентства, SMM-специалисты",
  },
  {
    name: "ContentOS (AMAImedia)",
    logo: "🚀",
    category: "All-in-One AI Platform",
    price: "$47–$197/мес (планируется)",
    features: [
      "AI контент + стратегия (Gemini 2.0)",
      "CRM + Lead scoring + прогрев",
      "Telegram бот + автоответы (Gemini)",
      "Видео AI (Vizard интеграция)",
      "17 n8n воркфлоу — Engine 24/7",
      "Multiplatform публикация (TG, VK)",
      "Ежемесячные отчёты клиентам",
      "Русскоязычный рынок — нативно",
    ],
    missing: ["Стадия прототипа (апрель 2026)", "Нет мобильного приложения", "Пока 1 рынок (СНГ)"],
    apiSecurity: "Env vars + HMAC-SHA256 + JWT + rate limiting + prompt injection defense (5 уровней)",
    score: 9,
    target: "Эксперты, коучи, онлайн-школы СНГ",
    isUs: true,
  },
];

const MANUAL_COSTS = [
  { task: "Контент-менеджер (посты, Reels, стратегия)", monthly: "$800–1500", annual: "$9600–18000" },
  { task: "CRM-менеджер (лиды, скоринг, прогрев)", monthly: "$600–1200", annual: "$7200–14400" },
  { task: "Видеомонтажёр (нарезка Reels)", monthly: "$500–1000", annual: "$6000–12000" },
  { task: "SMM-специалист (постинг, аналитика)", monthly: "$500–900", annual: "$6000–10800" },
  { task: "Копирайтер (тексты, рассылки, КП)", monthly: "$400–800", annual: "$4800–9600" },
  { task: "Технический специалист (автоматизации)", monthly: "$800–2000", annual: "$9600–24000" },
  { task: "ИТОГО команда 6 человек", monthly: "$3600–7400", annual: "$43200–88800", highlight: true },
  { task: "ContentOS (полный автопилот)", monthly: "$47–197", annual: "$564–2364", isSolution: true },
];

const PHASES = [
  {
    phase: "0 — Прототип",
    status: "current",
    duration: "Сейчас (апрель 2026)",
    color: "text-[#C8F135]",
    borderColor: "border-[#C8F135]/30",
    bgColor: "bg-[#C8F135]/10",
    milestone: "Рабочий прототип со всеми функциями",
    tasks: [
      "✅ Engine v4.0 — 5 автономных задач",
      "✅ 17 n8n воркфлоу активны",
      "✅ Producer Center UI (CTK desktop)",
      "✅ Next.js admin панель",
      "✅ Интеграции: Gemini, Groq, Vizard, Replicate, Prodamus",
      "✅ Vercel деплой contentOS_producer.html",
      "🔄 Первые 3–5 бета-пользователей",
    ],
    investors: "Собственные средства ($70k вложено)",
    kpi: "Работающий продукт + первые пользователи",
  },
  {
    phase: "1 — MVP",
    status: "next",
    duration: "Июнь–Август 2026 (3–4 мес.)",
    color: "text-blue-400",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/10",
    milestone: "Первые платящие пользователи",
    tasks: [
      "📱 Мобильная адаптация (PWA или React Native)",
      "💳 Полная интеграция Prodamus (реальные платежи)",
      "🔐 Production security (rate limiting, 2FA, ротация ключей)",
      "📊 Аналитика использования (Mixpanel/Amplitude)",
      "🌍 Onboarding flow для новых пользователей",
      "🎯 50+ платящих пользователей",
      "📝 Документация и помощь внутри продукта",
    ],
    investors: "Pre-seed ангел $50–150k",
    kpi: "$1000 MRR · 50 пользователей · NPS > 40",
  },
  {
    phase: "2 — Early Traction",
    status: "future",
    duration: "Сентябрь–Декабрь 2026 (4 мес.)",
    color: "text-purple-400",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-500/10",
    milestone: "$1M ARR путь",
    tasks: [
      "🔥 Growth hacking: партнёрства с инфлюенсерами ниши",
      "📣 Telegram каналы + YouTube продвижение",
      "🤝 Партнёрская программа (реферальные 30%)",
      "🌐 Английская версия (выход на глобальный рынок)",
      "🏆 500+ платящих пользователей",
      "📈 Кейсы клиентов → PR материалы",
    ],
    investors: "Seed round $300k–1M",
    kpi: "$10k MRR · 500 пользователей · Churn < 5%",
  },
  {
    phase: "3 — Scale",
    status: "future",
    duration: "2027 (весь год)",
    color: "text-amber-400",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/10",
    milestone: "$1M+ ARR",
    tasks: [
      "🤖 AI агенты следующего уровня (GPT-4o, Claude 4)",
      "🏢 Enterprise планы ($500–2000/мес)",
      "🌍 Локализация: Казахстан, Украина, Беларусь, Турция",
      "📊 Marketplace навыков и шаблонов",
      "👥 Команда: 5–10 человек",
      "🏆 5000+ пользователей",
    ],
    investors: "Series A $2–5M",
    kpi: "$83k MRR ($1M ARR) · 5000 пользователей",
  },
  {
    phase: "4 — Growth",
    status: "future",
    duration: "2028",
    color: "text-red-400",
    borderColor: "border-red-500/30",
    bgColor: "bg-red-500/10",
    milestone: "$10–100M ARR",
    tasks: [
      "🌐 Глобальный запуск (Азия, Латинская Америка)",
      "🤝 Стратегические партнёрства (Telegram, Google)",
      "🏭 White-label для агентств",
      "📊 IPO подготовка или стратегическое поглощение",
    ],
    investors: "Series B/C $10–50M",
    kpi: "$8M+ MRR · 50k+ пользователей",
  },
];

const REVENUE_MILESTONES = [
  { target: "$1M ARR", timeline: "12–18 мес (конец 2027)", users: "~500–1000 платящих", monthly: "$83k MRR", strategy: "Фокус на СНГ-рынок, партнёрства с коучами и экспертами" },
  { target: "$10M ARR", timeline: "3 года (2029)", users: "~5000–10000 платящих", monthly: "$833k MRR", strategy: "Глобальный запуск, Enterprise tier, партнёрская сеть" },
  { target: "$100M ARR", timeline: "5–6 лет (2031–2032)", users: "~50k–100k платящих", monthly: "$8.3M MRR", strategy: "Платформа-экосистема, marketplace, M&A" },
  { target: "$500M ARR", timeline: "7–8 лет (2033–2034)", users: "~250k+ платящих", monthly: "$41M MRR", strategy: "Доминирование в AI-автоматизации для авторской экономики" },
  { target: "$1B ARR", timeline: "10 лет (2036)", users: "~500k+ платящих", monthly: "$83M MRR", strategy: "IPO или стратегическое поглощение крупным игроком" },
];

const INVESTMENT_INFO = [
  {
    stage: "Pre-Seed / Angel",
    amount: "$25k–$500k",
    investor: "Бизнес-ангел (Angel Investor)",
    equity: "5–15%",
    when: "Прямо сейчас — стадия прототипа",
    where: "AngelList, Republic, Wefunder, LinkedIn, личная сеть, Hustle Fund ($25k–150k), Precursor Ventures",
    terms: "SAFE note (Y Combinator стандарт) с cap $5–8M — конвертируется в акции при следующем раунде. Самый мягкий инструмент.",
    color: "text-[#C8F135]",
    bestFor: true,
    warning: null,
  },
  {
    stage: "Seed Round",
    amount: "$1M–$3M",
    investor: "Micro-VC / Seed VC фонд",
    equity: "15–25%",
    when: "MVP готов, есть $5–50k MRR, доказан PMF",
    where: "Techstars, Backstage Capital, AIX Ventures, Conviction, Factorial Capital, локальные VC",
    terms: "Priced equity round (Series Seed). Оценка $5–15M pre-money. Delaware C-Corp обязателен.",
    color: "text-blue-400",
    bestFor: false,
    warning: null,
  },
  {
    stage: "Series A",
    amount: "$5M–$15M",
    investor: "Venture Capital (VC)",
    equity: "20–30%",
    when: "Product-market fit доказан, $100k+ MRR, чёткий growth path",
    where: "a16z, Sequoia, Battery Ventures, AI-фокус фонды",
    terms: "Прайсированный раунд. Полный due diligence. Входит в совет директоров. Оценка $20–60M.",
    color: "text-purple-400",
    bestFor: false,
    warning: null,
  },
];

export default function RoadmapPage() {
  const [tab, setTab] = useState<Tab>("competitors");

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            🗺️ Дорожная карта & Стратегия
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Конкурентный анализ · Go-to-Market · Инвестиции · Фазы роста
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {([
            ["competitors", "🏆 Конкуренты"],
            ["gtm", "🚀 Go-to-Market"],
            ["investment", "💰 Инвестиции"],
            ["phases", "📅 Фазы роста"],
            ["domain", "🌐 Домен & Vercel"],
          ] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === t
                  ? "bg-[#5c6af0] text-white"
                  : "bg-[#0d0d1c] text-white/40 hover:text-white border border-[#1e1e38]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* COMPETITORS */}
        {tab === "competitors" && (
          <div className="space-y-6">
            {/* Manual cost comparison */}
            <div className="bg-[#0d0d1c] border border-[#1e1e38] rounded-xl p-5">
              <h3 className="font-bold text-white mb-4">💸 Сколько стоит делать это руками</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1e1e38]">
                      <th className="text-left py-2 text-white/30 text-xs uppercase font-bold">Специалист</th>
                      <th className="text-right py-2 text-white/30 text-xs uppercase font-bold">В месяц</th>
                      <th className="text-right py-2 text-white/30 text-xs uppercase font-bold">В год</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MANUAL_COSTS.map((row) => (
                      <tr key={row.task} className={`border-b border-[#1e1e38]/50 ${row.highlight ? "bg-red-500/10" : row.isSolution ? "bg-[#C8F135]/10" : ""}`}>
                        <td className={`py-2 pr-4 text-sm ${row.highlight ? "font-bold text-red-300" : row.isSolution ? "font-bold text-[#C8F135]" : "text-white/60"}`}>
                          {row.task}
                        </td>
                        <td className={`py-2 text-right font-mono text-sm ${row.highlight ? "text-red-400 font-bold" : row.isSolution ? "text-[#C8F135] font-bold" : "text-white/60"}`}>
                          {row.monthly}
                        </td>
                        <td className={`py-2 text-right font-mono text-sm ${row.highlight ? "text-red-400 font-bold" : row.isSolution ? "text-[#C8F135] font-bold" : "text-white/60"}`}>
                          {row.annual}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-xs text-white/30">
                ContentOS заменяет команду из 6 человек стоимостью $43k–89k/год всего за $564–2364/год
              </div>
            </div>

            {/* Competitor table */}
            <h3 className="font-bold text-white text-lg">📊 Топ-10 конкурентов на рынке</h3>
            <div className="space-y-3">
              {COMPETITORS.sort((a, b) => b.score - a.score).map((c) => (
                <div key={c.name} className={`bg-[#0d0d1c] border rounded-xl p-4 ${c.isUs ? "border-[#C8F135]/40" : "border-[#1e1e38]"}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{c.logo}</span>
                      <div>
                        <div className={`font-bold text-sm ${c.isUs ? "text-[#C8F135]" : "text-white"}`}>{c.name}</div>
                        <div className="text-white/30 text-xs">{c.category} · {c.target}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${c.score >= 9 ? "text-[#C8F135]" : c.score >= 7 ? "text-green-400" : "text-white/50"}`}>
                        {c.score}/10
                      </div>
                      <div className="text-white/30 text-xs">{c.price}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-white/30 mb-1 uppercase font-bold tracking-wider text-[10px]">Есть</div>
                      {c.features.slice(0, 4).map((f) => (
                        <div key={f} className="text-green-400/70 flex gap-1"><span>✓</span>{f}</div>
                      ))}
                    </div>
                    <div>
                      <div className="text-white/30 mb-1 uppercase font-bold tracking-wider text-[10px]">Нет</div>
                      {c.missing.map((f) => (
                        <div key={f} className="text-red-400/60 flex gap-1"><span>✗</span>{f}</div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-white/25">🔐 Безопасность: {c.apiSecurity}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GO-TO-MARKET */}
        {tab === "gtm" && (
          <div className="space-y-5">
            <div className="bg-[#0d0d1c] border border-[#1e1e38] rounded-xl p-5">
              <h3 className="font-bold text-white mb-4">🎯 Целевой рынок</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "TAM (весь рынок)", value: "$847B", sub: "Глобальный AI SaaS 2026" },
                  { label: "SAM (доступный)", value: "$12B", sub: "AI-автоматизация для авторов" },
                  { label: "SOM (реалистичный)", value: "$150M", sub: "СНГ + диаспора эксперты" },
                ].map((m) => (
                  <div key={m.label} className="bg-[#111120] rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-[#C8F135]">{m.value}</div>
                    <div className="text-white/60 text-xs font-bold mt-1">{m.label}</div>
                    <div className="text-white/25 text-[10px]">{m.sub}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm text-white/60">
                <p>🎯 <strong className="text-white">ICP (Ideal Customer Profile):</strong> Эксперт/коуч/онлайн-школа, $1k–10k/мес доход, активен в Instagram/Telegram, хочет автоматизировать маркетинг, не умеет в код</p>
                <p>📍 <strong className="text-white">География (фаза 1):</strong> Россия, Казахстан, Украина, Беларусь, Узбекистан + русскоязычная диаспора (США, ЕС, ОАЭ)</p>
              </div>
            </div>

            <div className="bg-[#0d0d1c] border border-[#1e1e38] rounded-xl p-5">
              <h3 className="font-bold text-white mb-4">📣 Каналы привлечения (приоритет)</h3>
              <div className="space-y-3">
                {[
                  { channel: "Telegram-каналы (свой + гостевые посты)", roi: "Очень высокий", cost: "$0–500/мес", how: "Публикуй кейсы с цифрами результатов клиентов. Цель: 10k подписчиков за 3 мес." },
                  { channel: "Зарина как личный бренд / продажа через себя", roi: "Высокий", cost: "$0", how: "Сторителлинг: 'Как я автоматизировала свой бизнес за 30 дней'. Reels, YouTube Shorts." },
                  { channel: "Партнёрская программа (30% реферальные)", roi: "Высокий", cost: "% от выручки", how: "Дай другим экспертам зарабатывать на рекомендации ContentOS. Tracked link в боте." },
                  { channel: "Cold outreach в Instagram/Telegram", roi: "Средний", cost: "$200–500/мес", how: "Парсинг аудитории конкурентов → AI-рассылка (workflow 01 и 15 уже готовы!)" },
                  { channel: "Контент-маркетинг (YouTube + статьи)", roi: "Долгосрочный", cost: "$0–200/мес", how: "\"Как я сэкономила $5000/мес с ContentOS\" — SEO + вирусность." },
                  { channel: "Таргетированная реклама (Meta Ads)", roi: "Средний", cost: "$500–2000/мес", how: "Запускать после MVP. ROI окупается при $50+ CAC и LTV > $500." },
                ].map((c) => (
                  <div key={c.channel} className="bg-[#111120] rounded-xl p-4">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div className="font-bold text-white text-sm">{c.channel}</div>
                      <div className="text-right shrink-0">
                        <div className="text-[#C8F135] text-xs font-bold">{c.roi}</div>
                        <div className="text-white/30 text-[10px]">{c.cost}</div>
                      </div>
                    </div>
                    <div className="text-white/50 text-xs">{c.how}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0d0d1c] border border-[#1e1e38] rounded-xl p-5">
              <h3 className="font-bold text-white mb-4">💰 Путь к выручке</h3>
              <div className="space-y-3">
                {REVENUE_MILESTONES.map((m) => (
                  <div key={m.target} className="flex gap-4 items-start">
                    <div className="w-24 shrink-0 font-bold text-[#C8F135] text-sm">{m.target}</div>
                    <div className="flex-1">
                      <div className="flex gap-3 text-xs text-white/40 mb-1">
                        <span>📅 {m.timeline}</span>
                        <span>👥 {m.users}</span>
                        <span>📈 {m.monthly}</span>
                      </div>
                      <div className="text-white/60 text-xs">{m.strategy}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* INVESTMENT */}
        {tab === "investment" && (
          <div className="space-y-5">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-2">
              <div className="font-bold text-amber-300 mb-1">📍 Ты сейчас: Прототип → Pre-Seed</div>
              <div className="text-white/60 text-sm">Собственные инвестиции $70k вложено. Следующий шаг — бизнес-ангел на $50–150k для запуска MVP и первых продаж.</div>
            </div>

            {INVESTMENT_INFO.map((inv) => (
              <div key={inv.stage} className={`bg-[#0d0d1c] border rounded-xl p-5 ${inv.bestFor ? "border-[#C8F135]/40" : "border-[#1e1e38]"}`}>
                {inv.bestFor && (
                  <div className="inline-block bg-[#C8F135]/20 text-[#C8F135] text-[10px] font-bold px-2 py-0.5 rounded-full mb-3 uppercase tracking-wider">
                    ⭐ Рекомендую сейчас
                  </div>
                )}
                <div className="flex justify-between items-start mb-3">
                  <h3 className={`font-bold text-lg ${inv.color}`}>{inv.stage}</h3>
                  <div className="text-right">
                    <div className="text-white font-bold">{inv.amount}</div>
                    <div className="text-white/40 text-xs">Dilution: {inv.equity}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div><span className="text-white/30 text-xs">Когда:</span> <div className="text-white/70">{inv.when}</div></div>
                  <div><span className="text-white/30 text-xs">Условия:</span> <div className="text-white/70">{inv.terms}</div></div>
                </div>
                <div><span className="text-white/30 text-xs">Где искать:</span> <div className="text-white/70 text-sm">{inv.where}</div></div>
              </div>
            ))}

            <div className="bg-[#0d0d1c] border border-[#1e1e38] rounded-xl p-5">
              <h3 className="font-bold text-white mb-4">📋 На что просить деньги (Pre-Seed $100k)</h3>
              <div className="space-y-2">
                {[
                  { item: "Разработка MVP (мобильная версия, onboarding)", amount: "$30k", pct: "30%" },
                  { item: "Маркетинг и привлечение первых 100 пользователей", amount: "$25k", pct: "25%" },
                  { item: "Инфраструктура (серверы, API costs, домен/хостинг)", amount: "$15k", pct: "15%" },
                  { item: "Юридические расходы (US LLC поддержка, договоры)", amount: "$10k", pct: "10%" },
                  { item: "Резерв / непредвиденное", amount: "$20k", pct: "20%" },
                ].map((r) => (
                  <div key={r.item} className="flex justify-between items-center py-2 border-b border-[#1e1e38]/50 text-sm">
                    <span className="text-white/60">{r.item}</span>
                    <div className="text-right">
                      <span className="text-white font-bold">{r.amount}</span>
                      <span className="text-white/30 ml-2">{r.pct}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0d0d1c] border border-[#1e1e38] rounded-xl p-5">
              <h3 className="font-bold text-white mb-4">🏢 US LLC в Лос-Анджелесе — преимущества для инвестора</h3>
              <div className="space-y-2 text-sm text-white/60">
                <p>✅ <strong className="text-white">California LLC</strong> — признана всеми глобальными инвесторами</p>
                <p>✅ Можно принимать инвестиции через <strong className="text-white">SAFE (Simple Agreement for Future Equity)</strong> — стандарт Y Combinator</p>
                <p>✅ Stripe Atlas / Mercury Bank — открытие счёта для стартапа онлайн</p>
                <p>✅ AngelList, Republic, Wefunder — краудфандинг для US-компаний</p>
                <p>⚠️ Убедись что у тебя <strong className="text-white">EIN (Employer ID Number)</strong> — нужен для инвестиционных сделок</p>
                <p>💡 <strong className="text-white">Совет:</strong> Конвертируй LLC в C-Corp (Delaware) перед раундом Seed — большинство US VC требует C-Corp</p>
              </div>
            </div>
          </div>
        )}

        {/* PHASES */}
        {tab === "phases" && (
          <div className="space-y-4">
            {PHASES.map((phase) => (
              <div key={phase.phase} className={`border ${phase.borderColor} rounded-xl overflow-hidden`}>
                <div className={`${phase.bgColor} px-5 py-3 flex justify-between items-center`}>
                  <div>
                    <div className={`font-bold text-lg ${phase.color}`}>{phase.phase}</div>
                    <div className="text-white/40 text-xs">{phase.duration}</div>
                  </div>
                  {phase.status === "current" && (
                    <span className="bg-[#C8F135]/20 text-[#C8F135] text-xs font-bold px-3 py-1 rounded-full border border-[#C8F135]/30">
                      📍 СЕЙЧАС
                    </span>
                  )}
                </div>
                <div className="bg-[#0d0d1c] p-5">
                  <div className="font-bold text-white mb-3">{phase.milestone}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-white/30 text-[10px] uppercase font-bold tracking-wider mb-2">Задачи</div>
                      <div className="space-y-1">
                        {phase.tasks.map((t) => (
                          <div key={t} className="text-white/60 text-xs">{t}</div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-white/30 text-[10px] uppercase font-bold tracking-wider mb-1">Финансирование</div>
                        <div className="text-white/70 text-sm">{phase.investors}</div>
                      </div>
                      <div>
                        <div className="text-white/30 text-[10px] uppercase font-bold tracking-wider mb-1">KPI для перехода</div>
                        <div className={`font-bold text-sm ${phase.color}`}>{phase.kpi}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DOMAIN */}
        {tab === "domain" && (
          <div className="space-y-5">
            <div className="bg-[#0d0d1c] border border-[#C8F135]/30 rounded-xl p-5">
              <h3 className="font-bold text-[#C8F135] mb-4">🌐 Подключение домена к Vercel</h3>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                <div className="font-bold text-green-400 mb-1">✅ Да, домен подключается к Vercel БЕСПЛАТНО</div>
                <div className="text-white/60 text-sm">Vercel не берёт плату за кастомный домен. Платишь только регистратору за сам домен ($10–15/год).</div>
              </div>
              <div className="space-y-3">
                {[
                  { step: "1", title: "Vercel Dashboard → твой проект → Settings → Domains", desc: "Нажми \"Add Domain\", введи твой домен (например, amaimedia.com)" },
                  { step: "2", title: "Скопируй DNS записи от Vercel", desc: "Vercel даст тебе A-record (76.76.21.21) или CNAME (cname.vercel-dns.com)" },
                  { step: "3", title: "Открой панель регистратора домена", desc: "GoDaddy / Namecheap / Google Domains / Cloudflare → DNS Management" },
                  { step: "4", title: "Добавь DNS записи", desc: "A record: @ → 76.76.21.21 | CNAME: www → cname.vercel-dns.com" },
                  { step: "5", title: "Жди 5–48 часов", desc: "DNS распространяется по всему миру. Vercel автоматически выпустит SSL сертификат (HTTPS бесплатно через Let's Encrypt)" },
                ].map((s) => (
                  <div key={s.step} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#5c6af0]/20 text-[#818cf8] font-bold flex items-center justify-center shrink-0 text-sm">
                      {s.step}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{s.title}</div>
                      <div className="text-white/50 text-xs mt-0.5">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0d0d1c] border border-[#1e1e38] rounded-xl p-5">
              <h3 className="font-bold text-white mb-4">💡 Рекомендации по домену</h3>
              <div className="space-y-2 text-sm text-white/60">
                <p>🌐 <strong className="text-white">Главный домен:</strong> amaimedia.com или contentos.ai — короткий, запоминаемый</p>
                <p>📧 <strong className="text-white">Бизнес email:</strong> подключи Google Workspace ($6/мес) для @amaimedia.com почты — выглядит профессионально для инвесторов</p>
                <p>🔒 <strong className="text-white">SSL:</strong> Vercel выдаёт автоматически — бесплатно</p>
                <p>⚡ <strong className="text-white">CDN:</strong> Vercel Edge Network — 100+ PoP по всему миру, автоматически</p>
                <p>📊 <strong className="text-white">Analytics:</strong> Vercel Analytics (бесплатный tier) — реальные посещения без GDPR проблем</p>
              </div>
            </div>

            <div className="bg-[#0d0d1c] border border-[#1e1e38] rounded-xl p-5">
              <h3 className="font-bold text-white mb-3">💳 Тарифы Vercel</h3>
              <div className="space-y-2">
                {[
                  { plan: "Hobby (текущий)", price: "Бесплатно", limits: "100GB bandwidth, 1 team member, custom domain ✅", ok: true },
                  { plan: "Pro", price: "$20/мес", limits: "1TB bandwidth, команда, analytics, более быстрые билды", ok: false },
                  { plan: "Enterprise", price: "От $400/мес", limits: "SLA 99.99%, SSO, advanced security", ok: false },
                ].map((p) => (
                  <div key={p.plan} className={`p-3 rounded-lg border ${p.ok ? "border-[#C8F135]/30 bg-[#C8F135]/5" : "border-[#1e1e38]"} flex justify-between items-start`}>
                    <div>
                      <div className={`font-bold text-sm ${p.ok ? "text-[#C8F135]" : "text-white"}`}>{p.plan}</div>
                      <div className="text-white/40 text-xs">{p.limits}</div>
                    </div>
                    <div className="font-bold text-white text-sm shrink-0">{p.price}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-white/30">
                💡 Hobby достаточно для прототипа и раннего MVP. Переходи на Pro когда трафик превысит 100GB/мес.
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
