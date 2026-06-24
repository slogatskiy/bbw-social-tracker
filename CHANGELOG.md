# Changelog

Named save points for the whole project. Roll the entire repo back to any of
these with `git checkout <tag>` (see README → "Saving & rollback").

## v0.4.0 — 2026-06-24
- **Social section** upgraded to real owned-audience data: TikTok 834.7K (14.1M
  likes), Instagram 813K, Facebook 2.8M — follower bar chart + scorecards, plus
  the 'Bear Cave' 18+ adults-only line as a hard adult-targeting anchor.
- **Resale section** upgraded with a price-over-time scatter (log scale) colored
  by category, a categorized sales table, and a 50–290× premium-vs-retail read.
- New collector `scripts/ingest_resale.py` (analyst-maintained eBay sold comps).
- Honesty note: TikTok hashtag view counts are not public; tracked manually via
  Creative Center (roadmap) rather than fabricated.

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
