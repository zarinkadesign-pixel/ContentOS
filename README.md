# 🏠 Astana Rent Bot v3

> Автоматизированная Telegram-платформа аренды недвижимости для Астаны

[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://python.org)
[![aiogram](https://img.shields.io/badge/aiogram-3.7-blue)](https://docs.aiogram.dev)
[![Railway](https://img.shields.io/badge/Deploy-Railway-black?logo=railway)](https://railway.app)
[![License](https://img.shields.io/badge/License-Proprietary-red)](https://amaimedia.com)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)]()

**Канал:** [@uztelhome](https://t.me/uztelhome) · **Стек:** Python · aiogram · Google Sheets · Railway · Claude AI

---

## 📋 Описание

Astana Rent Bot — полностью автоматизированный маркетплейс аренды в Telegram. Арендодатели подают объявления через 14-шаговый мастер, бот модерирует и публикует их в канале, подбирает риелторов для арендаторов, отслеживает комиссии и каждый день отправляет Excel-отчёт — без ручного управления и без затрат на инфраструктуру (Google Sheets как база данных).

---

## ✨ Возможности

| Функция | Описание |
|--------|----------|
| 📝 **14-шаговый FSM** | Мастер подачи объявления с загрузкой фото |
| ✅ **Модерация** | Одним нажатием — одобрить / отклонить |
| 📣 **Рандомный постинг** | Публикация в заданное активное время суток с дневным лимитом |
| 🤖 **AI-поиск** | Запрос на русском → Claude Haiku → фильтры → топ-5 объявлений |
| 📱 **Mini App** | Мобильный каталог прямо в Telegram |
| 👔 **Система риелторов** | Регистрация, рейтинг, автоназначение, нарушения, заморозка, бан |
| 💰 **Комиссии** | Авторасчёт 60/40 (платформа / риелтор) |
| 📊 **Excel-отчёт** | Ежедневно в 09:00 Астана — таблица с цветовой кодировкой |
| 🚀 **Railway деплой** | Google SA закодирован в Base64 — один env-ключ |

---

## 🗂 Структура проекта

```
astana_v3/
├── main.py                  # Точка входа: Bot, Dispatcher, APScheduler, aiohttp
├── requirements.txt
├── .env.example             # Шаблон переменных окружения
├── core/
│   ├── config.py            # Frozen-конфиг из env-переменных
│   └── models.py            # Listing, Realtor, Lead, Settlement + Enum-ы
├── bot/
│   ├── landlord_fsm.py      # FSM 14 шагов: подача объявления
│   ├── admin_handlers.py    # /stats /pending approve/reject
│   ├── tenant_handlers.py   # /start поиск бронирование риелторы
│   └── ai_search.py         # Claude API → SearchFilter → результаты
├── sheets/
│   └── repository.py        # SheetRepo: весь I/O в Google Sheets + retry
├── poster/
│   └── scheduler.py         # RandomScheduler: очередь публикаций
├── export/
│   └── excel_exporter.py    # 3-листовой .xlsx в памяти
├── deploy/
│   ├── encode_sa.py         # Кодирует service_account.json → Base64
│   └── railway.toml         # Railway конфиг деплоя
└── miniapp/
    └── index.html           # Single-file Mini App (aiohttp)
```

---

## ⚙️ Технологии

| Слой | Технология | Версия |
|------|-----------|--------|
| Язык | Python | 3.11 |
| Telegram | aiogram | 3.7.0 |
| Планировщик | APScheduler | 3.10.4 |
| База данных | Google Sheets (gspread) | 6 |
| Auth | google-auth | 2.29.0 |
| HTTP | httpx | 0.27.0 |
| Web-сервер | aiohttp | 3.9.5 |
| Отчёты | openpyxl | 3.1.2 |
| Логи | loguru | 0.7.2 |
| Retry | tenacity | 8.3.0 |
| AI-поиск | Claude Haiku (Anthropic) | — |
| Хостинг | Railway.app | 500 ч/мес бесплатно |

---

## 🚀 Быстрый старт

### 1. Клонирование и установка

```bash
git clone https://github.com/zarinkadesign-pixel/astana-rent-bot.git
cd astana-rent-bot
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### 2. Настройка `.env`

```bash
cp .env.example .env
```

Заполни обязательные поля:

```env
BOT_TOKEN=            # @BotFather → /newbot
CHANNEL_ID=           # ID канала (отрицательное число)
SPREADSHEET_ID=       # ID Google Таблицы (из URL)
ADMIN_IDS=            # Telegram user_id администратора
CLAUDE_API_KEY=       # console.anthropic.com → API Keys
```

### 3. Google Service Account

1. [console.cloud.google.com](https://console.cloud.google.com) → включи **Sheets API** и **Drive API**
2. Создай Service Account → скачай JSON
3. Положи файл в `secrets/service_account.json`
4. Открой Google Таблицу → нажми **Поделиться** → добавь `client_email` из JSON с ролью **Редактор**

### 4. Запуск

```bash
python main.py
```

Google Sheets листы создаются автоматически при первом запуске.

---

## ☁️ Деплой на Railway

```bash
# Шаг 1 — закодируй service account
python deploy\encode_sa.py secrets\service_account.json
# Скопируй вывод Base64

# Шаг 2 — загрузи на GitHub (уже сделано ✅)

# Шаг 3 — railway.app → New Project → Deploy from GitHub
# Шаг 4 — Variables → добавь все переменные из .env + GOOGLE_SA_B64
# Шаг 5 — Settings → Domain → скопируй URL → вставь как MINIAPP_URL
```

---

## 🤖 Команды бота

### Арендодатель
| Команда | Описание |
|---------|----------|
| `/addlisting` | Начать 14-шаговый мастер подачи объявления |
| `/rented` | Отметить квартиру как сданную |
| `/cancel` | Отменить текущий ввод |

### Администратор
| Команда | Описание |
|---------|----------|
| `/stats` | Сводка: объявления, риелторы |
| `/pending` | До 5 объявлений на модерацию с кнопками Одобрить / Отклонить |

### Арендатор
| Команда | Описание |
|---------|----------|
| `/start` | Главное меню: Mini App, AI-поиск, бронирование |
| `search:start` | AI-поиск: запрос на русском → Claude → фильтры → результаты |

---

## 📊 AI-поиск

Арендатор пишет запрос на русском языке:

> *«2-комнатная до 200 000, район Есиль, не первый этаж»*

Claude Haiku преобразует его в структурированный фильтр:

```json
{
  "rooms": 2,
  "price_max": 200000,
  "district": "Есиль",
  "floor_min": 2
}
```

Если API недоступен — автоматически подключается локальный regex-парсер.

---

## 📈 Автоматические задачи (APScheduler)

| Задача | Триггер | Действие |
|--------|---------|----------|
| `post` | каждые 15 мин | Публикует объявления в канал |
| `cache` | каждый час | Обновляет кеш из Google Sheets |
| `violations` | каждый час | Проверяет нарушения риелторов |
| `unfreeze` | каждые 6 часов | Снимает истёкшие заморозки |
| `daily_report` | 09:00 (+UTC5) | Excel-отчёт всем администраторам |

---

## 🔒 Безопасность

- `.env` и `secrets/` исключены из git через `.gitignore`
- Google SA передаётся через Railway как Base64 env-переменная
- PAT GitHub хранится только в `~/.git-credentials` (не в коде)

---

## 📄 Лицензия

Copyright © 2026 [AMAImedia.com](https://amaimedia.com) · All rights reserved · Proprietary