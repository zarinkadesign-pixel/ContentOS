"""
NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
Copyright (c) 2026 AMAImedia.com
All rights reserved.
D:/Content OS/transcribe.py — Audio/Video transcription + Reels ideas via Gemini
"""
import urllib.request
import json
import os
import sys
import base64
from datetime import datetime

BASE = os.path.dirname(os.path.abspath(__file__))


def _load_env_key(key: str, default: str = "") -> str:
    env_path = os.path.join(BASE, ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith(key + "="):
                        return line.split("=", 1)[1].strip().strip('"').strip("'")
        except Exception:
            pass
    return os.environ.get(key, default)


GEMINI = _load_env_key("GEMINI_KEY", "")


def _gemini_request(body: dict, timeout: int = 120) -> str:
    if not GEMINI:
        raise RuntimeError("GEMINI_KEY not set in .env")
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.0-flash:generateContent?key={GEMINI}"
    )
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data, {"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        result = json.loads(r.read())
    return result["candidates"][0]["content"]["parts"][0]["text"]


def transcribe_with_gemini(audio_path: str) -> str:
    """Transcribe an audio/video file via Gemini multimodal API."""
    print(f"Транскрибирую: {audio_path}")

    with open(audio_path, "rb") as f:
        audio_data = base64.b64encode(f.read()).decode()

    ext = os.path.splitext(audio_path)[1].lower()
    mime_map = {
        ".mp3": "audio/mp3",
        ".mp4": "video/mp4",
        ".wav": "audio/wav",
        ".m4a": "audio/mp4",
        ".ogg": "audio/ogg",
        ".webm": "video/webm",
    }
    mime = mime_map.get(ext, "audio/mp3")

    text = _gemini_request({
        "contents": [{
            "role": "user",
            "parts": [
                {"inline_data": {"mime_type": mime, "data": audio_data}},
                {"text": (
                    "Транскрибируй это аудио на русском языке полностью. "
                    "Сохрани смысл и структуру речи. "
                    "В конце выдели 5 ключевых тем и 3 лучших хука для Reels."
                )},
            ],
        }],
        "generationConfig": {"maxOutputTokens": 4000},
    }, timeout=120)

    out_path = os.path.splitext(audio_path)[0] + "_transcript.txt"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"✓ Транскрипт сохранён: {out_path}")
    return text


def generate_reels_from_transcript(transcript: str, output_path: str = "") -> str:
    """Generate 15 Reels ideas from a transcript using Gemini."""
    print("Генерирую 15 идей для Reels...")

    ideas = _gemini_request({
        "contents": [{
            "role": "user",
            "parts": [{"text": (
                f"Из транскрипта подкаста/выступления создай 15 идей для Reels.\n"
                f"Для каждого укажи:\n"
                f"1. Хук (первые 3 секунды — цепляющая фраза)\n"
                f"2. Основная идея (1 предложение)\n"
                f"3. CTA (призыв к действию)\n"
                f"4. Хэштеги (5 штук)\n\n"
                f"Транскрипт:\n{transcript[:8000]}"
            )}],
        }],
        "generationConfig": {"maxOutputTokens": 3000},
    }, timeout=60)

    if not output_path:
        ts = datetime.now().strftime("%Y%m%d_%H%M")
        output_path = os.path.join(BASE, "pc_data", f"reels_ideas_{ts}.txt")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(ideas)
    print(f"✓ 15 идей для Reels сохранены: {output_path}")
    return ideas


def generate_post_captions(transcript: str) -> str:
    """Generate 5 ready-to-post captions for Instagram/Telegram from a transcript."""
    print("Генерирую готовые подписи к постам...")

    captions = _gemini_request({
        "contents": [{
            "role": "user",
            "parts": [{"text": (
                f"Из транскрипта создай 5 готовых подписей для постов в Instagram и Telegram.\n"
                f"Агентство AMAImedia — продюсерский центр для экспертов.\n"
                f"Стиль: живой, экспертный, с эмодзи. Длина 150-300 символов.\n"
                f"Добавь 5 хэштегов к каждому посту.\n\n"
                f"Транскрипт:\n{transcript[:5000]}"
            )}],
        }],
        "generationConfig": {"maxOutputTokens": 2000},
    }, timeout=60)

    out_path = os.path.join(BASE, "pc_data", "post_captions.txt")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(captions)
    print(f"✓ Подписи сохранены: {out_path}")
    return captions


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Использование: python transcribe.py <путь_к_файлу.mp3>")
        print("Поддерживаемые форматы: .mp3 .mp4 .wav .m4a .ogg .webm")
        sys.exit(1)

    audio_file = sys.argv[1]
    if not os.path.exists(audio_file):
        print(f"Файл не найден: {audio_file}")
        sys.exit(1)

    transcript = transcribe_with_gemini(audio_file)
    print("\n" + "=" * 50)
    generate_reels_from_transcript(transcript)
    generate_post_captions(transcript)
    print("\n✓ Всё готово!")
