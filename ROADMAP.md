# BBW Tracker — Status & Resume Handoff

**Live:** https://slogatskiy.github.io/bbw-social-tracker/ · **Repo:** https://github.com/slogatskiy/bbw-social-tracker
**Current version:** v0.8.16 (2026-06-29). Roll back: `git checkout vX.Y.Z`. Assets cache-busted via `?v=0.8.16` in `index.html` — **bump this on every JS/CSS change.**
**Deploy:** push → GitHub Pages rebuilds (~1–2 min lag). Nudge: `gh api -X POST repos/slogatskiy/bbw-social-tracker/pages/builds`. Always poll the live `?v=` before saying "it's live."

## Thesis
Build-A-Bear is a diversified brand-equity business with a large, loyal **adult** fan base whose demand is **online- and community-led** (TikTok, Reddit, YouTube, Roblox, e-commerce), not mall-driven. The tracker tests whether that adult demand is real, growing and durable via independent, converging signals. **This is buy-side research, NOT a pitch — honesty/objectivity over narrative (see memory `objectivity-over-pitch`). Never fabricate; label every estimate; show both sides.**

## Sections (01–11), in `docs/index.html`, rendered by `docs/app.js` from `docs/data/*.json`
01 Social/TikTok · 02 Reddit · 03 Search · 04 Roblox · 05 YouTube · 06 E-commerce · 07 Resale · 08 Retail · 09 Pipeline · 10 Convergence · 11 Method

## REAL vs FABRICATED — current state
**Everything on the page is real/live/cited EXCEPT one labeled thing:**
- ⚠️ **Roblox visits CURVE shape** is modeled (front-loaded), shown "for scale." Only the 2 endpoints are measured (Dec-2022 launch=0, live current=24.3M), marked with amber dots; note+tooltip say "modeled". Only non-measured element, transparently flagged. (User chose to keep the curve knowing it's modeled.)
- "buzz" tags in Pipeline drops = labeled qualitative. Q4-FY25 e-comm −5.5% = the one figure not primary-source-confirmed.

**Real data per signal:**
- **Search** — Google Trends CSV. 12-mo avg +90% YoY, 5-yr high spring 2026 (peak Apr-2026=73).
- **Social** — TikTok @buildabear 834.7K/14.1M likes, IG 813K, FB 2.8M (dated snapshots).
- **Reddit subs** — 15 REAL Wayback points, ~6.6K (2022) → 72,067 (Jan-2026). +163% since Dec-2023.
- **Reddit "What's hot"** — 10 REAL live top posts (last 30d) + qualitative theme chips.
- **YouTube** — official channel 132K subs / 193.2M views (live); anchor videos (25M/17M/11.8M…) with real upload dates; KABU subsection w/ real per-episode views (~41K top); KABU 500K+ (company PR, counts all formats) + a short sourced series description (v0.8.15 added a cast/CEO-quote card; v0.8.16 removed it per user — kept only the one-paragraph description).
- **E-commerce** — quarterly demand: Q1FY25 +0.5, Q2 +15.1, Q3 −10.8, Q4 ≈−5.5, **Q1FY26 −26.1** (rolled over; honest two-sided). SimilarWeb audience: ~870K visits/mo, 68% female, top cohort 25–34.
- **Roblox** — live: 24.3M cumulative visits, 115K favorites; Gamefam-built, launched Dec-2022.
- **Resale** — 7 documented eBay sold comps (top $11,600 My Melody).
- **Retail/financials** — FY2025 rev $529.8M (+6.7%, 5th record yr), EPS $3.99, pre-tax $67.2M; 604 locations; commercial+franchising +21.6%.
- **Pipeline** — real 2026 drops (Eevee, Bluey, Walmart wholesale, Slushie, KABU, Figure Skating) + dated **release timeline**: Mandalorian&Grogu film May-22-2026, Eevee 2026-27, HTTYD2 live-action Jun-11-2027, Hello Kitty movie Jul-21-2028.

## HOW TO REFRESH DATA (all scraping tricks need `dangerouslyDisableSandbox:true`; the harness sandbox blocks egress)
- **Reddit subs:** `python scripts/backfill_reddit_wayback.py` (Wayback CDX, no key). Recent points: CDX `www.reddit.com/r/buildabear` snapshots, parse `"<n> members"` — pick the value continuing the trend (a 2nd ~134K number is a DIFFERENT recommended sub; ignore it).
- **Reddit hot posts:** `python scripts/fetch_reddit_topics.py` (scrapes old.reddit.com HTML, no OAuth — the OAuth app the user could never make is NOT needed anymore).
- **Roblox live:** `python scripts/fetch_roblox.py` (key-free games API; appends a real point each run → real history accrues forward).
- **Search:** re-export Google Trends CSV to `data_raw/`, `python scripts/ingest_google_trends.py`.
- **YouTube** (manual scrape, no script yet): youtube.com HTML with `User-Agent: Mozilla/...Chrome`, `Cookie: CONSENT=YES+1`, and **`&hl=en&gl=US`** (else "views" text is localized). Channel: `"subscriberCountText":"132K subscribers","viewCountText":"... views"`. Search videos: split on `"videoRenderer":{`. Upload date: watch page `"uploadDate"`.

## BLOCKED from this env (even sandbox-off): Reddit OAuth API, SEC.gov (0 bytes/403), YouTube comments (innertube returns 0), archive.org rate-limits after ~20 reqs.

## OPEN / NEXT (resume here)
1. **Automation (cron)** — not set up; no `.github/workflows/`. Add GitHub Actions: `fetch_roblox.py` daily (also accrues real Roblox history → could later replace the modeled curve with real points); `fetch_reddit_topics.py` + Wayback backfill weekly. User asked about this; pending their go.
2. **YouTube comment topics** — couldn't scrape (needs paid YouTube Data API key). Offered, not done.
3. More release-timeline items if wanted; confirm Q4-FY25 e-comm −5.5% from a primary BBW release.
4. Reddit hot-posts & YouTube numbers are point-in-time (Jun-2026) until cron automates refresh.

## Conventions
- Validate before push: JSON parse + brace-balance check on app.js + `py_compile` scripts.
- Snapshots: `python scripts/snapshot.py "note"` → dated copy in `snapshots/`.
- Memory: project state in `…/memory/bbw-social-tracker-project.md` (full v0.1–v0.8.14 history); principle in `objectivity-over-pitch.md`.
