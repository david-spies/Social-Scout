# Social Scout v3.0

> **Social Network Username Reconnaissance Tool**
> Discover social media profiles across 33+ platforms in under 2 seconds.

![Version](https://img.shields.io/badge/version-3.0-00FF41?style=flat-square)
![Python](https://img.shields.io/badge/python-3.11+-5D81FF?style=flat-square)
![React](https://img.shields.io/badge/react-18-5D81FF?style=flat-square)
![FastAPI](https://img.shields.io/badge/fastapi-0.111-00FF41?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-F0F2F5?style=flat-square)

---

## What It Does

Social Scout accepts a username and concurrently probes 33+ social media
platforms, returning a tiered confidence result for each:

| Result | Meaning |
|--------|---------|
| ✓ CONFIRMED FOUND | HTTP 200 + platform-specific content hint verified in response body |
| ~ POSSIBLE MATCH | HTTP 200 returned but content hint unconfirmed — may be soft 200 or bot wall |
| ✗ DARK / NO HIT | 404, timeout, or hard block — no profile detected |

All probes are dispatched simultaneously via `asyncio.gather`, making the
full 33-platform scan complete in approximately 1.5–2 seconds — versus 30–60+
seconds with sequential requests.

---

## Features

- **Async concurrent scanning** — all platforms probed in parallel
- **Confidence scoring** — three-tier result system reduces false positives
- **Tech-Noir UI** — Solarized Shadow design system, glitch title animation, CRT scanline terminal
- **Dual view modes** — Grid view with live card updates + Terminal log with timestamped output
- **Demo / API toggle** — runs fully standalone with simulated scan; flip switch to connect live backend
- **Real-time progress** — animated progress bar and live stat counters update as results stream in
- **Direct profile links** — confirmed and possible results include clickable open/check links
- **Input validation** — server-side username sanitization blocks traversal and injection attempts
- **Mobile responsive** — fluid layout tested on iOS Safari and Android Chrome

---

## Quick Start

See [Local_Development.md](./Local_Development.md) for full setup instructions.

```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

Open `http://localhost:5173` — toggle to API Mode and scan any username.

---

## Platform Coverage

| Category | Platforms |
|----------|-----------|
| Social | Instagram, Facebook, Snapchat, Pinterest, Mastodon |
| Video | YouTube, TikTok, Twitch, Vimeo, Dailymotion |
| Professional | LinkedIn, GitHub, Behance, Dribbble, Codecademy |
| Audio | SoundCloud, Spotify |
| Publishing | Medium, Substack, Flipboard, Wikipedia, Pastebin |
| Commerce | Etsy, Canva, Roblox |
| Discovery | About.me, Linktree, Imgur, Flickr, Meetup |
| Legacy | Steam, Reddit, Twitter/X |

---

## API Reference

### `GET /scan/{username}`
Scans all configured platforms for the given username.

**Response**
```json
{
  "username": "johndoe",
  "scanned": 33,
  "found": 8,
  "possible": 5,
  "elapsed_ms": 1742,
  "results": [
    {
      "platform": "GitHub",
      "url": "https://github.com/johndoe",
      "status": 200,
      "confidence": "FOUND",
      "elapsed_ms": 312
    }
  ]
}
```

### `GET /health`
Returns API status and platform count.

---

## Project Structure

```
social-scout/
├── backend/          # FastAPI scan engine
├── frontend/         # React + Vite UI
├── README.md
├── Tech_Stack.md
├── Local_Development.md
└── requirements.txt
```

---

## Ethical Use & Legal Notice

Social Scout is intended for:
- Locating your own accounts across platforms
- Brand protection and username monitoring
- Security research and OSINT training in authorized contexts

Users are solely responsible for ensuring their use complies with the
Terms of Service of each platform probed and all applicable laws including
but not limited to the Computer Fraud and Abuse Act (CFAA) and GDPR.
Automated scraping of platforms without authorization may violate their ToS.

---

## License

MIT License — see `LICENSE` for details.

Authors

    David Spies
