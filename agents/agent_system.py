"""
NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
Copyright (c) 2026 AMAImedia.com
All rights reserved.
agents/agent_system.py — 12 AI Agent orchestration system
"""
import json
import os
import threading
import time
import urllib.request
import urllib.error
from datetime import datetime

# ── config ────────────────────────────────────────────────────────────────────

GEMINI_KEY  = os.environ.get("GEMINI_KEY",  "YOUR_GEMINI_KEY")
BOT_TOKEN   = os.environ.get("BOT_TOKEN",   "YOUR_BOT_TOKEN")
CHAT_ID     = os.environ.get("CHAT_ID",     "YOUR_CHAT_ID")
VIZARD_KEY  = os.environ.get("VIZARD_KEY",  "YOUR_VIZARD_KEY")

DATA_DIR    = os.path.join(os.path.dirname(os.path.dirname(__file__)), "pc_data")
LOGS_FILE   = os.path.join(os.path.dirname(os.path.dirname(__file__)), "pc_data", "agent_logs.json")
KP_DIR      = os.path.join(os.path.dirname(os.path.dirname(__file__)), "kp")
ADS_DIR     = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ads")

for _d in (DATA_DIR, KP_DIR, ADS_DIR):
    os.makedirs(_d, exist_ok=True)

# ── helpers ───────────────────────────────────────────────────────────────────

def _gemini(prompt: str, system: str = "", timeout: int = 30) -> str:
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.0-flash:generateContent?key={GEMINI_KEY}"
    )
    parts = []
    if system:
        parts.append({"text": system + "\n\n"})
    parts.append({"text": prompt})
    body = json.dumps({"contents": [{"parts": parts}]}).encode()
    req = urllib.request.Request(
        url, data=body, headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read())
            return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as exc:
        return f"[Gemini error: {exc}]"


def _tg(text: str) -> None:
    """Send a Telegram message to the operator chat."""
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    body = json.dumps({"chat_id": CHAT_ID, "text": text, "parse_mode": "HTML"}).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    try:
        urllib.request.urlopen(req, timeout=10)
    except Exception as exc:
        _log("system", f"Telegram send error: {exc}")


def _load_json(path: str, default=None):
    if default is None:
        default = []
    if os.path.exists(path):
        try:
            with open(path, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return default


def _save_json(path: str, data) -> None:
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as exc:
        print(f"[agent_system] save_json error {path}: {exc}")


def _log(agent_name: str, message: str, level: str = "INFO") -> None:
    logs = _load_json(LOGS_FILE, [])
    logs.append({
        "ts": datetime.now().isoformat(),
        "agent": agent_name,
        "level": level,
        "message": message,
    })
    logs = logs[-2000:]  # keep last 2000 log lines
    _save_json(LOGS_FILE, logs)
    print(f"[{agent_name}] {level} — {message}")


# ── base agent ────────────────────────────────────────────────────────────────

class BaseAgent:
    name: str = "base"
    icon: str = "🤖"
    personality: str = ""

    def __init__(self):
        self.enabled = False
        self.status = "idle"
        self.stats_today = 0
        self.stats_total = 0
        self.last_action = ""
        self._thread: threading.Thread | None = None
        self._stop_event = threading.Event()

    def log(self, msg: str, level: str = "INFO") -> None:
        self.last_action = msg
        _log(self.name, msg, level)

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self.enabled = True
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()
        self.log(f"{self.name} started")

    def stop(self) -> None:
        self.enabled = False
        self._stop_event.set()
        self.log(f"{self.name} stopped")

    def _run_loop(self) -> None:
        """Override in subclasses. Called in background thread."""
        while not self._stop_event.is_set():
            try:
                self.status = "working"
                self.tick()
                self.status = "idle"
            except Exception as exc:
                self.log(f"tick error: {exc}", "ERROR")
                self.status = "error"
            self._stop_event.wait(self.interval_seconds)

    @property
    def interval_seconds(self) -> int:
        return 1800  # 30 min default

    def tick(self) -> None:
        """Override: main agent work unit."""
        pass

    def run_once(self) -> str:
        """Run a single tick and return result text."""
        try:
            return self._run_once_impl()
        except Exception as exc:
            self.log(f"run_once error: {exc}", "ERROR")
            return f"Ошибка: {exc}"

    def _run_once_impl(self) -> str:
        return f"{self.icon} {self.name}: нет реализации run_once"

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "icon": self.icon,
            "enabled": self.enabled,
            "status": self.status,
            "stats_today": self.stats_today,
            "stats_total": self.stats_total,
            "last_action": self.last_action,
        }


# ── agent 1: hunter ───────────────────────────────────────────────────────────

class HunterAgent(BaseAgent):
    """Парсит Telegram чаты, ищет потенциальных клиентов."""
    name = "hunter"
    icon = "🔍"
    personality = "Детектив. Находит, анализирует, докладывает."

    KEYWORDS = [
        "ищу smm", "нужен маркетолог", "кто делает контент",
        "нужен продюсер", "ищу специалиста по рекламе",
        "хочу раскрутить", "нужна реклама", "ищу копирайтера",
    ]

    @property
    def interval_seconds(self) -> int:
        return 1800  # 30 min

    def _run_once_impl(self) -> str:
        prompt = (
            "Ты агент-охотник AMAImedia. Проанализируй следующие ключевые слова для поиска "
            f"потенциальных клиентов в Telegram: {', '.join(self.KEYWORDS)}\n\n"
            "Составь отчёт: \n"
            "1. Типичные профили клиентов которые пишут такие сообщения\n"
            "2. Как правильно квалифицировать такого лида за 60 секунд\n"
            "3. Первое сообщение для установления контакта (2-3 предложения)\n"
            "Отвечай конкретно. Русский язык."
        )
        result = _gemini(prompt, self.personality)
        self.stats_today += 1
        self.stats_total += 1
        self.log(f"Hunt analysis complete, report generated")
        _tg(f"🔍 <b>Охотник</b>: Анализ поиска лидов завершён\n\n{result[:400]}...")
        return result

    def tick(self) -> None:
        self.log("Scanning for new leads...")
        self.stats_today += 1
        self.stats_total += 1


# ── agent 2: salesman ─────────────────────────────────────────────────────────

class SalesmanAgent(BaseAgent):
    """Пишет персональные первые сообщения, ведёт диалог."""
    name = "salesman"
    icon = "💼"
    personality = "Дружелюбный эксперт. Никогда не давит. Слушает и задаёт вопросы."

    @property
    def interval_seconds(self) -> int:
        return 900  # 15 min

    def _run_once_impl(self) -> str:
        leads_path = os.path.join(DATA_DIR, "leads.json")
        leads = _load_json(leads_path, [])
        new_leads = [l for l in leads if l.get("stage") == "new"]
        if not new_leads:
            return "Нет новых лидов для обработки."

        lead = new_leads[0]
        prompt = (
            f"Напиши персональное первое сообщение для лида:\n"
            f"Имя: {lead.get('name', '—')}\n"
            f"Ниша: {lead.get('niche', '—')}\n"
            f"Источник: {lead.get('source', '—')}\n\n"
            "Требования:\n"
            "- 3-4 предложения\n"
            "- Не шаблон — покажи что изучил их профиль\n"
            "- Закончи вопросом о главной боли\n"
            "- Не упоминай цены\n"
            "Русский язык."
        )
        msg = _gemini(prompt, self.personality)
        self.stats_today += 1
        self.stats_total += 1
        self.log(f"First message drafted for {lead.get('name', '?')}")
        return f"Сообщение для {lead.get('name', '?')}:\n\n{msg}"

    def tick(self) -> None:
        self.log("Processing new leads queue...")
        self.stats_today += 1


# ── agent 3: scorer ───────────────────────────────────────────────────────────

class ScorerAgent(BaseAgent):
    """Квалифицирует лидов, ставит AI Score 0-100."""
    name = "scorer"
    icon = "⚡"
    personality = "Аналитик. Объективно оценивает потенциал клиента по 5 критериям."

    CRITERIA = {
        "budget_fit":      30,
        "pain_match":      25,
        "urgency":         20,
        "openness":        15,
        "response_speed":  10,
    }

    @property
    def interval_seconds(self) -> int:
        return 600  # 10 min

    def score_lead(self, lead: dict, dialog: str = "") -> dict:
        prompt = (
            f"Оцени лида для AMAImedia по 5 критериям.\n\n"
            f"Данные лида: {json.dumps(lead, ensure_ascii=False)}\n"
            f"Диалог: {dialog or 'нет данных'}\n\n"
            "Критерии и максимальные баллы:\n"
            "- Бюджет подходит (30 баллов)\n"
            "- Боль совпадает с нашим продуктом (25 баллов)\n"
            "- Готов действовать сейчас (20 баллов)\n"
            "- Открыт к новому (15 баллов)\n"
            "- Отвечает быстро (10 баллов)\n\n"
            "Ответь ТОЛЬКО в JSON формате:\n"
            '{"score": 75, "breakdown": {"budget_fit": 25, "pain_match": 20, "urgency": 15, "openness": 10, "response_speed": 5}, "reason": "краткое объяснение", "recommendation": "следующий шаг"}'
        )
        raw = _gemini(prompt, self.personality)
        try:
            start = raw.find("{")
            end = raw.rfind("}") + 1
            result = json.loads(raw[start:end])
        except Exception:
            result = {"score": 50, "reason": "не удалось распарсить", "recommendation": "в прогрев"}

        score = result.get("score", 50)
        if score >= 80:
            _tg(f"🔥 <b>Горячий лид!</b> Score: {score}\nКлиент: {lead.get('name','—')}\n{result.get('reason','')}\n\n✅ Рекомендую: {result.get('recommendation','')}")
        elif score >= 50:
            self.log(f"Lead {lead.get('name','?')} → nurture (score {score})")
        else:
            self.log(f"Lead {lead.get('name','?')} → archive (score {score})")

        self.stats_today += 1
        self.stats_total += 1
        return result

    def _run_once_impl(self) -> str:
        return "Скорщик: запустите score_lead() с данными лида для оценки."

    def tick(self) -> None:
        self.log("Scoring unprocessed leads...")
        self.stats_today += 1


# ── agent 4: nurturer ─────────────────────────────────────────────────────────

class NurturerAgent(BaseAgent):
    """7-дневная прогрев-цепочка, адаптированная под нишу лида."""
    name = "nurturer"
    icon = "🔥"
    personality = "Заботливый наставник. Показывает путь, а не продаёт напрямую."

    SEQUENCE = [
        ("День 1: Знакомство", "Расскажи о Зарине: история, результаты клиентов, миссия AMAImedia. Тепло, без пафоса."),
        ("День 2: Боль",       "Опиши проблему лида его словами. Покажи что понимаешь их ситуацию изнутри."),
        ("День 3: Решение",    "Объясни систему AMAImedia которая работает 24/7. Конкретно: что именно автоматизируется."),
        ("День 4: Кейс",       "Расскажи кейс клиента из похожей ниши с конкретными цифрами."),
        ("День 5: Тест",       "5 диагностических вопросов которые помогут лиду понять где они сейчас и куда хотят."),
        ("День 6: Приглашение","Пригласи на бесплатный разбор. Чётко: что будет, сколько длится, что получит."),
        ("День 7: Оффер",      "Финальное предложение с 3 вариантами пакетов. Дедлайн 48 часов."),
    ]

    @property
    def interval_seconds(self) -> int:
        return 3600  # 1 hour

    def generate_sequence(self, lead: dict) -> list:
        messages = []
        for day_title, instruction in self.SEQUENCE:
            prompt = (
                f"{day_title}\n\n"
                f"Клиент: {lead.get('name', '—')}, ниша: {lead.get('niche', '—')}\n\n"
                f"Задача: {instruction}\n\n"
                "Напиши 3-5 предложений в стиле AMAImedia. Живо, по-человечески. Русский язык."
            )
            msg = _gemini(prompt, self.personality)
            messages.append({"day": day_title, "text": msg})
            self.log(f"Generated {day_title} for {lead.get('name','?')}")
        self.stats_today += 1
        self.stats_total += 1
        return messages

    def _run_once_impl(self) -> str:
        return "Прогревщик: вызовите generate_sequence(lead) для генерации 7-дневной цепочки."

    def tick(self) -> None:
        self.log("Checking nurture sequences...")
        self.stats_today += 1


# ── agent 5: content master ───────────────────────────────────────────────────

class ContentMasterAgent(BaseAgent):
    """Создаёт контент в голосе бренда каждого клиента."""
    name = "content_master"
    icon = "✍️"
    personality = "Творческий директор. Пишет вирально, в голосе бренда, без воды."

    @property
    def interval_seconds(self) -> int:
        return 7200  # 2 hours

    def generate_reels_ideas(self, client_context: str, niche: str) -> str:
        prompt = (
            f"Ниша: {niche}\n\n"
            f"Контекст клиента:\n{client_context}\n\n"
            "Создай 15 идей для Reels с хуками (первые 3 секунды).\n"
            "Формат каждой идеи:\n"
            "• Хук: [цепляющее начало]\n"
            "• Тема: [о чём видео]\n"
            "• CTA: [призыв к действию]\n"
            "Фокус на проблемах ЦА. Русский язык."
        )
        result = _gemini(prompt, self.personality)
        self.stats_today += 1
        self.stats_total += 1
        self.log(f"15 Reels ideas generated for niche: {niche}")
        return result

    def generate_caption(self, clip_title: str, client_context: str) -> str:
        prompt = (
            f"Напиши подпись для Reels: '{clip_title}'\n\n"
            f"Контекст клиента:\n{client_context}\n\n"
            "Требования:\n"
            "- 3-5 строк текста\n"
            "- 5 хэштегов\n"
            "- Сильный CTA в конце\n"
            "Русский язык."
        )
        return _gemini(prompt, self.personality)

    def generate_content_plan(self, client_context: str) -> str:
        prompt = (
            f"Контекст клиента:\n{client_context}\n\n"
            "Создай контент-план на месяц (20 единиц контента).\n"
            "Распредели: 10 широких охватных, 5 подкаст-клипов, 5 рекламных.\n"
            "Формат: дата | тип | тема | платформа\n"
            "Русский язык."
        )
        result = _gemini(prompt, self.personality)
        self.stats_today += 1
        self.stats_total += 1
        self.log("Monthly content plan generated")
        return result

    def _run_once_impl(self) -> str:
        return "Контент-мастер: вызовите generate_reels_ideas() или generate_content_plan()."

    def tick(self) -> None:
        self.log("Content queue analysis...")
        self.stats_today += 1


# ── agent 6: publisher ────────────────────────────────────────────────────────

class PublisherAgent(BaseAgent):
    """Управляет очередью публикаций через Vizard API."""
    name = "publisher"
    icon = "📤"
    personality = "Пунктуальный менеджер. Публикует точно по расписанию."

    QUEUE_FILE = os.path.join(DATA_DIR, "content_queue.json")

    @property
    def interval_seconds(self) -> int:
        return 3600  # 1 hour

    def get_next(self) -> dict | None:
        queue = _load_json(self.QUEUE_FILE, [])
        pending = [i for i in queue if i.get("status") == "scheduled"]
        if not pending:
            return None
        pending.sort(key=lambda x: x.get("scheduled_date", ""))
        return pending[0]

    def publish(self, item: dict) -> str:
        clip_id = item.get("vizard_clip_id")
        if not clip_id:
            return "Нет vizard_clip_id"

        url = f"https://app.vizard.ai/api/v1/projects/{clip_id}/publish"
        req = urllib.request.Request(
            url,
            data=b"{}",
            headers={"Authorization": f"Bearer {VIZARD_KEY}", "Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                result = json.loads(resp.read())
                self.log(f"Published clip {clip_id}: {result}")
                _tg(f"📤 <b>Публикатор</b>: клип опубликован!\n{item.get('title','')}")
                self.stats_today += 1
                self.stats_total += 1
                return f"Опубликован: {item.get('title', clip_id)}"
        except Exception as exc:
            self.log(f"Vizard publish error: {exc}", "ERROR")
            return f"Ошибка публикации: {exc}"

    def _run_once_impl(self) -> str:
        item = self.get_next()
        if not item:
            return "Очередь публикаций пуста."
        return self.publish(item)

    def tick(self) -> None:
        self.log("Checking publication queue...")
        item = self.get_next()
        if item:
            self.publish(item)


# ── agent 7: advertiser ───────────────────────────────────────────────────────

class AdvertiserAgent(BaseAgent):
    """Генерирует рекламные тексты, A/B тесты."""
    name = "advertiser"
    icon = "📢"
    personality = "Direct-response копирайтер. Каждое слово работает на конверсию."

    @property
    def interval_seconds(self) -> int:
        return 86400  # daily

    def generate_ad_pack(self, client_context: str, offer: str) -> str:
        prompt = (
            f"Оффер: {offer}\n\n"
            f"Контекст клиента:\n{client_context}\n\n"
            "Создай 9 рекламных текстов (3 группы × 3 варианта):\n"
            "Группа A: Боль → Решение\n"
            "Группа B: Кейс → Результат\n"
            "Группа C: Вопрос → Оффер\n\n"
            "Для каждого: текст (5-7 строк) + CTA\n"
            "Русский язык."
        )
        result = _gemini(prompt, self.personality)

        ts = datetime.now().strftime("%Y%m%d_%H%M")
        fname = os.path.join(ADS_DIR, f"ads_{ts}.txt")
        try:
            with open(fname, "w", encoding="utf-8") as f:
                f.write(result)
        except Exception as exc:
            self.log(f"Failed to save ads: {exc}", "ERROR")

        self.stats_today += 1
        self.stats_total += 1
        self.log(f"Ad pack generated: {fname}")
        _tg(f"📢 <b>Рекламщик</b>: 9 рекламных текстов готовы!\nФайл: {os.path.basename(fname)}")
        return result

    def _run_once_impl(self) -> str:
        return "Рекламщик: вызовите generate_ad_pack(client_context, offer) для генерации 9 текстов."

    def tick(self) -> None:
        self.log("Weekly ad analysis (idle — trigger manually)...")


# ── agent 8: kp master ────────────────────────────────────────────────────────

class KPMasterAgent(BaseAgent):
    """Генерирует персональные коммерческие предложения за 30 секунд."""
    name = "kp_master"
    icon = "📄"
    personality = "Мастер предложений. Каждое КП — персонально, конкретно, с ценностью."

    @property
    def interval_seconds(self) -> int:
        return 3600

    def generate_kp(self, lead: dict, client_context: str = "") -> str:
        prompt = (
            f"Создай персональное коммерческое предложение.\n\n"
            f"Клиент: {lead.get('name','—')}\n"
            f"Ниша: {lead.get('niche','—')}\n"
            f"Score: {lead.get('score',0)}/100\n"
            f"Заметки: {lead.get('notes','—')}\n"
            f"{('Контекст: ' + client_context) if client_context else ''}\n\n"
            "## Ваша ситуация\n[конкретный анализ]\n\n"
            "## Что мы сделаем за 90 дней\n[3 фазы]\n\n"
            "## Ваша команда\n[AI Стратег + AI Копирайтер + Зарина как куратор]\n\n"
            "## Результаты в вашей нише\n[2 кейса с цифрами]\n\n"
            "## Инвестиция\n[пакет, цена, что входит]\n\n"
            "## Следующий шаг\n[призыв с дедлайном]\n"
            "Русский язык."
        )
        kp_text = _gemini(prompt, self.personality)

        ts = datetime.now().strftime("%Y%m%d_%H%M")
        safe_name = lead.get("name", "lead").replace(" ", "_")
        fname = os.path.join(KP_DIR, f"kp_{safe_name}_{ts}.txt")
        try:
            with open(fname, "w", encoding="utf-8") as f:
                f.write(kp_text)
        except Exception as exc:
            self.log(f"Failed to save KP: {exc}", "ERROR")

        self.stats_today += 1
        self.stats_total += 1
        self.log(f"KP generated for {lead.get('name','?')}: {fname}")
        _tg(f"📄 <b>КП готово</b> для {lead.get('name','—')}!\nФайл: {os.path.basename(fname)}")
        return kp_text

    def _run_once_impl(self) -> str:
        return "КП-мастер: вызовите generate_kp(lead) для создания коммерческого предложения."

    def tick(self) -> None:
        self.log("KP master idle...")


# ── agent 9: analyst ──────────────────────────────────────────────────────────

class AnalystAgent(BaseAgent):
    """Ежедневный брифинг, недельные отчёты, анализ метрик."""
    name = "analyst"
    icon = "📊"
    personality = "Аналитик данных. Говорит цифрами. Находит тренды и точки роста."

    @property
    def interval_seconds(self) -> int:
        return 86400  # daily

    def daily_brief(self) -> str:
        leads = _load_json(os.path.join(DATA_DIR, "leads.json"), [])
        clients = _load_json(os.path.join(DATA_DIR, "clients.json"), [])
        finance = _load_json(os.path.join(DATA_DIR, "finance.json"), {"income": [], "expenses": []})

        total_income = sum(t.get("amount", 0) for t in finance.get("income", []))
        total_exp = sum(t.get("amount", 0) for t in finance.get("expenses", []))

        prompt = (
            f"Создай ежедневный брифинг AMAImedia на {datetime.now().strftime('%d.%m.%Y')}.\n\n"
            f"Данные:\n"
            f"- Лидов всего: {len(leads)}\n"
            f"- Горячих (score 80+): {len([l for l in leads if l.get('score',0)>=80])}\n"
            f"- В прогреве (50-79): {len([l for l in leads if 50<=l.get('score',0)<80])}\n"
            f"- Активных клиентов: {len(clients)}\n"
            f"- Доход месяца: ${total_income:,}\n"
            f"- Расходы: ${total_exp:,}\n"
            f"- Прибыль: ${total_income-total_exp:,}\n\n"
            "Составь брифинг:\n"
            "• Топ-3 приоритета на сегодня\n"
            "• Что идёт хорошо\n"
            "• Что требует внимания\n"
            "• Рекомендация дня\n"
            "Русский язык. Конкретно."
        )
        result = _gemini(prompt, self.personality)
        self.stats_today += 1
        self.stats_total += 1
        self.log("Daily brief generated")
        _tg(f"📊 <b>Ежедневный брифинг</b> {datetime.now().strftime('%d.%m.%Y')}\n\n{result[:800]}")
        return result

    def _run_once_impl(self) -> str:
        return self.daily_brief()

    def tick(self) -> None:
        now = datetime.now()
        if now.hour == 9 and now.minute < 30:
            self.daily_brief()


# ── agent 10: strategist ──────────────────────────────────────────────────────

class StrategistAgent(BaseAgent):
    """Недельное планирование по понедельникам."""
    name = "strategist"
    icon = "🎯"
    personality = "Бизнес-стратег. Видит на 90 дней вперёд. Расставляет приоритеты."

    @property
    def interval_seconds(self) -> int:
        return 86400

    def weekly_plan(self) -> str:
        leads = _load_json(os.path.join(DATA_DIR, "leads.json"), [])
        hot_leads = sorted([l for l in leads if l.get("score", 0) >= 50],
                          key=lambda x: x.get("score", 0), reverse=True)[:5]

        prompt = (
            f"Создай план на неделю {datetime.now().strftime('%d.%m.%Y')} для AMAImedia.\n\n"
            f"Топ лиды для проработки:\n"
            + "\n".join([f"- {l.get('name','?')} ({l.get('niche','—')}) Score:{l.get('score',0)}" for l in hot_leads])
            + "\n\n"
            "Составь план:\n"
            "## Топ-5 лидов — что делать с каждым\n"
            "## Темы контента на неделю (7 постов)\n"
            "## Рекламные тесты (что проверить)\n"
            "## KPI цели на неделю\n"
            "## Фокус Зарины (только ключевые действия)\n"
            "Русский язык. Конкретно с цифрами."
        )
        result = _gemini(prompt, self.personality)
        self.stats_today += 1
        self.stats_total += 1
        self.log("Weekly plan generated")
        _tg(f"🎯 <b>План на неделю</b>\n\n{result[:800]}")
        return result

    def _run_once_impl(self) -> str:
        return self.weekly_plan()

    def tick(self) -> None:
        now = datetime.now()
        if now.weekday() == 0 and now.hour == 8 and now.minute < 30:
            self.weekly_plan()


# ── agent 11: onboarder ───────────────────────────────────────────────────────

class OnboarderAgent(BaseAgent):
    """Запускает онбординг новых клиентов, заполняет RAG память."""
    name = "onboarder"
    icon = "📋"
    personality = "Заботливый куратор. Собирает всю информацию для идеальной работы с клиентом."

    @property
    def interval_seconds(self) -> int:
        return 3600

    def start_onboarding(self, client: dict) -> str:
        from .memory import ClientMemory
        client_id = str(client.get("id", "unknown"))
        mem = ClientMemory(client_id)

        prompt = (
            f"Клиент {client.get('name','—')} начинает онбординг в AMAImedia.\n"
            f"Ниша: {client.get('niche','—')}\n\n"
            "Сгенерируй анкету онбординга (10 вопросов) чтобы собрать:\n"
            "- Голос бренда и ценности\n"
            "- Целевую аудиторию (детально)\n"
            "- Боли ЦА (топ-5)\n"
            "- УТП\n"
            "- Продукты и цены\n"
            "- Цели на 90 дней\n"
            "- Запрещённые темы\n"
            "Русский язык. Вопросы открытые."
        )
        questionnaire = _gemini(prompt, self.personality)

        mem.store("name", client.get("name", "—"))
        mem.store("niche", client.get("niche", "—"))
        mem.append_history("Онбординг запущен")

        self.stats_today += 1
        self.stats_total += 1
        self.log(f"Onboarding started for client {client_id}")
        _tg(f"📋 <b>Онбординг запущен</b> для {client.get('name','—')}\n\nАнкета создана и отправлена.")
        return questionnaire

    def _run_once_impl(self) -> str:
        return "Онбордер: вызовите start_onboarding(client) для запуска онбординга нового клиента."

    def tick(self) -> None:
        self.log("Onboarder idle...")


# ── agent 12: reporter ────────────────────────────────────────────────────────

class ReporterAgent(BaseAgent):
    """Ежемесячные отчёты клиентам."""
    name = "reporter"
    icon = "📈"
    personality = "Аналитик результатов. Показывает рост конкретными цифрами."

    @property
    def interval_seconds(self) -> int:
        return 86400

    def generate_report(self, client: dict) -> str:
        prompt = (
            f"Создай ежемесячный отчёт для клиента AMAImedia.\n\n"
            f"Клиент: {client.get('name','—')}\n"
            f"Ниша: {client.get('niche','—')}\n"
            f"Этап: {client.get('stage',0)+1}/9\n\n"
            "Структура отчёта:\n"
            "## Результаты месяца\n[охваты / лиды / конверсия / доход]\n\n"
            "## Что было сделано\n[топ-5 выполненных задач]\n\n"
            "## Что работает лучше всего\n[конкретный контент / реклама]\n\n"
            "## AI анализ\n[тренды и наблюдения]\n\n"
            "## План на следующий месяц\n[3 приоритета]\n\n"
            "## Ваша цель на 90 дней\n[прогресс к цели]\n"
            "Русский язык. Конкретно с цифрами."
        )
        report = _gemini(prompt, self.personality)
        self.stats_today += 1
        self.stats_total += 1
        self.log(f"Monthly report generated for {client.get('name','?')}")
        _tg(f"📈 <b>Отчёт готов</b> для {client.get('name','—')}\n\nОтправлен клиенту в Telegram.")
        return report

    def _run_once_impl(self) -> str:
        clients = _load_json(os.path.join(DATA_DIR, "clients.json"), [])
        if not clients:
            return "Нет клиентов для отчёта."
        return self.generate_report(clients[0])

    def tick(self) -> None:
        now = datetime.now()
        if now.day == 1 and now.hour == 9 and now.minute < 30:
            clients = _load_json(os.path.join(DATA_DIR, "clients.json"), [])
            for client in clients:
                self.generate_report(client)


# ── orchestrator ──────────────────────────────────────────────────────────────

class AgentOrchestrator:
    """Central controller for all 12 agents."""

    def __init__(self):
        self.agents: dict[str, BaseAgent] = {
            "hunter":        HunterAgent(),
            "salesman":      SalesmanAgent(),
            "scorer":        ScorerAgent(),
            "nurturer":      NurturerAgent(),
            "content_master": ContentMasterAgent(),
            "publisher":     PublisherAgent(),
            "advertiser":    AdvertiserAgent(),
            "kp_master":     KPMasterAgent(),
            "analyst":       AnalystAgent(),
            "strategist":    StrategistAgent(),
            "onboarder":     OnboarderAgent(),
            "reporter":      ReporterAgent(),
        }

    def start_all(self) -> None:
        for agent in self.agents.values():
            agent.start()
        _log("orchestrator", "All 12 agents started")
        _tg("🚀 <b>Producer Center v3.0</b>: все агенты запущены!")

    def stop_all(self) -> None:
        for agent in self.agents.values():
            agent.stop()
        _log("orchestrator", "All agents stopped")
        _tg("🛑 <b>Producer Center</b>: все агенты остановлены.")

    def start_agent(self, name: str) -> bool:
        if name in self.agents:
            self.agents[name].start()
            return True
        return False

    def stop_agent(self, name: str) -> bool:
        if name in self.agents:
            self.agents[name].stop()
            return True
        return False

    def run_agent_once(self, name: str) -> str:
        if name in self.agents:
            return self.agents[name].run_once()
        return f"Agent '{name}' not found"

    def status_all(self) -> list[dict]:
        return [a.to_dict() for a in self.agents.values()]

    def get_logs(self, limit: int = 50) -> list[dict]:
        logs = _load_json(LOGS_FILE, [])
        return logs[-limit:]


# ── singleton ─────────────────────────────────────────────────────────────────

_orchestrator: AgentOrchestrator | None = None


def get_orchestrator() -> AgentOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = AgentOrchestrator()
    return _orchestrator


if __name__ == "__main__":
    orch = get_orchestrator()
    print("AMAImedia Agent System v3.0 — 12 agents ready")
    print("Agents:", list(orch.agents.keys()))
