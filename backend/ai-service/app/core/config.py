# backend/ai-service/app/core/config.py
import os
from typing import List, Optional
from pydantic import BaseSettings, Field

class Settings(BaseSettings):
    """
    Application settings.
    Values are loaded from environment variables or fall back to defaults.
    """
    # API settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "AI Analysis Service"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "AI-powered analysis and explanation service for code and security issues"

    # CORS settings
    CORS_ORIGINS: List[str] = Field(
        default=["*"],
        description="List of allowed origins for CORS"
    )

    # Security settings
    SECRET_KEY: str = Field(
        default="supersecretkey",
        description="Secret key for JWT token generation. Change in production!"
    )

    # Logging settings
    LOG_LEVEL: str = "INFO"

    # OpenAI Settings
    OPENAI_API_KEY: str = Field(
        default="",
        description="OpenAI API key"
    )
    OPENAI_DEFAULT_MODEL: str = "gpt-4"

    # Anthropic Claude Settings
    ANTHROPIC_API_KEY: str = Field(
        default="",
        description="Anthropic API key"
    )
    ANTHROPIC_DEFAULT_MODEL: str = "claude-2"

    # DeepSeek Settings
    DEEPSEEK_API_KEY: str = Field(
        default="",
        description="DeepSeek API key"
    )
    DEEPSEEK_DEFAULT_MODEL: str = "deepseek-coder"

    # Request rate limits
    RATE_LIMIT_PER_MINUTE: int = 60

    # Request timeout settings
    REQUEST_TIMEOUT_SECONDS: int = 120

    # Cache settings
    ENABLE_CACHE: bool = True
    CACHE_TTL_SECONDS: int = 3600  # 1 hour

    class Config:
        env_prefix = "AI_SERVICE_"
        case_sensitive = True
        env_file = ".env"

# Initialize settings
settings = Settings()