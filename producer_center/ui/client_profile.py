"""Producer Center — Client Profile with 8 tabs"""
import threading
import customtkinter as ctk
from config import *
from core.store import load_clients, update_client
from core.agents import run_agent
from core.models import JOURNEY, JOURNEY_ICONS, BMAP
from api.gemini import build_client_context


class ClientProfileScreen(ctk.CTkFrame):
    def __init__(self, master, app):
        super().__init__(master, fg_color=BG, corner_radius=0)
        self.app = app
        self.client = None
        self._build()

    def _build(self):
        # Header
        self._hdr = ctk.CTkFrame(self, fg_color=NAV, corner_radius=0, height=56)
        self._hdr.pack(fill="x")
        self._hdr.pack_propagate(False)
        ctk.CTkButton(self._hdr, text="← Назад", font=("Inter",12),
                      fg_color="transparent", hover_color=BORDER,
                      text_color=TEXT2, height=34, width=80,
                      command=lambda: self.app.show_screen("clients")).pack(side="left", padx=12, pady=11)
        self._name_lbl = ctk.CTkLabel(self._hdr, text="—", font=("Inter",16,"bold"), text_color=TEXT)
        self._name_lbl.pack(side="left", padx=4, pady=14)
        self._stage_lbl = ctk.CTkLabel(self._hdr, text="", font=("Inter",12),
                                        text_color=ACCENT2, fg_color=BORDER, corner_radius=8, padx=10)
        self._stage_lbl.pack(side="left", padx=8)

        # Tabs
        self._tabview = ctk.CTkTabview(self, fg_color=BG, segmented_button_fg_color=CARD,
                                        segmented_button_selected_color=ACCENT,
                                        segmented_button_unselected_color=CARD,
                                        text_color=TEXT2, text_color_disabled=TEXT3)
        self._tabview.pack(fill="both", expand=True, padx=0, pady=0)

        for tab in ["📊 Обзор","📍 Карта","🎯 Стратегия","📦 Продукты",
                     "📋 Контент","📈 Аналитика","💰 Финансы"]:
            self._tabview.add(tab)

        self._build_overview()
        self._build_roadmap()
        self._build_strategy()
        self._build_content()
        self._build_finance()

    def refresh(self):
        cid = self.app.get_active_client_id()
        if not cid:
            return
        self.client = None
        for c in load_clients():
            if c.id == cid:
                self.client = c
                break
        if not self.client:
            return
        s = self.client.stage
        self._name_lbl.configure(text=self.client.name)
        self._stage_lbl.configure(
            text=f"{JOURNEY_ICONS[s]} {JOURNEY[s]}" if s < len(JOURNEY) else "",
            fg_color=self.client.color+"33", text_color=self.client.color)
        self._refresh_overview()

    # ── OVERVIEW ─────────────────────────────────────────────
    def _build_overview(self):
        tab = self._tabview.tab("📊 Обзор")
        scroll = ctk.CTkScrollableFrame(tab, fg_color=BG)
        scroll.pack(fill="both", expand=True, padx=10, pady=8)
        self._ov_scroll = scroll

    def _refresh_overview(self):
        for w in self._ov_scroll.winfo_children():
            w.destroy()
        c = self.client
        m = (c.metrics or {}).get("instagram", {})

        # KPI row
        kpi_row = ctk.CTkFrame(self._ov_scroll, fg_color="transparent")
        kpi_row.pack(fill="x", pady=(0,10))
        for label, val, color in [
            ("Подписчики", f"{m.get('followers',0):,}", ACCENT2),
            ("Охват",      f"{m.get('reach',0):,}", CYAN),
            ("ER",         f"{m.get('er',0):.1f}%", GREEN),
            ("Лиды",       str(m.get('leads',0)), ORANGE),
        ]:
            tile = ctk.CTkFrame(kpi_row, fg_color=CARD, corner_radius=12,
                                border_width=1, border_color=BORDER)
            tile.pack(side="left", expand=True, fill="x", padx=(0,6))
            ctk.CTkLabel(tile, text=val, font=("Inter",18,"bold"), text_color=color).pack(pady=(10,2))
            ctk.CTkLabel(tile, text=label, font=("Inter",10), text_color=TEXT2).pack(pady=(0,10))

        # A → B
        ab = ctk.CTkFrame(self._ov_scroll, fg_color="transparent")
        ab.pack(fill="x", pady=(0,10))
        for lbl, val, col in [("● ТОЧКА А",f"${c.income:,.0f}/мес",RED),
                                ("→","→","#555"),
                                ("● ТОЧКА Б",f"${c.goal_inc:,.0f}/мес",GREEN)]:
            f = ctk.CTkFrame(ab, fg_color=CARD if lbl!="→" else "transparent",
                             corner_radius=10, border_width=1 if lbl!="→" else 0,
                             border_color=col if lbl!="→" else "transparent")
            f.pack(side="left", expand=lbl!="→", fill="x" if lbl!="→" else None, padx=4)
            ctk.CTkLabel(f, text=lbl, font=("Inter",10,"bold"), text_color=col).pack(pady=(8,0))
            ctk.CTkLabel(f, text=val, font=("Inter",14,"bold"), text_color=TEXT).pack(pady=(0,8))

        # Stage progress
        prog_card = ctk.CTkFrame(self._ov_scroll, fg_color=CARD, corner_radius=12,
                                  border_width=1, border_color=BORDER)
        prog_card.pack(fill="x", pady=(0,10))
        ph = ctk.CTkFrame(prog_card, fg_color="transparent")
        ph.pack(fill="x", padx=14, pady=(12,4))
        ctk.CTkLabel(ph, text=f"Этап {c.stage+1}/9: {JOURNEY[c.stage] if c.stage<len(JOURNEY) else '—'}",
                     font=("Inter",12,"bold"), text_color=TEXT).pack(side="left")
        ctk.CTkLabel(ph, text=f"{c.stage_pct}%", font=("Inter",13,"bold"),
                     text_color=c.color).pack(side="right")
        bar = ctk.CTkProgressBar(prog_card, progress_color=c.color, fg_color=CARD2,
                                  height=6, corner_radius=3)
        bar.set(c.stage_pct / 100)
        bar.pack(fill="x", padx=14, pady=(0,14))

        # Alerts
        for alert in (c.alerts or []):
            ctk.CTkLabel(self._ov_scroll, text=alert, font=("Inter",12),
                         text_color=RED, fg_color=RED+"15",
                         corner_radius=8, padx=12, pady=6).pack(fill="x", pady=2)

    # ── ROADMAP / BUSINESS MAP ────────────────────────────────
    def _build_roadmap(self):
        tab = self._tabview.tab("📍 Карта")
        scroll = ctk.CTkScrollableFrame(tab, fg_color=BG)
        scroll.pack(fill="both", expand=True, padx=10, pady=8)
        self._rm_scroll = scroll
        self._rm_built = False

    def _ensure_roadmap(self):
        if self._rm_built or not self.client:
            return
        self._rm_built = True
        c = self.client

        # Overall progress
        total_checks = sum(len(s["checks"]) for s in BMAP)
        done_checks = sum(
            1 for s in BMAP
            for i in range(len(s["checks"]))
            if c.checklist.get(f"{s['id']}__{i}", False)
        )
        overall = int(done_checks / total_checks * 100) if total_checks else 0

        ov_card = ctk.CTkFrame(self._rm_scroll, fg_color=CARD, corner_radius=12,
                                border_width=1, border_color=BORDER)
        ov_card.pack(fill="x", pady=(0,10))
        oh = ctk.CTkFrame(ov_card, fg_color="transparent")
        oh.pack(fill="x", padx=14, pady=(12,4))
        ctk.CTkLabel(oh, text="Общий прогресс чеклистов",
                     font=("Inter",12,"bold"), text_color=TEXT).pack(side="left")
        self._overall_lbl = ctk.CTkLabel(oh, text=f"{overall}%",
                                          font=("Inter",14,"bold"), text_color=GREEN if overall>=75 else ORANGE)
        self._overall_lbl.pack(side="right")
        self._overall_bar = ctk.CTkProgressBar(ov_card, progress_color=GREEN if overall>=75 else ORANGE,
                                                fg_color=CARD2, height=6)
        self._overall_bar.set(overall/100)
        self._overall_bar.pack(fill="x", padx=14, pady=(0,14))

        # Steps
        for step in BMAP:
            self._make_step_card(step, c)

    def _make_step_card(self, step, client):
        checks = step["checks"]
        done = [client.checklist.get(f"{step['id']}__{i}", False) for i in range(len(checks))]
        done_count = sum(done)
        pct = int(done_count / len(checks) * 100) if checks else 0
        color = step["color"]
        is_done = pct == 100

        card = ctk.CTkFrame(self._rm_scroll, fg_color=CARD, corner_radius=12,
                             border_width=1, border_color=GREEN+"50" if is_done else BORDER)
        card.pack(fill="x", pady=4)
        ctk.CTkFrame(card, height=3, fg_color=color, corner_radius=2).pack(fill="x")

        hdr = ctk.CTkFrame(card, fg_color="transparent")
        hdr.pack(fill="x", padx=12, pady=(8,4))
        ctk.CTkLabel(hdr, text=step["name"], font=("Inter",13,"bold"), text_color=TEXT).pack(side="left")
        status = "✅ Готово" if is_done else f"{pct}%"
        ctk.CTkLabel(hdr, text=status, font=("Inter",11,"bold"),
                     text_color=GREEN if is_done else color).pack(side="right")

        pbar = ctk.CTkProgressBar(card, progress_color=color, fg_color=CARD2, height=4)
        pbar.set(pct/100)
        pbar.pack(fill="x", padx=12, pady=(0,8))

        for i, (check, is_done_c) in enumerate(zip(checks, done)):
            row = ctk.CTkFrame(card, fg_color="transparent", cursor="hand2")
            row.pack(fill="x", padx=12, pady=2)
            cb = ctk.CTkCheckBox(row, text=check, font=("Inter",11),
                                  text_color=TEXT3 if is_done_c else TEXT2,
                                  fg_color=ACCENT, hover_color=ACCENT2,
                                  checkmark_color="#000",
                                  command=lambda sid=step["id"], idx=i: self._toggle_check(sid, idx))
            cb.pack(side="left")
            if is_done_c:
                cb.select()
        ctk.CTkFrame(card, height=8, fg_color="transparent").pack()

    def _toggle_check(self, step_id, idx):
        if not self.client:
            return
        key = f"{step_id}__{idx}"
        checklist = dict(self.client.checklist or {})
        checklist[key] = not checklist.get(key, False)
        update_client(self.client.id, {"checklist": checklist})
        self.client.checklist = checklist

    # ── STRATEGY ─────────────────────────────────────────────
    def _build_strategy(self):
        tab = self._tabview.tab("🎯 Стратегия")
        scroll = ctk.CTkScrollableFrame(tab, fg_color=BG)
        scroll.pack(fill="both", expand=True, padx=10, pady=8)

        for agent_key, label, color in [
            ("strategist",    "🎯 AI Стратегия", ACCENT),
            ("unpackager",    "🧠 Распаковка бренда", PINK),
            ("productologist","📦 Продуктовая линейка", CYAN),
        ]:
            self._make_agent_card(scroll, agent_key, label, color)

    def _build_content(self):
        tab = self._tabview.tab("📋 Контент")
        scroll = ctk.CTkScrollableFrame(tab, fg_color=BG)
        scroll.pack(fill="both", expand=True, padx=10, pady=8)

        for agent_key, label, color in [
            ("podcast_agent","🎙 15 вопросов для подкаста", ACCENT),
            ("copywriter",   "✍️ 3 текста для Reels", PINK),
            ("advertiser",   "📢 9 рекламных сценариев", ORANGE),
        ]:
            self._make_agent_card(scroll, agent_key, label, color)

    def _make_agent_card(self, parent, agent_key, label, color):
        card = ctk.CTkFrame(parent, fg_color=CARD, corner_radius=12,
                             border_width=1, border_color=BORDER)
        card.pack(fill="x", pady=5)
        ctk.CTkFrame(card, height=3, fg_color=color, corner_radius=2).pack(fill="x")

        hdr = ctk.CTkFrame(card, fg_color="transparent")
        hdr.pack(fill="x", padx=12, pady=(10,6))
        ctk.CTkLabel(hdr, text=label, font=("Inter",13,"bold"), text_color=TEXT).pack(side="left")
        btn = ctk.CTkButton(hdr, text="🤖 Создать", font=("Inter",11,"bold"),
                             fg_color=f"{color}30", hover_color=f"{color}60",
                             text_color=color, height=30, width=100, corner_radius=8)
        btn.pack(side="right")

        txt = ctk.CTkTextbox(card, height=140, fg_color=CARD2, text_color=TEXT2,
                              font=("Inter",11), corner_radius=8, border_width=0)
        txt.pack(fill="x", padx=12, pady=(0,12))
        txt.insert("end", "Нажми «🤖 Создать» для генерации...")
        txt.configure(state="disabled")

        def _run(b=btn, t=txt, k=agent_key):
            b.configure(text="⏳", state="disabled")
            t.configure(state="normal"); t.delete("1.0","end")
            t.insert("end","Генерирую..."); t.configure(state="disabled")
            def _do():
                result = run_agent(k, self.client)
                self.after(0, lambda r=result: _done(r, b, t))
            threading.Thread(target=_do, daemon=True).start()

        def _done(r, b, t):
            t.configure(state="normal"); t.delete("1.0","end")
            t.insert("end", r); t.configure(state="disabled")
            b.configure(text="🤖 Создать", state="normal")

        btn.configure(command=_run)

        actions = ctk.CTkFrame(card, fg_color="transparent")
        actions.pack(fill="x", padx=12, pady=(0,10))
        ctk.CTkButton(actions, text="📋 Копировать", font=("Inter",10),
                      fg_color="transparent", hover_color=BORDER2,
                      text_color=TEXT2, height=28, corner_radius=7,
                      command=lambda t=txt: self.clipboard_append(t.get("1.0","end"))).pack(side="left")

    # ── FINANCE ──────────────────────────────────────────────
    def _build_finance(self):
        tab = self._tabview.tab("💰 Финансы")
        scroll = ctk.CTkScrollableFrame(tab, fg_color=BG)
        scroll.pack(fill="both", expand=True, padx=10, pady=8)
        self._fin_scroll = scroll

    def _refresh_finance(self):
        for w in self._fin_scroll.winfo_children():
            w.destroy()
        c = self.client
        share = c.income * 0.3
        pct = min(1.0, c.income / c.goal_inc) if c.goal_inc > 0 else 0

        row = ctk.CTkFrame(self._fin_scroll, fg_color="transparent")
        row.pack(fill="x", pady=(0,10))
        for lbl, val, col in [("Доход клиента",f"${c.income:,.0f}",ACCENT2),
                                ("30% агентству",f"${share:,.0f}",GREEN),
                                ("Цель",f"${c.goal_inc:,.0f}",ORANGE)]:
            tile = ctk.CTkFrame(row, fg_color=CARD, corner_radius=12,
                                border_width=1, border_color=BORDER)
            tile.pack(side="left", expand=True, fill="x", padx=(0,6))
            ctk.CTkLabel(tile, text=val, font=("Inter",18,"bold"), text_color=col).pack(pady=(10,2))
            ctk.CTkLabel(tile, text=lbl, font=("Inter",10), text_color=TEXT2).pack(pady=(0,10))

        calc = ctk.CTkFrame(self._fin_scroll, fg_color=CARD, corner_radius=12,
                             border_width=1, border_color=BORDER)
        calc.pack(fill="x", pady=(0,10))
        ctk.CTkLabel(calc, text=f"${c.income:,.0f} × 30% = ${share:,.0f}/мес",
                     font=("Inter",13,"bold"), text_color=TEXT).pack(padx=14, pady=(12,4), anchor="w")
        pb = ctk.CTkProgressBar(calc, progress_color=GREEN, fg_color=CARD2, height=6)
        pb.set(pct)
        pb.pack(fill="x", padx=14, pady=(0,14))

        # Transactions
        ctk.CTkLabel(self._fin_scroll, text="История платежей",
                     font=("Inter",12,"bold"), text_color=TEXT).pack(anchor="w", pady=(6,4))
        for t in (c.transactions or []):
            row2 = ctk.CTkFrame(self._fin_scroll, fg_color=CARD, corner_radius=8)
            row2.pack(fill="x", pady=2)
            ctk.CTkLabel(row2, text=t.get("desc","—"), font=("Inter",12),
                         text_color=TEXT2).pack(side="left", padx=12, pady=8)
            ctk.CTkLabel(row2, text=f"+${t.get('amount',0):,.0f}",
                         font=("Inter",12,"bold"), text_color=GREEN).pack(side="right", padx=12)

    def _tabview_tab_changed(self):
        if not self.client:
            return
        current = self._tabview.get()
        if current == "📍 Карта":
            self._ensure_roadmap()
        elif current == "💰 Финансы":
            self._refresh_finance()
