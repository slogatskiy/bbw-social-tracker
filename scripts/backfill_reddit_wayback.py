"""Reconstruct r/buildabear subscriber HISTORY from Wayback Machine snapshots of
old.reddit.com and merge it into docs/data/reddit_subscribers.json.

No API keys needed. Run from a normal network connection (archive.org can be slow):
    python scripts/backfill_reddit_wayback.py

This replaces the illustrative seed points with real archived values where found.
"""
from __future__ import annotations
import re, sys, time
import requests
from _common import read_json, write_json, merge_series, UA

SUB = "old.reddit.com/r/buildabear"
HEADERS = {"User-Agent": UA}


def cdx_snapshots(per_year: int = 2) -> list[str]:
    """Return one-or-more snapshot timestamps per ~6 months, 2018-now."""
    url = (
        "https://web.archive.org/cdx/search/cdx?"
        f"url={SUB}&output=json&from=20180101&to=20261231"
        "&collapse=timestamp:6&filter=statuscode:200&limit=60"
    )
    for attempt in range(4):
        try:
            rows = requests.get(url, headers=HEADERS, timeout=90).json()
            return [r[1] for r in rows[1:]]
        except Exception as e:  # noqa: BLE001
            print(f"  CDX attempt {attempt + 1} failed: {type(e).__name__}")
            time.sleep(4)
    return []


SUB_PATTERNS = [
    re.compile(r'"subscribers"\s*:\s*(\d+)'),
    re.compile(r'([\d,]+)\s*</span>\s*<span[^>]*>\s*readers', re.I),
    re.compile(r'subscribers[^\d]{0,40}([\d,]{3,})', re.I),
    re.compile(r'([\d,]{3,})\s*(?:subscribers|readers)', re.I),
]


def parse_subscribers(html: str) -> int | None:
    for pat in SUB_PATTERNS:
        m = pat.search(html)
        if m:
            n = int(m.group(1).replace(",", ""))
            if 100 < n < 5_000_000:
                return n
    return None


def main() -> int:
    stamps = cdx_snapshots()
    if not stamps:
        print("Wayback CDX unreachable. Try again later or from another network.")
        return 1

    # keep at most ~2 snapshots per year to stay polite
    seen, picked = {}, []
    for ts in stamps:
        ym = ts[:6]
        if ym not in seen:
            seen[ym] = ts
            picked.append(ts)

    points = []
    for ts in picked:
        url = f"https://web.archive.org/web/{ts}/https://old.reddit.com/r/buildabear/"
        try:
            html = requests.get(url, headers=HEADERS, timeout=90).text
            subs = parse_subscribers(html)
        except Exception as e:  # noqa: BLE001
            print(f"  {ts}: fetch failed ({type(e).__name__})")
            continue
        if subs:
            month = f"{ts[:4]}-{ts[4:6]}"
            points.append({"date": month, "value": subs, "real": True})
            print(f"  {month}: {subs:,} subscribers")
        time.sleep(1)

    if not points:
        print("No subscriber counts parsed from snapshots.")
        return 1

    data = read_json("reddit_subscribers.json")
    # drop illustrative points, keep only real ones + freshly parsed
    real_existing = [p for p in data["series"] if p.get("real")]
    data["series"] = merge_series(real_existing, points)
    data["is_illustrative"] = False
    data["note"] = "History reconstructed from Wayback Machine snapshots of old.reddit.com."
    write_json("reddit_subscribers.json", data)
    print(f"merged {len(points)} archived points.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
