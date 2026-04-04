"""
NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
Copyright (c) 2026 AMAImedia.com
All rights reserved.
content_manager.py — Content Queue Manager CLI
"""
import json
import os
import sys
import time
import urllib.request
import urllib.parse
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
QUEUE_FILE = os.path.join(BASE_DIR, "content_queue.json")
GEMINI_KEY = os.environ.get("GEMINI_KEY", "YOUR_GEMINI_API_KEY")
VIZARD_KEY = os.environ.get("VIZARD_KEY", "YOUR_VIZARD_API_KEY")
VIZARD_BASE = "https://elb-api.vizard.ai/hvizard-server-front/open-api/v1"

# ── helpers ────────────────────────────────────────────────────────────────────

def _read_queue() -> list:
    if not os.path.exists(QUEUE_FILE):
        return []
    with open(QUEUE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def _save_queue(queue: list) -> None:
    with open(QUEUE_FILE, "w", encoding="utf-8") as f:
        json.dump(queue, f, ensure_ascii=False, indent=2)

def _next_id(queue: list) -> int:
    return max((c["id"] for c in queue), default=0) + 1

def _gemini(prompt: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_KEY}"
    body = json.dumps({
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"maxOutputTokens": 1024, "temperature": 0.8}
    }).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
            return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as exc:
        return f"[Gemini error: {exc}]"

def _vizard_clips(project_id: str) -> list:
    url = f"{VIZARD_BASE}/project/query/{project_id}"
    req = urllib.request.Request(url, headers={"VIZARDAI_API_KEY": VIZARD_KEY})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read())
            return data.get("videos", [])
    except Exception as exc:
        print(f"[vizard error] {exc}")
        return []

# ── commands ───────────────────────────────────────────────────────────────────

def cmd_list():
    """Показать очередь публикаций."""
    queue = _read_queue()
    if not queue:
        print("Очередь пуста.")
        return
    print(f"\n{'ID':>3}  {'Дата':>12}  {'Score':>5}  {'Статус':>12}  Заголовок")
    print("-" * 80)
    for c in sorted(queue, key=lambda x: x.get("scheduled_date", "")):
        status_icon = {"scheduled": "📅", "published": "✅", "error": "❌"}.get(c["status"], "❓")
        score = c.get("viral_score", 0)
        score_color = "🔥" if score >= 9 else ("⚡" if score >= 8 else "·")
        print(f"{c['id']:>3}  {c.get('scheduled_date','—'):>12}  {score_color}{score:.1f}  {status_icon} {c['status']:>10}  {c['title'][:45]}")
    print(f"\nИтого: {len(queue)} | Запланировано: {sum(1 for c in queue if c['status']=='scheduled')}")

def cmd_add(vizard_project_id: str, start_date: str = None, interval_days: int = 2):
    """Добавить клипы из Vizard проекта в очередь с AI подписями."""
    if VIZARD_KEY == "YOUR_VIZARD_API_KEY":
        print("[demo] Vizard ключ не задан — использую пример данных.")
        clips = [
            {"videoId": 99001, "title": "Демо клип 1", "viralScore": "8.5", "videoMsDuration": 45000},
            {"videoId": 99002, "title": "Демо клип 2", "viralScore": "9.1", "videoMsDuration": 52000},
        ]
    else:
        print(f"[vizard] Загружаю клипы из проекта {vizard_project_id}...")
        clips = _vizard_clips(vizard_project_id)

    if not clips:
        print("Клипов не найдено.")
        return

    queue = _read_queue()
    dt = datetime.strptime(start_date, "%Y-%m-%d") if start_date else datetime.now() + timedelta(days=1)

    added = 0
    for i, clip in enumerate(clips):
        title = clip.get("title") or clip.get("headline") or f"Клип {i+1}"
        print(f"  [{i+1}/{len(clips)}] Генерирую подпись для: {title[:40]}...")

        caption = _gemini(
            f"Напиши подпись для Instagram Reels.\n"
            f"Заголовок видео: {title}\n\n"
            f"Структура (строго):\n"
            f"1. Хук — 1 предложение, останавливает скролл\n"
            f"2. Основная мысль — 3-4 строки\n"
            f"3. CTA — призыв написать 'ХОЧУ' в директ\n\n"
            f"Не используй смайлики в каждой строке. До 120 слов."
        )
        hashtags = _gemini(
            f"Дай 7 хэштегов для Instagram Reels по теме: {title}. "
            f"Формат: #хэштег (через пробел, только хэштеги, без пояснений). Русские и английские."
        ).split()

        pub_date = dt + timedelta(days=i * interval_days)
        item = {
            "id": _next_id(queue) + added,
            "type": "reels",
            "vizard_clip_id": clip.get("videoId", clip.get("id", 0)),
            "title": title,
            "caption": caption.strip(),
            "hashtags": hashtags[:8],
            "platform": "instagram",
            "scheduled_date": pub_date.strftime("%Y-%m-%d"),
            "status": "scheduled",
            "viral_score": float(clip.get("viralScore", clip.get("viral_score", 7.0))),
        }
        queue.append(item)
        added += 1
        time.sleep(0.5)

    _save_queue(queue)
    print(f"\n✅ Добавлено {added} клипов в очередь.")

def cmd_next():
    """Показать следующий клип для публикации."""
    queue = _read_queue()
    scheduled = [c for c in queue if c["status"] == "scheduled"]
    if not scheduled:
        print("Нет клипов для публикации.")
        return
    nxt = min(scheduled, key=lambda x: x.get("scheduled_date", "9999"))
    print(f"\n📅 Следующий клип:")
    print(f"  ID: {nxt['id']}")
    print(f"  Заголовок: {nxt['title']}")
    print(f"  Дата: {nxt['scheduled_date']}")
    print(f"  Viral Score: {nxt['viral_score']}/10")
    print(f"  Подпись:\n{nxt['caption'][:200]}...")

def cmd_publish(clip_id: int):
    """Опубликовать клип (обновить статус на published)."""
    queue = _read_queue()
    for item in queue:
        if item["id"] == clip_id:
            item["status"] = "published"
            item["published_at"] = datetime.now().isoformat()
            _save_queue(queue)
            print(f"✅ Клип #{clip_id} отмечен как опубликованный.")
            return
    print(f"Клип #{clip_id} не найден.")

def cmd_reschedule(clip_id: int, new_date: str):
    """Перенести дату публикации."""
    queue = _read_queue()
    for item in queue:
        if item["id"] == clip_id:
            item["scheduled_date"] = new_date
            _save_queue(queue)
            print(f"✅ Клип #{clip_id} перенесён на {new_date}.")
            return
    print(f"Клип #{clip_id} не найден.")

def cmd_delete(clip_id: int):
    """Удалить клип из очереди."""
    queue = _read_queue()
    before = len(queue)
    queue = [c for c in queue if c["id"] != clip_id]
    if len(queue) < before:
        _save_queue(queue)
        print(f"✅ Клип #{clip_id} удалён.")
    else:
        print(f"Клип #{clip_id} не найден.")

def cmd_stats():
    """Статистика очереди."""
    queue = _read_queue()
    by_status = {}
    for c in queue:
        by_status[c["status"]] = by_status.get(c["status"], 0) + 1
    avg_score = sum(c.get("viral_score", 0) for c in queue) / max(len(queue), 1)
    print(f"\n📊 Статистика очереди:")
    for status, count in by_status.items():
        icon = {"scheduled": "📅", "published": "✅", "error": "❌"}.get(status, "·")
        print(f"  {icon} {status}: {count}")
    print(f"  Средний Viral Score: {avg_score:.1f}/10")
    high = [c for c in queue if c.get("viral_score", 0) >= 9 and c["status"] == "scheduled"]
    if high:
        print(f"\n🔥 Топ клипы (score ≥ 9.0):")
        for c in sorted(high, key=lambda x: -x.get("viral_score", 0))[:3]:
            print(f"  [{c['viral_score']}] {c['title'][:50]}")

# ── main ───────────────────────────────────────────────────────────────────────

HELP = """
AMAI Content Manager — управление очередью публикаций

Команды:
  list                          — показать очередь
  next                          — следующий клип
  stats                         — статистика
  add <project_id> [date] [N]   — добавить клипы из Vizard
  publish <id>                  — отметить как опубликован
  reschedule <id> <YYYY-MM-DD>  — перенести дату
  delete <id>                   — удалить из очереди

Примеры:
  python content_manager.py list
  python content_manager.py add abc123 2026-04-10 2
  python content_manager.py publish 3
  python content_manager.py reschedule 4 2026-04-15
"""

if __name__ == "__main__":
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help", "help"):
        print(HELP)
    elif args[0] == "list":
        cmd_list()
    elif args[0] == "next":
        cmd_next()
    elif args[0] == "stats":
        cmd_stats()
    elif args[0] == "add":
        pid = args[1] if len(args) > 1 else "demo"
        date = args[2] if len(args) > 2 else None
        interval = int(args[3]) if len(args) > 3 else 2
        cmd_add(pid, date, interval)
    elif args[0] == "publish":
        cmd_publish(int(args[1]))
    elif args[0] == "reschedule":
        cmd_reschedule(int(args[1]), args[2])
    elif args[0] == "delete":
        cmd_delete(int(args[1]))
    else:
        print(f"Неизвестная команда: {args[0]}")
        print(HELP)
