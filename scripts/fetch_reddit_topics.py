"""Build a REAL conversation-mix for r/buildabear by classifying actual top posts,
and overwrite docs/data/reddit_topics.json (replaces the illustrative taxonomy).

How it works
------------
- Pulls the top posts of the past year (and past month, to derive a real trend).
- Buckets each post by its Reddit *flair* — the community's own labels — falling
  back to keyword classification of the title when a post has no flair.
- Shares are real post counts; each bucket's "insight" is the actual highest-
  scoring post title in that bucket. Nothing is invented.

Auth
----
Works WITHOUT credentials from a normal residential IP (your machine):
    python scripts/fetch_reddit_topics.py
Reddit may 403 data-center IPs (CI, sandboxes). If so, set a script app's creds
and it will use OAuth automatically:
    export REDDIT_CLIENT_ID=xxxx REDDIT_CLIENT_SECRET=xxxx
    python scripts/fetch_reddit_topics.py
"""
from __future__ import annotations
import os, sys, time, datetime as dt
import requests
from _common import read_json, write_json, UA

SUBREDDIT = "buildabear"
# Browser-ish UA helps the public endpoint; OAuth path overrides Authorization.
HEADERS = {"User-Agent": UA}

# Canonical buckets: (emoji, display name, [keywords matched against flair OR title]).
BUCKETS = [
    ("🧸", "Hauls & Collections", ["haul", "collection", "collect", "shelf", "my new", "got these", "mail"]),
    ("🎨", "Customization & DIY", ["custom", "diy", "restuff", "mod", "outfit", "sew", "repair", "clean"]),
    ("⭐", "Licensed drops & restocks", ["drop", "restock", "release", "pokemon", "pokémon", "sanrio",
                                        "hello kitty", "star wars", "collab", "limited", "exclusive", "preorder"]),
    ("❓", "Help / identification", ["help", "question", "id ", "identify", "what is", "which", "worth",
                                     "value", "name?", "vintage", "old"]),
    ("🛍️", "Stores & events", ["store", "event", "line", "in-store", "workshop", "party", "visit"]),
]
DEFAULT = ("💬", "General & off-topic")


def classify(post: dict) -> tuple[str, str]:
    """Bucket a post by flair first, then by title keywords; else General."""
    text = " ".join(filter(None, [
        (post.get("link_flair_text") or ""),
        (post.get("title") or ""),
    ])).lower()
    for emoji, name, kws in BUCKETS:
        if any(k in text for k in kws):
            return emoji, name
    return DEFAULT


def get_token() -> str | None:
    cid, secret = os.environ.get("REDDIT_CLIENT_ID"), os.environ.get("REDDIT_CLIENT_SECRET")
    if not (cid and secret):
        return None
    r = requests.post("https://www.reddit.com/api/v1/access_token",
                      auth=(cid, secret), data={"grant_type": "client_credentials"},
                      headers=HEADERS, timeout=30)
    r.raise_for_status()
    return r.json()["access_token"]


def fetch_top(period: str, token: str | None, pages: int = 3) -> list[dict]:
    """Fetch up to pages*100 top posts for the given period (year/month/week)."""
    base = "https://oauth.reddit.com" if token else "https://www.reddit.com"
    headers = dict(HEADERS)
    if token:
        headers["Authorization"] = f"Bearer {token}"
    posts: list[dict] = []
    after = None
    for _ in range(pages):
        url = f"{base}/r/{SUBREDDIT}/top.json?t={period}&limit=100"
        if after:
            url += f"&after={after}"
        r = requests.get(url, headers=headers, timeout=30)
        if r.status_code == 403:
            raise PermissionError(
                "Reddit returned 403. Run from a residential IP, or set "
                "REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET for OAuth.")
        r.raise_for_status()
        children = r.json()["data"]["children"]
        posts.extend(c["data"] for c in children)
        after = r.json()["data"].get("after")
        if not after:
            break
        time.sleep(1)  # be polite to the API
    return posts


def shares(posts: list[dict]) -> dict[str, dict]:
    """Aggregate posts into buckets -> {name: {count, emoji, top_title, top_score}}."""
    agg: dict[str, dict] = {}
    for p in posts:
        emoji, name = classify(p)
        b = agg.setdefault(name, {"emoji": emoji, "count": 0, "top_title": "", "top_score": -1})
        b["count"] += 1
        if p.get("score", 0) > b["top_score"]:
            b["top_score"] = p.get("score", 0)
            b["top_title"] = (p.get("title") or "").strip()
    return agg


def main() -> int:
    try:
        token = get_token()
        year = fetch_top("year", token)
        if not year:
            print("No posts returned.")
            return 1
        month = fetch_top("month", token, pages=1)
    except Exception as e:  # noqa: BLE001
        print(f"Failed: {type(e).__name__}: {str(e)[:200]}")
        return 1

    print(f"Classified {len(year)} top posts (past year), {len(month)} (past month).")
    y_agg, m_agg = shares(year), shares(month)
    total = sum(b["count"] for b in y_agg.values())
    m_total = sum(b["count"] for b in m_agg.values()) or 1

    topics = []
    for name, b in y_agg.items():
        y_share = b["count"] / total * 100
        m_share = (m_agg.get(name, {}).get("count", 0)) / m_total * 100
        # Real trend: is this topic a bigger slice of the *recent* month than of the year?
        trend = "up" if m_share > y_share + 3 else "down" if m_share < y_share - 3 else "flat"
        title = b["top_title"]
        insight = (f"Top post: “{title[:90]}{'…' if len(title) > 90 else ''}”"
                   if title else f"{b['count']} posts")
        topics.append({"emoji": b["emoji"], "name": name, "share": round(y_share, 1),
                       "count": b["count"], "trend": trend, "insight": insight})
    topics.sort(key=lambda t: t["share"], reverse=True)

    out = {
        "last_updated": dt.date.today().isoformat(),
        "is_illustrative": False,
        "note": (f"Real conversation mix: {total} top r/{SUBREDDIT} posts of the past year, "
                 "bucketed by post flair (community labels) with a title-keyword fallback. "
                 "Trend compares each topic's share in the past month vs the past year."),
        "topics": topics,
    }
    write_json("reddit_topics.json", out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
