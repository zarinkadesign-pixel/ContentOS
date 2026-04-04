"""
NOESIS — AMAImedia Autonomous Engine v4.0
Copyright (c) 2026 AMAImedia.com
D:/Content OS/engine.py
"""
import threading
import time
import json
import os
import urllib.request
from datetime import datetime

# ── Windows console encoding ──────────────────────────────────────────────────
import sys
for _s in (sys.stdout, sys.stderr):
    if _s and hasattr(_s, "reconfigure"):
        try:
            _s.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, "pc_data")
LOG  = os.path.join(BASE, "logs", "engine.log")
STATE = os.path.join(DATA, "engine_state.json")

os.makedirs(DATA, exist_ok=True)
os.makedirs(os.path.join(BASE, "logs"), exist_ok=True)

# ── Load .env ─────────────────────────────────────────────────────────────────
def _load_env():
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

GEMINI = os.environ.get("GEMINI_KEY", "")
BOT    = os.environ.get("BOT_TOKEN",  "")
CHAT   = os.environ.get("CHAT_ID",    "")
VIZARD = os.environ.get("VIZARD_KEY", "")

# ── Global state ──────────────────────────────────────────────────────────────
S = {
    "running": True,
    "started_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "events": [],
    "agents": {
        "scorer":    {"status": "idle", "today": 0, "total": 0},
        "nurture":   {"status": "idle", "today": 0, "total": 0},
        "publisher": {"status": "idle", "today": 0, "total": 0},
        "analyst":   {"status": "idle", "today": 0, "total": 0},
    },
    "tasks": {},
    "stats": {
        "leads_today":       0,
        "messages_sent":     0,
        "content_published": 0,
        "calls_scheduled":   0,
    },
}

_lock = threading.Lock()


# ── Helpers ───────────────────────────────────────────────────────────────────

def save():
    try:
        with _lock:
            snapshot = json.dumps(S, ensure_ascii=False, indent=2)
        with open(STATE, "w", encoding="utf-8") as f:
            f.write(snapshot)
    except Exception as exc:
        print(f"[save] {exc}")


def log(msg, lvl="INFO"):
    ts = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}][{lvl}] {msg}"
    try:
        print(line)
    except UnicodeEncodeError:
        print(line.encode("ascii", "replace").decode())
    try:
        with open(LOG, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass
    with _lock:
        S["events"].insert(0, {"time": ts, "msg": msg, "level": lvl})
        S["events"] = S["events"][:100]
    save()


def post(url, data, headers=None):
    body = json.dumps(data).encode("utf-8")
    h = {"Content-Type": "application/json"}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, body, h)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())


def tg(text):
    if not BOT or not CHAT:
        return
    try:
        post(
            f"https://api.telegram.org/bot{BOT}/sendMessage",
            {"chat_id": CHAT, "text": str(text)[:4000]},
        )
    except Exception as exc:
        log(f"TG error: {exc}", "ERROR")


def gemini(prompt):
    if not GEMINI:
        log("GEMINI_KEY not set", "WARN")
        return ""
    try:
        r = post(
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"gemini-2.0-flash:generateContent?key={GEMINI}",
            {
                "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                "generationConfig": {"maxOutputTokens": 600},
            },
        )
        return r["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as exc:
        log(f"Gemini error: {exc}", "ERROR")
        return ""


def load_json(name, default):
    try:
        with open(os.path.join(DATA, f"{name}.json"), encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def dump_json(name, data):
    with open(os.path.join(DATA, f"{name}.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ── Tasks ─────────────────────────────────────────────────────────────────────

def task_briefing():
    log("Генерирую брифинг...", "ANALYST")
    S["agents"]["analyst"]["status"] = "working"
    save()
    leads   = load_json("leads", [])
    clients = load_json("clients", [])
    hot     = len([l for l in leads if l.get("score", 0) >= 70])
    text = gemini(
        f"Утренний брифинг директора SMM-агентства AMAImedia (Зарина, Нячанг).\n"
        f"Данные: лидов {len(leads)}, горячих {hot}, клиентов {len(clients)}.\n"
        f"Дай: 1) ТОП-3 задачи на сегодня 2) На кого из лидов обратить внимание.\n"
        f"Кратко, по-деловому, на русском, 5-7 строк."
    )
    if text:
        tg(f"☀️ Доброе утро, Зарина!\n\n{text}")
        log("Брифинг отправлен в Telegram", "ANALYST")
    S["agents"]["analyst"]["status"] = "idle"
    S["agents"]["analyst"]["today"] += 1
    S["agents"]["analyst"]["total"] += 1
    save()


def task_scoring():
    log("Запуск скоринга лидов...", "SCORER")
    S["agents"]["scorer"]["status"] = "working"
    save()
    leads   = load_json("leads", [])
    changed = False
    for lead in leads:
        if lead.get("score") is not None:
            continue
        niche  = lead.get("niche", "")
        notes  = lead.get("notes", "")
        source = lead.get("source", "")
        if not niche and not notes:
            lead["score"] = 40
            changed = True
            continue
        resp = gemini(
            f"Оцени потенциал лида от 0 до 100. Ответь ТОЛЬКО числом.\n"
            f"Ниша: {niche}\nИсточник: {source}\nЗаметки: {notes}\n"
            f"0-40=холодный, 41-69=тёплый, 70-79=горячий, 80+=очень горячий\n"
            f"Критерии: есть боль(25)+есть бюджет(25)+срочность(20)"
            f"+подходит нам(20)+контакт(10)"
        )
        try:
            score = int("".join(c for c in resp.strip()[:5] if c.isdigit()))
            score = max(0, min(100, score))
        except Exception:
            score = 50
        lead["score"] = score
        changed = True
        S["agents"]["scorer"]["today"] += 1
        S["agents"]["scorer"]["total"] += 1
        log(f"Score: {lead.get('name', '?')} = {score}", "SCORER")
        if score >= 80:
            name    = lead.get("name", "Лид")
            contact = lead.get("contact", "")
            tg(
                f"🔥 ГОРЯЧИЙ ЛИД!\n\n"
                f"Имя: {name}\nНиша: {niche}\nКонтакт: {contact}\n"
                f"Score: {score}/100\n\nРекомендую связаться сегодня!"
            )
            log(f"Горячий лид: {name}", "HOT")
        time.sleep(2)

    if changed:
        dump_json("leads", leads)
        S["stats"]["leads_today"] = len([
            l for l in leads
            if l.get("date", "") == datetime.now().strftime("%d.%m")
        ])
    S["agents"]["scorer"]["status"] = "idle"
    save()


def task_nurture():
    log("Проверка прогрева...", "NURTURE")
    S["agents"]["nurture"]["status"] = "working"
    save()
    leads   = load_json("leads", [])
    now     = datetime.now()
    changed = False

    days_content = [
        "знакомство с Зариной — история как потеряла $60K и создала AMAImedia",
        "боль — хаотичный постинг, выгорание, нет системы",
        "решение — подкаст 1 раз в месяц, Vizard нарезает 15 Reels, выходят сами",
        "кейс — клиент вырос с $2k до $12k за 3 месяца с конкретными цифрами",
        "диагностика — 4 вопроса да/нет показывают готовность блога",
        "приглашение на бесплатный разбор конкретно для их ниши",
        "финальный оффер: аудит $150 / наставничество $1500 / продюсирование $3000",
    ]

    for lead in leads:
        if lead.get("stage") != "nurture":
            continue
        if lead.get("score", 0) < 40:
            continue
        day = lead.get("nurture_day", 0)
        if day >= 7:
            lead["stage"] = "nurture_done"
            changed = True
            continue
        last = lead.get("last_nurture", "")
        if last:
            try:
                diff = (now - datetime.strptime(last, "%Y-%m-%d %H:%M")).total_seconds()
                if diff < 82800:   # 23 hours
                    continue
            except Exception:
                pass

        niche = lead.get("niche", "эксперт")
        msg = gemini(
            f"Напиши прогревочное сообщение для лида. День {day + 1}/7.\n"
            f"Тема: {days_content[day]}\n"
            f"Ниша клиента: {niche}\n"
            f"AMAImedia — продюсерский центр, помогаем экспертам продавать через систему.\n"
            f"Стиль: живой разговорный, без давления, как подруга пишет. 3-4 предложения.\n"
            f"В конце: кодовое слово ХОЧУ для действия или открытый вопрос."
        )
        if msg:
            try:
                post(
                    "http://localhost:5678/webhook/tg-parser",
                    {
                        "contact": lead.get("contact", ""),
                        "message": msg,
                        "name":    lead.get("name", ""),
                    },
                )
                lead["nurture_day"]  = day + 1
                lead["last_nurture"] = now.strftime("%Y-%m-%d %H:%M")
                S["agents"]["nurture"]["today"] += 1
                S["agents"]["nurture"]["total"] += 1
                S["stats"]["messages_sent"] += 1
                log(f"Прогрев день {day + 1}: {lead.get('name', '?')}", "NURTURE")
                changed = True
            except Exception as exc:
                log(f"Ошибка прогрева: {exc}", "ERROR")
            time.sleep(3)

    if changed:
        dump_json("leads", leads)
    S["agents"]["nurture"]["status"] = "idle"
    save()


def task_publish():
    log("Проверка очереди публикаций...", "PUBLISHER")
    S["agents"]["publisher"]["status"] = "working"
    save()
    queue = load_json("content_queue", [])
    now   = datetime.now()

    for item in queue:
        if item.get("status") != "scheduled":
            continue
        try:
            sched = datetime.strptime(item["scheduled_date"], "%Y-%m-%d")
        except Exception:
            continue
        if sched.date() > now.date():
            continue

        published = False

        # Try Vizard API first
        if item.get("vizard_clip_id") and VIZARD:
            try:
                post(
                    "https://elb-api.vizard.ai/hvizard-server-front"
                    "/open-api/v1/project/publish-video",
                    {
                        "finalVideoId": item["vizard_clip_id"],
                        "post":         item.get("caption", ""),
                        "publishTime":  int(now.timestamp() * 1000),
                    },
                    {"VIZARDAI_API_KEY": VIZARD},
                )
                published = True
                log(f"Vizard: {item.get('title', '?')[:40]}", "PUBLISHER")
            except Exception as exc:
                log(f"Vizard error: {exc} — trying n8n", "WARN")

        # Fallback: n8n multiplatform webhook
        if not published:
            try:
                post(
                    "http://localhost:5678/webhook/publish-content",
                    {
                        "title":     item.get("title", ""),
                        "caption":   item.get("caption", ""),
                        "platforms": item.get("platforms", ["telegram"]),
                    },
                )
                published = True
                log(f"n8n: {item.get('title', '?')[:40]}", "PUBLISHER")
            except Exception as exc:
                log(f"n8n error: {exc}", "ERROR")

        if published:
            item["status"]       = "published"
            item["published_at"] = now.strftime("%Y-%m-%d %H:%M")
            S["agents"]["publisher"]["today"] += 1
            S["agents"]["publisher"]["total"] += 1
            S["stats"]["content_published"] += 1
            tg(f"📹 Клип опубликован!\n\n{item.get('title', '?')[:60]}")
        else:
            item["status"] = "error"

        dump_json("content_queue", queue)
        break   # one at a time

    S["agents"]["publisher"]["status"] = "idle"
    save()


def task_weekly_report():
    log("Недельный отчёт...", "ANALYST")
    S["agents"]["analyst"]["status"] = "working"
    save()
    leads   = load_json("leads", [])
    clients = load_json("clients", [])
    hot     = len([l for l in leads if l.get("score", 0) >= 70])
    text = gemini(
        f"Недельный отчёт для директора агентства AMAImedia.\n"
        f"Лидов: {len(leads)} (горячих: {hot}), клиентов: {len(clients)}, "
        f"опубликовано клипов: {S['stats']['content_published']}, "
        f"сообщений отправлено: {S['stats']['messages_sent']}.\n"
        f"Дай: итоги недели, что сработало, что улучшить, "
        f"ТОП-3 задачи на следующую неделю. Кратко с цифрами."
    )
    if text:
        tg(f"📊 НЕДЕЛЬНЫЙ ОТЧЁТ:\n\n{text}")
        log("Недельный отчёт отправлен", "ANALYST")
    S["agents"]["analyst"]["status"] = "idle"
    S["agents"]["analyst"]["today"] += 1
    S["agents"]["analyst"]["total"] += 1
    save()


# ── Scheduler ─────────────────────────────────────────────────────────────────
# (name, func, interval_minutes, required_hour, required_weekday)
TASKS = [
    ("briefing",      task_briefing,      1440,  9,    None),  # daily 09:00
    ("scoring",       task_scoring,         15,  None, None),  # every 15 min
    ("nurture",       task_nurture,         60,  None, None),  # every hour
    ("publish",       task_publish,        120,  10,   None),  # every 2h at 10:00
    ("weekly_report", task_weekly_report, 10080, 20,   6),     # Sunday 20:00
]


def _should_run(name, interval, hour, weekday):
    now  = datetime.now()
    info = S["tasks"].get(name, {})
    last = info.get("last_run", "")
    if last:
        try:
            diff = (now - datetime.strptime(last, "%Y-%m-%d %H:%M:%S")).total_seconds() / 60
            if diff < interval:
                return False
        except Exception:
            pass
    if hour    is not None and now.hour     != hour:    return False
    if weekday is not None and now.weekday() != weekday: return False
    return True


def _mark(name):
    S["tasks"][name] = {
        "last_run": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "count":    S["tasks"].get(name, {}).get("count", 0) + 1,
    }
    save()


def _check_stop():
    """Return True if UI wrote stop_signal:true to the state file."""
    try:
        with open(STATE, encoding="utf-8") as f:
            data = json.load(f)
        return bool(data.get("stop_signal"))
    except Exception:
        return False


# ── Main ──────────────────────────────────────────────────────────────────────

def run():
    log("=== ENGINE STARTED — AMAImedia v4.0 ===", "ENGINE")
    tg("⚡ AMAImedia Engine запущен!\nРаботаю 24/7. Первый брифинг в 09:00.")
    save()

    while True:
        # Check for stop signal from UI
        if _check_stop():
            log("Получен сигнал остановки от UI", "ENGINE")
            S["running"] = False
            save()
            break

        # Run scheduled tasks
        for name, func, interval, hour, weekday in TASKS:
            if _should_run(name, interval, hour, weekday):
                log(f"Запуск задачи: {name}", "ENGINE")
                threading.Thread(
                    target=func, daemon=True, name=name
                ).start()
                _mark(name)

        # Sleep 60 seconds in 1-second chunks for fast stop response
        for _ in range(60):
            time.sleep(1)
            if _check_stop():
                break

    log("=== ENGINE STOPPED ===", "ENGINE")


if __name__ == "__main__":
    run()
