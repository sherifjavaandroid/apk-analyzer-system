# backend/apk-analyzer/app/api/routes.py
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, BackgroundTasks
from typing import List, Optional
import os
import uuid
import shutil
from datetime import datetime

from app.core.security import get_current_user, verify_admin
from app.api.models import (
    AnalysisResponse, User, AnalysisStatus,
    AnalysisRequest
)

router = APIRouter()

# In-memory database for results (would be replaced with a real database)
analysis_results = {}

# Path for temporary APK storage
UPLOAD_DIR = os.path.join("/tmp", "apk-analyzer-uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_apk(
        background_tasks: BackgroundTasks,
        file: UploadFile = File(...),
        current_user: User = Depends(get_current_user)
):
    """
    Upload and analyze an APK file.
    """
    # Validate file extension
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
        "status": AnalysisStatus.PROCESSING,
        "created_at": datetime.now().isoformat(),
        "user_id": current_user.id,
        "results": None
    }

    # Import processing function here to avoid circular imports
    from app.main import process_apk_analysis

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
        "status": AnalysisStatus.PROCESSING,
        "created_at": analysis_results[analysis_id]["created_at"]
    }

@router.get("/analysis/{analysis_id}", response_model=AnalysisResponse)
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

@router.get("/analyses")
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

@router.delete("/analysis/{analysis_id}")
async def delete_analysis(
        analysis_id: str,
        current_user: User = Depends(get_current_user)
):
    """
    Delete an analysis and its associated files.
    """
    if analysis_id not in analysis_results:
        raise HTTPException(status_code=404, detail="Analysis not found")

    analysis = analysis_results[analysis_id]

    # Check if the user has permission to delete this analysis
    if analysis["user_id"] != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You don't have permission to delete this analysis")

    # Delete the associated APK file if it exists
    file_path = os.path.join(UPLOAD_DIR, f"{analysis_id}.apk")
    if os.path.exists(file_path):
        os.remove(file_path)

    # Remove the analysis from memory
    del analysis_results[analysis_id]

    return {"message": "Analysis deleted successfully"}

@router.get("/admin/analyses", dependencies=[Depends(verify_admin)])
async def admin_list_all_analyses():
    """
    Admin-only endpoint to list all analyses.
    """
    all_analyses = [
        {
            "id": analysis_id,
            "filename": analysis["filename"],
            "status": analysis["status"],
            "created_at": analysis["created_at"],
            "user_id": analysis["user_id"]
        }
        for analysis_id, analysis in analysis_results.items()
    ]

    return {"analyses": all_analyses}