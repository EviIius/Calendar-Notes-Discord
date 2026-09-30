import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI(
    title="Calendar-Notes-Discord",
    description="Lightweight self-hosted calendar, notes, and Discord notification system",
    version="0.1.0"
)

static_dir = os.path.join(os.path.dirname(__file__), "static")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "Calendar-Notes-Discord", "version": "0.1.0"}

# Mount static files for frontend PWA
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
