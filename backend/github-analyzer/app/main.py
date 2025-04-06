# backend/github-analyzer/app/main.py
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import tempfile
import uuid
import shutil
from datetime import datetime
import httpx
import asyncio
import logging

from app.core.config import settings
from app.core.security import get_current_user
from app.api.models import (
    GitHubAnalysisRequest,
    GitHubAnalysisResponse,
    User,
    AnalysisStatus
)
from app.services.repo_scanner import clone_repository, analyze_repo_structure
from app.services.code_analyzer import analyze_code_quality
from app.services.dependency_checker import check_dependencies
from app.services.security_analyzer import scan_security_issues

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="GitHub Repository Analyzer Service",
    description="Analyzes GitHub repositories for security issues, code quality, and dependencies",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
TEMP_DIR = os.path.join(tempfile.gettempdir(), "github-analyzer-repos")
os.makedirs(TEMP_DIR, exist_ok=True)

# In-memory database for results (would be replaced with a real database)
analysis_results = {}

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.post("/api/analyze", response_model=GitHubAnalysisResponse)
async def analyze_github_repo(
        request: GitHubAnalysisRequest,
        background_tasks: BackgroundTasks,
        current_user: User = Depends(get_current_user)
):
    """
    Analyze a GitHub repository.
    """
    # Validate repository URL
    if not request.repository_url.startswith("https://github.com/"):
        raise HTTPException(status_code=400, detail="Invalid GitHub repository URL")

    # Create a unique ID for this analysis
    analysis_id = str(uuid.uuid4())

    # Create an initial response
    analysis_results[analysis_id] = {
        "id": analysis_id,
        "repository_url": request.repository_url,
        "status": AnalysisStatus.PENDING,
        "created_at": datetime.now().isoformat(),
        "user_id": current_user.id,
        "branch": request.branch or "main",  # Default to main branch if not specified
        "options": request.options or {},
        "results": None
    }

    # Start analysis in background
    background_tasks.add_task(
        process_github_analysis,
        analysis_id=analysis_id,
        repo_url=request.repository_url,
        branch=request.branch or "main",
        options=request.options or {},
        user_id=current_user.id
    )

    return {
        "id": analysis_id,
        "repository_url": request.repository_url,
        "branch": request.branch or "main",
        "status": AnalysisStatus.PENDING,
        "created_at": analysis_results[analysis_id]["created_at"]
    }

@app.get("/api/analysis/{analysis_id}", response_model=GitHubAnalysisResponse)
async def get_analysis_result(
        analysis_id: str,
        current_user: User = Depends(get_current_user)
):
    """
    Get the results of a previous GitHub repository analysis.
    """
    if analysis_id not in analysis_results:
        raise HTTPException(status_code=404, detail="Analysis not found")

    analysis = analysis_results[analysis_id]

    # Check if the user has permission to access this analysis
    if analysis["user_id"] != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You don't have permission to access this analysis")

    return analysis

@app.get("/api/analyses")
async def list_analyses(current_user: User = Depends(get_current_user)):
    """
    List all GitHub repository analyses for the current user.
    """
    user_analyses = [
        {
            "id": analysis_id,
            "repository_url": analysis["repository_url"],
            "branch": analysis["branch"],
            "status": analysis["status"],
            "created_at": analysis["created_at"]
        }
        for analysis_id, analysis in analysis_results.items()
        if analysis["user_id"] == current_user.id or current_user.role == "admin"
    ]

    return {"analyses": user_analyses}

async def process_github_analysis(
        analysis_id: str,
        repo_url: str,
        branch: str,
        options: dict,
        user_id: str
):
    """
    Process GitHub repository analysis in the background.
    """
    try:
        # Update status to processing
        analysis_results[analysis_id]["status"] = AnalysisStatus.PROCESSING

        # Create a unique directory for this analysis
        repo_dir = os.path.join(TEMP_DIR, analysis_id)
        os.makedirs(repo_dir, exist_ok=True)

        # Clone the repository
        repo_info = await clone_repository(repo_url, repo_dir, branch)

        # Analyze repository structure
        structure_results = await analyze_repo_structure(repo_dir)

        # Analyze code quality
        code_quality_results = await analyze_code_quality(repo_dir, options.get("code_quality", {}))

        # Check dependencies
        dependency_results = await check_dependencies(repo_dir, options.get("dependencies", {}))

        # Scan for security issues
        security_results = await scan_security_issues(repo_dir, options.get("security", {}))

        # Update the results
        analysis_results[analysis_id].update({
            "status": AnalysisStatus.COMPLETED,
            "completed_at": datetime.now().isoformat(),
            "results": {
                "repository_info": repo_info,
                "repository_structure": structure_results,
                "code_quality": code_quality_results,
                "dependencies": dependency_results,
                "security": security_results
            }
        })
    except Exception as e:
        logger.error(f"Error in GitHub analysis: {e}", exc_info=True)
        # Handle errors
        analysis_results[analysis_id].update({
            "status": AnalysisStatus.FAILED,
            "error": str(e),
            "completed_at": datetime.now().isoformat()
        })
    finally:
        # Clean up the cloned repository
        try:
            shutil.rmtree(repo_dir)
        except Exception as e:
            logger.warning(f"Failed to clean up repository directory: {e}")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8002, reload=True)