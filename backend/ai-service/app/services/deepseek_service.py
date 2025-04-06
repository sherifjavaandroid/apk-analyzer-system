# backend/ai-service/app/services/deepseek_service.py
import os
import json
import logging
import re
from typing import Dict, List, Any, Optional
import httpx
import asyncio

from app.core.config import settings

# Get logger
logger = logging.getLogger(__name__)

async def generate_deepseek_analysis(
        analysis_type: str,
        data: Dict[str, Any],
        options: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Generate analysis using DeepSeek API.

    Args:
        analysis_type: Type of analysis to perform
        data: Data to analyze
        options: Configuration options for the analysis

    Returns:
        Dictionary with analysis results
    """
    logger.info(f"Generating DeepSeek analysis for {analysis_type}")

    # Default options
    if options is None:
        options = {}

    # Get API key from settings
    api_key = settings.DEEPSEEK_API_KEY
    if not api_key:
        raise ValueError("DeepSeek API key is not configured")

    # Select appropriate model
    model = options.get("model", settings.DEEPSEEK_DEFAULT_MODEL)

    # Generate appropriate prompt based on analysis type
    prompt = get_deepseek_prompt(analysis_type, data, options)

    # Make API request to DeepSeek
    try:
        async with httpx.AsyncClient() as client:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            }

            request_data = {
                "model": model,
                "messages": [
                    {"role": "system", "content": prompt["system"]},
                    {"role": "user", "content": prompt["user"]}
                ],
                "temperature": options.get("temperature", 0.2),
                "max_tokens": options.get("max_tokens", 4000),
                "top_p": options.get("top_p", 1),
                "stream": False
            }

            response = await client.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers=headers,
                json=request_data,
                timeout=120  # Longer timeout for complex analyses
            )

            if response.status_code != 200:
                logger.error(f"DeepSeek API error: {response.text}")
                raise Exception(f"DeepSeek API error: {response.status_code}")

            result = response.json()

            # Extract the AI's response
            ai_response = result["choices"][0]["message"]["content"]

            # Parse the AI's response
            parsed_result = parse_deepseek_response(ai_response, analysis_type)

            # Add metadata
            parsed_result["metadata"] = {
                "model": model,
                "tokens_used": result.get("usage", {}).get("total_tokens", 0),
                "provider": "deepseek"
            }

            return parsed_result

    except Exception as e:
        logger.error(f"Error calling DeepSeek API: {e}")
        raise Exception(f"Failed to generate DeepSeek analysis: {str(e)}")

def get_deepseek_prompt(
        analysis_type: str,
        data: Dict[str, Any],
        options: Dict[str, Any]
) -> Dict[str, str]:
    """
    Generate appropriate prompts for DeepSeek based on analysis type.

    Args:
        analysis_type: Type of analysis to perform
        data: Data to analyze
        options: Configuration options

    Returns:
        Dictionary with system and user prompts
    """
    # Format data for inclusion in prompt
    data_str = json.dumps(data, indent=2)

    prompts = {
        "security": {
            "system": """You are an expert security analyst specialized in application security. 
            Your task is to analyze security vulnerabilities, assess their severity and impact, 
            and provide detailed recommendations for mitigation. 
            
            Return your analysis in JSON format with the following structure:
            {
                "severity": "critical|high|medium|low|info",
                "confidence": 0.0-1.0,
                "issues_summary": "Brief summary of the security issues",
                "recommendations": ["recommendation1", "recommendation2", ...],
                "risk_assessment": {
                    "impact": "Description of potential impact",
                    "likelihood": "Assessment of exploitation likelihood",
                    "attack_vectors": ["vector1", "vector2", ...]
                },
                "detailed_analysis": {
                    "key_findings": ["finding1", "finding2", ...],
                    "vulnerability_details": [...],
                    "technical_explanation": "..."
                },
                "references": [
                    {"title": "OWASP Top 10", "url": "https://owasp.org/Top10/"},
                    ...
                ]
            }
            
            Ensure you provide a comprehensive security analysis with actionable recommendations.""",
            "user": f"Analyze the following security issues and provide a comprehensive security analysis:\n\n{data_str}"
        },
        "vulnerability": {
            "system": """You are an expert vulnerability researcher specialized in application security.
            Your task is to analyze a specific vulnerability, explain its root cause, assess its severity,
            and provide detailed recommendations for fixing it.
            
            Return your analysis in JSON format with the following structure:
            {
                "vulnerability_type": "SQL Injection|XSS|CSRF|...",
                "severity": "critical|high|medium|low|info",
                "confidence": 0.0-1.0,
                "description": "Detailed description of the vulnerability",
                "root_cause": "Technical explanation of the root cause",
                "impact": "Description of potential impact if exploited",
                "exploit_scenario": "A realistic scenario of how this could be exploited",
                "recommendations": ["recommendation1", "recommendation2", ...],
                "code_fix": "Suggested code fix (if applicable)",
                "references": [
                    {"title": "OWASP Top 10", "url": "https://owasp.org/Top10/"},
                    ...
                ],
                "cwe_id": "CWE-XXX",
                "cvss_score": X.X
            }
            
            Ensure you provide a comprehensive vulnerability analysis that includes specific remediation steps.""",
            "user": f"Analyze the following vulnerability and provide a comprehensive analysis:\n\n{data_str}"
        },
        "code_quality": {
            "system": """You are an expert code quality analyst specialized in software engineering best practices.
            Your task is to analyze code quality issues, assess maintainability, and provide detailed 
            recommendations for improving code quality.
            
            Return your analysis in JSON format with the following structure:
            {
                "quality_score": 0-100,
                "summary": "Brief summary of code quality assessment",
                "issues": [
                    {"type": "issue_type", "description": "description", "severity": "high|medium|low"},
                    ...
                ],
                "recommendations": ["recommendation1", "recommendation2", ...],
                "best_practices": [
                    {"title": "practice1", "description": "description1"},
                    ...
                ],
                "code_smells": [
                    {"type": "smell_type", "description": "description", "refactoring": "suggestion"},
                    ...
                ],
                "detailed_analysis": {
                    "complexity": {...},
                    "maintainability": {...},
                    "readability": {...},
                    "testability": {...}
                }
            }
            
            Ensure you provide a comprehensive code quality analysis that includes specific improvement recommendations.""",
            "user": f"Analyze the following code quality issues and provide a comprehensive analysis:\n\n{data_str}"
        },
        # Add more analysis types as needed
        "explain_code": {
            "system": """You are an expert software engineer specialized in explaining code to both technical and non-technical audiences.
            Your task is to explain code in clear, educational terms, covering its purpose, how it works, and potential issues.
            
            Return your explanation in JSON format with the following structure:
            {
                "title": "Code name or function",
                "summary": "Brief, accessible summary of what the code does",
                "purpose": "Explanation of the code's intended purpose",
                "breakdown": [
                    {"section": "section1", "explanation": "explanation1"},
                    ...
                ],
                "key_concepts": [
                    {"concept": "concept1", "explanation": "explanation1"},
                    ...
                ],
                "execution_flow": "Step-by-step explanation of execution",
                "edge_cases": ["edge_case1", "edge_case2", ...],
                "potential_issues": ["issue1", "issue2", ...],
                "best_practices": ["practice1", "practice2", ...],
                "improvement_suggestions": ["suggestion1", "suggestion2", ...]
            }
            
            Ensure you provide a comprehensive, educational explanation that would be helpful to developers.""",
            "user": f"Explain the following code in educational terms:\n\n{data_str}"
        }
    }

    # Handle custom prompts
    if analysis_type == "custom" and "prompts" in options:
        return options["prompts"]

    # Add other explanation types
    if analysis_type.startswith("explain_"):
        explanation_type = analysis_type.replace("explain_", "")
        if explanation_type not in ["code"] and "explanation_prompt" in options:
            return {
                "system": options["explanation_prompt"].get("system", "You are an AI assistant. Explain the following information in detail."),
                "user": options["explanation_prompt"].get("user", f"Explain the following information:\n\n{data_str}")
            }

    # Return default prompt if not found
    if analysis_type not in prompts:
        return {
            "system": "You are an AI assistant. Analyze the following information in detail.",
            "user": f"Analyze the following information:\n\n{data_str}"
        }

    return prompts[analysis_type]

def parse_deepseek_response(response: str, analysis_type: str) -> Dict[str, Any]:
    """
    Parse the DeepSeek response into structured data.

    Args:
        response: Raw DeepSeek response text
        analysis_type: Type of analysis performed

    Returns:
        Structured analysis results
    """
    try:
        # Try to extract and parse JSON from the response
        json_match = re.search(r'```json\n([\s\S]*?)\n```', response)
        if json_match:
            json_str = json_match.group(1)
            return json.loads(json_str)

        # If no JSON block found, try parsing the entire response
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            # If not valid JSON, create a simple structure with the raw response
            return {
                "raw_response": response,
                "summary": "The AI generated a non-structured response.",
                "analysis_type": analysis_type
            }

    except Exception as e:
        logger.error(f"Error parsing DeepSeek response: {e}")
        return {
            "raw_response": response,
            "error": f"Failed to parse response: {str(e)}",
            "analysis_type": analysis_type
        }