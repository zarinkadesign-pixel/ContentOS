"""Producer Center — Vizard Pipeline Screen"""
import threading, time
import customtkinter as ctk
from config import *
from api.gemini import call_gemini
from api.vizard import create_project, poll_project, get_ai_social


DEMO_CLIPS = [
    {"videoId":1001,"title":"Как похудеть без диет","viralScore":"9.1","videoMsDuration":47000},
    {"videoId":1002,"title":"Главная ошибка в питании","viralScore":"8.7","videoMsDuration":53000},
    {"videoId":1003,"title":"3 продукта мешающих похудеть","viralScore":"9.4","videoMsDuration":39000},
]


class VizardScreen(ctk.CTkFrame):
    def __init__(self, master, app):
        super().__init__(master, fg_color=BG, corner_radius=0)
        self.app = app
        self._clips = []
        self._captions = []
        self._project_id = None
        self._build()

    def _build(self):
        hdr = ctk.CTkFrame(self, fg_color=NAV, corner_radius=0, height=56)
        hdr.pack(fill="x")
        hdr.pack_propagate(False)
        ctk.CTkLabel(hdr, text="🎬 Контент и Vizard",
                     font=("Inter",18,"bold"), text_color=TEXT).pack(side="left", padx=20, pady=14)

        # Status bar
        from config import VIZARD_KEY
        status_text = "Vizard подключён ✓" if VIZARD_KEY else "⚠️ Демо-режим (нет Vizard ключа)"
        status_color = GREEN if VIZARD_KEY else ORANGE
        ctk.CTkLabel(hdr, text=status_text, font=("Inter",11),
                     text_color=status_color).pack(side="right", padx=16)

        scroll = ctk.CTkScrollableFrame(self, fg_color=BG, corner_radius=0)
        scroll.pack(fill="both", expand=True, padx=14, pady=12)

        steps = [
            ("1", "📤 URL видео / подкаста", ACCENT),
            ("2", "✂️ Готовые клипы", ORANGE),
            ("3", "✍️ AI Подписи", CYAN),
            ("4", "📅 Расписание публикаций", PINK),
        ]
        self._step_frames = {}
        for num, title, color in steps:
            f = self._make_step(scroll, num, title, color)
            self._step_frames[num] = f

        # Build step content
        self._build_step1(self._step_frames["1"])
        self._build_step2(self._step_frames["2"])
        self._build_step3(self._step_frames["3"])
        self._build_step4(self._step_frames["4"])

    def _make_step(self, parent, num, title, color):
        card = ctk.CTkFrame(parent, fg_color=CARD, corner_radius=14,
                             border_width=1, border_color=BORDER)
        card.pack(fill="x", pady=6)
        ctk.CTkFrame(card, height=3, fg_color=color, corner_radius=2).pack(fill="x")
        hdr = ctk.CTkFrame(card, fg_color="transparent")
        hdr.pack(fill="x", padx=14, pady=(10,8))
        num_lbl = ctk.CTkLabel(hdr, text=num, font=("Inter",13,"bold"),
                                fg_color=color, text_color="#000",
                                width=28, height=28, corner_radius=14)
        num_lbl.pack(side="left", padx=(0,10))
        ctk.CTkLabel(hdr, text=title, font=("Inter",14,"bold"), text_color=TEXT).pack(side="left")
        content = ctk.CTkFrame(card, fg_color="transparent")
        content.pack(fill="x", padx=14, pady=(0,12))
        return content

    def _build_step1(self, parent):
        self._url_entry = ctk.CTkEntry(parent,
            placeholder_text="YouTube, Google Drive или MP4 URL...",
            height=38, fg_color=CARD2, border_color=BORDER2, text_color=TEXT,
            font=("Inter",12))
        self._url_entry.pack(fill="x", pady=(0,8))

        opts = ctk.CTkFrame(parent, fg_color="transparent")
        opts.pack(fill="x", pady=(0,8))
        ctk.CTkLabel(opts, text="Язык:", font=("Inter",11), text_color=TEXT2).pack(side="left")
        self._lang_var = ctk.StringVar(value="ru")
        ctk.CTkOptionMenu(opts, values=["ru","en","auto"], variable=self._lang_var,
                           fg_color=CARD2, button_color=BORDER2, text_color=TEXT,
                           dropdown_fg_color=CARD, width=90).pack(side="left", padx=8)
        ctk.CTkLabel(opts, text="Клипов:", font=("Inter",11), text_color=TEXT2).pack(side="left")
        self._clips_var = ctk.StringVar(value="10")
        ctk.CTkOptionMenu(opts, values=["6","10","15"], variable=self._clips_var,
                           fg_color=CARD2, button_color=BORDER2, text_color=TEXT,
                           dropdown_fg_color=CARD, width=80).pack(side="left", padx=8)

        self._btn1 = ctk.CTkButton(parent, text="⚡ Отправить в Vizard",
                                    fg_color=ACCENT, hover_color="#4e5adf",
                                    font=("Inter",12,"bold"), height=38, corner_radius=10,
                                    command=self._step1)
        self._btn1.pack(fill="x")
        self._pid_lbl = ctk.CTkLabel(parent, text="", font=("Inter",11), text_color=GREEN)
        self._pid_lbl.pack(anchor="w", pady=(4,0))

    def _build_step2(self, parent):
        self._btn2 = ctk.CTkButton(parent, text="🔄 Получить клипы",
                                    fg_color=CARD2, hover_color=BORDER2,
                                    text_color=TEXT2, font=("Inter",12,"bold"), height=36, corner_radius=10,
                                    state="disabled", command=self._step2)
        self._btn2.pack(fill="x", pady=(0,8))
        self._clips_frame = ctk.CTkFrame(parent, fg_color="transparent")
        self._clips_frame.pack(fill="x")

    def _build_step3(self, parent):
        self._btn3 = ctk.CTkButton(parent, text="✦ Создать AI подписи",
                                    fg_color=CARD2, hover_color=BORDER2,
                                    text_color=TEXT2, font=("Inter",12,"bold"), height=36, corner_radius=10,
                                    state="disabled", command=self._step3)
        self._btn3.pack(fill="x", pady=(0,8))
        self._caps_frame = ctk.CTkFrame(parent, fg_color="transparent")
        self._caps_frame.pack(fill="x")

    def _build_step4(self, parent):
        opts = ctk.CTkFrame(parent, fg_color="transparent")
        opts.pack(fill="x", pady=(0,8))
        ctk.CTkLabel(opts, text="Начало:", font=("Inter",11), text_color=TEXT2).pack(side="left")
        self._start_entry = ctk.CTkEntry(opts, placeholder_text="2025-06-01 10:00",
                                          width=150, height=32, fg_color=CARD2,
                                          border_color=BORDER2, text_color=TEXT)
        self._start_entry.pack(side="left", padx=8)
        ctk.CTkLabel(opts, text="Интервал (дней):", font=("Inter",11), text_color=TEXT2).pack(side="left")
        self._interval_var = ctk.StringVar(value="2")
        ctk.CTkOptionMenu(opts, values=["1","2","3","5","7"], variable=self._interval_var,
                           fg_color=CARD2, button_color=BORDER2, text_color=TEXT,
                           dropdown_fg_color=CARD, width=70).pack(side="left", padx=8)

        self._btn4 = ctk.CTkButton(parent, text="📅 Запланировать публикации",
                                    fg_color=CARD2, hover_color=BORDER2,
                                    text_color=TEXT2, font=("Inter",12,"bold"), height=36, corner_radius=10,
                                    state="disabled", command=self._step4)
        self._btn4.pack(fill="x", pady=(0,8))
        self._schedule_lbl = ctk.CTkLabel(parent, text="", font=("Inter",11),
                                           text_color=TEXT2, justify="left")
        self._schedule_lbl.pack(anchor="w")

    # ── STEP LOGIC ────────────────────────────────────────────
    def _step1(self):
        url = self._url_entry.get().strip()
        if not url:
            self._pid_lbl.configure(text="⚠️ Введи URL видео")
            return
        self._btn1.configure(text="⏳ Отправляем...", state="disabled")
        def _do():
            from config import VIZARD_KEY
            if VIZARD_KEY:
                r = create_project(url, lang=self._lang_var.get(), max_clips=int(self._clips_var.get()))
                pid = r.get("projectId","DEMO")
            else:
                pid = f"DEMO_{int(time.time())}"
            self._project_id = pid
            self.after(0, lambda: self._after_step1(pid))
        threading.Thread(target=_do, daemon=True).start()

    def _after_step1(self, pid):
        self._pid_lbl.configure(text=f"✅ Проект создан · {'Демо' if str(pid).startswith('DEMO') else f'ID: {pid}'}")
        self._btn1.configure(text="⚡ Отправить в Vizard", state="normal")
        self._btn2.configure(state="normal", fg_color=ORANGE+"30",
                              hover_color=ORANGE+"60", text_color=ORANGE)

    def _step2(self):
        self._btn2.configure(text="⏳ Загружаем...", state="disabled")
        def _do():
            from config import VIZARD_KEY
            if VIZARD_KEY and not str(self._project_id).startswith("DEMO"):
                r = poll_project(self._project_id)
                self._clips = r.get("videos", DEMO_CLIPS)
            else:
                time.sleep(1)
                self._clips = DEMO_CLIPS
            self.after(0, self._after_step2)
        threading.Thread(target=_do, daemon=True).start()

    def _after_step2(self):
        for w in self._clips_frame.winfo_children():
            w.destroy()
        for clip in self._clips:
            score = float(clip.get("viralScore",7))
            color = GREEN if score>=9 else (ORANGE if score>=8 else RED)
            row = ctk.CTkFrame(self._clips_frame, fg_color=CARD2, corner_radius=8)
            row.pack(fill="x", pady=2)
            ctk.CTkLabel(row, text=clip.get("title","—"), font=("Inter",11),
                         text_color=TEXT).pack(side="left", padx=10, pady=6)
            ctk.CTkLabel(row, text=f"⚡{score}", font=("Inter",11,"bold"),
                         text_color=color).pack(side="right", padx=10)
        self._btn2.configure(text="🔄 Получить клипы", state="normal")
        self._btn3.configure(state="normal", fg_color=CYAN+"30",
                              hover_color=CYAN+"60", text_color=CYAN)

    def _step3(self):
        self._btn3.configure(text="⏳ Генерируем...", state="disabled")
        def _do():
            self._captions = []
            for clip in self._clips:
                cap = call_gemini(
                    f"Подпись для Instagram Reels '{clip.get('title','?')}'. "
                    "Хук + 2-3 предложения + CTA + 5 хэштегов. До 150 слов.",
                    "Копирайтер. Живо и цепляюще.")
                self._captions.append(cap)
            self.after(0, self._after_step3)
        threading.Thread(target=_do, daemon=True).start()

    def _after_step3(self):
        for w in self._caps_frame.winfo_children():
            w.destroy()
        for i, (clip, cap) in enumerate(zip(self._clips, self._captions)):
            row = ctk.CTkFrame(self._caps_frame, fg_color=CARD2, corner_radius=8)
            row.pack(fill="x", pady=3)
            ctk.CTkLabel(row, text=f"{i+1}. {clip.get('title','?')[:30]}",
                         font=("Inter",11,"bold"), text_color=ACCENT2).pack(anchor="w", padx=10, pady=(6,2))
            ctk.CTkLabel(row, text=cap[:80]+"...", font=("Inter",10),
                         text_color=TEXT2, wraplength=400, justify="left").pack(anchor="w", padx=10, pady=(0,6))
        self._btn3.configure(text="✦ Создать AI подписи", state="normal")
        self._btn4.configure(state="normal", fg_color=PINK+"30",
                              hover_color=PINK+"60", text_color=PINK)

    def _step4(self):
        if not self._clips:
            return
        try:
            start = self._start_entry.get().strip() or "2025-06-01"
            interval = int(self._interval_var.get())
            from datetime import datetime, timedelta
            try:
                dt = datetime.strptime(start.split()[0], "%Y-%m-%d")
            except Exception:
                dt = datetime.now()
            lines = []
            for i, clip in enumerate(self._clips):
                pub = dt + timedelta(days=i * interval)
                lines.append(f"📅 {pub.strftime('%d.%m.%Y')}  —  {clip.get('title','?')[:40]}")
            self._schedule_lbl.configure(
                text="\n".join(lines),
                text_color=GREEN)
        except Exception as e:
            self._schedule_lbl.configure(text=f"❌ {e}", text_color=RED)
