"""Fetch the CURRENT r/buildabear subscriber count via the Reddit API and
append it to docs/data/reddit_subscribers.json.

Setup (one-time, ~2 min):
  1. Go to https://www.reddit.com/prefs/apps  ->  "create another app"
  2. Choose type "script". Name it anything. redirect uri: http://localhost
  3. Copy the client id (under the app name) and the secret.
  4. Export them before running:
       export REDDIT_CLIENT_ID=xxxx
       export REDDIT_CLIENT_SECRET=xxxx

Run:  python scripts/fetch_reddit.py
"""
from __future__ import annotations
import os, sys, datetime as dt
import requests
from _common import read_json, write_json, merge_series, UA

SUBREDDIT = "buildabear"


def get_token(cid: str, secret: str) -> str:
    res = requests.post(
        "https://www.reddit.com/api/v1/access_token",
        auth=(cid, secret),
        data={"grant_type": "client_credentials"},
        headers={"User-Agent": UA},
        timeout=30,
    )
    res.raise_for_status()
    return res.json()["access_token"]


def main() -> int:
    cid = os.environ.get("REDDIT_CLIENT_ID")
    secret = os.environ.get("REDDIT_CLIENT_SECRET")
    if not (cid and secret):
        print("Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET (see header of this file).")
        return 1

    token = get_token(cid, secret)
    res = requests.get(
        f"https://oauth.reddit.com/r/{SUBREDDIT}/about",
        headers={"User-Agent": UA, "Authorization": f"Bearer {token}"},
        timeout=30,
    )
    res.raise_for_status()
    d = res.json()["data"]
    subs = d["subscribers"]
    month = dt.date.today().strftime("%Y-%m")
    print(f"r/{SUBREDDIT}: {subs:,} subscribers ({d.get('active_user_count')} online)")

    data = read_json("reddit_subscribers.json")
    data["series"] = merge_series(
        data["series"], [{"date": month, "value": subs, "real": True}]
    )
    # once we have a real recent point, the chart is no longer purely illustrative
    if any(p.get("real") and p["date"] >= "2025" for p in data["series"]):
        data["is_illustrative"] = False
        data["note"] = "Live: current point from the Reddit API; history from Wayback Machine."
    write_json("reddit_subscribers.json", data)
    return 0


if __name__ == "__main__":
    sys.exit(main())
