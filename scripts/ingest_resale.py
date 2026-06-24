"""Ingest documented eBay 'sold' comps into docs/data/resale.json.

eBay does not expose realized sold prices through a free, unauthenticated API,
so resale comps are maintained by hand — the analyst records each documented
sold listing. Keep a CSV at data_raw/resale.csv with the columns:

    item,category,price,date
    "'In Search Of My Melody' (Sanrio)",Sanrio / Hello Kitty,11600,2022-05

Then run:  python scripts/ingest_resale.py
Existing methodology/retail context in resale.json is preserved.
"""
from __future__ import annotations
import csv, sys
from pathlib import Path
from _common import ROOT, read_json, write_json

RAW = ROOT / "data_raw" / "resale.csv"
VALID_CATS = {
    "Sanrio / Hello Kitty", "Limited / Seasonal", "My Little Pony",
    "Zoo / Exclusive", "Licensed / Auto", "Other",
}


def main() -> int:
    if not RAW.exists():
        print(f"Create {RAW} with columns: item,category,price,date")
        return 1
    rows = []
    with RAW.open() as f:
        for r in csv.DictReader(f):
            cat = (r.get("category") or "Other").strip()
            if cat not in VALID_CATS:
                print(f"  note: unrecognized category '{cat}' -> kept as-is")
            rows.append({
                "item": r["item"].strip(),
                "category": cat,
                "price": int(float(r["price"])),
                "date": r["date"].strip()[:7],
            })
    if not rows:
        print("No rows in CSV.")
        return 1
    rows.sort(key=lambda s: s["price"], reverse=True)

    data = read_json("resale.json")
    data["sales"] = rows
    data["is_illustrative"] = False
    write_json("resale.json", data)
    print(f"ingested {len(rows)} sold comps; top = ${rows[0]['price']:,}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
