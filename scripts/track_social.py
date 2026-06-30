"""Forward owned-audience tracker.

Appends a REAL, dated reading to docs/data/social_timeseries.json on every run,
so the lines lengthen over time. Nothing is fabricated or back-filled:

  * YouTube  — total channel views + subscribers are fetched LIVE from the
    public channel page (no key). Total views is exact; subscribers is rounded
    by YouTube ("132K"), so it's logged monthly.
  * TikTok / Instagram / Facebook — those platforms block server scraping and
    have no archivable historical counter, so they are logged from values you
    drop into data_raw/social_manual.json, e.g.:
        { "TikTok followers": 840000, "TikTok total likes": 14300000,
          "Instagram followers": 815000, "Facebook followers": 2800000 }
    Read each from the live profile in a browser at refresh time and paste it.
    Entries that are absent are simply skipped (never invented).

Run:  python scripts/track_social.py            (YouTube auto + manual file if present)
Note: YouTube fetch needs an open network. In the Claude sandbox use the
      dangerouslyDisableSandbox path, like the other scrapers.
"""
from __future__ import annotations
import sys, re, json, datetime as dt
import requests
from _common import read_json, write_json, merge_series, ROOT

YT_URL = "https://www.youtube.com/@buildabear/about?hl=en&gl=US"
BROWSER_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/120 Safari/537.36")
H = {"User-Agent": BROWSER_UA, "Cookie": "CONSENT=YES+1"}

MULT = {"K": 1_000, "M": 1_000_000, "B": 1_000_000_000}


def fetch_youtube() -> dict:
    """Return {'views': int, 'subscribers': int} from the live channel page."""
    html = requests.get(YT_URL, headers=H, timeout=40).text
    out: dict = {}
    # exact total channel views — take the largest "N views" (beats per-video counts)
    views = [int(v.replace(",", "")) for v in re.findall(r"([\d,]+) views", html)]
    if views:
        out["views"] = max(views)
    # subscribers, rounded e.g. "132K subscribers"
    m = re.search(r"([\d.]+)([KMB]?) subscribers", html)
    if m:
        out["subscribers"] = int(float(m.group(1)) * MULT.get(m.group(2), 1))
    return out


def append_point(tracked: list[dict], platform: str, metric: str, value: int, date: str) -> bool:
    for t in tracked:
        if t["platform"] == platform and t["metric"] == metric:
            t["points"] = merge_series(t["points"], [{"date": date, "value": int(value)}], key="date")
            print(f"  {platform} {metric}: {value:,} @ {date}")
            return True
    print(f"  ! no series for {platform} {metric} — skipped")
    return False


def main() -> int:
    data = read_json("social_timeseries.json")
    tracked = data["tracked"]
    today = dt.date.today()
    day = today.isoformat()           # YYYY-MM-DD (exact metrics)
    month = today.strftime("%Y-%m")   # YYYY-MM    (rounded metrics)

    # 1) YouTube — live
    try:
        yt = fetch_youtube()
        if yt.get("views"):
            append_point(tracked, "YouTube", "total channel views", yt["views"], day)
        if yt.get("subscribers"):
            append_point(tracked, "YouTube", "subscribers", yt["subscribers"], month)
    except Exception as e:  # noqa: BLE001
        print(f"YouTube fetch failed (logged none, fabricated none): {type(e).__name__}: {str(e)[:140]}")

    # 2) TikTok / Instagram / Facebook — from manual values file, if provided
    manual_path = ROOT / "data_raw" / "social_manual.json"
    if manual_path.exists():
        manual = json.loads(manual_path.read_text())
        for key, value in manual.items():
            if key.startswith("_") or " " not in key or value in (None, "", 0):
                continue
            platform, metric = key.split(" ", 1)
            # each pasted reading is its own dated point (day granularity)
            append_point(tracked, platform, metric, value, day)
    else:
        print(f"(no {manual_path.name}; TikTok/IG/FB left as-is — paste current values there to log them)")

    data["last_updated"] = day
    write_json("social_timeseries.json", data)
    print("done — series lengthened with real readings only.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
