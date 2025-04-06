# backend/github-analyzer/app/services/code_analyzer.py
import os
import subprocess
import json
import re
import logging
import tempfile
from typing import Dict, List, Any, Optional, Tuple
import asyncio
from concurrent.futures import ThreadPoolExecutor
import radon.complexity as cc
import radon.metrics as rm
from radon.visitors import ComplexityVisitor
from pycodestyle import StyleGuide

# Get logger
logger = logging.getLogger(__name__)

async def analyze_code_quality(repo_dir: str, options: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Analyze code quality of a repository.

    Args:
        repo_dir: The directory containing the cloned repository
        options: Configuration options for the analysis

    Returns:
        A dictionary with code quality analysis results
    """
    logger.info(f"Analyzing code quality in {repo_dir}")

    # Default options
    if options is None:
        options = {}

    max_files_to_analyze = options.get("max_files", 500)
    max_file_size = options.get("max_file_size", 1024 * 1024)  # 1MB default
    languages_to_analyze = options.get("languages", ["Python", "JavaScript", "TypeScript", "Java"])

    # Initialize results structure
    results = {
        "issues_count": 0,
        "quality_score": 100,  # Start with perfect score, deduct points for issues
        "complexity_score": 100,
        "maintainability_score": 100,
        "test_coverage": None,
        "issues_by_severity": {
            "critical": 0,
            "high": 0,
            "medium": 0,
            "low": 0,
            "info": 0
        },
        "issues": [],
        "summary": {
            "languages_analyzed": [],
            "files_analyzed": 0,
            "lines_of_code_analyzed": 0,
            "complexity_metrics": {},
            "style_violations": 0,
            "duplication": 0
        }
    }

    # File extensions to analyze
    extension_to_language = {
        ".py": "Python",
        ".js": "JavaScript",
        ".jsx": "JavaScript",
        ".ts": "TypeScript",
        ".tsx": "TypeScript",
        ".java": "Java",
        ".kt": "Kotlin",
        ".swift": "Swift",
        ".c": "C",
        ".cpp": "C++",
        ".h": "C/C++ Header",
        ".cs": "C#",
        ".go": "Go",
        ".rb": "Ruby",
        ".php": "PHP"
    }

    # Filter extensions based on languages to analyze
    extensions_to_analyze = [ext for ext, lang in extension_to_language.items()
                             if lang in languages_to_analyze]

    # Find files to analyze
    files_to_analyze = []
    for root, _, filenames in os.walk(repo_dir):
        for filename in filenames:
            file_path = os.path.join(root, filename)
            rel_path = os.path.relpath(file_path, repo_dir)

            # Skip hidden files and directories
            if any(part.startswith('.') for part in rel_path.split(os.sep)):
                continue

            # Skip files in certain directories
            if any(ignored in rel_path for ignored in ['node_modules', 'venv', '__pycache__',
                                                       'build', 'dist', 'migrations']):
                continue

            # Check file extension
            _, ext = os.path.splitext(filename.lower())
            if ext not in extensions_to_analyze:
                continue

            # Check file size
            try:
                file_size = os.path.getsize(file_path)
                if file_size > max_file_size:
                    continue

                files_to_analyze.append((file_path, rel_path, extension_to_language[ext]))

            except Exception as e:
                logger.warning(f"Failed to process file {file_path}: {e}")

    # Limit number of files to analyze
    files_to_analyze = files_to_analyze[:max_files_to_analyze]

    # Track languages analyzed
    languages_analyzed = set()

    # Analyze code complexity and style
    total_lines = 0
    avg_complexity = 0
    total_complexity = 0
    complexities = []
    maintainability_indices = []
    total_style_violations = 0
    files_analyzed = 0

    # Helper function to run analysis in threads
    def analyze_file(file_info):
        file_path, rel_path, language = file_info
        file_issues = []
        file_lines = 0
        file_complexity = 0
        file_maintainability = 0
        file_style_violations = 0

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                code = f.read()
                file_lines = code.count('\n') + 1

            # Python-specific analysis
            if language == "Python":
                # Analyze complexity
                try:
                    visitor = ComplexityVisitor.from_code(code)
                    complexity_results = visitor.functions
                    if complexity_results:
                        max_complexity = max(func.complexity for func in complexity_results)
                        min_complexity = min(func.complexity for func in complexity_results)
                        avg_complexity_for_file = sum(func.complexity for func in complexity_results) / len(complexity_results)
                        file_complexity = avg_complexity_for_file

                        # Check for highly complex functions
                        for func in complexity_results:
                            if func.complexity > 10:  # Cyclomatic complexity threshold
                                file_issues.append({
                                    "issue_id": "HIGH_COMPLEXITY",
                                    "severity": "medium" if func.complexity > 15 else "low",
                                    "title": f"High Cyclomatic Complexity ({func.complexity})",
                                    "description": f"Function '{func.name}' has a cyclomatic complexity of {func.complexity}, which is considered high.",
                                    "file_path": rel_path,
                                    "line_number": func.lineno,
                                    "source": func.name,
                                    "recommendation": "Consider refactoring this function to reduce complexity by breaking it into smaller functions."
                                })

                    # Analyze maintainability
                    mi = rm.mi_visit(code, True)
                    file_maintainability = mi

                    if mi < 65:  # Low maintainability index threshold
                        file_issues.append({
                            "issue_id": "LOW_MAINTAINABILITY",
                            "severity": "medium" if mi < 50 else "low",
                            "title": f"Low Maintainability Index ({mi:.2f})",
                            "description": f"This file has a maintainability index of {mi:.2f}, which is considered low.",
                            "file_path": rel_path,
                            "recommendation": "Consider refactoring this file to improve maintainability by reducing complexity and improving documentation."
                        })
                except Exception as e:
                    logger.warning(f"Failed to analyze complexity for {file_path}: {e}")

                # Check style
                try:
                    style_guide = StyleGuide(quiet=True)
                    style_result = style_guide.check_files([file_path])
                    num_violations = style_result.total_errors
                    file_style_violations = num_violations

                    if num_violations > 0:
                        file_issues.append({
                            "issue_id": "STYLE_VIOLATIONS",
                            "severity": "low",
                            "title": f"Style Violations ({num_violations})",
                            "description": f"This file has {num_violations} PEP 8 style violations.",
                            "file_path": rel_path,
                            "recommendation": "Consider running a code formatter like 'black' or 'autopep8' to fix style issues."
                        })
                except Exception as e:
                    logger.warning(f"Failed to check style for {file_path}: {e}")

            # JavaScript/TypeScript analysis
            elif language in ["JavaScript", "TypeScript"]:
                # Simple complexity heuristics
                # Count logical branches as a simple complexity metric
                branch_patterns = [
                    r'\bif\s*\(', r'\belse\b', r'\bfor\s*\(', r'\bwhile\s*\(',
                    r'\bswitch\s*\(', r'\bcase\b', r'\bcatch\s*\(', r'\?'
                ]

                branches = sum(len(re.findall(pattern, code)) for pattern in branch_patterns)
                functions = len(re.findall(r'\bfunction\b|\s=>\s|\basync\b', code))

                if functions > 0:
                    complexity = branches / functions
                    file_complexity = complexity

                    if complexity > 5:  # Simple complexity threshold
                        file_issues.append({
                            "issue_id": "HIGH_BRANCH_DENSITY",
                            "severity": "medium" if complexity > 8 else "low",
                            "title": f"High Branch Density ({complexity:.2f})",
                            "description": f"This file has {branches} branches across {functions} functions, averaging {complexity:.2f} branches per function.",
                            "file_path": rel_path,
                            "recommendation": "Consider refactoring complex functions to reduce the number of logical branches."
                        })

                # Check for long functions
                function_bodies = re.findall(r'{([^{}]*(?:{[^{}]*}[^{}]*)*)}', code)
                for body in function_bodies:
                    lines = body.count('\n') + 1
                    if lines > 50:  # Long function threshold
                        file_issues.append({
                            "issue_id": "LONG_FUNCTION",
                            "severity": "low",
                            "title": f"Long Function ({lines} lines)",
                            "description": f"This file contains a function that is {lines} lines long, which may indicate it's doing too much.",
                            "file_path": rel_path,
                            "recommendation": "Consider breaking this function into smaller, more focused functions."
                        })

            # Java analysis
            elif language == "Java":
                # Simple complexity heuristics
                branch_patterns = [
                    r'\bif\s*\(', r'\belse\b', r'\bfor\s*\(', r'\bwhile\s*\(',
                    r'\bswitch\s*\(', r'\bcase\b', r'\bcatch\s*\(', r'\?'
                ]

                branches = sum(len(re.findall(pattern, code)) for pattern in branch_patterns)
                methods = len(re.findall(r'(public|private|protected)\s+\w+\s+\w+\s*\([^)]*\)\s*(\{|throws)', code))

                if methods > 0:
                    complexity = branches / methods
                    file_complexity = complexity

                    if complexity > 5:  # Simple complexity threshold
                        file_issues.append({
                            "issue_id": "HIGH_BRANCH_DENSITY",
                            "severity": "medium" if complexity > 8 else "low",
                            "title": f"High Branch Density ({complexity:.2f})",
                            "description": f"This file has {branches} branches across {methods} methods, averaging {complexity:.2f} branches per method.",
                            "file_path": rel_path,
                            "recommendation": "Consider refactoring complex methods to reduce the number of logical branches."
                        })

                # Check for long methods
                method_bodies = re.findall(r'{([^{}]*(?:{[^{}]*}[^{}]*)*)}', code)
                for body in method_bodies:
                    lines = body.count('\n') + 1
                    if lines > 50:  # Long method threshold
                        file_issues.append({
                            "issue_id": "LONG_METHOD",
                            "severity": "low",
                            "title": f"Long Method ({lines} lines)",
                            "description": f"This file contains a method that is {lines} lines long, which may indicate it's doing too much.",
                            "file_path": rel_path,
                            "recommendation": "Consider breaking this method into smaller, more focused methods."
                        })

            # Check common code smells for all languages

            # Long lines
            long_lines = [i+1 for i, line in enumerate(code.split('\n')) if len(line) > 100]
            if long_lines:
                file_issues.append({
                    "issue_id": "LONG_LINES",
                    "severity": "low",
                    "title": f"Long Lines ({len(long_lines)})",
                    "description": f"This file contains {len(long_lines)} lines that are longer than 100 characters.",
                    "file_path": rel_path,
                    "line_number": long_lines[0] if long_lines else None,
                    "recommendation": "Consider breaking long lines to improve readability."
                })

            # Large file
            if file_lines > 500:  # Large file threshold
                file_issues.append({
                    "issue_id": "LARGE_FILE",
                    "severity": "medium" if file_lines > 1000 else "low",
                    "title": f"Large File ({file_lines} lines)",
                    "description": f"This file is {file_lines} lines long, which may indicate it has too many responsibilities.",
                    "file_path": rel_path,
                    "recommendation": "Consider breaking this file into smaller, more focused modules."
                })

            languages_analyzed.add(language)
            return (file_issues, file_lines, file_complexity, file_maintainability, file_style_violations, language)

        except Exception as e:
            logger.error(f"Failed to analyze file {file_path}: {e}")
            return ([], 0, 0, 0, 0, language)

    # Run analysis in parallel
    with ThreadPoolExecutor(max_workers=os.cpu_count()) as executor:
        analysis_results = list(executor.map(analyze_file, files_to_analyze))

    # Process results
    for file_issues, file_lines, file_complexity, file_maintainability, file_style_violations, language in analysis_results:
        if file_lines > 0:
            total_lines += file_lines
            files_analyzed += 1

            if file_complexity > 0:
                complexities.append(file_complexity)
                total_complexity += file_complexity

            if file_maintainability > 0:
                maintainability_indices.append(file_maintainability)

            total_style_violations += file_style_violations

            # Add file issues to results
            for issue in file_issues:
                results["issues"].append(issue)
                results["issues_by_severity"][issue["severity"]] += 1
                results["issues_count"] += 1

    # Calculate average complexity and maintainability
    if complexities:
        avg_complexity = total_complexity / len(complexities)

    avg_maintainability = sum(maintainability_indices) / len(maintainability_indices) if maintainability_indices else 0

    # Calculate scores
    # Complexity score: 100 is best (low complexity), 0 is worst (high complexity)
    if avg_complexity > 0:
        results["complexity_score"] = max(0, 100 - (avg_complexity * 5))

    # Maintainability score: directly from maintainability index (0-100)
    if avg_maintainability > 0:
        results["maintainability_score"] = min(100, avg_maintainability)

    # Quality score: affected by number and severity of issues
    issue_weight = {
        "critical": 10,
        "high": 5,
        "medium": 2,
        "low": 1,
        "info": 0
    }

    issue_penalty = sum(count * issue_weight[severity] for severity, count in results["issues_by_severity"].items())
    results["quality_score"] = max(0, 100 - min(100, issue_penalty))

    # Update summary
    results["summary"]["languages_analyzed"] = list(languages_analyzed)
    results["summary"]["files_analyzed"] = files_analyzed
    results["summary"]["lines_of_code_analyzed"] = total_lines
    results["summary"]["complexity_metrics"] = {
        "average_complexity": avg_complexity,
        "average_maintainability": avg_maintainability
    }
    results["summary"]["style_violations"] = total_style_violations

    # Sort issues by severity
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
    results["issues"].sort(key=lambda x: (severity_order[x["severity"]], x["file_path"]))

    # Limit issues to prevent response size issues
    if len(results["issues"]) > 100:
        results["issues"] = results["issues"][:100]

    return results