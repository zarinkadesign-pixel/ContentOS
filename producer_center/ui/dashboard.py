"""Producer Center — Dashboard Screen"""
import threading
import customtkinter as ctk
from config import *
from core.store import load_clients, load_leads, load_finance
from core.agents import run_agent
from config import KPI_TARGET


class DashboardScreen(ctk.CTkFrame):
    def __init__(self, master, app):
        super().__init__(master, fg_color=BG, corner_radius=0)
        self.app = app
        self._build()

    def _build(self):
        # Header
        hdr = ctk.CTkFrame(self, fg_color=NAV, corner_radius=0, height=56)
        hdr.pack(fill="x")
        hdr.pack_propagate(False)
        ctk.CTkLabel(hdr, text="📊 Командный центр",
                     font=("Inter",18,"bold"), text_color=TEXT).pack(side="left", padx=20, pady=14)
        ctk.CTkButton(hdr, text="+ Новый лид", font=("Inter",12,"bold"),
                      fg_color=ACCENT, hover_color="#4e5adf", text_color="#fff",
                      corner_radius=10, height=34,
                      command=lambda: self.app.show_screen("crm")).pack(side="right", padx=16, pady=11)

        # Scrollable body
        scroll = ctk.CTkScrollableFrame(self, fg_color=BG, corner_radius=0)
        scroll.pack(fill="both", expand=True, padx=16, pady=12)

        # KPI row
        self._kpi_frame = ctk.CTkFrame(scroll, fg_color="transparent")
        self._kpi_frame.pack(fill="x", pady=(0,10))
        self._kpi_labels = {}
        for title, key, color in [("💰 Прибыль","profit",GREEN),
                                   ("🔍 Лидов","leads",ACCENT2),
                                   ("📦 Студентов","students",PINK),
                                   ("👥 Клиентов","clients","#f59e0b")]:
            tile = ctk.CTkFrame(self._kpi_frame, fg_color=CARD,
                                corner_radius=14, border_width=1, border_color=BORDER)
            tile.pack(side="left", expand=True, fill="x", padx=(0,8))
            ctk.CTkLabel(tile, text=title, font=("Inter",11), text_color=TEXT2).pack(anchor="w", padx=14, pady=(12,2))
            lbl = ctk.CTkLabel(tile, text="—", font=("Inter",22,"bold"), text_color=color)
            lbl.pack(anchor="w", padx=14, pady=(0,12))
            self._kpi_labels[key] = lbl

        # KPI bar
        kpi_card = ctk.CTkFrame(scroll, fg_color=CARD, corner_radius=14,
                                border_width=1, border_color=BORDER)
        kpi_card.pack(fill="x", pady=(0,10))
        bar_hdr = ctk.CTkFrame(kpi_card, fg_color="transparent")
        bar_hdr.pack(fill="x", padx=16, pady=(12,4))
        ctk.CTkLabel(bar_hdr, text=f"KPI: ${KPI_TARGET:,}/мес",
                     font=("Inter",13,"bold"), text_color=TEXT).pack(side="left")
        self._kpi_pct_lbl = ctk.CTkLabel(bar_hdr, text="0%",
                                          font=("Inter",13,"bold"), text_color=ACCENT2)
        self._kpi_pct_lbl.pack(side="right")
        self._kpi_bar = ctk.CTkProgressBar(kpi_card, progress_color=ACCENT,
                                            fg_color=CARD2, height=8, corner_radius=4)
        self._kpi_bar.set(0)
        self._kpi_bar.pack(fill="x", padx=16, pady=(0,14))

        # Two columns
        cols = ctk.CTkFrame(scroll, fg_color="transparent")
        cols.pack(fill="x", pady=(0,10))

        # Leads mini
        left = ctk.CTkFrame(cols, fg_color=CARD, corner_radius=14,
                             border_width=1, border_color=BORDER)
        left.pack(side="left", expand=True, fill="both", padx=(0,8))
        lhdr = ctk.CTkFrame(left, fg_color="transparent")
        lhdr.pack(fill="x", padx=14, pady=(12,6))
        ctk.CTkLabel(lhdr, text="🔍 Лиды по этапам", font=("Inter",12,"bold"),
                     text_color=TEXT).pack(side="left")
        ctk.CTkButton(lhdr, text="CRM →", font=("Inter",10), fg_color="transparent",
                      text_color=ACCENT2, hover_color=BORDER,
                      command=lambda: self.app.show_screen("crm"), height=24, width=60).pack(side="right")
        self._leads_frame = ctk.CTkFrame(left, fg_color="transparent")
        self._leads_frame.pack(fill="x", padx=14, pady=(0,12))

        # Products mini
        right = ctk.CTkFrame(cols, fg_color=CARD, corner_radius=14,
                              border_width=1, border_color=BORDER)
        right.pack(side="left", expand=True, fill="both")
        rhdr = ctk.CTkFrame(right, fg_color="transparent")
        rhdr.pack(fill="x", padx=14, pady=(12,6))
        ctk.CTkLabel(rhdr, text="📦 Продукты", font=("Inter",12,"bold"),
                     text_color=TEXT).pack(side="left")
        for name, val, color in [("📱 Мини-курс","$97 · пассив",ACCENT2),
                                   ("🎓 Наставничество","$1,500",PINK),
                                   ("🚀 Продюсирование","$3k/мес",GREEN)]:
            row = ctk.CTkFrame(right, fg_color="transparent")
            row.pack(fill="x", padx=14, pady=3)
            ctk.CTkLabel(row, text=name, font=("Inter",12), text_color=TEXT2).pack(side="left")
            ctk.CTkLabel(row, text=val, font=("Inter",12,"bold"), text_color=color).pack(side="right")
        ctk.CTkFrame(right, height=10, fg_color="transparent").pack()

        # Autopilot card
        auto = ctk.CTkFrame(scroll, fg_color="#12083a",
                             corner_radius=14, border_width=1, border_color="#3d2a80")
        auto.pack(fill="x", pady=(0,10))
        ctk.CTkLabel(auto, text="⚡", font=("Inter",28)).pack(anchor="w", padx=16, pady=(14,4))
        ctk.CTkLabel(auto, text="АВТОПИЛОТ АКТИВЕН",
                     font=("Inter",16,"bold"), text_color="#fff").pack(anchor="w", padx=16)
        ctk.CTkLabel(auto, text="Агенты работают · Директор одобряет 15 мин/день",
                     font=("Inter",11), text_color="#a78bfa").pack(anchor="w", padx=16, pady=(2,14))

        # Briefing
        brief_card = ctk.CTkFrame(scroll, fg_color=CARD, corner_radius=14,
                                   border_width=1, border_color=BORDER)
        brief_card.pack(fill="x", pady=(0,10))
        bhdr = ctk.CTkFrame(brief_card, fg_color="transparent")
        bhdr.pack(fill="x", padx=14, pady=(12,6))
        ctk.CTkLabel(bhdr, text="🤖 Брифинг дня", font=("Inter",12,"bold"),
                     text_color=TEXT).pack(side="left")
        self._brief_btn = ctk.CTkButton(bhdr, text="⚡ Запустить",
                                         font=("Inter",11,"bold"), height=30,
                                         fg_color=BORDER2, hover_color=ACCENT,
                                         text_color=TEXT2, corner_radius=8, width=100,
                                         command=self._run_briefing)
        self._brief_btn.pack(side="right")
        self._brief_txt = ctk.CTkTextbox(brief_card, height=100, fg_color=CARD2,
                                          text_color=TEXT2, font=("Inter",12),
                                          corner_radius=8, border_width=0)
        self._brief_txt.pack(fill="x", padx=14, pady=(0,14))
        self._brief_txt.insert("end", "Нажми «⚡ Запустить» — AI подготовит сводку дня...")
        self._brief_txt.configure(state="disabled")

        self.refresh()

    def refresh(self):
        leads = load_leads()
        clients = load_clients()
        fin = load_finance()
        income = sum(t.get("amount",0) for t in fin.income)
        expenses = sum(e.get("amount",0) for e in fin.expenses)
        profit = income - expenses
        pct = min(1.0, income / KPI_TARGET)

        self._kpi_labels["profit"].configure(text=f"${profit:,.0f}")
        self._kpi_labels["leads"].configure(text=str(len(leads)))
        self._kpi_labels["students"].configure(text=str(len(clients)))
        self._kpi_labels["clients"].configure(text=str(len(clients)))
        self._kpi_bar.set(pct)
        self._kpi_pct_lbl.configure(text=f"${income:,.0f} · {int(pct*100)}%",
                                     text_color=GREEN if pct>=1 else ACCENT2)

        for w in self._leads_frame.winfo_children():
            w.destroy()
        from core.models import STAGE_LABELS, STAGE_COLORS
        for stage, label in list(STAGE_LABELS.items())[:5]:
            count = sum(1 for l in leads if l.stage == stage)
            row = ctk.CTkFrame(self._leads_frame, fg_color="transparent")
            row.pack(fill="x", pady=2)
            ctk.CTkLabel(row, text=label, font=("Inter",11), text_color=TEXT2).pack(side="left")
            ctk.CTkLabel(row, text=str(count), font=("Inter",11,"bold"),
                         text_color=STAGE_COLORS.get(stage,TEXT2)).pack(side="right")

    def _run_briefing(self):
        self._brief_btn.configure(text="⏳", state="disabled")
        self._brief_txt.configure(state="normal")
        self._brief_txt.delete("1.0","end")
        self._brief_txt.insert("end","Генерирую брифинг...")
        self._brief_txt.configure(state="disabled")

        def _do():
            leads = load_leads()
            clients = load_clients()
            fin = load_finance()
            income = sum(t.get("amount",0) for t in fin.income)
            new_l = sum(1 for l in leads if l.stage=="new")
            result = run_agent("strategist", clients[0] if clients else None,
                extra=f"Всего лидов: {len(leads)} (новых: {new_l}), KPI: ${income}/${KPI_TARGET}, клиентов: {len(clients)}.")
            self.after(0, lambda: self._update_briefing(result))

        threading.Thread(target=_do, daemon=True).start()

    def _update_briefing(self, text: str):
        self._brief_txt.configure(state="normal")
        self._brief_txt.delete("1.0","end")
        self._brief_txt.insert("end", text)
        self._brief_txt.configure(state="disabled")
        self._brief_btn.configure(text="⚡ Запустить", state="normal")
