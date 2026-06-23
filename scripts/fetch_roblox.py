"""Fetch live engagement for the "Build-A-Bear Tycoon" Roblox experience and
update docs/data/roblox.json (current snapshot + appended monthly visit point).

No API keys needed. Run:  python scripts/fetch_roblox.py
"""
from __future__ import annotations
import sys, datetime as dt
import requests
from _common import read_json, write_json, merge_series, UA

PLACE_ID = 11573230049
H = {"User-Agent": UA}


def main() -> int:
    try:
        uid = requests.get(
            f"https://apis.roblox.com/universes/v1/places/{PLACE_ID}/universe",
            headers=H, timeout=30).json()["universeId"]
        g = requests.get(
            f"https://games.roblox.com/v1/games?universeIds={uid}",
            headers=H, timeout=30).json()["data"][0]
    except Exception as e:  # noqa: BLE001
        print(f"Roblox API failed: {type(e).__name__}: {str(e)[:160]}")
        return 1

    visits, playing, favs = g["visits"], g["playing"], g["favoritedCount"]
    print(f"{g['name']}: {visits:,} visits | {playing} playing | {favs:,} favorites")

    data = read_json("roblox.json")
    today = dt.date.today()
    data["current"] = {"visits": visits, "playing": playing,
                       "favorites": favs, "updated": today.isoformat()}
    data["series"] = merge_series(
        data["series"], [{"date": today.strftime("%Y-%m"), "visits": visits, "real": True}], key="date")
    # once we have >=2 real monthly points, the curve is real
    real_pts = [p for p in data["series"] if p.get("real")]
    if len(real_pts) >= 2:
        data["is_illustrative"] = False
        data["note"] = "Cumulative-visits history accumulated live from the Roblox games API."
    write_json("roblox.json", data)
    return 0


if __name__ == "__main__":
    sys.exit(main())
