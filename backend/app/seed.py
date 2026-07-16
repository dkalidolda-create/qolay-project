"""
Импорт данных из result.json (реальный экспорт канала "NU Atrium Temp/Lum") в SQLite.

Формат сообщений:
  Атриум:  "🏫 Atrium: 🌡 29.75ºC  💡 Dark  🔉 Quiet"
  Улица:   "🌆 Outside NU: 🌡 24.0°C"

Запуск:  python -m app.seed
"""

import json
import re
from datetime import datetime
from pathlib import Path

from sqlmodel import Session

from .database import engine, init_db
from .models import Location, Reading

RESULT_JSON_PATH = Path(__file__).parent.parent / "data" / "result.json"

# Нормализация категорий из Telegram-текста в короткие ключи для БД
BRIGHTNESS_MAP = {
    "dark": "dark",
    "dim": "dim",
    "normal brightness": "normal",
    "bright": "bright",
    "very bright": "very_bright",
}
NOISE_MAP = {
    "quiet": "quiet",
    "mild noise": "mild",
    "noisy": "noisy",
    "very noisy": "very_noisy",
}

TEMP_RE = re.compile(r"🌡\s*(-?\d+(?:\.\d+)?)\s*[ºo°]?C")
BRIGHTNESS_RE = re.compile(r"💡\s*([A-Za-z ]+?)\s*🔉")
NOISE_RE = re.compile(r"🔉\s*(.+)$")


def extract_text(msg: dict) -> str:
    text = msg.get("text", "")
    if isinstance(text, list):
        text = "".join(t if isinstance(t, str) else t.get("text", "") for t in text)
    return text


def parse_message(msg: dict) -> dict | None:
    text = extract_text(msg)
    if not text:
        return None

    temp_match = TEMP_RE.search(text)
    if not temp_match:
        return None
    temperature = float(temp_match.group(1))

    if text.startswith("🏫"):
        location = Location.atrium
        b_match = BRIGHTNESS_RE.search(text)
        n_match = NOISE_RE.search(text)
        brightness = BRIGHTNESS_MAP.get(b_match.group(1).strip().lower()) if b_match else None
        noise = NOISE_MAP.get(n_match.group(1).strip().lower()) if n_match else None
    elif text.startswith("🌆"):
        location = Location.outside
        brightness = None
        noise = None
    else:
        return None

    return {
        "temperature": temperature,
        "location": location,
        "brightness": brightness,
        "noise": noise,
    }


def run_seed():
    init_db()

    if not RESULT_JSON_PATH.exists():
        print(f"Файл не найден: {RESULT_JSON_PATH}. Положите result.json в backend/data/")
        return

    with open(RESULT_JSON_PATH, encoding="utf-8") as f:
        raw = json.load(f)

    messages = raw.get("messages", raw if isinstance(raw, list) else [])

    inserted, skipped = 0, 0
    with Session(engine) as session:
        for msg in messages:
            parsed = parse_message(msg)
            if not parsed:
                skipped += 1
                continue

            measured_at = datetime.fromisoformat(msg["date"])

            reading = Reading(
                measured_at=measured_at,
                location=parsed["location"],
                temperature=parsed["temperature"],
                noise=parsed["noise"],
                brightness=parsed["brightness"],
            )
            session.add(reading)
            inserted += 1

        session.commit()

    print(f"Импортировано измерений: {inserted} (пропущено нераспознанных: {skipped})")


if __name__ == "__main__":
    run_seed()