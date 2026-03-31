"""Producer Center — Products Screen"""
import threading
import customtkinter as ctk
from config import *
from api.gemini import call_gemini


class ProductsScreen(ctk.CTkFrame):
    def __init__(self, master, app):
        super().__init__(master, fg_color=BG, corner_radius=0)
        self.app = app
        self._build()

    def _build(self):
        hdr = ctk.CTkFrame(self, fg_color=NAV, corner_radius=0, height=56)
        hdr.pack(fill="x")
        hdr.pack_propagate(False)
        ctk.CTkLabel(hdr, text="📦 Продукты и воронки",
                     font=("Inter",18,"bold"), text_color=TEXT).pack(side="left", padx=20, pady=14)

        scroll = ctk.CTkScrollableFrame(self, fg_color=BG, corner_radius=0)
        scroll.pack(fill="both", expand=True, padx=14, pady=12)

        for pname, price, desc, status, color, funnel in [
            ("📱 Мини-курс", "$97", "Массовый продукт — полностью пассивный доход",
             "✅ Готов · Воронка работает", ACCENT,
             ["📢 Реклама","🌐 Лендинг","🎥 Бесплатный урок","📖 Статья","💳 Оплата"]),
            ("🎓 Наставничество", "$1,500", "Обучение ведению соцсетей и бизнеса — 5 мест",
             "✅ Активен · 5 мест/мес", PINK,
             ["📥 Все лиды","📞 Созвон 20 мин","📝 Договор","📚 Курс-модули","⭐ Результат"]),
            ("🚀 Продюсирование", "$3,000/мес или 30%", "Полный сервис под ключ — мы делаем всё",
             "✅ Активен · Под ключ", GREEN,
             ["📞 Созвон","📄 AI КП","📝 Договор","🗺 Карта бизнеса","💰 30%"]),
        ]:
            self._make_product_card(scroll, pname, price, desc, status, color, funnel)

    def _make_product_card(self, parent, name, price, desc, status, color, funnel):
        card = ctk.CTkFrame(parent, fg_color=CARD, corner_radius=14,
                             border_width=1, border_color=BORDER)
        card.pack(fill="x", pady=6)
        ctk.CTkFrame(card, height=4, fg_color=color, corner_radius=2).pack(fill="x")

        hdr = ctk.CTkFrame(card, fg_color="transparent")
        hdr.pack(fill="x", padx=14, pady=(12,4))
        ctk.CTkLabel(hdr, text=name, font=("Inter",15,"bold"), text_color=TEXT).pack(side="left")
        ctk.CTkLabel(hdr, text=price, font=("Inter",15,"bold"), text_color=GREEN).pack(side="right")

        ctk.CTkLabel(card, text=desc, font=("Inter",12), text_color=TEXT2).pack(anchor="w", padx=14)
        ctk.CTkLabel(card, text=status, font=("Inter",11),
                     fg_color=color+"22", text_color=color,
                     corner_radius=6, padx=10, pady=4).pack(anchor="w", padx=14, pady=6)

        # Funnel
        ctk.CTkLabel(card, text="Воронка:", font=("Inter",11,"bold"),
                     text_color=TEXT3).pack(anchor="w", padx=14)
        funnel_row = ctk.CTkFrame(card, fg_color="transparent")
        funnel_row.pack(fill="x", padx=14, pady=(4,10))
        for i, step in enumerate(funnel):
            ctk.CTkLabel(funnel_row, text=step, font=("Inter",10),
                         fg_color=CARD2, text_color=TEXT2,
                         corner_radius=6, padx=8, pady=4).pack(side="left")
            if i < len(funnel) - 1:
                ctk.CTkLabel(funnel_row, text=" → ", font=("Inter",10),
                             text_color=TEXT3).pack(side="left")

        # AI generate KP
        btn = ctk.CTkButton(card, text="🤖 AI генерирует КП", font=("Inter",11,"bold"),
                             fg_color=f"{color}30", hover_color=f"{color}60",
                             text_color=color, height=34, corner_radius=8)
        btn.pack(fill="x", padx=14, pady=(0,6))
        txt = ctk.CTkTextbox(card, height=0, fg_color=CARD2, text_color=TEXT2,
                              font=("Inter",11), corner_radius=8)
        txt.pack(fill="x", padx=14, pady=(0,12))
        txt.configure(state="disabled")

        def _gen(b=btn, t=txt, n=name, p=price):
            b.configure(text="⏳", state="disabled")
            t.configure(height=160, state="normal")
            t.delete("1.0","end"); t.insert("end","Генерирую КП...")
            t.configure(state="disabled")
            def _do():
                result = call_gemini(
                    f"Создай краткое КП на {n} — {p}.\n"
                    "1. Кто мы  2. Что входит  3. Результат клиента  4. Инвестиция  5. Следующий шаг.",
                    "Ты директор продюсерского агентства. Пиши убедительно и конкретно.")
                self.after(0, lambda r=result: _done(r, b, t))
            threading.Thread(target=_do, daemon=True).start()

        def _done(r, b, t):
            t.configure(state="normal"); t.delete("1.0","end"); t.insert("end",r)
            t.configure(state="disabled")
            b.configure(text="🤖 AI генерирует КП", state="normal")

        btn.configure(command=_gen)
