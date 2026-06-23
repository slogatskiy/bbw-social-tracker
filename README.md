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
    google_trends.json reddit_subscribers.json reddit_topics.json
    social.json roblox.json resale.json retail.json
scripts/              # data collectors — you run these to refresh data/
  fetch_roblox.py            # live Roblox "Build-A-Bear Tycoon" visits
  fetch_reddit.py            # current subreddit size (Reddit API)
  backfill_reddit_wayback.py # subscriber history (Wayback Machine)
  ingest_google_trends.py    # parse Google Trends CSV exports
  snapshot.py                # dated data save points
data_raw/             # (git-ignored) drop Google Trends CSVs here
```

Data lives as JSON **inside the repo**, so every refresh is a git commit — the
demand history is visible in the git log, and the dashboard is re-runnable and
diffable over time.

## Sections

Search · Community (Reddit) · Social · Digital (Roblox) · Resale · Retail &
commercial · Signal convergence · Methodology. Each analytical section ends with
a "What this shows & why it matters" institutional read-through.

- **Real / live data:** KPI strip, retail & commercial segments and locations
  (SEC filings), Roblox visits (live API), resale prices (eBay sold).
- **Illustrative (flagged on the page):** the Google Trends and Reddit
  time-series and the Reddit conversation taxonomy — seeded for design and
  overwritten when the collectors run. The Reddit Dec-2023 point (27,351) and
  the latest Roblox point are real anchors.

## Refresh the data

```bash
pip install -r requirements.txt

# 1) Roblox — live "Build-A-Bear Tycoon" visits (no keys needed)
python scripts/fetch_roblox.py

# 2) Reddit — current community size  (needs a free Reddit "script" app)
export REDDIT_CLIENT_ID=xxxx REDDIT_CLIENT_SECRET=xxxx
python scripts/fetch_reddit.py

# 3) Reddit — historical growth from Wayback Machine
python scripts/backfill_reddit_wayback.py

# 4) Google Trends — export CSVs to data_raw/, then:
python scripts/ingest_google_trends.py

git add docs/data && git commit -m "data: refresh signals"
git push
```

Each script header explains its 30-second setup.

## Saving & rollback

Everything is versioned, at two levels:

**1. Named project save points (git tags).** Each milestone is tagged (see
`CHANGELOG.md`). To look at or roll the whole repo back to one:

```bash
git tag                       # list save points (v0.1.0, v0.2.0, …)
git checkout v0.1.0           # inspect that exact version
git checkout main             # back to latest
# to truly revert main to an old version:
git revert --no-commit v0.2.0..HEAD && git commit -m "roll back to v0.1.0"
```

**2. Data snapshots (browsable files).** Before/after any data change, run:

```bash
python scripts/snapshot.py "what changed"
git add snapshots && git commit -m "snapshot: ..."
```

This drops a dated copy of every `docs/data/*.json` into `snapshots/<stamp>/`
(visible as plain files on GitHub) and logs it in `snapshots/README.md`. Restore
one file with:

```bash
cp snapshots/<stamp>/reddit_subscribers.json docs/data/
```

Because data also lives in git, the full history is in `git log` too — snapshots
just make specific results easy to find and compare.

## Roadmap

1. ✅ MVP — search + Reddit + culture, on GitHub Pages.
2. TikTok / Instagram hashtag view counts as a tracked series.
3. Resale market (eBay/Mercari sold listings for retired & limited bears) — the
   hardest *loyalty* proof: adults paying premiums on the secondary market.
4. Retail / international franchising + job-posting expansion pipeline.
5. Optional automation: a GitHub Actions cron that runs the collectors and commits.

Not investment advice.
