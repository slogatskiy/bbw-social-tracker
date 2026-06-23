"""Shared helpers for BBW tracker collectors."""
from __future__ import annotations
import json, os, datetime as dt
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "docs" / "data"

UA = "bbw-social-tracker/0.1 (research; github.com/<your-handle>/bbw-social-tracker)"


def read_json(name: str) -> dict:
    return json.loads((DATA / name).read_text())


def write_json(name: str, obj: dict) -> None:
    obj.setdefault("last_updated", dt.date.today().isoformat())
    (DATA / name).write_text(json.dumps(obj, indent=2) + "\n")
    print(f"wrote {DATA / name}")


def merge_series(series: list[dict], new_points: list[dict], key: str = "date") -> list[dict]:
    """Merge new points into a series, de-duplicating by `key` (new wins), sorted."""
    by_key = {p[key]: p for p in series}
    for p in new_points:
        by_key[p[key]] = p
    return sorted(by_key.values(), key=lambda p: p[key])
