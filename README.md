# Tech Test: Local LLM → Google Maps (Fullstack)

This repository contains a fullstack demo project with:

- **Backend**: FastAPI (handles natural language prompt → Google Places API)
- **Frontend**: React (Vite) (displays search results and embedded Google Maps)

---

## Folder Structure

```
tech-test-maps/
├─ backend/       ← FastAPI backend
├─ frontend/      ← React frontend
├─ .gitignore     ← Ignore env, venv, cache
├─ README.md      ← This global README
```

---

## Quick Start (Local)

### Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Fill in GOOGLE_MAPS_SERVER_KEY if you have one
# For quick demo, leave USE_MOCK_LLM=1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Fill in VITE_GOOGLE_MAPS_CLIENT_KEY if available
npm run dev
```

Open frontend at: `http://localhost:5173`  

Frontend proxies `/api` to backend automatically.

---

## Environment Variables

**Backend (`.env`)**  

```
GOOGLE_MAPS_SERVER_KEY=<your_server_key>
USE_MOCK_LLM=1
LLM_API_BASE=<optional>
```

**Frontend (`.env`)**  

```
VITE_GOOGLE_MAPS_CLIENT_KEY=<your_client_key>
```

---

## Notes

- By default, backend uses mock parser (`USE_MOCK_LLM=1`).  
- To use real local LLM (OpenWebUI/OpenLLM), set `LLM_API_BASE` and `USE_MOCK_LLM=0`.  
- Restrict API keys properly for production: HTTP referrer for client, IP for server.  
- Set Google Cloud Billing quota/alerts to avoid unexpected charges.

---

## Deliverables

- Backend + frontend running locally  
- Working Google Maps embed & Places search  
- Fullstack project pushed to a single GitHub repo
