"""Producer Center — Client Profile (fixed)"""
import threading
import customtkinter as ctk
from config import *
from core.store import load_clients, update_client
from core.agents import run_agent
from core.models import JOURNEY, JOURNEY_ICONS, BMAP
from api.gemini import build_client_context, call_gemini


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
        ctk.CTkButton(
            self._hdr, text="← Назад", font=("Inter",12),
            fg_color="transparent", hover_color=BORDER,
            text_color=TEXT2, height=34, width=80,
            command=lambda: self.app.show_screen("clients")
        ).pack(side="left", padx=12, pady=11)
        self._name_lbl = ctk.CTkLabel(
            self._hdr, text="—", font=("Inter",16,"bold"), text_color=TEXT)
        self._name_lbl.pack(side="left", padx=4)
        self._stage_lbl = ctk.CTkLabel(
            self._hdr, text="", font=("Inter",11),
            text_color=ACCENT2, fg_color=BORDER, corner_radius=8, padx=10)
        self._stage_lbl.pack(side="left", padx=8)

        # Tabview with command callback
        self._tabview = ctk.CTkTabview(
            self, fg_color=BG,
            segmented_button_fg_color=CARD,
            segmented_button_selected_color=ACCENT,
            segmented_button_unselected_color=CARD,
            text_color=TEXT2,
            command=self._on_tab_change
        )
        self._tabview.pack(fill="both", expand=True)

        TABS = ["📊 Обзор","📍 Карта","🎯 Стратегия","📋 Контент","📢 Реклама","💰 Финансы"]
        for tab in TABS:
            self._tabview.add(tab)

        self._tab_built = set()
        self._build_all_tabs()

    # ── build all tab contents ────────────────────────────────
    def _build_all_tabs(self):
        self._build_overview_tab()
        self._build_roadmap_tab()
        self._build_strategy_tab()
        self._build_content_tab()
        self._build_ads_tab()
        self._build_finance_tab()

    def _on_tab_change(self):
        """Called when user clicks a tab"""
        if not self.client:
            return
        tab = self._tabview.get()
        if tab == "📊 Обзор":
            self._refresh_overview()
        elif tab == "📍 Карта":
            self._refresh_roadmap()
        elif tab == "💰 Финансы":
            self._refresh_finance()

    def refresh(self):
        """Load client data and refresh current tab"""
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
        if s < len(JOURNEY):
            self._stage_lbl.configure(
                text=f"{JOURNEY_ICONS[s]} {JOURNEY[s]}",
                fg_color=self.client.color+"33",
                text_color=self.client.color)
        self._tabview.set("📊 Обзор")
        self._refresh_overview()

    # ── OVERVIEW TAB ─────────────────────────────────────────
    def _build_overview_tab(self):
        tab = self._tabview.tab("📊 Обзор")
        self._ov_scroll = ctk.CTkScrollableFrame(tab, fg_color=BG)
        self._ov_scroll.pack(fill="both", expand=True, padx=8, pady=8)

    def _refresh_overview(self):
        for w in self._ov_scroll.winfo_children():
            w.destroy()
        if not self.client:
            return
        c = self.client
        m = (c.metrics or {}).get("instagram", {})

        # KPI tiles
        row = ctk.CTkFrame(self._ov_scroll, fg_color="transparent")
        row.pack(fill="x", pady=(0,10))
        for label, val, color in [
            ("Подписчики", f"{m.get('followers',0):,}", ACCENT2),
            ("Охват",      f"{m.get('reach',0):,}",     CYAN),
            ("ER",         f"{m.get('er',0):.1f}%",     GREEN),
            ("Лиды",       str(m.get('leads',0)),        ORANGE),
        ]:
            tile = ctk.CTkFrame(row, fg_color=CARD, corner_radius=12,
                                border_width=1, border_color=BORDER)
            tile.pack(side="left", expand=True, fill="x", padx=(0,6))
            ctk.CTkLabel(tile, text=val, font=("Inter",18,"bold"), text_color=color).pack(pady=(10,2))
            ctk.CTkLabel(tile, text=label, font=("Inter",10), text_color=TEXT2).pack(pady=(0,10))

        # A → B
        ab = ctk.CTkFrame(self._ov_scroll, fg_color="transparent")
        ab.pack(fill="x", pady=(0,10))
        for lbl, val, col, expand in [
            ("● ТОЧКА А", f"${c.income:,.0f}/мес", RED, True),
            ("→", "→", TEXT3, False),
            ("● ТОЧКА Б", f"${c.goal_inc:,.0f}/мес", GREEN, True),
        ]:
            f = ctk.CTkFrame(ab,
                fg_color=CARD if expand else "transparent",
                corner_radius=10,
                border_width=1 if expand else 0,
                border_color=col if expand else "transparent")
            f.pack(side="left", expand=expand, fill="x" if expand else None, padx=4)
            ctk.CTkLabel(f, text=lbl, font=("Inter",10,"bold"), text_color=col).pack(pady=(8,0))
            ctk.CTkLabel(f, text=val, font=("Inter",14,"bold"), text_color=TEXT).pack(pady=(0,8))

        # Stage progress
        prog = ctk.CTkFrame(self._ov_scroll, fg_color=CARD, corner_radius=12,
                             border_width=1, border_color=BORDER)
        prog.pack(fill="x", pady=(0,10))
        ph = ctk.CTkFrame(prog, fg_color="transparent")
        ph.pack(fill="x", padx=14, pady=(12,4))
        stage_name = JOURNEY[c.stage] if c.stage < len(JOURNEY) else "—"
        ctk.CTkLabel(ph, text=f"Этап {c.stage+1}/9: {stage_name}",
                     font=("Inter",12,"bold"), text_color=TEXT).pack(side="left")
        ctk.CTkLabel(ph, text=f"{c.stage_pct}%",
                     font=("Inter",13,"bold"), text_color=c.color).pack(side="right")
        bar = ctk.CTkProgressBar(prog, progress_color=c.color, fg_color=CARD2, height=6)
        bar.set(c.stage_pct / 100)
        bar.pack(fill="x", padx=14, pady=(0,14))

        # Alerts
        for alert in (c.alerts or []):
            ctk.CTkLabel(self._ov_scroll, text=alert, font=("Inter",12),
                         text_color=RED, fg_color=RED+"15",
                         corner_radius=8, padx=12, pady=6).pack(fill="x", pady=2)

        # Goals
        if c.goals:
            g = ctk.CTkFrame(self._ov_scroll, fg_color=CARD, corner_radius=12,
                              border_width=1, border_color=BORDER)
            g.pack(fill="x", pady=(0,10))
            ctk.CTkLabel(g, text="🎯 Цели", font=("Inter",12,"bold"),
                         text_color=TEXT).pack(anchor="w", padx=14, pady=(10,4))
            ctk.CTkLabel(g, text=c.goals, font=("Inter",11), text_color=TEXT2,
                         wraplength=500, justify="left").pack(anchor="w", padx=14, pady=(0,12))

    # ── ROADMAP TAB ───────────────────────────────────────────
    def _build_roadmap_tab(self):
        tab = self._tabview.tab("📍 Карта")
        self._rm_scroll = ctk.CTkScrollableFrame(tab, fg_color=BG)
        self._rm_scroll.pack(fill="both", expand=True, padx=8, pady=8)

    def _refresh_roadmap(self):
        for w in self._rm_scroll.winfo_children():
            w.destroy()
        if not self.client:
            return
        c = self.client

        total = sum(len(s["checks"]) for s in BMAP)
        done  = sum(1 for s in BMAP for i in range(len(s["checks"]))
                    if c.checklist.get(f"{s['id']}__{i}", False))
        overall = int(done / total * 100) if total else 0

        # Overall bar
        ov = ctk.CTkFrame(self._rm_scroll, fg_color=CARD, corner_radius=12,
                           border_width=1, border_color=BORDER)
        ov.pack(fill="x", pady=(0,10))
        oh = ctk.CTkFrame(ov, fg_color="transparent")
        oh.pack(fill="x", padx=14, pady=(12,4))
        ctk.CTkLabel(oh, text="Общий прогресс",
                     font=("Inter",12,"bold"), text_color=TEXT).pack(side="left")
        ctk.CTkLabel(oh, text=f"{overall}%",
                     font=("Inter",14,"bold"),
                     text_color=GREEN if overall>=75 else ORANGE).pack(side="right")
        pb = ctk.CTkProgressBar(ov, progress_color=GREEN if overall>=75 else ORANGE,
                                 fg_color=CARD2, height=6)
        pb.set(overall / 100)
        pb.pack(fill="x", padx=14, pady=(0,14))

        for step in BMAP:
            self._make_step_card(step)

    def _make_step_card(self, step):
        c = self.client
        checks = step["checks"]
        done_list = [c.checklist.get(f"{step['id']}__{i}", False) for i in range(len(checks))]
        done_count = sum(done_list)
        pct = int(done_count / len(checks) * 100) if checks else 0
        color = step["color"]
        is_done = pct == 100

        card = ctk.CTkFrame(self._rm_scroll, fg_color=CARD, corner_radius=12,
                             border_width=1,
                             border_color=GREEN+"50" if is_done else BORDER)
        card.pack(fill="x", pady=4)
        ctk.CTkFrame(card, height=3, fg_color=color, corner_radius=2).pack(fill="x")

        hdr = ctk.CTkFrame(card, fg_color="transparent")
        hdr.pack(fill="x", padx=12, pady=(8,4))
        ctk.CTkLabel(hdr, text=step["name"], font=("Inter",13,"bold"),
                     text_color=TEXT).pack(side="left")
        ctk.CTkLabel(hdr,
                     text="✅ Готово" if is_done else f"{pct}%",
                     font=("Inter",11,"bold"),
                     text_color=GREEN if is_done else color).pack(side="right")

        pb = ctk.CTkProgressBar(card, progress_color=color, fg_color=CARD2, height=4)
        pb.set(pct / 100)
        pb.pack(fill="x", padx=12, pady=(0,8))

        for i, (check, checked) in enumerate(zip(checks, done_list)):
            row = ctk.CTkFrame(card, fg_color="transparent")
            row.pack(fill="x", padx=12, pady=2)
            cb = ctk.CTkCheckBox(
                row, text=check, font=("Inter",11),
                text_color=TEXT3 if checked else TEXT2,
                fg_color=ACCENT, hover_color=ACCENT2,
                checkmark_color="#000",
                command=lambda sid=step["id"], idx=i: self._toggle(sid, idx)
            )
            cb.pack(side="left")
            if checked:
                cb.select()
        ctk.CTkFrame(card, height=6, fg_color="transparent").pack()

    def _toggle(self, step_id, idx):
        if not self.client:
            return
        key = f"{step_id}__{idx}"
        cl = dict(self.client.checklist or {})
        cl[key] = not cl.get(key, False)
        update_client(self.client.id, {"checklist": cl})
        self.client.checklist = cl
        self._refresh_roadmap()

    # ── STRATEGY TAB ─────────────────────────────────────────
    def _build_strategy_tab(self):
        tab = self._tabview.tab("🎯 Стратегия")
        scroll = ctk.CTkScrollableFrame(tab, fg_color=BG)
        scroll.pack(fill="both", expand=True, padx=8, pady=8)
        for key, label, color in [
            ("strategist",    "🎯 AI Стратегия на 3 месяца", ACCENT),
            ("unpackager",    "🧠 Распаковка бренда", PINK),
            ("productologist","📦 Продуктовая линейка 4 уровней", CYAN),
            ("funneler",      "🌀 Схема воронки продаж", GREEN),
        ]:
            self._agent_card(scroll, key, label, color)

    # ── CONTENT TAB ──────────────────────────────────────────
    def _build_content_tab(self):
        tab = self._tabview.tab("📋 Контент")
        scroll = ctk.CTkScrollableFrame(tab, fg_color=BG)
        scroll.pack(fill="both", expand=True, padx=8, pady=8)
        for key, label, color in [
            ("podcast_agent", "🎙 15 вопросов для подкаста", ACCENT),
            ("copywriter",    "✍️ 3 текста для Reels", PINK),
            ("planner",       "📅 Контент-план на неделю", ORANGE),
            ("video_producer","🎬 5 сценариев коротких видео", CYAN),
        ]:
            self._agent_card(scroll, key, label, color)

    # ── ADS TAB ──────────────────────────────────────────────
    def _build_ads_tab(self):
        tab = self._tabview.tab("📢 Реклама")
        scroll = ctk.CTkScrollableFrame(tab, fg_color=BG)
        scroll.pack(fill="both", expand=True, padx=8, pady=8)
        for key, label, color in [
            ("advertiser", "📢 9 рекламных сценариев (3×3)", ORANGE),
            ("analyst",    "📊 Анализ метрик и рекомендации", ACCENT2),
        ]:
            self._agent_card(scroll, key, label, color)

    # ── FINANCE TAB ──────────────────────────────────────────
    def _build_finance_tab(self):
        tab = self._tabview.tab("💰 Финансы")
        self._fin_scroll = ctk.CTkScrollableFrame(tab, fg_color=BG)
        self._fin_scroll.pack(fill="both", expand=True, padx=8, pady=8)

    def _refresh_finance(self):
        for w in self._fin_scroll.winfo_children():
            w.destroy()
        if not self.client:
            return
        c = self.client
        share = c.income * 0.3
        pct = min(1.0, c.income / c.goal_inc) if c.goal_inc > 0 else 0

        row = ctk.CTkFrame(self._fin_scroll, fg_color="transparent")
        row.pack(fill="x", pady=(0,10))
        for lbl, val, col in [
            ("Доход клиента", f"${c.income:,.0f}", ACCENT2),
            ("30% агентству", f"${share:,.0f}",    GREEN),
            ("Цель",          f"${c.goal_inc:,.0f}", ORANGE),
        ]:
            tile = ctk.CTkFrame(row, fg_color=CARD, corner_radius=12,
                                border_width=1, border_color=BORDER)
            tile.pack(side="left", expand=True, fill="x", padx=(0,6))
            ctk.CTkLabel(tile, text=val, font=("Inter",18,"bold"), text_color=col).pack(pady=(10,2))
            ctk.CTkLabel(tile, text=lbl, font=("Inter",10), text_color=TEXT2).pack(pady=(0,10))

        calc = ctk.CTkFrame(self._fin_scroll, fg_color=CARD, corner_radius=12,
                             border_width=1, border_color=BORDER)
        calc.pack(fill="x", pady=(0,10))
        ctk.CTkLabel(calc,
                     text=f"${c.income:,.0f} × 30% = ${share:,.0f}/мес",
                     font=("Inter",13,"bold"), text_color=TEXT).pack(padx=14, pady=(12,4), anchor="w")
        pb = ctk.CTkProgressBar(calc, progress_color=GREEN, fg_color=CARD2, height=6)
        pb.set(pct)
        pb.pack(fill="x", padx=14, pady=(0,14))

        # Form: update income
        form = ctk.CTkFrame(self._fin_scroll, fg_color=CARD, corner_radius=12,
                             border_width=1, border_color=BORDER)
        form.pack(fill="x", pady=(0,10))
        ctk.CTkLabel(form, text="Обновить доход клиента",
                     font=("Inter",12,"bold"), text_color=TEXT).pack(anchor="w", padx=14, pady=(12,6))
        inp_row = ctk.CTkFrame(form, fg_color="transparent")
        inp_row.pack(fill="x", padx=14, pady=(0,12))
        entry = ctk.CTkEntry(inp_row, placeholder_text="Новый доход $",
                              height=36, fg_color=CARD2, border_color=BORDER2,
                              text_color=TEXT, width=200)
        entry.pack(side="left", padx=(0,8))
        def _update_income():
            try:
                val = float(entry.get().strip())
                update_client(c.id, {"income": val})
                self.client.income = val
                self._refresh_finance()
            except Exception:
                pass
        ctk.CTkButton(inp_row, text="💾 Сохранить", fg_color=ACCENT,
                      hover_color="#4e5adf", height=36, corner_radius=8,
                      command=_update_income).pack(side="left")

        # Transactions
        if c.transactions:
            ctk.CTkLabel(self._fin_scroll, text="История платежей",
                         font=("Inter",12,"bold"), text_color=TEXT).pack(anchor="w", pady=(6,4))
            for t in c.transactions:
                r = ctk.CTkFrame(self._fin_scroll, fg_color=CARD, corner_radius=8)
                r.pack(fill="x", pady=2)
                ctk.CTkLabel(r, text=t.get("desc","—"), font=("Inter",12),
                             text_color=TEXT2).pack(side="left", padx=12, pady=8)
                ctk.CTkLabel(r, text=f"+${t.get('amount',0):,.0f}",
                             font=("Inter",12,"bold"), text_color=GREEN).pack(side="right", padx=12)

    # ── AGENT CARD (reusable) ─────────────────────────────────
    def _agent_card(self, parent, agent_key, label, color):
        card = ctk.CTkFrame(parent, fg_color=CARD, corner_radius=12,
                             border_width=1, border_color=BORDER)
        card.pack(fill="x", pady=5)
        ctk.CTkFrame(card, height=3, fg_color=color, corner_radius=2).pack(fill="x")

        hdr = ctk.CTkFrame(card, fg_color="transparent")
        hdr.pack(fill="x", padx=12, pady=(10,6))
        ctk.CTkLabel(hdr, text=label, font=("Inter",13,"bold"),
                     text_color=TEXT).pack(side="left")

        btn = ctk.CTkButton(
            hdr, text="🤖 Создать",
            font=("Inter",11,"bold"),
            fg_color=color+"44", hover_color=color+"88",
            text_color=TEXT, height=30, width=110, corner_radius=8
        )
        btn.pack(side="right")

        txt = ctk.CTkTextbox(card, height=160, fg_color=CARD2,
                              text_color=TEXT2, font=("Inter",11),
                              corner_radius=8, border_width=0)
        txt.pack(fill="x", padx=12, pady=(0,6))
        txt.insert("end", "Нажми «🤖 Создать» — AI сгенерирует результат...")
        txt.configure(state="disabled")

        # Copy button
        actions = ctk.CTkFrame(card, fg_color="transparent")
        actions.pack(fill="x", padx=12, pady=(0,10))
        ctk.CTkButton(
            actions, text="📋 Копировать",
            font=("Inter",10), height=28,
            fg_color="transparent", hover_color=BORDER2,
            text_color=TEXT2, corner_radius=7,
            command=lambda t=txt: self.clipboard_append(t.get("1.0","end"))
        ).pack(side="left")

        def _run(b=btn, t=txt, k=agent_key):
            if not self.client:
                t.configure(state="normal")
                t.delete("1.0","end")
                t.insert("end","⚠️ Сначала открой профиль клиента")
                t.configure(state="disabled")
                return
            b.configure(text="⏳", state="disabled")
            t.configure(state="normal")
            t.delete("1.0","end")
            t.insert("end","Генерирую...")
            t.configure(state="disabled")

            client_snapshot = self.client
            def _do():
                result = run_agent(k, client_snapshot)
                self.after(0, lambda r=result, bt=b, tx=t: _done(r, bt, tx))

            threading.Thread(target=_do, daemon=True).start()

        def _done(r, b, t):
            t.configure(state="normal")
            t.delete("1.0","end")
            t.insert("end", r)
            t.configure(state="disabled")
            b.configure(text="🤖 Создать", state="normal")

        btn.configure(command=_run)
