# backend/github-analyzer/app/services/security_analyzer.py
import os
import re
import json
import subprocess
import logging
from typing import Dict, List, Any, Optional, Set, Tuple
import asyncio
from concurrent.futures import ThreadPoolExecutor
import glob

# Get logger
logger = logging.getLogger(__name__)

async def scan_security_issues(repo_dir: str, options: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Scan a repository for security issues, including secrets, vulnerabilities, and misconfigurations.

    Args:
        repo_dir: The directory containing the cloned repository
        options: Configuration options for the security scan

    Returns:
        A dictionary with security scan results
    """
    logger.info(f"Scanning for security issues in {repo_dir}")

    # Default options
    if options is None:
        options = {}

    # Initialize results
    results = {
        "risk_score": 0,
        "issues_count": 0,
        "secrets_found": 0,
        "vulnerabilities_found": 0,
        "misconfigurations_found": 0,
        "severity_counts": {
            "critical": 0,
            "high": 0,
            "medium": 0,
            "low": 0,
            "info": 0
        },
        "issues": [],
        "summary": {
            "files_scanned": 0,
            "top_issue_types": {},
            "affected_file_count": 0
        }
    }

    # Scan for secrets
    secret_issues = await scan_for_secrets(repo_dir, options.get("secrets", {}))
    results["issues"].extend(secret_issues)
    results["secrets_found"] = len(secret_issues)

    # Scan for vulnerabilities
    vulnerability_issues = await scan_for_vulnerabilities(repo_dir, options.get("vulnerabilities", {}))
    results["issues"].extend(vulnerability_issues)
    results["vulnerabilities_found"] = len(vulnerability_issues)

    # Scan for misconfigurations
    misconfiguration_issues = await scan_for_misconfigurations(repo_dir, options.get("misconfigurations", {}))
    results["issues"].extend(misconfiguration_issues)
    results["misconfigurations_found"] = len(misconfiguration_issues)

    # Calculate totals
    results["issues_count"] = len(results["issues"])

    # Count issues by severity
    for issue in results["issues"]:
        severity = issue["severity"]
        results["severity_counts"][severity] += 1

    # Calculate risk score (0-100, higher is worse)
    severity_weights = {
        "critical": 10,
        "high": 5,
        "medium": 2,
        "low": 1,
        "info": 0
    }

    weighted_sum = sum(count * severity_weights[severity] for severity, count in results["severity_counts"].items())
    max_weight = 100  # A reasonable upper limit
    results["risk_score"] = min(100, int(weighted_sum * 100 / max_weight))

    # Sort issues by severity
    severity_order = {
        "critical": 0,
        "high": 1,
        "medium": 2,
        "low": 3,
        "info": 4
    }
    results["issues"].sort(key=lambda x: (severity_order[x["severity"]], x["issue_type"]))

    # Limit issues to prevent response size issues
    if len(results["issues"]) > 100:
        results["issues"] = results["issues"][:100]

    # Generate summary
    files_scanned = set()
    affected_files = set()
    issue_types = {}

    for issue in results["issues"]:
        if issue["file_path"]:
            affected_files.add(issue["file_path"])

        issue_type = issue["issue_type"]
        issue_types[issue_type] = issue_types.get(issue_type, 0) + 1

    # Count files in repository (simplified)
    for root, _, files in os.walk(repo_dir):
        for file in files:
            # Skip hidden files and directories
            if not any(part.startswith('.') for part in os.path.join(root, file).split(os.sep)):
                files_scanned.add(os.path.join(root, file))

    results["summary"]["files_scanned"] = len(files_scanned)
    results["summary"]["affected_file_count"] = len(affected_files)

    # Get top 5 issue types
    top_issue_types = sorted(issue_types.items(), key=lambda x: x[1], reverse=True)[:5]
    results["summary"]["top_issue_types"] = dict(top_issue_types)

    return results

async def scan_for_secrets(repo_dir: str, options: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Scan for hardcoded secrets in the repository."""
    logger.info("Scanning for secrets")
    issues = []

    # Define secret patterns (simplified)
    secret_patterns = [
        {
            "name": "AWS Access Key",
            "regex": r"(?i)(?:aws_access_key_id|aws_access_key|aws_key|aws_secret|aws_secret_key|aws_secret_access_key)(?:\"|\s|=|:|\s*=\s*|\s*:\s*)['\"]?([a-zA-Z0-9/+]{20,})(?:['\"]\s*)?",
            "severity": "critical"
        },
        {
            "name": "AWS Secret Key",
            "regex": r"(?i)(?:aws_secret_access_key|aws_secret_key|aws_key|aws_secret)(?:\"|\s|=|:|\s*=\s*|\s*:\s*)['\"]?([a-zA-Z0-9/+]{40,})(?:['\"]\s*)?",
            "severity": "critical"
        },
        {
            "name": "Google API Key",
            "regex": r"(?i)(?:google|gcp|google_cloud)(?:_|-|.)?(?:key|api|apikey|api_key|token)(?:\"|\s|=|:|\s*=\s*|\s*:\s*)['\"]?([a-zA-Z0-9_=-]{20,})(?:['\"]\s*)?",
            "severity": "critical"
        },
        {
            "name": "GitHub Token",
            "regex": r"(?i)(?:github|gh)(?:_|-|.)?(?:token|key|secret|pat|personal_access_token)(?:\"|\s|=|:|\s*=\s*|\s*:\s*)['\"]?([a-zA-Z0-9_=.-]{35,})(?:['\"]\s*)?",
            "severity": "critical"
        },
        {
            "name": "Generic API Key",
            "regex": r"(?i)(?:api_key|apikey|api token|key)(?:\"|\s|=|:|\s*=\s*|\s*:\s*)['\"]?([a-zA-Z0-9_=-]{20,})(?:['\"]\s*)?",
            "severity": "high"
        },
        {
            "name": "Generic Secret",
            "regex": r"(?i)(?:secret|token|password|passwd|pwd|auth)(?:\"|\s|=|:|\s*=\s*|\s*:\s*)['\"]([a-zA-Z0-9_=.-]{10,})(?:['\"]\s*)?",
            "severity": "high"
        },
        {
            "name": "Private Key",
            "regex": r"-----BEGIN (?:RSA|DSA|EC|OPENSSH) PRIVATE KEY-----",
            "severity": "critical"
        },
        {
            "name": "Connection String",
            "regex": r"(?i)(?:mongodb|mysql|postgresql|pg|redis)(?:.*?)(?:\"|\s|=|:|\s*=\s*|\s*:\s*)['\"](?:[^'\"]*?)(?::|@)(?:[^'\"\s]+)(?:['\"]\s*)?",
            "severity": "high"
        }
    ]

    # Find files to scan
    files_to_scan = []
    for root, _, files in os.walk(repo_dir):
        for file in files:
            file_path = os.path.join(root, file)

            # Skip binary files, images, and other non-text files
            if os.path.getsize(file_path) > 1024 * 1024:  # Skip files larger than 1MB
                continue

            # Skip common binary file extensions
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.pdf',
                                      '.zip', '.gz', '.tar', '.jar', '.class', '.so', '.dll',
                                      '.exe', '.bin', '.o', '.pyc')):
                continue

            # Skip files in certain directories
            rel_path = os.path.relpath(file_path, repo_dir)
            if any(segment.startswith('.') for segment in rel_path.split(os.sep)):
                continue

            # Skip node_modules and similar directories
            if any(dir_name in rel_path.split(os.sep) for dir_name in
                   ['node_modules', 'venv', 'env', '__pycache__', 'dist', 'build']):
                continue

            files_to_scan.append((file_path, rel_path))

    # Scan files for secrets
    for file_path, rel_path in files_to_scan:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

                for pattern in secret_patterns:
                    matches = re.finditer(pattern["regex"], content)

                    for match in matches:
                        # Get line number
                        line_number = content[:match.start()].count('\n') + 1

                        # Get matched secret (for display, partially redacted)
                        secret = match.group(1) if len(match.groups()) > 0 else match.group(0)
                        redacted_secret = secret[:4] + '*' * (len(secret) - 8) + secret[-4:] if len(secret) > 8 else '****'

                        # Create issue
                        issue = {
                            "issue_id": f"SECRET_{pattern['name'].upper().replace(' ', '_')}",
                            "severity": pattern["severity"],
                            "title": f"Hardcoded {pattern['name']} Detected",
                            "description": f"A hardcoded {pattern['name'].lower()} was found in the code. This represents a security risk as it could be used to gain unauthorized access.",
                            "file_path": rel_path,
                            "line_number": line_number,
                            "issue_type": "secret",
                            "recommendation": "Remove the hardcoded secret and use environment variables, a secure vault, or a secrets management service instead.",
                            "references": [
                                "https://owasp.org/www-community/vulnerabilities/Hardcoded_Password",
                                "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html"
                            ]
                        }

                        issues.append(issue)

        except Exception as e:
            logger.warning(f"Failed to scan file for secrets: {file_path} - {e}")

    return issues

async def scan_for_vulnerabilities(repo_dir: str, options: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Scan for code vulnerabilities in the repository."""
    logger.info("Scanning for code vulnerabilities")
    issues = []

    # Define vulnerability patterns (simplified)
    vulnerability_patterns = [
        {
            "name": "SQL Injection",
            "language": "python",
            "regex": r"(?:execute|executemany)\s*\(\s*[\"']SELECT\s+.*?\s+(?:WHERE|FROM)\s+.*?\s*\+|(?:execute|executemany)\s*\(\s*[\"'](?:UPDATE|INSERT|DELETE).*?\s*\+",
            "severity": "critical",
            "cwe": "CWE-89"
        },
        {
            "name": "SQL Injection",
            "language": "javascript",
            "regex": r"(?:query|execute)\s*\(\s*[\"']SELECT\s+.*?\s+(?:WHERE|FROM)\s+.*?\s*\+|(?:query|execute)\s*\(\s*[\"'](?:UPDATE|INSERT|DELETE).*?\s*\+",
            "severity": "critical",
            "cwe": "CWE-89"
        },
        {
            "name": "Cross-Site Scripting (XSS)",
            "language": "javascript",
            "regex": r"(?:innerHTML|outerHTML|document\.write|eval)\s*\(\s*.*?(?:param|value|data|input|request)",
            "severity": "high",
            "cwe": "CWE-79"
        },
        {
            "name": "Cross-Site Scripting (XSS)",
            "language": "python",
            "regex": r"(?:render|render_template|template).*?(?:param|value|data|input|request)",
            "severity": "high",
            "cwe": "CWE-79"
        },
        {
            "name": "Command Injection",
            "language": "python",
            "regex": r"(?:os\.system|os\.popen|subprocess\.Popen|subprocess\.call|subprocess\.run|eval|exec)\s*\(\s*(?:['\"].*?\s*\+|.*?(?:param|value|data|input|request))",
            "severity": "critical",
            "cwe": "CWE-78"
        },
        {
            "name": "Command Injection",
            "language": "javascript",
            "regex": r"(?:exec|spawn|execSync)\s*\(\s*(?:['\"].*?\s*\+|.*?(?:param|value|data|input|request))",
            "severity": "critical",
            "cwe": "CWE-78"
        },
        {
            "name": "Path Traversal",
            "language": "python",
            "regex": r"(?:open|file|read|write)\s*\(\s*(?:['\"].*?\s*\+|.*?(?:param|value|data|input|request))",
            "severity": "high",
            "cwe": "CWE-22"
        },
        {
            "name": "Path Traversal",
            "language": "javascript",
            "regex": r"(?:fs\.read|fs\.write|fs\.open|fs\.readFile|fs\.writeFile)\s*\(\s*(?:['\"].*?\s*\+|.*?(?:param|value|data|input|request))",
            "severity": "high",
            "cwe": "CWE-22"
        },
        {
            "name": "Insecure Deserialization",
            "language": "python",
            "regex": r"(?:pickle\.loads|yaml\.load|eval|exec)\s*\(\s*(?:['\"].*?\s*\+|.*?(?:param|value|data|input|request))",
            "severity": "high",
            "cwe": "CWE-502"
        },
        {
            "name": "Insecure Deserialization",
            "language": "javascript",
            "regex": r"JSON\.parse\s*\(\s*(?:['\"].*?\s*\+|.*?(?:param|value|data|input|request))",
            "severity": "medium",
            "cwe": "CWE-502"
        },
        {
            "name": "Hardcoded Credentials",
            "language": "any",
            "regex": r"(?:password|passwd|pwd|username|user|login|auth)(?:\"|\s|=|:|\s*=\s*|\s*:\s*)['\"]([a-zA-Z0-9_=.-]{4,})(?:['\"]\s*)?",
            "severity": "high",
            "cwe": "CWE-798"
        },
        {
            "name": "Insecure Cryptography",
            "language": "python",
            "regex": r"(?:md5|sha1)\s*\(\s*|(?:DES|RC4)",
            "severity": "medium",
            "cwe": "CWE-327"
        },
        {
            "name": "Insecure Cryptography",
            "language": "javascript",
            "regex": r"(?:createHash\s*\(\s*['\"](md5|sha1)['\"]|crypto\.createCipher\s*\(\s*['\"](?:DES|RC4)",
            "severity": "medium",
            "cwe": "CWE-327"
        }
    ]

    # Language file extension mapping
    language_extensions = {
        "python": [".py"],
        "javascript": [".js", ".jsx", ".ts", ".tsx"],
        "java": [".java"],
        "php": [".php"],
        "ruby": [".rb"],
        "go": [".go"],
        "any": [".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".php", ".rb", ".go", ".c", ".cpp", ".cs"]
    }

    # Find files to scan by language
    language_file_map = {}
    for root, _, files in os.walk(repo_dir):
        for file in files:
            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, repo_dir)

            # Skip binary files, images, and other non-text files
            if os.path.getsize(file_path) > 1024 * 1024:  # Skip files larger than 1MB
                continue

            # Skip files in certain directories
            if any(segment.startswith('.') for segment in rel_path.split(os.sep)):
                continue

            # Skip node_modules and similar directories
            if any(dir_name in rel_path.split(os.sep) for dir_name in
                   ['node_modules', 'venv', 'env', '__pycache__', 'dist', 'build']):
                continue

            # Determine language by extension
            file_ext = os.path.splitext(file)[1].lower()
            for language, extensions in language_extensions.items():
                if file_ext in extensions:
                    if language not in language_file_map:
                        language_file_map[language] = []
                    language_file_map[language].append((file_path, rel_path))

    # Scan files for vulnerabilities by language
    for language, file_paths in language_file_map.items():
        # Get patterns for this language
        patterns = [p for p in vulnerability_patterns if p["language"] == language or p["language"] == "any"]

        for file_path, rel_path in file_paths:
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()

                    for pattern in patterns:
                        matches = re.finditer(pattern["regex"], content)

                        for match in matches:
                            # Get line number
                            line_number = content[:match.start()].count('\n') + 1

                            # Get code snippet
                            lines = content.split('\n')
                            start_line = max(0, line_number - 2)
                            end_line = min(len(lines), line_number + 2)
                            snippet = '\n'.join(lines[start_line:end_line])

                            # Create issue
                            issue = {
                                "issue_id": f"VULN_{pattern['name'].upper().replace(' ', '_')}",
                                "severity": pattern["severity"],
                                "title": f"Potential {pattern['name']}",
                                "description": f"Possible {pattern['name']} vulnerability detected. This could allow attackers to execute malicious code or access sensitive data.",
                                "file_path": rel_path,
                                "line_number": line_number,
                                "issue_type": "vulnerability",
                                "recommendation": f"Validate and sanitize all user inputs before using them in {pattern['name'].lower().split('(')[0]} operations.",
                                "cwe_id": pattern["cwe"],
                                "references": [
                                    f"https://cwe.mitre.org/data/definitions/{pattern['cwe'].split('-')[1]}.html",
                                    "https://owasp.org/www-project-top-ten/"
                                ]
                            }

                            issues.append(issue)

            except Exception as e:
                logger.warning(f"Failed to scan file for vulnerabilities: {file_path} - {e}")

    return issues

async def scan_for_misconfigurations(repo_dir: str, options: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Scan for security misconfigurations in the repository."""
    logger.info("Scanning for security misconfigurations")
    issues = []

    # Configuration file patterns to check
    config_patterns = [
        {
            "file_pattern": "**/.env*",
            "check_type": "env_file",
            "severity": "medium",
            "title": "Environment File Committed",
            "description": "Environment files (.env) containing sensitive configuration should not be committed to version control.",
            "recommendation": "Add .env files to .gitignore and use .env.example files for documentation instead."
        },
        {
            "file_pattern": "**/config.json",
            "check_type": "config_file",
            "severity": "low",
            "title": "Configuration File Committed",
            "description": "Configuration files may contain sensitive information and should be handled carefully.",
            "recommendation": "Use environment variables for sensitive configuration or ensure sensitive values are not committed."
        },
        {
            "file_pattern": "**/*.config.js",
            "check_type": "config_file",
            "severity": "low",
            "title": "JavaScript Configuration File Committed",
            "description": "JavaScript configuration files may contain sensitive information.",
            "recommendation": "Use environment variables for sensitive configuration or ensure sensitive values are not committed."
        },
        {
            "file_pattern": "**/application.properties",
            "check_type": "config_file",
            "severity": "medium",
            "title": "Java Properties File Committed",
            "description": "Java properties files may contain database credentials and other sensitive information.",
            "recommendation": "Use environment variables or a secure properties management system."
        },
        {
            "file_pattern": "**/application.yml",
            "check_type": "config_file",
            "severity": "medium",
            "title": "YAML Configuration File Committed",
            "description": "YAML configuration files may contain sensitive information.",
            "recommendation": "Use environment variables or a secure configuration management system."
        },
        {
            "file_pattern": "**/.npmrc",
            "check_type": "config_file",
            "severity": "medium",
            "title": "NPM Configuration File Committed",
            "description": "NPM configuration files may contain authentication tokens.",
            "recommendation": "Use environment variables for NPM tokens or ensure .npmrc files don't contain auth tokens."
        },
        {
            "file_pattern": "**/.pypirc",
            "check_type": "config_file",
            "severity": "medium",
            "title": "PyPI Configuration File Committed",
            "description": "PyPI configuration files may contain authentication tokens.",
            "recommendation": "Use environment variables for PyPI tokens or ensure .pypirc files are not committed."
        },
        {
            "file_pattern": "**/docker-compose.yml",
            "check_type": "docker_config",
            "severity": "low",
            "title": "Docker Compose File Committed",
            "description": "Docker Compose files may contain sensitive environment variables or configuration.",
            "recommendation": "Use environment variables or Docker secrets for sensitive values."
        },
        {
            "file_pattern": "**/terraform.tfstate",
            "check_type": "iac_state",
            "severity": "high",
            "title": "Terraform State File Committed",
            "description": "Terraform state files may contain sensitive values like credentials and should not be committed.",
            "recommendation": "Use remote state storage and add terraform.tfstate to .gitignore."
        },
        {
            "file_pattern": "**/*.pem",
            "check_type": "certificate",
            "severity": "critical",
            "title": "PEM Certificate File Committed",
            "description": "PEM certificate files may contain private keys and should not be committed.",
            "recommendation": "Remove certificate files from the repository and use a secure certificate management system."
        },
        {
            "file_pattern": "**/*.key",
            "check_type": "certificate",
            "severity": "critical",
            "title": "Private Key File Committed",
            "description": "Private key files should not be committed to the repository.",
            "recommendation": "Remove key files from the repository and use a secure key management system."
        }
    ]

    # Check for .gitignore
    gitignore_path = os.path.join(repo_dir, ".gitignore")
    gitignore_exists = os.path.isfile(gitignore_path)
    gitignore_content = ""

    if gitignore_exists:
        try:
            with open(gitignore_path, 'r', encoding='utf-8', errors='ignore') as f:
                gitignore_content = f.read()
        except Exception as e:
            logger.warning(f"Failed to read .gitignore: {e}")
    else:
        # Missing .gitignore is a misconfiguration
        issues.append({
            "issue_id": "MISSING_GITIGNORE",
            "severity": "low",
            "title": "Missing .gitignore File",
            "description": "The repository doesn't have a .gitignore file, which could lead to committing sensitive files accidentally.",
            "file_path": None,
            "issue_type": "misconfiguration",
            "recommendation": "Add a .gitignore file with common patterns for your programming languages and frameworks."
        })

    # Check for security-related environment variables in various files
    for pattern in config_patterns:
        # Use glob to find matching files
        matching_files = glob.glob(os.path.join(repo_dir, pattern["file_pattern"]), recursive=True)

        for file_path in matching_files:
            rel_path = os.path.relpath(file_path, repo_dir)

            # Check if the file is in .gitignore
            filename = os.path.basename(file_path)
            file_pattern = os.path.join(os.path.dirname(rel_path), filename)

            is_ignored = False
            if gitignore_exists:
                # Simple check - would need more sophisticated parsing for a real implementation
                is_ignored = filename in gitignore_content or file_pattern in gitignore_content

            if not is_ignored:
                # File exists and is not ignored - create an issue
                issues.append({
                    "issue_id": f"CONFIG_{pattern['check_type'].upper()}",
                    "severity": pattern["severity"],
                    "title": pattern["title"],
                    "description": pattern["description"],
                    "file_path": rel_path,
                    "issue_type": "misconfiguration",
                    "recommendation": pattern["recommendation"]
                })

    # Additional security checks for common frameworks

    # Check for insecure JWT configuration in Node.js
    jwt_config_files = find_files_with_content(repo_dir, [".js", ".ts"], ["jwt.sign", "jwt.verify"])
    for file_path, rel_path in jwt_config_files:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

                # Check for weak JWT algorithms
                if re.search(r"algorithm:\s*['\"](?:none|HS256)['\"]", content, re.IGNORECASE):
                    issues.append({
                        "issue_id": "WEAK_JWT_ALGORITHM",
                        "severity": "high",
                        "title": "Weak JWT Algorithm",
                        "description": "The application is using a weak algorithm for JWT tokens, which may be vulnerable to tampering.",
                        "file_path": rel_path,
                        "issue_type": "misconfiguration",
                        "recommendation": "Use a stronger algorithm like RS256 for JWT tokens.",
                        "references": [
                            "https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries/",
                            "https://cwe.mitre.org/data/definitions/327.html"
                        ]
                    })
        except Exception as e:
            logger.warning(f"Failed to check JWT configuration: {file_path} - {e}")

    # Check for CORS misconfiguration
    cors_config_files = find_files_with_content(repo_dir, [".js", ".ts", ".py", ".java"], ["cors", "CORS", "Access-Control-Allow-Origin"])
    for file_path, rel_path in cors_config_files:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

                # Check for wildcard CORS configuration
                if re.search(r"(?:cors|CORS|Access-Control-Allow-Origin).*['\"]\\*['\"]", content):
                    issues.append({
                        "issue_id": "INSECURE_CORS_POLICY",
                        "severity": "medium",
                        "title": "Insecure CORS Policy",
                        "description": "The application has a wildcard CORS policy, which allows any domain to make cross-origin requests.",
                        "file_path": rel_path,
                        "issue_type": "misconfiguration",
                        "recommendation": "Restrict CORS to specific trusted domains instead of using wildcards.",
                        "references": [
                            "https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS",
                            "https://owasp.org/www-community/attacks/CORS_OriginHeaderScrutiny"
                        ]
                    })
        except Exception as e:
            logger.warning(f"Failed to check CORS configuration: {file_path} - {e}")

    # Check for other security misconfigurations as needed

    return issues

def find_files_with_content(repo_dir: str, extensions: List[str], patterns: List[str]) -> List[Tuple[str, str]]:
    """
    Find files with specific extensions containing any of the specified patterns.

    Args:
        repo_dir: Repository directory to search
        extensions: List of file extensions to look for
        patterns: List of content patterns to match

    Returns:
        List of (file_path, relative_path) tuples for matching files
    """
    matching_files = []

    for root, _, files in os.walk(repo_dir):
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                file_path = os.path.join(root, file)

                # Skip large files
                if os.path.getsize(file_path) > 1024 * 1024:  # 1MB
                    continue

                # Skip files in certain directories
                rel_path = os.path.relpath(file_path, repo_dir)
                if any(segment.startswith('.') for segment in rel_path.split(os.sep)):
                    continue

                if any(dir_name in rel_path.split(os.sep) for dir_name in
                       ['node_modules', 'venv', 'env', '__pycache__', 'dist', 'build']):
                    continue

                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()

                        if any(pattern in content for pattern in patterns):
                            matching_files.append((file_path, rel_path))
                except Exception:
                    # Skip files that can't be read
                    pass

    return matching_files