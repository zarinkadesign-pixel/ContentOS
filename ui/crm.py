"""Producer Center — CRM Kanban (fixed)"""
import threading
import customtkinter as ctk
from config import *
from core.store import load_leads, add_lead, move_lead, delete_lead
from core.models import STAGE_ORDER, STAGE_LABELS, STAGE_COLORS
from api.gemini import call_gemini

SOURCE_ICONS = {
    "telegram":"✈️","gis":"🗺","instagram":"📸",
    "ads":"📢","referral":"🤝","manual":"✏️","unknown":"❓"
}

class CRMScreen(ctk.CTkFrame):
    def __init__(self, master, app):
        super().__init__(master, fg_color=BG, corner_radius=0)
        self.app = app
        self._build()

    def _build(self):
        # Header
        hdr = ctk.CTkFrame(self, fg_color=NAV, corner_radius=0, height=56)
        hdr.pack(fill="x")
        hdr.pack_propagate(False)
        ctk.CTkLabel(hdr, text="🔍 Поиск клиентов — CRM",
                     font=("Inter",18,"bold"), text_color=TEXT).pack(side="left", padx=20, pady=14)
        ctk.CTkButton(
            hdr, text="+ Добавить лид",
            font=("Inter",12,"bold"), fg_color=ACCENT,
            hover_color="#4e5adf", corner_radius=10, height=34,
            command=self._open_add
        ).pack(side="right", padx=16, pady=11)

        # Stats bar
        self._stats_bar = ctk.CTkFrame(self, fg_color=NAV, corner_radius=0, height=36)
        self._stats_bar.pack(fill="x")
        self._stats_bar.pack_propagate(False)
        self._stats_lbl = ctk.CTkLabel(
            self._stats_bar, text="", font=("Inter",11), text_color=TEXT2)
        self._stats_lbl.pack(side="left", padx=16)
        ctk.CTkButton(
            self._stats_bar, text="🔄 Обновить",
            font=("Inter",10), fg_color="transparent",
            hover_color=BORDER, text_color=TEXT2, height=26, width=90,
            command=self.refresh
        ).pack(side="right", padx=8)

        # Kanban scrollable horizontally
        self._kanban = ctk.CTkScrollableFrame(
            self, fg_color=BG, corner_radius=0, orientation="horizontal")
        self._kanban.pack(fill="both", expand=True, padx=6, pady=6)

    def refresh(self):
        for w in self._kanban.winfo_children():
            w.destroy()

        leads = load_leads()
        total = len(leads)
        new_c = sum(1 for l in leads if l.stage == "new")
        self._stats_lbl.configure(
            text=f"Всего: {total}  |  Новых: {new_c}  |  Созвон: {sum(1 for l in leads if l.stage=='call')}")

        for stage in STAGE_ORDER:
            stage_leads = [l for l in leads if l.stage == stage]
            col = self._make_column(stage, stage_leads)
            col.pack(side="left", fill="y", padx=5, pady=4)

    def _make_column(self, stage, leads):
        color = STAGE_COLORS.get(stage, ACCENT)
        col = ctk.CTkFrame(self._kanban, fg_color="transparent", width=230)
        col.pack_propagate(False)

        # Column header
        hdr = ctk.CTkFrame(col, fg_color=CARD, corner_radius=10,
                            border_width=1, border_color=BORDER)
        hdr.pack(fill="x", pady=(0,6))
        accent_bar = ctk.CTkFrame(hdr, width=4, fg_color=color, corner_radius=2)
        accent_bar.pack(side="left", fill="y", padx=(8,0), pady=8)
        ctk.CTkLabel(hdr, text=STAGE_LABELS.get(stage, stage),
                     font=("Inter",12,"bold"), text_color=TEXT).pack(side="left", padx=8, pady=8)
        count_lbl = ctk.CTkLabel(hdr, text=str(len(leads)),
                                  font=("Inter",11,"bold"), text_color=TEXT2)
        count_lbl.pack(side="right", padx=10)

        # Cards scroll
        cards_scroll = ctk.CTkScrollableFrame(col, fg_color="transparent", width=230)
        cards_scroll.pack(fill="both", expand=True)

        for lead in leads:
            self._make_card(cards_scroll, lead, stage, color)

        # Add button at bottom
        ctk.CTkButton(
            cards_scroll, text="+ Добавить",
            font=("Inter",11), height=32,
            fg_color="transparent", hover_color=BORDER,
            text_color=TEXT3, corner_radius=8,
            border_width=1, border_color=BORDER2,
            command=self._open_add
        ).pack(fill="x", pady=(4,2))

        return col

    def _make_card(self, parent, lead, stage, color):
        card = ctk.CTkFrame(parent, fg_color=CARD, corner_radius=12,
                             border_width=1, border_color=BORDER)
        card.pack(fill="x", pady=4)
        # Color accent top
        ctk.CTkFrame(card, height=3, fg_color=color, corner_radius=2).pack(fill="x")

        body = ctk.CTkFrame(card, fg_color="transparent")
        body.pack(fill="x", padx=10, pady=8)

        # Name + source
        name_row = ctk.CTkFrame(body, fg_color="transparent")
        name_row.pack(fill="x")
        src_icon = SOURCE_ICONS.get(lead.source, "❓")
        ctk.CTkLabel(name_row, text=src_icon, font=("Inter",13)).pack(side="left")
        ctk.CTkLabel(name_row, text=f"  {lead.name}",
                     font=("Inter",12,"bold"), text_color=TEXT, anchor="w").pack(side="left", fill="x")

        # Niche + date
        ctk.CTkLabel(body, text=f"{lead.niche or lead.source}  ·  {lead.date}",
                     font=("Inter",10), text_color=TEXT2, anchor="w").pack(fill="x", pady=(2,0))
        if lead.contact:
            ctk.CTkLabel(body, text=lead.contact, font=("Inter",10),
                         text_color=TEXT3, anchor="w").pack(fill="x")
        if lead.notes:
            ctk.CTkLabel(body, text=lead.notes[:50],
                         font=("Inter",10), text_color=TEXT3,
                         anchor="w", wraplength=180).pack(fill="x", pady=(2,0))

        # Action buttons
        btns = ctk.CTkFrame(card, fg_color="transparent")
        btns.pack(fill="x", padx=10, pady=(0,8))

        idx = STAGE_ORDER.index(stage) if stage in STAGE_ORDER else 0

        # Back button
        if idx > 0:
            ctk.CTkButton(
                btns, text="←", width=34, height=28,
                fg_color=CARD2, hover_color=BORDER2,
                text_color=TEXT2, font=("Inter",13), corner_radius=7,
                command=lambda lid=lead.id, s=STAGE_ORDER[idx-1]: self._move(lid, s)
            ).pack(side="left", padx=(0,3))

        # Forward button
        if idx < len(STAGE_ORDER) - 1:
            ctk.CTkButton(
                btns, text="→ Далее", height=28,
                fg_color=color+"33", hover_color=color+"66",
                text_color=color, font=("Inter",11,"bold"), corner_radius=7,
                command=lambda lid=lead.id, s=STAGE_ORDER[idx+1]: self._move(lid, s)
            ).pack(side="left", expand=True, fill="x", padx=(0,3))

        # AI message button
        ctk.CTkButton(
            btns, text="🤖", width=34, height=28,
            fg_color="#1e0d50", hover_color="#2d1b70",
            font=("Inter",14), corner_radius=7,
            command=lambda l=lead: self._ai_message(l)
        ).pack(side="right")

        # Delete button
        ctk.CTkButton(
            btns, text="✕", width=28, height=28,
            fg_color="transparent", hover_color=RED+"22",
            text_color=TEXT3, font=("Inter",11), corner_radius=7,
            command=lambda lid=lead.id: self._delete(lid)
        ).pack(side="right", padx=(0,3))

    def _move(self, lead_id, stage):
        move_lead(lead_id, stage)
        self.refresh()

    def _delete(self, lead_id):
        delete_lead(lead_id)
        self.refresh()

    def _ai_message(self, lead):
        win = ctk.CTkToplevel(self)
        win.title(f"🤖 AI сообщение для {lead.name}")
        win.geometry("520x360")
        win.configure(fg_color=CARD)
        win.lift()
        win.focus()

        ctk.CTkLabel(win, text=f"Генерирую сообщение для {lead.name}...",
                     font=("Inter",13), text_color=TEXT2).pack(pady=12)
        txt = ctk.CTkTextbox(win, font=("Inter",12), fg_color=CARD2,
                              text_color=TEXT, height=220, corner_radius=10)
        txt.pack(fill="both", expand=True, padx=14, pady=4)
        txt.insert("end","⏳ Генерирую...")
        txt.configure(state="disabled")

        def _do():
            prompt = (
                f"Напиши персональное первое сообщение для {lead.name}. "
                f"Ниша: {lead.niche or 'не указана'}. Контакт: {lead.contact}. "
                f"Источник: {lead.source}.\n\n"
                f"Правила: 3-4 предложения, живой язык, никакого спама, "
                f"покажи что изучил их профиль, заверши вопросом."
            )
            result = call_gemini(prompt,
                "Ты пишешь первые сообщения потенциальным клиентам продюсерского агентства.")
            win.after(0, lambda r=result: _show(r))

        def _show(r):
            txt.configure(state="normal")
            txt.delete("1.0","end")
            txt.insert("end", r)
            txt.configure(state="disabled")

        btns = ctk.CTkFrame(win, fg_color="transparent")
        btns.pack(fill="x", padx=14, pady=8)
        ctk.CTkButton(btns, text="📋 Копировать", fg_color=ACCENT, height=36,
                      command=lambda: self.clipboard_append(txt.get("1.0","end"))
                      ).pack(side="left", padx=(0,8))
        ctk.CTkButton(btns, text="✕ Закрыть", fg_color=CARD2, height=36,
                      text_color=TEXT2, hover_color=BORDER2,
                      command=win.destroy).pack(side="left")

        threading.Thread(target=_do, daemon=True).start()

    def _open_add(self):
        win = ctk.CTkToplevel(self)
        win.title("+ Новый лид")
        win.geometry("440x420")
        win.configure(fg_color=CARD)
        win.lift()
        win.focus()

        ctk.CTkLabel(win, text="Добавить лид",
                     font=("Inter",16,"bold"), text_color=TEXT).pack(pady=(16,10))

        fields = {}
        for lbl, key, ph in [
            ("Имя / Компания", "name", "Алина Морозова"),
            ("Контакт (@TG / телефон)", "contact", "@username"),
            ("Ниша / Бизнес", "niche", "Нутрициология"),
        ]:
            ctk.CTkLabel(win, text=lbl, font=("Inter",11),
                         text_color=TEXT2).pack(anchor="w", padx=20)
            e = ctk.CTkEntry(win, placeholder_text=ph, height=36,
                              fg_color=CARD2, border_color=BORDER2,
                              text_color=TEXT, font=("Inter",12))
            e.pack(fill="x", padx=20, pady=(2,8))
            fields[key] = e

        ctk.CTkLabel(win, text="Источник", font=("Inter",11),
                     text_color=TEXT2).pack(anchor="w", padx=20)
        src_var = ctk.StringVar(value="telegram")
        ctk.CTkOptionMenu(
            win,
            values=["telegram","gis","instagram","ads","referral","manual"],
            variable=src_var,
            fg_color=CARD2, button_color=BORDER2,
            text_color=TEXT, dropdown_fg_color=CARD
        ).pack(fill="x", padx=20, pady=(2,16))

        def _add():
            name = fields["name"].get().strip()
            if not name:
                return
            add_lead({
                "name": name,
                "contact": fields["contact"].get().strip(),
                "niche": fields["niche"].get().strip(),
                "source": src_var.get(),
            })
            win.destroy()
            self.refresh()

        ctk.CTkButton(
            win, text="✅ Добавить лид",
            fg_color=ACCENT, hover_color="#4e5adf",
            height=40, font=("Inter",13,"bold"),
            command=_add
        ).pack(fill="x", padx=20, pady=(0,12))
