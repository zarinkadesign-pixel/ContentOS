"""
NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
Copyright (c) 2026 AMAImedia.com
All rights reserved. D:\Content OS\tg_parser.py

Telegram Parser — ищет лидов в чатах и отправляет в n8n webhook
Запуск: python tg_parser.py
"""

import asyncio, json, sys
from telethon import TelegramClient
from telethon.tl.functions.messages import GetHistoryRequest

# ── НАСТРОЙКИ ─────────────────────────────────
API_ID   = 39690892
API_HASH = "49c256e3b000ace4972908fad43380ce"
PHONE    = "+79950176027"

# Webhook URL от n8n (вставишь после создания воркфлоу)
N8N_WEBHOOK = "http://localhost:5678/webhook/tg-parser"

# Чаты для сканирования — вставь username чатов без @
CHATS = [
    "smm_pro",
    "targetolog_club", 
    "online_school_help",
    "marketingrf",
    "kopirayter",
    "content_creators_ru",
    "bloggery_ru",
    "expert_marketing",
    "продам_куплю_услуги",
]

# Ключевые слова — если сообщение содержит одно из них → лид
WORDS = [
    "ищу smm", "нужен smm",
    "ищу маркетолога", "нужен маркетолог",
    "продвижение instagram", "продвижение инстаграм",
    "ищу продюсера", "нужен продюсер",
    "нужен таргетолог", "ищу таргетолога",
    "ищу специалиста", "помогите с рекламой",
    "раскрутить инстаграм", "нужны reels",
]

# Лимит — максимум сообщений в день (антиспам)
DAILY_LIMIT = 40

# ── ПАРСЕР ────────────────────────────────────
sent_today = 0

async def parse_chat(client, chat_username):
    global sent_today
    try:
        entity = await client.get_entity(chat_username)
        messages = await client(GetHistoryRequest(
            peer=entity,
            limit=100,           # последние 100 сообщений
            offset_date=None,
            offset_id=0,
            max_id=0,
            min_id=0,
            add_offset=0,
            hash=0
        ))

        for msg in messages.messages:
            if sent_today >= DAILY_LIMIT:
                print(f"⚠️  Дневной лимит {DAILY_LIMIT} достигнут. Стоп.")
                return

            if not msg.message:
                continue

            text_lower = msg.message.lower()
            matched_keyword = None

            for kw in KEYWORDS:
                if kw in text_lower:
                    matched_keyword = kw
                    break

            if not matched_keyword:
                continue

            # Получаем данные отправителя
            try:
                sender = await client.get_entity(msg.from_id)
                name     = f"{getattr(sender,'first_name','')} {getattr(sender,'last_name','')}".strip()
                username = f"@{sender.username}" if getattr(sender,'username',None) else str(msg.from_id.user_id)
                phone    = getattr(sender, 'phone', '')
            except Exception:
                name     = "Неизвестно"
                username = "—"
                phone    = ""

            lead = {
                "name":    name or "Участник чата",
                "contact": username,
                "phone":   phone,
                "niche":   _detect_niche(msg.message),
                "source":  "telegram",
                "message": msg.message[:200],
                "keyword": matched_keyword,
                "chat":    chat_username,
            }

            print(f"✅ Лид найден: {lead['name']} ({lead['contact']}) — '{matched_keyword}'")

            # Отправляем в n8n webhook
            success = await send_to_n8n(lead)
            if success:
                sent_today += 1
                print(f"   → Отправлено в n8n ({sent_today}/{DAILY_LIMIT})")
                await asyncio.sleep(3)  # пауза 3 сек между отправками

    except Exception as e:
        print(f"❌ Ошибка в чате @{chat_username}: {e}")


def _detect_niche(text):
    text = text.lower()
    niches = {
        "нутрициолог": "Нутрициология",
        "коуч":        "Коучинг",
        "психолог":    "Психология",
        "фитнес":      "Фитнес",
        "йога":        "Йога",
        "онлайн школ": "Онлайн-школа",
        "эксперт":     "Экспертный бизнес",
        "маркетинг":   "Маркетинг",
        "бизнес":      "Бизнес",
    }
    for key, niche in niches.items():
        if key in text:
            return niche
    return "Не определена"


async def send_to_n8n(lead: dict) -> bool:
    try:
        import urllib.request
        data = json.dumps(lead).encode("utf-8")
        req  = urllib.request.Request(
            N8N_WEBHOOK,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status == 200
    except Exception as e:
        print(f"   ⚠️  n8n недоступен: {e} (лид не добавлен в CRM)")
        return False


async def main():
    print("="*50)
    print("  Telegram Parser — AMAImedia Producer Center")
    print("="*50)
    print(f"  Чатов для сканирования: {len(CHATS)}")
    print(f"  Ключевых слов: {len(KEYWORDS)}")
    print(f"  Дневной лимит: {DAILY_LIMIT}")
    print("="*50)

    if PHONE == "+7":
        print("\n⚠️  ВАЖНО: вставь свой номер телефона в переменную PHONE!")
        print("  Например: PHONE = '+79161234567'")
        sys.exit(1)

    async with TelegramClient("producer_center_session", API_ID, API_HASH) as client:
        await client.start(phone=PHONE)
        print(f"\n✅ Telegram подключён\n")

        for chat in CHATS:
            print(f"\n🔍 Сканирую @{chat}...")
            await parse_chat(client, chat)
            await asyncio.sleep(5)  # пауза между чатами

        print(f"\n✅ Готово. Найдено и отправлено лидов: {sent_today}")


if __name__ == "__main__":
    asyncio.run(main())
