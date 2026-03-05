> Open terminal within Social-Scout folder -

Run the following commands:

sudo apt update

# 1. Navigate to backend directory
cd Social-Scout/backend

# 2. Create and activate a virtual environment
python -m venv venv

# macOS / Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy environment template
cp .env.example .env
# Edit .env as needed
nano .env

# 5. Start the development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

## Backend will be live at:

API root: http://localhost:8000
Interactive docs: http://localhost:8000/docs
Health check: http://localhost:8000/health

# 1. Navigate to frontend directory
cd social-scout/frontend

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
Frontend will be live at http://localhost:5173

## With the proxy active, update the fetch URL in App.jsx from:

jsfetch(`http://localhost:8000/scan/${username}`)

to:
jsfetch(`/scan/${username}`)

====================================
Running Both Servers Simultaneously
====================================

Open two terminal windows/tabs:
## Terminal 1 — Backend

cd social-scout/backend
source venv/bin/activate
uvicorn main:app --reload --port 8000

## Terminal 2 — Frontend

cd social-scout/frontend
npm run dev

### Or install concurrently at the project root for a single command:

npm install -g concurrently

# From project root
concurrently \
  "cd backend && source venv/bin/activate && uvicorn main:app --reload" \
  "cd frontend && npm run dev"


# Access points:

Frontend: http://localhost:5173
Backend: http://localhost:8000




