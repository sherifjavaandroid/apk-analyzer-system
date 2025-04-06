# backend/ai-service/app/services/anthropic_service.py
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

async def generate_claude_analysis(
        analysis_type: str,
        data: Dict[str, Any],
        options: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Generate analysis using Anthropic Claude API.

    Args:
        analysis_type: Type of analysis to perform
        data: Data to analyze
        options: Configuration options for the analysis

    Returns:
        Dictionary with analysis results
    """
    logger.info(f"Generating Claude analysis for {analysis_type}")

    # Default options
    if options is None:
        options = {}

    # Get API key from settings
    api_key = settings.ANTHROPIC_API_KEY
    if not api_key:
        raise ValueError("Anthropic API key is not configured")

    # Select appropriate model
    model = options.get("model", settings.ANTHROPIC_DEFAULT_MODEL)

    # Generate appropriate prompt based on analysis type
    prompt = get_claude_prompt(analysis_type, data, options)

    # Make API request to Anthropic Claude
    try:
        async with httpx.AsyncClient() as client:
            headers = {
                "Content-Type": "application/json",
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01"
            }

            request_data = {
                "model": model,
                "prompt": f"{prompt['system']}\n\n{prompt['user']}",
                "max_tokens_to_sample": options.get("max_tokens", 4000),
                "temperature": options.get("temperature", 0.2),
                "top_p": options.get("top_p", 1),
                "top_k": options.get("top_k", 0)
            }

            response = await client.post(
                "https://api.anthropic.com/v1/complete",
                headers=headers,
                json=request_data,
                timeout=120  # Longer timeout for complex analyses
            )

            if response.status_code != 200:
                logger.error(f"Anthropic API error: {response.text}")
                raise Exception(f"Anthropic API error: {response.status_code}")

            result = response.json()

            # Extract the AI's response
            ai_response = result.get("completion", "")

            # Parse the AI's response
            parsed_result = parse_claude_response(ai_response, analysis_type)

            # Add metadata
            parsed_result["metadata"] = {
                "model": model,
                "provider": "anthropic_claude"
            }

            return parsed_result

    except Exception as e:
        logger.error(f"Error calling Anthropic API: {e}")
        raise Exception(f"Failed to generate Claude analysis: {str(e)}")

def get_claude_prompt(
        analysis_type: str,
        data: Dict[str, Any],
        options: Dict[str, Any]
) -> Dict[str, str]:
    """
    Generate appropriate prompts for Claude based on analysis type.

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
            "system": """Human: You are an expert security analyst specialized in application security. 
            I need you to analyze security vulnerabilities, assess their severity and impact, 
            and provide detailed recommendations for mitigation. 
            
            Please return your analysis in JSON format with the following structure:
            ```json
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
            ```""",
            "user": f"Analyze the following security issues and provide a comprehensive security analysis:\n\n{data_str}\n\nAssistant:"
        },
        "vulnerability": {
            "system": """Human: You are an expert vulnerability researcher specialized in application security.
            I need you to analyze a specific vulnerability, explain its root cause, assess its severity,
            and provide detailed recommendations for fixing it.
            
            Please return your analysis in JSON format with the following structure:
            ```json
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
            ```""",
            "user": f"Analyze the following vulnerability and provide a comprehensive analysis:\n\n{data_str}\n\nAssistant:"
        },
        "code_quality": {
            "system": """Human: You are an expert code quality analyst specialized in software engineering best practices.
            I need you to analyze code quality issues, assess maintainability, and provide detailed 
            recommendations for improving code quality.
            
            Please return your analysis in JSON format with the following structure:
            ```json
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
            ```""",
            "user": f"Analyze the following code quality issues and provide a comprehensive analysis:\n\n{data_str}\n\nAssistant:"
        },
        "performance": {
            "system": """Human: You are an expert performance engineer specialized in application performance optimization.
            I need you to analyze performance issues, identify bottlenecks, and provide detailed 
            recommendations for improving performance.
            
            Please return your analysis in JSON format with the following structure:
            ```json
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
            }
            ```""",
            "user": f"Analyze the following performance issues and provide a comprehensive analysis:\n\n{data_str}\n\nAssistant:"
        },
        "complexity": {
            "system": """Human: You are an expert software architect specialized in software complexity analysis.
            I need you to analyze code complexity, identify complex components, and provide detailed 
            recommendations for reducing complexity.
            
            Please return your analysis in JSON format with the following structure:
            ```json
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
            }
            ```""",
            "user": f"Analyze the following complexity issues and provide a comprehensive analysis:\n\n{data_str}\n\nAssistant:"
        },
        "dependencies": {
            "system": """Human: You are an expert software engineer specialized in dependency management.
            I need you to analyze dependencies, identify outdated or vulnerable dependencies, and provide detailed 
            recommendations for managing dependencies.
            
            Please return your analysis in JSON format with the following structure:
            ```json
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
            }
            ```""",
            "user": f"Analyze the following dependency information and provide a comprehensive analysis:\n\n{data_str}\n\nAssistant:"
        },
        "architecture": {
            "system": """Human: You are an expert software architect specialized in software architecture analysis.
            I need you to analyze software architecture, identify architectural patterns, and provide detailed 
            recommendations for improving architecture.
            
            Please return your analysis in JSON format with the following structure:
            ```json
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
            }
            ```""",
            "user": f"Analyze the following architecture information and provide a comprehensive analysis:\n\n{data_str}\n\nAssistant:"
        },
        # Explanation prompts
        "explain_vulnerability": {
            "system": """Human: You are an expert security researcher specialized in explaining vulnerabilities to both technical and non-technical audiences.
            I need you to explain a specific vulnerability in clear, educational terms, covering its technical aspects, implications, and solutions.
            
            Please return your explanation in JSON format with the following structure:
            ```json
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
            }
            ```""",
            "user": f"Explain the following vulnerability in educational terms:\n\n{data_str}\n\nAssistant:"
        },
        "explain_code": {
            "system": """Human: You are an expert software engineer specialized in explaining code to both technical and non-technical audiences.
            I need you to explain code in clear, educational terms, covering its purpose, how it works, and potential issues.
            
            Please return your explanation in JSON format with the following structure:
            ```json
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
            ```""",
            "user": f"Explain the following code in educational terms:\n\n{data_str}\n\nAssistant:"
        }
    }

    # Handle custom prompts
    if analysis_type == "custom" and "prompts" in options:
        system_prompt = f"Human: {options['prompts']['system']}"
        user_prompt = f"{options['prompts']['user']}\n\nAssistant:"
        return {
            "system": system_prompt,
            "user": user_prompt
        }

    # Add other explanation types
    if analysis_type.startswith("explain_"):
        explanation_type = analysis_type.replace("explain_", "")
        if explanation_type not in ["vulnerability", "code"] and "explanation_prompt" in options:
            system_prompt = f"Human: {options['explanation_prompt'].get('system', 'You are an AI assistant. Explain the following information in detail.')}"
            user_prompt = f"{options['explanation_prompt'].get('user', f'Explain the following information:\n\n{data_str}')}\n\nAssistant:"
            return {
                "system": system_prompt,
                "user": user_prompt
            }

    # Return default prompt if not found
    if analysis_type not in prompts:
        return {
            "system": "Human: You are an AI assistant. Analyze the following information in detail.",
            "user": f"Analyze the following information:\n\n{data_str}\n\nAssistant:"
        }

    return prompts[analysis_type]

def parse_claude_response(response: str, analysis_type: str) -> Dict[str, Any]:
    """
    Parse the Claude response into structured data.

    Args:
        response: Raw Claude response text
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
        logger.error(f"Error parsing Claude response: {e}")
        return {
            "raw_response": response,
            "error": f"Failed to parse response: {str(e)}",
            "analysis_type": analysis_type
        }