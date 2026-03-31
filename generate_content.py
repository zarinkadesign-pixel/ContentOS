import urllib.request, json, os

GEMINI_KEY = 'AIzaSyB37bqKJ7VAJcfV72iQgdqO6QCFPIvDt8U'
BASE = 'D:/Content OS'

def ask(prompt):
    url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_KEY
    body = json.dumps({'contents':[{'role':'user','parts':[{'text':prompt}]}],'generationConfig':{'maxOutputTokens':2048}}).encode()
    req = urllib.request.Request(url, body, {'Content-Type':'application/json'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["candidates"][0]["content"]["parts"][0]["text"]

print()
print("=== Генератор контента AMAImedia ===")
print()

niche = input("Твоя ниша (например: нутрициология, коучинг, дизайн): ").strip()
name  = input("Твоё имя или имя клиента: ").strip()
topic = input("Главная тема экспертизы (например: похудение без диет): ").strip()

print()
print("Генерирую контент-план...")
print()

ctx = f"Эксперт: {name}. Ниша: {niche}. Тема: {topic}."

# 1. Podcast questions
print("[1/4] 15 вопросов для подкаста...")
q1 = ask(ctx + " Создай 15 глубоких вопросов для подкаста. Вопросы должны вызывать истории, эмоции и конкретные советы. Нумерованный список.")

# 2. Reels topics
print("[2/4] 20 тем для Reels...")
q2 = ask(ctx + " Создай 20 тем для коротких видео Reels. Каждая тема: хук + основная идея. Нумерованный список.")

# 3. Ad scripts
print("[3/4] 9 рекламных сценариев...")
q3 = ask(ctx + " Создай 9 рекламных текстов (3 группы по 3). Группа 1: боль-решение. Группа 2: желание-результат. Группа 3: социальное доказательство. Каждый текст: хук + тело + CTA.")

# 4. Month content plan
print("[4/4] Контент-план на месяц...")
q4 = ask(ctx + " Создай контент-план на месяц (4 недели). Для каждой недели: тема недели + 5 постов с темами. Формат таблицы.")

# Save to file
output = f"""КОНТЕНТ-ПЛАН: {name} | {niche}
{'='*60}

15 ВОПРОСОВ ДЛЯ ПОДКАСТА
{'-'*60}
{q1}

20 ТЕМ ДЛЯ REELS
{'-'*60}
{q2}

9 РЕКЛАМНЫХ СЦЕНАРИЕВ
{'-'*60}
{q3}

КОНТЕНТ-ПЛАН НА МЕСЯЦ
{'-'*60}
{q4}
"""

path = os.path.join(BASE, f"content_plan_{name.replace(" ","_")}.txt")
with open(path, "w", encoding="utf-8") as f:
    f.write(output)

print()
print("="*50)
print("Контент-план сохранён:")
print(path)
print()
print("СЛЕДУЮЩИЙ ШАГ:")
print("1. Открой файл и прочитай 15 вопросов")
print("2. Запиши подкаст (3-5 часов) отвечая на них")
print("3. Загрузи видео на YouTube или Google Drive")
print("4. Запусти: python send_to_vizard.py ССЫЛКА_НА_ВИДЕО")
print()
input("Press Enter...")
