# Build-A-Bear (BBW) — Social Demand Tracker

A small, GitHub-Pages dashboard that measures whether the **adult** Build-A-Bear
fandom is real, growing, and durable — using several independent social signals.

> **Thesis.** Build-A-Bear is not a dying mall retailer for 4-year-olds. It is a
> high-recognition brand (90%+ U.S. aided awareness, ~20M loyalty members) whose
> customer base is already ~40% teens & adults ("kidults"), comparable to Warhammer
> collectors. If adult demand is accelerating, search, community, culture and the
> resale market should all point the same way at the same time. This tracker tests that.

**Live dashboard:** _enable GitHub Pages (Settings → Pages → Branch: `main`, folder `/docs`), then the URL appears here._

Modeled on the [Warhammer demand dashboard](https://emmania1.github.io/warhammer-demand-dashboard/).

---

## How it's built

```
docs/                 # the static site (GitHub Pages serves this folder)
  index.html
  app.js              # renders KPIs + Chart.js charts from data/*.json
  styles.css
  data/               # the data the page reads (versioned in git)
    manifest.json     # thesis, status, last-updated
    kpis.json         # headline figures (real, cited)
    google_trends.json
    reddit_subscribers.json
scripts/              # data collectors — you run these to refresh data/
  fetch_reddit.py            # current subreddit size (Reddit API)
  backfill_reddit_wayback.py # subscriber history (Wayback Machine)
  ingest_google_trends.py    # parse Google Trends CSV exports
data_raw/             # (git-ignored) drop Google Trends CSVs here
```

Data lives as JSON **inside the repo**, so every refresh is a git commit — the
demand history is visible in the git log, and the dashboard is re-runnable and
diffable over time.

## Current status (MVP)

- **KPI cards** use real, cited figures (SEC filings, BBW investor presentations, trade press).
- **Time-series charts** are seeded *illustratively* so the design is visible.
  They flip to **live** the moment you run the collectors below. The Reddit
  Dec-2023 point (27,351) is already a real anchor.

## Refresh the data

```bash
pip install -r requirements.txt

# 1) Reddit — current community size  (needs a free Reddit "script" app)
export REDDIT_CLIENT_ID=xxxx REDDIT_CLIENT_SECRET=xxxx
python scripts/fetch_reddit.py

# 2) Reddit — historical growth from Wayback Machine
python scripts/backfill_reddit_wayback.py

# 3) Google Trends — export CSVs to data_raw/, then:
python scripts/ingest_google_trends.py

git add docs/data && git commit -m "data: refresh signals"
git push
```

Each script header explains its 30-second setup.

## Roadmap

1. ✅ MVP — search + Reddit + culture, on GitHub Pages.
2. TikTok / Instagram hashtag view counts as a tracked series.
3. Resale market (eBay/Mercari sold listings for retired & limited bears) — the
   hardest *loyalty* proof: adults paying premiums on the secondary market.
4. Retail / international franchising + job-posting expansion pipeline.
5. Optional automation: a GitHub Actions cron that runs the collectors and commits.

Not investment advice.
