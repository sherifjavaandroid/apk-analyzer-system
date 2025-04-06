# backend/ai-service/app/api/models.py
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Union
from enum import Enum

# User model for authentication
class User(BaseModel):
    id: str
    username: str
    email: str
    role: str = "user"
    full_name: Optional[str] = None

# AI Request base class
class AIRequestBase(BaseModel):
    ai_provider: str = "openai"  # Default provider
    options: Optional[Dict[str, Any]] = None

# AI Analysis types
class AnalysisType(str, Enum):
    SECURITY = "security"
    VULNERABILITY = "vulnerability"
    CODE_QUALITY = "code_quality"
    PERFORMANCE = "performance"
    COMPLEXITY = "complexity"
    DEPENDENCIES = "dependencies"
    ARCHITECTURE = "architecture"
    RISK_ASSESSMENT = "risk_assessment"
    CUSTOM = "custom"

# AI Explanation types
class ExplanationType(str, Enum):
    VULNERABILITY = "vulnerability"
    CODE = "code"
    ERROR = "error"
    CONCEPT = "concept"
    DEPENDENCY = "dependency"
    PATTERN = "pattern"
    ALGORITHM = "algorithm"
    CUSTOM = "custom"

# AI Code Generation types
class CodeType(str, Enum):
    FIX_VULNERABILITY = "fix_vulnerability"
    FIX_PERFORMANCE = "fix_performance"
    REFACTOR = "refactor"
    IMPLEMENT_FEATURE = "implement_feature"
    UNIT_TEST = "unit_test"
    DOCUMENTATION = "documentation"
    CUSTOM = "custom"

# AI Analysis Request model
class AIAnalysisRequest(AIRequestBase):
    analysis_type: AnalysisType
    data: Dict[str, Any]

# AI Explanation Request model
class AIExplainRequest(AIRequestBase):
    explanation_type: ExplanationType
    data: Dict[str, Any]

# AI Code Generation Request model
class AICodeRequest(AIRequestBase):
    code_type: CodeType
    data: Dict[str, Any]

# AI Response model
class AIResponse(BaseModel):
    id: str
    status: str
    created_at: str
    completed_at: Optional[str] = None
    error: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = None
    request_type: Optional[str] = None

# AI Analysis Result models for different types
class SecurityAnalysisResult(BaseModel):
    severity: str
    confidence: float
    issues_summary: str
    recommendations: List[str]
    risk_assessment: Dict[str, Any]
    detailed_analysis: Dict[str, Any]
    references: Optional[List[Dict[str, str]]] = None

class VulnerabilityAnalysisResult(BaseModel):
    vulnerability_type: str
    severity: str
    confidence: float
    description: str
    root_cause: str
    impact: str
    exploit_scenario: Optional[str] = None
    recommendations: List[str]
    code_fix: Optional[str] = None
    references: Optional[List[Dict[str, str]]] = None
    cwe_id: Optional[str] = None
    cvss_score: Optional[float] = None

class CodeQualityAnalysisResult(BaseModel):
    quality_score: float
    summary: str
    issues: List[Dict[str, Any]]
    recommendations: List[str]
    best_practices: List[Dict[str, str]]
    code_smells: List[Dict[str, Any]]
    detailed_analysis: Dict[str, Any]

class PerformanceAnalysisResult(BaseModel):
    performance_score: float
    summary: str
    bottlenecks: List[Dict[str, Any]]
    recommendations: List[str]
    complexity_analysis: Dict[str, Any]
    resource_usage: Dict[str, Any]
    optimization_suggestions: List[Dict[str, Any]]

class ComplexityAnalysisResult(BaseModel):
    complexity_score: float
    summary: str
    complex_components: List[Dict[str, Any]]
    recommendations: List[str]
    refactoring_suggestions: List[Dict[str, Any]]
    maintainability_assessment: Dict[str, Any]

class DependencyAnalysisResult(BaseModel):
    summary: str
    outdated_dependencies: List[Dict[str, Any]]
    vulnerable_dependencies: List[Dict[str, Any]]
    dependency_graph: Dict[str, Any]
    recommendations: List[str]
    risk_assessment: Dict[str, Any]

class ArchitectureAnalysisResult(BaseModel):
    summary: str
    architecture_patterns: List[Dict[str, Any]]
    component_analysis: Dict[str, Any]
    coupling_assessment: Dict[str, Any]
    cohesion_assessment: Dict[str, Any]
    recommendations: List[str]
    design_principles_evaluation: Dict[str, Any]

# Error Response model
class ErrorResponse(BaseModel):
    detail: str
    status_code: int = 400