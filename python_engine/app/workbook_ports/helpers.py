from __future__ import annotations

from datetime import date, datetime


def num(value: object) -> float:
    try:
        if value is None or value == "":
            return 0.0
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def pct(numerator: float, denominator: float) -> float | None:
    return (numerator / denominator * 100.0) if denominator else None


def safe_ratio(numerator: float, denominator: float) -> float | None:
    return (numerator / denominator) if denominator else None


def round_money(value: float | None) -> float | None:
    if value is None:
        return None
    return round(float(value), 2)


def date_from_value(value: object) -> date | None:
    if isinstance(value, date):
        return value
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y", "%d-%b-%y", "%d-%b-%Y"):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(text).date()
    except ValueError:
        return None


def date_text(value: date | None) -> str | None:
    return value.isoformat() if value else None
