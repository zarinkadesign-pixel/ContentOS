"""
NOESIS — AMAImedia Autonomous Engine v4.0
Copyright (c) 2026 AMAImedia.com
D:/Content OS/engine.py
"""
import threading, time, json, os, urllib.request, sys
from datetime import datetime

# Fix Windows console encoding for Cyrillic and Unicode symbols
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE   = os.path.dirname(os.path.abspath(__file__))
DATA   = os.path.join(BASE, "pc_data")
STATE  = os.path.join(DATA, "engine_state.json")
LOG    = os.path.join(BASE, "logs", "engine.log")
GEMINI = "YOUR_GEMINI_KEY"
BOT    = "YOUR_BOT_TOKEN"
CHAT   = "YOUR_CHAT_ID"
VIZARD = "YOUR_VIZARD_KEY"
N8N    = "http://localhost:5678"

os.makedirs(DATA, exist_ok=True)
os.makedirs(os.path.join(BASE, "logs"), exist_ok=True)

S = {
    "running": True, "stop_signal": False,
    "started_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "events": [],
    "agents": {
        "scorer":    {"status": "idle", "today": 0, "total": 0},
        "nurture":   {"status": "idle", "today": 0, "total": 0},
        "publisher": {"status": "idle", "today": 0, "total": 0},
        "analyst":   {"status": "idle", "today": 0, "total": 0},
    },
    "tasks": {},
    "stats": {"leads_today": 0, "messages_sent": 0,
              "content_published": 0, "calls_scheduled": 0}
}

def save():
    try:
        with open(STATE, "w", encoding="utf-8") as f:
            json.dump(S, f, ensure_ascii=False, indent=2)
    except: pass

def log(msg, lvl="INFO"):
    ts = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}][{lvl}] {msg}"
    print(line)
    try:
        with open(LOG, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except: pass
    S["events"].insert(0, {"time": ts, "msg": msg, "level": lvl})
    S["events"] = S["events"][:100]
    save()

def http(url, data=None, headers={}):
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        h = {"Content-Type": "application/json"}
        h.update(headers)
        req = urllib.request.Request(url, body, h)
    else:
        req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())

def tg(text):
    try:
        http(f"https://api.telegram.org/bot{BOT}/sendMessage",
             {"chat_id": CHAT, "text": str(text)[:4000]})
    except Exception as e:
        log(f"TG error: {e}", "ERROR")

def gemini(prompt):
    try:
        r = http(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI}",
            {"contents": [{"role": "user", "parts": [{"text": prompt}]}],
             "generationConfig": {"maxOutputTokens": 600}}
        )
        return r["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        log(f"Gemini error: {e}", "ERROR")
        return ""

def load_j(name, default):
    try:
        with open(os.path.join(DATA, f"{name}.json"), encoding="utf-8") as f:
            return json.load(f)
    except: return default

def save_j(name, data):
    with open(os.path.join(DATA, f"{name}.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# ── ЗАДАЧИ ────────────────────────────────────────────────────

def task_briefing():
    log("Генерирую брифинг дня...", "ANALYST")
    S["agents"]["analyst"]["status"] = "working"; save()
    leads = load_j("leads", [])
    clients = load_j("clients", [])
    hot = len([l for l in leads if l.get("score", 0) >= 70])
    text = gemini(
        f"Утренний брифинг директора SMM-агентства AMAImedia (Зарина, Нячанг, Вьетнам).\n"
        f"Данные: лидов {len(leads)}, горячих {hot}, клиентов {len(clients)}.\n"
        f"Дай: 1) ТОП-3 задачи на сегодня 2) Кому из лидов написать первым.\n"
        f"Кратко, 5-7 строк, по-деловому, на русском."
    )
    if text:
        tg(f"☀️ Доброе утро, Зарина!\n\n{text}")
        log("Брифинг отправлен в Telegram", "ANALYST")
    else:
        log("Брифинг не отправлен (пустой ответ AI)", "ERROR")
    S["agents"]["analyst"]["status"] = "idle"; save()

def task_scoring():
    log("Запуск скоринга лидов...", "SCORER")
    S["agents"]["scorer"]["status"] = "working"; save()
    leads = load_j("leads", [])
    changed = False
    for lead in leads:
        if lead.get("score") is not None:
            continue
        niche  = lead.get("niche", "")
        notes  = lead.get("notes", "")
        source = lead.get("source", "")
        if not niche and not notes:
            lead["score"] = 40; changed = True; continue
        resp = gemini(
            f"Оцени потенциал лида от 0 до 100. Ответь ТОЛЬКО числом.\n"
            f"Ниша: {niche}\nИсточник: {source}\nЗаметки: {notes}\n"
            f"Критерии оценки:\n"
            f"- Есть боль которую мы решаем: 0-25 баллов\n"
            f"- Есть деньги на продукт: 0-25 баллов\n"
            f"- Срочность (хочет сейчас): 0-20 баллов\n"
            f"- Подходит под нашу аудиторию: 0-20 баллов\n"
            f"- Активен в соцсетях: 0-10 баллов\n"
            f"Ответь только числом от 0 до 100."
        )
        try:
            digits = "".join(c for c in resp.strip()[:5] if c.isdigit())
            score = max(0, min(100, int(digits)))
        except:
            score = 50
        lead["score"] = score
        changed = True
        S["agents"]["scorer"]["today"] += 1
        S["agents"]["scorer"]["total"] += 1
        log(f"Score: {lead.get('name', '?')} = {score}", "SCORER")
        if score >= 80:
            tg(
                f"🔥 ГОРЯЧИЙ ЛИД! Score: {score}/100\n\n"
                f"Имя: {lead.get('name', '?')}\n"
                f"Ниша: {niche}\n"
                f"Контакт: {lead.get('contact', 'нет')}\n\n"
                f"Рекомендую написать сегодня!"
            )
            log(f"Уведомление о горячем лиде: {lead.get('name')}", "HOT")
        time.sleep(2)
    if changed:
        save_j("leads", leads)
        today_str = datetime.now().strftime("%d.%m")
        S["stats"]["leads_today"] = len([
            l for l in leads if l.get("date", "") == today_str
        ])
    S["agents"]["scorer"]["status"] = "idle"; save()

def task_nurture():
    log("Проверка прогрева лидов...", "NURTURE")
    S["agents"]["nurture"]["status"] = "working"; save()
    leads = load_j("leads", [])
    now = datetime.now()
    changed = False
    day_themes = [
        "знакомство с Зариной — история перезапуска бизнеса из Нячанга после потери $60k",
        "боль — хаотичный постинг и выгорание без системы продаж",
        "решение — записала подкаст раз в месяц, получила 15 Reels на автопилоте",
        "кейс клиента — вырос с $2k до $12k за 3 месяца, конкретные цифры",
        "диагностика — 4 вопроса да/нет о готовности блога продавать",
        "приглашение на бесплатный разбор конкретно для их ниши",
        "финальный оффер — аудит $150, наставничество $1500 или продюсирование $3000",
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
                if diff < 82800:
                    continue
            except: pass
        niche = lead.get("niche", "эксперт")
        msg = gemini(
            f"Напиши прогревочное сообщение для лида. День {day+1} из 7.\n"
            f"Тема сегодня: {day_themes[day]}\n"
            f"Ниша клиента: {niche}\n"
            f"О нас: AMAImedia — продюсерский центр, помогаем экспертам "
            f"строить системные продажи через контент.\n"
            f"Требования: живой разговорный стиль, без давления, 3-4 предложения. "
            f"В конце: кодовое слово ХОЧУ или открытый вопрос."
        )
        if msg:
            try:
                http(f"{N8N}/webhook/tg-parser", {
                    "contact": lead.get("contact", ""),
                    "message": msg,
                    "name": lead.get("name", "")
                })
                lead["nurture_day"] = day + 1
                lead["last_nurture"] = now.strftime("%Y-%m-%d %H:%M")
                S["agents"]["nurture"]["today"] += 1
                S["agents"]["nurture"]["total"] += 1
                S["stats"]["messages_sent"] += 1
                log(f"Прогрев день {day+1}/7: {lead.get('name', '?')}", "NURTURE")
                changed = True
            except Exception as e:
                log(f"Ошибка отправки прогрева: {e}", "ERROR")
            time.sleep(3)
    if changed:
        save_j("leads", leads)
    S["agents"]["nurture"]["status"] = "idle"; save()

def task_publish():
    log("Проверка очереди публикаций...", "PUBLISHER")
    S["agents"]["publisher"]["status"] = "working"; save()
    queue = load_j("content_queue", [])
    now = datetime.now()
    published_one = False
    for item in queue:
        if item.get("status") != "scheduled":
            continue
        try:
            sched = datetime.strptime(item["scheduled_date"], "%Y-%m-%d")
        except:
            continue
        if sched.date() > now.date():
            continue
        if published_one:
            break
        try:
            http(
                "https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/publish-video",
                {"finalVideoId": item.get("vizard_clip_id"),
                 "post": item.get("caption", ""),
                 "publishTime": int(now.timestamp() * 1000)},
                {"VIZARDAI_API_KEY": VIZARD}
            )
            item["status"] = "published"
            item["published_at"] = now.strftime("%Y-%m-%d %H:%M")
            S["agents"]["publisher"]["today"] += 1
            S["agents"]["publisher"]["total"] += 1
            S["stats"]["content_published"] += 1
            title = item.get("title", "клип")[:40]
            score = item.get("viral_score", "?")
            tg(f"📹 Клип опубликован!\n\n{title}\nViral score: {score}")
            log(f"Опубликован: {title}", "PUBLISHER")
            published_one = True
        except Exception as e:
            item["status"] = "error"
            item["error"] = str(e)
            log(f"Ошибка публикации: {e}", "ERROR")
    save_j("content_queue", queue)
    S["agents"]["publisher"]["status"] = "idle"; save()

def task_weekly_report():
    log("Генерирую недельный отчёт...", "ANALYST")
    S["agents"]["analyst"]["status"] = "working"; save()
    leads   = load_j("leads", [])
    clients = load_j("clients", [])
    hot = len([l for l in leads if l.get("score", 0) >= 70])
    text = gemini(
        f"Недельный отчёт для директора агентства AMAImedia.\n"
        f"Статистика: лидов {len(leads)} (горячих {hot}), "
        f"клиентов {len(clients)}, "
        f"опубликовано клипов {S['stats']['content_published']}, "
        f"сообщений отправлено {S['stats']['messages_sent']}.\n"
        f"Дай: итоги недели с цифрами, что сработало, "
        f"что улучшить, ТОП-3 задачи на следующую неделю."
    )
    if text:
        tg(f"📊 НЕДЕЛЬНЫЙ ОТЧЁТ:\n\n{text}")
        log("Недельный отчёт отправлен", "ANALYST")
    S["agents"]["analyst"]["status"] = "idle"; save()

# ── ПЛАНИРОВЩИК ───────────────────────────────────────────────

TASKS = [
    # (имя,           функция,             интервал_мин, час, день_нед)
    ("briefing",      task_briefing,        1440,         9,   None),  # ежедн 09:00
    ("scoring",       task_scoring,         15,           None, None), # каждые 15 мин
    ("nurture",       task_nurture,         60,           None, None), # каждый час
    ("publish",       task_publish,         120,          10,  None),  # каждые 2ч в 10:xx
    ("weekly_report", task_weekly_report,   10080,        20,  6),     # вс 20:00
]

def should_run(name, interval, hour, weekday):
    now = datetime.now()
    info = S["tasks"].get(name, {})
    last = info.get("last_run", "")
    if last:
        try:
            elapsed = (now - datetime.strptime(last, "%Y-%m-%d %H:%M:%S")).total_seconds() / 60
            if elapsed < interval:
                return False
        except: pass
    if hour     is not None and now.hour     != hour:    return False
    if weekday  is not None and now.weekday() != weekday: return False
    return True

def mark_done(name):
    S["tasks"][name] = {
        "last_run": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "count": S["tasks"].get(name, {}).get("count", 0) + 1
    }
    save()

def check_stop():
    try:
        with open(STATE, encoding="utf-8") as f:
            cur = json.load(f)
        return cur.get("stop_signal", False)
    except:
        return False

# ── MAIN ──────────────────────────────────────────────────────

if __name__ == "__main__":
    log("=== ENGINE STARTED v4.0 — AMAImedia ===", "ENGINE")
    tg("⚡ AMAImedia Engine v4.0 запущен!\nАвтопилот работает 24/7.\nПервый брифинг в 09:00.")
    save()

    while True:
        try:
            if check_stop():
                log("Получен сигнал остановки. Завершаю.", "ENGINE")
                S["running"] = False
                S["stop_signal"] = True
                save()
                break
            for name, func, interval, hour, weekday in TASKS:
                if should_run(name, interval, hour, weekday):
                    log(f"→ Запускаю задачу: {name}", "ENGINE")
                    t = threading.Thread(target=func, daemon=True, name=name)
                    t.start()
                    mark_done(name)
            time.sleep(60)
        except KeyboardInterrupt:
            log("Остановлен вручную (Ctrl+C)", "ENGINE")
            break
        except Exception as e:
            log(f"Ошибка главного цикла: {e}", "ERROR")
            time.sleep(60)
