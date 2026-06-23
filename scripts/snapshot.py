"""Save a timestamped SNAPSHOT of the current data so you can always roll back.

Each snapshot is a dated folder under snapshots/ holding a copy of every
docs/data/*.json plus a note. snapshots/index.json lists them all, and
snapshots/README.md is a human-readable log you can browse on GitHub.

Usage:
    python scripts/snapshot.py "what changed / why"

After it runs, commit (and optionally tag) as it prints:
    git add snapshots && git commit -m "snapshot: <note>"
    git tag v0.2.0   # optional named save point
    git push --tags
"""
from __future__ import annotations
import json, shutil, sys, datetime as dt
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "docs" / "data"
SNAPS = ROOT / "snapshots"


def main() -> int:
    note = " ".join(sys.argv[1:]).strip() or "(no note)"
    stamp = dt.datetime.now().strftime("%Y-%m-%d_%H%M")
    dest = SNAPS / stamp
    dest.mkdir(parents=True, exist_ok=True)

    files = sorted(DATA.glob("*.json"))
    for f in files:
        shutil.copy2(f, dest / f.name)
    (dest / "_snapshot.json").write_text(json.dumps({
        "stamp": stamp,
        "date": dt.date.today().isoformat(),
        "note": note,
        "files": [f.name for f in files],
    }, indent=2) + "\n")

    # update index.json
    index_path = SNAPS / "index.json"
    index = json.loads(index_path.read_text()) if index_path.exists() else []
    index.insert(0, {"stamp": stamp, "date": dt.date.today().isoformat(), "note": note})
    index_path.write_text(json.dumps(index, indent=2) + "\n")

    # update human-readable README
    lines = ["# Snapshots", "",
             "Dated save points of `docs/data`. Roll back any file with:",
             "",
             "```bash",
             "cp snapshots/<stamp>/<file>.json docs/data/<file>.json",
             "```",
             "",
             "| Snapshot | Date | Note |",
             "|---|---|---|"]
    for e in index:
        lines.append(f"| `{e['stamp']}` | {e['date']} | {e['note']} |")
    (SNAPS / "README.md").write_text("\n".join(lines) + "\n")

    print(f"snapshot saved -> {dest.relative_to(ROOT)}  ({len(files)} files)")
    print("next:")
    print(f'  git add snapshots && git commit -m "snapshot: {note}"')
    print("  git tag vX.Y.Z   # optional named save point")
    print("  git push --follow-tags")
    return 0


if __name__ == "__main__":
    sys.exit(main())
