# PRODUCER CENTER — АРХИТЕКТУРНЫЙ ПЛАН
**AMAImedia.com · Техническая архитектура v1.0**

---

## 1. Принципы архитектуры

- **Event-Driven:** каждый внешний триггер запускает цепочку в n8n
- **Single-File SPA:** платформа — один HTML файл, без сервера
- **localStorage-first:** все данные в браузере, без базы данных
- **API-native:** внешние сервисы через REST API напрямую

---

## 2. Компоненты системы

| Компонент | Тип | Где работает | Отвечает за |
|-----------|-----|-------------|------------|
| Producer Center HTML | SPA (Vanilla JS) | Netlify CDN | UI, данные, AI вызовы |
| localStorage | Key-Value Store | Браузер | Все данные клиентов |
| Gemini API | REST API | Google Cloud | AI генерация, агенты |
| n8n Instance | Workflow Engine | Windows localhost:5678 | Автоматизация, интеграции |
| Telethon | Python Library | Windows Python | Парсинг Telegram |
| Vizard API | REST API | Vizard Cloud | Нарезка видео |
| SendPulse API | REST API | SendPulse Cloud | Боты, рассылки |
| Buffer API | REST API | Buffer Cloud | Публикации |
| Meta Graph API | REST API | Meta Cloud | Реклама, статистика |

---

## 3. Схема системы

```
                     DIRECTOR (Browser)
                           │
                           ▼
    ┌──────────────────────────────────────────┐
    │      PRODUCER CENTER  (Netlify CDN)       │
    │  ┌────────────────┐  ┌─────────────────┐  │
    │  │  CRM / UI / UX │  │  Gemini API     │  │
    │  │  localStorage  │  │  callGemini()   │  │
    │  └───────┬────────┘  └────────┬────────┘  │
    └──────────┼────────────────────┼────────────┘
               │ HTTP               │ REST
               ▼                    ▼
    ┌──────────────────┐    ┌─────────────────────┐
    │   n8n Workflows  │    │   Gemini 2.0 Flash   │
    │  Windows :5678   │    │   gemini-2.0-flash   │
    └──┬────┬────┬─────┘    └─────────────────────┘
       │    │    │
       ▼    ▼    ▼
  ┌──────┐ ┌────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐
  │Vizard│ │SendPuls│ │Meta Ads  │ │Buffer  │ │Telegram  │
  │ API  │ │  API   │ │Graph API │ │  API   │ │  API     │
  └──────┘ └────────┘ └──────────┘ └────────┘ └──────────┘
```

---

## 4. Vizard API — полная спецификация

**Base URL:** `https://elb-api.vizard.ai/hvizard-server-front/open-api/v1`

**Заголовки запроса:**
```
Content-Type: application/json
VIZARDAI_API_KEY: {your_key}
```

### Эндпоинты

| Метод | Путь | Назначение |
|-------|------|-----------|
| POST | `/project/create` | Отправить видео на нарезку |
| GET | `/project/query/{id}` | Получить статус и готовые клипы |
| POST | `/project/ai-social` | Сгенерировать AI подпись для клипа |
| POST | `/project/publish-video` | Опубликовать клип с расписанием |
| GET | `/project/social-accounts` | Список подключённых аккаунтов |

### POST /project/create

```json
{
  "videoUrl": "https://drive.google.com/...",
  "videoType": 2,
  "lang": "ru",
  "preferLength": [2],
  "maxClipNumber": 10,
  "ratioOfClip": 4,
  "subtitleSwitch": 1,
  "emojiSwitch": 1,
  "highlightSwitch": 1,
  "headlineSwitch": 1,
  "removeSilenceSwitch": 1
}
```

Параметры `videoType`: `1` = прямая ссылка, `2` = YouTube
Параметры `preferLength`: `[1]` = до 30 сек, `[2]` = 30-60 сек, `[3]` = 60-90 сек
Параметры `ratioOfClip`: `4` = 9:16 (вертикальный для Reels)

### GET /project/query/{id} — Polling

```
Ответ code=1000 → обрабатывается, ждать 5 минут
Ответ code=2000 → готово, в поле videos[] список клипов

Каждый клип:
{
  "videoId": 1001,
  "title": "Как похудеть без диет",
  "videoMsDuration": 47000,
  "viralScore": "9.1",
  "viralReason": "Личная трансформация"
}
```

### POST /project/ai-social

```json
{
  "finalVideoId": 1001,
  "aiSocialPlatform": 3,
  "tone": 1,
  "voice": 0
}
```

`aiSocialPlatform`: `1`=TikTok, `2`=YouTube, `3`=Instagram
`tone`: `1`=Interesting, `2`=Humorous, `3`=Informative

### POST /project/publish-video

```json
{
  "finalVideoId": 1001,
  "post": "Подпись для публикации #хэштег",
  "publishTime": 1719849600000
}
```

`publishTime` — Unix timestamp в миллисекундах

---

## 5. Gemini API — интеграция

**Endpoint:** `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={API_KEY}`

```javascript
async function callGemini(prompt, system = '', key) {
  const text = system ? `${system}\n\n${prompt}` : prompt
  const res = await fetch(`${BASE}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text }] }],
      generationConfig: { maxOutputTokens: 2048 }
    })
  })
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}
```

**Лимиты Free Tier:**
- 1,500 запросов/день
- 32,768 токенов на запрос
- 15 запросов/минуту

---

## 6. n8n — схема воркфлоу

### Воркфлоу 1: Telegram Parser → CRM

```
[Cron: 30 мин] 
   → [Python/Telethon: сканировать чаты]
   → [IF: содержит ключевые слова]
   → [Gemini API: персонализировать сообщение]
   → [Wait: 3 мин]
   → [Telegram API: отправить сообщение]
   → [HTTP Request: POST /api/leads в Producer Center]
   → [Google Sheets: записать лог]
```

### Воркфлоу 2: Google Drive → Vizard → Reels

```
[Google Drive Watch: новый файл в /Подкасты/]
   → [Get File URL]
   → [HTTP POST: Vizard /project/create]
   → [Wait: 20 мин]
   → [HTTP GET: Vizard /project/query/{id}]
   → [IF code=1000: Loop back] / [IF code=2000: Continue]
   → [Loop через clips[]]
      → [HTTP POST: Vizard /project/ai-social]
      → [Set publishTime: startDate + (index × 2 days)]
      → [HTTP POST: Vizard /project/publish-video]
   → [Telegram: уведомить директора]
```

### Воркфлоу 3: Meta Leads Webhook → CRM → Бот

```
[Webhook: Meta Ads новый лид]
   → [Parse: имя, email, телефон]
   → [HTTP POST: создать лид в CRM]
   → [SendPulse API: подписать на цепочку]
   → [Wait: 5 мин]
   → [Gemini API: персональное приветствие]
   → [Telegram: отправить сообщение]
```

### Воркфлоу 4: Еженедельная аналитика

```
[Cron: воскресенье 20:00]
   → [Meta Graph API: статистика рекламы]
   → [Instagram API: метрики постов]
   → [HTTP GET: данные клиентов из Producer Center]
   → [Gemini API: создать отчёт]
   → [Telegram Bot: отправить директору]
   → [HTTP PATCH: обновить метрики в платформе]
```

### Воркфлоу 5: Архив видео → Buffer

```
[Cron: понедельник 10:00 / Manual]
   → [HTTP GET: видео без текстов из Producer Center]
   → [Loop through videos]
      → [Gemini API: создать текст + CTA + хэштеги]
      → [Buffer API: POST /updates/create scheduled_at]
   → [HTTP PATCH: обновить статус видео]
   → [Telegram: уведомление "N видео запланировано"]
```

---

## 7. Хранение данных

| Ключ localStorage | Тип | Содержимое | Ограничение |
|------------------|-----|-----------|------------|
| `pc_biz` | Object JSON | Все данные платформы | ~5MB max |
| `pc_biz.clients` | Array | Профили клиентов | До 50 клиентов |
| `pc_biz.leads` | Array | CRM лиды | До 500 лидов |
| `pc_biz.finance` | Object | Доходы, расходы | Без ограничений |
| `pc_biz.gemKey` | String | Gemini API ключ | — |
| `pc_biz.vizardKey` | String | Vizard API ключ | — |
| `pc_biz.vizState` | Object | Текущий Vizard проект | — |

> ⚠️ **Важно:** localStorage ограничен ~5MB. При большом количестве данных — регулярный экспорт и архивирование.

---

## 8. Деплой

```bash
# Producer Center HTML — деплой на Netlify
# 1. Скачать producer-center.html
# 2. Открыть netlify.com → drag & drop файла
# Получить URL: https://amazing-name-123.netlify.app

# React версия — деплой на Netlify
npm run build
# Папка dist/ → перетащить на netlify.com/drop

# n8n на Windows — запуск
npm install -g n8n
n8n start
# Открыть: http://localhost:5678

# Автозапуск n8n при старте Windows:
# Task Scheduler → Create Task → Action: n8n start
```

---

*AMAImedia.com · Producer Center · Архитектурный план v1.0*
