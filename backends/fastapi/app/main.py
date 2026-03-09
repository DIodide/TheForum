from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import get_engine
from app.services.diagnostics import get_evaluation_summary, get_recommendation_diagnostics
from app.services.feed_features import run_feed_feature_aggregation

settings = get_settings()
app = FastAPI(
    title="The Forum API",
    description="Backend API for The Forum recommendation and product intelligence services",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
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


def require_engine():
    engine = get_engine()
    if engine is None:
        raise HTTPException(status_code=503, detail="DATABASE_URL is not configured")
    return engine


@app.post("/jobs/aggregate-feed-features")
async def aggregate_feed_features() -> dict[str, object]:
    engine = require_engine()
    result = run_feed_feature_aggregation(engine)
    return {
        "status": "ok",
        "aggregation": result.to_dict(),
    }


@app.get("/diagnostics/recommendations/{user_id}")
async def recommendation_diagnostics(
    user_id: str,
    event_id: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
) -> dict[str, object]:
    engine = require_engine()
    diagnostics = get_recommendation_diagnostics(engine, user_id, limit=limit, event_id=event_id)
    return {
        "user_id": user_id,
        "event_id": event_id,
        "count": len(diagnostics),
        "items": diagnostics,
    }


@app.get("/diagnostics/evaluation")
async def evaluation_diagnostics(days: int = Query(default=30, ge=1, le=180)) -> dict[str, object]:
    engine = require_engine()
    return get_evaluation_summary(engine, days=days)
