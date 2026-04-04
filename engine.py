"""
NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
Copyright (c) 2026 AMAImedia.com
All rights reserved.
D:/Content OS/engine.py — Autonomous Engine v4.1
"""
import threading
import time
import json
import os
import sys
import signal
import urllib.request
from datetime import datetime, timedelta

# ── Windows console encoding ──────────────────────────────────────────────────
for _stream in (sys.stdout, sys.stderr):
    if _stream and hasattr(_stream, "reconfigure"):
        try:
            _stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

BASE       = os.path.dirname(os.path.abspath(__file__))
LOG_FILE   = os.path.join(BASE, "logs", "engine.log")
STATE_FILE = os.path.join(BASE, "pc_data", "engine_state.json")


# ── .env loader ───────────────────────────────────────────────────────────────

def _load_env() -> None:
    path = os.path.join(BASE, ".env")
    if not os.path.exists(path):
        return
    try:
        with open(path, encoding="utf-8") as f:
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

# Lead stages that mean "not yet contacted" — used by salesman + hunter
_NEW_STAGES = {"new", "interested", "replied", "contacted"}

# ── Global state ──────────────────────────────────────────────────────────────

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
_TASK_RUNNING: dict = {}


# ── Helpers ───────────────────────────────────────────────────────────────────

def log(msg: str, level: str = "INFO") -> None:
    ts   = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}] [{level}] {msg}"
    try:
        print(line)
    except UnicodeEncodeError:
        print(line.encode("ascii", "replace").decode("ascii"))
    try:
        os.makedirs(os.path.join(BASE, "logs"), exist_ok=True)
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
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
        print(f"[save_state] {exc}")


def _restore_state() -> None:
    """Restore tasks.last_run and agent totals from previous session."""
    if not os.path.exists(STATE_FILE):
        return
    try:
        with open(STATE_FILE, encoding="utf-8") as f:
            saved = json.load(f)
        if saved.get("tasks"):
            ENGINE_STATE["tasks"].update(saved["tasks"])
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
        return
    try:
        body = json.dumps({"chat_id": CHAT_ID, "text": text}).encode()
        req  = urllib.request.Request(
            f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
            body, {"Content-Type": "application/json"},
        )
        urllib.request.urlopen(req, timeout=10)
    except Exception as exc:
        log(f"Telegram error: {exc}", "ERROR")


# ── Data helpers ──────────────────────────────────────────────────────────────

def _data_path(fname: str) -> str:
    return os.path.join(BASE, "pc_data", fname)


def _load_json(fname: str, default):
    try:
        with open(_data_path(fname), encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def _save_json(fname: str, data) -> None:
    os.makedirs(os.path.join(BASE, "pc_data"), exist_ok=True)
    with open(_data_path(fname), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_leads()   -> list: return _load_json("leads.json", [])
def save_leads(d)  -> None: _save_json("leads.json", d)
def load_clients() -> list: return _load_json("clients.json", [])
def load_queue()   -> list: return _load_json("content_queue.json", [])
def save_queue(q)  -> None: _save_json("content_queue.json", q)


# ── Tasks ─────────────────────────────────────────────────────────────────────

def task_hunter() -> None:
    """Every 30 min — activate hot leads, clean up nurture pipeline."""
    log("Охотник сканирует лидов...", "HUNTER")
    ENGINE_STATE["agents"]["hunter"]["status"] = "working"
    save_state()

    leads   = load_leads()
    changed = False

    for lead in leads:
        stage = lead.get("stage", "")
        score = lead.get("score", 0)
        # Promote hot leads to active
        if score >= 80 and stage in _NEW_STAGES:
            lead["stage"] = "active"
            changed = True
            log(f"Активирован: {lead.get('name','?')} score={score}", "HUNTER")
        # Complete finished nurture sequences
        if stage == "nurture" and lead.get("nurture_day", 0) >= 7:
            lead["stage"] = "done_nurture"
            changed = True

    if changed:
        save_leads(leads)
        activated = sum(1 for l in leads if l.get("stage") == "active")
        tg_notify(f"🔍 Охотник: {activated} горячих лидов в работе")

    unscored = sum(1 for l in leads if l.get("score") is None)
    ENGINE_STATE["agents"]["hunter"]["today"] += 1
    ENGINE_STATE["agents"]["hunter"]["total"] += 1
    ENGINE_STATE["agents"]["hunter"]["status"] = "idle"
    log(f"Охотник: {len(leads)} лидов, {unscored} без оценки", "HUNTER")
    save_state()


def task_salesman() -> None:
    """Every 15 min — send first contact to uncontacted scored leads."""
    leads   = load_leads()
    changed = False

    for lead in leads:
        if lead.get("stage") not in _NEW_STAGES:
            continue
        if lead.get("first_contact_sent"):
            continue
        score = lead.get("score") or 0
        if score < 30:
            continue

        ENGINE_STATE["agents"]["salesman"]["status"] = "working"
        save_state()

        msg = gemini(
            f"Напиши персональное первое сообщение лиду от имени Зарины.\n"
            f"Имя: {lead.get('name','?')}, Ниша: {lead.get('niche','?')}, "
            f"Источник: {lead.get('source','?')}\n"
            f"AMAImedia — продюсерский центр для экспертов.\n"
            f"Задача: завязать разговор, не продавать. 2-3 живых предложения.",
            "Ты менеджер по продажам. Первое касание — интересуйся, не продавай.",
        )

        if msg:
            lead["first_contact_sent"] = datetime.now().strftime("%Y-%m-%d %H:%M")
            lead["first_contact_msg"]  = msg
            lead["stage"]              = "nurture" if score >= 50 else lead["stage"]
            changed = True
            ENGINE_STATE["agents"]["salesman"]["today"] += 1
            ENGINE_STATE["agents"]["salesman"]["total"] += 1
            ENGINE_STATE["stats"]["messages_sent"] += 1
            log(f"Продажник → первый контакт: {lead.get('name','?')} (score {score})", "SALESMAN")

        ENGINE_STATE["agents"]["salesman"]["status"] = "idle"
        break  # one at a time

    if changed:
        save_leads(leads)
    ENGINE_STATE["agents"]["salesman"]["status"] = "idle"
    save_state()


def task_lead_scoring() -> None:
    """Every 15 min — AI score all unscored leads."""
    leads   = load_leads()
    updated = False

    for lead in leads:
        if lead.get("score") is not None:
            continue
        if not (lead.get("notes") or lead.get("niche")):
            continue

        ENGINE_STATE["agents"]["scorer"]["status"] = "working"
        save_state()

        resp = gemini(
            f"Ты эксперт по квалификации лидов для SMM агентства AMAImedia.\n"
            f"Оцени лида от 0 до 100. Ответь ТОЛЬКО в этом формате:\n"
            f"SCORE: [число]\n"
            f"ПРИЧИНА: [одно предложение]\n"
            f"ПРОДУКТ: [аудит/мини-курс/наставничество/продюсирование]\n\n"
            f"Имя: {lead.get('name','?')}\n"
            f"Ниша: {lead.get('niche','?')}\n"
            f"Источник: {lead.get('source','?')}\n"
            f"Заметки: {lead.get('notes','—')}\n\n"
            f"Критерии: бюджет(+30) боль совпадает(+25) срочность(+20) "
            f"открытость(+15) активность(+10)"
        )

        score   = 50
        reason  = ""
        product = "наставничество"
        for line in resp.split("\n"):
            l = line.strip()
            if l.startswith("SCORE:"):
                try:
                    score = max(0, min(100, int("".join(
                        c for c in l.split(":", 1)[-1][:5] if c.isdigit()
                    ))))
                except Exception:
                    pass
            elif l.startswith("ПРИЧИНА:"):
                reason = l.split(":", 1)[-1].strip()
            elif l.startswith("ПРОДУКТ:"):
                product = l.split(":", 1)[-1].strip()   # ← fixed (was assigning to reason)

        lead["score"]               = score
        lead["score_reason"]        = reason
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
                f"Продукт: {product}\n"
                f"Почему: {reason}"
            )
            log(f"Горячий лид → уведомление: {lead.get('name','?')}", "HOT")

    if updated:
        save_leads(leads)
    ENGINE_STATE["agents"]["scorer"]["status"] = "idle"
    save_state()


def task_nurture_sequence() -> None:
    """Every 60 min — send day-N nurture message to leads in nurture stage."""
    leads   = load_leads()
    now     = datetime.now()
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
        if lead.get("stage") != "nurture" or (lead.get("score") or 0) < 50:
            continue

        nurture_day  = lead.get("nurture_day", 0)
        last_nurture = lead.get("last_nurture", "")

        if nurture_day >= 7:
            lead["stage"] = "done_nurture"
            changed = True
            continue

        if last_nurture:
            try:
                if (now - datetime.strptime(last_nurture, "%Y-%m-%d %H:%M")
                        ).total_seconds() < 86400:
                    continue
            except Exception:
                pass

        ENGINE_STATE["agents"]["nurture"]["status"] = "working"
        save_state()

        msg = gemini(
            f"Напиши сообщение для прогрева лида. День {nurture_day + 1} из 7.\n"
            f"Тема: {DAY_TEMPLATES.get(nurture_day, 'следующий шаг')}\n"
            f"Ниша лида: {lead.get('niche', 'не указана')}\n"
            f"Продукты AMAImedia: аудит $150, мини-курс $97, "
            f"наставничество $1500, продюсирование $3000\n"
            f"Стиль: живой, без давления. 3-5 предложений.",
            "Ты копирайтер агентства. Пиши как живой человек.",
        )

        if msg:
            lead["nurture_day"]  = nurture_day + 1
            lead["last_nurture"] = now.strftime("%Y-%m-%d %H:%M")
            changed = True
            ENGINE_STATE["agents"]["nurture"]["today"] += 1
            ENGINE_STATE["agents"]["nurture"]["total"] += 1
            ENGINE_STATE["stats"]["messages_sent"] += 1
            log(f"Прогрев день {nurture_day + 1}: {lead.get('name','?')}", "NURTURE")

        ENGINE_STATE["agents"]["nurture"]["status"] = "idle"

    if changed:
        save_leads(leads)
    save_state()


def task_publish() -> None:
    """Every 2 hours at 10:00 — publish one queued clip (Vizard, else n8n)."""
    queue = load_queue()
    now   = datetime.now()

    for item in queue:
        if item.get("status") != "scheduled":
            continue
        try:
            if datetime.strptime(item["scheduled_date"], "%Y-%m-%d").date() > now.date():
                continue
        except Exception:
            continue

        ENGINE_STATE["agents"]["publisher"]["status"] = "working"
        save_state()
        published = False

        # Try Vizard first
        clip_id = item.get("vizard_clip_id")
        if clip_id and VIZARD_KEY:
            try:
                data = json.dumps({
                    "finalVideoId": clip_id,
                    "post": item.get("caption", ""),
                    "publishTime": int(now.timestamp() * 1000),
                }).encode()
                urllib.request.urlopen(
                    urllib.request.Request(
                        "https://elb-api.vizard.ai/hvizard-server-front"
                        "/open-api/v1/project/publish-video",
                        data, {"VIZARDAI_API_KEY": VIZARD_KEY,
                               "Content-Type": "application/json"},
                    ), timeout=15
                )
                published = True
                log(f"Vizard опубликовано: {item.get('title','?')[:50]}", "PUBLISHER")
            except Exception as exc:
                log(f"Vizard ошибка: {exc} — пробую n8n", "WARN")

        # Fallback: n8n multiplatform webhook
        if not published:
            try:
                data = json.dumps({
                    "clip_url":  item.get("video_url", ""),
                    "caption":   item.get("caption", ""),
                    "hashtags":  item.get("hashtags", []),
                    "platforms": item.get("platforms", ["telegram"]),
                    "title":     item.get("title", ""),
                }).encode()
                urllib.request.urlopen(
                    urllib.request.Request(
                        "http://localhost:5678/webhook/publish-content",
                        data, {"Content-Type": "application/json"},
                    ), timeout=15
                )
                published = True
                platforms = ", ".join(item.get("platforms", ["telegram"]))
                log(f"n8n опубликовано → {platforms}: {item.get('title','?')[:40]}", "PUBLISHER")
            except Exception as exc:
                log(f"n8n ошибка публикации: {exc}", "ERROR")

        if published:
            item["status"]       = "published"
            item["published_at"] = now.strftime("%Y-%m-%d %H:%M")
            ENGINE_STATE["agents"]["publisher"]["today"] += 1
            ENGINE_STATE["agents"]["publisher"]["total"] += 1
            ENGINE_STATE["stats"]["content_published"] += 1
            tg_notify(f"📤 Опубликовано!\n{item.get('title','?')}")
        else:
            item["status"] = "error"

        ENGINE_STATE["agents"]["publisher"]["status"] = "idle"
        save_queue(queue)
        save_state()
        break  # one at a time


def enrich_lead(lead: dict) -> dict:
    """Enrich a single lead with AI-inferred niche context."""
    if not any([lead.get("name"), lead.get("niche"), lead.get("contact")]):
        return lead
    result = gemini(
        f"Обогати данные о потенциальном клиенте AMAImedia.\n"
        f"Имя: {lead.get('name','?')}, Ниша: {lead.get('niche','?')}\n\n"
        f"Ответь по пунктам:\n"
        f"1. Средний чек в нише ($)\n"
        f"2. Главная боль экспертов\n"
        f"3. Подходящий продукт AMAImedia\n"
        f"4. Лучший способ начать разговор"
    )
    if result:
        lead["enrichment"]  = result
        lead["enriched_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    return lead


def task_enrich_leads() -> None:
    """Every 4 hours — enrich up to 5 unenriched leads."""
    leads   = load_leads()
    changed = False
    count   = 0
    for lead in leads:
        if lead.get("enrichment") or not (lead.get("niche") or lead.get("name")):
            continue
        enrich_lead(lead)
        if lead.get("enrichment"):
            changed = True
            count  += 1
            log(f"Обогащён: {lead.get('name','?')}", "HUNTER")
        if count >= 5:
            break
    if changed:
        save_leads(leads)
    log(f"Обогащение: {count} лидов", "HUNTER")


def task_daily_briefing() -> None:
    """09:00 daily — morning briefing to Zarina."""
    log("Генерирую утренний брифинг...", "TASK")
    ENGINE_STATE["agents"]["analyst"]["status"] = "working"
    save_state()

    leads   = load_leads()
    clients = load_clients()
    hot     = [l for l in leads if (l.get("score") or 0) >= 70]
    new_today = [l for l in leads
                 if l.get("date") == datetime.now().strftime("%d.%m")]

    text = gemini(
        f"Утренний брифинг директора AMAImedia.\n"
        f"Лидов: {len(leads)}, горячих: {len(hot)}, "
        f"новых сегодня: {len(new_today)}, клиентов: {len(clients)}.\n"
        f"Дай: 1) Топ-3 задачи 2) На кого обратить внимание 3) Прогноз. "
        f"Кратко, 5-7 строк.",
        "Ты AI-директор. Пиши кратко и по делу.",
    )
    if text:
        tg_notify(f"☀️ Доброе утро!\n\n{text}")
        log("Брифинг отправлен", "ANALYST")

    ENGINE_STATE["agents"]["analyst"]["status"] = "idle"
    ENGINE_STATE["agents"]["analyst"]["today"] += 1
    ENGINE_STATE["agents"]["analyst"]["total"] += 1
    save_state()


def task_weekly_report() -> None:
    """Sunday 20:00 — weekly summary."""
    leads   = load_leads()
    clients = load_clients()
    hot     = len([l for l in leads if (l.get("score") or 0) >= 70])
    ENGINE_STATE["agents"]["analyst"]["status"] = "working"
    save_state()

    text = gemini(
        f"Недельный отчёт AMAImedia.\n"
        f"Лидов: {len(leads)} (горячих: {hot}), клиентов: {len(clients)}, "
        f"клипов: {ENGINE_STATE['stats']['content_published']}.\n"
        f"Дай: 1) Итоги 2) Что хорошо 3) Что улучшить 4) ТОП-3 задачи. Кратко.",
        "Ты стратегический директор. Пиши с цифрами.",
    )
    if text:
        tg_notify(f"📊 НЕДЕЛЬНЫЙ ОТЧЁТ:\n\n{text}")
        log("Недельный отчёт отправлен", "ANALYST")

    ENGINE_STATE["agents"]["analyst"]["status"] = "idle"
    ENGINE_STATE["agents"]["analyst"]["today"] += 1
    ENGINE_STATE["agents"]["analyst"]["total"] += 1
    save_state()


def task_weekly_strategy() -> None:
    """Monday 08:00 — weekly plan."""
    leads     = load_leads()
    hot_leads = sorted(
        [l for l in leads if (l.get("score") or 0) >= 60],
        key=lambda x: x.get("score", 0), reverse=True,
    )[:5]
    names = ", ".join(
        f"{l.get('name','?')}({l.get('score',0)})" for l in hot_leads
    ) or "нет горячих"

    ENGINE_STATE["agents"]["strategist"]["status"] = "working"
    save_state()

    text = gemini(
        f"План на неделю для AMAImedia.\n"
        f"Горячих лидов: {len(hot_leads)} — {names}\n"
        f"Дай: 1) ТОП-3 лида 2) Темы контента 3) Рекламный тест 4) KPI. Конкретно.",
        "Ты стратег. Давай чёткие приоритеты.",
    )
    if text:
        tg_notify(f"🎯 ПЛАН НА НЕДЕЛЮ:\n\n{text}")
        log("Стратегия отправлена", "STRATEGIST")

    ENGINE_STATE["agents"]["strategist"]["status"] = "idle"
    ENGINE_STATE["agents"]["strategist"]["today"] += 1
    ENGINE_STATE["agents"]["strategist"]["total"] += 1
    save_state()


# ── Scheduler ─────────────────────────────────────────────────────────────────
# (name, func, interval_min, required_hour, required_weekday)

SCHEDULE = [
    ("daily_briefing",   task_daily_briefing,   1440,  9,    None),
    ("lead_scoring",     task_lead_scoring,       15,  None, None),
    ("hunter",           task_hunter,             30,  None, None),
    ("salesman",         task_salesman,           15,  None, None),
    ("nurture_sequence", task_nurture_sequence,   60,  None, None),
    ("enrich_leads",     task_enrich_leads,      240,  None, None),
    ("publish",          task_publish,           120,  10,   None),
    ("weekly_report",    task_weekly_report,   10080,  20,   6),
    ("weekly_strategy",  task_weekly_strategy, 10080,   8,   0),
]

for _name, *_ in SCHEDULE:
    _TASK_RUNNING[_name] = False


def _should_run(name: str, interval_min: int, hour, weekday) -> bool:
    now   = datetime.now()
    state = ENGINE_STATE["tasks"].get(name, {})
    last  = state.get("last_run", "")
    if last:
        try:
            elapsed = (now - datetime.strptime(last, "%Y-%m-%d %H:%M:%S")
                       ).total_seconds() / 60
            if elapsed < interval_min:
                return False
        except Exception:
            pass
    if hour    is not None and now.hour    != hour:    return False
    if weekday is not None and now.weekday() != weekday: return False
    return True


def _mark_run(name: str, interval_min: int) -> None:
    now = datetime.now()
    ENGINE_STATE["tasks"][name] = {
        "last_run": now.strftime("%Y-%m-%d %H:%M:%S"),
        "next_run": (now + timedelta(minutes=interval_min)).strftime("%Y-%m-%d %H:%M"),
        "status":   "running",
        "count":    ENGINE_STATE["tasks"].get(name, {}).get("count", 0) + 1,
    }
    save_state()


def _run_task_safe(name: str, func) -> None:
    with _running_lock:
        if _TASK_RUNNING.get(name):
            return
        _TASK_RUNNING[name] = True
    try:
        func()
        if name in ENGINE_STATE["tasks"]:
            ENGINE_STATE["tasks"][name]["status"] = "completed"
            save_state()
    except Exception as exc:
        log(f"Task {name} error: {exc}", "ERROR")
        if name in ENGINE_STATE["tasks"]:
            ENGINE_STATE["tasks"][name]["status"] = "error"
            save_state()
    finally:
        _TASK_RUNNING[name] = False


# ── Signal handling ───────────────────────────────────────────────────────────

def _handle_signal(signum, frame) -> None:
    log("Получен сигнал остановки — завершаю работу", "ENGINE")
    ENGINE_STATE["running"] = False
    save_state()


try:
    signal.signal(signal.SIGTERM, _handle_signal)
    signal.signal(signal.SIGINT,  _handle_signal)
except Exception:
    pass


# ── Main loop ─────────────────────────────────────────────────────────────────

def run_engine() -> None:
    _restore_state()
    ENGINE_STATE["running"]    = True
    ENGINE_STATE["started_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    for agent in ENGINE_STATE["agents"].values():
        agent["today"] = 0

    log("ENGINE STARTED — AMAImedia v4.1", "ENGINE")
    tg_notify("🚀 AMAImedia Engine v4.1 запущен. Работаю 24/7.")
    save_state()

    while ENGINE_STATE["running"]:
        try:
            for name, func, interval, hour, weekday in SCHEDULE:
                if _should_run(name, interval, hour, weekday):
                    log(f"→ Запуск: {name}", "ENGINE")
                    _mark_run(name, interval)
                    threading.Thread(
                        target=_run_task_safe, args=(name, func),
                        daemon=True, name=name,
                    ).start()
            time.sleep(60)
        except Exception as exc:
            log(f"Engine loop error: {exc}", "ERROR")
            time.sleep(60)

    log("ENGINE STOPPED", "ENGINE")


if __name__ == "__main__":
    run_engine()
