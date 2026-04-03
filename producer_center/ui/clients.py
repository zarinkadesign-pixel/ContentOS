"""Producer Center — Clients List"""
import customtkinter as ctk
from config import *
from core.store import load_clients, add_client
from core.models import JOURNEY, JOURNEY_ICONS


class ClientsScreen(ctk.CTkFrame):
    def __init__(self, master, app):
        super().__init__(master, fg_color=BG, corner_radius=0)
        self.app = app
        self._build()

    def _build(self):
        hdr = ctk.CTkFrame(self, fg_color=NAV, corner_radius=0, height=56)
        hdr.pack(fill="x")
        hdr.pack_propagate(False)
        ctk.CTkLabel(hdr, text="👥 Клиенты на продюсировании",
                     font=("Inter",18,"bold"), text_color=TEXT).pack(side="left", padx=20, pady=14)
        ctk.CTkButton(hdr, text="+ Добавить", font=("Inter",12,"bold"),
                      fg_color=ACCENT, hover_color="#4e5adf", corner_radius=10, height=34,
                      command=self._open_add).pack(side="right", padx=16, pady=11)

        self._scroll = ctk.CTkScrollableFrame(self, fg_color=BG, corner_radius=0)
        self._scroll.pack(fill="both", expand=True, padx=14, pady=12)
        self.refresh()

    def refresh(self):
        for w in self._scroll.winfo_children():
            w.destroy()
        clients = load_clients()
        if not clients:
            ctk.CTkLabel(self._scroll, text="Нет клиентов. Нажми «+ Добавить»",
                         font=("Inter",14), text_color=TEXT3).pack(pady=40)
            return
        for c in clients:
            self._make_card(c)

    def _make_card(self, client):
        card = ctk.CTkFrame(self._scroll, fg_color=CARD, corner_radius=14,
                             border_width=1, border_color=BORDER, cursor="hand2")
        card.pack(fill="x", pady=5)
        card.bind("<Button-1>", lambda e, cid=client.id: self.app.open_client(cid))

        row = ctk.CTkFrame(card, fg_color="transparent")
        row.pack(fill="x", padx=14, pady=12)

        # Avatar
        av = ctk.CTkLabel(row, text=client.emoji, font=("Inter",26), width=48,
                           fg_color=client.color+"22", corner_radius=12,
                           text_color=client.color)
        av.pack(side="left", padx=(0,12))
        av.bind("<Button-1>", lambda e, cid=client.id: self.app.open_client(cid))

        # Info
        info = ctk.CTkFrame(row, fg_color="transparent")
        info.pack(side="left", fill="both", expand=True)
        info.bind("<Button-1>", lambda e, cid=client.id: self.app.open_client(cid))

        name_row = ctk.CTkFrame(info, fg_color="transparent")
        name_row.pack(fill="x")
        ctk.CTkLabel(name_row, text=client.name, font=("Inter",14,"bold"),
                     text_color=TEXT, anchor="w").pack(side="left")
        stage_txt = f"{JOURNEY_ICONS[client.stage]} {JOURNEY[client.stage]}" if client.stage < len(JOURNEY) else ""
        ctk.CTkLabel(name_row, text=stage_txt, font=("Inter",11),
                     fg_color=client.color+"22", text_color=client.color,
                     corner_radius=6, padx=8).pack(side="left", padx=8)

        ctk.CTkLabel(info, text=f"{client.niche} · {client.socials}",
                     font=("Inter",11), text_color=TEXT2, anchor="w").pack(fill="x")

        # Progress bar
        prog_row = ctk.CTkFrame(info, fg_color="transparent")
        prog_row.pack(fill="x", pady=(4,0))
        bar = ctk.CTkProgressBar(prog_row, height=4, progress_color=client.color,
                                  fg_color=CARD2, corner_radius=2, width=200)
        bar.set(client.stage_pct / 100)
        bar.pack(side="left")
        ctk.CTkLabel(prog_row, text=f"{client.stage_pct}%",
                     font=("Inter",10,"bold"), text_color=client.color).pack(side="left", padx=6)

        if client.alerts:
            ctk.CTkLabel(info, text=client.alerts[0], font=("Inter",10),
                         text_color=RED, anchor="w").pack(fill="x")

        # Revenue
        share = client.income * 0.3
        ctk.CTkLabel(row, text=f"+${share:,.0f}/мес\n30%",
                     font=("Inter",12,"bold"), text_color=GREEN, justify="right").pack(side="right")

    def _open_add(self):
        win = ctk.CTkToplevel(self)
        win.title("+ Новый клиент")
        win.geometry("460x520")
        win.configure(fg_color=CARD)

        ctk.CTkLabel(win, text="Добавить клиента", font=("Inter",16,"bold"),
                     text_color=TEXT).pack(pady=(16,10))

        scroll = ctk.CTkScrollableFrame(win, fg_color="transparent")
        scroll.pack(fill="both", expand=True, padx=16)

        fields = {}
        specs = [
            ("Имя","name","Алина Морозова"),
            ("Ниша","niche","Нутрициология"),
            ("Аудитория","audience","Женщины 28-42"),
            ("Что уже есть","has","Instagram 5k"),
            ("Соцсети","socials","@username"),
            ("Доход сейчас ($)","income","5000"),
            ("Цель ($)","goal_inc","20000"),
            ("Цели","goals","Запустить курс"),
        ]
        for lbl, key, ph in specs:
            ctk.CTkLabel(scroll, text=lbl, font=("Inter",11), text_color=TEXT2).pack(anchor="w")
            e = ctk.CTkEntry(scroll, placeholder_text=ph, height=34,
                              fg_color=CARD2, border_color=BORDER2, text_color=TEXT)
            e.pack(fill="x", pady=(2,8))
            fields[key] = e

        def _add():
            data = {}
            for k, e in fields.items():
                v = e.get().strip()
                if k in ("income","goal_inc"):
                    try: v = float(v)
                    except: v = 0.0
                data[k] = v
            if not data.get("name"):
                return
            add_client(data)
            win.destroy()
            self.refresh()

        ctk.CTkButton(win, text="✅ Добавить клиента", fg_color=ACCENT,
                      height=40, font=("Inter",13,"bold"), command=_add).pack(fill="x", padx=16, pady=12)
