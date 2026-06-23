"""Ingest Google Trends CSV export(s) into docs/data/google_trends.json.

Google blocks automated Trends access, so we export by hand (30 seconds):
  1. Go to https://trends.google.com/trends/explore?geo=US&q=Build-A-Bear,Build-A-Bear%20Pokemon
  2. Set the time range (e.g. 2021-now) and region (United States).
  3. Click the download (⬇) icon on the "Interest over time" panel.
  4. Save the file into  data_raw/  (create it next to this repo root).

Run:  python scripts/ingest_google_trends.py
It reads every *.csv in data_raw/ that looks like a Trends "multiTimeline" export.
"""
from __future__ import annotations
import csv, sys
from pathlib import Path
from _common import ROOT, write_json

RAW = ROOT / "data_raw"


def parse_trends_csv(path: Path):
    """Return (queries, rows) from a Google Trends multiTimeline.csv export."""
    lines = [ln for ln in path.read_text().splitlines() if ln.strip()]
    # find the header row: starts with "Month" or "Week" or "Day"
    hdr_idx = next((i for i, ln in enumerate(lines)
                    if ln.split(",")[0].strip().strip('"') in ("Month", "Week", "Day")), None)
    if hdr_idx is None:
        return None, None
    reader = list(csv.reader(lines[hdr_idx:]))
    header = reader[0]
    # column names look like "Build-A-Bear: (United States)" -> strip the suffix
    queries = [h.split(":")[0].strip() for h in header[1:]]
    rows = []
    for r in reader[1:]:
        if not r or not r[0]:
            continue
        date = r[0][:7]  # YYYY-MM
        rec = {"date": date}
        for q, v in zip(queries, r[1:]):
            v = v.strip().replace("<1", "0")
            rec[q] = int(v) if v.isdigit() else None
        rows.append(rec)
    return queries, rows


def main() -> int:
    if not RAW.exists():
        print(f"Create {RAW} and drop Google Trends CSV exports there.")
        return 1
    csvs = sorted(RAW.glob("*.csv"))
    if not csvs:
        print(f"No CSV files in {RAW}.")
        return 1

    all_queries, merged = [], {}
    for path in csvs:
        queries, rows = parse_trends_csv(path)
        if not queries:
            print(f"  skipped (not a Trends export): {path.name}")
            continue
        print(f"  {path.name}: {len(rows)} rows, queries={queries}")
        for q in queries:
            if q not in all_queries:
                all_queries.append(q)
        for rec in rows:
            merged.setdefault(rec["date"], {"date": rec["date"]}).update(rec)

    if not merged:
        print("Nothing ingested.")
        return 1

    series = [merged[d] for d in sorted(merged)]
    write_json("google_trends.json", {
        "signal": "google_trends",
        "geo": "US",
        "unit": "search interest (0-100)",
        "source": "Google Trends — manual CSV export (trends.google.com)",
        "is_illustrative": False,
        "note": "Live: ingested from Google Trends CSV export.",
        "queries": all_queries,
        "series": series,
    })
    print(f"ingested {len(series)} rows across {len(all_queries)} queries.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
