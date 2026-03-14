# 🏠 Astana Rent Bot v3

[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://python.org)
[![aiogram](https://img.shields.io/badge/aiogram-3.4.1-blue)](https://docs.aiogram.dev)
[![Railway](https://img.shields.io/badge/Deploy-Railway-black?logo=railway)](https://railway.app)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)]()

**Канал:** [@uztelhome](https://t.me/uztelhome)  
**Стек:** Python 3.11 · aiogram · Google Sheets · Railway · Claude AI

---

## Что делает бот

Полностью автоматизированный маркетплейс аренды квартир в Астане через Telegram.

- Арендодатель заполняет анкету → ты одобряешь одной кнопкой → бот публикует в канал
- Арендатор пишет запрос → AI подбирает варианты → записывается на просмотр
- Бот назначает риелтора → риелтор едет на встречу → фиксирует сделку
- Система считает комиссию 60/40 и отправляет тебе отчёт каждое утро

Твоё участие: 10 минут в день.

---

## Возможности

| Функция | Описание |
|--------|----------|
| 📝 Анкета арендодателя | 13 шагов FSM с загрузкой фото |
| ✅ Модерация | Одобрить / отклонить одной кнопкой |
| 📣 Рандомный постинг | Публикация с 09:00 до 21:00, интервал 1–4 ч |
| 🤖 AI-поиск | Запрос на русском → Claude Haiku → топ-5 |
| 📱 Mini App | Мобильный каталог прямо в Telegram |
| 👔 Риелторы | Регистрация, рейтинг, назначение, нарушения, бан |
| 💰 Комиссии | Авторасчёт 60% платформа / 40% риелтор |
| 📊 Excel-отчёт | Ежедневно в 09:00 по Астане |

---

## Структура

```
astana-rent-bot/
├── main.py                  # Точка входа
├── requirements.txt
├── nixpacks.toml            # Railway: Python 3.11
├── .env.example
├── core/
│   ├── config.py            # Конфиг из env
│   └── models.py            # Listing, Realtor, Lead, Settlement
├── bot/
│   ├── landlord_fsm.py      # Анкета арендодателя
│   ├── admin_handlers.py    # Модерация
│   ├── tenant_handlers.py   # Поиск и бронирование
│   └── ai_search.py         # Claude API + regex fallback
├── sheets/
│   └── repository.py        # Google Sheets I/O
├── poster/
│   └── scheduler.py         # Рандомный планировщик
├── export/
│   └── excel_exporter.py    # .xlsx отчёт
├── deploy/
│   ├── encode_sa.py         # JSON → Base64
│   └── railway.toml
└── miniapp/
    └── index.html           # Каталог квартир
```

---

## Быстрый старт

### 1. Клонирование

```bash
git clone https://github.com/zarinkadesign-pixel/astana-rent-bot.git
cd astana-rent-bot
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Переменные окружения

```bash
cp .env.example .env
```

Обязательные:

```
BOT_TOKEN=            # @BotFather
CHANNEL_ID=           # ID канала (отрицательное)
SPREADSHEET_ID=       # ID Google Таблицы
ADMIN_IDS=            # Твой Telegram ID
```

### 3. Google Service Account

1. console.cloud.google.com → включи Sheets API + Drive API
2. Создай Service Account → скачай JSON → положи в `secrets/service_account.json`
3. Открой таблицу → Поделиться → добавь `client_email` из JSON → роль Редактор

### 4. Запуск

```bash
python main.py
```

---

## Деплой на Railway

```bash
# Закодируй service account
python deploy/encode_sa.py secrets/service_account.json
# Скопируй Base64-строку → вставь в Railway Variables как GOOGLE_SA_B64
```

Railway Variables (все обязательные):

| Переменная | Значение |
|-----------|---------|
| BOT_TOKEN | токен от @BotFather |
| CHANNEL_ID | -1003790101406 |
| ADMIN_IDS | 905075336 |
| SPREADSHEET_ID | ID таблицы |
| GOOGLE_SA_B64 | Base64 строка |

---

## Команды бота

| Команда | Кто | Описание |
|---------|-----|----------|
| `/start` | все | Главное меню |
| `/addlisting` | арендодатель | Подать объявление |
| `/rented` | арендодатель | Отметить как сдано |
| `/stats` | админ | Статистика |
| `/pending` | админ | Объявления на модерации |

---

## Автоматические задачи

| Задача | Когда | Что делает |
|--------|-------|-----------|
| post | каждые 15 мин | Публикует объявления |
| violations | каждый час | Проверяет нарушения риелторов |
| unfreeze | каждые 6 часов | Снимает истёкшие заморозки |
| daily_report | 09:00 (+UTC5) | Excel-отчёт администратору |

---

## Лицензия

Copyright © 2026 [AMAImedia.com](https://amaimedia.com) · All rights reserved
