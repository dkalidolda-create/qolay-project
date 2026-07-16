from datetime import date, datetime
from statistics import mean
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from .comfort import calculate_comfort
from .database import get_session, init_db
from .models import Location, Reading, Report, ReportCategory, ReportCreate, ReportStatus, ReportUpdate

app = FastAPI(title="Atrium Pulse API")

# Разрешаем фронтенду (localhost и деплой) стучаться в API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # на деплое лучше сузить до конкретного домена фронтенда
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


# ---------------------------------------------------------------------------
# READINGS
# ---------------------------------------------------------------------------

@app.get("/api/readings")
def list_readings(
    location: Optional[Location] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    noise: Optional[str] = None,
    brightness: Optional[str] = None,
    temp_min: Optional[float] = None,
    temp_max: Optional[float] = None,
    sort_by: str = Query("measured_at", pattern="^(measured_at|temperature)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    limit: int = Query(200, le=1000),
    session: Session = Depends(get_session),
):
    query = select(Reading)

    if location:
        query = query.where(Reading.location == location)
    if date_from:
        query = query.where(Reading.measured_at >= date_from)
    if date_to:
        query = query.where(Reading.measured_at <= date_to)
    if noise:
        query = query.where(Reading.noise == noise)
    if brightness:
        query = query.where(Reading.brightness == brightness)
    if temp_min is not None:
        query = query.where(Reading.temperature >= temp_min)
    if temp_max is not None:
        query = query.where(Reading.temperature <= temp_max)

    sort_col = Reading.measured_at if sort_by == "measured_at" else Reading.temperature
    query = query.order_by(sort_col.desc() if order == "desc" else sort_col.asc())
    query = query.limit(limit)

    return session.exec(query).all()


@app.get("/api/readings/{reading_id}")
def get_reading(reading_id: int, session: Session = Depends(get_session)):
    reading = session.get(Reading, reading_id)
    if not reading:
        raise HTTPException(status_code=404, detail="Reading not found")
    return reading


# ---------------------------------------------------------------------------
# SUMMARY / АНАЛИТИКА
# ---------------------------------------------------------------------------

@app.get("/api/summary")
def get_summary(
    target_date: Optional[date] = None,
    session: Session = Depends(get_session),
):
    """
    Возвращает:
    - последнее измерение атриума + улицы и текстовую оценку комфорта
    - min/max/avg температуру атриума за день
    - собственный аналитический вывод: самое прохладное и самое тихое время
    """
    # последнее измерение атриума
    latest_atrium = session.exec(
        select(Reading).where(Reading.location == Location.atrium).order_by(Reading.measured_at.desc())
    ).first()
    latest_outside = session.exec(
        select(Reading).where(Reading.location == Location.outside).order_by(Reading.measured_at.desc())
    ).first()

    if not latest_atrium:
        raise HTTPException(status_code=404, detail="No readings available yet")

    comfort = calculate_comfort(latest_atrium.temperature, latest_atrium.noise, latest_atrium.brightness)

    # выборка за конкретный день (по умолчанию — день последнего измерения)
    day = target_date or latest_atrium.measured_at.date()
    day_readings = session.exec(
        select(Reading).where(
            Reading.location == Location.atrium,
            Reading.measured_at >= datetime.combine(day, datetime.min.time()),
            Reading.measured_at <= datetime.combine(day, datetime.max.time()),
        )
    ).all()

    if not day_readings:
        raise HTTPException(status_code=404, detail=f"No readings for {day}")

    temps = [r.temperature for r in day_readings]
    coolest = min(day_readings, key=lambda r: r.temperature)

    quiet_readings = [r for r in day_readings if r.noise in ("quiet", "low", "тихо")]
    quietest_hour = quiet_readings[0].measured_at.strftime("%H:%M") if quiet_readings else None

    delta_out_in = None
    if latest_outside:
        delta_out_in = round(latest_atrium.temperature - latest_outside.temperature, 1)

    return {
        "current": {
            "atrium_temperature": latest_atrium.temperature,
            "outside_temperature": latest_outside.temperature if latest_outside else None,
            "brightness": latest_atrium.brightness,
            "noise": latest_atrium.noise,
            "measured_at": latest_atrium.measured_at,
            "comfort_score": comfort.score,
            "comfort_label": comfort.label,
            "comfort_breakdown": comfort.breakdown,
            "delta_outside_inside": delta_out_in,
        },
        "day_stats": {
            "date": day,
            "min_temperature": min(temps),
            "max_temperature": max(temps),
            "avg_temperature": round(mean(temps), 1),
            "coolest_time": coolest.measured_at.strftime("%H:%M"),
            "quietest_time": quietest_hour,
        },
    }


# ---------------------------------------------------------------------------
# REPORTS — полный CRUD
# ---------------------------------------------------------------------------

@app.get("/api/reports")
def list_reports(
    status: Optional[ReportStatus] = None,
    category: Optional[ReportCategory] = None,
    session: Session = Depends(get_session),
):
    query = select(Report)
    if status:
        query = query.where(Report.status == status)
    if category:
        query = query.where(Report.category == category)
    query = query.order_by(Report.created_at.desc())
    return session.exec(query).all()


@app.post("/api/reports", status_code=201)
def create_report(payload: ReportCreate, session: Session = Depends(get_session)):
    report = Report(category=payload.category, comment=payload.comment)
    session.add(report)
    session.commit()
    session.refresh(report)
    return report


@app.get("/api/reports/{report_id}")
def get_report(report_id: int, session: Session = Depends(get_session)):
    report = session.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@app.patch("/api/reports/{report_id}")
def update_report(report_id: int, payload: ReportUpdate, session: Session = Depends(get_session)):
    report = session.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    data = payload.dict(exclude_unset=True)
    for key, value in data.items():
        setattr(report, key, value)

    session.add(report)
    session.commit()
    session.refresh(report)
    return report


@app.delete("/api/reports/{report_id}", status_code=204)
def delete_report(report_id: int, session: Session = Depends(get_session)):
    report = session.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    session.delete(report)
    session.commit()
    return None