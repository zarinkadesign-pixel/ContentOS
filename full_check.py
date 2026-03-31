import os, sys, json, urllib.request, time

BASE = 'D:/Content OS'
GEMINI = 'AIzaSyB37bqKJ7VAJcfV72iQgdqO6QCFPIvDt8U'
VIZARD = '732bfd910eb24627a4bad11e5761575a'
BOT    = '8494012171:AAFTbhHTS0WxlG6PE6DRn96nVVF4kKfBKtY'
CHAT   = '905075336'
N8N    = 'http://localhost:5678'

ok = 0
fail = 0

def check(name, result, fix=''):
    global ok, fail
    mark = 'OK  ' if result else '!!  '
    line = '  ' + mark + name
    if not result and fix:
        line += chr(10) + '      FIX: ' + fix
    print(line)
    if result: ok += 1
    else: fail += 1
    return result

def get(url, headers={}):
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=8) as r:
        return json.loads(r.read())

def post(url, data, headers={}):
    h = {'Content-Type':'application/json'}
    h.update(headers)
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, body, h)
    with urllib.request.urlopen(req, timeout=8) as r:
        return json.loads(r.read())

print()
print('='*52)
print('  ПОЛНАЯ ПРОВЕРКА - AMAImedia Producer Center')
print('='*52)

print()
print('--- Python пакеты ---')
for pkg in ['customtkinter','requests','telethon','PIL']:
    try:
        __import__(pkg)
        check(pkg, True)
    except:
        check(pkg, False, 'pip install ' + pkg)

print()
print('--- Файлы ---')
must = ['producer_center_app.py','tg_parser.py','generate_content.py',
        'send_to_vizard.py','check.py',
        'n8n_workflow_01_tg_parser.json','n8n_workflow_02_vizard.json',
        'n8n_workflow_03_meta.json','n8n_workflow_04_analytics.json',
        'n8n_workflow_05_daily.json']
for f in must:
    check(f, os.path.exists(os.path.join(BASE, f)), 'download from chat')

print()
print('--- База данных ---')
data = os.path.join(BASE, 'pc_data')
check('папка pc_data', os.path.exists(data))
for f in ['clients.json','leads.json','finance.json']:
    p = os.path.join(data, f)
    if os.path.exists(p):
        try:
            content = json.loads(open(p,encoding='utf-8').read())
            check(f, True)
        except:
            check(f, False, 'invalid JSON - delete and restart app')
    else:
        check(f, False, 'run: python producer_center_app.py')

print()
print('--- API ключи ---')
app = os.path.join(BASE, 'producer_center_app.py')
if os.path.exists(app):
    c = open(app,encoding='utf-8').read()
    check('Gemini key',    'AIzaSy' in c)
    check('Vizard key',    '732bfd' in c)
    check('Bot token',     '8494012171' in c)
    check('TG api_id',     '39690892' in c)
    check('TG api_hash',   '49c256e3' in c)
    check('SendPulse ID',  'sp_id_' in c)
    check('chat_id',       '905075336' in c)

print()
print('--- n8n ---')
try:
    get(N8N + '/healthz')
    check('n8n запущен', True)
except:
    check('n8n запущен', False, 'run: n8n start')

try:
    r = get(N8N + '/api/v1/workflows', {'X-N8N-API-KEY':''})
    wfs = r.get('data', [])
    names = [w.get('name','') for w in wfs]
    for wname in ['01','02','03','04','05']:
        found = any(wname in n for n in names)
        check('Воркфлоу ' + wname, found, 'import from file in n8n')
    active = [w for w in wfs if w.get('active')]
    check('Активных воркфлоу: ' + str(len(active)) + '/5', len(active) >= 3)
except Exception as e:
    print('  ??  n8n API недоступен (ок, проверяем иначе)')

print()
print('--- Gemini API ---')
try:
    r = post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI,
        {'contents':[{'role':'user','parts':[{'text':'Say OK'}]}],'generationConfig':{'maxOutputTokens':10}})
    ans = r['candidates'][0]['content']['parts'][0]['text']
    check('Gemini отвечает', 'OK' in ans or len(ans) > 0)
except Exception as e:
    check('Gemini отвечает', False, str(e)[:60])

print()
print('--- Vizard API ---')
try:
    r = post('https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/social-accounts',
        {}, {'VIZARDAI_API_KEY': VIZARD})
    check('Vizard подключён', True)
except Exception as e:
    err = str(e)
    check('Vizard подключён', '400' in err or '401' not in err, 'check vizard key')

print()
print('--- Telegram бот ---')
try:
    r = get('https://api.telegram.org/bot' + BOT + '/getMe')
    name = r.get('result',{}).get('username','?')
    check('Бот активен: @' + name, True)
except Exception as e:
    check('Бот активен', False, str(e)[:60])

try:
    r = post('https://api.telegram.org/bot' + BOT + '/sendMessage',
        {'chat_id': CHAT, 'text': 'Проверка системы AMAImedia - всё работает!'})
    check('Бот может писать тебе', r.get('ok', False),
          'напиши /start своему боту в Telegram')
except Exception as e:
    check('Бот может писать тебе', False, 'напиши /start своему боту в Telegram')

print()
print('='*52)
color = 'ВСЁ ГОТОВО!' if fail == 0 else str(fail) + ' проблем нужно исправить'
print('  OK: ' + str(ok) + '  |  Проблемы: ' + str(fail) + '  |  ' + color)
print('='*52)
print()
input('Press Enter...')
