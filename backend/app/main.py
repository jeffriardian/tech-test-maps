import os
import json
from urllib.parse import quote_plus
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv

load_dotenv()
app = FastAPI(title="Hello, Google Maps API is connected!")

# Config via env
LLM_API_BASE = os.getenv("LLM_API_BASE", "").rstrip("/")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
GOOGLE_MAPS_SERVER_KEY = os.getenv("GOOGLE_MAPS_SERVER_KEY", "")
# If no LLM backend provided, we'll use a simple local parser fallback.
USE_MOCK_LLM = os.getenv("USE_MOCK_LLM", "1") == "1"

class AskReq(BaseModel):
    prompt: str
    lat: float = None
    lng: float = None

async def call_external_llm(prompt: str):
    if USE_MOCK_LLM or not LLM_API_BASE:
        # Simple deterministic parser: return JSON with q equal to prompt.
        # Also try to normalize "near" phrases.
        q = prompt.strip()
        # If user says "near <place>", keep it.
        return {"q": q}
    # Try OpenAI-compatible endpoint
    url = f"{LLM_API_BASE}/v1/chat/completions"
    payload = {
        "model": os.getenv("LLM_MODEL", "local-model"),
        "messages": [
            {"role": "system", "content": "You are a JSON-only parser. Output STRICT JSON with key 'q'."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 200,
        "temperature": 0.0
    }
    headers = {}
    if LLM_API_KEY:
        headers["Authorization"] = f"Bearer {LLM_API_KEY}"
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(url, json=payload, headers=headers)
        r.raise_for_status()
        data = r.json()
    # Extract content (OpenAI-like)
    try:
        content = data["choices"][0]["message"]["content"]
    except Exception:
        content = json.dumps(data)
    try:
        parsed = json.loads(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM returned non-JSON: {e} -> {content}")
    return parsed

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.post("/api/ask")
async def ask(req: AskReq):
    parsed = await call_external_llm(req.prompt)
    q = parsed.get("q") or req.prompt
    # If no Google key, return a helpful message and empty list
    if not GOOGLE_MAPS_SERVER_KEY:
        return {
            "query": q,
            "embed_q": q,
            "places": [],
            "warning": "GOOGLE_MAPS_SERVER_KEY not set in backend. Provide it to enable real Places search."
        }
    # call Places Text Search
    places_url = (
        "https://maps.googleapis.com/maps/api/place/textsearch/json"
        f"?query={quote_plus(q)}&key={GOOGLE_MAPS_SERVER_KEY}"
    )
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(places_url)
        r.raise_for_status()
        places_data = r.json()
    results = []
    for p in places_data.get("results", [])[:10]:
        loc = p.get("geometry", {}).get("location", {})
        results.append({
            "name": p.get("name"),
            "address": p.get("formatted_address"),
            "place_id": p.get("place_id"),
            "lat": loc.get("lat"),
            "lng": loc.get("lng"),
            "rating": p.get("rating")
        })
    return {"query": q, "embed_q": q, "places": results}
