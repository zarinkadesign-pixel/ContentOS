"""
NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
Copyright (c) 2026 AMAImedia.com
All rights reserved.
producer_center/ui/calls.py — Calls / Созвоны screen
"""
import threading
import time
import customtkinter as ctk
from config import (BG, NAV, CARD, CARD2, BORDER, BORDER2,
                    ACCENT, ACCENT2, GREEN, ORANGE, RED, CYAN, PURPLE, TEXT, TEXT2, TEXT3)
from api.gemini import call_gemini


DEMO_CALLS = [
    {"id": 1, "name": "Анна Ковалёва", "niche": "Психология", "score": 87, "date": "2026-04-05", "time": "14:00", "status": "upcoming", "contact": "@anna_psych", "notes": "Запросила разбор аккаунта, бюджет обсуждается"},
    {"id": 2, "name": "Максим Орлов", "niche": "Фитнес", "score": 72, "date": "2026-04-06", "time": "11:00", "status": "upcoming", "contact": "@max_fit", "notes": "Хочет выйти на $3000/мес, сейчас $800"},
    {"id": 3, "name": "Диана Ли", "niche": "Дизайн", "score": 91, "date": "2026-04-03", "time": "16:00", "status": "done", "contact": "@diana_design", "notes": "Созвон прошёл, КП отправлено"},
]


class CallsScreen(ctk.CTkFrame):
    def __init__(self, master, app):
        super().__init__(master, fg_color=BG, corner_radius=0)
        self.app = app
        self._calls = list(DEMO_CALLS)
        self._selected: dict | None = None
        self._detail_panel: ctk.CTkFrame | None = None
        self._build()

    # ── layout ────────────────────────────────────────────────────────────────

    def _build(self):
        hdr = ctk.CTkFrame(self, fg_color=NAV, corner_radius=0, height=56)
        hdr.pack(fill="x")
        hdr.pack_propagate(False)
        ctk.CTkLabel(hdr, text="📞 Созвоны — Подготовка и КП",
                     font=("Inter", 18, "bold"), text_color=TEXT).pack(side="left", padx=20, pady=14)
        ctk.CTkButton(hdr, text="+ Добавить созвон", font=("Inter", 12, "bold"),
                       fg_color=ACCENT, hover_color="#4e5adf", corner_radius=10, height=34,
                       command=self._add_call_dialog).pack(side="right", padx=16, pady=11)

        main = ctk.CTkFrame(self, fg_color=BG, corner_radius=0)
        main.pack(fill="both", expand=True)

        # Left — calls list
        left = ctk.CTkFrame(main, fg_color="transparent", width=340)
        left.pack(side="left", fill="y", padx=(12, 4), pady=12)
        left.pack_propagate(False)

        ctk.CTkLabel(left, text="Предстоящие созвоны",
                     font=("Inter", 12, "bold"), text_color=TEXT2).pack(anchor="w", pady=(0, 6))

        self._list_frame = ctk.CTkScrollableFrame(left, fg_color="transparent")
        self._list_frame.pack(fill="both", expand=True)

        # Right — detail panel
        self._right = ctk.CTkFrame(main, fg_color=CARD, corner_radius=14,
                                    border_width=1, border_color=BORDER)
        self._right.pack(side="left", fill="both", expand=True, padx=(4, 12), pady=12)

        self._show_empty_state()
        self._render_list()

    def _show_empty_state(self):
        for w in self._right.winfo_children():
            w.destroy()
        ctk.CTkLabel(self._right,
                     text="📞\n\nВыберите созвон\nчтобы подготовиться",
                     font=("Inter", 14), text_color=TEXT3,
                     justify="center").pack(expand=True)

    def _render_list(self):
        for w in self._list_frame.winfo_children():
            w.destroy()

        upcoming = [c for c in self._calls if c["status"] == "upcoming"]
        done = [c for c in self._calls if c["status"] == "done"]

        for group_label, items in [("Предстоящие", upcoming), ("Завершённые", done)]:
            if not items:
                continue
            ctk.CTkLabel(self._list_frame, text=group_label,
                         font=("Inter", 10, "bold"), text_color=TEXT3).pack(anchor="w", pady=(8, 2))
            for call in sorted(items, key=lambda x: x.get("date", "")):
                self._make_call_row(call)

    def _make_call_row(self, call: dict):
        score = call.get("score", 0)
        score_color = GREEN if score >= 85 else (ORANGE if score >= 70 else RED)

        row = ctk.CTkFrame(self._list_frame, fg_color=CARD, corner_radius=10,
                            border_width=1, border_color=BORDER,
                            cursor="hand2")
        row.pack(fill="x", pady=3)

        body = ctk.CTkFrame(row, fg_color="transparent")
        body.pack(fill="x", padx=12, pady=8)

        # Score badge
        badge = ctk.CTkLabel(body, text=str(score),
                              font=("Inter", 11, "bold"), text_color="#000",
                              fg_color=score_color, width=32, height=20, corner_radius=10)
        badge.pack(side="left", padx=(0, 8))

        info = ctk.CTkFrame(body, fg_color="transparent")
        info.pack(side="left", fill="x", expand=True)

        ctk.CTkLabel(info, text=call["name"],
                     font=("Inter", 12, "bold"), text_color=TEXT, anchor="w").pack(fill="x")
        ctk.CTkLabel(info, text=f"{call['niche']} · {call['date']} {call.get('time','—')}",
                     font=("Inter", 10), text_color=TEXT2, anchor="w").pack(fill="x")

        status_icon = "✅" if call["status"] == "done" else "📅"
        ctk.CTkLabel(body, text=status_icon, font=("Inter", 14)).pack(side="right")

        row.bind("<Button-1>", lambda e, c=call: self._select_call(c))
        for child in row.winfo_children():
            child.bind("<Button-1>", lambda e, c=call: self._select_call(c))

    def _select_call(self, call: dict):
        self._selected = call
        self._show_detail(call)

    def _show_detail(self, call: dict):
        for w in self._right.winfo_children():
            w.destroy()

        score = call.get("score", 0)
        score_color = GREEN if score >= 85 else (ORANGE if score >= 70 else RED)

        scroll = ctk.CTkScrollableFrame(self._right, fg_color="transparent")
        scroll.pack(fill="both", expand=True, padx=16, pady=14)

        # Header
        hdr = ctk.CTkFrame(scroll, fg_color=CARD2, corner_radius=10)
        hdr.pack(fill="x", pady=(0, 12))
        inner = ctk.CTkFrame(hdr, fg_color="transparent")
        inner.pack(fill="x", padx=14, pady=10)

        ctk.CTkLabel(inner, text=call["name"],
                     font=("Inter", 16, "bold"), text_color=TEXT).pack(side="left")
        ctk.CTkLabel(inner, text=f"Score: {score}",
                     font=("Inter", 13, "bold"), text_color=score_color).pack(side="right")

        ctk.CTkLabel(hdr, text=f"📌 {call['niche']}  ·  {call.get('contact','—')}  ·  {call['date']} {call.get('time','')}",
                     font=("Inter", 11), text_color=TEXT2).pack(anchor="w", padx=14, pady=(0, 8))

        if call.get("notes"):
            ctk.CTkLabel(hdr, text=f"💬 {call['notes']}",
                         font=("Inter", 10), text_color=TEXT3, anchor="w").pack(fill="x", padx=14, pady=(0, 8))

        # Action buttons
        btn_row = ctk.CTkFrame(scroll, fg_color="transparent")
        btn_row.pack(fill="x", pady=(0, 12))

        ctk.CTkButton(btn_row, text="🧠 Подготовиться к созвону",
                       font=("Inter", 12, "bold"), height=38, corner_radius=10,
                       fg_color=ACCENT, hover_color="#4e5adf",
                       command=lambda: self._prepare(call)).pack(side="left", padx=(0, 8), fill="x", expand=True)

        ctk.CTkButton(btn_row, text="📄 Создать КП",
                       font=("Inter", 12, "bold"), height=38, corner_radius=10,
                       fg_color=GREEN + "33", hover_color=GREEN + "55",
                       text_color=GREEN, border_width=1, border_color=GREEN + "66",
                       command=lambda: self._generate_kp(call)).pack(side="left", fill="x", expand=True)

        # AI output area
        ctk.CTkLabel(scroll, text="AI подготовка", font=("Inter", 11, "bold"),
                     text_color=TEXT2).pack(anchor="w", pady=(8, 4))
        self._output_box = ctk.CTkTextbox(scroll, height=320, fg_color=CARD2,
                                           border_color=BORDER, text_color=TEXT,
                                           font=("Inter", 11), wrap="word")
        self._output_box.pack(fill="x")
        self._output_box.insert("1.0", "Нажмите «Подготовиться» — AI изучит данные клиента и составит:\n\n• Что мы знаем о нём\n• Рекомендуемый продукт и цену\n• Вероятные возражения + ответы\n• 5 вопросов для созвона\n• Следующий шаг")
        self._output_box.configure(state="disabled")

        if call["status"] == "done":
            ctk.CTkButton(scroll, text="+ Добавить в CRM со статусом",
                           font=("Inter", 11), height=32, corner_radius=8,
                           fg_color="transparent", border_width=1, border_color=BORDER2,
                           text_color=TEXT2,
                           command=lambda: self._add_to_crm(call)).pack(fill="x", pady=(8, 0))

    # ── AI actions ────────────────────────────────────────────────────────────

    def _prepare(self, call: dict):
        self._set_output("⏳ Gemini изучает данные клиента...\n\nОбычно занимает 10–20 секунд.")

        def _do():
            prompt = (
                f"Подготовь меня к созвону с потенциальным клиентом AMAImedia.\n\n"
                f"Клиент: {call['name']}\n"
                f"Ниша: {call['niche']}\n"
                f"AI Score: {call['score']}/100\n"
                f"Заметки: {call.get('notes', '—')}\n"
                f"Дата созвона: {call['date']} {call.get('time','')}\n\n"
                f"Составь:\n\n"
                f"## Что мы знаем о клиенте\n"
                f"[анализ ниши, типичные боли, что важно для людей из этой ниши]\n\n"
                f"## Рекомендуемый продукт\n"
                f"[какой пакет предложить, почему, примерная цена]\n\n"
                f"## Вероятные возражения и ответы\n"
                f"[топ-3 возражения + конкретные ответы в стиле AMAImedia]\n\n"
                f"## 5 вопросов для созвона\n"
                f"[глубокие вопросы, раскрывающие боль и готовность платить]\n\n"
                f"## Следующий шаг\n"
                f"[как закрыть созвон — предложение, дедлайн, следующее действие]"
            )
            result = call_gemini(prompt, "Ты бизнес-коуч продаж. Отвечай конкретно, с цифрами. Русский язык.")
            self.after(0, lambda: self._set_output(result))

        threading.Thread(target=_do, daemon=True).start()

    def _generate_kp(self, call: dict):
        self._set_output("⏳ Gemini генерирует КП...\n\nОбычно занимает 20–30 секунд.")

        def _do():
            prompt = (
                f"Создай персональное коммерческое предложение для клиента.\n\n"
                f"Клиент: {call['name']}\n"
                f"Ниша: {call['niche']}\n"
                f"Score: {call['score']}/100\n"
                f"Заметки: {call.get('notes','—')}\n\n"
                f"## Ваша ситуация\n[конкретный анализ их положения]\n\n"
                f"## Что мы сделаем за 90 дней\n[3 фазы: установка системы → рост → масштаб]\n\n"
                f"## Ваша команда\n[AI Стратег + AI Копирайтер + AI Аналитик + Зарина как куратор]\n\n"
                f"## Результаты клиентов в вашей нише\n[2 кейса с цифрами]\n\n"
                f"## Инвестиция\n[рекомендуемый пакет, цена, что входит]\n\n"
                f"## Следующий шаг\n[конкретный призыв с дедлайном]"
            )
            result = call_gemini(prompt, "Ты копирайтер продаж AMAImedia. Конкретно, без воды. Русский язык.")
            self.after(0, lambda: self._set_output("📄 КП готово!\n\n" + result))

        threading.Thread(target=_do, daemon=True).start()

    def _add_to_crm(self, call: dict):
        from tkinter import messagebox
        messagebox.showinfo("CRM", f"Клиент {call['name']} добавлен в CRM со статусом 'Контракт'.\n\nОткройте вкладку CRM для дальнейшей работы.")

    def _add_call_dialog(self):
        from tkinter import simpledialog
        name = simpledialog.askstring("Новый созвон", "Имя клиента:")
        if not name:
            return
        niche = simpledialog.askstring("Новый созвон", "Ниша клиента:") or "—"
        date = simpledialog.askstring("Новый созвон", "Дата (ГГГГ-ММ-ДД):") or "2026-04-10"
        new_call = {
            "id": max((c["id"] for c in self._calls), default=0) + 1,
            "name": name, "niche": niche, "score": 70,
            "date": date, "time": "12:00",
            "status": "upcoming", "contact": "—", "notes": ""
        }
        self._calls.append(new_call)
        self._render_list()

    def _set_output(self, text: str):
        self._output_box.configure(state="normal")
        self._output_box.delete("1.0", "end")
        self._output_box.insert("1.0", text)
        self._output_box.configure(state="disabled")

    def refresh(self):
        self._render_list()
