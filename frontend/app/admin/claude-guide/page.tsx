/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/claude-guide/page.tsx
 *
 * Claude Knowledge Base: Carousel Creator + 60 Interactive Prompts
 */
"use client";

import { useState, useRef } from "react";

// ─────────────────────────────────────────────────────────── TYPES ──
interface SlideData {
  index: number;
  type: "hook" | "content" | "cta";
  emoji: string;
  headline: string;
  subtext?: string;
  points?: string[];
  cta?: string | null;
}
interface CarouselResult {
  title: string;
  slides: SlideData[];
  hashtags: string[];
  theme: string;
  brand: string;
}

// ──────────────────────────────────────────────── 60 PROMPTS DATA ──
const PROMPT_CATEGORIES = [
  {
    id: "writing", icon: "✍️", title: "Написание как человек", color: "#6366f1",
    prompts: [
      { id: "w1", text: "Проанализируй 5 моих текстов. Извлеки мой голос — структуры предложений, выбор слов, ритм, личность. Оформи как многоразовую Карточку Голоса: [ПРИМЕРЫ_ТЕКСТОВ]. Включи список dos/don'ts, сравнение «звучит как я» vs «не звучит как я» и 3 примера предложений в моём стиле." },
      { id: "w2", text: "Перепиши этот текст, сгенерированный ИИ, чтобы он звучал естественно. Убери слова-паразиты, варьируй длину предложений, добавь сокращения, используй конкретные детали: [ТЕКСТ]. Выдели каждое изменение и объясни почему." },
      { id: "w3", text: "Напиши тред в Twitter о [ТЕМЕ] в моём стиле. Правила: без «delve», без «it's worth noting», без «game-changer». Начинай предложения с «И», «Но», «Так». Включи крючок-твит, самостоятельный твит для ретвита и CTA в конце." },
      { id: "w4", text: "Преврати этот список функций продукта в текст, ориентированный на выгоды: [ФУНКЦИИ]. Используй конкретные сценарии до/после для каждой выгоды. Покажи жизнь пользователя без продукта и с ним." },
      { id: "w5", text: "Напиши личную историю о [СОБЫТИИ] для LinkedIn. Структура: крючок, напряжение, урок, практический вывод. До 200 слов. Сделай первую строку такой, что невозможно прокрутить мимо." },
      { id: "w6", text: "Создай руководство по голосу бренда для [БРЕНДА]. Определи: тон, черты личности, слова которые мы используем и слова которые никогда не используем, примеры предложений для каждого контекста. Включи голосовые примеры для 5 сценариев." },
    ],
  },
  {
    id: "content", icon: "📅", title: "Контент Стратегия", color: "#8b5cf6",
    prompts: [
      { id: "c1", text: "Действуй как контент-стратег. Создай контент-календарь на 30 дней для [НИША], нацеленный на [АУДИТОРИЯ]. Включи крючки, форматы, время публикаций, оптимальные платформы, 3-4 контентных столпа для ротации и еженедельные цели вовлечённости." },
      { id: "c2", text: "Преврати этот пост в блоге в 5 тредов Twitter, 3 поста LinkedIn и 10 подписей Instagram. Подстрой тон под каждую платформу, добавь крючок для каждого материала: [КОНТЕНТ]" },
      { id: "c3", text: "Сгенерируй 20 цепляющих крючков для [ТЕМЫ], используя техники: пробел любопытства, смелое заявление, статистика, открытие историей, провокационная точка зрения. Оцени каждый от 1 до 10." },
      { id: "c4", text: "Проанализируй мои 10 лучших постов. Определи паттерны в крючках, длине, формате и теме. Дай воспроизводимую формулу и отметь, чего избегать: [ПОСТЫ]" },
      { id: "c5", text: "Напиши структуру сценария YouTube для «[ТЕМЫ]», которая удерживает просмотр выше 60%. Включи прерывания паттернов каждые 90 секунд, предложения b-roll, 3 концепции миниатюр и 5 вариантов заголовков для A/B-теста." },
      { id: "c6", text: "Создай 10 идей для разоблачения мифов для [НИШИ], которые бросают вызов общепринятым убеждениям и провоцируют дискуссию в комментариях. Для каждой включи общепринятое убеждение рядом с твоей контрарной точкой зрения." },
    ],
  },
  {
    id: "seo", icon: "🔍", title: "SEO & Рост", color: "#06b6d4",
    prompts: [
      { id: "s1", text: "Создай подробный контент-бриф для ключевого слова «[КЛЮЧЕВОЕ_СЛОВО]». Включи: поисковое намерение, количество слов, структуру H2/H3, конкурентные пробелы, мета-описание, внутренние ссылки, стратегию featured snippet и рекомендации по разметке schema." },
      { id: "s2", text: "Проанализируй 5 страниц конкурентов, ранжирующихся по [КЛЮЧЕВОМУ_СЛОВУ]. Выяви пробелы в контенте, которые можно использовать чтобы обойти их. Сравни количество слов, потенциал бэклинков, свежесть контента: [URLS]" },
      { id: "s3", text: "Создай стратегию программного SEO, которая генерирует 100+ страниц из [ИСТОЧНИКА_ДАННЫХ]. Включи структуру URL, шаблон, план внутренних ссылок, оптимизацию краулингового бюджета и пороги уникальности контента." },
      { id: "s4", text: "Напиши лендинг, который ранжируется по «[КЛЮЧЕВОМУ_СЛОВУ]» И конвертирует на 5%+. Включи текст выше сгиба, секции с социальными доказательствами, FAQ schema, стратегию размещения CTA и сигналы доверия." },
      { id: "s5", text: "Проведи аудит структуры моего сайта на SEO-проблемы. Проверь: индексируемость, внутренние ссылки, осиротевшие страницы, каннибализацию ключевых слов, Core Web Vitals. Предоставь приоритизированный список исправлений: [URL]" },
      { id: "s6", text: "Построй карту тематического авторитета для [НИШИ]. Сгруппируй 50 ключевых слов в кластеры с основными страницами и вспомогательными статьями. Включи объём поиска, оценки сложности и 6-месячный план публикаций." },
    ],
  },
  {
    id: "saas", icon: "🚀", title: "SaaS Разработка", color: "#10b981",
    prompts: [
      { id: "sa1", text: "Проверь эту SaaS-идею с анализом первых принципов. Размер рынка, конкуренция, защищённость и вердикт «строить/не строить». Включи стратегию распространения, MVP-объём с таймлайном и 3 самых рискованных предположения: [ИДЕЯ]" },
      { id: "sa2", text: "Разработай страницу цен с 3 тарифами для [ПРОДУКТА]. Включи стратегию разграничения функций, психологию якорного ценообразования и рекомендуемый тариф «самый популярный». Добавь переключатель годовой/месячной оплаты." },
      { id: "sa3", text: "Напиши письма для онбординга (День 0, 1, 3, 7, 14) для [ПРОДУКТА], которые снижают отток и стимулируют активацию. Включи строки темы, оптимальное время отправки и поведенческий триггер. Целевая метрика: [ЦЕЛЬ]." },
      { id: "sa4", text: "Создай полный план интеграции Stripe для [ПРОДУКТА]: поток оплаты, обработка webhook, жизненный цикл подписки и стратегия dunning. Включи расписание повторных попыток при неудачных платежах и логику пропорционального расчёта." },
      { id: "sa5", text: "Создай чеклист запуска продукта с 40 пунктами: предзапуск (buzz), день запуска (дистрибуция) и постзапуск (удержание). Включи конкретные каналы для публикации, email-последовательности и метрики успеха." },
      { id: "sa6", text: "Проанализируй мои данные об оттоке и предложи 5 мер по снижению месячного оттока с [X]% до [Y]%. Включи email-последовательности для возврата, оптимизацию потока отмены и ранние сигналы предупреждения: [КОНТЕКСТ]" },
    ],
  },
  {
    id: "marketing", icon: "🎯", title: "Маркетинг & Продажи", color: "#f59e0b",
    prompts: [
      { id: "m1", text: "Сгенерируй 10 идей лид-магнитов для [НИША], которые естественно направляют к покупке [ПРОДУКТА]. Каждый должен занимать менее 2 часов на создание. Ранжируй по потенциалу конверсии, включи тип формата и однострочный крючок." },
      { id: "m2", text: "Напиши cold email-последовательность (3 письма) для [ПРОДУКТА], нацеленную на [АУДИТОРИЮ]. Используй фреймворк PAS. Включи строки темы с потенциалом открываемости 40%+. Добавь время отправки и скрипт голосового сообщения." },
      { id: "m3", text: "Перечисли 15 возражений, которые возникают у людей перед покупкой [ПРОДУКТА]. Для каждого напиши однострочный контраргумент. Категоризируй по типу (цена, доверие, время, конкуренция) и предложи где разместить на лендинге." },
      { id: "m4", text: "Создай стратегию вирусного роста для [ПРОДУКТА]. Как каждый пользователь может привлечь 1,5 новых пользователя через сам продукт? Включи точку запуска реферала, структуру стимулов и реалистичный прогноз K-фактора." },
      { id: "m5", text: "Напиши 5 заголовков лендинга для [ПРОДУКТА], используя фреймворки: AIDA, PAS, До/После, Социальное доказательство, Срочность. Включи соответствующие подзаголовки и текст CTA-кнопки для каждого." },
      { id: "m6", text: "Разработай реферальную программу для [ПРОДУКТА] со структурой стимулов, планом отслеживания и email-шаблонами для реферреров. Включи многоуровневые вознаграждения, milestone-бейджи и прогнозируемый ROI на реферал." },
    ],
  },
  {
    id: "code", icon: "💻", title: "Claude Code & CLI", color: "#6366f1",
    prompts: [
      { id: "cc1", text: "Действуй как старший архитектор. Просмотри весь мой codebase и создай файл CLAUDE.md со стандартами кодирования, структурой проекта, соглашениями по именованию и контекстом технического стека, чтобы будущие сессии Claude были в 10 раз эффективнее." },
      { id: "cc2", text: "Сделай git diff и притворись старшим разработчиком, которому НЕНАВИДИТ эту реализацию. Разнеси её по кусочкам — что ты бы критиковал, рефакторил или отклонил на code review? Включи: [КОД_ИЛИ_DIFF]" },
      { id: "cc3", text: "Проанализируй этот стек трассировки ошибки. Определи первопричину, объясни точно почему это происходит простыми словами, предложи исправление с правильной обработкой ошибок и напиши регрессионный тест: [ОШИБКА]" },
      { id: "cc4", text: "Рефакторни эту функцию, чтобы она была более читаемой, производительной и тестируемой. Используй принципы чистой архитектуры, объясни каждое решение и покажи diff до/после: [КОД]" },
      { id: "cc5", text: "Создай полный набор тестов для [ФУНКЦИИ], охватывающий счастливые пути, граничные случаи, обработку ошибок, граничные значения и интеграцию с зависимостями. Используй блоки describe/it с понятными названиями." },
      { id: "cc6", text: "Проверь мой API-маршрут на уязвимости безопасности — SQL-инъекция, XSS, CSRF, обход аутентификации, пробелы в rate limiting, валидация входных данных и утечка данных. Приоритизируй исправления по степени серьёзности: [КОД]" },
    ],
  },
  {
    id: "productivity", icon: "⚡", title: "Продуктивность & Системы", color: "#ec4899",
    prompts: [
      { id: "p1", text: "Разработай систему еженедельного рабочего процесса для человека, совмещающего [РОЛЬ_1] и [РОЛЬ_2]. Включи тайм-блоки, дни пакетной обработки и управление энергией. Добавь блок глубокой работы «без встреч» и пятничный ритуал ревью." },
      { id: "p2", text: "Преврати этот огромный список задач в чёткий 7-дневный план выполнения с приоритетами и зависимостями: [ЗАДАЧИ]. Отметь задачи для делегирования или автоматизации, определи одну задачу, разблокирующую всё остальное." },
      { id: "p3", text: "Предложи 10 ИИ-автоматизаций, которые можно настроить на этой неделе, чтобы сэкономить 5+ часов. Мой стек: [ИНСТРУМЕНТЫ]. Мои узкие места: [ПРОБЛЕМЫ]. Включи точные названия инструментов и оценку сэкономленных часов." },
      { id: "p4", text: "Создай матрицу принятия решений для выбора между [ВАРИАНТЫ]. Оцени каждый по: потенциалу роста, риску, временным затратам, обратимости и соответствию целям. Включи взвешенную систему оценки и чёткую рекомендацию." },
      { id: "p5", text: "Разработай систему пакетного создания контента, которая позволяет производить 30 дней контента за одну 8-часовую сессию. Ниша: [НИША]. Форматы: [ФОРМАТЫ]. Включи расписание по минутам и файлы шаблонов." },
      { id: "p6", text: "Создай персональную ОС: утренний ритуал, шаблон ежедневного ревью, ритуал еженедельного планирования и фреймворк ежемесячной рефлексии для [ЦЕЛИ]. Включи структуру шаблона Notion/Obsidian и квартальный OKR." },
    ],
  },
  {
    id: "debug", icon: "🔧", title: "Отладка & Рефакторинг", color: "#f97316",
    prompts: [
      { id: "d1", text: "Этот код работает, но его невозможно поддерживать. Рефакторни его, используя принципы чистой архитектуры. Извлеки переиспользуемые утилиты, добавь TypeScript-типы там где их не хватает и покажи диаграмму зависимостей до и после: [КОД]" },
      { id: "d2", text: "Я получаю [ОШИБКУ] в production, но не могу воспроизвести локально. Проведи меня через систематический процесс отладки из 10 шагов. Включи чеклист различий между окружениями и стратегию логирования." },
      { id: "d3", text: "Сравни два подхода к реализации [ФУНКЦИИ]. Плюсы, минусы, последствия для производительности и какой выбрать для команды из [РАЗМЕР]. Включи матрицу решений и бремя поддержки за 12 месяцев: [ПОДХОД_A] vs [ПОДХОД_B]" },
      { id: "d4", text: "Создай план миграции для перехода с [СТАРАЯ_ТЕХНОЛОГИЯ] на [НОВАЯ_ТЕХНОЛОГИЯ] с нулевым downtime. Включи стратегию отката, оценку рисков, поэтапный таймлайн и стратегию feature flag для постепенного развёртывания." },
      { id: "d5", text: "Просмотри эту схему базы данных для [ТИП] приложения. Определи: отсутствующие индексы, риски N+1 запросов, проблемы нормализации и узкие места масштабируемости. Оцени производительность при 10x и 100x масштабе: [СХЕМА]" },
      { id: "d6", text: "Напиши комплексную стратегию обработки ошибок для [ТИП_ПРИЛОЖЕНИЯ]. Охвати: пользовательские ошибки, логирование, логику повтора, graceful degradation и оповещение. Включи таксономию кодов ошибок и пороги PagerDuty." },
    ],
  },
  {
    id: "landing", icon: "🎨", title: "Лендинги & Копирайтинг", color: "#14b8a6",
    prompts: [
      { id: "l1", text: "Напиши текст выше сгиба для [ПРОДУКТА], который доносит ценность за 3 секунды. Включи: заголовок, подзаголовок, текст CTA-кнопки и строку социального доказательства. Предоставь 3 варианта для A/B-теста." },
      { id: "l2", text: "Создай 10 шаблонов email-запросов отзывов для клиентов. Каждый должен упростить им написание конкретной, правдоподобной похвалы. Включи готовый шаблон отзыва для редактирования и конкретные вопросы для направления ответа." },
      { id: "l3", text: "Создай страницу цен с разделом FAQ для [ПРОДУКТА]. Ответь на 5 главных возражений при покупке. Включи сравнительную таблицу с конкурентами, размещение бейджа возврата денег и сигналы доверия рядом с CTA-кнопкой." },
      { id: "l4", text: "Напиши шаблон кейса для [ПРОДУКТА]. Структура: проблема, решение, результаты (с конкретными числами) и цитата. Включи вопросы для интервью с клиентом, визуальный wireframe макета и SEO-оптимизированный формат заголовка." },
      { id: "l5", text: "Разработай wireframe главной страницы в тексте: каждый раздел, его цель, целевое количество слов и эмоция, которую он должен вызвать. Включи цели глубины прокрутки и различия мобильного и десктопного макета. Продукт: [ПРОДУКТ]." },
      { id: "l6", text: "Напиши микрокопию для [ПРОДУКТА]: пустые состояния, сообщения об ошибках, подтверждения успеха, подсказки и онбординг-хинты. Включи 3 варианта для каждого сообщения (дружелюбный, профессиональный, игривый). Тон: [ГОЛОС]." },
    ],
  },
  {
    id: "monetize", icon: "💰", title: "Монетизация & Масштаб", color: "#84cc16",
    prompts: [
      { id: "mo1", text: "Сгенерируй 10 идей цифровых продуктов, которые можно создать из своей экспертизы в [НАВЫК]. Включи ценообразование, формат и оценочное время разработки для каждого. Ранжируй по потенциалу дохода vs усилиям." },
      { id: "mo2", text: "Создай стратегию запуска для цифрового продукта за $[ЦЕНА]. Охвати: предзапускный вайтлист, последовательность запускной недели и вечнозелёную воронку. Включи 14-дневный email-прогрев и аутентичные тактики дефицита." },
      { id: "mo3", text: "Разработай членское/сообщество предложение вокруг [ТЕМЫ]. Включи: уровни, выгоды, частоту контента и крючки удержания. Добавь онбординг-поток для новых участников и ритуалы вовлечения (еженедельные звонки, челленджи)." },
      { id: "mo4", text: "Проанализируй мои потоки дохода и предложи 3 способа увеличить средний чек без добавления новых продуктов. Включи конкретное размещение upsell/cross-sell, психологию пакетного ценообразования и прогнозы LTV: [ТЕКУЩИЕ_ПРЕДЛОЖЕНИЯ]" },
      { id: "mo5", text: "Напиши структуру вебинара, который продаёт [ПРОДУКТ] с конверсией 10%+. Включи: крючок, обучающий сегмент, переход к питчу и обработку возражений. Добавь структуру слайд за слайдом и email-последовательность повтора." },
      { id: "mo6", text: "Создай шаблон партнёрского охвата для сотрудничества с [ТИП_ПАРТНЁРА]. Включи ценностное предложение, предлагаемую структуру и follow-up последовательность. Добавь анализ взаимных выгод и 90-дневную систему оценки успеха." },
    ],
  },
];

function extractVars(text: string): string[] {
  const matches = [...text.matchAll(/\[([^\]]+)\]/g)];
  return [...new Set(matches.map(m => m[1]))];
}
function fillPrompt(template: string, vals: Record<string, string>): string {
  let r = template;
  for (const [k, v] of Object.entries(vals)) {
    r = r.replaceAll(`[${k}]`, v || `[${k}]`);
  }
  return r;
}

// ──────────────────────────────────── CSS THEME CONFIGS ──
const CSS_THEMES: Record<string, {
  bg: string; card: string; cardBorder: string;
  text: string; textSub: string; accent: string; accent2: string;
  bullet: string; numBg: string; numText: string; barTrack: string;
}> = {
  dark: {
    bg: "linear-gradient(135deg, #060818 0%, #0f1035 50%, #1a1b4b 100%)",
    card: "rgba(255,255,255,0.05)", cardBorder: "rgba(129,140,248,0.2)",
    text: "#ffffff", textSub: "rgba(255,255,255,0.6)",
    accent: "#818cf8", accent2: "#c4b5fd",
    bullet: "linear-gradient(135deg,#6366f1,#8b5cf6)", numBg: "rgba(99,102,241,0.18)", numText: "#a5b4fc",
    barTrack: "rgba(255,255,255,0.12)",
  },
  light: {
    bg: "linear-gradient(135deg, #eef2ff 0%, #e8eeff 50%, #f5f3ff 100%)",
    card: "rgba(255,255,255,0.75)", cardBorder: "rgba(99,102,241,0.2)",
    text: "#1e1b4b", textSub: "rgba(30,27,75,0.55)",
    accent: "#6366f1", accent2: "#8b5cf6",
    bullet: "linear-gradient(135deg,#6366f1,#8b5cf6)", numBg: "rgba(99,102,241,0.12)", numText: "#4f46e5",
    barTrack: "rgba(99,102,241,0.2)",
  },
  purple: {
    bg: "linear-gradient(135deg, #2e1065 0%, #4c1d95 50%, #5b21b6 100%)",
    card: "rgba(255,255,255,0.08)", cardBorder: "rgba(251,191,36,0.25)",
    text: "#ffffff", textSub: "rgba(255,255,255,0.65)",
    accent: "#fbbf24", accent2: "#fde68a",
    bullet: "linear-gradient(135deg,#f59e0b,#fbbf24)", numBg: "rgba(251,191,36,0.15)", numText: "#fde68a",
    barTrack: "rgba(255,255,255,0.15)",
  },
  gold: {
    bg: "linear-gradient(135deg, #0c0a08 0%, #1c1710 50%, #241f12 100%)",
    card: "rgba(245,158,11,0.08)", cardBorder: "rgba(245,158,11,0.22)",
    text: "#fef3c7", textSub: "rgba(254,243,199,0.6)",
    accent: "#f59e0b", accent2: "#fde68a",
    bullet: "linear-gradient(135deg,#d97706,#f59e0b)", numBg: "rgba(245,158,11,0.18)", numText: "#fbbf24",
    barTrack: "rgba(245,158,11,0.2)",
  },
  rose: {
    bg: "linear-gradient(135deg, #1a0310 0%, #2d0520 50%, #3f0626 100%)",
    card: "rgba(244,114,182,0.08)", cardBorder: "rgba(244,114,182,0.22)",
    text: "#fce7f3", textSub: "rgba(252,231,243,0.6)",
    accent: "#f472b6", accent2: "#fbcfe8",
    bullet: "linear-gradient(135deg,#db2777,#f472b6)", numBg: "rgba(244,114,182,0.15)", numText: "#fbcfe8",
    barTrack: "rgba(244,114,182,0.2)",
  },
};

// ──────────────────────────────────── HTML SLIDE COMPONENT ──
function SlideCard({ slide, total, themeKey, brand, onDownload }: {
  slide: SlideData; total: number; themeKey: string; brand: string; onDownload: () => void;
}) {
  const t = CSS_THEMES[themeKey] ?? CSS_THEMES.dark;

  return (
    <div style={{
      position: "relative",
      width: "100%",
      aspectRatio: "1/1",
      background: t.bg,
      borderRadius: "0",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      padding: "28px",
      boxSizing: "border-box",
    }}>
      {/* Top accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "4px",
        background: `linear-gradient(90deg, ${t.accent}00, ${t.accent}, ${t.accent2}, ${t.accent2}00)`,
      }} />

      {/* Glow orbs */}
      <div style={{
        position: "absolute", top: "-60px", right: "-60px",
        width: "260px", height: "260px", borderRadius: "50%",
        background: `radial-gradient(circle, ${t.accent}22 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-40px", left: "-40px",
        width: "200px", height: "200px", borderRadius: "50%",
        background: `radial-gradient(circle, ${t.accent}14 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", position: "relative", zIndex: 1 }}>
        {brand ? (
          <div style={{
            padding: "5px 14px", borderRadius: "20px",
            background: t.card, border: `1px solid ${t.cardBorder}`,
            color: t.accent, fontSize: "12px", fontWeight: 700, letterSpacing: "0.04em",
          }}>{brand}</div>
        ) : <div />}
        <div style={{
          padding: "5px 14px", borderRadius: "20px",
          background: t.card, border: `1px solid ${t.cardBorder}`,
          color: t.textSub, fontSize: "12px", fontWeight: 600,
        }}>{slide.index} / {total}</div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1, gap: "14px" }}>
        {slide.type === "hook" && (
          <>
            <div style={{ textAlign: "center", fontSize: "56px", lineHeight: 1, marginBottom: "4px" }}>{slide.emoji}</div>
            <h2 style={{
              margin: 0, textAlign: "center", fontWeight: 900, lineHeight: 1.15,
              fontSize: "clamp(18px, 3.5vw, 28px)",
              background: `linear-gradient(135deg, ${t.text}, ${t.accent2})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>{slide.headline}</h2>
            {slide.subtext && (
              <div style={{
                margin: "4px 0 0",
                padding: "14px 18px",
                background: t.card,
                border: `1px solid ${t.cardBorder}`,
                borderRadius: "14px",
                textAlign: "center",
                color: t.textSub,
                fontSize: "13px",
                lineHeight: 1.6,
                backdropFilter: "blur(8px)",
              }}>{slide.subtext}</div>
            )}
          </>
        )}

        {slide.type === "content" && (
          <>
            <div style={{
              display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px",
            }}>
              <span style={{ fontSize: "26px" }}>{slide.emoji}</span>
              <h2 style={{
                margin: 0, fontWeight: 800, lineHeight: 1.2,
                fontSize: "clamp(14px, 2.8vw, 20px)",
                background: `linear-gradient(135deg, ${t.text}, ${t.accent2})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>{slide.headline}</h2>
            </div>
            <div style={{
              width: "50px", height: "3px", borderRadius: "2px",
              background: `linear-gradient(90deg, ${t.accent}, ${t.accent2})`,
              marginBottom: "4px",
            }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {(slide.points ?? []).slice(0, 3).map((pt, idx) => (
                <div key={idx} style={{
                  display: "flex", alignItems: "flex-start", gap: "12px",
                  padding: "12px 14px",
                  background: t.card,
                  border: `1px solid ${t.cardBorder}`,
                  borderRadius: "12px",
                  backdropFilter: "blur(8px)",
                  position: "relative",
                  overflow: "hidden",
                }}>
                  {/* Left accent bar */}
                  <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0, width: "3px",
                    background: t.bullet, borderRadius: "3px 0 0 3px",
                  }} />
                  {/* Number badge */}
                  <div style={{
                    width: "26px", height: "26px", minWidth: "26px",
                    borderRadius: "50%",
                    background: t.numBg,
                    border: `1px solid ${t.accent}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: t.numText, fontSize: "12px", fontWeight: 800,
                  }}>{idx + 1}</div>
                  <span style={{ color: t.text, fontSize: "13px", lineHeight: 1.55, paddingLeft: "4px" }}>{pt}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {slide.type === "cta" && (
          <>
            <div style={{ textAlign: "center", fontSize: "52px", lineHeight: 1 }}>{slide.emoji}</div>
            <h2 style={{
              margin: 0, textAlign: "center", fontWeight: 900, lineHeight: 1.2,
              fontSize: "clamp(16px, 3.2vw, 24px)",
              background: `linear-gradient(135deg, ${t.text}, ${t.accent2})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>{slide.headline}</h2>
            {slide.cta && (
              <p style={{ margin: 0, textAlign: "center", color: t.textSub, fontSize: "13px", lineHeight: 1.6 }}>{slide.cta}</p>
            )}
            <div style={{
              marginTop: "8px",
              padding: "14px 24px",
              background: t.bullet,
              borderRadius: "50px",
              textAlign: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: "14px",
              boxShadow: `0 8px 24px ${t.accent}40`,
            }}>Сохранить в закладки →</div>
          </>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ position: "relative", zIndex: 1, marginTop: "16px" }}>
        <div style={{ height: "4px", borderRadius: "2px", background: t.barTrack, position: "relative" }}>
          <div style={{
            position: "absolute", left: 0, top: 0, height: "100%",
            width: `${(slide.index / total) * 100}%`,
            background: `linear-gradient(90deg, ${t.accent}, ${t.accent2})`,
            borderRadius: "2px",
            transition: "width 0.3s ease",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "8px" }}>
          {Array.from({ length: total }, (_, i) => (
            <div key={i} style={{
              width: i === slide.index - 1 ? "20px" : "6px",
              height: "6px",
              borderRadius: "3px",
              background: i === slide.index - 1 ? t.accent : t.barTrack,
              transition: "all 0.3s ease",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────── CAROUSEL SECTION ──
function CarouselCreator() {
  const [topic, setTopic]     = useState("");
  const [niche, setNiche]     = useState("");
  const [brand, setBrand]     = useState("");
  const [numSlides, setNum]   = useState(6);
  const [theme, setTheme]     = useState("dark");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<CarouselResult | null>(null);
  const [error, setError]     = useState("");
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  async function generate() {
    if (!topic.trim()) { setError("Введи тему карусели"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await fetch("/api/carousel/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, niche, numSlides, theme, brand }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setResult(d);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function downloadSlide(idx: number) {
    const el = slideRefs.current[idx];
    if (!el) return;
    const h2c = (await import("html2canvas")).default;
    const canvas = await h2c(el, { scale: 3, useCORS: true, backgroundColor: null, logging: false });
    canvas.toBlob(blob => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `slide-${idx + 1}.png`;
      a.click();
    }, "image/png");
  }

  async function downloadAll() {
    if (!result) return;
    for (let i = 0; i < result.slides.length; i++) {
      await downloadSlide(i);
      await new Promise(r => setTimeout(r, 400));
    }
  }

  const THEMES_UI = [
    { id: "dark",   label: "Dark",   color: "#060818", ring: "#818cf8" },
    { id: "light",  label: "Light",  color: "#c7d2fe", ring: "#6366f1" },
    { id: "purple", label: "Purple", color: "#4c1d95", ring: "#fbbf24" },
    { id: "gold",   label: "Gold",   color: "#1c1710", ring: "#f59e0b" },
    { id: "rose",   label: "Rose",   color: "#3f0626", ring: "#f472b6" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Form card */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(99,102,241,0.15)",
        borderRadius: "20px",
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "22px",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          {[
            { label: "Тема карусели *", val: topic, set: setTopic, ph: "Напр: 5 ошибок начинающих блогеров", enter: true },
            { label: "Ниша", val: niche, set: setNiche, ph: "Напр: Контент-маркетинг" },
            { label: "Бренд / аккаунт", val: brand, set: setBrand, ph: "Напр: @myaccount" },
          ].map(({ label, val, set, ph, enter }) => (
            <div key={label}>
              <label style={{ display: "block", fontSize: "10px", color: "rgba(255,255,255,0.35)", marginBottom: "7px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>{label}</label>
              <input
                value={val} onChange={e => set(e.target.value)}
                onKeyDown={enter ? (e => e.key === "Enter" && generate()) : undefined}
                placeholder={ph}
                style={{ width: "100%", padding: "11px 14px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "32px", flexWrap: "wrap" }}>
          <div>
            <label style={{ display: "block", fontSize: "10px", color: "rgba(255,255,255,0.35)", marginBottom: "9px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Слайдов</label>
            <div style={{ display: "flex", gap: "6px" }}>
              {[4, 5, 6, 7, 8, 10].map(n => (
                <button key={n} onClick={() => setNum(n)} style={{
                  width: "42px", height: "38px", borderRadius: "10px", fontSize: "14px", fontWeight: 700,
                  background: numSlides === n ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.05)",
                  border: numSlides === n ? "none" : "1px solid rgba(255,255,255,0.08)",
                  color: numSlides === n ? "#fff" : "rgba(255,255,255,0.45)", cursor: "pointer",
                  boxShadow: numSlides === n ? "0 4px 12px rgba(99,102,241,0.4)" : "none",
                }}>{n}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "10px", color: "rgba(255,255,255,0.35)", marginBottom: "9px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Тема оформления</label>
            <div style={{ display: "flex", gap: "10px" }}>
              {THEMES_UI.map(th => (
                <button key={th.id} onClick={() => setTheme(th.id)} title={th.label} style={{
                  width: "36px", height: "36px", borderRadius: "50%",
                  background: th.color,
                  border: theme === th.id ? `3px solid ${th.ring}` : "2px solid rgba(255,255,255,0.15)",
                  cursor: "pointer",
                  boxShadow: theme === th.id ? `0 0 0 2px ${th.ring}55` : "none",
                  transition: "all 0.2s ease",
                }} />
              ))}
            </div>
          </div>
          <button
            onClick={generate}
            disabled={loading}
            style={{
              marginLeft: "auto",
              padding: "12px 32px",
              borderRadius: "14px",
              background: loading ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              border: "none", color: "#fff", fontSize: "15px", fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 8px 24px rgba(99,102,241,0.45)",
              letterSpacing: "-0.01em",
            }}
          >
            {loading ? "⏳ Генерирую..." : "✨ Сгенерировать карусель"}
          </button>
        </div>
        {error && <div style={{ color: "#f87171", fontSize: "13px", padding: "10px 14px", background: "rgba(239,68,68,0.1)", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.2)" }}>⚠ {error}</div>}
      </div>

      {/* Results */}
      {result && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <div style={{ fontSize: "17px", fontWeight: 800, color: "#fff" }}>{result.title}</div>
              <div style={{ fontSize: "12px", color: "rgba(129,140,248,0.7)", marginTop: "5px", letterSpacing: "0.02em" }}>
                {result.hashtags?.join(" ")}
              </div>
            </div>
            <button
              onClick={downloadAll}
              style={{
                padding: "10px 22px", borderRadius: "12px", fontSize: "13px", fontWeight: 700,
                background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))",
                border: "1px solid rgba(99,102,241,0.35)", color: "#a5b4fc", cursor: "pointer",
                letterSpacing: "-0.01em",
              }}
            >
              ↓ Скачать все PNG
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
            {result.slides.map((slide, i) => (
              <div key={i} style={{ borderRadius: "16px", overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div ref={el => { slideRefs.current[i] = el; }}>
                  <SlideCard slide={slide} total={result.slides.length} themeKey={theme} brand={brand} onDownload={() => downloadSlide(i)} />
                </div>
                <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0a0b1e", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                    {slide.type} · {slide.index}/{result.slides.length}
                  </span>
                  <button
                    onClick={() => downloadSlide(i)}
                    style={{
                      padding: "6px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 700,
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none",
                      color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
                    }}
                  >
                    ↓ PNG
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────── PROMPT LIBRARY ──
function PromptLibrary() {
  const [activeCategory, setActiveCat] = useState("writing");
  const [search, setSearch]            = useState("");
  const [varValues, setVarValues]      = useState<Record<string, Record<string, string>>>({});
  const [results, setResults]          = useState<Record<string, string>>({});
  const [running, setRunning]          = useState<Record<string, boolean>>({});
  const [errors, setErrors]            = useState<Record<string, string>>({});

  const cat = PROMPT_CATEGORIES.find(c => c.id === activeCategory)!;
  const filtered = search
    ? PROMPT_CATEGORIES.flatMap(c => c.prompts.filter(p => p.text.toLowerCase().includes(search.toLowerCase())))
    : cat.prompts;

  function setVar(promptId: string, varName: string, val: string) {
    setVarValues(prev => ({
      ...prev,
      [promptId]: { ...(prev[promptId] ?? {}), [varName]: val },
    }));
  }

  async function runPrompt(promptId: string, template: string) {
    const vals = varValues[promptId] ?? {};
    const filled = fillPrompt(template, vals);
    setRunning(p => ({ ...p, [promptId]: true }));
    setErrors(p => ({ ...p, [promptId]: "" }));
    setResults(p => ({ ...p, [promptId]: "" }));
    try {
      const r = await fetch("/api/ai/run-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: filled }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setResults(p => ({ ...p, [promptId]: d.result }));
    } catch (e: any) {
      setErrors(p => ({ ...p, [promptId]: e.message }));
    } finally {
      setRunning(p => ({ ...p, [promptId]: false }));
    }
  }

  function copyResult(id: string) {
    navigator.clipboard.writeText(results[id] ?? "");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Search + category bar */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Поиск по промптам..."
          style={{ flex: 1, padding: "10px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "14px", outline: "none" }}
        />
        {search && <button onClick={() => setSearch("")} style={{ padding: "8px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", cursor: "pointer", fontSize: "13px" }}>✕ Сброс</button>}
      </div>

      {!search && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {PROMPT_CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              style={{
                padding: "7px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
                background: activeCategory === c.id ? c.color + "33" : "rgba(255,255,255,0.04)",
                border: activeCategory === c.id ? `1px solid ${c.color}55` : "1px solid rgba(255,255,255,0.08)",
                color: activeCategory === c.id ? "#fff" : "rgba(255,255,255,0.45)",
                cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              {c.icon} {c.title}
            </button>
          ))}
        </div>
      )}

      {/* Prompt cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {filtered.map((prompt) => {
          const vars = extractVars(prompt.text);
          const vals = varValues[prompt.id] ?? {};
          const filledText = fillPrompt(prompt.text, vals);
          const result = results[prompt.id];
          const isRunning = running[prompt.id];
          const errMsg = errors[prompt.id];

          return (
            <div
              key={prompt.id}
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "14px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {/* Prompt text with highlights */}
              <div style={{
                fontFamily: "monospace",
                fontSize: "13px",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.7)",
                background: "rgba(0,0,0,0.2)",
                borderRadius: "8px",
                padding: "14px 16px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}>
                {prompt.text.split(/(\[[^\]]+\])/g).map((part, idx) =>
                  /^\[.+\]$/.test(part)
                    ? <span key={idx} style={{ color: "#fbbf24", fontWeight: 700 }}>{part}</span>
                    : <span key={idx}>{part}</span>
                )}
              </div>

              {/* Variable inputs */}
              {vars.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
                  {vars.map(v => (
                    <div key={v}>
                      <label style={{ display: "block", fontSize: "10px", color: "#fbbf24", marginBottom: "4px", fontWeight: 700, letterSpacing: "0.05em" }}>{v}</label>
                      <input
                        value={vals[v] ?? ""}
                        onChange={e => setVar(prompt.id, v, e.target.value)}
                        placeholder={`Введи ${v.toLowerCase()}...`}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", color: "#fff", fontSize: "13px", outline: "none" }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={() => runPrompt(prompt.id, prompt.text)}
                  disabled={isRunning}
                  style={{
                    padding: "9px 22px", borderRadius: "10px", fontSize: "13px", fontWeight: 700,
                    background: isRunning ? "rgba(99,102,241,0.25)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    border: "none", color: "#fff", cursor: isRunning ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: "6px",
                  }}
                >
                  {isRunning ? "⏳ Генерирую..." : "▶ Запустить"}
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(filledText)}
                  style={{
                    padding: "9px 18px", borderRadius: "10px", fontSize: "13px",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.5)", cursor: "pointer",
                  }}
                >
                  📋 Копировать промпт
                </button>
              </div>

              {/* Error */}
              {errMsg && <div style={{ color: "#f87171", fontSize: "12px", padding: "8px 12px", background: "rgba(239,68,68,0.08)", borderRadius: "8px" }}>⚠ {errMsg}</div>}

              {/* Result */}
              {result && (
                <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "10px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "11px", color: "#a5b4fc", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Результат</span>
                    <button
                      onClick={() => copyResult(prompt.id)}
                      style={{ padding: "4px 12px", borderRadius: "6px", fontSize: "11px", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", cursor: "pointer" }}
                    >
                      📋 Копировать
                    </button>
                  </div>
                  <div style={{ fontSize: "13px", lineHeight: 1.75, color: "rgba(255,255,255,0.8)", whiteSpace: "pre-wrap" }}>{result}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────── MAIN PAGE ──
const TABS = [
  { id: "carousel", label: "🎠 Генератор Карусели" },
  { id: "prompts",  label: "✨ 60 Промптов Claude" },
];

export default function ClaudeGuidePage() {
  const [tab, setTab] = useState("carousel");

  return (
    <div style={{ minHeight: "100vh", background: "#030412", padding: "28px 32px 60px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <div style={{
          background: "linear-gradient(135deg, #a78bfa 0%, #818cf8 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em",
        }}>
          Claude Knowledge Base
        </div>
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", marginTop: "4px" }}>
          Создавай карусели с AI · Запускай 60 промптов со своими данными
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", padding: "4px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", width: "fit-content" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "9px 22px", borderRadius: "9px", fontSize: "13px", fontWeight: tab === t.id ? 700 : 400,
            color: tab === t.id ? "#a5b4fc" : "rgba(255,255,255,0.4)",
            background: tab === t.id ? "linear-gradient(135deg, rgba(99,102,241,0.22) 0%, rgba(139,92,246,0.14) 100%)" : "transparent",
            border: tab === t.id ? "1px solid rgba(99,102,241,0.28)" : "1px solid transparent",
            cursor: "pointer", whiteSpace: "nowrap",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      {tab === "carousel" ? <CarouselCreator /> : <PromptLibrary />}
    </div>
  );
}
