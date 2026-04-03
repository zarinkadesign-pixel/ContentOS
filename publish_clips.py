import urllib.request, json, time

GEMINI = 'YOUR_GEMINI_API_KEY'
VIZARD = '732bfd910eb24627a4bad11e5761575a'
BOT    = 'YOUR_TELEGRAM_BOT_TOKEN'
CHAT   = '905075336'
VIZARD_BASE = 'https://elb-api.vizard.ai/hvizard-server-front/open-api/v1'

CLIPS = [
    {"videoId": 42592214, "title": "Как получать клиентов 24/7 без ежедневного постинга сторис", "viralScore": "10"},
    {"videoId": 42592212, "title": "Как продавать в блоге 24/7 без ежедневных сторис?", "viralScore": "10"},
    {"videoId": 42592208, "title": "Как перестать выгорать от Reels и начать продавать", "viralScore": "10"},
    {"videoId": 42592203, "title": "Как получать 30% конверсию в продажи через воронки", "viralScore": "10"},
    {"videoId": 42592195, "title": "Как монетизировать свой блог прямо сейчас?", "viralScore": "9.5"},
    {"videoId": 42592190, "title": "Как перестать выгорать от съемки сторис и контента", "viralScore": "9.2"},
    {"videoId": 42592187, "title": "Как получать клиентов 24/7 без хаотичного постинга", "viralScore": "9.2"},
    {"videoId": 42592184, "title": "Тест: готов ли твой блог продавать?", "viralScore": "9"},
    {"videoId": 42592179, "title": "Простая формула фирменного стиля в 3 цвета", "viralScore": "9"},
    {"videoId": 42592175, "title": "Почему твоя воронка не дает 100% продаж?", "viralScore": "9"},
]

def gemini(prompt):
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI
    body = json.dumps({"contents":[{"role":"user","parts":[{"text":prompt}]}],"generationConfig":{"maxOutputTokens":300}}).encode()
    req = urllib.request.Request(url, body, {"Content-Type":"application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["candidates"][0]["content"]["parts"][0]["text"]

def publish(video_id, caption, publish_ms):
    url = VIZARD_BASE + "/project/publish-video"
    headers = {"VIZARDAI_API_KEY": VIZARD, "Content-Type": "application/json"}
    body = json.dumps({"finalVideoId": video_id, "post": caption, "publishTime": publish_ms}).encode()
    req = urllib.request.Request(url, body, headers)
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

def tg(text):
    url = "https://api.telegram.org/bot" + BOT + "/sendMessage"
    body = json.dumps({"chat_id": CHAT, "text": text}).encode()
    req = urllib.request.Request(url, body, {"Content-Type":"application/json"})
    urllib.request.urlopen(req, timeout=10)

print()
print("=" * 50)
print("  Публикация " + str(len(CLIPS)) + " клипов Vizard")
print("=" * 50)

success = 0
report_lines = ["РАСПИСАНИЕ ПУБЛИКАЦИЙ
" + "="*40]

for i, clip in enumerate(CLIPS):
    title = clip["title"]
    vid   = clip["videoId"]
    score = clip["viralScore"]
    days  = i * 2
    pub_ms = int(time.time() * 1000) + (days * 86400 * 1000)
    from datetime import datetime, timedelta
    pub_date = (datetime.now() + timedelta(days=days)).strftime("%d.%m.%Y")

    print()
    print(str(i+1) + "/" + str(len(CLIPS)) + " Score:" + str(score) + " - " + title[:45])
    print("    Дата выхода: " + pub_date)

    # Generate caption
    print("    Генерирую подпись...")
    try:
        caption = gemini(
            "Напиши подпись для Instagram Reels на тему: " + title + ".
"
            "Формат: хук (1 цепляющее предложение) + польза (2 предложения) + призыв написать ХОЧУ в комментарии + 5 хэштегов.
"
            "Стиль: живой, разговорный, как эксперт говорит с аудиторией. До 100 слов."
        )
        time.sleep(2)
    except Exception as e:
        caption = title + "

Напиши ХОЧУ в комментарии ↓

#продажи #воронки #экспертблог #монетизация #инстаграм"
        print("    Gemini error: " + str(e)[:40] + " - используем дефолт")

    # Publish
    print("    Публикую в Vizard...")
    try:
        r = publish(vid, caption, pub_ms)
        print("    OK - запланировано на " + pub_date)
        success += 1
        report_lines.append(pub_date + " | Score:" + str(score) + " | " + title[:40])
    except Exception as e:
        print("    Error: " + str(e)[:60])
        report_lines.append(pub_date + " | FAILED | " + title[:40])

    time.sleep(1)

# Save report
report = "
".join(report_lines)
with open("D:/Content OS/schedule_report.txt", "w", encoding="utf-8") as f:
    f.write(report)

# Send Telegram notification
msg = ("КОНТЕНТ ГОТОВ! " + str(success) + "/" + str(len(CLIPS)) + " клипов запланировано

"
       + "
".join(report_lines[1:6])
       + "
...и ещё " + str(len(CLIPS)-5) + " клипов

"
       + "Отчёт: D:/Content OS/schedule_report.txt")
try:
    tg(msg)
    print()
    print("Уведомление отправлено в Telegram!")
except Exception as e:
    print("TG: " + str(e))

print()
print("=" * 50)
print("ГОТОВО! Запланировано: " + str(success) + "/" + str(len(CLIPS)) + " публикаций")
print("Первая выйдет СЕГОДНЯ, последняя через 18 дней")
print("Отчёт сохранён: D:/Content OS/schedule_report.txt")
print("=" * 50)
print()
input("Press Enter...")
