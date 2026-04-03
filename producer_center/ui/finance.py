"""Producer Center — Finance Screen"""
import customtkinter as ctk
from config import *
from core.store import load_finance, add_transaction
from config import KPI_TARGET


class FinanceScreen(ctk.CTkFrame):
    def __init__(self, master, app):
        super().__init__(master, fg_color=BG, corner_radius=0)
        self.app = app
        self._build()

    def _build(self):
        hdr = ctk.CTkFrame(self, fg_color=NAV, corner_radius=0, height=56)
        hdr.pack(fill="x")
        hdr.pack_propagate(False)
        ctk.CTkLabel(hdr, text="💰 Финансы и KPI",
                     font=("Inter",18,"bold"), text_color=TEXT).pack(side="left", padx=20, pady=14)
        ctk.CTkButton(hdr, text="+ Транзакция", font=("Inter",12,"bold"),
                      fg_color=ACCENT, corner_radius=10, height=34,
                      command=self._open_add).pack(side="right", padx=16, pady=11)

        self._scroll = ctk.CTkScrollableFrame(self, fg_color=BG, corner_radius=0)
        self._scroll.pack(fill="both", expand=True, padx=14, pady=12)
        self.refresh()

    def refresh(self):
        for w in self._scroll.winfo_children():
            w.destroy()
        fin = load_finance()
        income  = sum(t.get("amount",0) for t in fin.income)
        expenses = sum(e.get("amount",0) for e in fin.expenses)
        profit  = income - expenses
        kpi_pct = min(1.0, income / KPI_TARGET)

        # KPI row
        kpi_row = ctk.CTkFrame(self._scroll, fg_color="transparent")
        kpi_row.pack(fill="x", pady=(0,10))
        for lbl, val, col in [("💰 Доход",f"${income:,.0f}",GREEN),
                                ("📉 Расходы",f"${expenses:,.0f}",RED),
                                ("✨ Прибыль",f"${profit:,.0f}",ACCENT2),
                                ("📊 Маржа",f"{int(profit/income*100) if income>0 else 0}%",ORANGE)]:
            t = ctk.CTkFrame(kpi_row, fg_color=CARD, corner_radius=12,
                             border_width=1, border_color=BORDER)
            t.pack(side="left", expand=True, fill="x", padx=(0,6))
            ctk.CTkLabel(t, text=val, font=("Inter",18,"bold"), text_color=col).pack(pady=(10,2))
            ctk.CTkLabel(t, text=lbl, font=("Inter",10), text_color=TEXT2).pack(pady=(0,10))

        # KPI bar
        kpi_card = ctk.CTkFrame(self._scroll, fg_color=CARD, corner_radius=12,
                                 border_width=1, border_color=BORDER)
        kpi_card.pack(fill="x", pady=(0,10))
        kh = ctk.CTkFrame(kpi_card, fg_color="transparent")
        kh.pack(fill="x", padx=14, pady=(12,4))
        ctk.CTkLabel(kh, text=f"KPI: ${KPI_TARGET:,}/мес",
                     font=("Inter",13,"bold"), text_color=TEXT).pack(side="left")
        pct_color = GREEN if kpi_pct >= 1 else (ORANGE if kpi_pct >= 0.7 else RED)
        ctk.CTkLabel(kh, text=f"${income:,.0f}  ·  {int(kpi_pct*100)}%",
                     font=("Inter",13,"bold"), text_color=pct_color).pack(side="right")
        pb = ctk.CTkProgressBar(kpi_card, progress_color=pct_color, fg_color=CARD2,
                                 height=8, corner_radius=4)
        pb.set(kpi_pct)
        pb.pack(fill="x", padx=14, pady=(0,8))
        if kpi_pct >= 1:
            bonus = income * 0.2
            ctk.CTkLabel(kpi_card, text=f"🎉 KPI выполнен! Бонус директора: ${bonus:,.0f}",
                         font=("Inter",12,"bold"), text_color=GREEN).pack(anchor="w", padx=14, pady=(0,12))
        else:
            ctk.CTkFrame(kpi_card, height=6, fg_color="transparent").pack()

        # By source
        src_card = ctk.CTkFrame(self._scroll, fg_color=CARD, corner_radius=12,
                                 border_width=1, border_color=BORDER)
        src_card.pack(fill="x", pady=(0,10))
        ctk.CTkLabel(src_card, text="По источникам", font=("Inter",12,"bold"),
                     text_color=TEXT).pack(anchor="w", padx=14, pady=(12,8))
        src_map = {"minicourse":("📱 Мини-курс",ACCENT2),"mentoring":("🎓 Наставничество",PINK),
                   "production":("🚀 Продюсирование",GREEN),"other":("Другое",TEXT2)}
        for key,(name,color) in src_map.items():
            amt = sum(t.get("amount",0) for t in fin.income if t.get("type")==key)
            if amt == 0: continue
            row = ctk.CTkFrame(src_card, fg_color="transparent")
            row.pack(fill="x", padx=14, pady=3)
            ctk.CTkLabel(row, text=name, font=("Inter",12), text_color=TEXT2).pack(side="left")
            ctk.CTkLabel(row, text=f"${amt:,.0f}", font=("Inter",12,"bold"),
                         text_color=color).pack(side="right")
            if income > 0:
                pb2 = ctk.CTkProgressBar(src_card, progress_color=color, fg_color=CARD2,
                                          height=3, corner_radius=2)
                pb2.set(min(1.0, amt/income))
                pb2.pack(fill="x", padx=14, pady=(0,4))
        ctk.CTkFrame(src_card, height=8, fg_color="transparent").pack()

        # Transactions
        ctk.CTkLabel(self._scroll, text="Последние транзакции",
                     font=("Inter",13,"bold"), text_color=TEXT).pack(anchor="w", pady=(8,6))
        txns = list(reversed(fin.income[-15:]))
        for t in txns:
            row = ctk.CTkFrame(self._scroll, fg_color=CARD, corner_radius=8)
            row.pack(fill="x", pady=2)
            ctk.CTkLabel(row, text=t.get("desc","—"), font=("Inter",12),
                         text_color=TEXT2).pack(side="left", padx=12, pady=8)
            ctk.CTkLabel(row, text=t.get("date",""), font=("Inter",10),
                         text_color=TEXT3).pack(side="right", padx=8)
            ctk.CTkLabel(row, text=f"+${t.get('amount',0):,.0f}",
                         font=("Inter",12,"bold"), text_color=GREEN).pack(side="right", padx=4)

        if not fin.income:
            ctk.CTkLabel(self._scroll, text="Нет транзакций. Нажми «+ Транзакция»",
                         font=("Inter",13), text_color=TEXT3).pack(pady=20)

    def _open_add(self):
        win = ctk.CTkToplevel(self)
        win.title("+ Транзакция")
        win.geometry("380x300")
        win.configure(fg_color=CARD)
        ctk.CTkLabel(win, text="Добавить транзакцию", font=("Inter",15,"bold"),
                     text_color=TEXT).pack(pady=(16,12))

        ctk.CTkLabel(win, text="Описание", font=("Inter",11), text_color=TEXT2).pack(anchor="w",padx=20)
        desc_e = ctk.CTkEntry(win, placeholder_text="Мини-курс апрель",
                               height=36, fg_color=CARD2, border_color=BORDER2, text_color=TEXT)
        desc_e.pack(fill="x", padx=20, pady=(2,10))

        ctk.CTkLabel(win, text="Сумма ($)", font=("Inter",11), text_color=TEXT2).pack(anchor="w",padx=20)
        amt_e = ctk.CTkEntry(win, placeholder_text="1500",
                              height=36, fg_color=CARD2, border_color=BORDER2, text_color=TEXT)
        amt_e.pack(fill="x", padx=20, pady=(2,10))

        type_var = ctk.StringVar(value="minicourse")
        ctk.CTkLabel(win, text="Тип", font=("Inter",11), text_color=TEXT2).pack(anchor="w",padx=20)
        ctk.CTkOptionMenu(win, values=["minicourse","mentoring","production","other"],
                           variable=type_var, fg_color=CARD2, button_color=BORDER2,
                           text_color=TEXT, dropdown_fg_color=CARD).pack(fill="x", padx=20, pady=(2,12))

        def _add():
            d = desc_e.get().strip()
            try: a = float(amt_e.get().strip())
            except: return
            if not d: return
            add_transaction(d, a, type_var.get())
            win.destroy()
            self.refresh()

        ctk.CTkButton(win, text="✅ Добавить", fg_color=ACCENT, height=40,
                      font=("Inter",13,"bold"), command=_add).pack(fill="x", padx=20, pady=8)
