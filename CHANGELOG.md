# Changelog

Named save points for the whole project. Roll the entire repo back to any of
these with `git checkout <tag>` (see README → "Saving & rollback").

## v0.3.0 — 2026-06-23
- Major rebuild into an institutional, multi-signal dashboard modeled on the
  reference: dark masthead with sticky TOC nav, signal pills, executive summary,
  8-card KPI strip, and "What this shows & why it matters" read-throughs.
- New sections with **real data**: Digital engagement (Roblox live visits via
  API), Secondary market (real eBay resale prices), Retail & commercial
  (FY2024 segment mix + location model mix from SEC filings), Signal-convergence
  scorecard grid, Reddit conversation taxonomy.
- New collector `scripts/fetch_roblox.py` (key-free Roblox games API).
- Dropped casual/childish framing in favor of analyst tone for a PM audience.

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
