# backend/ai-service/app/services/code_generation.py
import os
import json
import logging
import re
from typing import Dict, List, Any, Optional
import httpx
import asyncio

from app.core.config import settings
from app.services.openai_service import generate_openai_analysis
from app.services.anthropic_service import generate_claude_analysis
from app.services.deepseek_service import generate_deepseek_analysis

# Get logger
logger = logging.getLogger(__name__)

async def generate_code_fix(
        code_type: str,
        data: Dict[str, Any],
        options: Optional[Dict[str, Any]] = None,
        ai_provider: str = "openai"
) -> Dict[str, Any]:
    """
    Generate or fix code using AI.

    Args:
        code_type: Type of code generation or fix
        data: Data containing code and context
        options: Configuration options for code generation
        ai_provider: AI provider to use (openai, anthropic, deepseek)

    Returns:
        Dictionary with code generation results
    """
    logger.info(f"Generating code fix for {code_type} using {ai_provider}")

    # Default options
    if options is None:
        options = {}

    # Create analysis type string for AI services
    analysis_type = f"code_{code_type}"

    # Generate code using appropriate AI provider
    if ai_provider.lower() == "anthropic":
        result = await generate_claude_analysis(
            analysis_type=analysis_type,
            data=data,
            options=options
        )
    elif ai_provider.lower() == "deepseek":
        result = await generate_deepseek_analysis(
            analysis_type=analysis_type,
            data=data,
            options=options
        )
    else:
        # Default to OpenAI
        result = await generate_openai_analysis(
            analysis_type=analysis_type,
            data=data,
            options=options
        )

    # Post-process the result to extract code
    processed_result = post_process_code_result(result, code_type)

    return processed_result

def post_process_code_result(result: Dict[str, Any], code_type: str) -> Dict[str, Any]:
    """
    Post-process code generation results to ensure they're formatted correctly.

    Args:
        result: Raw AI result
        code_type: Type of code generation

    Returns:
        Formatted code generation result
    """
    processed_result = result.copy()

    # If raw response contains code blocks, extract them
    if "raw_response" in result:
        raw_response = result["raw_response"]
        code_blocks = extract_code_blocks(raw_response)

        if code_blocks:
            processed_result["code_blocks"] = code_blocks

            # Set the first code block as the primary code solution
            if "code_solution" not in processed_result:
                processed_result["code_solution"] = code_blocks[0]["code"]
                processed_result["language"] = code_blocks[0]["language"]

    # Ensure standard fields exist
    if "code_solution" not in processed_result:
        processed_result["code_solution"] = ""

    if "language" not in processed_result:
        # Try to infer language from code type
        language_mapping = {
            "fix_vulnerability": "infer",
            "fix_performance": "infer",
            "refactor": "infer",
            "implement_feature": "infer",
            "unit_test": "infer",
            "documentation": "markdown",
            "custom": "infer"
        }

        lang = language_mapping.get(code_type, "infer")
        if lang == "infer" and "code_blocks" in processed_result and processed_result["code_blocks"]:
            # Use the language of the first code block
            lang = processed_result["code_blocks"][0]["language"]

        processed_result["language"] = lang

    # Ensure there's an explanation
    if "explanation" not in processed_result:
        if "raw_response" in processed_result:
            # Extract text outside of code blocks as explanation
            explanation = extract_explanation(processed_result["raw_response"])
            processed_result["explanation"] = explanation
        else:
            processed_result["explanation"] = "No explanation provided by the AI."

    # Add metadata about the code fix type
    if "metadata" not in processed_result:
        processed_result["metadata"] = {}

    processed_result["metadata"]["code_type"] = code_type

    return processed_result

def extract_code_blocks(text: str) -> List[Dict[str, Any]]:
    """
    Extract code blocks from markdown-formatted text.

    Args:
        text: Markdown-formatted text potentially containing code blocks

    Returns:
        List of dictionaries containing code and language information
    """
    code_blocks = []

    # Match markdown code blocks with language specification
    # Pattern: ```language\ncode\n```
    pattern = r'```(\w*)\n([\s\S]*?)\n```'
    matches = re.findall(pattern, text)

    for language, code in matches:
        if not language:
            # Try to infer language from code if not specified
            language = infer_language(code)

        code_blocks.append({
            "language": language,
            "code": code.strip()
        })

    return code_blocks

def extract_explanation(text: str) -> str:
    """
    Extract explanation text from a response by removing code blocks.

    Args:
        text: Response text with potential code blocks

    Returns:
        Explanation text
    """
    # Remove code blocks
    explanation = re.sub(r'```\w*\n[\s\S]*?\n```', '', text)

    # Clean up the explanation
    explanation = explanation.strip()

    # If explanation is very short, return the whole text
    if len(explanation) < 50:
        return text

    return explanation

def infer_language(code: str) -> str:
    """
    Infer programming language from code snippet.

    Args:
        code: Code snippet

    Returns:
        Inferred language name
    """
    # Simple heuristics to guess the language
    if re.search(r'import\s+[a-zA-Z0-9_.]+\s*;|public\s+(?:class|interface|enum)\s+\w+', code):
        return "java"
    elif re.search(r'import\s+[a-zA-Z0-9_.{}]+\s+from\s+|const\s+\w+\s*=|let\s+\w+\s*=|function\s+\w+\s*\(', code):
        return "javascript"
    elif re.search(r'import\s+[a-zA-Z0-9_.{}]+\s+from\s+|const\s+\w+\s*:|let\s+\w+\s*:|interface\s+\w+\s*{', code):
        return "typescript"
    elif re.search(r'import\s+[a-zA-Z0-9_.]+|def\s+\w+\s*\(|class\s+\w+\s*:', code):
        return "python"
    elif re.search(r'#include\s+[<"]|int\s+main\s*\(|void\s+\w+\s*\(', code):
        return "cpp"
    elif re.search(r'using\s+[a-zA-Z0-9_.]+\s*;|namespace\s+\w+|public\s+(?:class|interface|enum)\s+\w+', code):
        return "csharp"
    elif re.search(r'package\s+[a-zA-Z0-9_.]+|func\s+\w+\s*\(', code):
        return "go"
    elif re.search(r'require\s+[\'"]|def\s+\w+|class\s+\w+\s*<', code):
        return "ruby"
    elif re.search(r'use\s+[a-zA-Z0-9_\\]+\s*;|function\s+\w+\s*\(|class\s+\w+', code):
        return "php"
    elif re.search(r'<!DOCTYPE\s+html>|<html|<script|<style', code, re.IGNORECASE):
        return "html"
    elif re.search(r'@media|body\s*{|\.[\w-]+\s*{', code):
        return "css"
    else:
        return "text"

async def generate_vulnerability_fix(
        vulnerability_data: Dict[str, Any],
        options: Optional[Dict[str, Any]] = None,
        ai_provider: str = "openai"
) -> Dict[str, Any]:
    """
    Generate a fix for a specific vulnerability.

    Args:
        vulnerability_data: Data describing the vulnerability
        options: Configuration options
        ai_provider: AI provider to use

    Returns:
        Dictionary with vulnerability fix
    """
    logger.info(f"Generating vulnerability fix using {ai_provider}")

    # Prepare data for the AI
    data = {
        "vulnerability": vulnerability_data,
        "fix_request": "Generate a secure code fix that addresses this vulnerability."
    }

    # Generate fix
    result = await generate_code_fix(
        code_type="fix_vulnerability",
        data=data,
        options=options,
        ai_provider=ai_provider
    )

    return result

async def generate_unit_tests(
        code_data: Dict[str, Any],
        options: Optional[Dict[str, Any]] = None,
        ai_provider: str = "openai"
) -> Dict[str, Any]:
    """
    Generate unit tests for given code.

    Args:
        code_data: Data containing code to test
        options: Configuration options
        ai_provider: AI provider to use

    Returns:
        Dictionary with unit tests
    """
    logger.info(f"Generating unit tests using {ai_provider}")

    # Prepare data for the AI
    data = {
        "code": code_data,
        "test_request": "Generate comprehensive unit tests for this code."
    }

    # Generate tests
    result = await generate_code_fix(
        code_type="unit_test",
        data=data,
        options=options,
        ai_provider=ai_provider
    )

    return result

async def refactor_code(
        code_data: Dict[str, Any],
        options: Optional[Dict[str, Any]] = None,
        ai_provider: str = "openai"
) -> Dict[str, Any]:
    """
    Refactor code to improve quality, performance, or readability.

    Args:
        code_data: Data containing code to refactor
        options: Configuration options
        ai_provider: AI provider to use

    Returns:
        Dictionary with refactored code
    """
    logger.info(f"Refactoring code using {ai_provider}")

    # Prepare data for the AI
    data = {
        "code": code_data,
        "refactor_request": "Refactor this code to improve quality, performance, and readability."
    }

    if "goals" in options:
        data["refactor_goals"] = options["goals"]

    # Generate refactored code
    result = await generate_code_fix(
        code_type="refactor",
        data=data,
        options=options,
        ai_provider=ai_provider
    )

    return result