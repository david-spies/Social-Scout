# Local Development Guide — Social Scout v3.0

## Project Structure

```
social-scout/
├── backend/
│   ├── main.py                  # FastAPI app — core scan engine
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # Environment variables (never commit)
│   ├── .env.example             # Env template (safe to commit)
│   └── __pycache__/             # Auto-generated, gitignored
│
├── frontend/
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── App.jsx              # Root component (Social Scout UI)
│   │   ├── main.jsx             # Vite entry point
│   │   └── index.css            # Global resets / base styles
│   ├── index.html
│   ├── vite.config.js           # Vite + proxy config
│   └── package.json
│
├── .gitignore
├── README.md
├── Tech_Stack.md
└── Local_Development.md         # This file
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Python | 3.11+ | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| npm | 9+ | Bundled with Node |
| Git | any | [git-scm.com](https://git-scm.com) |

---

## Backend Setup (FastAPI)

```bash
# 1. Navigate to backend directory
cd social-scout/backend

# 2. Create and activate a virtual environment
python -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy environment template
cp .env.example .env
# Edit .env as needed

# 5. Start the development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be live at:
- API root: `http://localhost:8000`
- Interactive docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

---

## Frontend Setup (React + Vite)

```bash
# 1. Navigate to frontend directory
cd social-scout/frontend

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Frontend will be live at `http://localhost:5173`

---

## Vite Proxy Configuration

To avoid CORS issues during local development, configure Vite to proxy
API calls to the FastAPI backend. In `frontend/vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/scan': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
```

With the proxy active, update the fetch URL in `App.jsx` from:
```js
fetch(`http://localhost:8000/scan/${username}`)
```
to:
```js
fetch(`/scan/${username}`)
```

---

## Environment Variables

### `backend/.env.example`
```env
# CORS — comma-separated allowed origins
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Request timeout per platform probe (seconds)
PROBE_TIMEOUT=6.0

# Max concurrent connections in httpx pool
MAX_CONNECTIONS=40
```

---

## Running Both Servers Simultaneously

Open two terminal windows/tabs:

**Terminal 1 — Backend**
```bash
cd social-scout/backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend**
```bash
cd social-scout/frontend
npm run dev
```

Or install `concurrently` at the project root for a single command:

```bash
npm install -g concurrently

# From project root
concurrently \
  "cd backend && source venv/bin/activate && uvicorn main:app --reload" \
  "cd frontend && npm run dev"
```

---

## .gitignore

```gitignore
# Python
backend/venv/
backend/__pycache__/
backend/*.pyc
backend/.env

# Node
frontend/node_modules/
frontend/dist/
frontend/.env.local

# OS
.DS_Store
Thumbs.db
```

---

## Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| `CONNECTION ERROR: Load failed` | FastAPI not running | Start uvicorn, check port 8000 |
| CORS error in browser console | Origin not whitelisted | Add `localhost:5173` to `ALLOWED_ORIGINS` |
| `ModuleNotFoundError` | venv not activated | Run `source venv/bin/activate` |
| Scan returns all timeouts | Rate limiting / bot detection | See platform notes in `Tech_Stack.md` |
| `npm run dev` fails | Node modules missing | Run `npm install` first |
