"""
NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
Copyright (c) 2026 AMAImedia.com
All rights reserved.
producer_center/ui/agents.py — AI Agents Dashboard
"""
import threading
import customtkinter as ctk
from config import (BG, NAV, CARD, CARD2, BORDER, BORDER2,
                    ACCENT, ACCENT2, GREEN, ORANGE, RED, CYAN, TEXT, TEXT2, TEXT3)


AGENT_CONFIGS = [
    {
        "key":   "lead_finder",
        "name":  "🔍 Агент поиска лидов",
        "desc":  "Telegram парсер — ищет лидов по ключевым словам",
        "stats": {"Лидов сегодня": "0", "Лимит": "50/день", "Источник": "Telegram"},
        "color": CYAN,
    },
    {
        "key":   "warmer",
        "name":  "🔥 Агент прогрева",
        "desc":  "7-дневная цепочка в Telegram боте (SendPulse)",
        "stats": {"Цепочек активно": "0", "Конверсия": "0%", "Кодовых слов": "0"},
        "color": ORANGE,
    },
    {
        "key":   "content",
        "name":  "🎬 Агент контента",
        "desc":  "Публикует клипы по расписанию каждые 2 дня",
        "stats": {"Следующая публикация": "—", "В очереди": "0", "Опубликовано": "0"},
        "color": ACCENT,
    },
    {
        "key":   "sales",
        "name":  "💰 Агент продаж",
        "desc":  "AI скоринг лидов и генерация КП за 30 сек",
        "stats": {"КП за месяц": "0", "Конверсия": "0%", "Созвонов": "0"},
        "color": GREEN,
    },
    {
        "key":   "analytics",
        "name":  "📊 Агент аналитики",
        "desc":  "Ежедневный брифинг 09:00 + недельный отчёт в пн",
        "stats": {"Последний отчёт": "—", "Следующий": "Пн 08:00", "Метрик": "12"},
        "color": ACCENT2,
    },
    {
        "key":   "kp",
        "name":  "📄 Агент КП",
        "desc":  "Генерирует персональное КП за 30 секунд по шаблону AMAI",
        "stats": {"КП за месяц": "0", "Среднее время": "~28 сек", "Отправлено": "0"},
        "color": "#f97316",
    },
]


class AgentsScreen(ctk.CTkFrame):
    def __init__(self, master, app):
        super().__init__(master, fg_color=BG, corner_radius=0)
        self.app = app
        self._states: dict[str, bool] = {a["key"]: False for a in AGENT_CONFIGS}
        self._cards: dict[str, dict] = {}
        self._build()

    # ── layout ────────────────────────────────────────────────────────────────

    def _build(self):
        # Header
        hdr = ctk.CTkFrame(self, fg_color=NAV, corner_radius=0, height=56)
        hdr.pack(fill="x")
        hdr.pack_propagate(False)
        ctk.CTkLabel(hdr, text="🤖 AI Агенты — Дашборд автоматизации",
                     font=("Inter", 18, "bold"), text_color=TEXT).pack(side="left", padx=20, pady=14)

        # Stats bar
        stats_bar = ctk.CTkFrame(self, fg_color=CARD, corner_radius=0, height=48)
        stats_bar.pack(fill="x")
        stats_bar.pack_propagate(False)
        for label, value in [("Агентов активно", "0/6"), ("Лидов сегодня", "0"), ("КП за месяц", "0"), ("Следующее действие", "Пн 08:00")]:
            f = ctk.CTkFrame(stats_bar, fg_color="transparent")
            f.pack(side="left", padx=24, pady=8)
            ctk.CTkLabel(f, text=value, font=("Inter", 16, "bold"), text_color=ACCENT2).pack()
            ctk.CTkLabel(f, text=label, font=("Inter", 9), text_color=TEXT3).pack()

        # Agents grid
        scroll = ctk.CTkScrollableFrame(self, fg_color=BG, corner_radius=0)
        scroll.pack(fill="both", expand=True, padx=16, pady=12)

        cols = 2
        for i, agent in enumerate(AGENT_CONFIGS):
            row, col = divmod(i, cols)
            frame = ctk.CTkFrame(scroll, fg_color="transparent")
            frame.grid(row=row, column=col, padx=6, pady=6, sticky="ew")
            scroll.columnconfigure(col, weight=1)
            self._make_agent_card(frame, agent)

    def _make_agent_card(self, parent: ctk.CTkFrame, agent: dict):
        key = agent["key"]
        card = ctk.CTkFrame(parent, fg_color=CARD, corner_radius=14,
                             border_width=1, border_color=BORDER)
        card.pack(fill="x")

        # Top accent bar
        ctk.CTkFrame(card, height=3, fg_color=agent["color"], corner_radius=2).pack(fill="x")

        body = ctk.CTkFrame(card, fg_color="transparent")
        body.pack(fill="x", padx=14, pady=(10, 12))

        # Title row
        title_row = ctk.CTkFrame(body, fg_color="transparent")
        title_row.pack(fill="x")
        ctk.CTkLabel(title_row, text=agent["name"],
                     font=("Inter", 13, "bold"), text_color=TEXT).pack(side="left")

        # Toggle switch
        state_var = ctk.BooleanVar(value=False)
        switch = ctk.CTkSwitch(
            title_row, text="", variable=state_var,
            onvalue=True, offvalue=False, width=44, height=22,
            button_color=agent["color"], progress_color=agent["color"] + "44",
            command=lambda k=key, v=state_var: self._toggle(k, v)
        )
        switch.pack(side="right")

        # Status label
        status_lbl = ctk.CTkLabel(body, text="● ВЫКЛЮЧЕН",
                                   font=("Inter", 10), text_color=TEXT3)
        status_lbl.pack(anchor="w", pady=(2, 0))

        # Description
        ctk.CTkLabel(body, text=agent["desc"],
                     font=("Inter", 11), text_color=TEXT2,
                     wraplength=280, justify="left").pack(anchor="w", pady=(4, 8))

        # Stats
        for stat_key, stat_val in agent["stats"].items():
            row = ctk.CTkFrame(body, fg_color=CARD2, corner_radius=6)
            row.pack(fill="x", pady=2)
            ctk.CTkLabel(row, text=stat_key, font=("Inter", 10), text_color=TEXT2).pack(side="left", padx=8, pady=4)
            val_lbl = ctk.CTkLabel(row, text=stat_val, font=("Inter", 10, "bold"), text_color=TEXT)
            val_lbl.pack(side="right", padx=8)

        # Action button
        ctk.CTkButton(body, text="⚡ Запустить сейчас",
                       font=("Inter", 11, "bold"), height=30, corner_radius=8,
                       fg_color=agent["color"] + "22", hover_color=agent["color"] + "44",
                       text_color=agent["color"], border_width=1, border_color=agent["color"] + "66",
                       command=lambda k=key, n=agent["name"]: self._run_now(k, n)).pack(fill="x", pady=(6, 0))

        self._cards[key] = {"status_lbl": status_lbl, "state_var": state_var}

    # ── actions ───────────────────────────────────────────────────────────────

    def _toggle(self, key: str, var: ctk.BooleanVar):
        is_on = var.get()
        self._states[key] = is_on
        card = self._cards.get(key)
        if card:
            lbl = card["status_lbl"]
            if is_on:
                lbl.configure(text="● РАБОТАЕТ", text_color=GREEN)
            else:
                lbl.configure(text="● ВЫКЛЮЧЕН", text_color=TEXT3)

    def _run_now(self, key: str, name: str):
        from tkinter import messagebox
        msgs = {
            "lead_finder": "Запускаю парсер Telegram...\n\nПоиск по ключевым словам: 'ищу продюсера', 'нужен smm', 'хочу клиентов'\nЛимит: 50 сообщений\n\nРезультат появится в CRM через 2-3 минуты.",
            "warmer":      "Проверяю активные прогрев-цепочки в SendPulse...\n\nАктивных цепочек: 0\nЗапустить новую можно после добавления лида в CRM.",
            "content":     "Проверяю очередь контента...\n\nСледующий клип: content_queue.json\nЗапустите n8n воркфлоу 08 для автопубликации.",
            "sales":       "Агент продаж готов к работе.\n\nДля генерации КП: отправьте POST на\n/webhook/generate-kp\nс данными клиента из CRM.",
            "analytics":   "Следующий брифинг: сегодня 09:00\nНедельная стратегия: в понедельник 08:00\n\nУбедитесь, что n8n воркфлоу 10 активен.",
            "kp":          "Агент КП активен.\n\nДля генерации КП после созвона:\n1. Откройте раздел 'Созвоны'\n2. Нажмите 'Генерировать КП'\n\nGemini создаст КП за ~28 секунд.",
        }
        messagebox.showinfo(name, msgs.get(key, "Агент запущен."))
