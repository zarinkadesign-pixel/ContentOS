/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/claude-guide/page.tsx
 *
 * Claude Knowledge Base: Carousel Creator + 60 Interactive Prompts
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { TEMPLATE_CSS, FONT_LINK, TEMPLATES_24 } from "./templates-data";

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



// ─────────────────────────────────── TEMPLATE CONTENT INJECTION ──
function injectContent(templateHtml: string, slide: SlideData, brand: string, photo?: string): string {
  if (typeof window === "undefined") return templateHtml;
  const doc = new DOMParser().parseFromString(`<body>${templateHtml}</body>`, "text/html");

  // Main heading
  const h2 = doc.querySelector("h2");
  if (h2) h2.innerHTML = slide.headline.replace(/\n/g, "<br>");
  const h3 = doc.querySelector("h3");
  if (h3 && !h2) h3.innerHTML = slide.headline.replace(/\n/g, "<br>");

  // Label / category tags
  const labelEls = doc.querySelectorAll(".sub,.badge,.q-tag,.q-line,.story-tag,.meet-tag,.pretag");
  labelEls.forEach((el, i) => {
    if (i === 0) el.textContent = `${slide.emoji}${brand ? " " + brand : ""}`;
  });

  // Description / body text (first match = subtext, rest = brand)
  const descEls = doc.querySelectorAll(".small,.bio,.role,.tagline,.save,.bottom-note,.link,.city,.when,.join");
  descEls.forEach((el, i) => {
    if (i === 0 && slide.subtext) el.textContent = slide.subtext;
    else if (brand) el.textContent = brand;
  });

  // Quote
  const quoteEl = doc.querySelector(".quote");
  if (quoteEl && slide.subtext) quoteEl.textContent = `«${slide.subtext}»`;

  // Bullet points → chips / grid cells
  if (slide.points?.length) {
    const chips = doc.querySelectorAll(".chip");
    chips.forEach((el, i) => { if (slide.points![i]) el.textContent = slide.points![i]; });
    const names = doc.querySelectorAll(".cell-item .name");
    names.forEach((el, i) => { if (slide.points![i]) el.textContent = slide.points![i]; });
    const icons = doc.querySelectorAll(".cell-item .icon-ph");
    const iconSet = ["📌","✅","💡","🎯","⚡","🔑"];
    icons.forEach((el, i) => { el.textContent = iconSet[i] ?? "•"; });
    // comparison table cells
    const goodCells = doc.querySelectorAll(".cell.good");
    goodCells.forEach((el, i) => { if (slide.points![i]) el.textContent = slide.points![i]; });
    const badCells = doc.querySelectorAll(".cell.bad");
    const badLabels = ["Старый подход","Без системы","Вручную","Случайно"];
    badCells.forEach((el, i) => { el.textContent = badLabels[i] ?? "—"; });
  }

  // CTA
  const ctaEl = doc.querySelector(".btn,.cta-btn");
  if (ctaEl && slide.cta) ctaEl.textContent = `${slide.cta} →`;

  // Photo background on main container
  if (photo) {
    const tplEl = doc.querySelector(".tpl") as HTMLElement | null;
    if (tplEl) {
      tplEl.style.backgroundImage = `url('${photo}')`;
      tplEl.style.backgroundSize = "cover";
      tplEl.style.backgroundPosition = "center";
    }
  }

  return doc.body.innerHTML;
}


// ──────────────────────────────────────── CAROUSEL CREATOR ──
function gdriveDirect(url: string): string {
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return `https://drive.google.com/uc?export=view&id=${m2[1]}`;
  return url;
}

function CarouselCreator() {
  const [topic, setTopic]               = useState("");
  const [niche, setNiche]               = useState("");
  const [numSlides, setNumSlides]       = useState(6);
  const [brand, setBrand]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [result, setResult]             = useState<CarouselResult | null>(null);
  const [slideTemplates, setSlideTemplates] = useState<Record<number, string>>({});
  const [expandedTplPicker, setExpandedTplPicker] = useState<number | null>(null);
  const [color1, setColor1]             = useState("#2563EB");
  const [color2, setColor2]             = useState("#1E3A8A");
  const [slidePhotos, setSlidePhotos]   = useState<Record<number, string>>({});
  const [slidePrompts, setSlidePrompts] = useState<Record<number, string>>({});
  const [slideDriveUrls, setSlideDriveUrls] = useState<Record<number, string>>({});
  const [genLoading, setGenLoading]     = useState<Record<number, boolean>>({});
  const [downloading, setDl]            = useState<number | null>(null);
  const slideRefs                       = useRef<(HTMLDivElement | null)[]>([]);

  function handleSlidePhoto(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setSlidePhotos(prev => ({ ...prev, [idx]: ev.target?.result as string }));
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function generateSlidePhoto(idx: number) {
    const prompt = (slidePrompts[idx] ?? "").trim();
    if (!prompt) return;
    setGenLoading(prev => ({ ...prev, [idx]: true }));
    try {
      const seed = Math.floor(Math.random() * 99999);
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ", professional photography, high quality")}?width=800&height=800&seed=${seed}&nologo=true`;
      const res = await fetch(url);
      const blob = await res.blob();
      await new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = ev => { setSlidePhotos(prev => ({ ...prev, [idx]: ev.target?.result as string })); resolve(); };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (_) {}
    setGenLoading(prev => ({ ...prev, [idx]: false }));
  }

  async function generate() {
    if (!topic.trim()) return;
    setSlidePhotos({}); setSlidePrompts({}); setSlideDriveUrls({});
    // Auto-assign unique shuffled templates per slide
    const shuffled = [...TEMPLATES_24].sort(() => Math.random() - 0.5);
    const autoTpls: Record<number, string> = {};
    for (let i = 0; i < numSlides; i++) autoTpls[i] = shuffled[i % shuffled.length].id;
    setSlideTemplates(autoTpls);
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await fetch("/api/carousel/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, niche, numSlides, brand, language: "ru" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setResult({ ...d, brand });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function reshuffleTemplates() {
    if (!result) return;
    const shuffled = [...TEMPLATES_24].sort(() => Math.random() - 0.5);
    const autoTpls: Record<number, string> = {};
    for (let i = 0; i < result.slides.length; i++) autoTpls[i] = shuffled[i % shuffled.length].id;
    setSlideTemplates(autoTpls);
  }

  function getSlidePhoto(idx: number): string {
    if (slidePhotos[idx]) return slidePhotos[idx];
    const driveUrl = slideDriveUrls[idx]?.trim();
    if (driveUrl) return gdriveDirect(driveUrl);
    return "";
  }

  function buildSlideSrc(slide: SlideData, idx: number): string {
    const tplId = slideTemplates[idx] ?? TEMPLATES_24[idx % TEMPLATES_24.length].id;
    const tpl = TEMPLATES_24.find(t => t.id === tplId) ?? TEMPLATES_24[0];
    const photo = getSlidePhoto(idx);
    const injected = injectContent(tpl.html, slide, brand, photo);
    const colorOverride = `:root{--blue:${color1};--blue-dark:${color2};--blue-mid:${color1};--blue-light:${color1}22;--blue-pale:${color1}11}`;
    return `<!DOCTYPE html><html><head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:transparent;font-family:'Manrope',sans-serif;width:400px;height:400px;overflow:hidden}
:root{--blue:#2563EB;--blue-dark:#1E3A8A;--blue-mid:#3B82F6;--blue-light:#DBEAFE;--blue-pale:#EFF6FF;--white:#FFFFFF;--off:#F8FAFF;--gray:#64748B;--gray-light:#E2E8F0;--black:#0F172A}
${colorOverride}
${TEMPLATE_CSS}
.tpl{width:400px;height:400px;border-radius:0;box-shadow:none;overflow:hidden;position:relative}
</style></head><body>${injected}</body></html>`;
  }

  async function downloadSlide(idx: number) {
    if (!result) return;
    setDl(idx);
    try {
      const slide = result.slides[idx];
      const tplId = slideTemplates[idx] ?? TEMPLATES_24[idx % TEMPLATES_24.length].id;
      const tpl = TEMPLATES_24.find(t => t.id === tplId) ?? TEMPLATES_24[0];
      const photo = getSlidePhoto(idx);
      const injected = injectContent(tpl.html, slide, brand, photo);
      const colorOverride = `:root{--blue:${color1};--blue-dark:${color2};--blue-mid:${color1};--blue-light:${color1}22;--blue-pale:${color1}11}`;

      const container = document.createElement("div");
      container.style.cssText = "position:fixed;left:-9999px;top:0;width:400px;height:400px;overflow:hidden;font-family:Manrope,sans-serif;";
      const style = document.createElement("style");
      style.textContent = `*{box-sizing:border-box;margin:0;padding:0}:root{--blue:#2563EB;--blue-dark:#1E3A8A;--blue-mid:#3B82F6;--blue-light:#DBEAFE;--blue-pale:#EFF6FF;--white:#FFFFFF;--off:#F8FAFF;--gray:#64748B;--gray-light:#E2E8F0;--black:#0F172A}${colorOverride}${TEMPLATE_CSS}.tpl{width:400px;height:400px;border-radius:0;box-shadow:none;overflow:hidden;position:relative}`;
      container.appendChild(style);
      const inner = document.createElement("div");
      inner.innerHTML = injected;
      container.appendChild(inner);
      document.body.appendChild(container);
      await new Promise(r => setTimeout(r, 300));
      const h2c = (await import("html2canvas")).default;
      const canvas = await h2c(container, { scale: 3, useCORS: true, backgroundColor: null, logging: false });
      document.body.removeChild(container);
      const link = document.createElement("a");
      link.download = `slide-${idx + 1}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (_) {}
    setDl(null);
  }

  async function downloadAll() {
    if (!result) return;
    for (let i = 0; i < result.slides.length; i++) {
      await downloadSlide(i);
      await new Promise(r => setTimeout(r, 500));
    }
  }

  const inp: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "14px", outline: "none" };
  const lbl: React.CSSProperties = { display: "block", fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "6px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" };

  // Mini template picker preview src
  function miniSrc(tplHtml: string): string {
    return `<!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet"><style>*{box-sizing:border-box;margin:0;padding:0}body{width:400px;height:400px;overflow:hidden;font-family:Manrope,sans-serif}:root{--blue:${color1};--blue-dark:${color2};--blue-mid:${color1};--blue-light:${color1}22;--blue-pale:${color1}11;--white:#FFFFFF;--off:#F8FAFF;--gray:#64748B;--gray-light:#E2E8F0;--black:#0F172A}${TEMPLATE_CSS}.tpl{width:400px;height:400px;border-radius:0;box-shadow:none;overflow:hidden;position:relative}</style></head><body>${tplHtml}</body></html>`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>

        {/* Topic / Niche / Brand / Slides */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div>
            <label style={lbl}>Тема карусели *</label>
            <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && generate()} placeholder="Например: 5 ошибок при создании контента" style={inp} />
          </div>
          <div>
            <label style={lbl}>Ниша / Эксперт</label>
            <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Маркетинг, продажи, психология..." style={inp} />
          </div>
          <div>
            <label style={lbl}>Бренд / Аккаунт</label>
            <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="@твой_аккаунт" style={inp} />
          </div>
          <div>
            <label style={lbl}>Кол-во слайдов: {numSlides}</label>
            <input type="range" min={4} max={10} value={numSlides} onChange={e => setNumSlides(Number(e.target.value))} style={{ width: "100%", accentColor: "#6366f1", marginTop: "8px" }} />
          </div>
        </div>

        {/* Duotone color scheme */}
        <div>
          <label style={lbl}>Цветовая гамма (дуотон)</label>
          <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>Основной</span>
              <input type="color" value={color1} onChange={e => setColor1(e.target.value)}
                style={{ width: "48px", height: "36px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", background: "none", padding: "2px" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>Тёмный</span>
              <input type="color" value={color2} onChange={e => setColor2(e.target.value)}
                style={{ width: "48px", height: "36px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", background: "none", padding: "2px" }} />
            </div>
            <div style={{ width: "60px", height: "36px", borderRadius: "8px", background: `linear-gradient(135deg, ${color1}, ${color2})`, flexShrink: 0 }} />
            {[["#2563EB","#1E3A8A"],["#7c3aed","#4c1d95"],["#059669","#064e3b"],["#dc2626","#7f1d1d"],["#d97706","#78350f"],["#db2777","#831843"],["#0f172a","#1e293b"]].map(([c1,c2]) => (
              <button key={c1} onClick={() => { setColor1(c1); setColor2(c2); }}
                title={c1}
                style={{ width: "28px", height: "28px", borderRadius: "50%", border: color1===c1 ? "3px solid #fff" : "2px solid rgba(255,255,255,0.15)", cursor: "pointer", background: `linear-gradient(135deg, ${c1}, ${c2})`, padding: 0, flexShrink: 0 }} />
            ))}
          </div>
        </div>

        {/* Template mix note */}
        <div style={{ padding: "10px 14px", borderRadius: "10px", background: `${color1}10`, border: `1px solid ${color1}30`, fontSize: "12px", color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>🎲</span>
          <span>Каждый слайд автоматически получит <strong style={{ color: "rgba(255,255,255,0.8)" }}>уникальный шаблон</strong> из 24. После генерации можно сменить шаблон под каждым слайдом индивидуально.</span>
        </div>

        <button onClick={generate} disabled={loading || !topic.trim()} style={{
          padding: "13px 28px", borderRadius: "12px", fontSize: "14px", fontWeight: 700,
          cursor: loading || !topic.trim() ? "not-allowed" : "pointer",
          background: loading ? "rgba(99,102,241,0.3)" : `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
          border: "none", color: "#fff", width: "fit-content", opacity: !topic.trim() ? 0.5 : 1,
        }}>
          {loading ? "⏳ Генерирую..." : "✨ Создать карусель"}
        </button>

        {error && <div style={{ color: "#f87171", fontSize: "13px", padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: "8px" }}>⚠ {error}</div>}
      </div>

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>{result.title}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>{result.slides.length} слайдов · {result.hashtags?.join(" ")}</div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={reshuffleTemplates} style={{ padding: "9px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>
                🎲 Перемешать
              </button>
              <button onClick={downloadAll} style={{ padding: "9px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, background: `linear-gradient(135deg, ${color1}, ${color2})`, border: "none", color: "#fff", cursor: "pointer" }}>
                ⬇ Скачать все
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {result.slides.map((slide, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {/* Slide preview via iframe */}
                <div ref={el => { slideRefs.current[i] = el; }} style={{ width: "400px", height: "400px", flexShrink: 0, overflow: "hidden", borderRadius: "8px", boxShadow: "0 8px 32px rgba(0,0,0,0.35)" }}>
                  <iframe
                    srcDoc={buildSlideSrc(slide, i)}
                    scrolling="no"
                    style={{ width: "400px", height: "400px", border: "none" }}
                  />
                </div>

                {/* Per-slide template switcher */}
                <div style={{ width: "400px" }}>
                  <button
                    onClick={() => setExpandedTplPicker(expandedTplPicker === i ? null : i)}
                    style={{ width: "100%", padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
                  >
                    <span>🎨 {TEMPLATES_24.find(t => t.id === (slideTemplates[i] ?? ""))?.name ?? "Авто"}</span>
                    <span style={{ fontSize: "10px" }}>{expandedTplPicker === i ? "▲" : "▼"}</span>
                  </button>
                  {expandedTplPicker === i && (
                    <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingTop: "6px", paddingBottom: "4px", flexWrap: "nowrap" }}>
                      {TEMPLATES_24.map(tpl => {
                        const isActive = (slideTemplates[i] ?? "") === tpl.id;
                        return (
                          <div key={tpl.id} onClick={() => { setSlideTemplates(prev => ({ ...prev, [i]: tpl.id })); setExpandedTplPicker(null); }} style={{
                            flexShrink: 0, cursor: "pointer", borderRadius: "6px", overflow: "hidden",
                            border: isActive ? `2px solid ${color1}` : "2px solid rgba(255,255,255,0.08)",
                            boxShadow: isActive ? `0 0 0 1px ${color1}55` : "none", transition: "all 0.12s",
                          }}>
                            <div style={{ width: "70px", height: "70px", overflow: "hidden", position: "relative" }}>
                              <iframe srcDoc={miniSrc(tpl.html)} scrolling="no"
                                style={{ width: "400px", height: "400px", border: "none", transform: "scale(0.175)", transformOrigin: "top left", pointerEvents: "none" }} />
                            </div>
                            <div style={{ padding: "2px 4px", background: isActive ? `${color1}22` : "#0d1126" }}>
                              <div style={{ fontSize: "8px", color: isActive ? color1 : "rgba(255,255,255,0.35)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "66px" }}>{tpl.name}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div style={{ width: "400px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {/* Row 1: upload / remove / download */}
                  <div style={{ display: "flex", gap: "6px" }}>
                    <label style={{
                      flex: 1, padding: "7px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: 600,
                      background: slidePhotos[i] ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.05)",
                      border: slidePhotos[i] ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.08)",
                      color: slidePhotos[i] ? "#a5b4fc" : "rgba(255,255,255,0.5)",
                      cursor: "pointer", textAlign: "center" as const, userSelect: "none" as const,
                    }}>
                      📷 {slidePhotos[i] ? "Сменить" : "Фото"}
                      <input type="file" accept="image/*" onChange={e => handleSlidePhoto(i, e)} style={{ display: "none" }} />
                    </label>
                    {(slidePhotos[i] || slideDriveUrls[i]) && (
                      <button onClick={() => { setSlidePhotos(prev => { const n = {...prev}; delete n[i]; return n; }); setSlideDriveUrls(prev => { const n = {...prev}; delete n[i]; return n; }); }}
                        style={{ padding: "7px 10px", borderRadius: "8px", fontSize: "11px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", cursor: "pointer" }}>✕</button>
                    )}
                    <button onClick={() => downloadSlide(i)} disabled={downloading === i} style={{ padding: "7px 14px", borderRadius: "8px", fontSize: "11px", fontWeight: 600, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)", cursor: "pointer" }}>
                      {downloading === i ? "⏳" : "⬇ PNG"}
                    </button>
                  </div>
                  {/* Row 2: Google Drive URL */}
                  <input
                    value={slideDriveUrls[i] ?? ""}
                    onChange={e => setSlideDriveUrls(prev => ({ ...prev, [i]: e.target.value }))}
                    placeholder="🔗 Google Drive ссылка на фото..."
                    style={{ padding: "7px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: "11px", outline: "none" }}
                  />
                  {/* Row 3: AI photo prompt */}
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      value={slidePrompts[i] ?? ""}
                      onChange={e => setSlidePrompts(prev => ({ ...prev, [i]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && generateSlidePhoto(i)}
                      placeholder="🤖 AI фото: женщина-эксперт за ноутбуком..."
                      style={{ flex: 1, padding: "7px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: "11px", outline: "none" }}
                    />
                    <button onClick={() => generateSlidePhoto(i)} disabled={genLoading[i] || !(slidePrompts[i]?.trim())} style={{
                      padding: "7px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                      background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)",
                      color: genLoading[i] ? "rgba(255,255,255,0.3)" : "#c4b5fd",
                      opacity: !(slidePrompts[i]?.trim()) ? 0.5 : 1,
                    }}>
                      {genLoading[i] ? "⏳" : "AI"}
                    </button>
                  </div>
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

// ──────────────────────────────────────── TEMPLATE GALLERY ──
const CAT_LABELS: Record<string, string> = {
  all: "Все", intro: "Знакомство", selling: "Продающие",
  content: "Контент", cases: "Кейсы", cta: "CTA",
};

function Templates24Gallery() {
  const [active, setActive] = useState("all");
  const [modal, setModal] = useState<typeof TEMPLATES_24[0] | null>(null);

  const filtered = active === "all"
    ? TEMPLATES_24
    : TEMPLATES_24.filter(t => t.category === active);

  function makeSrc(html: string, scale = 1) {
    return `<!DOCTYPE html><html><head>${FONT_LINK}<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:transparent;font-family:'Manrope',sans-serif}
:root{--blue:#2563EB;--blue-dark:#1E3A8A;--blue-mid:#3B82F6;--blue-light:#DBEAFE;--blue-pale:#EFF6FF;--white:#FFFFFF;--off:#F8FAFF;--gray:#64748B;--gray-light:#E2E8F0;--black:#0F172A}
${TEMPLATE_CSS}
.tpl{width:400px;height:400px;border-radius:0;box-shadow:none;overflow:hidden;position:relative;cursor:default;transition:none}
</style></head><body>${html}</body></html>`;
  }

  const btnStyle = (cat: string): React.CSSProperties => ({
    padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
    background: active === cat ? "rgba(92,106,240,0.25)" : "rgba(255,255,255,0.05)",
    border: active === cat ? "1px solid rgba(92,106,240,0.55)" : "1px solid rgba(255,255,255,0.08)",
    color: active === cat ? "#a5b4fc" : "rgba(255,255,255,0.45)",
    transition: "all 0.15s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Category filter */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {Object.entries(CAT_LABELS).map(([k, v]) => (
          <button key={k} style={btnStyle(k)} onClick={() => setActive(k)}>{v}</button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: "16px" }}>
        {filtered.map(tpl => (
          <div key={tpl.id} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Label */}
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.04em" }}>
              {tpl.id.toUpperCase()} · {tpl.name}
            </div>
            {/* Preview card */}
            <div
              onClick={() => setModal(tpl)}
              style={{ width: "100%", aspectRatio: "1/1", borderRadius: "10px", overflow: "hidden", cursor: "pointer", position: "relative", border: "1px solid rgba(255,255,255,0.07)", background: "#0d1126" }}
            >
              <iframe
                srcDoc={makeSrc(tpl.html)}
                scrolling="no"
                style={{
                  width: "400px", height: "400px", border: "none",
                  transform: "scale(0.545)", transformOrigin: "0 0",
                  pointerEvents: "none",
                }}
              />
              {/* Hover overlay */}
              <div style={{
                position: "absolute", inset: 0, background: "rgba(92,106,240,0)", transition: "background 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(92,106,240,0.18)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(92,106,240,0)")}
              >
                <span style={{ opacity: 0, fontSize: "13px", fontWeight: 700, color: "#fff", background: "rgba(92,106,240,0.9)", padding: "6px 14px", borderRadius: "20px", pointerEvents: "none" }}
                  className="zoom-label">⤢ Увеличить</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Count */}
      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>
        Показано {filtered.length} из 24 шаблонов
      </div>

      {/* Modal */}
      {modal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setModal(null)}
        >
          <div
            style={{ background: "#0d1126", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px", border: "1px solid rgba(255,255,255,0.1)", maxWidth: "520px", width: "100%" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>{modal.name}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>{modal.id.toUpperCase()} · {CAT_LABELS[modal.category] ?? modal.category}</div>
              </div>
              <button onClick={() => setModal(null)} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "8px", color: "#fff", padding: "6px 12px", cursor: "pointer", fontSize: "13px" }}>✕ Закрыть</button>
            </div>
            {/* Full-size preview */}
            <div style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
              <iframe
                srcDoc={makeSrc(modal.html)}
                scrolling="no"
                style={{ width: "100%", height: "470px", border: "none", display: "block" }}
              />
            </div>
            <button
              onClick={() => {
                const blob = new Blob([makeSrc(modal.html)], { type: "text/html" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `${modal.id}-${modal.name}.html`;
                a.click();
              }}
              style={{ padding: "10px 20px", borderRadius: "10px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
            >
              ⬇ Скачать шаблон HTML
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────── MAIN PAGE ──
const TABS = [
  { id: "carousel", label: "🎠 Карусель" },
  { id: "templates", label: "📐 24 Шаблона" },
  { id: "prompts",  label: "✨ 60 Промптов" },
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
      {tab === "carousel" ? <CarouselCreator /> : tab === "templates" ? <Templates24Gallery /> : <PromptLibrary />}
    </div>
  );
}

