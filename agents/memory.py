"""
NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
Copyright (c) 2026 AMAImedia.com
All rights reserved.
agents/memory.py — RAG ClientMemory system
"""
import json
import os
import urllib.request
import urllib.error
from datetime import datetime

GEMINI_KEY = os.environ.get("GEMINI_KEY", "YOUR_GEMINI_KEY")
MEMORY_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "memory")


def _call_gemini(prompt: str, system: str = "") -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_KEY}"
    parts = []
    if system:
        parts.append({"text": system + "\n\n"})
    parts.append({"text": prompt})
    body = json.dumps({"contents": [{"parts": parts}]}).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
            return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as exc:
        return f"[Gemini error: {exc}]"


class ClientMemory:
    """RAG system — agent remembers everything about a client."""

    SCHEMA = {
        "name": "",
        "niche": "",
        "audience": "",
        "brand_voice": "",
        "pains": "",
        "usp": "",
        "products": [],
        "forbidden_words": [],
        "goals": "",
        "income_goal": 0,
        "socials": "",
        "history": [],
        "updated_at": "",
    }

    def __init__(self, client_id: str | int):
        os.makedirs(MEMORY_DIR, exist_ok=True)
        self.client_id = str(client_id)
        self.path = os.path.join(MEMORY_DIR, f"{self.client_id}.json")
        self.data = self._load()

    # ── persistence ───────────────────────────────────────────────────────────

    def _load(self) -> dict:
        if os.path.exists(self.path):
            try:
                with open(self.path, encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return dict(self.SCHEMA)

    def _save(self) -> None:
        self.data["updated_at"] = datetime.now().isoformat()
        try:
            with open(self.path, "w", encoding="utf-8") as f:
                json.dump(self.data, f, ensure_ascii=False, indent=2)
        except Exception as exc:
            print(f"[memory] save error for {self.client_id}: {exc}")

    # ── public API ────────────────────────────────────────────────────────────

    def store(self, key: str, value) -> None:
        """Save a fact about the client."""
        self.data[key] = value
        self._save()

    def append_history(self, event: str) -> None:
        """Append a timestamped event to client history."""
        self.data.setdefault("history", []).append(
            {"ts": datetime.now().isoformat(), "event": event}
        )
        # keep last 200 events
        self.data["history"] = self.data["history"][-200:]
        self._save()

    def recall(self, query: str) -> str:
        """Find relevant info from memory using Gemini."""
        context = json.dumps(self.data, ensure_ascii=False)
        prompt = (
            f"Из базы знаний клиента найди информацию по запросу: {query}\n\n"
            f"База знаний:\n{context}\n\n"
            f"Дай краткий ответ только по теме запроса."
        )
        return _call_gemini(prompt, "Ты ассистент по поиску в базе знаний клиента.")

    def build_context(self) -> str:
        """Build full context string for AI prompts."""
        d = self.data
        products_str = ", ".join(d.get("products", [])) if isinstance(d.get("products"), list) else str(d.get("products", "—"))
        forbidden_str = ", ".join(d.get("forbidden_words", [])) if isinstance(d.get("forbidden_words"), list) else str(d.get("forbidden_words", "—"))
        return (
            f"КЛИЕНТ: {d.get('name', '—')}\n"
            f"НИША: {d.get('niche', '—')}\n"
            f"АУДИТОРИЯ: {d.get('audience', '—')}\n"
            f"ГОЛОС БРЕНДА: {d.get('brand_voice', '—')}\n"
            f"БОЛИ ЦА: {d.get('pains', '—')}\n"
            f"УТП: {d.get('usp', '—')}\n"
            f"ПРОДУКТЫ: {products_str}\n"
            f"ЦЕЛЬ ДОХОДА: ${d.get('income_goal', 0):,}\n"
            f"ЗАПРЕЩЁННЫЕ СЛОВА: {forbidden_str}\n"
            f"ЦЕЛИ: {d.get('goals', '—')}"
        )

    def update_from_onboarding(self, answers: dict) -> None:
        """Populate memory from onboarding questionnaire answers."""
        mapping = {
            "name": "name",
            "niche": "niche",
            "audience": "audience",
            "brand_voice": "brand_voice",
            "pains": "pains",
            "usp": "usp",
            "products": "products",
            "goals": "goals",
            "income_goal": "income_goal",
            "socials": "socials",
            "forbidden_words": "forbidden_words",
        }
        for src, dst in mapping.items():
            if src in answers:
                self.data[dst] = answers[src]
        self.append_history("Онбординг завершён")
        self._save()

    def generate_brand_content(self, content_type: str) -> str:
        """Generate brand-aware content using client's RAG context."""
        context = self.build_context()
        prompts = {
            "reels_ideas": (
                f"Сгенерируй 15 идей для Reels с хуками.\n"
                f"Пиши в голосе бренда клиента.\n\n{context}"
            ),
            "content_plan": (
                f"Создай контент-план на месяц (20 постов).\n"
                f"Тематики: широкий охват, подкаст, реклама.\n\n{context}"
            ),
            "ad_texts": (
                f"Напиши 9 рекламных текстов (3 группы × 3 варианта).\n"
                f"Форматы: картинка / видео / карусель.\n\n{context}"
            ),
        }
        prompt = prompts.get(content_type, f"Создай контент типа '{content_type}'.\n\n{context}")
        return _call_gemini(prompt, "Ты AI копирайтер. Пиши в голосе бренда клиента. Русский язык.")

    def to_dict(self) -> dict:
        return dict(self.data)


def load_all_memories() -> list[dict]:
    """Load metadata for all client memories."""
    result = []
    if not os.path.exists(MEMORY_DIR):
        return result
    for fname in os.listdir(MEMORY_DIR):
        if fname.endswith(".json"):
            client_id = fname[:-5]
            try:
                mem = ClientMemory(client_id)
                result.append({"client_id": client_id, "name": mem.data.get("name", "—"), "niche": mem.data.get("niche", "—"), "updated_at": mem.data.get("updated_at", "")})
            except Exception:
                pass
    return result
