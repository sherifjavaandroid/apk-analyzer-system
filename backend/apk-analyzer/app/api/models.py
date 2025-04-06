# backend/apk-analyzer/app/api/models.py
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
from enum import Enum

# User model for authentication
class User(BaseModel):
    id: str
    username: str
    email: str
    role: str = "user"
    full_name: Optional[str] = None

# Analysis status enum
class AnalysisStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

# Analysis request model
class AnalysisRequest(BaseModel):
    filename: str
    user_id: str
    options: Optional[Dict[str, Any]] = None

# APK Info model
class ApkInfo(BaseModel):
    package_name: Optional[str] = None
    version_name: Optional[str] = None
    version_code: Optional[Union[int, str]] = None
    min_sdk_version: Optional[int] = None
    target_sdk_version: Optional[int] = None
    permissions: List[str] = []
    activities: List[str] = []
    services: List[str] = []
    receivers: List[str] = []
    providers: List[str] = []
    file_size: Optional[int] = None
    dex_files: List[str] = []
    resources: Dict[str, Any] = {}
    libraries: List[Dict[str, Any]] = []
    assets: List[str] = []
    icon: Optional[str] = None
    frameworks: Optional[Dict[str, Any]] = None

# Security Issue model
class SecurityIssue(BaseModel):
    issue_id: str
    severity: str
    title: str
    description: str
    location: Optional[str] = None
    line_number: Optional[int] = None
    recommendation: Optional[str] = None
    cvss_score: Optional[float] = None
    references: List[str] = []

# Security Scan Results model
class SecurityScanResult(BaseModel):
    risk_score: int
    issues_count: int
    severity_counts: Dict[str, int]
    issues: List[SecurityIssue]

# Performance Analysis Results model
class PerformanceAnalysisResult(BaseModel):
    apk_size: Dict[str, Any]
    startup_estimate: Dict[str, Any]
    resource_usage: Dict[str, Any]
    memory_usage: Dict[str, Any]
    battery_impact: Dict[str, Any]
    ui_performance: Dict[str, Any]

# Technology Detection Results model
class TechnologyDetectionResult(BaseModel):
    frameworks: Dict[str, Any]
    libraries: Dict[str, Any]
    ui_toolkit: Dict[str, Any]
    programming_languages: Dict[str, Any]
    backend_technologies: Dict[str, Any]
    analytics_services: Dict[str, Any]
    ad_networks: Dict[str, Any]

# Complete Analysis Results model
class AnalysisResults(BaseModel):
    apk_info: Optional[ApkInfo] = None
    security: Optional[SecurityScanResult] = None
    performance: Optional[PerformanceAnalysisResult] = None
    technology: Optional[TechnologyDetectionResult] = None

# Analysis Response model
class AnalysisResponse(BaseModel):
    id: str
    filename: str
    status: AnalysisStatus
    created_at: str
    completed_at: Optional[str] = None
    error: Optional[str] = None
    results: Optional[AnalysisResults] = None
    user_id: Optional[str] = None

# Analysis List Response model
class AnalysisListResponse(BaseModel):
    analyses: List[AnalysisResponse]

# Error Response model
class ErrorResponse(BaseModel):
    detail: str
    status_code: int = 400