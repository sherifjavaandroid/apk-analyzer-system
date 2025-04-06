# backend/apk-analyzer/app/main.py
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import tempfile
import uuid
import shutil
from datetime import datetime

from app.core.config import settings
from app.core.security import get_current_user
from app.api.models import AnalysisRequest, AnalysisResponse, User
from app.services.apk_extraction import extract_apk_info
from app.services.security_scanner import scan_apk_security
from app.services.performance_analyzer import analyze_performance
from app.services.tech_detector import detect_technology

app = FastAPI(
    title="APK Analyzer Service",
    description="Analyzes Android APK files for security, performance, and technology information",
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
UPLOAD_DIR = os.path.join(tempfile.gettempdir(), "apk-analyzer-uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# In-memory database for results (would be replaced with a real database)
analysis_results = {}

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_apk(
        background_tasks: BackgroundTasks,
        file: UploadFile = File(...),
        current_user: User = Depends(get_current_user)
):
    """
    Upload and analyze an APK file.
    """
    if not file.filename.endswith('.apk'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload an APK file.")

    # Create a unique ID for this analysis
    analysis_id = str(uuid.uuid4())

    # Save uploaded file
    file_path = os.path.join(UPLOAD_DIR, f"{analysis_id}.apk")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Reset file pointer for reading
    file.file.seek(0)

    # Create an initial response
    analysis_results[analysis_id] = {
        "id": analysis_id,
        "filename": file.filename,
        "status": "processing",
        "created_at": datetime.now().isoformat(),
        "user_id": current_user.id,
        "results": None
    }

    # Start analysis in background
    background_tasks.add_task(
        process_apk_analysis,
        analysis_id=analysis_id,
        file_path=file_path,
        user_id=current_user.id
    )

    return {
        "id": analysis_id,
        "filename": file.filename,
        "status": "processing",
        "created_at": analysis_results[analysis_id]["created_at"]
    }

@app.get("/api/analysis/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis_result(
        analysis_id: str,
        current_user: User = Depends(get_current_user)
):
    """
    Get the results of a previous APK analysis.
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
    List all analyses for the current user.
    """
    user_analyses = [
        {
            "id": analysis_id,
            "filename": analysis["filename"],
            "status": analysis["status"],
            "created_at": analysis["created_at"]
        }
        for analysis_id, analysis in analysis_results.items()
        if analysis["user_id"] == current_user.id or current_user.role == "admin"
    ]

    return {"analyses": user_analyses}

async def process_apk_analysis(analysis_id: str, file_path: str, user_id: str):
    """
    Process APK analysis in the background.
    """
    try:
        # Extract basic APK info
        apk_info = extract_apk_info(file_path)

        # Security scan
        security_results = scan_apk_security(file_path)

        # Performance analysis
        performance_results = analyze_performance(file_path)

        # Technology detection
        tech_results = detect_technology(file_path)

        # Update the results
        analysis_results[analysis_id].update({
            "status": "completed",
            "completed_at": datetime.now().isoformat(),
            "results": {
                "apk_info": apk_info,
                "security": security_results,
                "performance": performance_results,
                "technology": tech_results
            }
        })
    except Exception as e:
        # Handle errors
        analysis_results[analysis_id].update({
            "status": "failed",
            "error": str(e),
            "completed_at": datetime.now().isoformat()
        })
    finally:
        # Clean up the uploaded file
        try:
            os.remove(file_path)
        except Exception:
            pass

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)