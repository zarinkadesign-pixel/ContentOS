import os, sys, json

BASE = 'D:/Content OS'
print()
print('='*50)
print('  AMAImedia Producer Center - CHECK')
print('='*50)

ok = 0
fail = 0

def check(name, result, detail=''):
    global ok, fail
    if result:
        print('  OK  ' + name)
        ok += 1
    else:
        print('  !!  ' + name + (' - ' + detail if detail else ''))
        fail += 1
    return result

print()
print('--- Python ---')
check('Python version', sys.version_info >= (3,10), str(sys.version))

print()
print('--- Packages ---')
pkgs = ['customtkinter','requests','telethon']
for pkg in pkgs:
    try:
        __import__(pkg)
        check(pkg, True)
    except ImportError:
        check(pkg, False, 'run: pip install ' + pkg)

print()
print('--- Files ---')
files = [
    'producer_center_app.py',
    'tg_parser.py',
    'n8n_workflow_01_tg_parser.json',
    'n8n_workflow_02_vizard.json',
    'n8n_workflow_03_meta.json',
    'n8n_workflow_04_analytics.json',
    'n8n_workflow_05_daily.json',
]
for f in files:
    path = os.path.join(BASE, f)
    check(f, os.path.exists(path), 'not found')

print()
print('--- Data folder ---')
data = os.path.join(BASE, 'pc_data')
check('pc_data folder', os.path.exists(data), 'will be created on first run')
if os.path.exists(data):
    for f in ['clients.json','leads.json','finance.json']:
        p = os.path.join(data, f)
        check(f, os.path.exists(p))

print()
print('--- Config (producer_center_app.py) ---')
app = os.path.join(BASE, 'producer_center_app.py')
if os.path.exists(app):
    content = open(app, encoding='utf-8').read()
    check('import os',         'import os' in content[:200])
    check('GEMINI_KEY set',    'AIzaSy' in content)
    check('VIZARD_KEY set',    '732bfd' in content)
    check('BOT_TOKEN set',     '8494012171' in content)
    check('TG_API_ID set',     '39690892' in content)
    check('TG_API_HASH set',   '49c256e3' in content)
    check('SENDPULSE set',     'sp_id_' in content)

print()
print('--- n8n ---')
try:
    import urllib.request
    urllib.request.urlopen('http://localhost:5678/healthz', timeout=3)
    check('n8n running', True)
except:
    check('n8n running', False, 'run: n8n start')

print()
print('='*50)
print('  OK: ' + str(ok) + '  |  Problems: ' + str(fail))
print('='*50)
print()
if fail > 0:
    print('Fix the !! items above, then run check again.')
else:
    print('Everything is ready!')
print()
input('Press Enter...')
