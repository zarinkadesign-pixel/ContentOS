"""
Producer Center — AMAImedia
Запуск: python producer_center_app.py
"""
import customtkinter as ctk
import threading, json, os, time, sys
from datetime import date, datetime, timedelta

# ═══════════════════════════════════════
#  CONFIG
# ═══════════════════════════════════════
def _load_env_key(key: str, default: str = "") -> str:
    env_path = os.path.join(BASE, ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, encoding="utf-8") as _f:
                for _line in _f:
                    _line = _line.strip()
                    if _line.startswith(key + "="):
                        return _line.split("=", 1)[1].strip().strip('"').strip("'")
        except Exception:
            pass
    return os.environ.get(key, default)

GEMINI_KEY = _load_env_key("GEMINI_KEY", "")
KPI_TARGET = 20000

# Папка для данных рядом с этим файлом
BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, "pc_data")
os.makedirs(DATA, exist_ok=True)

# Цвета
BG="#050710"; NAV="#08091c"; CARD="#0d1126"; CARD2="#121630"
BORDER="#1e1e38"; BORDER2="#2a2a50"
ACCENT="#5c6af0"; ACCENT2="#818cf8"
GREEN="#22c55e"; ORANGE="#f59e0b"; PINK="#ec4899"
RED="#ef4444"; CYAN="#06b6d4"; PURPLE="#8b5cf6"
TEXT="#e4e9ff"; TEXT2="#6b7db3"; TEXT3="#2e3d6b"

# ═══════════════════════════════════════
#  ДАННЫЕ (JSON)
# ═══════════════════════════════════════
def _r(fname, default):
    p = os.path.join(DATA, fname)
    if not os.path.exists(p):
        return default
    try:
        return json.load(open(p, encoding="utf-8"))
    except:
        return default

def _w(fname, data):
    with open(os.path.join(DATA, fname), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_clients(): return _r("clients.json", [])
def save_clients(d): _w("clients.json", d)
def load_leads(): return _r("leads.json", [])
def save_leads(d): _w("leads.json", d)
def load_finance(): return _r("finance.json", {"income":[],"expenses":[{"desc":"Vizard","amount":30}],"months":[{"m":"Янв","v":0},{"m":"Фев","v":0},{"m":"Мар","v":0},{"m":"Апр","v":0},{"m":"Май","v":0},{"m":"Июн","v":0}]})
def save_finance(d): _w("finance.json", d)

def init_demo():
    if not load_clients():
        save_clients([{
            "id":1,"name":"Алина Морозова","niche":"Нутрициология",
            "audience":"Женщины 28-42, похудение","has":"Instagram 7.8k",
            "socials":"@alina_food","income":8000,"goal_inc":25000,
            "goals":"Запустить курс, выйти на $15k/мес",
            "color":"#6366f1","emoji":"👩","stage":3,"stage_pct":68,
            "metrics":{"instagram":{"followers":7800,"reach":42000,"er":3.2,"leads":34}},
            "alerts":["⚠️ Охват упал -23%"],"checklist":{},"transactions":[],"products":[]
        }])
    if not load_leads():
        save_leads([
            {"id":1,"name":"Светлана Миронова","source":"telegram","contact":"@svetlana_coach","niche":"Коучинг","stage":"interested","date":"29.03","notes":""},
            {"id":2,"name":"ФитЛайф Студия","source":"gis","contact":"+7 921 555-1234","niche":"Фитнес","stage":"call","date":"28.03","notes":""},
            {"id":3,"name":"Наталья Волкова","source":"instagram","contact":"@natasha_nutri","niche":"Нутрициология","stage":"replied","date":"30.03","notes":""},
            {"id":4,"name":"Дмитрий Соколов","source":"ads","contact":"@dmitry_biz","niche":"Бизнес","stage":"new","date":"30.03","notes":""},
        ])
    fin = load_finance()
    if not fin["income"]:
        fin["income"] = [
            {"id":1,"desc":"Мини-курс март","amount":1455,"type":"minicourse","date":"15.03"},
            {"id":2,"desc":"Наставничество","amount":3000,"type":"mentoring","date":"01.03"},
            {"id":3,"desc":"Алина (30%)","amount":2400,"type":"production","date":"01.03"},
        ]
        fin["months"] = [{"m":"Окт","v":1200},{"m":"Ноя","v":2400},{"m":"Дек","v":1800},{"m":"Янв","v":4200},{"m":"Фев","v":5800},{"m":"Мар","v":6855}]
        save_finance(fin)

# ═══════════════════════════════════════
#  GEMINI AI
# ═══════════════════════════════════════
def ask_ai(prompt, system="Отвечай на русском языке. Конкретно и по делу."):
    try:
        import urllib.request as ur
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_KEY}"
        body = json.dumps({"contents":[{"role":"user","parts":[{"text":f"{system}\n\n{prompt}"}]}],"generationConfig":{"maxOutputTokens":2048}}).encode()
        req = ur.Request(url, body, {"Content-Type":"application/json"})
        with ur.urlopen(req, timeout=30) as r:
            data = json.loads(r.read())
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        return f"❌ Ошибка AI: {e}\n\nПроверь интернет-соединение."

def client_ctx(c):
    if not c: return "Клиент не выбран."
    return (f"Клиент: {c.get('name','?')} | Ниша: {c.get('niche','?')}\n"
            f"Аудитория: {c.get('audience','?')} | Что есть: {c.get('has','?')}\n"
            f"Соцсети: {c.get('socials','?')}\n"
            f"Доход: ${c.get('income',0)}/мес → Цель: ${c.get('goal_inc',0)}/мес\n"
            f"Цели: {c.get('goals','?')}")

# ═══════════════════════════════════════
#  UI HELPERS
# ═══════════════════════════════════════
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

def card(parent, **kw):
    return ctk.CTkFrame(parent, fg_color=CARD, corner_radius=14,
                        border_width=1, border_color=BORDER, **kw)

def label(parent, text, size=12, color=TEXT, bold=False, **kw):
    return ctk.CTkLabel(parent, text=text,
                        font=("Inter", size, "bold" if bold else "normal"),
                        text_color=color, **kw)

def btn(parent, text, command, color=ACCENT, size=12, height=36, **kw):
    return ctk.CTkButton(parent, text=text, command=command,
                         fg_color=color, hover_color=color,
                         font=("Inter",size,"bold"),
                         height=height, corner_radius=10, **kw)

def ai_card(parent, title, prompt_fn, color=ACCENT):
    """Reusable AI generate card"""
    f = card(parent)
    f.pack(fill="x", pady=5)
    ctk.CTkFrame(f, height=3, fg_color=color, corner_radius=2).pack(fill="x")
    hdr = ctk.CTkFrame(f, fg_color="transparent")
    hdr.pack(fill="x", padx=12, pady=(10,6))
    label(hdr, title, 13, bold=True).pack(side="left")
    gen_btn = ctk.CTkButton(hdr, text="🤖 Создать", font=("Inter",11,"bold"),
                             fg_color=color+"44", hover_color=color+"88",
                             text_color=TEXT, height=30, width=110, corner_radius=8)
    gen_btn.pack(side="right")
    txt = ctk.CTkTextbox(f, height=160, fg_color=CARD2, text_color=TEXT2,
                          font=("Inter",11), corner_radius=8, border_width=0)
    txt.pack(fill="x", padx=12, pady=(0,6))
    txt.insert("end", "Нажми «🤖 Создать»")
    txt.configure(state="disabled")
    act = ctk.CTkFrame(f, fg_color="transparent")
    act.pack(fill="x", padx=12, pady=(0,10))
    ctk.CTkButton(act, text="📋 Копировать", font=("Inter",10), height=28,
                  fg_color="transparent", hover_color=BORDER2, text_color=TEXT2,
                  command=lambda: f.clipboard_append(txt.get("1.0","end"))
                  ).pack(side="left")

    def run():
        gen_btn.configure(text="⏳", state="disabled")
        txt.configure(state="normal"); txt.delete("1.0","end")
        txt.insert("end","Генерирую..."); txt.configure(state="disabled")
        def do():
            result = ask_ai(prompt_fn())
            f.after(0, lambda: done(result))
        threading.Thread(target=do, daemon=True).start()

    def done(r):
        txt.configure(state="normal"); txt.delete("1.0","end")
        txt.insert("end", r); txt.configure(state="disabled")
        gen_btn.configure(text="🤖 Создать", state="normal")

    gen_btn.configure(command=run)
    return f

# ═══════════════════════════════════════
#  ГЛАВНОЕ ПРИЛОЖЕНИЕ
# ═══════════════════════════════════════
class ProducerCenter(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("Producer Center — AMAImedia")
        self.geometry("1300x820")
        self.minsize(1000, 650)
        self.configure(fg_color=BG)
        self._active_client = None
        self._build()
        self.show("monitor")

    def _build(self):
        self._sidebar = Sidebar(self, self.show)
        self._sidebar.pack(side="left", fill="y")
        self._content = ctk.CTkFrame(self, fg_color=BG, corner_radius=0)
        self._content.pack(side="left", fill="both", expand=True)

    def show(self, name):
        for w in self._content.winfo_children():
            w.destroy()
        screens = {
            "monitor":   MonitorScreen,
            "dashboard": DashboardScreen,
            "crm":       CRMScreen,
            "clients":   ClientsScreen,
            "products":  ProductsScreen,
            "content":   ContentScreen,
            "finance":   FinanceScreen,
        }
        # Profile is special
        if name == "profile" and self._active_client:
            self._profile_screen = ProfileScreen(self._content, self._active_client, self)
            self._profile_screen.pack(fill="both", expand=True)
        elif name in screens:
            sc = screens[name](self._content, self)
            sc.pack(fill="both", expand=True)
        self._sidebar.set_active(name)

    def open_client(self, client_data):
        self._active_client = client_data
        self.show("profile")

# ═══════════════════════════════════════
#  SIDEBAR
# ═══════════════════════════════════════
class Sidebar(ctk.CTkFrame):
    NAV = [
        ("monitor","⚡","Монитор"),
        ("dashboard","📊","Дашборд"),
        ("crm","🔍","Поиск / CRM"),
        ("clients","👥","Клиенты"),
        ("products","📦","Продукты"),
        ("content","🎬","Контент"),
        ("finance","💰","Финансы"),
    ]
    def __init__(self, master, navigate):
        super().__init__(master, width=210, fg_color=NAV, corner_radius=0)
        self.pack_propagate(False)
        self.navigate = navigate
        self._btns = {}
        self._build()

    def _build(self):
        # Logo
        logo = ctk.CTkFrame(self, fg_color=CARD, corner_radius=12, height=52)
        logo.pack(fill="x", padx=10, pady=(12,6))
        logo.pack_propagate(False)
        ctk.CTkLabel(logo, text="PC", font=("Inter",14,"bold"),
                     text_color="#000", fg_color=ACCENT,
                     width=32, height=32, corner_radius=8).pack(side="left", padx=10, pady=10)
        f = ctk.CTkFrame(logo, fg_color="transparent")
        f.pack(side="left")
        ctk.CTkLabel(f, text="PRODUCER CENTER",
                     font=("Inter",10,"bold"), text_color=TEXT).pack(anchor="w")
        ctk.CTkLabel(f, text="AMAImedia.com",
                     font=("Inter",9), text_color=TEXT3).pack(anchor="w")

        ctk.CTkFrame(self, height=1, fg_color=BORDER).pack(fill="x", padx=10, pady=4)

        nav = ctk.CTkFrame(self, fg_color="transparent")
        nav.pack(fill="both", expand=True, padx=6, pady=4)
        for key, icon, lbl in self.NAV:
            b = ctk.CTkButton(nav, text=f"  {icon}  {lbl}",
                              font=("Inter",13,"bold"), anchor="w",
                              fg_color="transparent", hover_color=BORDER,
                              text_color=TEXT2, height=42, corner_radius=10,
                              command=lambda k=key: self.navigate(k))
            b.pack(fill="x", pady=1)
            self._btns[key] = b

        ctk.CTkFrame(self, height=1, fg_color=BORDER).pack(fill="x", padx=10)
        status = ctk.CTkFrame(self, fg_color="transparent")
        status.pack(fill="x", padx=12, pady=8)
        ctk.CTkLabel(status, text="●", font=("Inter",10), text_color=GREEN).pack(side="left", padx=(2,4))
        ctk.CTkLabel(status, text="Gemini активен", font=("Inter",11), text_color=TEXT2).pack(side="left")

    def set_active(self, key):
        for k, b in self._btns.items():
            if k == key:
                b.configure(fg_color="#1a1f4e", text_color=ACCENT2)
            else:
                b.configure(fg_color="transparent", text_color=TEXT2)

# ═══════════════════════════════════════
#  DASHBOARD
# ═══════════════════════════════════════
class DashboardScreen(ctk.CTkFrame):
    def __init__(self, master, app):
        super().__init__(master, fg_color=BG, corner_radius=0)
        self.app = app
        self._build()

    def _build(self):
        # Header
        hdr = ctk.CTkFrame(self, fg_color=NAV, corner_radius=0, height=56)
        hdr.pack(fill="x"); hdr.pack_propagate(False)
        label(hdr, "📊 Командный центр", 18, bold=True).pack(side="left", padx=20, pady=14)
        btn(hdr, "+ Новый лид", lambda: self.app.show("crm"),
            height=34, width=120).pack(side="right", padx=16, pady=11)

        scroll = ctk.CTkScrollableFrame(self, fg_color=BG, corner_radius=0)
        scroll.pack(fill="both", expand=True, padx=16, pady=12)

        fin = load_finance()
        leads = load_leads()
        clients = load_clients()
        income = sum(t.get("amount",0) for t in fin["income"])
        expenses = sum(e.get("amount",0) for e in fin["expenses"])
        profit = income - expenses
        kpi_pct = min(1.0, income / KPI_TARGET)

        # KPI row
        kpi_row = ctk.CTkFrame(scroll, fg_color="transparent")
        kpi_row.pack(fill="x", pady=(0,10))
        for lbl, val, col in [
            ("💰 Прибыль", f"${profit:,.0f}", GREEN),
            ("🔍 Лидов",   str(len(leads)),  ACCENT2),
            ("👥 Клиентов",str(len(clients)),ORANGE),
            ("📊 KPI",     f"{int(kpi_pct*100)}%", GREEN if kpi_pct>=1 else PINK),
        ]:
            t = card(kpi_row)
            t.pack(side="left", expand=True, fill="x", padx=(0,8))
            label(t, val, 20, col, bold=True).pack(pady=(10,2))
            label(t, lbl, 10, TEXT2).pack(pady=(0,10))

        # KPI bar
        kc = card(scroll)
        kc.pack(fill="x", pady=(0,10))
        kh = ctk.CTkFrame(kc, fg_color="transparent")
        kh.pack(fill="x", padx=14, pady=(12,4))
        label(kh, f"KPI: ${KPI_TARGET:,}/мес", 13, bold=True).pack(side="left")
        label(kh, f"${income:,.0f} / {int(kpi_pct*100)}%", 13,
              GREEN if kpi_pct>=1 else ACCENT2, bold=True).pack(side="right")
        pb = ctk.CTkProgressBar(kc, progress_color=GREEN if kpi_pct>=1 else ACCENT,
                                 fg_color=CARD2, height=8, corner_radius=4)
        pb.set(kpi_pct)
        pb.pack(fill="x", padx=14, pady=(0,14))

        # Two columns
        cols = ctk.CTkFrame(scroll, fg_color="transparent")
        cols.pack(fill="x", pady=(0,10))

        # Leads
        lc = card(cols)
        lc.pack(side="left", expand=True, fill="both", padx=(0,8))
        lh = ctk.CTkFrame(lc, fg_color="transparent")
        lh.pack(fill="x", padx=14, pady=(12,6))
        label(lh, "🔍 Лиды", 12, bold=True).pack(side="left")
        ctk.CTkButton(lh, text="CRM →", font=("Inter",10), fg_color="transparent",
                      text_color=ACCENT2, hover_color=BORDER, height=24, width=60,
                      command=lambda: self.app.show("crm")).pack(side="right")
        stages = [("🔵 Новый","new"),("💬 Ответил","replied"),("🔥 Заинтересован","interested"),
                  ("📞 Созвон","call"),("📝 Контракт","contract")]
        for slbl, sid in stages:
            cnt = sum(1 for l in leads if l.get("stage")==sid)
            r = ctk.CTkFrame(lc, fg_color="transparent")
            r.pack(fill="x", padx=14, pady=2)
            label(r, slbl, 11, TEXT2).pack(side="left")
            label(r, str(cnt), 11, TEXT, bold=True).pack(side="right")
        ctk.CTkFrame(lc, height=8, fg_color="transparent").pack()

        # Clients
        cc = card(cols)
        cc.pack(side="left", expand=True, fill="both")
        label(cc, "👥 Клиенты", 12, bold=True).pack(anchor="w", padx=14, pady=(12,6))
        for c in clients[:4]:
            r = ctk.CTkFrame(cc, fg_color="transparent")
            r.pack(fill="x", padx=14, pady=3)
            label(r, f"{c.get('emoji','👤')} {c.get('name','?')}", 12).pack(side="left")
            share = c.get("income",0)*0.3
            label(r, f"+${share:,.0f}", 11, GREEN, bold=True).pack(side="right")
        ctk.CTkFrame(cc, height=8, fg_color="transparent").pack()

        # Autopilot
        ap = ctk.CTkFrame(scroll, fg_color="#0d0630",
                           corner_radius=14, border_width=1, border_color="#3d1a80")
        ap.pack(fill="x", pady=(0,10))
        label(ap, "⚡", 28).pack(anchor="w", padx=16, pady=(14,2))
        label(ap, "АВТОПИЛОТ АКТИВЕН", 16, TEXT, bold=True).pack(anchor="w", padx=16)
        label(ap, "Агенты работают · Директор одобряет 15 мин/день", 11, "#a78bfa").pack(anchor="w", padx=16, pady=(2,14))

        # Briefing
        bc = card(scroll)
        bc.pack(fill="x", pady=(0,10))
        bh = ctk.CTkFrame(bc, fg_color="transparent")
        bh.pack(fill="x", padx=14, pady=(12,6))
        label(bh, "🤖 AI Брифинг дня", 12, bold=True).pack(side="left")
        self._brief_btn = ctk.CTkButton(bh, text="⚡ Запустить",
                                         font=("Inter",11,"bold"), height=30, width=110,
                                         fg_color=BORDER2, hover_color=ACCENT,
                                         text_color=TEXT2, corner_radius=8,
                                         command=self._run_brief)
        self._brief_btn.pack(side="right")
        self._brief_txt = ctk.CTkTextbox(bc, height=100, fg_color=CARD2,
                                          text_color=TEXT2, font=("Inter",11), corner_radius=8)
        self._brief_txt.pack(fill="x", padx=14, pady=(0,14))
        self._brief_txt.insert("end","Нажми «⚡ Запустить» — AI подготовит сводку дня")
        self._brief_txt.configure(state="disabled")
        self._leads = leads; self._clients = clients; self._income = income

    def _run_brief(self):
        self._brief_btn.configure(text="⏳", state="disabled")
        self._brief_txt.configure(state="normal")
        self._brief_txt.delete("1.0","end")
        self._brief_txt.insert("end","Генерирую...")
        self._brief_txt.configure(state="disabled")
        def do():
            new_l = sum(1 for l in self._leads if l.get("stage")=="new")
            r = ask_ai(
                f"Брифинг дня для директора агентства.\n"
                f"Лиды: {len(self._leads)} (новых: {new_l}, на созвоне: {sum(1 for l in self._leads if l.get('stage')=='call')})\n"
                f"KPI: ${self._income:,.0f}/${KPI_TARGET:,} ({int(self._income/KPI_TARGET*100)}%)\n"
                f"Клиентов на продюсировании: {len(self._clients)}\n\n"
                f"Дай: 1) ТОП-3 задачи сегодня 2) Что требует внимания 3) На каком темпе выполним KPI",
                "Ты директор продюсерского агентства. Кратко, по делу, с конкретными числами."
            )
            self.after(0, lambda: self._show_brief(r))
        threading.Thread(target=do, daemon=True).start()

    def _show_brief(self, r):
        self._brief_txt.configure(state="normal")
        self._brief_txt.delete("1.0","end")
        self._brief_txt.insert("end", r)
        self._brief_txt.configure(state="disabled")
        self._brief_btn.configure(text="⚡ Запустить", state="normal")

# ═══════════════════════════════════════
#  CRM
# ═══════════════════════════════════════
STAGE_ORDER = ["new","contacted","replied","interested","call","contract"]
STAGE_LABELS = {"new":"🔵 Новый","contacted":"📤 Сообщение","replied":"💬 Ответил",
                "interested":"🔥 Заинтересован","call":"📞 Созвон","contract":"📝 Контракт"}
STAGE_COLORS = {"new":"#6366f1","contacted":"#06b6d4","replied":"#f59e0b",
                "interested":"#ec4899","call":"#8b5cf6","contract":"#22c55e"}
SRC = {"telegram":"✈️","gis":"🗺","instagram":"📸","ads":"📢","referral":"🤝","manual":"✏️"}

class CRMScreen(ctk.CTkFrame):
    def __init__(self, master, app):
        super().__init__(master, fg_color=BG, corner_radius=0)
        self.app = app
        self._build()

    def _build(self):
        hdr = ctk.CTkFrame(self, fg_color=NAV, corner_radius=0, height=56)
        hdr.pack(fill="x"); hdr.pack_propagate(False)
        label(hdr, "🔍 CRM — Поиск клиентов", 18, bold=True).pack(side="left", padx=20, pady=14)
        btn(hdr, "+ Добавить лид", self._add_modal, height=34, width=130).pack(side="right", padx=16, pady=11)
        ctk.CTkButton(hdr, text="🔄", font=("Inter",14), fg_color="transparent",
                      hover_color=BORDER, text_color=TEXT2, width=36, height=34,
                      command=self._reload).pack(side="right", padx=4, pady=11)

        self._kanban = ctk.CTkScrollableFrame(self, fg_color=BG, corner_radius=0, orientation="horizontal")
        self._kanban.pack(fill="both", expand=True, padx=6, pady=6)
        self._render()

    def _render(self):
        for w in self._kanban.winfo_children():
            w.destroy()
        leads = load_leads()
        for stage in STAGE_ORDER:
            col_leads = [l for l in leads if l.get("stage")==stage]
            self._col(stage, col_leads)

    def _reload(self):
        self._render()

    def _col(self, stage, leads):
        color = STAGE_COLORS[stage]
        col = ctk.CTkFrame(self._kanban, fg_color="transparent", width=235)
        col.pack(side="left", fill="y", padx=5, pady=4)
        col.pack_propagate(False)

        hdr = ctk.CTkFrame(col, fg_color=CARD, corner_radius=10,
                            border_width=1, border_color=BORDER)
        hdr.pack(fill="x", pady=(0,6))
        ctk.CTkFrame(hdr, width=4, fg_color=color, corner_radius=2).pack(side="left", fill="y", padx=(8,0), pady=8)
        label(hdr, STAGE_LABELS[stage], 12, bold=True).pack(side="left", padx=8, pady=8)
        label(hdr, str(len(leads)), 11, TEXT2).pack(side="right", padx=10)

        sc = ctk.CTkScrollableFrame(col, fg_color="transparent")
        sc.pack(fill="both", expand=True)
        for lead in leads:
            self._lead_card(sc, lead, stage, color)

    def _lead_card(self, parent, lead, stage, color):
        c = card(parent)
        c.pack(fill="x", pady=4)
        ctk.CTkFrame(c, height=3, fg_color=color, corner_radius=2).pack(fill="x")
        body = ctk.CTkFrame(c, fg_color="transparent")
        body.pack(fill="x", padx=10, pady=8)
        nr = ctk.CTkFrame(body, fg_color="transparent")
        nr.pack(fill="x")
        label(nr, SRC.get(lead.get("source",""),"❓"), 13).pack(side="left")
        label(nr, f"  {lead.get('name','?')}", 12, bold=True).pack(side="left")
        label(body, f"{lead.get('niche','')} · {lead.get('date','')}", 10, TEXT2).pack(anchor="w")
        if lead.get("contact"):
            label(body, lead["contact"], 10, TEXT3).pack(anchor="w")

        btns_row = ctk.CTkFrame(c, fg_color="transparent")
        btns_row.pack(fill="x", padx=10, pady=(0,8))
        idx = STAGE_ORDER.index(stage)
        if idx > 0:
            ctk.CTkButton(btns_row, text="←", width=32, height=28,
                          fg_color=CARD2, hover_color=BORDER2, text_color=TEXT2,
                          font=("Inter",13), corner_radius=7,
                          command=lambda lid=lead["id"], s=STAGE_ORDER[idx-1]: self._move(lid,s)
                          ).pack(side="left", padx=(0,3))
        if idx < len(STAGE_ORDER)-1:
            ctk.CTkButton(btns_row, text="→ Далее", height=28,
                          fg_color=color+"33", hover_color=color+"66",
                          text_color=color, font=("Inter",11,"bold"), corner_radius=7,
                          command=lambda lid=lead["id"], s=STAGE_ORDER[idx+1]: self._move(lid,s)
                          ).pack(side="left", expand=True, fill="x", padx=(0,3))
        ctk.CTkButton(btns_row, text="🤖", width=32, height=28,
                      fg_color="#1e0d50", hover_color="#2d1b70",
                      font=("Inter",13), corner_radius=7,
                      command=lambda l=lead: self._ai_msg(l)).pack(side="right")

    def _move(self, lid, stage):
        leads = load_leads()
        for l in leads:
            if l["id"] == lid:
                l["stage"] = stage
                break
        save_leads(leads)
        self._render()

    def _ai_msg(self, lead):
        win = ctk.CTkToplevel(self)
        win.title("🤖 AI Сообщение")
        win.geometry("500x340")
        win.configure(fg_color=CARD)
        win.lift(); win.focus()
        label(win, f"Генерирую для {lead.get('name','?')}...", 12, TEXT2).pack(pady=10)
        txt = ctk.CTkTextbox(win, height=210, fg_color=CARD2, text_color=TEXT, font=("Inter",11))
        txt.pack(fill="both", expand=True, padx=14, pady=4)
        txt.insert("end","⏳ Генерирую...")
        txt.configure(state="disabled")
        ctk.CTkButton(win, text="📋 Копировать", fg_color=ACCENT, height=36,
                      command=lambda: win.clipboard_append(txt.get("1.0","end"))
                      ).pack(pady=8)
        def do():
            r = ask_ai(
                f"Напиши первое персональное сообщение для {lead.get('name','?')}.\n"
                f"Ниша: {lead.get('niche','?')}. Контакт: {lead.get('contact','?')}.\n"
                f"3-4 предложения. Живой язык. Заверши вопросом.",
                "Пишешь первые сообщения потенциальным клиентам продюсерского агентства.")
            win.after(0, lambda: (txt.configure(state="normal"),
                                   txt.delete("1.0","end"),
                                   txt.insert("end",r),
                                   txt.configure(state="disabled")))
        threading.Thread(target=do, daemon=True).start()

    def _add_modal(self):
        win = ctk.CTkToplevel(self)
        win.title("+ Новый лид")
        win.geometry("400x380")
        win.configure(fg_color=CARD)
        win.lift(); win.focus()
        label(win, "Добавить лид", 15, bold=True).pack(pady=(14,8))
        fields = {}
        for lbl, key, ph in [("Имя","name","Алина Морозова"),
                               ("Контакт","contact","@username"),
                               ("Ниша","niche","Нутрициология")]:
            label(win, lbl, 11, TEXT2).pack(anchor="w", padx=20)
            e = ctk.CTkEntry(win, placeholder_text=ph, height=36,
                              fg_color=CARD2, border_color=BORDER2, text_color=TEXT)
            e.pack(fill="x", padx=20, pady=(2,8))
            fields[key] = e
        src = ctk.StringVar(value="telegram")
        ctk.CTkOptionMenu(win, values=["telegram","gis","instagram","ads","referral","manual"],
                           variable=src, fg_color=CARD2, button_color=BORDER2,
                           text_color=TEXT, dropdown_fg_color=CARD
                           ).pack(fill="x", padx=20, pady=(2,14))
        def add():
            name = fields["name"].get().strip()
            if not name: return
            leads = load_leads()
            leads.append({"id":int(time.time()),"name":name,
                           "contact":fields["contact"].get().strip(),
                           "niche":fields["niche"].get().strip(),
                           "source":src.get(),"stage":"new",
                           "date":date.today().strftime("%d.%m"),"notes":""})
            save_leads(leads)
            win.destroy()
            self._render()
        btn(win, "✅ Добавить", add, height=40).pack(fill="x", padx=20)

# ═══════════════════════════════════════
#  CLIENTS LIST
# ═══════════════════════════════════════
JOURNEY = ["Онбординг","Распаковка","Продукты","Воронка","Контент","Подкаст","Авто-нарезка","Реклама","Аналитика"]
JOURNEY_ICONS = ["📋","🧠","📦","🌀","📱","🎙","🎬","📢","📊"]

class ClientsScreen(ctk.CTkFrame):
    def __init__(self, master, app):
        super().__init__(master, fg_color=BG, corner_radius=0)
        self.app = app
        self._build()

    def _build(self):
        hdr = ctk.CTkFrame(self, fg_color=NAV, corner_radius=0, height=56)
        hdr.pack(fill="x"); hdr.pack_propagate(False)
        label(hdr,"👥 Клиенты на продюсировании",18,bold=True).pack(side="left",padx=20,pady=14)
        btn(hdr,"+ Добавить",self._add_modal,height=34,width=110).pack(side="right",padx=16,pady=11)

        scroll = ctk.CTkScrollableFrame(self, fg_color=BG, corner_radius=0)
        scroll.pack(fill="both", expand=True, padx=14, pady=12)

        clients = load_clients()
        if not clients:
            label(scroll,"Нет клиентов. Нажми «+ Добавить»",14,TEXT3).pack(pady=40)
            return

        for c in clients:
            self._client_card(scroll, c)

    def _client_card(self, parent, c):
        f = card(parent)
        f.pack(fill="x", pady=5)
        f.configure(cursor="hand2")
        row = ctk.CTkFrame(f, fg_color="transparent")
        row.pack(fill="x", padx=14, pady=12)
        # Avatar
        av = ctk.CTkLabel(row, text=c.get("emoji","👤"), font=("Inter",24),
                           width=46, fg_color=c.get("color","#6366f1")+"22",
                           corner_radius=10, text_color=c.get("color","#6366f1"))
        av.pack(side="left", padx=(0,12))
        # Info
        info = ctk.CTkFrame(row, fg_color="transparent")
        info.pack(side="left", fill="both", expand=True)
        nr = ctk.CTkFrame(info, fg_color="transparent")
        nr.pack(fill="x")
        label(nr, c.get("name","?"), 14, bold=True).pack(side="left")
        s = c.get("stage",0)
        if s < len(JOURNEY):
            ctk.CTkLabel(nr, text=f"{JOURNEY_ICONS[s]} {JOURNEY[s]}",
                         font=("Inter",11), fg_color=c.get("color","#6366f1")+"22",
                         text_color=c.get("color","#6366f1"),
                         corner_radius=6, padx=8).pack(side="left", padx=8)
        label(info, f"{c.get('niche','')} · {c.get('socials','')}", 11, TEXT2).pack(anchor="w")
        pr = ctk.CTkFrame(info, fg_color="transparent")
        pr.pack(fill="x", pady=(4,0))
        pb = ctk.CTkProgressBar(pr, height=4, progress_color=c.get("color","#6366f1"),
                                  fg_color=CARD2, corner_radius=2, width=180)
        pb.set(c.get("stage_pct",10)/100)
        pb.pack(side="left")
        label(pr, f"{c.get('stage_pct',10)}%", 10, c.get("color","#6366f1"), bold=True).pack(side="left",padx=6)
        # Revenue
        share = c.get("income",0)*0.3
        label(row, f"+${share:,.0f}/мес\n30%", 12, GREEN, bold=True).pack(side="right")
        # Click
        for widget in [f, row, av, info, nr]:
            widget.bind("<Button-1>", lambda e, cl=c: self.app.open_client(cl))

    def _add_modal(self):
        win = ctk.CTkToplevel(self)
        win.title("+ Новый клиент")
        win.geometry("440x480")
        win.configure(fg_color=CARD)
        win.lift(); win.focus()
        label(win,"Добавить клиента",15,bold=True).pack(pady=(14,8))
        scroll = ctk.CTkScrollableFrame(win, fg_color="transparent")
        scroll.pack(fill="both", expand=True, padx=16)
        fields = {}
        for lbl, key, ph in [("Имя","name","Алина Морозова"),
                               ("Ниша","niche","Нутрициология"),
                               ("Аудитория","audience","Женщины 28-42"),
                               ("Что есть","has","Instagram 5k"),
                               ("Соцсети","socials","@handle"),
                               ("Доход сейчас ($)","income","5000"),
                               ("Цель ($)","goal_inc","20000"),
                               ("Цели","goals","Запустить курс")]:
            label(scroll,lbl,11,TEXT2).pack(anchor="w")
            e = ctk.CTkEntry(scroll,placeholder_text=ph,height=34,
                              fg_color=CARD2,border_color=BORDER2,text_color=TEXT)
            e.pack(fill="x",pady=(2,8))
            fields[key] = e
        def add():
            name = fields["name"].get().strip()
            if not name: return
            clients = load_clients()
            new_c = {"id":int(time.time()),"name":name,"color":"#6366f1","emoji":"👤","stage":0,"stage_pct":10,"checklist":{},"transactions":[],"products":[],"alerts":[]}
            for k, e in fields.items():
                v = e.get().strip()
                if k in ("income","goal_inc"):
                    try: v = float(v)
                    except: v = 0.0
                new_c[k] = v
            clients.append(new_c)
            save_clients(clients)
            win.destroy()
            self.app.show("clients")
        btn(win,"✅ Добавить клиента",add,height=40).pack(fill="x",padx=16,pady=10)

# ═══════════════════════════════════════
#  CLIENT PROFILE
# ═══════════════════════════════════════
BMAP = [
    {"id":"s1","name":"Онбординг","color":"#6366f1","checks":["Данные заполнены","Цели указаны","Соцсети","Время клиента"]},
    {"id":"s2","name":"Распаковка бренда","color":"#ec4899","checks":["Brand story","Ценности","УТП","Голос бренда","Bio Instagram"]},
    {"id":"s3","name":"Продуктовая линейка","color":"#06b6d4","checks":["Лид-магнит","$100-300","$300-800","Наставничество"]},
    {"id":"s4","name":"Воронка продаж","color":"#22c55e","checks":["Схема воронки","Бот","Прогрев-цепочка","Скрипты"]},
    {"id":"s5","name":"Контент-план","color":"#f59e0b","checks":["15 вопросов","20 тем","9 рекламных","Buffer"]},
    {"id":"s6","name":"Запись подкаста","color":"#f97316","checks":["Вопросы готовы","Запись 3-5ч","Google Drive","Vizard"]},
    {"id":"s7","name":"Авто-нарезка","color":"#ef4444","checks":["Клипы нарезаны","AI подписи","Расписание","Публикации"]},
    {"id":"s8","name":"Реклама","color":"#8b5cf6","checks":["3 группы","Аудитории","Бюджеты","Активна"]},
    {"id":"s9","name":"Аналитика","color":"#10b981","checks":["Нед.1","Нед.2","Нед.3","Отчёт"]},
]

class ProfileScreen(ctk.CTkFrame):
    def __init__(self, master, client, app):
        super().__init__(master, fg_color=BG, corner_radius=0)
        self.c = client
        self.app = app
        self._build()

    def _build(self):
        hdr = ctk.CTkFrame(self, fg_color=NAV, corner_radius=0, height=56)
        hdr.pack(fill="x"); hdr.pack_propagate(False)
        ctk.CTkButton(hdr, text="← Назад", font=("Inter",12), fg_color="transparent",
                      hover_color=BORDER, text_color=TEXT2, height=34, width=80,
                      command=lambda: self.app.show("clients")).pack(side="left",padx=12,pady=11)
        label(hdr, self.c.get("name","?"), 16, bold=True).pack(side="left", padx=4)
        s = self.c.get("stage",0)
        if s < len(JOURNEY):
            ctk.CTkLabel(hdr, text=f"{JOURNEY_ICONS[s]} {JOURNEY[s]}",
                         font=("Inter",11), fg_color=self.c.get("color","#6366f1")+"33",
                         text_color=self.c.get("color","#6366f1"),
                         corner_radius=8, padx=10).pack(side="left", padx=8)

        tabs = ctk.CTkTabview(self, fg_color=BG,
                               segmented_button_fg_color=CARD,
                               segmented_button_selected_color=ACCENT,
                               segmented_button_unselected_color=CARD,
                               text_color=TEXT2,
                               command=self._on_tab)
        tabs.pack(fill="both", expand=True)
        self._tabs = tabs

        for t in ["📊 Обзор","📍 Карта","🎯 Стратегия","📋 Контент","📢 Реклама","💰 Финансы"]:
            tabs.add(t)

        self._build_overview()
        self._build_roadmap()
        self._build_strategy()
        self._build_content()
        self._build_ads()
        self._build_finance()

    def _on_tab(self):
        t = self._tabs.get()
        if t == "📍 Карта": self._render_roadmap()
        elif t == "💰 Финансы": self._render_finance()

    def _build_overview(self):
        tab = self._tabs.tab("📊 Обзор")
        sc = ctk.CTkScrollableFrame(tab, fg_color=BG)
        sc.pack(fill="both", expand=True, padx=8, pady=8)
        c = self.c
        m = c.get("metrics",{}).get("instagram",{})

        krow = ctk.CTkFrame(sc, fg_color="transparent"); krow.pack(fill="x",pady=(0,10))
        for lbl,val,col in [("Подписчики",f"{m.get('followers',0):,}",ACCENT2),
                              ("Охват",f"{m.get('reach',0):,}",CYAN),
                              ("ER",f"{m.get('er',0):.1f}%",GREEN),
                              ("Лиды",str(m.get('leads',0)),ORANGE)]:
            t = card(krow); t.pack(side="left",expand=True,fill="x",padx=(0,6))
            label(t,val,18,col,bold=True).pack(pady=(10,2))
            label(t,lbl,10,TEXT2).pack(pady=(0,10))

        ab = ctk.CTkFrame(sc,fg_color="transparent"); ab.pack(fill="x",pady=(0,10))
        for lbl,val,col,exp in [("● ТОЧКА А",f"${c.get('income',0):,.0f}",RED,True),
                                  ("→","→",TEXT3,False),
                                  ("● ТОЧКА Б",f"${c.get('goal_inc',0):,.0f}",GREEN,True)]:
            f = card(ab) if exp else ctk.CTkFrame(ab,fg_color="transparent")
            f.pack(side="left",expand=exp,fill="x" if exp else None,padx=4)
            label(f,lbl,10,col,bold=True).pack(pady=(8,0))
            label(f,val,14,TEXT,bold=True).pack(pady=(0,8))

        pc = card(sc); pc.pack(fill="x",pady=(0,10))
        ph = ctk.CTkFrame(pc,fg_color="transparent"); ph.pack(fill="x",padx=14,pady=(12,4))
        sname = JOURNEY[c.get("stage",0)] if c.get("stage",0)<len(JOURNEY) else "—"
        label(ph,f"Этап {c.get('stage',0)+1}/9: {sname}",12,bold=True).pack(side="left")
        label(ph,f"{c.get('stage_pct',10)}%",13,c.get("color","#6366f1"),bold=True).pack(side="right")
        pb = ctk.CTkProgressBar(pc,progress_color=c.get("color","#6366f1"),fg_color=CARD2,height=6)
        pb.set(c.get("stage_pct",10)/100); pb.pack(fill="x",padx=14,pady=(0,14))
        for alert in c.get("alerts",[]):
            label(sc,alert,11,RED).pack(anchor="w",pady=2)

    def _build_roadmap(self):
        tab = self._tabs.tab("📍 Карта")
        self._rm = ctk.CTkScrollableFrame(tab, fg_color=BG)
        self._rm.pack(fill="both", expand=True, padx=8, pady=8)
        self._render_roadmap()

    def _render_roadmap(self):
        for w in self._rm.winfo_children(): w.destroy()
        c = self.c
        # Reload fresh data
        for cl in load_clients():
            if cl.get("id") == c.get("id"):
                c = cl; self.c = cl; break

        total = sum(len(s["checks"]) for s in BMAP)
        done = sum(1 for s in BMAP for i in range(len(s["checks"]))
                   if c.get("checklist",{}).get(f"{s['id']}__{i}",False))
        ov_pct = int(done/total*100) if total else 0

        ov = card(self._rm); ov.pack(fill="x",pady=(0,10))
        oh = ctk.CTkFrame(ov,fg_color="transparent"); oh.pack(fill="x",padx=14,pady=(12,4))
        label(oh,"Общий прогресс",12,bold=True).pack(side="left")
        label(oh,f"{ov_pct}%",14,GREEN if ov_pct>=75 else ORANGE,bold=True).pack(side="right")
        pb = ctk.CTkProgressBar(ov,progress_color=GREEN if ov_pct>=75 else ORANGE,fg_color=CARD2,height=6)
        pb.set(ov_pct/100); pb.pack(fill="x",padx=14,pady=(0,14))

        for step in BMAP:
            checks = step["checks"]
            cl_dict = c.get("checklist",{})
            done_l = [cl_dict.get(f"{step['id']}__{i}",False) for i in range(len(checks))]
            done_c = sum(done_l)
            pct = int(done_c/len(checks)*100) if checks else 0
            color = step["color"]

            sc = card(self._rm); sc.pack(fill="x",pady=4)
            ctk.CTkFrame(sc,height=3,fg_color=color,corner_radius=2).pack(fill="x")
            sh = ctk.CTkFrame(sc,fg_color="transparent"); sh.pack(fill="x",padx=12,pady=(8,4))
            label(sh,step["name"],13,bold=True).pack(side="left")
            label(sh,"✅ Готово" if pct==100 else f"{pct}%",11,
                  GREEN if pct==100 else color,bold=True).pack(side="right")
            pb2 = ctk.CTkProgressBar(sc,progress_color=color,fg_color=CARD2,height=4)
            pb2.set(pct/100); pb2.pack(fill="x",padx=12,pady=(0,8))
            for i,(check,is_done) in enumerate(zip(checks,done_l)):
                r = ctk.CTkFrame(sc,fg_color="transparent"); r.pack(fill="x",padx=12,pady=2)
                cb = ctk.CTkCheckBox(r,text=check,font=("Inter",11),
                                      text_color=TEXT3 if is_done else TEXT2,
                                      fg_color=ACCENT,hover_color=ACCENT2,checkmark_color="#000",
                                      command=lambda sid=step["id"],idx=i: self._toggle(sid,idx))
                cb.pack(side="left")
                if is_done: cb.select()
            ctk.CTkFrame(sc,height=6,fg_color="transparent").pack()

    def _toggle(self, step_id, idx):
        key = f"{step_id}__{idx}"
        clients = load_clients()
        for cl in clients:
            if cl.get("id") == self.c.get("id"):
                if "checklist" not in cl: cl["checklist"] = {}
                cl["checklist"][key] = not cl["checklist"].get(key, False)
                self.c = cl
                break
        save_clients(clients)
        self._render_roadmap()

    def _build_strategy(self):
        tab = self._tabs.tab("🎯 Стратегия")
        sc = ctk.CTkScrollableFrame(tab,fg_color=BG); sc.pack(fill="both",expand=True,padx=8,pady=8)
        c = self.c
        ai_card(sc,"🎯 AI Стратегия на 3 месяца",
                lambda: f"{client_ctx(c)}\n\nСоздай стратегию на 3 месяца: позиционирование, контент-микс, воронка, KPI.", ACCENT)
        ai_card(sc,"🧠 Распаковка личного бренда",
                lambda: f"{client_ctx(c)}\n\nРаспакуй личный бренд: brand story (3 абзаца), 7 ценностей, УТП, голос бренда, bio Instagram.", PINK)
        ai_card(sc,"📦 Продуктовая линейка",
                lambda: f"{client_ctx(c)}\n\nСоздай линейку 4 уровней: лид-магнит, $100-300, $300-800, наставничество. Для каждого: название, цена, результат.", CYAN)

    def _build_content(self):
        tab = self._tabs.tab("📋 Контент")
        sc = ctk.CTkScrollableFrame(tab,fg_color=BG); sc.pack(fill="both",expand=True,padx=8,pady=8)
        c = self.c
        ai_card(sc,"🎙 15 вопросов для подкаста",
                lambda: f"{client_ctx(c)}\n\nСоздай 15 глубоких вопросов для подкаста. Нумерованный список. Вопросы вызывают историю и эмоцию.", ACCENT)
        ai_card(sc,"✍️ 3 текста для Reels",
                lambda: f"{client_ctx(c)}\n\nНапиши 3 скрипта для Reels в голосе клиента. Каждый: хук (3 сек) + основная часть (45 сек) + CTA.", PINK)
        ai_card(sc,"📅 Контент-план на неделю",
                lambda: f"{client_ctx(c)}\n\nКонтент-план на неделю (Пн-Вс): тема, тип контента, платформа, время.", ORANGE)

    def _build_ads(self):
        tab = self._tabs.tab("📢 Реклама")
        sc = ctk.CTkScrollableFrame(tab,fg_color=BG); sc.pack(fill="both",expand=True,padx=8,pady=8)
        c = self.c
        ai_card(sc,"📢 9 рекламных сценариев (3 группы × 3)",
                lambda: f"{client_ctx(c)}\n\nСоздай 9 рекламных текстов: группа 1 — боль→решение, группа 2 — желание→результат, группа 3 — социальное доказательство. В каждой группе 3 варианта.", ORANGE)
        ai_card(sc,"📊 Анализ и рекомендации",
                lambda: f"{client_ctx(c)}\n\nПроанализируй метрики клиента и дай 5 конкретных рекомендаций что улучшить в контенте и рекламе.", ACCENT2)

    def _build_finance(self):
        tab = self._tabs.tab("💰 Финансы")
        self._fin_sc = ctk.CTkScrollableFrame(tab,fg_color=BG)
        self._fin_sc.pack(fill="both",expand=True,padx=8,pady=8)
        self._render_finance()

    def _render_finance(self):
        for w in self._fin_sc.winfo_children(): w.destroy()
        c = self.c
        share = c.get("income",0)*0.3
        pct = min(1.0,c.get("income",0)/c.get("goal_inc",1)) if c.get("goal_inc",0)>0 else 0

        row = ctk.CTkFrame(self._fin_sc,fg_color="transparent"); row.pack(fill="x",pady=(0,10))
        for lbl,val,col in [("Доход клиента",f"${c.get('income',0):,.0f}",ACCENT2),
                              ("30% агентству",f"${share:,.0f}",GREEN),
                              ("Цель",f"${c.get('goal_inc',0):,.0f}",ORANGE)]:
            t = card(row); t.pack(side="left",expand=True,fill="x",padx=(0,6))
            label(t,val,18,col,bold=True).pack(pady=(10,2))
            label(t,lbl,10,TEXT2).pack(pady=(0,10))

        fc = card(self._fin_sc); fc.pack(fill="x",pady=(0,10))
        label(fc,f"${c.get('income',0):,.0f} × 30% = ${share:,.0f}/мес",13,bold=True).pack(anchor="w",padx=14,pady=(12,4))
        pb = ctk.CTkProgressBar(fc,progress_color=GREEN,fg_color=CARD2,height=6)
        pb.set(pct); pb.pack(fill="x",padx=14,pady=(0,14))

        # Update income form
        uc = card(self._fin_sc); uc.pack(fill="x",pady=(0,10))
        label(uc,"Обновить доход клиента",12,bold=True).pack(anchor="w",padx=14,pady=(12,6))
        ir = ctk.CTkFrame(uc,fg_color="transparent"); ir.pack(fill="x",padx=14,pady=(0,12))
        ie = ctk.CTkEntry(ir,placeholder_text="Новый доход $",height=36,
                           fg_color=CARD2,border_color=BORDER2,text_color=TEXT,width=180)
        ie.pack(side="left",padx=(0,8))
        def save_income():
            try:
                v = float(ie.get().strip())
                clients = load_clients()
                for cl in clients:
                    if cl.get("id")==self.c.get("id"):
                        cl["income"] = v; self.c = cl; break
                save_clients(clients)
                self._render_finance()
            except: pass
        btn(ir,"💾 Сохранить",save_income,height=36).pack(side="left")

# ═══════════════════════════════════════
#  PRODUCTS
# ═══════════════════════════════════════
class ProductsScreen(ctk.CTkFrame):
    def __init__(self, master, app):
        super().__init__(master, fg_color=BG, corner_radius=0)
        self.app = app
        self._build()

    def _build(self):
        hdr = ctk.CTkFrame(self, fg_color=NAV, corner_radius=0, height=56)
        hdr.pack(fill="x"); hdr.pack_propagate(False)
        label(hdr,"📦 Продукты и воронки",18,bold=True).pack(side="left",padx=20,pady=14)
        sc = ctk.CTkScrollableFrame(self, fg_color=BG, corner_radius=0)
        sc.pack(fill="both", expand=True, padx=14, pady=12)

        for name,price,desc,color,funnel in [
            ("📱 Мини-курс","$97","Пассивный доход. Воронка работает автоматически.",ACCENT,
             ["📢 Реклама","🌐 Лендинг","🎥 Урок","📖 Статья","💳 Оплата"]),
            ("🎓 Наставничество","$1,500","Обучение. 5 мест в месяц.",PINK,
             ["📥 Лиды","📞 Созвон","📝 Договор","📚 Курс","⭐ Результат"]),
            ("🚀 Продюсирование","$3,000/мес или 30%","Полный сервис под ключ.",GREEN,
             ["📞 Созвон","📄 КП","📝 Договор","🗺 Карта","💰 30%"]),
        ]:
            f = card(sc); f.pack(fill="x",pady=6)
            ctk.CTkFrame(f,height=4,fg_color=color,corner_radius=2).pack(fill="x")
            h = ctk.CTkFrame(f,fg_color="transparent"); h.pack(fill="x",padx=14,pady=(12,4))
            label(h,name,15,bold=True).pack(side="left")
            label(h,price,15,GREEN,bold=True).pack(side="right")
            label(f,desc,12,TEXT2).pack(anchor="w",padx=14)
            fr = ctk.CTkFrame(f,fg_color="transparent"); fr.pack(fill="x",padx=14,pady=(6,6))
            for i,step in enumerate(funnel):
                ctk.CTkLabel(fr,text=step,font=("Inter",10),fg_color=CARD2,
                             text_color=TEXT2,corner_radius=6,padx=8,pady=4).pack(side="left")
                if i<len(funnel)-1:
                    label(fr," → ",10,TEXT3).pack(side="left")
            ai_card(f,f"🤖 AI генерирует КП для {name}",
                    lambda n=name,p=price: f"Создай краткое КП для услуги '{n}' за {p}.\n1.Кто мы 2.Что входит 3.Результат 4.Инвестиция 5.Следующий шаг.",
                    color)

# ═══════════════════════════════════════
#  CONTENT / VIZARD
# ═══════════════════════════════════════
class ContentScreen(ctk.CTkFrame):
    def __init__(self, master, app):
        super().__init__(master, fg_color=BG, corner_radius=0)
        self.app = app
        self._clips = []
        self._captions = []
        self._pid = None
        self._build()

    def _build(self):
        hdr = ctk.CTkFrame(self, fg_color=NAV, corner_radius=0, height=56)
        hdr.pack(fill="x"); hdr.pack_propagate(False)
        label(hdr,"🎬 Контент и Vizard",18,bold=True).pack(side="left",padx=20,pady=14)
        sc = ctk.CTkScrollableFrame(self, fg_color=BG, corner_radius=0)
        sc.pack(fill="both", expand=True, padx=14, pady=12)
        self._build_vizard(sc)
        self._build_ai_content(sc)

    def _build_vizard(self, parent):
        DEMO = [{"videoId":1001,"title":"Как похудеть без диет","viralScore":"9.1"},
                {"videoId":1002,"title":"Главная ошибка в питании","viralScore":"8.7"},
                {"videoId":1003,"title":"3 продукта мешающих похудеть","viralScore":"9.4"}]

        f = card(parent); f.pack(fill="x",pady=(0,10))
        label(f,"🎙 Vizard Pipeline — 4 шага",14,bold=True).pack(anchor="w",padx=14,pady=(12,8))

        for num,title,color in [("1","📤 URL видео",ACCENT),("2","✂️ Клипы",ORANGE),
                                  ("3","✍️ AI Подписи",CYAN),("4","📅 Расписание",PINK)]:
            sf = ctk.CTkFrame(f,fg_color=CARD2,corner_radius=10); sf.pack(fill="x",padx=12,pady=4)
            ctk.CTkFrame(sf,height=3,fg_color=color,corner_radius=2).pack(fill="x")
            sh = ctk.CTkFrame(sf,fg_color="transparent"); sh.pack(fill="x",padx=10,pady=(8,6))
            ctk.CTkLabel(sh,text=num,font=("Inter",13,"bold"),fg_color=color,
                         text_color="#000",width=24,height=24,corner_radius=12).pack(side="left",padx=(0,8))
            label(sh,title,13,bold=True).pack(side="left")

            if num=="1":
                row = ctk.CTkFrame(sf,fg_color="transparent"); row.pack(fill="x",padx=10,pady=(0,10))
                self._url_entry = ctk.CTkEntry(row,placeholder_text="YouTube/Google Drive URL...",
                                               height=36,fg_color=CARD,border_color=BORDER2,text_color=TEXT)
                self._url_entry.pack(side="left",fill="x",expand=True,padx=(0,8))
                self._pid_lbl = label(sf,"",11,TEXT3)
                self._pid_lbl.pack(anchor="w",padx=10,pady=(0,6))
                def step1():
                    url = self._url_entry.get().strip()
                    if not url: return
                    pid = f"DEMO_{int(time.time())}"
                    self._pid = pid
                    self._pid_lbl.configure(text=f"✅ Проект создан (демо: {pid})")
                    self._clips = DEMO
                    self._btn2.configure(state="normal",fg_color=ORANGE+"44",text_color=ORANGE)
                ctk.CTkButton(row,text="⚡ Отправить",font=("Inter",11,"bold"),
                              fg_color=ACCENT+"44",hover_color=ACCENT+"88",text_color=ACCENT,
                              height=36,corner_radius=8,command=step1).pack(side="right")

            elif num=="2":
                self._clips_frame = ctk.CTkFrame(sf,fg_color="transparent")
                self._clips_frame.pack(fill="x",padx=10,pady=(0,8))
                self._btn2 = ctk.CTkButton(sh,"🔄 Получить клипы",
                                            font=("Inter",11,"bold"),height=28,width=130,
                                            fg_color=CARD,text_color=TEXT3,corner_radius=8,state="disabled")
                self._btn2.pack(side="right")
                def step2():
                    for w in self._clips_frame.winfo_children(): w.destroy()
                    for clip in self._clips:
                        score = float(clip.get("viralScore",7))
                        cr = ctk.CTkFrame(self._clips_frame,fg_color=CARD,corner_radius=8)
                        cr.pack(fill="x",pady=2)
                        label(cr,clip.get("title","?"),11).pack(side="left",padx=8,pady=6)
                        col = GREEN if score>=9 else (ORANGE if score>=8 else RED)
                        label(cr,f"⚡{score}",11,col,bold=True).pack(side="right",padx=8)
                    self._btn3.configure(state="normal",fg_color=CYAN+"44",text_color=CYAN)
                self._btn2.configure(command=step2)

            elif num=="3":
                self._caps_frame = ctk.CTkFrame(sf,fg_color="transparent")
                self._caps_frame.pack(fill="x",padx=10,pady=(0,8))
                self._btn3 = ctk.CTkButton(sh,"✦ AI Подписи",
                                            font=("Inter",11,"bold"),height=28,width=130,
                                            fg_color=CARD,text_color=TEXT3,corner_radius=8,state="disabled")
                self._btn3.pack(side="right")
                def step3():
                    self._btn3.configure(text="⏳",state="disabled")
                    def do():
                        self._captions = []
                        for clip in self._clips:
                            cap = ask_ai(f"Подпись для Reels '{clip.get('title','?')}'. Хук + текст + CTA + 5 хэштегов. До 120 слов.","Копирайтер, пишешь цепляющие подписи.")
                            self._captions.append((clip,cap))
                        self.after(0,show_caps)
                    def show_caps():
                        for w in self._caps_frame.winfo_children(): w.destroy()
                        for clip,cap in self._captions:
                            cr = ctk.CTkFrame(self._caps_frame,fg_color=CARD,corner_radius=8)
                            cr.pack(fill="x",pady=3)
                            label(cr,clip.get("title","?")[:35],11,ACCENT2,bold=True).pack(anchor="w",padx=8,pady=(6,2))
                            label(cr,cap[:70]+"...",10,TEXT2,wraplength=400).pack(anchor="w",padx=8,pady=(0,6))
                        self._btn3.configure(text="✦ AI Подписи",state="normal")
                        self._btn4.configure(state="normal",fg_color=PINK+"44",text_color=PINK)
                    threading.Thread(target=do,daemon=True).start()
                self._btn3.configure(command=step3)

            elif num=="4":
                row4 = ctk.CTkFrame(sf,fg_color="transparent"); row4.pack(fill="x",padx=10,pady=(0,10))
                self._int_var = ctk.StringVar(value="2")
                label(row4,"Интервал (дней):",11,TEXT2).pack(side="left")
                ctk.CTkOptionMenu(row4,values=["1","2","3","5","7"],variable=self._int_var,
                                   fg_color=CARD,button_color=BORDER2,text_color=TEXT,
                                   dropdown_fg_color=CARD,width=80).pack(side="left",padx=8)
                self._sched_lbl = label(sf,"",11,TEXT2); self._sched_lbl.pack(anchor="w",padx=10,pady=(0,8))
                self._btn4 = ctk.CTkButton(sh,"📅 Запланировать",
                                            font=("Inter",11,"bold"),height=28,width=140,
                                            fg_color=CARD,text_color=TEXT3,corner_radius=8,state="disabled")
                self._btn4.pack(side="right")
                def step4():
                    if not self._clips: return
                    dt = datetime.now(); interval = int(self._int_var.get())
                    lines = []
                    for i,clip in enumerate(self._clips):
                        pub = dt+timedelta(days=i*interval)
                        lines.append(f"📅 {pub.strftime('%d.%m.%Y')} — {clip.get('title','?')[:35]}")
                    self._sched_lbl.configure(text="\n".join(lines),text_color=GREEN)
                self._btn4.configure(command=step4)

        ctk.CTkFrame(f,height=8,fg_color="transparent").pack()

    def _build_ai_content(self, parent):
        f = card(parent); f.pack(fill="x",pady=(0,10))
        label(f,"📝 AI Генератор контента",14,bold=True).pack(anchor="w",padx=14,pady=(12,8))
        ai_card(f,"📢 9 рекламных сценариев для агентства",
                lambda:"Создай 9 рекламных текстов для продюсерского агентства.\nГруппа 1 (боль→решение): для экспертов без системы.\nГруппа 2 (желание→результат): хотят масштабироваться.\nГруппа 3 (доказательство): кейсы и результаты.\n3 варианта в каждой группе.", ORANGE)
        ai_card(f,"✍️ Тексты для постов агентства",
                lambda:"Напиши 3 поста для Instagram агентства AMAImedia.\nТема: продюсирование экспертов.\nФормат: хук + история + CTA.", ACCENT)
        ctk.CTkFrame(f,height=8,fg_color="transparent").pack()

# ═══════════════════════════════════════
#  FINANCE
# ═══════════════════════════════════════
class FinanceScreen(ctk.CTkFrame):
    def __init__(self, master, app):
        super().__init__(master, fg_color=BG, corner_radius=0)
        self.app = app
        self._build()

    def _build(self):
        hdr = ctk.CTkFrame(self, fg_color=NAV, corner_radius=0, height=56)
        hdr.pack(fill="x"); hdr.pack_propagate(False)
        label(hdr,"💰 Финансы и KPI",18,bold=True).pack(side="left",padx=20,pady=14)
        btn(hdr,"+ Транзакция",self._add_modal,height=34,width=130).pack(side="right",padx=16,pady=11)

        self._sc = ctk.CTkScrollableFrame(self, fg_color=BG, corner_radius=0)
        self._sc.pack(fill="both", expand=True, padx=14, pady=12)
        self._render()

    def _render(self):
        for w in self._sc.winfo_children(): w.destroy()
        fin = load_finance()
        income = sum(t.get("amount",0) for t in fin["income"])
        expenses = sum(e.get("amount",0) for e in fin["expenses"])
        profit = income - expenses
        kpi_pct = min(1.0, income/KPI_TARGET)

        krow = ctk.CTkFrame(self._sc,fg_color="transparent"); krow.pack(fill="x",pady=(0,10))
        for lbl,val,col in [("💰 Доход",f"${income:,.0f}",GREEN),
                              ("📉 Расходы",f"${expenses:,.0f}",RED),
                              ("✨ Прибыль",f"${profit:,.0f}",ACCENT2),
                              ("📊 KPI",f"{int(kpi_pct*100)}%",GREEN if kpi_pct>=1 else ORANGE)]:
            t = card(krow); t.pack(side="left",expand=True,fill="x",padx=(0,6))
            label(t,val,18,col,bold=True).pack(pady=(10,2))
            label(t,lbl,10,TEXT2).pack(pady=(0,10))

        kc = card(self._sc); kc.pack(fill="x",pady=(0,10))
        kh = ctk.CTkFrame(kc,fg_color="transparent"); kh.pack(fill="x",padx=14,pady=(12,4))
        label(kh,f"KPI: ${KPI_TARGET:,}/мес",13,bold=True).pack(side="left")
        col = GREEN if kpi_pct>=1 else (ORANGE if kpi_pct>=0.7 else RED)
        label(kh,f"${income:,.0f} / {int(kpi_pct*100)}%",13,col,bold=True).pack(side="right")
        pb = ctk.CTkProgressBar(kc,progress_color=col,fg_color=CARD2,height=8,corner_radius=4)
        pb.set(kpi_pct); pb.pack(fill="x",padx=14,pady=(0,8))
        if kpi_pct>=1:
            label(kc,f"🎉 KPI выполнен! Бонус директора: ${income*0.2:,.0f}",12,GREEN,bold=True).pack(anchor="w",padx=14,pady=(0,12))
        else:
            ctk.CTkFrame(kc,height=6,fg_color="transparent").pack()

        label(self._sc,"Последние транзакции",13,bold=True).pack(anchor="w",pady=(8,4))
        for t in reversed(fin["income"][-10:]):
            r = card(self._sc); r.pack(fill="x",pady=2)
            label(r,t.get("desc","?"),12,TEXT2).pack(side="left",padx=12,pady=8)
            label(r,t.get("date",""),10,TEXT3).pack(side="right",padx=8)
            label(r,f"+${t.get('amount',0):,.0f}",12,GREEN,bold=True).pack(side="right",padx=4)
        if not fin["income"]:
            label(self._sc,"Нет транзакций",13,TEXT3).pack(pady=20)

    def _add_modal(self):
        win = ctk.CTkToplevel(self); win.title("+ Транзакция")
        win.geometry("360x280"); win.configure(fg_color=CARD); win.lift(); win.focus()
        label(win,"Добавить транзакцию",15,bold=True).pack(pady=(14,10))
        label(win,"Описание",11,TEXT2).pack(anchor="w",padx=20)
        de = ctk.CTkEntry(win,placeholder_text="Мини-курс апрель",height=36,
                           fg_color=CARD2,border_color=BORDER2,text_color=TEXT)
        de.pack(fill="x",padx=20,pady=(2,8))
        label(win,"Сумма ($)",11,TEXT2).pack(anchor="w",padx=20)
        ae = ctk.CTkEntry(win,placeholder_text="1500",height=36,
                           fg_color=CARD2,border_color=BORDER2,text_color=TEXT)
        ae.pack(fill="x",padx=20,pady=(2,8))
        tv = ctk.StringVar(value="minicourse")
        ctk.CTkOptionMenu(win,values=["minicourse","mentoring","production","other"],
                           variable=tv,fg_color=CARD2,button_color=BORDER2,
                           text_color=TEXT,dropdown_fg_color=CARD).pack(fill="x",padx=20,pady=(2,12))
        def add():
            d = de.get().strip()
            try: a = float(ae.get().strip())
            except: return
            if not d: return
            fin = load_finance()
            fin["income"].append({"id":int(time.time()),"desc":d,"amount":a,
                                   "type":tv.get(),"date":date.today().strftime("%d.%m")})
            if fin["months"]: fin["months"][-1]["v"] = fin["months"][-1].get("v",0)+a
            save_finance(fin)
            win.destroy(); self._render()
        btn(win,"✅ Добавить",add,height=40).pack(fill="x",padx=20)

# ═══════════════════════════════════════
#  MONITOR SCREEN — Engine v4.0
# ═══════════════════════════════════════
class MonitorScreen(ctk.CTkFrame):
    """Real-time dashboard showing engine state every 3 seconds."""

    _AGENT_ICONS = {
        "hunter": "🔍", "salesman": "💬", "scorer": "📊",
        "nurture": "🌱", "publisher": "📤", "analyst": "📈",
        "strategist": "🧠",
    }
    _AGENT_NAMES = {
        "hunter": "Охотник", "salesman": "Продажник", "scorer": "Скорщик",
        "nurture": "Прогревщик", "publisher": "Публикатор",
        "analyst": "Аналитик", "strategist": "Стратег",
    }
    _EVT_ICONS = {
        "ERROR": "🔴", "HOT": "🔥", "TASK": "⚙️", "ENGINE": "⚡",
        "SCORER": "📊", "NURTURE": "🌱", "PUBLISHER": "📤",
        "ANALYST": "📈", "STRATEGIST": "🧠",
    }
    _STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                               "pc_data", "engine_state.json")

    def __init__(self, master, app):
        super().__init__(master, fg_color=BG, corner_radius=0)
        self.app = app
        self._engine_proc = None
        self._build()
        self._schedule_refresh()

    # ── layout ────────────────────────────────────────────────────────────────

    def _build(self):
        # Header
        hdr = ctk.CTkFrame(self, fg_color=NAV, corner_radius=0, height=56)
        hdr.pack(fill="x")
        hdr.pack_propagate(False)
        label(hdr, "⚡ Mission Control — Autonomous Engine v4.0",
              18, bold=True).pack(side="left", padx=20, pady=14)

        # Status bar
        sb = ctk.CTkFrame(self, fg_color=CARD, corner_radius=0, height=48)
        sb.pack(fill="x")
        sb.pack_propagate(False)

        self._status_lbl = ctk.CTkLabel(
            sb, text="⏸ ENGINE ОСТАНОВЛЕН",
            font=("Inter", 13, "bold"), text_color=ORANGE)
        self._status_lbl.pack(side="left", padx=16, pady=12)

        self._uptime_lbl = ctk.CTkLabel(sb, text="",
                                         font=("Inter", 11), text_color=TEXT2)
        self._uptime_lbl.pack(side="left", padx=8)

        bf = ctk.CTkFrame(sb, fg_color="transparent")
        bf.pack(side="right", padx=16, pady=8)

        self._btn_start = ctk.CTkButton(
            bf, text="▶ Запустить", width=110,
            fg_color=GREEN, text_color="#000", font=("Inter", 11, "bold"),
            corner_radius=8, command=self._start_engine)
        self._btn_start.pack(side="left", padx=4)

        self._btn_stop = ctk.CTkButton(
            bf, text="⏸ Пауза", width=90,
            fg_color=ORANGE, text_color="#000", font=("Inter", 11, "bold"),
            corner_radius=8, command=self._stop_engine, state="disabled")
        self._btn_stop.pack(side="left", padx=4)

        ctk.CTkButton(
            bf, text="🔄 Рестарт", width=90,
            fg_color=CARD2, text_color=TEXT2, font=("Inter", 11),
            corner_radius=8, command=self._restart_engine
        ).pack(side="left", padx=4)

        # Main 3-column grid
        main = ctk.CTkFrame(self, fg_color="transparent")
        main.pack(fill="both", expand=True, padx=12, pady=8)
        main.columnconfigure(0, weight=35)
        main.columnconfigure(1, weight=40)
        main.columnconfigure(2, weight=25)
        main.rowconfigure(0, weight=1)

        # Left — agents
        lf = ctk.CTkFrame(main, fg_color=CARD, corner_radius=12,
                           border_width=1, border_color=BORDER)
        lf.grid(row=0, column=0, sticky="nsew", padx=(0, 6))
        label(lf, "Агенты", 13, bold=True).pack(anchor="w", padx=12, pady=(10, 6))
        self._agents_frame = ctk.CTkScrollableFrame(
            lf, fg_color="transparent", corner_radius=0)
        self._agents_frame.pack(fill="both", expand=True, padx=6, pady=(0, 8))

        # Center — event feed
        cf = ctk.CTkFrame(main, fg_color=CARD, corner_radius=12,
                           border_width=1, border_color=BORDER)
        cf.grid(row=0, column=1, sticky="nsew", padx=6)
        label(cf, "Лента событий", 13, bold=True).pack(anchor="w", padx=12, pady=(10, 6))
        self._events_box = ctk.CTkTextbox(
            cf, fg_color=CARD2, text_color=TEXT2,
            font=("Courier", 10), corner_radius=8,
            border_width=0, state="disabled")
        self._events_box.pack(fill="both", expand=True, padx=8, pady=(0, 8))

        # Right — schedule + stats
        rf = ctk.CTkFrame(main, fg_color=CARD, corner_radius=12,
                           border_width=1, border_color=BORDER)
        rf.grid(row=0, column=2, sticky="nsew", padx=(6, 0))
        label(rf, "Расписание", 13, bold=True).pack(anchor="w", padx=12, pady=(10, 6))
        self._schedule_frame = ctk.CTkScrollableFrame(
            rf, fg_color="transparent", corner_radius=0, height=220)
        self._schedule_frame.pack(fill="x", padx=6)

        label(rf, "Статистика дня", 12, bold=True).pack(anchor="w", padx=12, pady=(14, 4))
        self._stats_frame = ctk.CTkFrame(rf, fg_color="transparent")
        self._stats_frame.pack(fill="x", padx=12, pady=(0, 8))

    # ── engine control ────────────────────────────────────────────────────────

    def _start_engine(self):
        import subprocess
        py = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "python_embedded", "python.exe")
        if not os.path.exists(py):
            py = "python"
        eng = os.path.join(os.path.dirname(os.path.abspath(__file__)), "engine.py")
        try:
            flags = getattr(subprocess, "CREATE_NEW_CONSOLE", 0)
            self._engine_proc = subprocess.Popen([py, eng], creationflags=flags)
            self._btn_start.configure(state="disabled")
            self._btn_stop.configure(state="normal")
            self._status_lbl.configure(text="🟢 ENGINE РАБОТАЕТ", text_color=GREEN)
        except Exception as exc:
            self._status_lbl.configure(text=f"❌ Ошибка: {exc}", text_color=RED)

    def _stop_engine(self):
        if self._engine_proc:
            try:
                self._engine_proc.terminate()
            except Exception:
                pass
        self._engine_proc = None
        self._btn_start.configure(state="normal")
        self._btn_stop.configure(state="disabled")
        self._status_lbl.configure(text="⏸ ENGINE ОСТАНОВЛЕН", text_color=ORANGE)

    def _restart_engine(self):
        self._stop_engine()
        self.after(2000, self._start_engine)

    # ── refresh ───────────────────────────────────────────────────────────────

    def _schedule_refresh(self):
        try:
            if not self.winfo_exists():
                return
            self._refresh()
        except Exception:
            pass
        self.after(3000, self._schedule_refresh)

    def _refresh(self):
        try:
            if os.path.exists(self._STATE_FILE):
                with open(self._STATE_FILE, encoding="utf-8") as f:
                    state = json.load(f)
                self._update_ui(state)
        except Exception:
            pass

    def _update_ui(self, state: dict):
        # Status bar uptime
        started = state.get("started_at", "")
        if started and state.get("running"):
            try:
                st = datetime.strptime(started, "%Y-%m-%d %H:%M:%S")
                delta = datetime.now() - st
                h, rem = divmod(int(delta.total_seconds()), 3600)
                m = rem // 60
                self._uptime_lbl.configure(text=f"Запущен: {started[:16]}  Uptime: {h}h {m}m")
                self._status_lbl.configure(text="🟢 ENGINE РАБОТАЕТ", text_color=GREEN)
            except Exception:
                pass

        # Agents column
        for w in self._agents_frame.winfo_children():
            w.destroy()
        for key, agent in state.get("agents", {}).items():
            status = agent.get("status", "idle")
            dot = "🟢" if status == "idle" else ("🟡" if status == "working" else "🔴")
            row = ctk.CTkFrame(self._agents_frame, fg_color=CARD2, corner_radius=8)
            row.pack(fill="x", pady=2)
            ctk.CTkLabel(
                row,
                text=f"{dot} {self._AGENT_ICONS.get(key, '')} {self._AGENT_NAMES.get(key, key)}",
                font=("Inter", 11), text_color=TEXT,
            ).pack(side="left", padx=8, pady=6)
            ctk.CTkLabel(
                row,
                text=f"сег:{agent.get('today', 0)}  всего:{agent.get('total', 0)}",
                font=("Inter", 10), text_color=TEXT2,
            ).pack(side="right", padx=8)

        # Event feed
        events = state.get("events", [])
        self._events_box.configure(state="normal")
        self._events_box.delete("1.0", "end")
        for ev in events[:60]:
            icon = self._EVT_ICONS.get(ev.get("level", ""), "•")
            self._events_box.insert(
                "end",
                f"[{ev.get('time', '')}] {icon} {ev.get('msg', '')}\n",
            )
        self._events_box.configure(state="disabled")

        # Schedule column
        for w in self._schedule_frame.winfo_children():
            w.destroy()
        schedule_info = [
            ("daily_briefing",   "☀️ Брифинг дня",          "09:00 ежедневно"),
            ("lead_scoring",     "📊 Скоринг лидов",         "каждые 15 мин"),
            ("hunter",           "🔍 Охотник",               "каждые 30 мин"),
            ("salesman",         "💬 Продажник",             "каждые 15 мин"),
            ("nurture_sequence", "🌱 Прогрев цепочка",       "каждый час"),
            ("content_publish",  "📤 Публикация контента",   "каждые 2ч в 10:00"),
            ("weekly_report",    "📈 Недельный отчёт",       "вс 20:00"),
            ("weekly_strategy",  "🎯 Стратегия недели",      "пн 08:00"),
        ]
        tasks = state.get("tasks", {})
        for key, name, when in schedule_info:
            task_state = tasks.get(key, {})
            last = task_state.get("last_run", "")
            nxt  = task_state.get("next_run", "")
            last_fmt = last[11:16] if last else "—"
            nxt_fmt  = nxt[11:16]  if nxt  else "—"
            status   = task_state.get("status", "")
            dot = "🟡" if status == "running" else ("🟢" if last else "⚪")
            r = ctk.CTkFrame(self._schedule_frame, fg_color=CARD2, corner_radius=7)
            r.pack(fill="x", pady=2)
            ctk.CTkLabel(r, text=f"{dot} {name}", font=("Inter", 10, "bold"),
                         text_color=TEXT).pack(anchor="w", padx=8, pady=(4, 0))
            ctk.CTkLabel(r, text=f"⏰ {when}  ·  след: {nxt_fmt}  ·  был: {last_fmt}",
                         font=("Inter", 9), text_color=TEXT2).pack(anchor="w", padx=8, pady=(0, 4))

        # Stats
        for w in self._stats_frame.winfo_children():
            w.destroy()
        stats_labels = [
            ("leads_today",       "Лидов найдено"),
            ("messages_sent",     "Сообщений отправлено"),
            ("content_published", "Опубликовано клипов"),
            ("calls_scheduled",   "Созвонов запланировано"),
        ]
        stats = state.get("stats", {})
        for key, lbl in stats_labels:
            r = ctk.CTkFrame(self._stats_frame, fg_color="transparent")
            r.pack(fill="x", pady=2)
            ctk.CTkLabel(r, text=lbl, font=("Inter", 10),
                         text_color=TEXT2).pack(side="left")
            ctk.CTkLabel(r, text=str(stats.get(key, 0)),
                         font=("Inter", 11, "bold"), text_color=ACCENT).pack(side="right")


# ═══════════════════════════════════════
#  ЗАПУСК
# ═══════════════════════════════════════
if __name__ == "__main__":
    init_demo()
    app = ProducerCenter()
    app.mainloop()
