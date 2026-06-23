# Changelog

Named save points for the whole project. Roll the entire repo back to any of
these with `git checkout <tag>` (see README → "Saving & rollback").

## v0.2.0 — 2026-06-23
- Google Trends chart: smoother, more realistic seasonal seed (Nov–Dec peaks).
- Added a **12-month moving-average** trend line so the underlying trend is
  readable through the seasonality.
- Added the **snapshot system**: `scripts/snapshot.py` + `snapshots/` dated
  copies of the data, browsable on GitHub.

## v0.1.0 — 2026-06-23 (MVP)
- First public dashboard on GitHub Pages.
- KPI cards with real, cited figures (BBW filings & investor presentations).
- Signals: Google Trends (search), Reddit community growth, TikTok/culture.
- Collectors: Reddit API, Wayback backfill, Google Trends CSV ingest.
