# backend/apk-analyzer/app/core/config.py
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
    PROJECT_NAME: str = "APK Analyzer Service"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Advanced APK analysis service for security, performance, and technology detection"

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
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # File upload settings
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024  # 100 MB
    ALLOWED_EXTENSIONS: List[str] = [".apk"]
    UPLOAD_DIR: str = "/tmp/apk-analyzer-uploads"

    # Analysis settings
    ANALYSIS_TIMEOUT: int = 300  # 5 minutes
    MAX_CONCURRENT_ANALYSES: int = 5

    # Tool paths
    AAPT_PATH: Optional[str] = None  # Will use system path if None
    APKTOOL_PATH: Optional[str] = None

    # Logging settings
    LOG_LEVEL: str = "INFO"

    class Config:
        env_prefix = "APK_ANALYZER_"
        case_sensitive = True
        env_file = ".env"

# Initialize settings
settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)