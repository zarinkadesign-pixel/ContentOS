"""
NOESIS — AMAImedia Autonomous Engine v4.0
Copyright (c) 2026 AMAImedia.com
D:/Content OS/engine.py
"""
import threading, time, json, os, urllib.request
from datetime import datetime

BASE   = os.path.dirname(os.path.abspath(__file__))
DATA   = os.path.join(BASE, "pc_data")
LOGS   = os.path.join(BASE, "logs")
STATE  = os.path.join(DATA, "engine_state.json")
GEMINI = "AIzaSyB37bqKJ7VAJcfV72iQgdqO6QCFPIvDt8U"
BOT    = "8494012171:AAFTbhHTS0WxlG6PE6DRn96nVVF4kKfBKtY"
CHAT   = "905075336"
VIZARD = "732bfd910eb24627a4bad11e5761575a"
N8N    = "http://localhost:5678"

os.makedirs(DATA, exist_ok=True)
os.makedirs(LOGS, exist_ok=True)

S = {
    "running": True, "stop_signal": False,
    "started_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "events": [],
    "agents": {
        "scorer":    {"status":"idle","today":0,"total":0},
        "nurture":   {"status":"idle","today":0,"total":0},
        "publisher": {"status":"idle","today":0,"total":0},
        "analyst":   {"status":"idle","today":0,"total":0},
    },
    "tasks": {},
    "stats": {"leads_today":0,"messages_sent":0,"content_published":0,"calls_scheduled":0}
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
        with open(os.path.join(LOGS,"engine.log"),"a",encoding="utf-8") as f:
            f.write(line+"\n")
    except: pass
    S["events"].insert(0, {"time":ts,"msg":msg,"level":lvl})
    S["events"] = S["events"][:100]
    save()

def post(url, data, headers={}):
    body = json.dumps(data).encode("utf-8")
    h = {"Content-Type":"application/json"}
    h.update(headers)
    req = urllib.request.Request(url, body, h)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())

def tg(text):
    try:
        post(f"https://api.telegram.org/bot{BOT}/sendMessage",
             {"chat_id":CHAT,"text":str(text)[:4000]})
    except Exception as e:
        log(f"TG error: {e}","ERROR")

def gemini(prompt):
    try:
        r = post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI}",
            {"contents":[{"role":"user","parts":[{"text":prompt}]}],
             "generationConfig":{"maxOutputTokens":600}}
        )
        return r["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        log(f"Gemini error: {e}","ERROR")
        return ""

def load(name, default):
    try:
        with open(os.path.join(DATA,f"{name}.json"),encoding="utf-8") as f:
            return json.load(f)
    except: return default

def dump(name, data):
    with open(os.path.join(DATA,f"{name}.json"),"w",encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def task_briefing():
    log("Генерирую брифинг...","ANALYST")
    S["agents"]["analyst"]["status"]="working"; save()
    leads = load("leads",[])
    clients = load("clients",[])
    hot = len([l for l in leads if l.get("score",0)>=70])
    text = gemini(
        f"Утренний брифинг директора AMAImedia (Зарина, Нячанг).\n"
        f"Лидов:{len(leads)}, горячих:{hot}, клиентов:{len(clients)}.\n"
        f"Дай: 1) ТОП-3 задачи на сегодня 2) Кому из лидов написать.\n"
        f"Кратко, 5-7 строк, на русском."
    )
    if text:
        tg(f"☀️ Доброе утро, Зарина!\n\n{text}")
        log("Брифинг отправлен","ANALYST")
    S["agents"]["analyst"]["status"]="idle"; save()

def task_scoring():
    log("Скоринг лидов...","SCORER")
    S["agents"]["scorer"]["status"]="working"; save()
    leads = load("leads",[])
    changed = False
    for lead in leads:
        if lead.get("score") is not None: continue
        niche = lead.get("niche","")
        notes = lead.get("notes","")
        if not niche and not notes:
            lead["score"] = 40; changed=True; continue
        resp = gemini(
            f"Оцени лида от 0 до 100. Ответь ТОЛЬКО числом.\n"
            f"Ниша:{niche} Источник:{lead.get('source','')} Заметки:{notes}\n"
            f"Критерии: боль(25)+бюджет(25)+срочность(20)+подходит(20)+контакт(10)"
        )
        try: score = max(0,min(100,int("".join(c for c in resp.strip()[:5] if c.isdigit()))))
        except: score=50
        lead["score"]=score; changed=True
        S["agents"]["scorer"]["today"]+=1; S["agents"]["scorer"]["total"]+=1
        log(f"Score {lead.get('name','?')}: {score}","SCORER")
        if score>=80:
            tg(f"🔥 ГОРЯЧИЙ ЛИД! Score:{score}\n"
               f"Имя:{lead.get('name')} Ниша:{niche}\n"
               f"Контакт:{lead.get('contact','')}\nРекомендую написать сегодня!")
            log(f"Горячий лид: {lead.get('name')}","HOT")
        time.sleep(2)
    if changed:
        dump("leads",leads)
        S["stats"]["leads_today"]=len([l for l in leads
            if l.get("date","")==datetime.now().strftime("%d.%m")])
    S["agents"]["scorer"]["status"]="idle"; save()

def task_nurture():
    log("Прогрев лидов...","NURTURE")
    S["agents"]["nurture"]["status"]="working"; save()
    leads=load("leads",[]); now=datetime.now(); changed=False
    days=[
        "знакомство с Зариной — история перезапуска бизнеса из Нячанга",
        "боль — хаотичный постинг и выгорание без системы",
        "решение — подкаст раз в месяц даёт 15 Reels на автопилоте",
        "кейс — клиент с $2k вырос до $12k за 3 месяца",
        "диагностика — 4 вопроса да/нет о готовности блога",
        "приглашение на бесплатный разбор",
        "финальный оффер: аудит $150 или наставничество $1500",
    ]
    for lead in leads:
        if lead.get("stage")!="nurture": continue
        if lead.get("score",0)<40: continue
        day=lead.get("nurture_day",0)
        if day>=7: lead["stage"]="nurture_done"; changed=True; continue
        last=lead.get("last_nurture","")
        if last:
            try:
                diff=(now-datetime.strptime(last,"%Y-%m-%d %H:%M")).total_seconds()
                if diff<82800: continue
            except: pass
        msg=gemini(
            f"Прогревочное сообщение. День {day+1}/7. Тема:{days[day]}.\n"
            f"Ниша клиента:{lead.get('niche','эксперт')}.\n"
            f"AMAImedia — продюсерский центр. Стиль: живой, без давления, 3-4 предложения.\n"
            f"Конец: кодовое слово ХОЧУ или открытый вопрос."
        )
        if msg:
            try:
                post(f"{N8N}/webhook/tg-parser",
                     {"contact":lead.get("contact",""),"message":msg,"name":lead.get("name","")})
                lead["nurture_day"]=day+1
                lead["last_nurture"]=now.strftime("%Y-%m-%d %H:%M")
                S["agents"]["nurture"]["today"]+=1; S["agents"]["nurture"]["total"]+=1
                S["stats"]["messages_sent"]+=1
                log(f"Прогрев день {day+1}: {lead.get('name','?')}","NURTURE")
                changed=True
            except Exception as e: log(f"Nurture send error: {e}","ERROR")
            time.sleep(3)
    if changed: dump("leads",leads)
    S["agents"]["nurture"]["status"]="idle"; save()

def task_publish():
    log("Публикация контента...","PUBLISHER")
    S["agents"]["publisher"]["status"]="working"; save()
    queue=load("content_queue",[]); now=datetime.now()
    for item in queue:
        if item.get("status")!="scheduled": continue
        try: sched=datetime.strptime(item["scheduled_date"],"%Y-%m-%d")
        except: continue
        if sched.date()>now.date(): continue
        try:
            post("https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/publish-video",
                 {"finalVideoId":item.get("vizard_clip_id"),
                  "post":item.get("caption",""),
                  "publishTime":int(now.timestamp()*1000)},
                 {"VIZARDAI_API_KEY":VIZARD})
            item["status"]="published"
            item["published_at"]=now.strftime("%Y-%m-%d %H:%M")
            S["agents"]["publisher"]["today"]+=1; S["agents"]["publisher"]["total"]+=1
            S["stats"]["content_published"]+=1
            tg(f"📹 Клип опубликован!\n{item.get('title','?')[:40]}\nScore:{item.get('viral_score','?')}")
            log(f"Опубликован: {item.get('title','?')[:40]}","PUBLISHER")
            break
        except Exception as e: log(f"Publish error: {e}","ERROR")
    dump("content_queue",queue)
    S["agents"]["publisher"]["status"]="idle"; save()

TASKS=[
    ("briefing",     task_briefing,     1440, 9,  None),
    ("scoring",      task_scoring,      15,   None,None),
    ("nurture",      task_nurture,      60,   None,None),
    ("publish",      task_publish,      120,  10, None),
    ("weekly",       lambda: tg("📊 Воскресный отчёт — подготовить вручную"), 10080,20,6),
]

def should_run(name,interval,hour,weekday):
    now=datetime.now()
    last=S["tasks"].get(name,{}).get("last_run","")
    if last:
        try:
            diff=(now-datetime.strptime(last,"%Y-%m-%d %H:%M:%S")).total_seconds()/60
            if diff<interval: return False
        except: pass
    if hour is not None and now.hour!=hour: return False
    if weekday is not None and now.weekday()!=weekday: return False
    return True

def mark(name):
    S["tasks"][name]={"last_run":datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                      "count":S["tasks"].get(name,{}).get("count",0)+1}
    save()

if __name__=="__main__":
    log("=== ENGINE STARTED v4.0 ===","ENGINE")
    tg("⚡ AMAImedia Engine запущен! Первый брифинг в 09:00.")
    save()
    while True:
        try:
            if os.path.exists(STATE):
                with open(STATE,encoding="utf-8") as f: cur=json.load(f)
                if cur.get("stop_signal"):
                    log("Сигнал остановки","ENGINE"); S["running"]=False; save(); break
        except: pass
        for name,func,interval,hour,weekday in TASKS:
            if should_run(name,interval,hour,weekday):
                log(f"-> {name}","ENGINE")
                threading.Thread(target=func,daemon=True,name=name).start()
                mark(name)
        time.sleep(60)
