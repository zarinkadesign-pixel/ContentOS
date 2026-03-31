"""Producer Center — Data Store (JSON files)"""
import json, os, time
from typing import List, Optional
from dataclasses import asdict
from config import DATA_DIR
from core.models import Client, Lead, Finance

os.makedirs(DATA_DIR, exist_ok=True)

CLIENTS_FILE = os.path.join(DATA_DIR, "clients.json")
LEADS_FILE   = os.path.join(DATA_DIR, "leads.json")
FINANCE_FILE = os.path.join(DATA_DIR, "finance.json")

# ── helpers ──────────────────────────────────────────
def _read(path, default):
    if not os.path.exists(path):
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default

def _write(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# ── CLIENTS ──────────────────────────────────────────
def load_clients() -> List[Client]:
    raw = _read(CLIENTS_FILE, [])
    clients = []
    for d in raw:
        try:
            c = Client(**{k: d.get(k, v.default if hasattr(v,'default') else None)
                          for k,v in Client.__dataclass_fields__.items()})
            clients.append(c)
        except Exception:
            clients.append(Client(id=d.get("id",0), name=d.get("name","?")))
    return clients

def save_clients(clients: List[Client]):
    _write(CLIENTS_FILE, [asdict(c) for c in clients])

def add_client(data: dict) -> Client:
    clients = load_clients()
    new_id = int(time.time())
    c = Client(id=new_id, **{k:v for k,v in data.items() if k in Client.__dataclass_fields__ and k != "id"})
    clients.append(c)
    save_clients(clients)
    return c

def update_client(client_id: int, updates: dict):
    clients = load_clients()
    for i, c in enumerate(clients):
        if c.id == client_id:
            for k, v in updates.items():
                if hasattr(c, k):
                    setattr(c, k, v)
            break
    save_clients(clients)

def get_client(client_id: int) -> Optional[Client]:
    for c in load_clients():
        if c.id == client_id:
            return c
    return None

# ── LEADS ─────────────────────────────────────────────
def load_leads() -> List[Lead]:
    raw = _read(LEADS_FILE, [])
    leads = []
    for d in raw:
        try:
            leads.append(Lead(**{k: d.get(k, "") for k in Lead.__dataclass_fields__}))
        except Exception:
            leads.append(Lead(id=d.get("id",0), name=d.get("name","?")))
    return leads

def save_leads(leads: List[Lead]):
    _write(LEADS_FILE, [asdict(l) for l in leads])

def add_lead(data: dict) -> Lead:
    leads = load_leads()
    from datetime import date
    new_id = int(time.time())
    l = Lead(id=new_id, date=date.today().strftime("%d.%m"),
             **{k:v for k,v in data.items() if k in Lead.__dataclass_fields__ and k not in ("id","date")})
    leads.append(l)
    save_leads(leads)
    return l

def move_lead(lead_id: int, stage: str):
    leads = load_leads()
    for l in leads:
        if l.id == lead_id:
            l.stage = stage
            break
    save_leads(leads)

def delete_lead(lead_id: int):
    leads = [l for l in load_leads() if l.id != lead_id]
    save_leads(leads)

# ── FINANCE ───────────────────────────────────────────
def load_finance() -> Finance:
    d = _read(FINANCE_FILE, {})
    return Finance(
        income=d.get("income",[]),
        expenses=d.get("expenses",[{"desc":"Vizard","amount":30},{"desc":"Canva","amount":15}]),
        months=d.get("months",[{"m":"Окт","v":0},{"m":"Ноя","v":0},{"m":"Дек","v":0},{"m":"Янв","v":0},{"m":"Фев","v":0},{"m":"Мар","v":0}]),
    )

def save_finance(finance: Finance):
    _write(FINANCE_FILE, asdict(finance))

def add_transaction(desc: str, amount: float, type_: str = "other"):
    fin = load_finance()
    from datetime import date
    fin.income.append({"id":int(time.time()),"desc":desc,"amount":amount,"type":type_,"date":date.today().strftime("%d.%m")})
    if fin.months:
        fin.months[-1]["v"] = fin.months[-1].get("v",0) + amount
    save_finance(fin)

# ── DEMO DATA ─────────────────────────────────────────
def create_demo_data():
    if not load_clients():
        add_client({
            "name":"Алина Морозова","niche":"Нутрициология",
            "audience":"Женщины 28-42, похудение","has":"Instagram 7.8k",
            "socials":"@alina_food","income":8000,"goal_inc":25000,
            "goals":"Запустить курс, $15k/мес","color":"#6366f1","emoji":"👩",
            "stage":3,"stage_pct":68,
            "metrics":{"instagram":{"followers":7800,"reach":42000,"er":3.2,"leads":34}},
            "alerts":["⚠️ Охват упал -23% за неделю"],
        })
    if not load_leads():
        for d in [
            {"name":"Светлана Миронова","source":"telegram","contact":"@svetlana_coach","niche":"Коучинг","stage":"interested"},
            {"name":"ФитЛайф Студия","source":"gis","contact":"+7 921 555-1234","niche":"Фитнес","stage":"call"},
            {"name":"Наталья Волкова","source":"instagram","contact":"@natasha_nutri","niche":"Нутрициология","stage":"replied"},
            {"name":"Дмитрий Соколов","source":"ads","contact":"@dmitry_biz","niche":"Бизнес","stage":"new"},
        ]:
            add_lead(d)
    fin = load_finance()
    if not fin.income:
        fin.income = [
            {"id":1,"desc":"Мини-курс март","amount":1455,"type":"minicourse","date":"15.03"},
            {"id":2,"desc":"Наставничество","amount":3000,"type":"mentoring","date":"01.03"},
            {"id":3,"desc":"Алина (30%)","amount":2400,"type":"production","date":"01.03"},
        ]
        fin.months = [{"m":"Окт","v":1200},{"m":"Ноя","v":2400},{"m":"Дек","v":1800},
                      {"m":"Янв","v":4200},{"m":"Фев","v":5800},{"m":"Мар","v":6855}]
        save_finance(fin)
