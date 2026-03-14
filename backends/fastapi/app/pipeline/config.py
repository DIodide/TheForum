"""Pipeline configuration and environment variables."""

import os

from pydantic_settings import BaseSettings


class PipelineSettings(BaseSettings):
    """Settings for the listserv ingestion pipeline."""

    # Gmail API
    gmail_credentials_json: str = ""
    gmail_token_path: str = os.path.join(
        os.path.dirname(__file__), "..", "..", "gmail_token.json"
    )

    # OpenRouter (Gemini via OpenAI-compatible API)
    openrouter_api_key: str = ""
    openrouter_model: str = "google/gemini-flash-lite-3.1"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    # Database
    database_url: str = ""

    # Admin
    admin_api_key: str = ""

    # Dedup
    dedup_title_threshold: float = 0.75
    dedup_time_window_hours: int = 24

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = PipelineSettings()
