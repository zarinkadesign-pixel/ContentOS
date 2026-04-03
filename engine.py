"""
NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
Copyright (c) 2026 AMAImedia.com
All rights reserved.
D:/Content OS/engine.py — Autonomous Engine v4.0
"""
import threading
import time
import json
import os
import sys
import signal
import urllib.request
import urllib.error
from datetime import datetime, timedelta

# Fix Windows console encoding so Russian text doesn't crash the engine
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

BASE       = os.path.dirname(os.path.abspath(__file__))
LOG_FILE   = os.path.join(BASE, "logs", "engine.log")
STATE_FILE = os.path.join(BASE, "pc_data", "engine_state.json")


# ── Load .env file ────────────────────────────────────────────────────────────

def _load_env() -> None:
    """Load key=value pairs from .env into os.environ (only if not already set)."""
    env_path = os.path.join(BASE, ".env")
    if not os.path.exists(env_path):
        return
    try:
        with open(env_path, encoding="utf-8") as f:
            for raw in f:
                line = raw.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, val = line.partition("=")
                key = key.strip()
                val = val.strip().strip('"').strip("'")
                if key and key not in os.environ:
                    os.environ[key] = val
    except Exception as exc:
        print(f"[engine] .env load error: {exc}")


_load_env()

GEMINI_KEY = os.environ.get("GEMINI_KEY", "")
BOT_TOKEN  = os.environ.get("BOT_TOKEN",  "")
CHAT_ID    = os.environ.get("CHAT_ID",    "")
VIZARD_KEY = os.environ.get("VIZARD_KEY", "")


# ── Global engine state ───────────────────────────────────────────────────────

ENGINE_STATE: dict = {
    "running": False,
    "started_at": "",
    "tasks": {},
    "events": [],
    "agents": {
        "hunter":    {"status": "idle", "today": 0, "total": 0},
        "salesman":  {"status": "idle", "today": 0, "total": 0},
        "scorer":    {"status": "idle", "today": 0, "total": 0},
        "nurture":   {"status": "idle", "today": 0, "total": 0},
        "publisher": {"status": "idle", "today": 0, "total": 0},
        "analyst":   {"status": "idle", "today": 0, "total": 0},
        "strategist":{"status": "idle", "today": 0, "total": 0},
    },
    "stats": {
        "leads_today": 0,
        "messages_sent": 0,
        "content_published": 0,
        "calls_scheduled": 0,
        "revenue_today": 0,
    },
}

_state_lock   = threading.Lock()
_running_lock = threading.Lock()
_TASK_RUNNING: dict = {}   # task_name -> bool, prevents concurrent execution


# ── Helpers ───────────────────────────────────────────────────────────────────

def log(msg: str, level: str = "INFO") -> None:
    ts = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}] [{level}] {msg}"
    try:
        print(line)
    except UnicodeEncodeError:
        print(line.encode("ascii", "replace").decode("ascii"))
    try:
        os.makedirs(os.path.join(BASE, "logs"), exist_ok=True)
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception as exc:
        try:
            print(f"[log] write error: {exc}")
        except UnicodeEncodeError:
            pass
    with _state_lock:
        ENGINE_STATE["events"].insert(0, {"time": ts, "msg": msg, "level": level})
        ENGINE_STATE["events"] = ENGINE_STATE["events"][:100]
    save_state()


def save_state() -> None:
    try:
        os.makedirs(os.path.join(BASE, "pc_data"), exist_ok=True)
        with _state_lock:
            snapshot = json.dumps(ENGINE_STATE, ensure_ascii=False, indent=2)
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            f.write(snapshot)
    except Exception as exc:
        print(f"[save_state] error: {exc}")


def _restore_state() -> None:
    """On startup: restore tasks.last_run from saved state so intervals are respected."""
    if not os.path.exists(STATE_FILE):
        return
    try:
        with open(STATE_FILE, encoding="utf-8") as f:
            saved = json.load(f)
        if saved.get("tasks"):
            ENGINE_STATE["tasks"].update(saved["tasks"])
        # Preserve accumulated agent totals across restarts
        for key, agent in saved.get("agents", {}).items():
            if key in ENGINE_STATE["agents"]:
                ENGINE_STATE["agents"][key]["total"] = agent.get("total", 0)
        log("State restored from previous session", "ENGINE")
    except Exception as exc:
        log(f"State restore skipped: {exc}", "INFO")


def gemini(prompt: str, system: str = "") -> str:
    if not GEMINI_KEY:
        log("GEMINI_KEY not set — skipping AI call", "WARN")
        return ""
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.0-flash:generateContent?key={GEMINI_KEY}"
    )
    full = (system + "\n\n" + prompt) if system else prompt
    body = json.dumps({
        "contents": [{"role": "user", "parts": [{"text": full}]}],
        "generationConfig": {"maxOutputTokens": 1200},
    }).encode()
    req = urllib.request.Request(url, body, {"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read())["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as exc:
        log(f"Gemini error: {exc}", "ERROR")
        return ""


def tg_notify(text: str) -> None:
    if not BOT_TOKEN or not CHAT_ID:
        log("BOT_TOKEN/CHAT_ID not set — skipping Telegram notify", "WARN")
        return
    try:
        body = json.dumps({"chat_id": CHAT_ID, "text": text}).encode()
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
            body, {"Content-Type": "application/json"},
        )
        urllib.request.urlopen(req, timeout=10)
    except Exception as exc:
        log(f"Telegram error: {exc}", "ERROR")


def load_leads() -> list:
    path = os.path.join(BASE, "pc_data", "leads.json")
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def save_leads(leads: list) -> None:
    path = os.path.join(BASE, "pc_data", "leads.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(leads, f, ensure_ascii=False, indent=2)


def load_clients() -> list:
    path = os.path.join(BASE, "pc_data", "clients.json")
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def load_queue() -> list:
    path = os.path.join(BASE, "pc_data", "content_queue.json")
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def save_queue(q: list) -> None:
    path = os.path.join(BASE, "pc_data", "content_queue.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(q, f, ensure_ascii=False, indent=2)


# ── Tasks ─────────────────────────────────────────────────────────────────────

def task_hunter() -> None:
    """Every 30 min — qualify leads pipeline, activate hot leads."""
    log("Охотник проверяет лидов...", "HUNTER")
    ENGINE_STATE["agents"]["hunter"]["status"] = "working"
    save_state()

    leads = load_leads()
    activated = 0
    for lead in leads:
        # Promote scored hot leads from new → active
        if lead.get("score", 0) >= 80 and lead.get("stage") == "new":
            lead["stage"] = "active"
            activated += 1
            log(f"Охотник активировал горячего лида: {lead.get('name','?')} score={lead.get('score')}", "HUNTER")
        # Move nurtured leads to done if all 7 days passed
        if lead.get("stage") == "nurture" and lead.get("nurture_day", 0) >= 7:
            lead["stage"] = "done_nurture"

    if activated:
        save_leads(leads)
        tg_notify(f"🔍 Охотник активировал {activated} горячих лидов для проработки!")

    unscored = sum(1 for l in leads if l.get("score") is None)
    ENGINE_STATE["agents"]["hunter"]["today"] += 1
    ENGINE_STATE["agents"]["hunter"]["total"] += 1
    ENGINE_STATE["agents"]["hunter"]["status"] = "idle"
    log(f"Охотник завершил: {len(leads)} лидов, {unscored} без оценки, {activated} активировано", "HUNTER")
    save_state()


def task_salesman() -> None:
    """Every 15 min — generate first contact message for uncontacted scored leads."""
    leads = load_leads()
    changed = False

    for lead in leads:
        # Only process new leads with a score that haven't been contacted yet
        if lead.get("stage") != "new":
            continue
        if lead.get("first_contact_sent"):
            continue
        score = lead.get("score", 0)
        if not score or score < 30:
            continue

        ENGINE_STATE["agents"]["salesman"]["status"] = "working"
        save_state()

        msg = gemini(
            f"Напиши персональное первое сообщение лиду от имени Зарины.\n"
            f"Имя лида: {lead.get('name','?')}\n"
            f"Ниша: {lead.get('niche','?')}\n"
            f"Источник: {lead.get('source','?')}\n"
            f"Агентство AMAImedia — продюсерский центр для экспертов и предпринимателей.\n"
            f"Задача: завязать разговор, не продавать. 2-3 живых предложения.",
            "Ты менеджер по продажам. Первое касание — интересуйся, не продавай.",
        )

        if msg:
            lead["first_contact_sent"] = datetime.now().strftime("%Y-%m-%d %H:%M")
            lead["first_contact_msg"] = msg
            if score >= 50:
                lead["stage"] = "nurture"
            changed = True
            ENGINE_STATE["agents"]["salesman"]["today"] += 1
            ENGINE_STATE["agents"]["salesman"]["total"] += 1
            ENGINE_STATE["stats"]["messages_sent"] += 1
            log(f"Продажник: первый контакт → {lead.get('name','?')} (score {score})", "SALESMAN")

        ENGINE_STATE["agents"]["salesman"]["status"] = "idle"
        break  # one contact at a time to avoid spam

    if changed:
        save_leads(leads)
    ENGINE_STATE["agents"]["salesman"]["status"] = "idle"
    save_state()


def task_daily_briefing() -> None:
    """09:00 — morning briefing to Zarina."""
    log("Генерирую утренний брифинг...", "TASK")
    ENGINE_STATE["agents"]["analyst"]["status"] = "working"
    save_state()

    leads = load_leads()
    clients = load_clients()
    hot = [l for l in leads if l.get("score", 0) >= 70]
    new_today = [l for l in leads if l.get("date") == datetime.now().strftime("%d.%m")]

    briefing = gemini(
        f"Утренний брифинг для директора агентства AMAImedia.\n"
        f"Данные: лидов всего {len(leads)}, горячих {len(hot)}, "
        f"новых сегодня {len(new_today)}, клиентов {len(clients)}.\n"
        f"Дай: 1) Топ-3 задачи на сегодня 2) На кого обратить внимание "
        f"3) Прогноз дня. Кратко, конкретно, 5-7 строк.",
        "Ты AI-директор агентства. Пиши кратко и по делу.",
    )

    if briefing:
        tg_notify(f"☀️ Доброе утро! Брифинг дня:\n\n{briefing}")
        log("Брифинг отправлен", "ANALYST")

    ENGINE_STATE["agents"]["analyst"]["status"] = "idle"
    ENGINE_STATE["agents"]["analyst"]["today"] += 1
    ENGINE_STATE["agents"]["analyst"]["total"] += 1
    save_state()


def task_lead_scoring() -> None:
    """Every 15 min — AI score unscored leads."""
    leads = load_leads()
    updated = False

    for lead in leads:
        if lead.get("score") is not None:
            continue
        if not (lead.get("notes") or lead.get("niche")):
            continue

        ENGINE_STATE["agents"]["scorer"]["status"] = "working"
        save_state()

        score_resp = gemini(
            f"Ты эксперт по квалификации лидов для SMM агентства AMAImedia.\n"
            f"Оцени лида от 0 до 100. Ответь ТОЛЬКО в этом формате:\n"
            f"SCORE: [число]\n"
            f"ПРИЧИНА: [одно предложение почему такой балл]\n"
            f"ПРОДУКТ: [аудит/мини-курс/наставничество/продюсирование]\n\n"
            f"Данные лида:\n"
            f"Имя: {lead.get('name','?')}\n"
            f"Ниша: {lead.get('niche','?')}\n"
            f"Источник: {lead.get('source','?')}\n"
            f"Заметки: {lead.get('notes','—')}\n\n"
            f"Критерии:\n"
            f"+30 если есть бюджет или уже платит за что-то\n"
            f"+25 если боль совпадает с нашими продуктами\n"
            f"+20 если хочет действовать быстро\n"
            f"+15 если открыт к новому\n"
            f"+10 если активно общается"
        )

        score = 50
        reason = ""
        product = "наставничество"
        for line in score_resp.split("\n"):
            if "SCORE:" in line:
                try:
                    score = max(0, min(100, int("".join(c for c in line.split(":")[-1][:5] if c.isdigit()))))
                except Exception:
                    pass
            elif "ПРИЧИНА:" in line:
                reason = line.split(":", 1)[-1].strip()
            elif "ПРОДУКТ:" in line:
                product = line.split(":", 1)[-1].strip()

        lead["score"] = score
        lead["score_reason"] = reason
        lead["recommended_product"] = product
        updated = True
        ENGINE_STATE["agents"]["scorer"]["today"] += 1
        ENGINE_STATE["agents"]["scorer"]["total"] += 1
        ENGINE_STATE["stats"]["leads_today"] += 1
        log(f"Скоринг: {lead.get('name','?')} = {score} → {product}", "SCORER")

        if score >= 80:
            tg_notify(
                f"🔥 ГОРЯЧИЙ ЛИД! Score: {score}\n"
                f"Имя: {lead.get('name','?')}\n"
                f"Ниша: {lead.get('niche','?')}\n"
                f"Контакт: {lead.get('contact','?')}\n"
                f"Рекомендую: {product}\n"
                f"Почему: {reason}\n\n"
                f"Позвони сегодня!"
            )
            log(f"Горячий лид → уведомление: {lead.get('name','?')}", "HOT")

    if updated:
        save_leads(leads)

    ENGINE_STATE["agents"]["scorer"]["status"] = "idle"
    save_state()


def task_nurture_sequence() -> None:
    """Every 60 min — send day N nurture message to leads in nurture stage."""
    leads = load_leads()
    now = datetime.now()
    changed = False

    DAY_TEMPLATES = {
        0: "знакомство — кто такая Зарина, история, результаты клиентов AMAImedia",
        1: "боль — описать проблему лида его словами (отсутствие системы, выгорание)",
        2: "решение — система AMAImedia которая работает 24/7 без участия человека",
        3: "кейс — конкретные цифры клиента из похожей ниши",
        4: "тест — 3 диагностических вопроса которые раскрывают боль",
        5: "приглашение на бесплатный разбор аккаунта",
        6: "финальный оффер с 3 вариантами пакетов и дедлайном 48 часов",
    }

    for lead in leads:
        if lead.get("stage") != "nurture" or lead.get("score", 0) < 50:
            continue

        nurture_day = lead.get("nurture_day", 0)
        last_nurture = lead.get("last_nurture", "")

        if nurture_day >= 7:
            lead["stage"] = "done_nurture"
            changed = True
            continue

        if last_nurture:
            try:
                last_dt = datetime.strptime(last_nurture, "%Y-%m-%d %H:%M")
                if (now - last_dt).total_seconds() < 86400:
                    continue
            except Exception:
                pass

        ENGINE_STATE["agents"]["nurture"]["status"] = "working"
        save_state()

        template = DAY_TEMPLATES.get(nurture_day, "следующий шаг в прогреве")
        msg = gemini(
            f"Напиши сообщение для прогрева лида. День {nurture_day + 1} из 7.\n"
            f"Тема: {template}\n"
            f"Ниша лида: {lead.get('niche', 'не указана')}\n"
            f"Агентство: AMAImedia — продюсерский центр для экспертов\n"
            f"Продукты: аудит $150, мини-курс $97, наставничество $1500, продюсирование $3000\n"
            f"Стиль: живой, человеческий, без давления. 3-5 предложений.",
            "Ты копирайтер агентства. Пиши как живой человек.",
        )

        if msg:
            lead["nurture_day"] = nurture_day + 1
            lead["last_nurture"] = now.strftime("%Y-%m-%d %H:%M")
            changed = True
            ENGINE_STATE["agents"]["nurture"]["today"] += 1
            ENGINE_STATE["agents"]["nurture"]["total"] += 1
            ENGINE_STATE["stats"]["messages_sent"] += 1
            log(f"Прогрев день {nurture_day + 1}: {lead.get('name', '?')}", "NURTURE")

        ENGINE_STATE["agents"]["nurture"]["status"] = "idle"

    if changed:
        save_leads(leads)
    save_state()


def task_content_publish() -> None:
    """Every 2 hours at 10:00 — publish next queued clip via Vizard."""
    queue = load_queue()
    now = datetime.now()
    published = False

    for item in queue:
        if item.get("status") != "scheduled":
            continue
        try:
            sched = datetime.strptime(item["scheduled_date"], "%Y-%m-%d")
        except Exception:
            continue
        if sched.date() > now.date():
            continue

        ENGINE_STATE["agents"]["publisher"]["status"] = "working"
        save_state()

        clip_id = item.get("vizard_clip_id")
        if clip_id:
            try:
                pub_ms = int(now.timestamp() * 1000)
                data = json.dumps({
                    "finalVideoId": clip_id,
                    "post": item.get("caption", ""),
                    "publishTime": pub_ms,
                }).encode()
                headers = {
                    "VIZARDAI_API_KEY": VIZARD_KEY,
                    "Content-Type": "application/json",
                }
                req = urllib.request.Request(
                    "https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/publish-video",
                    data, headers,
                )
                urllib.request.urlopen(req, timeout=15)
                item["status"] = "published"
                item["published_at"] = now.strftime("%Y-%m-%d %H:%M")
                ENGINE_STATE["agents"]["publisher"]["today"] += 1
                ENGINE_STATE["agents"]["publisher"]["total"] += 1
                ENGINE_STATE["stats"]["content_published"] += 1
                log(f"Опубликовано: {item.get('title', 'клип')[:50]}", "PUBLISHER")
                tg_notify(f"📤 Клип опубликован!\n{item.get('title','?')}\nViral score: {item.get('viral_score','?')}")
            except Exception as exc:
                item["status"] = "error"
                item["error"] = str(exc)
                log(f"Ошибка публикации: {exc}", "ERROR")

        ENGINE_STATE["agents"]["publisher"]["status"] = "idle"
        published = True
        break  # one at a time

    if published:
        save_queue(queue)
    save_state()


def task_weekly_report() -> None:
    """Sunday 20:00 — weekly summary."""
    leads = load_leads()
    clients = load_clients()
    hot = len([l for l in leads if l.get("score", 0) >= 70])

    ENGINE_STATE["agents"]["analyst"]["status"] = "working"
    save_state()

    report = gemini(
        f"Недельный отчёт для директора агентства AMAImedia.\n"
        f"Лидов: {len(leads)} (горячих: {hot})\n"
        f"Клиентов: {len(clients)}\n"
        f"Опубликовано клипов: {ENGINE_STATE['stats']['content_published']}\n\n"
        f"Дай: 1) Итоги недели 2) Что хорошо 3) Что улучшить "
        f"4) ТОП-3 задачи на следующую неделю. Кратко.",
        "Ты стратегический директор. Пиши конкретно с цифрами.",
    )

    if report:
        tg_notify(f"📊 НЕДЕЛЬНЫЙ ОТЧЁТ:\n\n{report}")
        log("Недельный отчёт отправлен", "ANALYST")

    ENGINE_STATE["agents"]["analyst"]["status"] = "idle"
    ENGINE_STATE["agents"]["analyst"]["today"] += 1
    ENGINE_STATE["agents"]["analyst"]["total"] += 1
    save_state()


def task_weekly_strategy() -> None:
    """Monday 08:00 — weekly plan."""
    leads = load_leads()

    ENGINE_STATE["agents"]["strategist"]["status"] = "working"
    save_state()

    hot_leads = sorted(
        [l for l in leads if l.get("score", 0) >= 60],
        key=lambda x: x.get("score", 0), reverse=True,
    )[:5]

    names = ", ".join(
        f"{l.get('name','?')} (score:{l.get('score',0)})" for l in hot_leads
    ) or "нет горячих"

    strategy = gemini(
        f"Создай план на неделю для SMM агентства AMAImedia.\n"
        f"Горячих лидов: {len(hot_leads)}\n"
        f"Топ лиды: {names}\n\n"
        f"Дай: 1) ТОП-3 лида для проработки 2) Темы контента на неделю "
        f"3) Рекламный тест 4) KPI цели. Конкретно.",
        "Ты стратег. Давай чёткие приоритеты.",
    )

    if strategy:
        tg_notify(f"🎯 ПЛАН НА НЕДЕЛЮ:\n\n{strategy}")
        log("Стратегия на неделю отправлена", "STRATEGIST")

    ENGINE_STATE["agents"]["strategist"]["status"] = "idle"
    ENGINE_STATE["agents"]["strategist"]["today"] += 1
    ENGINE_STATE["agents"]["strategist"]["total"] += 1
    save_state()


def enrich_lead(lead: dict) -> dict:
    """Enrich a single lead with AI-inferred data about their niche and approach."""
    name    = lead.get("name", "")
    niche   = lead.get("niche", "")
    contact = lead.get("contact", "")
    if not any([name, niche, contact]):
        return lead
    enriched = gemini(
        f"Помоги обогатить данные о потенциальном клиенте AMAImedia.\n"
        f"Имя: {name}, Ниша: {niche}, Контакт: {contact}\n\n"
        f"Предположи на основе ниши:\n"
        f"1. Средний чек продукта в этой нише ($)\n"
        f"2. Главная боль экспертов в этой нише\n"
        f"3. Какой продукт AMAImedia подходит (аудит/мини-курс/наставничество/продюсирование)\n"
        f"4. Лучший способ начать первый разговор\n"
        f"Ответь кратко, по пунктам."
    )
    if enriched:
        lead["enrichment"] = enriched
        lead["enriched_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    return lead


def task_enrich_leads() -> None:
    """Every 4 hours — enrich leads that have no enrichment data yet."""
    leads = load_leads()
    changed = False
    count = 0
    for lead in leads:
        if lead.get("enrichment"):
            continue
        if not (lead.get("niche") or lead.get("name")):
            continue
        lead = enrich_lead(lead)
        if lead.get("enrichment"):
            changed = True
            count += 1
            log(f"Обогащён лид: {lead.get('name','?')}", "HUNTER")
        if count >= 5:
            break  # max 5 per run to respect Gemini quota
    if changed:
        save_leads(leads)
    log(f"Обогащение завершено: {count} лидов обработано", "HUNTER")


def task_multiplatform_publish() -> None:
    """Every 2 hours at 10:00 — publish via n8n to all configured platforms."""
    queue = load_queue()
    now = datetime.now()

    for item in queue:
        if item.get("status") != "scheduled":
            continue
        try:
            sched = datetime.strptime(item["scheduled_date"], "%Y-%m-%d")
        except Exception:
            continue
        if sched.date() > now.date():
            continue

        ENGINE_STATE["agents"]["publisher"]["status"] = "working"
        save_state()

        try:
            data = json.dumps({
                "clip_url":  item.get("video_url", ""),
                "caption":   item.get("caption", ""),
                "hashtags":  item.get("hashtags", []),
                "platforms": item.get("platforms", ["telegram"]),
                "title":     item.get("title", ""),
            }).encode()
            req = urllib.request.Request(
                "http://localhost:5678/webhook/publish-content",
                data, {"Content-Type": "application/json"},
            )
            urllib.request.urlopen(req, timeout=15)

            item["status"] = "published"
            item["published_at"] = now.strftime("%Y-%m-%d %H:%M")
            ENGINE_STATE["agents"]["publisher"]["today"] += 1
            ENGINE_STATE["agents"]["publisher"]["total"] += 1
            ENGINE_STATE["stats"]["content_published"] += 1
            platforms = ", ".join(item.get("platforms", ["?"]))
            log(f"Мультиплатформа: {item.get('title','?')[:40]} → {platforms}", "PUBLISHER")
            tg_notify(f"📤 Опубликовано!\n{item.get('title','?')}\nПлатформы: {platforms}")
        except Exception as exc:
            item["status"] = "error"
            item["error"] = str(exc)
            log(f"Ошибка мультиплатформенной публикации: {exc}", "ERROR")

        ENGINE_STATE["agents"]["publisher"]["status"] = "idle"
        save_queue(queue)
        save_state()
        break  # one at a time


# ── Scheduler ─────────────────────────────────────────────────────────────────

# (name, function, interval_minutes, required_hour_or_None, required_weekday_or_None)
SCHEDULE = [
    ("daily_briefing",       task_daily_briefing,       1440,  9,    None),
    ("lead_scoring",         task_lead_scoring,           15,  None, None),
    ("hunter",               task_hunter,                 30,  None, None),
    ("salesman",             task_salesman,               15,  None, None),
    ("nurture_sequence",     task_nurture_sequence,       60,  None, None),
    ("enrich_leads",         task_enrich_leads,          240,  None, None),
    ("content_publish",      task_content_publish,       120,  10,   None),
    ("multiplatform_publish",task_multiplatform_publish, 120,  10,   None),
    ("weekly_report",        task_weekly_report,        10080,  20,  6),
    ("weekly_strategy",      task_weekly_strategy,      10080,   8,  0),
]

# Initialise running-flag for each task
for _name, *_ in SCHEDULE:
    _TASK_RUNNING[_name] = False


def _should_run(name: str, interval_min: int, hour, weekday) -> bool:
    now = datetime.now()
    state = ENGINE_STATE["tasks"].get(name, {})
    last_run_str = state.get("last_run", "")

    if last_run_str:
        try:
            last_run = datetime.strptime(last_run_str, "%Y-%m-%d %H:%M:%S")
            elapsed_min = (now - last_run).total_seconds() / 60
            if elapsed_min < interval_min:
                return False
        except Exception:
            pass

    if hour is not None and now.hour != hour:
        return False
    if weekday is not None and now.weekday() != weekday:
        return False

    return True


def _mark_run(name: str, interval_min: int) -> None:
    now = datetime.now()
    next_dt = now + timedelta(minutes=interval_min)
    ENGINE_STATE["tasks"][name] = {
        "last_run": now.strftime("%Y-%m-%d %H:%M:%S"),
        "next_run": next_dt.strftime("%Y-%m-%d %H:%M"),
        "status": "running",
        "count": ENGINE_STATE["tasks"].get(name, {}).get("count", 0) + 1,
    }
    save_state()


def _run_task_safe(name: str, func) -> None:
    """Wrapper that enforces single-concurrent-execution per task."""
    with _running_lock:
        if _TASK_RUNNING.get(name):
            log(f"Задача {name} уже выполняется — пропускаю", "INFO")
            return
        _TASK_RUNNING[name] = True
    try:
        func()
        ENGINE_STATE["tasks"][name]["status"] = "completed"
        save_state()
    except Exception as exc:
        log(f"Task {name} error: {exc}", "ERROR")
        ENGINE_STATE["tasks"].get(name, {}).update({"status": "error"})
        save_state()
    finally:
        _TASK_RUNNING[name] = False


# ── Signal handling ───────────────────────────────────────────────────────────

def _handle_signal(signum, frame) -> None:
    log("Получен сигнал остановки. Завершаю работу...", "ENGINE")
    ENGINE_STATE["running"] = False
    save_state()


try:
    signal.signal(signal.SIGTERM, _handle_signal)
    signal.signal(signal.SIGINT, _handle_signal)
except Exception:
    pass  # signal registration may fail in some environments


# ── Main loop ─────────────────────────────────────────────────────────────────

def run_engine() -> None:
    _restore_state()

    ENGINE_STATE["running"] = True
    ENGINE_STATE["started_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    # Reset today counters on fresh start
    for agent in ENGINE_STATE["agents"].values():
        agent["today"] = 0

    log("ENGINE STARTED — AMAImedia Producer Center v4.0", "ENGINE")
    tg_notify("🚀 AMAImedia Engine v4.0 запущен! Работаю 24/7.")
    save_state()

    while ENGINE_STATE["running"]:
        try:
            for name, func, interval, hour, weekday in SCHEDULE:
                if _should_run(name, interval, hour, weekday):
                    log(f"Запуск задачи: {name}", "ENGINE")
                    _mark_run(name, interval)
                    t = threading.Thread(
                        target=_run_task_safe, args=(name, func),
                        daemon=True, name=name,
                    )
                    t.start()

            time.sleep(60)

        except Exception as exc:
            log(f"Engine loop error: {exc}", "ERROR")
            time.sleep(60)

    log("ENGINE STOPPED", "ENGINE")


if __name__ == "__main__":
    run_engine()
