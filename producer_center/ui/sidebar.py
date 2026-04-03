"""Producer Center — Sidebar Navigation"""
import customtkinter as ctk
from config import NAV, BORDER, ACCENT, ACCENT2, TEXT, TEXT2, TEXT3, GREEN

NAV_ITEMS = [
    ("dashboard", "📊", "Дашборд"),
    ("crm",       "🔍", "Поиск / CRM"),
    ("clients",   "👥", "Клиенты"),
    ("products",  "📦", "Продукты"),
    ("content",   "🎬", "Контент / Vizard"),
    ("finance",   "💰", "Финансы"),
    ("agents",    "🤖", "AI Агенты"),
    ("calls",     "📞", "Созвоны"),
]

class Sidebar(ctk.CTkFrame):
    def __init__(self, master, on_navigate):
        super().__init__(master, width=210, fg_color=NAV, corner_radius=0)
        self.pack_propagate(False)
        self.on_navigate = on_navigate
        self._btns = {}
        self._active = None
        self._build()

    def _build(self):
        # Logo
        logo = ctk.CTkFrame(self, fg_color="#0d1126", corner_radius=12, height=52)
        logo.pack(fill="x", padx=12, pady=(14,8))
        logo.pack_propagate(False)
        ctk.CTkLabel(logo, text="PC", font=("Inter",15,"bold"),
                     text_color="#000", fg_color=ACCENT,
                     width=32, height=32, corner_radius=8).pack(side="left", padx=10, pady=10)
        lbl_f = ctk.CTkFrame(logo, fg_color="transparent")
        lbl_f.pack(side="left")
        ctk.CTkLabel(lbl_f, text="PRODUCER CENTER", font=("Inter",10,"bold"),
                     text_color=TEXT).pack(anchor="w")
        ctk.CTkLabel(lbl_f, text="Director", font=("Inter",9),
                     text_color=TEXT3).pack(anchor="w")

        # Separator
        ctk.CTkFrame(self, height=1, fg_color=BORDER).pack(fill="x", padx=12)

        # Nav buttons
        nav_frame = ctk.CTkFrame(self, fg_color="transparent")
        nav_frame.pack(fill="both", expand=True, padx=8, pady=8)

        for key, icon, label in NAV_ITEMS:
            btn = ctk.CTkButton(
                nav_frame, text=f"  {icon}  {label}",
                font=("Inter",13,"bold"), anchor="w",
                fg_color="transparent", hover_color="#1e1e38",
                text_color=TEXT2, height=40, corner_radius=10,
                command=lambda k=key: self.on_navigate(k)
            )
            btn.pack(fill="x", pady=2)
            self._btns[key] = btn

        # Status
        ctk.CTkFrame(self, height=1, fg_color=BORDER).pack(fill="x", padx=12)
        status = ctk.CTkFrame(self, fg_color="transparent", height=44)
        status.pack(fill="x", padx=12, pady=8)
        status.pack_propagate(False)
        dot = ctk.CTkLabel(status, text="●", font=("Inter",10),
                           text_color=GREEN, width=16)
        dot.pack(side="left", padx=(4,4))
        ctk.CTkLabel(status, text="Gemini API активен", font=("Inter",11),
                     text_color=TEXT2).pack(side="left")

    def set_active(self, key: str):
        if self._active and self._active in self._btns:
            self._btns[self._active].configure(
                fg_color="transparent", text_color=TEXT2)
        if key in self._btns:
            self._btns[key].configure(
                fg_color="#1a1f4e", text_color=ACCENT2)
        self._active = key
