# backend/ai-service/app/main.py
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import uuid
from datetime import datetime
import logging
import json

from app.core.config import settings
from app.core.security import get_current_user
from app.api.models import (
    AIRequestBase,
    AIAnalysisRequest,
    AIExplainRequest,
    AICodeRequest,
    AIResponse,
    User
)
from app.services.openai_service import generate_openai_analysis
from app.services.anthropic_service import generate_claude_analysis
from app.services.deepseek_service import generate_deepseek_analysis
from app.services.code_generation import generate_code_fix

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Analysis Service",
    description="AI-powered analysis and explanation service for code and security issues",
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

# In-memory storage for AI analysis results
ai_results = {}

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.post("/api/analyze", response_model=AIResponse)
async def analyze_with_ai(
        request: AIAnalysisRequest,
        background_tasks: BackgroundTasks,
        current_user: User = Depends(get_current_user)
):
    """
    Analyze data with AI and provide insights.
    """
    logger.info(f"Received AI analysis request: {request.analysis_type}")

    # Create a unique ID for this analysis
    analysis_id = str(uuid.uuid4())

    # Create an initial response
    ai_results[analysis_id] = {
        "id": analysis_id,
        "status": "processing",
        "created_at": datetime.now().isoformat(),
        "user_id": current_user.id,
        "request_type": "analysis",
        "result": None
    }

    # Start analysis in background
    background_tasks.add_task(
        process_ai_analysis,
        analysis_id=analysis_id,
        request=request,
        user_id=current_user.id
    )

    return {
        "id": analysis_id,
        "status": "processing",
        "created_at": ai_results[analysis_id]["created_at"]
    }

@app.get("/api/result/{analysis_id}", response_model=AIResponse)
async def get_ai_result(
        analysis_id: str,
        current_user: User = Depends(get_current_user)
):
    """
    Get the result of a previous AI analysis, explanation, or code generation.
    """
    if analysis_id not in ai_results:
        raise HTTPException(status_code=404, detail="AI result not found")

    result = ai_results[analysis_id]

    # Check if the user has permission to access this result
    if result["user_id"] != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You don't have permission to access this result")

    return result

@app.get("/api/results")
async def list_ai_results(current_user: User = Depends(get_current_user)):
    """
    List all AI analysis results for the current user.
    """
    user_results = [
        {
            "id": result_id,
            "status": result["status"],
            "request_type": result["request_type"],
            "created_at": result["created_at"]
        }
        for result_id, result in ai_results.items()
        if result["user_id"] == current_user.id or current_user.role == "admin"
    ]

    return {"results": user_results}

async def process_ai_analysis(
        analysis_id: str,
        request: AIAnalysisRequest,
        user_id: str
):
    """
    Process AI analysis in the background.
    """
    try:
        logger.info(f"Starting AI analysis: {analysis_id}, type: {request.analysis_type}")

        result = None
        # Choose AI service based on provider specified in request
        if request.ai_provider.lower() == "openai":
            result = await generate_openai_analysis(
                analysis_type=request.analysis_type,
                data=request.data,
                options=request.options
            )
        elif request.ai_provider.lower() == "anthropic":
            result = await generate_claude_analysis(
                analysis_type=request.analysis_type,
                data=request.data,
                options=request.options
            )
        elif request.ai_provider.lower() == "deepseek":
            result = await generate_deepseek_analysis(
                analysis_type=request.analysis_type,
                data=request.data,
                options=request.options
            )
        else:
            # Default to OpenAI
            result = await generate_openai_analysis(
                analysis_type=request.analysis_type,
                data=request.data,
                options=request.options
            )

        # Update the result
        ai_results[analysis_id].update({
            "status": "completed",
            "completed_at": datetime.now().isoformat(),
            "result": result
        })

        logger.info(f"AI analysis completed: {analysis_id}")

    except Exception as e:
        logger.error(f"Error in AI analysis: {e}", exc_info=True)
        # Handle errors
        ai_results[analysis_id].update({
            "status": "failed",
            "error": str(e),
            "completed_at": datetime.now().isoformat()
        })

async def process_ai_explanation(
        analysis_id: str,
        request: AIExplainRequest,
        user_id: str
):
    """
    Process AI explanation in the background.
    """
    try:
        logger.info(f"Starting AI explanation: {analysis_id}, type: {request.explanation_type}")

        result = None
        # Choose AI service based on provider specified in request
        if request.ai_provider.lower() == "openai":
            result = await generate_openai_analysis(
                analysis_type=f"explain_{request.explanation_type}",
                data=request.data,
                options=request.options
            )
        elif request.ai_provider.lower() == "anthropic":
            result = await generate_claude_analysis(
                analysis_type=f"explain_{request.explanation_type}",
                data=request.data,
                options=request.options
            )
        elif request.ai_provider.lower() == "deepseek":
            result = await generate_deepseek_analysis(
                analysis_type=f"explain_{request.explanation_type}",
                data=request.data,
                options=request.options
            )
        else:
            # Default to OpenAI
            result = await generate_openai_analysis(
                analysis_type=f"explain_{request.explanation_type}",
                data=request.data,
                options=request.options
            )

        # Update the result
        ai_results[analysis_id].update({
            "status": "completed",
            "completed_at": datetime.now().isoformat(),
            "result": result
        })

        logger.info(f"AI explanation completed: {analysis_id}")

    except Exception as e:
        logger.error(f"Error in AI explanation: {e}", exc_info=True)
        # Handle errors
        ai_results[analysis_id].update({
            "status": "failed",
            "error": str(e),
            "completed_at": datetime.now().isoformat()
        })

async def process_code_generation(
        analysis_id: str,
        request: AICodeRequest,
        user_id: str
):
    """
    Process code generation/fixing in the background.
    """
    try:
        logger.info(f"Starting code generation: {analysis_id}, type: {request.code_type}")

        result = await generate_code_fix(
            code_type=request.code_type,
            data=request.data,
            options=request.options,
            ai_provider=request.ai_provider
        )

        # Update the result
        ai_results[analysis_id].update({
            "status": "completed",
            "completed_at": datetime.now().isoformat(),
            "result": result
        })

        logger.info(f"Code generation completed: {analysis_id}")

    except Exception as e:
        logger.error(f"Error in code generation: {e}", exc_info=True)
        # Handle errors
        ai_results[analysis_id].update({
            "status": "failed",
            "error": str(e),
            "completed_at": datetime.now().isoformat()
        })

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8003, reload=True)_results[analysis_id]["created_at"]
    }

    @app.post("/api/explain", response_model=AIResponse)
    async def explain_with_ai(
            request: AIExplainRequest,
            background_tasks: BackgroundTasks,
            current_user: User = Depends(get_current_user)
    ):
        """
        Explain code, vulnerabilities, or other technical concepts with AI.
        """
        logger.info(f"Received AI explanation request: {request.explanation_type}")

        # Create a unique ID for this explanation
        analysis_id = str(uuid.uuid4())

        # Create an initial response
        ai_results[analysis_id] = {
            "id": analysis_id,
            "status": "processing",
            "created_at": datetime.now().isoformat(),
            "user_id": current_user.id,
            "request_type": "explanation",
            "result": None
        }

        # Start explanation in background
        background_tasks.add_task(
            process_ai_explanation,
            analysis_id=analysis_id,
            request=request,
            user_id=current_user.id
        )

        return {
            "id": analysis_id,
            "status": "processing",
            "created_at": ai_results[analysis_id]["created_at"]
        }

    @app.post("/api/generate-code", response_model=AIResponse)
    async def generate_code_with_ai(
            request: AICodeRequest,
            background_tasks: BackgroundTasks,
            current_user: User = Depends(get_current_user)
    ):
        """
        Generate or fix code with AI.
        """
        logger.info(f"Received code generation request: {request.code_type}")

        # Create a unique ID for this code generation
        analysis_id = str(uuid.uuid4())

        # Create an initial response
        ai_results[analysis_id] = {
            "id": analysis_id,
            "status": "processing",
            "created_at": datetime.now().isoformat(),
            "user_id": current_user.id,
            "request_type": "code_generation",
            "result": None
        }

        # Start code generation in background
        background_tasks.add_task(
            process_code_generation,
            analysis_id=analysis_id,
            request=request,
            user_id=current_user.id
        )

        return {
            "id": analysis_id,
            "status": "processing",
            "created_at": ai