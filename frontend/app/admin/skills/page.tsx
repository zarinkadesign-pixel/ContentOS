/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/skills/page.tsx
 */
"use client";

import { useState } from "react";
import AdminLayout from "../_components/AdminLayout";

const OFFICIAL_SKILLS = [
  {
    category: "📄 Документы",
    items: [
      { name: "docx", desc: "Создание, редактирование и анализ Word-документов с поддержкой отслеживаемых изменений, комментариев и форматирования", href: "https://github.com/anthropics/skills/tree/main/skills/docx", badge: "official" },
      { name: "pdf",  desc: "Комплексный инструментарий для работы с PDF: извлечение текста и таблиц, создание, объединение/разбиение документов, формы", href: "https://github.com/anthropics/skills/tree/main/skills/pdf", badge: "official" },
      { name: "pptx", desc: "Создание, редактирование и анализ презентаций PowerPoint с поддержкой макетов, шаблонов, диаграмм и автогенерации слайдов", href: "https://github.com/anthropics/skills/tree/main/skills/pptx", badge: "official" },
      { name: "xlsx", desc: "Создание, редактирование и анализ Excel-таблиц с поддержкой формул, форматирования, анализа данных и визуализации", href: "https://github.com/anthropics/skills/tree/main/skills/xlsx", badge: "official" },
    ],
  },
  {
    category: "🎨 Дизайн и творчество",
    items: [
      { name: "algorithmic-art",  desc: "Генеративное искусство на p5.js с сидированной случайностью, полями потоков и системами частиц", href: "https://github.com/anthropics/skills/tree/main/skills/algorithmic-art", badge: "official" },
      { name: "canvas-design",    desc: "Дизайн визуального искусства в форматах .png и .pdf с использованием принципов дизайна", href: "https://github.com/anthropics/skills/tree/main/skills/canvas-design", badge: "official" },
      { name: "slack-gif-creator",desc: "Создание анимированных GIF, оптимизированных под ограничения размера Slack", href: "https://github.com/anthropics/skills/tree/main/skills/slack-gif-creator", badge: "official" },
    ],
  },
  {
    category: "💻 Разработка",
    items: [
      { name: "frontend-design",      desc: "Инструктирует Claude избегать «AI-шаблонности» и принимать смелые дизайн-решения. Отлично работает с React и Tailwind", href: "https://github.com/anthropics/skills/blob/main/skills/frontend-design", badge: "official" },
      { name: "web-artifacts-builder",desc: "Создание сложных HTML-артефактов на claude.ai с использованием React, Tailwind CSS и shadcn/ui", href: "https://github.com/anthropics/skills/tree/main/skills/web-artifacts-builder", badge: "official" },
      { name: "mcp-builder",          desc: "Руководство по созданию высококачественных MCP-серверов для интеграции внешних API и сервисов", href: "https://github.com/anthropics/skills/tree/main/skills/mcp-builder", badge: "official" },
      { name: "webapp-testing",       desc: "Тестирование локальных веб-приложений с помощью Playwright для верификации UI и отладки", href: "https://github.com/anthropics/skills/tree/main/skills/webapp-testing", badge: "official" },
    ],
  },
  {
    category: "📢 Коммуникации",
    items: [
      { name: "brand-guidelines", desc: "Применение официальных фирменных цветов и типографики Anthropic к артефактам", href: "https://github.com/anthropics/skills/tree/main/skills/brand-guidelines", badge: "official" },
      { name: "internal-comms",   desc: "Написание внутренних коммуникаций: статус-отчёты, рассылки, FAQ", href: "https://github.com/anthropics/skills/tree/main/skills/internal-comms", badge: "official" },
    ],
  },
  {
    category: "⚙️ Создание навыков",
    items: [
      { name: "skill-creator", desc: "Интерактивный инструмент для создания навыков — проводит через процесс построения новых навыков с помощью Q&A", href: "https://github.com/anthropics/skills/tree/main/skills/skill-creator", badge: "official" },
    ],
  },
];

const COMMUNITY_SKILLS = [
  { name: "obra/superpowers",          desc: "Библиотека 20+ battle-tested навыков: TDD, отладка, паттерны командной работы. Включает /brainstorm, /write-plan, /execute-plan", href: "https://github.com/obra/superpowers", badge: "community" },
  { name: "ios-simulator-skill",       desc: "Создание, навигация и тестирование iOS-приложений через автоматизацию", href: "https://github.com/conorluddy/ios-simulator-skill", badge: "community" },
  { name: "ffuf-web-fuzzing",          desc: "Экспертное руководство по веб-фаззингу с ffuf при пентесте, включая аутентифицированный фаззинг и анализ результатов", href: "https://github.com/jthack/ffuf_claude_skill", badge: "community" },
  { name: "playwright-skill",          desc: "Универсальная автоматизация браузера с Playwright", href: "https://github.com/lackeyjb/playwright-skill", badge: "community" },
  { name: "claude-d3js-skill",         desc: "Визуализации на d3.js", href: "https://github.com/chrisvoncsefalvay/claude-d3js-skill", badge: "community" },
  { name: "claude-scientific-skills",  desc: "Коллекция научных навыков: работа со специализированными библиотеками и базами данных", href: "https://github.com/K-Dense-AI/claude-scientific-skills", badge: "community" },
  { name: "web-asset-generator",       desc: "Генерация веб-ресурсов: фавиконы, иконки приложений, изображения для соцсетей", href: "https://github.com/alonw0/web-asset-generator", badge: "community" },
  { name: "loki-mode",                 desc: "Мультиагентная автономная система для стартапа — оркестрирует 37 AI-агентов в 6 роях от PRD до выручки", href: "https://github.com/asklokesh/claudeskill-loki-mode", badge: "community" },
  { name: "Trail of Bits Security",    desc: "Навыки безопасности: статический анализ с CodeQL/Semgrep, аудит кода и обнаружение уязвимостей", href: "https://github.com/trailofbits/skills", badge: "community" },
  { name: "frontend-slides",           desc: "Создание HTML-презентаций с богатой анимацией — с нуля или из PowerPoint-файлов", href: "https://github.com/zarazhangrui/frontend-slides", badge: "community" },
  { name: "Expo Skills",               desc: "Официальные навыки от команды Expo для разработки Expo-приложений", href: "https://github.com/expo/skills", badge: "community" },
  { name: "shadcn/ui",                 desc: "Даёт Claude Code контекст о shadcn-компонентах и паттернах применения", href: "https://ui.shadcn.com/docs/skills", badge: "community" },
];

const INSTALL_STEPS = [
  { step: "1", text: "Открой Claude.ai → Настройки → Возможности" },
  { step: "2", text: "Включи переключатель Skills" },
  { step: "3", text: "Просмотри доступные навыки или загрузи свои" },
  { step: "4", text: "Для Team/Enterprise: администратор должен включить Skills на уровне организации" },
];

type Tab = "official" | "community" | "howto";

export default function SkillsPage() {
  const [tab, setTab] = useState<Tab>("official");
  const [search, setSearch] = useState("");

  const filtered = (items: typeof COMMUNITY_SKILLS) =>
    items.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.desc.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            🧩 Claude Skills
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Навыки обучают Claude выполнять задачи воспроизводимым способом · Awesome Claude Skills
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Официальных", value: OFFICIAL_SKILLS.reduce((a, c) => a + c.items.length, 0), color: "text-blue-400" },
            { label: "Сообщество", value: COMMUNITY_SKILLS.length, color: "text-purple-400" },
            { label: "Всего", value: OFFICIAL_SKILLS.reduce((a, c) => a + c.items.length, 0) + COMMUNITY_SKILLS.length, color: "text-[#C8F135]" },
          ].map((s) => (
            <div key={s.label} className="bg-[#0d0d1c] border border-[#1e1e38] rounded-xl p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-white/40 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {(["official", "community", "howto"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === t
                  ? "bg-[#5c6af0] text-white"
                  : "bg-[#0d0d1c] text-white/40 hover:text-white border border-[#1e1e38]"
              }`}
            >
              {t === "official" ? "🎯 Официальные" : t === "community" ? "🌟 Сообщество" : "📖 Как установить"}
            </button>
          ))}
        </div>

        {/* Search */}
        {tab !== "howto" && (
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск навыков..."
            className="w-full bg-[#0d0d1c] border border-[#1e1e38] rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#5c6af0] mb-5"
          />
        )}

        {/* Official Skills */}
        {tab === "official" && (
          <div className="space-y-6">
            {OFFICIAL_SKILLS.map((section) => {
              const items = filtered(section.items);
              if (!items.length) return null;
              return (
                <div key={section.category}>
                  <div className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">
                    {section.category}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((skill) => (
                      <a
                        key={skill.name}
                        href={skill.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-[#0d0d1c] border border-[#1e1e38] rounded-xl p-4 hover:border-[#5c6af0]/50 hover:bg-[#0d0d1c]/80 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="font-bold text-white text-sm font-mono group-hover:text-[#818cf8] transition-colors">
                            {skill.name}
                          </div>
                          <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            official
                          </span>
                        </div>
                        <p className="text-white/40 text-xs leading-relaxed">{skill.desc}</p>
                        <div className="mt-3 text-[10px] text-[#5c6af0]/60 group-hover:text-[#5c6af0] transition-colors">
                          github.com/anthropics/skills →
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Community Skills */}
        {tab === "community" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered(COMMUNITY_SKILLS).map((skill) => (
              <a
                key={skill.name}
                href={skill.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-[#0d0d1c] border border-[#1e1e38] rounded-xl p-4 hover:border-purple-500/50 transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="font-bold text-white text-sm font-mono group-hover:text-purple-400 transition-colors">
                    {skill.name}
                  </div>
                  <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    community
                  </span>
                </div>
                <p className="text-white/40 text-xs leading-relaxed">{skill.desc}</p>
              </a>
            ))}
          </div>
        )}

        {/* How to Install */}
        {tab === "howto" && (
          <div className="space-y-4">
            <div className="bg-[#0d0d1c] border border-[#1e1e38] rounded-xl p-5">
              <h3 className="font-bold text-white mb-4">🌐 Claude.ai Web Interface</h3>
              <div className="space-y-3">
                {INSTALL_STEPS.map((s) => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#5c6af0]/20 text-[#818cf8] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {s.step}
                    </div>
                    <p className="text-white/60 text-sm">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0d0d1c] border border-[#1e1e38] rounded-xl p-5">
              <h3 className="font-bold text-white mb-4">💻 Claude Code CLI</h3>
              <div className="space-y-3">
                <div className="bg-black/40 rounded-lg p-3 font-mono text-xs text-[#C8F135]">
                  # Установить из маркетплейса{"\n"}
                  /plugin marketplace add anthropics/skills{"\n\n"}
                  # Установить из локальной папки{"\n"}
                  /plugin add /path/to/skill-directory
                </div>
              </div>
            </div>

            <div className="bg-[#0d0d1c] border border-[#1e1e38] rounded-xl p-5">
              <h3 className="font-bold text-white mb-4">⚡ Сравнение подходов</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-white/60">
                  <thead>
                    <tr className="border-b border-[#1e1e38]">
                      <th className="text-left py-2 pr-4 text-white/30 font-semibold uppercase tracking-wider">Инструмент</th>
                      <th className="text-left py-2 text-white/30 font-semibold uppercase tracking-wider">Лучше всего для</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-1">
                    {[
                      ["Skills",     "Переиспользуемые знания между разговорами"],
                      ["Prompts",    "Разовые инструкции и моментальный контекст"],
                      ["Projects",   "Постоянные фоновые знания в рабочих пространствах"],
                      ["Subagents",  "Независимое выполнение задач с отдельными правами"],
                      ["MCP",        "Подключение Claude к внешним источникам данных"],
                    ].map(([tool, desc]) => (
                      <tr key={tool} className="border-b border-[#1e1e38]/50">
                        <td className="py-2 pr-4 font-mono text-[#818cf8] font-bold">{tool}</td>
                        <td className="py-2">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-[#0d0d1c] border border-[#1e1e38] rounded-xl p-5">
              <h3 className="font-bold text-white mb-3">🔗 Полезные ссылки</h3>
              <div className="space-y-2">
                {[
                  ["Официальный репозиторий Skills", "https://github.com/anthropics/skills"],
                  ["Документация Skills", "https://docs.claude.com/"],
                  ["Awesome Claude Skills (GitHub)", "https://github.com/travisvn/awesome-claude-skills"],
                  ["Claude Skills API", "https://platform.claude.com/docs/en/api/beta/skills"],
                ].map(([label, url]) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[#5c6af0] hover:text-[#818cf8] transition-colors"
                  >
                    <span className="text-white/20">→</span> {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
