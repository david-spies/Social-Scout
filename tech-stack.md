# Tech Stack — Social Scout v3.0

## Overview

Social Scout is a decoupled full-stack application. The frontend and backend
are independently deployable services that communicate over HTTP/JSON.

```
┌─────────────────────────┐        HTTP/JSON        ┌──────────────────────────┐
│   React + Vite (SPA)    │ ──── /scan/{username} ──▶│  FastAPI + httpx (async) │
│   localhost:5173        │ ◀─── results[]  ─────────│  localhost:8000          │
└─────────────────────────┘                          └──────────────────────────┘
                                                               │
                                                    asyncio.gather()
                                                    33 concurrent probes
                                                               │
                                                    ┌──────────┴──────────┐
                                                    ▼                     ▼
                                              Instagram              GitHub ...
```

---

## Backend

### FastAPI `0.111+`
- Async-native Python web framework built on Starlette + Pydantic
- Chosen for: native `async/await` support, automatic OpenAPI docs, minimal overhead
- Handles routing, input validation, and CORS middleware

### httpx `0.27+`
- Async HTTP client — the critical performance component
- `AsyncClient` with a shared connection pool allows all 33+ platform probes
  to be dispatched simultaneously via `asyncio.gather()`
- Configured limits: `max_connections=40`, `max_keepalive_connections=20`
- Handles redirects, timeouts, and browser-like header impersonation

### asyncio (stdlib)
- `asyncio.gather(*tasks)` is the core concurrency primitive
- Fires all HTTP probes onto the event loop simultaneously
- Total scan time is bounded by the single slowest platform response,
  not the sum — typically 1.5–2s vs 30–60s sequential

### uvicorn `0.29+`
- ASGI server for running FastAPI in development and production
- `--reload` flag for hot-reload during development
- In production: run with `--workers` or behind Gunicorn with uvicorn workers

### Pydantic (via FastAPI)
- Input validation for username field (regex pattern enforcement)
- Blocks path traversal (`../`), injection attempts, and oversized inputs

---

## Frontend

### React `18`
- Component-based UI with hooks (`useState`, `useRef`, `useEffect`)
- No external UI library — all styling is inline for full design control
- Key components: `SocialScout` (root), `ResultCard`, `TerminalLine`

### Vite `5+`
- Fast dev server with HMR (Hot Module Replacement)
- Proxy config routes `/scan/*` to FastAPI during development,
  eliminating CORS issues without modifying the backend
- Production build: `npm run build` → optimized static assets in `dist/`

### Custom Hooks
- `useGlitch(text, active)` — character-scramble animation on the title,
  iterates over the string replacing characters with noise symbols on a
  `setInterval` until the original text resolves

---

## Design System — Solarized Shadow

| Token | Hex | Usage |
|-------|-----|-------|
| Deep Space | `#05070A` | Background / main canvas |
| Slate Shadow | `#1A1F26` | Card backgrounds, input fills |
| Solarized Green | `#00FF41` | Confirmed results, terminal text, success |
| Glow Blue | `#5D81FF` | Action buttons, possible matches, glow FX |
| Ghost White | `#F0F2F5` | Primary typography, headers |
| Slate Dim | `#4A5568` | Secondary labels, dark result states |
| Alert Red | `#FF4560` | Errors, connection failures |

### Visual Effects
- Scanline grid overlay on terminal (CSS `repeating-linear-gradient`)
- Glow `box-shadow` on confirmed result cards
- Animated gradient progress bar (blue → green)
- `borderGlow` keyframe animation on active search container
- CRT-style monospace font (`Courier New`) throughout

---

## Confidence Scoring Logic

Many platforms return `HTTP 200` for every URL regardless of whether a
profile exists. A naive status-code check produces high false-positive rates.
Social Scout uses a two-layer check:

```
HTTP Status Code
      │
      ├── 200 ──▶ Body contains hint substring?
      │               ├── YES ──▶ FOUND     (high confidence)
      │               └── NO  ──▶ POSSIBLE  (unconfirmed — soft 200 or bot wall)
      │
      ├── 404 ──▶ NOT_FOUND
      ├── 403 / 429 / 999 ──▶ BLOCKED  (platform rate-limited the probe)
      └── other / timeout ──▶ ERROR / TIMEOUT
```

Each platform entry includes a `hint` — a unique substring expected in a
real profile page (e.g. `"totalKarma"` for Reddit, `"channelId"` for YouTube).

---

## Performance Characteristics

| Metric | Value |
|--------|-------|
| Platforms scanned | 33 |
| Typical scan time | 1.4 – 2.2 seconds |
| Concurrency model | `asyncio.gather` (single event loop) |
| HTTP client | `httpx.AsyncClient` (shared pool) |
| Bottleneck | Slowest single platform response |
| Sequential equivalent | ~35 – 60 seconds |

---

## Commercial Deployment Considerations

### Infrastructure

| Component | Recommended Service |
|-----------|-------------------|
| Backend API | Railway, Render, Fly.io, AWS ECS / Lambda |
| Frontend SPA | Vercel, Netlify, Cloudflare Pages |
| Database (future) | PlanetScale (MySQL), Supabase (Postgres) |
| Cache layer (future) | Redis via Upstash — cache recent scan results |
| CDN | Cloudflare |

### Backend Production Command
```bash
gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:$PORT
```

### CORS in Production
Update `ALLOWED_ORIGINS` in `.env` to your actual frontend domain:
```env
ALLOWED_ORIGINS=https://socialscout.app,https://www.socialscout.app
```

### Rate Limiting (Required Before Launch)
Install `slowapi`:
```bash
pip install slowapi
```
Enforce per-IP limits on `/scan/{username}` to prevent abuse:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/scan/{username}")
@limiter.limit("10/minute")
async def scan_username(request: Request, username: str):
    ...
```

### Bot Detection & Platform ToS
Several platforms actively block headless HTTP probes:
- **LinkedIn, Instagram** — aggressive bot detection; expect high `BLOCKED` rates
- **TikTok** — returns 200 but with Cloudflare challenge pages
- **Twitter/X** — requires auth for most profile data

Mitigation options for production:
- Rotating user-agent strings
- Residential proxy pool (e.g. Bright Data, Oxylabs) — verify ToS compliance
- Playwright/Puppeteer for JS-rendered platforms (heavier, slower)
- Official APIs where available (Reddit, GitHub, Spotify)

### Authentication & Monetization (Future)
- **Auth**: Clerk, Auth0, or Supabase Auth for user accounts
- **Scan history**: Store results in Postgres with user FK
- **Rate tiers**: Free (5 scans/day) → Pro (unlimited) via Stripe
- **API access**: Issue API keys for B2B / developer tier

### Security Checklist Before Launch
- [ ] Username input validated server-side (already implemented)
- [ ] HTTPS enforced on all endpoints
- [ ] CORS locked to production origin only
- [ ] Rate limiting on scan endpoint
- [ ] No sensitive keys committed to repo (use `.env` + secrets manager)
- [ ] Dependency audit: `pip audit` + `npm audit`
- [ ] Add `SECURITY.md` with responsible disclosure policy
