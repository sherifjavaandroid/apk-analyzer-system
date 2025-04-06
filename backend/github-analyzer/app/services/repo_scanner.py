# backend/github-analyzer/app/services/repo_scanner.py
import os
import re
import subprocess
import json
import httpx
import asyncio
import logging
import git
import time
from typing import Dict, List, Any, Optional, Tuple
from collections import defaultdict

# Get logger
logger = logging.getLogger(__name__)

async def clone_repository(repo_url: str, target_dir: str, branch: str = "main") -> Dict[str, Any]:
    """
    Clone a GitHub repository and extract basic information.

    Args:
        repo_url: The URL of the GitHub repository
        target_dir: The directory to clone the repository to
        branch: The branch to clone

    Returns:
        A dictionary with repository information
    """
    logger.info(f"Cloning repository {repo_url} (branch: {branch}) to {target_dir}")

    # Extract owner and repo name from URL
    match = re.match(r"https://github.com/([^/]+)/([^/]+)/?.*", repo_url)
    if not match:
        raise ValueError(f"Invalid GitHub URL: {repo_url}")

    owner, repo_name = match.groups()

    # Clean repository name (remove .git if present)
    repo_name = repo_name.replace(".git", "")

    # Use GitHub API to get repository info
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.github.com/repos/{owner}/{repo_name}",
            headers={"Accept": "application/vnd.github.v3+json"}
        )

        if response.status_code != 200:
            logger.error(f"Failed to get repository info from GitHub API: {response.text}")
            raise Exception(f"Failed to get repository information: {response.status_code}")

        repo_info = response.json()

    # Clone the repository
    try:
        # Use GitPython to clone the repository
        git.Repo.clone_from(
            repo_url,
            target_dir,
            branch=branch,
            depth=1  # Shallow clone to save time and space
        )

        logger.info(f"Repository cloned successfully")

        # Get last commit information
        try:
            repo = git.Repo(target_dir)
            last_commit = repo.head.commit
            last_commit_date = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(last_commit.committed_date))
        except Exception as e:
            logger.warning(f"Failed to get last commit information: {e}")
            last_commit_date = None

        # Prepare repository information
        return {
            "name": repo_name,
            "owner": owner,
            "description": repo_info.get("description"),
            "default_branch": repo_info.get("default_branch"),
            "stars": repo_info.get("stargazers_count", 0),
            "forks": repo_info.get("forks_count", 0),
            "open_issues": repo_info.get("open_issues_count", 0),
            "language": repo_info.get("language"),
            "license": repo_info.get("license", {}).get("name") if repo_info.get("license") else None,
            "size": repo_info.get("size", 0) * 1024,  # GitHub API returns size in KB
            "last_commit": last_commit_date,
            "created_at": repo_info.get("created_at"),
            "updated_at": repo_info.get("updated_at")
        }

    except Exception as e:
        logger.error(f"Failed to clone repository: {e}")
        raise Exception(f"Failed to clone repository: {str(e)}")

async def analyze_repo_structure(repo_dir: str) -> Dict[str, Any]:
    """
    Analyze the structure of a cloned repository.

    Args:
        repo_dir: The directory containing the cloned repository

    Returns:
        A dictionary with repository structure information
    """
    logger.info(f"Analyzing repository structure in {repo_dir}")

    # Initialize counters and data structures
    files_count = 0
    directories_count = 0
    total_size_bytes = 0
    languages = defaultdict(int)
    file_extensions = defaultdict(int)
    files = []
    directory_sizes = defaultdict(int)

    # File extension to language mapping
    extension_to_language = {
        ".py": "Python",
        ".js": "JavaScript",
        ".jsx": "JavaScript (React)",
        ".ts": "TypeScript",
        ".tsx": "TypeScript (React)",
        ".java": "Java",
        ".kt": "Kotlin",
        ".swift": "Swift",
        ".c": "C",
        ".cpp": "C++",
        ".h": "C/C++ Header",
        ".cs": "C#",
        ".go": "Go",
        ".rb": "Ruby",
        ".php": "PHP",
        ".html": "HTML",
        ".css": "CSS",
        ".scss": "SCSS",
        ".sass": "Sass",
        ".less": "Less",
        ".md": "Markdown",
        ".json": "JSON",
        ".xml": "XML",
        ".yml": "YAML",
        ".yaml": "YAML",
        ".sql": "SQL",
        ".sh": "Shell",
        ".bat": "Batch",
        ".ps1": "PowerShell",
        ".dart": "Dart",
        ".rs": "Rust",
        ".lua": "Lua",
        ".r": "R",
        ".pl": "Perl",
        ".groovy": "Groovy",
        ".scala": "Scala",
        ".elm": "Elm",
        ".clj": "Clojure",
        ".ex": "Elixir",
        ".exs": "Elixir",
        ".erl": "Erlang",
        ".hs": "Haskell",
        ".fs": "F#",
        ".fsx": "F#",
        ".vue": "Vue",
        ".svelte": "Svelte",
    }

    # Directories to ignore
    ignore_dirs = [
        ".git", "node_modules", "venv", "env", "__pycache__",
        "build", "dist", "target", "out", "bin", "obj"
    ]

    # Walk through the repository
    for root, dirs, filenames in os.walk(repo_dir):
        # Filter out ignored directories
        dirs[:] = [d for d in dirs if d not in ignore_dirs]

        # Get relative path to repo root
        rel_root = os.path.relpath(root, repo_dir)
        if rel_root == ".":
            rel_root = ""

        # Count directories
        directories_count += len(dirs)

        # Process files
        for filename in filenames:
            # Get file path and extension
            file_path = os.path.join(root, filename)
            rel_path = os.path.join(rel_root, filename) if rel_root else filename
            _, ext = os.path.splitext(filename.lower())

            # Get file size
            try:
                file_size = os.path.getsize(file_path)
                total_size_bytes += file_size

                # Update directory size (for calculating top directories)
                dir_path = os.path.dirname(rel_path)
                while dir_path:
                    directory_sizes[dir_path] += file_size
                    dir_path = os.path.dirname(dir_path)

                # Count files
                files_count += 1

                # Count file extensions
                file_extensions[ext if ext else "no_extension"] += 1

                # Map extension to language and count lines of code
                language = extension_to_language.get(ext, "Other")
                if language != "Other" and os.path.isfile(file_path) and file_size < 10 * 1024 * 1024:  # Skip files larger than 10MB
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            line_count = sum(1 for _ in f)
                            languages[language] += line_count
                    except Exception as e:
                        # If we can't read the file, just count it as 1 line
                        languages[language] += 1

                # Add file info to the list
                files.append({
                    "path": rel_path,
                    "type": "file",
                    "size": file_size,
                    "extension": ext if ext else None,
                    "language": language if language != "Other" else None
                })

            except Exception as e:
                logger.warning(f"Failed to process file {file_path}: {e}")

    # Get top directories by size
    top_directories = sorted(
        [(dir_path, size) for dir_path, size in directory_sizes.items() if dir_path],
        key=lambda x: x[1],
        reverse=True
    )[:10]  # Top 10 directories

    return {
        "files_count": files_count,
        "directories_count": directories_count,
        "size_bytes": total_size_bytes,
        "languages": dict(languages),
        "file_extensions": dict(file_extensions),
        "files": files[:1000],  # Limit to 1000 files to avoid response size issues
        "top_directories": [dir_path for dir_path, _ in top_directories]
    }