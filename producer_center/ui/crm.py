"""Producer Center — CRM Kanban"""
import threading
import customtkinter as ctk
from config import *
from core.store import load_leads, add_lead, move_lead, delete_lead
from core.models import STAGE_ORDER, STAGE_LABELS, STAGE_COLORS
from api.gemini import call_gemini


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
        ctk.CTkButton(hdr, text="+ Добавить лид", font=("Inter",12,"bold"),
                      fg_color=ACCENT, hover_color="#4e5adf", corner_radius=10, height=34,
                      command=self._open_add_modal).pack(side="right", padx=16, pady=11)

        # Kanban
        self._kanban = ctk.CTkScrollableFrame(self, fg_color=BG, corner_radius=0,
                                               orientation="horizontal")
        self._kanban.pack(fill="both", expand=True, padx=8, pady=8)
        self.refresh()

    def refresh(self):
        for w in self._kanban.winfo_children():
            w.destroy()

        leads = load_leads()
        for stage in STAGE_ORDER:
            col = self._make_column(stage, [l for l in leads if l.stage == stage])
            col.pack(side="left", fill="y", padx=6, pady=4)

    def _make_column(self, stage: str, leads) -> ctk.CTkFrame:
        color = STAGE_COLORS.get(stage, ACCENT)
        col = ctk.CTkFrame(self._kanban, fg_color="transparent", width=220)
        col.pack_propagate(False)

        # Column header
        hdr = ctk.CTkFrame(col, fg_color=CARD, corner_radius=10,
                            border_width=1, border_color=BORDER)
        hdr.pack(fill="x", pady=(0,6))
        ctk.CTkFrame(hdr, width=4, fg_color=color, corner_radius=2).pack(side="left", padx=(8,0), pady=8, fill="y")
        ctk.CTkLabel(hdr, text=STAGE_LABELS.get(stage,stage),
                     font=("Inter",12,"bold"), text_color=TEXT).pack(side="left", padx=8, pady=8)
        ctk.CTkLabel(hdr, text=str(len(leads)),
                     font=("Inter",11,"bold"), text_color=TEXT2).pack(side="right", padx=10)

        scroll = ctk.CTkScrollableFrame(col, fg_color="transparent", width=220)
        scroll.pack(fill="both", expand=True)

        for lead in leads:
            self._make_card(scroll, lead, stage, color)

        return col

    def _make_card(self, parent, lead, stage, color):
        SOURCE_ICONS = {"telegram":"✈️","gis":"🗺","instagram":"📸","ads":"📢",
                        "referral":"🤝","manual":"✏️","unknown":"❓"}
        card = ctk.CTkFrame(parent, fg_color=CARD, corner_radius=12,
                             border_width=1, border_color=BORDER)
        card.pack(fill="x", pady=4)
        ctk.CTkFrame(card, height=3, fg_color=color, corner_radius=2).pack(fill="x")

        body = ctk.CTkFrame(card, fg_color="transparent")
        body.pack(fill="x", padx=10, pady=8)

        ctk.CTkLabel(body, text=lead.name, font=("Inter",12,"bold"),
                     text_color=TEXT, anchor="w").pack(fill="x")
        ctk.CTkLabel(body, text=f"{SOURCE_ICONS.get(lead.source,'❓')} {lead.niche or lead.source} · {lead.date}",
                     font=("Inter",10), text_color=TEXT2, anchor="w").pack(fill="x")
        if lead.contact:
            ctk.CTkLabel(body, text=lead.contact, font=("Inter",10),
                         text_color=TEXT3, anchor="w").pack(fill="x")

        # Buttons
        btns = ctk.CTkFrame(card, fg_color="transparent")
        btns.pack(fill="x", padx=10, pady=(0,8))

        idx = STAGE_ORDER.index(stage) if stage in STAGE_ORDER else 0

        if idx > 0:
            ctk.CTkButton(btns, text="←", width=32, height=28,
                          fg_color=CARD2, hover_color=BORDER2, text_color=TEXT2,
                          font=("Inter",12), corner_radius=7,
                          command=lambda lid=lead.id, prev=STAGE_ORDER[idx-1]:
                              self._move(lid, prev)).pack(side="left", padx=(0,4))

        if idx < len(STAGE_ORDER) - 1:
            ctk.CTkButton(btns, text="→ Далее", height=28,
                          fg_color=f"{color}30", hover_color=f"{color}60",
                          text_color=color, font=("Inter",11,"bold"), corner_radius=7,
                          command=lambda lid=lead.id, nxt=STAGE_ORDER[idx+1]:
                              self._move(lid, nxt)).pack(side="left", expand=True, fill="x", padx=(0,4))

        ctk.CTkButton(btns, text="🤖", width=32, height=28,
                      fg_color="#2d1b60", hover_color="#3d2b80",
                      font=("Inter",13), corner_radius=7,
                      command=lambda l=lead: self._ai_message(l)).pack(side="right")

    def _move(self, lead_id, stage):
        move_lead(lead_id, stage)
        self.refresh()

    def _ai_message(self, lead):
        win = ctk.CTkToplevel(self)
        win.title("🤖 AI Сообщение")
        win.geometry("500x350")
        win.configure(fg_color=CARD)

        ctk.CTkLabel(win, text=f"Генерирую для {lead.name}...",
                     font=("Inter",13), text_color=TEXT2).pack(pady=12)
        txt = ctk.CTkTextbox(win, font=("Inter",12), fg_color=CARD2,
                              text_color=TEXT, height=220)
        txt.pack(fill="both", expand=True, padx=14, pady=4)
        txt.insert("end","⏳ Генерирую...")
        txt.configure(state="disabled")

        def _do():
            prompt = (f"Напиши персональное первое сообщение для {lead.name} "
                      f"(ниша: {lead.niche or '?'}, контакт: {lead.contact}).\n"
                      f"3-4 предложения. Без спама. Закончи вопросом.")
            result = call_gemini(prompt, "Пишешь первые сообщения потенциальным клиентам. Коротко, живо.")
            win.after(0, lambda: _show(result))

        def _show(r):
            txt.configure(state="normal")
            txt.delete("1.0","end")
            txt.insert("end", r)
            txt.configure(state="disabled")

        ctk.CTkButton(win, text="📋 Копировать", fg_color=ACCENT,
                      command=lambda: self.clipboard_append(txt.get("1.0","end"))).pack(pady=8)
        threading.Thread(target=_do, daemon=True).start()

    def _open_add_modal(self):
        win = ctk.CTkToplevel(self)
        win.title("+ Новый лид")
        win.geometry("420x400")
        win.configure(fg_color=CARD)

        ctk.CTkLabel(win, text="Добавить лид", font=("Inter",16,"bold"),
                     text_color=TEXT).pack(pady=(16,10))

        fields = {}
        for lbl, key, ph in [("Имя","name","Алина Морозова"),
                               ("Контакт","contact","@username"),
                               ("Ниша","niche","Нутрициология")]:
            ctk.CTkLabel(win, text=lbl, font=("Inter",11), text_color=TEXT2).pack(anchor="w", padx=20)
            e = ctk.CTkEntry(win, placeholder_text=ph, height=36,
                              fg_color=CARD2, border_color=BORDER2, text_color=TEXT)
            e.pack(fill="x", padx=20, pady=(2,8))
            fields[key] = e

        src_var = ctk.StringVar(value="telegram")
        ctk.CTkLabel(win, text="Источник", font=("Inter",11), text_color=TEXT2).pack(anchor="w", padx=20)
        src = ctk.CTkOptionMenu(win, values=["telegram","gis","instagram","ads","referral","manual"],
                                 variable=src_var, fg_color=CARD2, button_color=BORDER2,
                                 text_color=TEXT, dropdown_fg_color=CARD)
        src.pack(fill="x", padx=20, pady=(2,12))

        def _add():
            data = {k: e.get().strip() for k, e in fields.items()}
            data["source"] = src_var.get()
            if not data.get("name"):
                return
            add_lead(data)
            win.destroy()
            self.refresh()

        ctk.CTkButton(win, text="✅ Добавить лид", fg_color=ACCENT, height=40,
                      font=("Inter",13,"bold"), command=_add).pack(fill="x", padx=20, pady=8)
