import asyncio
import time
import re
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.responses import JSONResponse
import httpx
from dotenv import load_dotenv
import os

load_dotenv()

# ── Rate limiter ───────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

app = FastAPI(title="Social Scout API", version="3.0")

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded. Slow down, scout."})

# ── CORS ───────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# ── Platform targets ───────────────────────────────────────────────────────────
# (url_template, body_hint)
# body_hint: substring expected in a real profile page — reduces false positives
TARGETS: dict[str, tuple[str, str | None]] = {
    "Instagram":   ("https://www.instagram.com/{}/",              "og:title"),
    "GitHub":      ("https://github.com/{}",                      "availability-check"),
    "TikTok":      ("https://www.tiktok.com/@{}",                 "user-page"),
    "YouTube":     ("https://www.youtube.com/@{}",                "channelId"),
    "Reddit":      ("https://www.reddit.com/user/{}/",            "totalKarma"),
    "Twitter/X":   ("https://twitter.com/{}",                     "twitter:title"),
    "LinkedIn":    ("https://www.linkedin.com/in/{}/",            "linkedin:owner"),
    "Pinterest":   ("https://www.pinterest.com/{}/",              "pinterestapp:pin"),
    "Snapchat":    ("https://www.snapchat.com/add/{}",            "og:title"),
    "Facebook":    ("https://www.facebook.com/{}",                "og:title"),
    "Twitch":      ("https://www.twitch.tv/{}",                   "og:title"),
    "SoundCloud":  ("https://soundcloud.com/{}",                  "og:title"),
    "Spotify":     ("https://open.spotify.com/user/{}",           "og:title"),
    "Medium":      ("https://medium.com/@{}",                     "og:title"),
    "Dribbble":    ("https://dribbble.com/{}",                    "og:title"),
    "Behance":     ("https://www.behance.net/{}",                 "og:title"),
    "Vimeo":       ("https://vimeo.com/{}",                       "og:title"),
    "Steam":       ("https://steamcommunity.com/id/{}",           "og:title"),
    "Imgur":       ("https://imgur.com/user/{}",                  "og:title"),
    "Flickr":      ("https://www.flickr.com/people/{}/",          "og:title"),
    "Etsy":        ("https://www.etsy.com/shop/{}",               "og:title"),
    "Pastebin":    ("https://pastebin.com/u/{}",                  "og:title"),
    "About.me":    ("https://about.me/{}",                        "og:title"),
    "Dailymotion": ("https://www.dailymotion.com/{}",             "og:title"),
    "Codecademy":  ("https://www.codecademy.com/profiles/{}",     "og:title"),
    "Roblox":      ("https://www.roblox.com/user.aspx?username={}", "og:title"),
    "Canva":       ("https://www.canva.com/{}",                   "og:title"),
    "Wikipedia":   ("https://en.wikipedia.org/wiki/User:{}",      "wgUserId"),
    "Meetup":      ("https://www.meetup.com/members/{}",          "og:title"),
    "Flipboard":   ("https://flipboard.com/@{}",                  "og:title"),
    "Substack":    ("https://{}.substack.com",                    "og:title"),
    "Linktree":    ("https://linktr.ee/{}",                       "og:title"),
    "Mastodon":    ("https://mastodon.social/@{}",                "og:title"),
}

# ── Browser-like headers ───────────────────────────────────────────────────────
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# ── Input validation ───────────────────────────────────────────────────────────
USERNAME_RE = re.compile(r"^[a-zA-Z0-9._\-]{1,50}$")

PROBE_TIMEOUT  = float(os.getenv("PROBE_TIMEOUT", "6.0"))
MAX_CONN       = int(os.getenv("MAX_CONNECTIONS", "40"))
MAX_KEEPALIVE  = int(os.getenv("MAX_KEEPALIVE_CONNECTIONS", "20"))

# ── Per-platform probe ─────────────────────────────────────────────────────────
async def check_site(
    client: httpx.AsyncClient,
    name: str,
    url_template: str,
    hint: str | None,
    username: str,
) -> dict:
    url = url_template.format(username)
    t0  = time.monotonic()
    try:
        resp    = await client.get(url, timeout=PROBE_TIMEOUT, follow_redirects=True)
        elapsed = round((time.monotonic() - t0) * 1000)
        # Only read body for reasonably sized responses
        body = resp.text if len(resp.content) < 500_000 else ""

        if resp.status_code == 200:
            confidence = "FOUND" if (hint and hint.lower() in body.lower()) else "POSSIBLE"
        elif resp.status_code == 404:
            confidence = "NOT_FOUND"
        elif resp.status_code in (403, 429, 999):
            confidence = "BLOCKED"
        else:
            confidence = "ERROR"

        return {
            "platform":   name,
            "url":        url,
            "status":     resp.status_code,
            "confidence": confidence,
            "elapsed_ms": elapsed,
        }

    except httpx.TimeoutException:
        return {"platform": name, "url": url, "status": None,
                "confidence": "TIMEOUT", "elapsed_ms": int(PROBE_TIMEOUT * 1000)}
    except httpx.RequestError as exc:
        return {"platform": name, "url": url, "status": None,
                "confidence": "ERROR", "elapsed_ms": 0, "error": str(exc)}


# ── Scan endpoint ──────────────────────────────────────────────────────────────
@app.get("/scan/{username}")
@limiter.limit("10/minute")
async def scan_username(username: str, request: Request):
    if not USERNAME_RE.match(username):
        raise HTTPException(status_code=400, detail="Invalid username. Alphanumeric, dots, hyphens and underscores only (max 50 chars).")

    t_start = time.monotonic()
    limits  = httpx.Limits(max_connections=MAX_CONN, max_keepalive_connections=MAX_KEEPALIVE)

    async with httpx.AsyncClient(headers=HEADERS, limits=limits) as client:
        tasks = [
            check_site(client, name, url_tpl, hint, username)
            for name, (url_tpl, hint) in TARGETS.items()
        ]
        results: list[dict] = await asyncio.gather(*tasks)

    total_ms = round((time.monotonic() - t_start) * 1000)
    found    = sum(1 for r in results if r["confidence"] == "FOUND")
    possible = sum(1 for r in results if r["confidence"] == "POSSIBLE")

    return {
        "username":   username,
        "scanned":    len(results),
        "found":      found,
        "possible":   possible,
        "elapsed_ms": total_ms,
        "results":    results,
    }


# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "platforms": len(TARGETS), "version": "3.0"}
