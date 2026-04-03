"""Producer Center — Gemini API"""
import requests, json
from config import GEMINI_KEY

BASE = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

def call_gemini(prompt: str, system: str = "") -> str:
    text = f"{system}\n\n{prompt}" if system else prompt
    try:
        resp = requests.post(
            f"{BASE}?key={GEMINI_KEY}",
            headers={"Content-Type": "application/json"},
            json={"contents":[{"role":"user","parts":[{"text":text}]}],
                  "generationConfig":{"maxOutputTokens":2048}},
            timeout=30
        )
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except requests.exceptions.Timeout:
        return "❌ Timeout. Проверь интернет-соединение."
    except requests.exceptions.HTTPError as e:
        if resp.status_code == 429:
            return "❌ Лимит Gemini API (1500/день). Попробуй завтра."
        return f"❌ HTTP ошибка: {e}"
    except Exception as e:
        return f"❌ Ошибка: {e}"

def build_client_context(client) -> str:
    if not client:
        return "Клиент не выбран."
    p = client.personality or {}
    prods = ", ".join(f"{pr.get('name','?')} ${pr.get('price',0)}" for pr in (client.products or []))
    return (
        f"КЛИЕНТ: {client.name} | Ниша: {client.niche}\n"
        f"Аудитория: {client.audience or '—'} | Что есть: {client.has or '—'}\n"
        f"Соцсети: {client.socials or '—'}\n"
        f"Доход: ${client.income}/мес → Цель: ${client.goal_inc}/мес\n"
        f"Цели: {client.goals or '—'}\n"
        f"Бренд: {p.get('tone','—')} | УТП: {p.get('usp','—')}\n"
        f"Продукты: {prods or 'нет'}"
    )
