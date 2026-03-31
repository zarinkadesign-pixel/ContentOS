import urllib.request, json, sys, os, time

GEMINI_KEY = 'AIzaSyB37bqKJ7VAJcfV72iQgdqO6QCFPIvDt8U'
VIZARD_KEY = '732bfd910eb24627a4bad11e5761575a'
BOT_TOKEN  = '8494012171:AAFTbhHTS0WxlG6PE6DRn96nVVF4kKfBKtY'
CHAT_ID    = '905075336'
VIZARD_BASE = 'https://elb-api.vizard.ai/hvizard-server-front/open-api/v1'

def tg(text):
    try:
        url = f'https://api.telegram.org/bot{BOT_TOKEN}/sendMessage'
        data = json.dumps({'chat_id': CHAT_ID, 'text': text}).encode()
        req = urllib.request.Request(url, data, {'Content-Type':'application/json'})
        urllib.request.urlopen(req, timeout=10)
    except Exception as e:
        print('TG error: ' + str(e))

def vizard(method, data=None, path_suffix=''):
    url = VIZARD_BASE + path_suffix
    headers = {'VIZARDAI_API_KEY': VIZARD_KEY, 'Content-Type': 'application/json'}
    if data:
        body = json.dumps(data).encode()
        req = urllib.request.Request(url, body, headers, method=method)
    else:
        req = urllib.request.Request(url, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def gemini(prompt):
    url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_KEY
    body = json.dumps({'contents':[{'role':'user','parts':[{'text':prompt}]}],'generationConfig':{'maxOutputTokens':1024}}).encode()
    req = urllib.request.Request(url, body, {'Content-Type':'application/json'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())['candidates'][0]['content']['parts'][0]['text']

if len(sys.argv) < 2:
    print()
    print('Использование:')
    print('  python send_to_vizard.py URL_ВИДЕО')
    print()
    print('Пример:')
    print('  python send_to_vizard.py https://www.youtube.com/watch?v=XXXXX')
    print()
    video_url = input('Вставь URL видео: ').strip()
else:
    video_url = sys.argv[1]

if not video_url:
    print('URL не указан')
    sys.exit(1)

print()
print('='*50)
print('  Vizard Pipeline - AMAImedia')
print('='*50)
print('URL: ' + video_url[:60])
print()

# Step 1: Create project
print('[1/4] Отправляем в Vizard...')
try:
    r = vizard('POST', {
        'videoUrl': video_url,
        'videoType': 2 if 'youtu' in video_url else 1,
        'lang': 'ru',
        'preferLength': [2],
        'maxClipNumber': 15,
        'ratioOfClip': 4,
        'subtitleSwitch': 1,
        'emojiSwitch': 1,
        'highlightSwitch': 1,
        'headlineSwitch': 1,
        'removeSilenceSwitch': 1
    }, '/project/create')
    
    project_id = r.get('data', {}).get('projectId') or r.get('projectId')
    if not project_id:
        print('Ошибка Vizard: ' + str(r))
        sys.exit(1)
    
    print('OK! Project ID: ' + str(project_id))
    tg('Vizard запущен! ID: ' + str(project_id) + ' Обработка займёт 20-30 мин...')
except Exception as e:
    print('Ошибка: ' + str(e))
    sys.exit(1)

# Step 2: Poll
print()
print('[2/4] Ждём нарезку (проверяем каждые 5 минут)...')
clips = []
for attempt in range(12):
    time.sleep(300)
    try:
        r = vizard('GET', path_suffix='/project/query/' + str(project_id))
        code = r.get('data', {}).get('code') or r.get('code', 1000)
        if code == 2000:
            clips = r.get('data', {}).get('videos', [])
            print('Клипов готово: ' + str(len(clips)))
            break
        else:
            print('Попытка ' + str(attempt+1) + '/12 - ещё обрабатывается...')
    except Exception as e:
        print('Poll error: ' + str(e))

if not clips:
    print('Клипы не готовы за 60 минут. Проверь vizard.ai вручную.')
    tg('Vizard timeout. Проверь vizard.ai для проекта ' + str(project_id))
    sys.exit(1)

# Step 3: Captions
print()
print('[3/4] Генерируем подписи (' + str(len(clips)) + ' клипов)...')
results = []
for i, clip in enumerate(clips):
    title = clip.get('title', 'Видео ' + str(i+1))
    score = clip.get('viralScore', 0)
    print('  Клип ' + str(i+1) + ': ' + title[:40] + ' (score: ' + str(score) + ')')
    try:
        caption = gemini('Напиши подпись для Instagram Reels. Тема: ' + title + '. Хук (1 предложение) + суть (2 предложения) + призыв к действию + 5 хэштегов. До 120 слов.')
    except:
        caption = title
    results.append({'clip': clip, 'caption': caption, 'publish_day': i * 2})

# Step 4: Schedule
print()
print('[4/4] Планируем публикации...')
success = 0
for item in results:
    publish_ms = int(time.time() * 1000) + (item['publish_day'] * 86400000)
    try:
        vizard('POST', {
            'finalVideoId': item['clip']['videoId'],
            'post': item['caption'],
            'publishTime': publish_ms
        }, '/project/publish-video')
        success += 1
    except Exception as e:
        print('Publish error: ' + str(e))

# Save report
report = '='*50 + chr(10) + 'VIZARD ОТЧЁТ' + chr(10) + '='*50 + chr(10)
report += 'Видео: ' + video_url + chr(10)
report += 'Клипов нарезано: ' + str(len(clips)) + chr(10)
report += 'Запланировано: ' + str(success) + chr(10) + chr(10)
for i, item in enumerate(results):
    report += str(i+1) + '. ' + item['clip'].get('title','?')[:50] + chr(10)
    report += '   Score: ' + str(item['clip'].get('viralScore','?')) + chr(10)
    report += '   День выхода: +' + str(item['publish_day']) + chr(10) + chr(10)

path = 'D:/Content OS/vizard_report.txt'
with open(path, 'w', encoding='utf-8') as f:
    f.write(report)

print()
print('='*50)
print('ГОТОВО!')
print('Клипов нарезано: ' + str(len(clips)))
print('Запланировано: ' + str(success))
print('Отчёт: D:/Content OS/vizard_report.txt')
print('='*50)

tg('Vizard готов! Нарезано: ' + str(len(clips)) + ' клипов. Запланировано: ' + str(success) + ' публикаций на ' + str(success*2) + ' дней.')
input('Press Enter...')
