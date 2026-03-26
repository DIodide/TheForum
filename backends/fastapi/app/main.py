import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.pipeline.router import router as pipeline_router

app = FastAPI(
    title="The Forum API",
    description="Backend API for The Forum application",
    version="0.1.0",
)

app.include_router(pipeline_router)

# Configure CORS — extra origins from CORS_ORIGINS env var (comma-separated)
_default_origins = [
    "http://localhost:3000",  # Next.js dev server
    "http://localhost:5173",  # Admin panel (Vite)
]
_extra = os.environ.get("CORS_ORIGINS", "")
_origins = _default_origins + [o.strip() for o in _extra.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "The Forum API is running"}


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy"}
