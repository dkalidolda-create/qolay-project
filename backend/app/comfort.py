"""
Вся логика "понятных выводов" в одном месте.

ВАЖНО ДЛЯ ПРЕЗЕНТАЦИИ: это НЕ официальный медицинский/санитарный стандарт,
а собственная объяснимая формула команды (см. README.md).

Идея: считаем "штрафы" от 100 баллов по трём измерениям (температура, шум,
освещение) и возвращаем и итоговый score, и разбивку по компонентам —
это и есть "объяснимость", за которую отдельно даются баллы.
"""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ComfortResult:
    score: int                    # 0..100, где 100 — идеально комфортно
    label: str                    # "Комфортно" / "Жарко" / "Очень жарко" и т.п.
    breakdown: dict = field(default_factory=dict)  # {"temperature": -15, "noise": -10, ...}


def _temperature_penalty(temp: float) -> tuple[int, str]:
    """Штраф за температуру. Комфортная зона примерно 20-24°C (можно скорректировать)."""
    if temp is None:
        return 0, ""
    if 20 <= temp <= 24:
        return 0, ""
    if 24 < temp <= 26:
        return -10, "Жарко"
    if temp > 26:
        return -25, "Очень жарко"
    if 18 <= temp < 20:
        return -10, "Прохладно"
    return -25, "Очень холодно"


NOISE_PENALTIES = {
    "quiet": (0, "Тихо"),
    "mild": (-5, ""),
    "noisy": (-20, "Шумно"),
    "very_noisy": (-30, "Очень шумно"),
}

BRIGHTNESS_PENALTIES = {
    "dark": (-15, "Темно"),
    "dim": (-5, ""),
    "normal": (0, ""),
    "bright": (-5, ""),
    "very_bright": (-15, "Слишком ярко"),
}


def _noise_penalty(noise: Optional[str]) -> tuple[int, str]:
    if not noise:
        return 0, ""
    return NOISE_PENALTIES.get(noise.lower(), (0, ""))


def _brightness_penalty(brightness: Optional[str]) -> tuple[int, str]:
    if not brightness:
        return 0, ""
    return BRIGHTNESS_PENALTIES.get(brightness.lower(), (0, ""))


def calculate_comfort(temperature: float, noise: Optional[str], brightness: Optional[str]) -> ComfortResult:
    temp_penalty, temp_label = _temperature_penalty(temperature)
    noise_penalty, noise_label = _noise_penalty(noise)
    bright_penalty, bright_label = _brightness_penalty(brightness)

    score = max(0, 100 + temp_penalty + noise_penalty + bright_penalty)

    # Собираем финальный человеко-читаемый лейбл: приоритет — самому сильному штрафу
    penalties = [
        (temp_penalty, temp_label),
        (noise_penalty, noise_label),
        (bright_penalty, bright_label),
    ]
    penalties.sort(key=lambda p: p[0])  # самый большой (по модулю) штраф первым
    worst = next((label for _, label in penalties if label), None)

    if score >= 85:
        label = "Комфортно"
    elif worst:
        label = worst
    else:
        label = "Нормально"

    return ComfortResult(
        score=score,
        label=label,
        breakdown={
            "temperature": temp_penalty,
            "noise": noise_penalty,
            "brightness": bright_penalty,
        },
    )
