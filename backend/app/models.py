from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import SQLModel, Field


class Location(str, Enum):
    atrium = "atrium"
    outside = "outside"


class ReportCategory(str, Enum):
    too_hot = "too_hot"
    too_noisy = "too_noisy"
    too_bright = "too_bright"
    too_dark = "too_dark"
    comfortable = "comfortable"
    other = "other"


class ReportStatus(str, Enum):
    open = "open"
    resolved = "resolved"


class Reading(SQLModel, table=True):
    """Одно измерение датчика в определённый момент времени."""

    id: Optional[int] = Field(default=None, primary_key=True)
    measured_at: datetime = Field(index=True)
    location: Location = Field(index=True)
    temperature: float

    # brightness/noise может отсутствовать у измерений с улицы
    brightness: Optional[str] = None  # категория: "dark" / "normal" / "bright" и т.п.
    noise: Optional[str] = None       # категория: "quiet" / "normal" / "loud" и т.п.


class Report(SQLModel, table=True):
    """Отзыв пользователя о текущих условиях в атриуме."""

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    category: ReportCategory
    comment: Optional[str] = None
    status: ReportStatus = Field(default=ReportStatus.open)


# --- Pydantic-схемы для запросов (чтобы не принимать id/created_at от клиента) ---

class ReportCreate(SQLModel):
    category: ReportCategory
    comment: Optional[str] = None


class ReportUpdate(SQLModel):
    category: Optional[ReportCategory] = None
    comment: Optional[str] = None
    status: Optional[ReportStatus] = None