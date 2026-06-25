# BBW Tracker — Status & Roadmap

**Live:** https://slogatskiy.github.io/bbw-social-tracker/ · **Repo:** https://github.com/slogatskiy/bbw-social-tracker
**Current version:** v0.7.0 (2026-06-24). See `CHANGELOG.md` for the full history; roll back with `git checkout vX.Y.Z`.

## Thesis
Build-A-Bear is a diversified brand-equity business with a large, loyal **adult** fan base whose demand
is **online- and community-led** (TikTok, Reddit, e-commerce, Roblox), not mall-driven. Physical stores
skew family/tourist; adults engage online and buy online. The tracker tests whether that adult demand is
real, growing and durable via independent, converging signals.

## Section status (real vs. illustrative)

| Section | Status | Source |
|---|---|---|
| Social / TikTok | 🟢 real | Official profiles: TikTok 834.7K / 14.1M likes, IG 813K, FB 2.8M; 13M-view viral; Bear Cave 18+ |
| Search | 🟢 real | Google Trends (US, weekly→monthly). 5-yr high spring 2026; trailing 12-mo avg ~+90% YoY |
| Community / Reddit | 🟡 2 real anchors | 27,351 (Dec-2023) → ~37,000 (Jun-2026); path between estimated |
| Reddit conversation taxonomy | 🔴 illustrative | labeled on page; needs a real post-classification pass |
| Digital / Roblox | 🟢 live | Roblox games API: ~24.3M visits (universe 4107870885) |
| Online / e-commerce | 🟢 real | BBW FY2025 quarterly demand: +0.5% / +15.1% / −10.8% |
| Resale | 🟢 real (small sample) | eBay sold comps; compact widget; top $11,600 (~290× retail) |
| Retail / commercial | 🟢 real | SEC/press: FY2025 record $529.8M; commercial+franchising +21.6%; 604 locations |

## Key real figures (verified — see memory for sourcing)
- FY2025 total revenue **$529.8M** (record, +6.7%); net retail $486.0M; commercial+franchising ~$43.9M (+21.6%, Q4 +37.5%).
- FY2024 total **$496.4M** (NOT $226.5M — that was H1, fixed in v0.4.1).
- 604 global locations (369 corp / 148 partner / 87 franchise, Q1 FY25); 60+ net new 2 yrs running.
- ~40% sales adults/teens; ~20M Bonus Club; 90%+ aided awareness; +~2,000% 5-yr equity return.

## Next steps (priority order)
1. **Reddit conversation taxonomy → real.** Replace the illustrative mix with a real classification of
   r/buildabear top posts. Needs Reddit API creds (user couldn't create the app) OR a manual CSV export
   of top posts. This is the last fully-illustrative element.
2. **Reddit subscriber history → exact.** Run `scripts/backfill_reddit_wayback.py` from an open network
   (archive.org is flaky/blocked from the sandbox) to replace the estimated path between the two anchors.
3. **TikTok follower trend.** Add a follower-growth line from SocialBlade (manual lookup) — currently a static count.
4. **TikTok hashtag scale.** #buildabear view counts via TikTok Creative Center (manual; not public via scrape).
5. **Resale price index over time.** Expand `data_raw/resale.csv` with more documented sold comps → `ingest_resale.py`.
6. **Automation.** Optional GitHub Actions cron to run the key-free collectors (Roblox now; Reddit/Trends are manual).

## How to refresh data
```bash
pip install -r requirements.txt
python scripts/fetch_roblox.py                 # live Roblox visits (no keys)
# Google Trends: export CSV to data_raw/multiTimeline.csv, then:
python scripts/ingest_google_trends.py          # weekly→monthly, drops all-zero columns
python scripts/backfill_reddit_wayback.py        # Reddit history (run from open network)
python scripts/ingest_resale.py                  # eBay comps from data_raw/resale.csv
python scripts/snapshot.py "note"                # dated data save point
git add -A && git commit -m "data: refresh" && git push
# If GitHub Pages doesn't rebuild: gh api -X POST repos/slogatskiy/bbw-social-tracker/pages/builds
```

## Notes
- Deliverable is intended for the BBW (hedge-fund) Slack channel. Accuracy is paramount — always verify
  BBW financials against the press release (full-year revenue is ~$500–530M, never ~$226M).
- Cannell Capital attribution was deliberately removed (old "Do Not Circulate" thesis); figures re-sourced.
- Before sending: open on desktop AND mobile and eyeball the render (Claude cannot see the rendered page).
