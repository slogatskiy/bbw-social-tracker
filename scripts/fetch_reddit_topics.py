"""Pull the REAL current top posts of r/buildabear (last 30 days) and write
docs/data/reddit_topics.json — the "What's hot" widget. No API key / OAuth.

It scrapes old.reddit.com (the lightweight HTML site) with a browser User-Agent;
Reddit's JSON API now needs OAuth, but old.reddit HTML does not. Run from a
normal residential connection:
    python scripts/fetch_reddit_topics.py
"""
from __future__ import annotations
import re, sys, time, html as ihtml
import requests
from _common import write_json

SUB = "buildabear"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    "Cookie": "CONSENT=YES+1",
}

TAGGERS = [
    ("🆕 new release", ["available", "new bear", "release", "restock", "drop", "anglerfish"]),
    ("⭐ licensed", ["kabu", "pokemon", "pokémon", "sanrio", "pochacco", "hello kitty", "kuromi",
                     "my melody", "star wars", "sonic", "disney", "mario", "mandalorian", "grogu", "scrimblo"]),
    ("🎨 custom / art", ["custom", "diy", "outfit", "i drew", "draw", "doodle", "sew", "dye", "made", "concept", "crochet"]),
    ("💞 personal", ["girlfriend", "boyfriend", "surgery", "anniversary", "turns", "memory", "passed", "first bab", "wedding", "married"]),
    ("❓ help / ID", ["help", "who is", "what is", "who's this", "identify", "worth", "value"]),
]
THEMES = [
    {"emoji": "🧸", "name": "Hauls & show-off", "note": "Adults photographing their bears & collections — the dominant activity."},
    {"emoji": "🎨", "name": "Customization & art", "note": "Restuffs, custom outfits, fan art, dye jobs."},
    {"emoji": "⭐", "name": "Licensed characters", "note": "Sanrio/Pochacco, Pokémon and KABU recur in the top posts."},
    {"emoji": "🆕", "name": "New releases", "note": "Drops hit the front page on day one."},
    {"emoji": "💞", "name": "Personal & emotional", "note": "Bears tied to milestones, identity, comfort & memory."},
]


def tag(title: str) -> str:
    tl = " " + title.lower() + " "
    for name, kws in TAGGERS:
        if any(k in tl for k in kws):
            return name
    return "🧸 haul / show-off"


def fetch_top(period: str = "month", pages: int = 2) -> list[dict]:
    posts, after = [], ""
    for _ in range(pages):
        url = f"https://old.reddit.com/r/{SUB}/top/?sort=top&t={period}&limit=25{after}"
        r = requests.get(url, headers=HEADERS, timeout=40)
        r.raise_for_status()
        for seg in r.text.split('data-fullname="t3_')[1:]:
            sc = re.search(r'data-score="(\d+)"', seg)
            pl = re.search(r'data-permalink="([^"]+)"', seg)
            ti = re.search(r'data-event-action="title"[^>]*>([^<]{3,200})</a>', seg)
            if sc and ti and pl:
                t = ihtml.unescape(ti.group(1)).strip()
                posts.append({"title": t, "score": int(sc.group(1)),
                              "url": "https://reddit.com" + pl.group(1), "tag": tag(t)})
        nxt = re.search(r"after=(t3_\w+)", r.text)
        if not nxt:
            break
        after = f"&count=25&after={nxt.group(1)}"
        time.sleep(1)
    return posts


def main() -> int:
    try:
        posts = fetch_top("month")
    except Exception as e:  # noqa: BLE001
        print(f"Failed: {type(e).__name__}: {str(e)[:160]}")
        return 1
    if not posts:
        print("No posts parsed (old.reddit layout may have changed).")
        return 1
    posts.sort(key=lambda p: p["score"], reverse=True)
    hot = posts[:10]
    print(f"Top post: {hot[0]['score']}↑ — {hot[0]['title'][:70]}")
    write_json("reddit_topics.json", {
        "is_illustrative": False,
        "source": f"old.reddit.com/r/{SUB} — top posts of the last 30 days (live scrape, no API key)",
        "note": ("Real current top posts of r/buildabear (last ~30 days, by upvotes). The feed is "
                 "dominated by adults showing off and customizing their bears; licensed characters "
                 "(Sanrio/Pochacco, KABU) and new releases recur, alongside strikingly personal posts."),
        "hot": hot,
        "themes": THEMES,
    })
    return 0


if __name__ == "__main__":
    sys.exit(main())
