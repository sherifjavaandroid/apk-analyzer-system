# backend/github-analyzer/app/api/models.py
from pydantic import BaseModel, Field, HttpUrl
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

# GitHub Analysis request model
class GitHubAnalysisRequest(BaseModel):
    repository_url: str
    branch: Optional[str] = None
    options: Optional[Dict[str, Any]] = None

# Repository Info model
class RepositoryInfo(BaseModel):
    name: str
    owner: str
    description: Optional[str] = None
    default_branch: str
    stars: int
    forks: int
    open_issues: int
    language: Optional[str] = None
    license: Optional[str] = None
    size: int
    last_commit: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# File Info model
class FileInfo(BaseModel):
    path: str
    type: str  # "file" or "directory"
    size: Optional[int] = None
    extension: Optional[str] = None
    language: Optional[str] = None

# Repository Structure model
class RepositoryStructure(BaseModel):
    files_count: int
    directories_count: int
    size_bytes: int
    languages: Dict[str, int]  # Language -> lines of code
    file_extensions: Dict[str, int]  # Extension -> count
    files: List[FileInfo]
    top_directories: List[str]

# Code Quality Issue model
class CodeQualityIssue(BaseModel):
    issue_id: str
    severity: str
    title: str
    description: str
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    column: Optional[int] = None
    source: Optional[str] = None
    recommendation: Optional[str] = None

# Code Quality Result model
class CodeQualityResult(BaseModel):
    issues_count: int
    quality_score: int
    complexity_score: int
    maintainability_score: int
    test_coverage: Optional[float] = None
    issues_by_severity: Dict[str, int]
    issues: List[CodeQualityIssue]
    summary: Dict[str, Any]

# Dependency model
class Dependency(BaseModel):
    name: str
    current_version: str
    latest_version: Optional[str] = None
    is_outdated: bool = False
    dependency_type: str  # "direct", "dev", "transitive"
    ecosystem: str  # "npm", "pip", "maven", etc.
    license: Optional[str] = None
    vulnerabilities: List[Dict[str, Any]] = []

# Dependencies Result model
class DependenciesResult(BaseModel):
    ecosystems_detected: List[str]
    dependencies_count: int
    direct_dependencies_count: int
    outdated_dependencies_count: int
    vulnerable_dependencies_count: int
    dependencies: List[Dependency]
    dependency_graph: Optional[Dict[str, List[str]]] = None
    summary: Dict[str, Any]

# Security Issue model
class SecurityIssue(BaseModel):
    issue_id: str
    severity: str
    title: str
    description: str
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    issue_type: str  # "secret", "vulnerability", "misconfiguration"
    recommendation: Optional[str] = None
    cwe_id: Optional[str] = None
    references: List[str] = []

# Security Scan Results model
class SecurityScanResult(BaseModel):
    risk_score: int
    issues_count: int
    secrets_found: int
    vulnerabilities_found: int
    misconfigurations_found: int
    severity_counts: Dict[str, int]
    issues: List[SecurityIssue]
    summary: Dict[str, Any]

# Complete GitHub Analysis Results model
class GitHubAnalysisResults(BaseModel):
    repository_info: Optional[RepositoryInfo] = None
    repository_structure: Optional[RepositoryStructure] = None
    code_quality: Optional[CodeQualityResult] = None
    dependencies: Optional[DependenciesResult] = None
    security: Optional[SecurityScanResult] = None

# GitHub Analysis Response model
class GitHubAnalysisResponse(BaseModel):
    id: str
    repository_url: str
    branch: str
    status: AnalysisStatus
    created_at: str
    completed_at: Optional[str] = None
    error: Optional[str] = None
    results: Optional[GitHubAnalysisResults] = None
    user_id: Optional[str] = None
    options: Optional[Dict[str, Any]] = None

# GitHub Analysis List Response model
class GitHubAnalysisListResponse(BaseModel):
    analyses: List[GitHubAnalysisResponse]

# Error Response model
class ErrorResponse(BaseModel):
    detail: str
    status_code: int = 400