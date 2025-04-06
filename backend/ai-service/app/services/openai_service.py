# backend/ai-service/app/services/openai_service.py
import os
import json
import logging
from typing import Dict, List, Any, Optional
import httpx
import asyncio

from app.core.config import settings

# Get logger
logger = logging.getLogger(__name__)

async def generate_openai_analysis(
        analysis_type: str,
        data: Dict[str, Any],
        options: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Generate analysis using OpenAI's API.

    Args:
        analysis_type: Type of analysis to perform
        data: Data to analyze
        options: Configuration options for the analysis

    Returns:
        Dictionary with analysis results
    """
    logger.info(f"Generating OpenAI analysis for {analysis_type}")

    # Default options
    if options is None:
        options = {}

    # Get API key from settings
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        raise ValueError("OpenAI API key is not configured")

    # Select appropriate model
    model = options.get("model", settings.OPENAI_DEFAULT_MODEL)

    # Generate appropriate prompt based on analysis type
    prompt = get_analysis_prompt(analysis_type, data, options)

    # Define messages for OpenAI
    messages = [
        {"role": "system", "content": prompt["system"]},
        {"role": "user", "content": prompt["user"]}
    ]

    # Make API request to OpenAI
    try:
        async with httpx.AsyncClient() as client:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            }

            request_data = {
                "model": model,
                "messages": messages,
                "temperature": options.get("temperature", 0.2),
                "max_tokens": options.get("max_tokens", 4000),
                "top_p": options.get("top_p", 1),
                "frequency_penalty": options.get("frequency_penalty", 0),
                "presence_penalty": options.get("presence_penalty", 0)
            }

            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=request_data,
                timeout=120  # Longer timeout for complex analyses
            )

            if response.status_code != 200:
                logger.error(f"OpenAI API error: {response.text}")
                raise Exception(f"OpenAI API error: {response.status_code}")

            result = response.json()

            # Extract the AI's response
            ai_response = result["choices"][0]["message"]["content"]

            # Parse the AI's response
            parsed_result = parse_ai_response(ai_response, analysis_type)

            # Add metadata
            parsed_result["metadata"] = {
                "model": model,
                "tokens_used": result.get("usage", {}).get("total_tokens", 0),
                "provider": "openai"
            }

            return parsed_result

    except Exception as e:
        logger.error(f"Error calling OpenAI API: {e}")
        raise Exception(f"Failed to generate OpenAI analysis: {str(e)}")

def get_analysis_prompt(
        analysis_type: str,
        data: Dict[str, Any],
        options: Dict[str, Any]
) -> Dict[str, str]:
    """
    Generate appropriate prompts based on analysis type.

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
            }""",
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
            }""",
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
            }""",
            "user": f"Analyze the following code quality issues and provide a comprehensive analysis:\n\n{data_str}"
        },
        "performance": {
            "system": """You are an expert performance engineer specialized in application performance optimization.
            Your task is to analyze performance issues, identify bottlenecks, and provide detailed 
            recommendations for improving performance.
            
            Return your analysis in JSON format with the following structure:
            {
                "performance_score": 0-100,
                "summary": "Brief summary of performance assessment",
                "bottlenecks": [
                    {"type": "bottleneck_type", "description": "description", "severity": "high|medium|low"},
                    ...
                ],
                "recommendations": ["recommendation1", "recommendation2", ...],
                "complexity_analysis": {...},
                "resource_usage": {...},
                "optimization_suggestions": [
                    {"area": "area1", "description": "description1", "expected_impact": "high|medium|low"},
                    ...
                ]
            }""",
            "user": f"Analyze the following performance issues and provide a comprehensive analysis:\n\n{data_str}"
        },
        "complexity": {
            "system": """You are an expert software architect specialized in software complexity analysis.
            Your task is to analyze code complexity, identify complex components, and provide detailed 
            recommendations for reducing complexity.
            
            Return your analysis in JSON format with the following structure:
            {
                "complexity_score": 0-100,
                "summary": "Brief summary of complexity assessment",
                "complex_components": [
                    {"component": "component1", "complexity_type": "type", "severity": "high|medium|low"},
                    ...
                ],
                "recommendations": ["recommendation1", "recommendation2", ...],
                "refactoring_suggestions": [
                    {"target": "target1", "suggestion": "suggestion1", "expected_impact": "high|medium|low"},
                    ...
                ],
                "maintainability_assessment": {...}
            }""",
            "user": f"Analyze the following complexity issues and provide a comprehensive analysis:\n\n{data_str}"
        },
        "dependencies": {
            "system": """You are an expert software engineer specialized in dependency management.
            Your task is to analyze dependencies, identify outdated or vulnerable dependencies, and provide detailed 
            recommendations for managing dependencies.
            
            Return your analysis in JSON format with the following structure:
            {
                "summary": "Brief summary of dependency assessment",
                "outdated_dependencies": [
                    {"name": "dep1", "current_version": "x.y.z", "latest_version": "a.b.c", "update_priority": "high|medium|low"},
                    ...
                ],
                "vulnerable_dependencies": [
                    {"name": "dep1", "version": "x.y.z", "vulnerability": "description", "severity": "high|medium|low"},
                    ...
                ],
                "dependency_graph": {...},
                "recommendations": ["recommendation1", "recommendation2", ...],
                "risk_assessment": {...}
            }""",
            "user": f"Analyze the following dependency information and provide a comprehensive analysis:\n\n{data_str}"
        },
        "architecture": {
            "system": """You are an expert software architect specialized in software architecture analysis.
            Your task is to analyze software architecture, identify architectural patterns, and provide detailed 
            recommendations for improving architecture.
            
            Return your analysis in JSON format with the following structure:
            {
                "summary": "Brief summary of architecture assessment",
                "architecture_patterns": [
                    {"pattern": "pattern1", "description": "description1", "assessment": "appropriate|inappropriate"},
                    ...
                ],
                "component_analysis": {...},
                "coupling_assessment": {...},
                "cohesion_assessment": {...},
                "recommendations": ["recommendation1", "recommendation2", ...],
                "design_principles_evaluation": {...}
            }""",
            "user": f"Analyze the following architecture information and provide a comprehensive analysis:\n\n{data_str}"
        },
        "risk_assessment": {
            "system": """You are an expert security and risk analyst.
            Your task is to perform a comprehensive risk assessment, identify potential risks, assess their impact and likelihood,
            and provide detailed recommendations for risk mitigation.
            
            Return your analysis in JSON format with the following structure:
            {
                "risk_score": 0-100,
                "summary": "Brief summary of risk assessment",
                "risks": [
                    {"risk_type": "type1", "description": "description1", "impact": "high|medium|low", "likelihood": "high|medium|low"},
                    ...
                ],
                "risk_matrix": {...},
                "critical_areas": ["area1", "area2", ...],
                "recommendations": ["recommendation1", "recommendation2", ...],
                "compliance_assessment": {...}
            }""",
            "user": f"Perform a risk assessment based on the following information and provide a comprehensive analysis:\n\n{data_str}"
        },
        # Explanation prompts
        "explain_vulnerability": {
            "system": """You are an expert security researcher specialized in explaining vulnerabilities to both technical and non-technical audiences.
            Your task is to explain a specific vulnerability in clear, educational terms, covering its technical aspects, implications, and solutions.
            
            Return your explanation in JSON format with the following structure:
            {
                "title": "Vulnerability name",
                "summary": "Brief, accessible summary",
                "technical_details": "Detailed technical explanation",
                "root_cause": "Explanation of the fundamental cause",
                "attack_vectors": ["vector1", "vector2", ...],
                "impact": "Explanation of potential impact",
                "examples": ["example1", "example2", ...],
                "prevention": ["prevention1", "prevention2", ...],
                "references": [{"title": "title1", "url": "url1"}, ...],
                "analogies": ["analogy1", "analogy2", ...]
            }""",
            "user": f"Explain the following vulnerability in educational terms:\n\n{data_str}"
        },
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
            }""",
            "user": f"Explain the following code in educational terms:\n\n{data_str}"
        }
    }

    # Handle custom prompts
    if analysis_type == "custom" and "prompts" in options:
        return options["prompts"]

    # Add other explanation types
    if analysis_type.startswith("explain_"):
        explanation_type = analysis_type.replace("explain_", "")
        if explanation_type not in ["vulnerability", "code"] and "explanation_prompt" in options:
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

def parse_ai_response(response: str, analysis_type: str) -> Dict[str, Any]:
    """
    Parse the AI response into structured data.

    Args:
        response: Raw AI response text
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
        logger.error(f"Error parsing AI response: {e}")
        return {
            "raw_response": response,
            "error": f"Failed to parse response: {str(e)}",
            "analysis_type": analysis_type
        }