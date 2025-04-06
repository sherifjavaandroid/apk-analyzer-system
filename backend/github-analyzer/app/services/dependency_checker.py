# backend/github-analyzer/app/services/dependency_checker.py
import os
import json
import re
import httpx
import logging
import subprocess
import xml.etree.ElementTree as ET
from typing import Dict, List, Any, Optional, Set
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Get logger
logger = logging.getLogger(__name__)

async def check_dependencies(repo_dir: str, options: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Check dependencies in a repository for outdated versions and vulnerabilities.

    Args:
        repo_dir: The directory containing the cloned repository
        options: Configuration options for the dependency check

    Returns:
        A dictionary with dependency check results
    """
    logger.info(f"Checking dependencies in {repo_dir}")

    # Default options
    if options is None:
        options = {}

    # Initialize results
    results = {
        "ecosystems_detected": [],
        "dependencies_count": 0,
        "direct_dependencies_count": 0,
        "outdated_dependencies_count": 0,
        "vulnerable_dependencies_count": 0,
        "dependencies": [],
        "dependency_graph": None,
        "summary": {
            "ecosystem_counts": {},
            "license_counts": {},
            "outdated_by_ecosystem": {},
            "vulnerable_by_ecosystem": {}
        }
    }

    # Detect package manager files
    npm_files = find_files(repo_dir, ["package.json"])
    pip_files = find_files(repo_dir, ["requirements.txt", "Pipfile", "pyproject.toml", "setup.py"])
    maven_files = find_files(repo_dir, ["pom.xml"])
    gradle_files = find_files(repo_dir, ["build.gradle", "build.gradle.kts"])
    gemfiles = find_files(repo_dir, ["Gemfile"])
    cargo_files = find_files(repo_dir, ["Cargo.toml"])

    # Track detected ecosystems
    detected_ecosystems = []

    # Check NPM dependencies
    if npm_files:
        detected_ecosystems.append("npm")
        npm_dependencies = await check_npm_dependencies(repo_dir, npm_files)
        results["dependencies"].extend(npm_dependencies)

    # Check Python dependencies
    if pip_files:
        detected_ecosystems.append("pip")
        pip_dependencies = await check_pip_dependencies(repo_dir, pip_files)
        results["dependencies"].extend(pip_dependencies)

    # Check Maven dependencies
    if maven_files:
        detected_ecosystems.append("maven")
        maven_dependencies = await check_maven_dependencies(repo_dir, maven_files)
        results["dependencies"].extend(maven_dependencies)

    # Check Gradle dependencies
    if gradle_files:
        detected_ecosystems.append("gradle")
        gradle_dependencies = await check_gradle_dependencies(repo_dir, gradle_files)
        results["dependencies"].extend(gradle_dependencies)

    # Check Ruby dependencies
    if gemfiles:
        detected_ecosystems.append("ruby")
        ruby_dependencies = await check_ruby_dependencies(repo_dir, gemfiles)
        results["dependencies"].extend(ruby_dependencies)

    # Check Rust dependencies
    if cargo_files:
        detected_ecosystems.append("rust")
        rust_dependencies = await check_rust_dependencies(repo_dir, cargo_files)
        results["dependencies"].extend(rust_dependencies)

    # Update results
    results["ecosystems_detected"] = detected_ecosystems
    results["dependencies_count"] = len(results["dependencies"])
    results["direct_dependencies_count"] = sum(1 for dep in results["dependencies"] if dep["dependency_type"] == "direct")
    results["outdated_dependencies_count"] = sum(1 for dep in results["dependencies"] if dep["is_outdated"])
    results["vulnerable_dependencies_count"] = sum(1 for dep in results["dependencies"] if dep["vulnerabilities"])

    # Generate summary statistics
    ecosystem_counts = {}
    license_counts = {}
    outdated_by_ecosystem = {}
    vulnerable_by_ecosystem = {}

    for dep in results["dependencies"]:
        # Count by ecosystem
        ecosystem = dep["ecosystem"]
        ecosystem_counts[ecosystem] = ecosystem_counts.get(ecosystem, 0) + 1

        # Count by license
        if dep["license"]:
            license_counts[dep["license"]] = license_counts.get(dep["license"], 0) + 1

        # Count outdated by ecosystem
        if dep["is_outdated"]:
            outdated_by_ecosystem[ecosystem] = outdated_by_ecosystem.get(ecosystem, 0) + 1

        # Count vulnerable by ecosystem
        if dep["vulnerabilities"]:
            vulnerable_by_ecosystem[ecosystem] = vulnerable_by_ecosystem.get(ecosystem, 0) + 1

    results["summary"]["ecosystem_counts"] = ecosystem_counts
    results["summary"]["license_counts"] = license_counts
    results["summary"]["outdated_by_ecosystem"] = outdated_by_ecosystem
    results["summary"]["vulnerable_by_ecosystem"] = vulnerable_by_ecosystem

    return results

def find_files(repo_dir: str, file_patterns: List[str]) -> List[str]:
    """Find files matching any of the given patterns in the repository."""
    found_files = []
    for root, _, files in os.walk(repo_dir):
        for file in files:
            if file in file_patterns or any(file.endswith(pattern) for pattern in file_patterns):
                found_files.append(os.path.join(root, file))
    return found_files

async def check_npm_dependencies(repo_dir: str, package_json_files: List[str]) -> List[Dict[str, Any]]:
    """Check NPM dependencies for outdated versions and vulnerabilities."""
    dependencies = []

    for package_json_path in package_json_files:
        try:
            with open(package_json_path, 'r', encoding='utf-8') as f:
                package_data = json.load(f)

            # Get direct dependencies
            direct_deps = {}
            if "dependencies" in package_data:
                direct_deps.update(package_data["dependencies"])
            if "devDependencies" in package_data:
                for name, version in package_data["devDependencies"].items():
                    direct_deps[name] = {
                        "version": version,
                        "dev": True
                    }

            for name, version_info in direct_deps.items():
                is_dev = False
                if isinstance(version_info, dict):
                    is_dev = version_info.get("dev", False)
                    version = version_info.get("version", "")
                else:
                    version = version_info

                # Clean up version string (remove ^, ~, etc.)
                clean_version = re.sub(r'^[~^]', '', version)

                # Get latest version from NPM registry
                try:
                    async with httpx.AsyncClient() as client:
                        response = await client.get(f"https://registry.npmjs.org/{name}")
                        if response.status_code == 200:
                            npm_data = response.json()
                            latest_version = npm_data.get("dist-tags", {}).get("latest", "")

                            # Get license information
                            license_info = None
                            if "license" in npm_data:
                                license_info = npm_data["license"]
                            elif "licenses" in npm_data:
                                license_info = ", ".join([lic.get("type", "") for lic in npm_data["licenses"]])

                            # Check if outdated
                            is_outdated = clean_version != latest_version

                            # Add dependency info
                            dependencies.append({
                                "name": name,
                                "current_version": clean_version,
                                "latest_version": latest_version,
                                "is_outdated": is_outdated,
                                "dependency_type": "dev" if is_dev else "direct",
                                "ecosystem": "npm",
                                "license": license_info,
                                "vulnerabilities": []  # Would fetch from vulnerability DB in a real implementation
                            })
                except Exception as e:
                    logger.warning(f"Failed to check NPM package {name}: {e}")
                    # Add with limited information
                    dependencies.append({
                        "name": name,
                        "current_version": clean_version,
                        "latest_version": None,
                        "is_outdated": False,
                        "dependency_type": "dev" if is_dev else "direct",
                        "ecosystem": "npm",
                        "license": None,
                        "vulnerabilities": []
                    })

        except Exception as e:
            logger.error(f"Failed to parse package.json at {package_json_path}: {e}")

    return dependencies

async def check_pip_dependencies(repo_dir: str, pip_files: List[str]) -> List[Dict[str, Any]]:
    """Check Python dependencies for outdated versions and vulnerabilities."""
    dependencies = []

    for pip_file in pip_files:
        try:
            file_name = os.path.basename(pip_file)

            if file_name == "requirements.txt":
                # Parse requirements.txt
                with open(pip_file, 'r', encoding='utf-8') as f:
                    for line in f.readlines():
                        line = line.strip()
                        if not line or line.startswith("#"):
                            continue

                        # Parse dependency specification
                        match = re.match(r'^([a-zA-Z0-9_.-]+)([<>=!~].+)?, line)
                        if match:
                            name = match.group(1)
                        version_constraint = match.group(2)
                        current_version = version_constraint.strip() if version_constraint else "Not specified"

                        # Get latest version from PyPI
                        try:
                            async with httpx.AsyncClient() as client:
                                response = await client.get(f"https://pypi.org/pypi/{name}/json")
                                if response.status_code == 200:
                                    pypi_data = response.json()
                                    latest_version = pypi_data.get("info", {}).get("version", "")

                                    # Get license information
                                    license_info = pypi_data.get("info", {}).get("license", "")

                                    # Check if outdated (simplified)
                                    is_outdated = current_version != latest_version and current_version != "Not specified"

                                    # Add dependency info
                                    dependencies.append({
                                        "name": name,
                                        "current_version": current_version,
                                        "latest_version": latest_version,
                                        "is_outdated": is_outdated,
                                        "dependency_type": "direct",
                                        "ecosystem": "pip",
                                        "license": license_info,
                                        "vulnerabilities": []  # Would fetch from vulnerability DB
                                    })
                        except Exception as e:
                            logger.warning(f"Failed to check PyPI package {name}: {e}")
                            # Add with limited information
                            dependencies.append({
                                "name": name,
                                "current_version": current_version,
                                "latest_version": None,
                                "is_outdated": False,
                                "dependency_type": "direct",
                                "ecosystem": "pip",
                                "license": None,
                                "vulnerabilities": []
                            })

            elif file_name == "Pipfile":
                # Parse Pipfile
                with open(pip_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    packages_section = False
                    dev_packages_section = False

                    for line in content.splitlines():
                        line = line.strip()

                        if line == "[packages]":
                            packages_section = True
                            dev_packages_section = False
                            continue
                        elif line == "[dev-packages]":
                            packages_section = False
                            dev_packages_section = True
                            continue
                        elif line.startswith("["):
                            packages_section = False
                            dev_packages_section = False
                            continue

                        if packages_section or dev_packages_section:
                            match = re.match(r'^([a-zA-Z0-9_.-]+)\s*=\s*["\']([^"\']+)["\']', line)
                            if match:
                                name = match.group(1)
                                version = match.group(2)

                                # Add dependency info (simplified)
                                dependencies.append({
                                    "name": name,
                                    "current_version": version,
                                    "latest_version": None,  # Would fetch from PyPI
                                    "is_outdated": False,    # Would compare versions
                                    "dependency_type": "dev" if dev_packages_section else "direct",
                                    "ecosystem": "pip",
                                    "license": None,         # Would fetch from PyPI
                                    "vulnerabilities": []    # Would fetch from vulnerability DB
                                })

            # Add support for pyproject.toml and setup.py as needed

        except Exception as e:
            logger.error(f"Failed to parse Python dependencies from {pip_file}: {e}")

    return dependencies

async def check_maven_dependencies(repo_dir: str, pom_files: List[str]) -> List[Dict[str, Any]]:
    """Check Maven dependencies for outdated versions and vulnerabilities."""
    dependencies = []

    for pom_file in pom_files:
        try:
            # Parse pom.xml
            tree = ET.parse(pom_file)
            root = tree.getroot()

            # Handle namespaces in XML
            ns = {"mvn": "http://maven.apache.org/POM/4.0.0"}

            # Extract dependencies
            for dep_elem in root.findall(".//mvn:dependencies/mvn:dependency", ns):
                group_id = dep_elem.find("mvn:groupId", ns)
                artifact_id = dep_elem.find("mvn:artifactId", ns)
                version = dep_elem.find("mvn:version", ns)
                scope = dep_elem.find("mvn:scope", ns)

                if group_id is not None and artifact_id is not None:
                    group_id_text = group_id.text
                    artifact_id_text = artifact_id.text
                    version_text = version.text if version is not None else "Not specified"
                    scope_text = scope.text if scope is not None else "compile"

                    # Determine dependency type
                    dep_type = "direct"
                    if scope_text in ["test", "provided"]:
                        dep_type = "dev"

                    # Add dependency info (simplified)
                    dependencies.append({
                        "name": f"{group_id_text}:{artifact_id_text}",
                        "current_version": version_text,
                        "latest_version": None,  # Would fetch from Maven Central
                        "is_outdated": False,    # Would compare versions
                        "dependency_type": dep_type,
                        "ecosystem": "maven",
                        "license": None,         # Would fetch from Maven Central
                        "vulnerabilities": []    # Would fetch from vulnerability DB
                    })

        except Exception as e:
            logger.error(f"Failed to parse Maven dependencies from {pom_file}: {e}")

    return dependencies

async def check_gradle_dependencies(repo_dir: str, gradle_files: List[str]) -> List[Dict[str, Any]]:
    """Check Gradle dependencies for outdated versions and vulnerabilities."""
    dependencies = []

    for gradle_file in gradle_files:
        try:
            # Parse build.gradle or build.gradle.kts
            with open(gradle_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Find dependencies in Groovy syntax
            groovy_deps = re.findall(r'(?:implementation|api|compileOnly|runtimeOnly|testImplementation|kapt)\s*[\'"]([\w.-]+:[\w.-]+:[\w.-]+)[\'"]', content)

            # Find dependencies in Kotlin DSL syntax
            kotlin_deps = re.findall(r'(?:implementation|api|compileOnly|runtimeOnly|testImplementation|kapt)\([\'"]([\w.-]+:[\w.-]+:[\w.-]+)[\'"]', content)

            all_deps = groovy_deps + kotlin_deps

            for dep in all_deps:
                parts = dep.split(':')
                if len(parts) >= 3:
                    group_id = parts[0]
                    artifact_id = parts[1]
                    version = parts[2]

                    # Determine dependency type (simplified)
                    dependency_type = "direct"
                    if "test" in dep:
                        dependency_type = "dev"

                    # Add dependency info
                    dependencies.append({
                        "name": f"{group_id}:{artifact_id}",
                        "current_version": version,
                        "latest_version": None,  # Would fetch from Maven Central
                        "is_outdated": False,    # Would compare versions
                        "dependency_type": dependency_type,
                        "ecosystem": "gradle",
                        "license": None,         # Would fetch from Maven Central
                        "vulnerabilities": []    # Would fetch from vulnerability DB
                    })

        except Exception as e:
            logger.error(f"Failed to parse Gradle dependencies from {gradle_file}: {e}")

    return dependencies

async def check_ruby_dependencies(repo_dir: str, gemfiles: List[str]) -> List[Dict[str, Any]]:
    """Check Ruby dependencies for outdated versions and vulnerabilities."""
    dependencies = []

    for gemfile in gemfiles:
        try:
            # Parse Gemfile
            with open(gemfile, 'r', encoding='utf-8') as f:
                content = f.read()

            # Find gem declarations
            gem_patterns = [
                r'gem\s+[\'"]([^\'"]+)[\'"],\s*[\'"]([^\'"]+)[\'"]',  # gem 'name', 'version'
                r'gem\s+[\'"]([^\'"]+)[\'"],\s*version:\s*[\'"]([^\'"]+)[\'"]'  # gem 'name', version: 'version'
            ]

            for pattern in gem_patterns:
                for match in re.finditer(pattern, content):
                    name = match.group(1)
                    version = match.group(2)

                    # Add dependency info
                    dependencies.append({
                        "name": name,
                        "current_version": version,
                        "latest_version": None,  # Would fetch from RubyGems
                        "is_outdated": False,    # Would compare versions
                        "dependency_type": "direct",
                        "ecosystem": "ruby",
                        "license": None,         # Would fetch from RubyGems
                        "vulnerabilities": []    # Would fetch from vulnerability DB
                    })

            # Find gems without version specification
            simple_gems = re.findall(r'gem\s+[\'"]([^\'"]+)[\'"](?:,\s*(?!version:)[^\'"\n]+)?, content, re.MULTILINE)
                                     for name in simple_gems:
            if not any(dep["name"] == name for dep in dependencies):
                dependencies.append({
                    "name": name,
                    "current_version": "Not specified",
                    "latest_version": None,
                    "is_outdated": False,
                    "dependency_type": "direct",
                    "ecosystem": "ruby",
                    "license": None,
                    "vulnerabilities": []
                })

            except Exception as e:
            logger.error(f"Failed to parse Ruby dependencies from {gemfile}: {e}")

    return dependencies

async def check_rust_dependencies(repo_dir: str, cargo_files: List[str]) -> List[Dict[str, Any]]:
    """Check Rust dependencies for outdated versions and vulnerabilities."""
    dependencies = []

    for cargo_file in cargo_files:
        try:
            # Parse Cargo.toml
            with open(cargo_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Find dependencies section
            dependencies_section = re.search(r'\[dependencies\](.*?)(?:\[|\Z)', content, re.DOTALL)
            if dependencies_section:
                deps_content = dependencies_section.group(1)

                # Match simple dependencies
                simple_deps = re.findall(r'([a-zA-Z0-9_-]+)\s*=\s*[\'"]([^\'"]+)[\'"]', deps_content)
                for name, version in simple_deps:
                    dependencies.append({
                        "name": name,
                        "current_version": version,
                        "latest_version": None,  # Would fetch from crates.io
                        "is_outdated": False,    # Would compare versions
                        "dependency_type": "direct",
                        "ecosystem": "rust",
                        "license": None,         # Would fetch from crates.io
                        "vulnerabilities": []    # Would fetch from vulnerability DB
                    })

                # Match complex dependency specifications
                complex_deps = re.findall(r'([a-zA-Z0-9_-]+)\s*=\s*\{([^}]+)\}', deps_content)
                for name, spec in complex_deps:
                    version_match = re.search(r'version\s*=\s*[\'"]([^\'"]+)[\'"]', spec)
                    version = version_match.group(1) if version_match else "Not specified"

                    dependencies.append({
                        "name": name,
                        "current_version": version,
                        "latest_version": None,
                        "is_outdated": False,
                        "dependency_type": "direct",
                        "ecosystem": "rust",
                        "license": None,
                        "vulnerabilities": []
                    })

            # Find dev-dependencies section
            dev_dependencies_section = re.search(r'\[dev-dependencies\](.*?)(?:\[|\Z)', content, re.DOTALL)
            if dev_dependencies_section:
                deps_content = dev_dependencies_section.group(1)

                # Match simple dependencies
                simple_deps = re.findall(r'([a-zA-Z0-9_-]+)\s*=\s*[\'"]([^\'"]+)[\'"]', deps_content)
                for name, version in simple_deps:
                    dependencies.append({
                        "name": name,
                        "current_version": version,
                        "latest_version": None,
                        "is_outdated": False,
                        "dependency_type": "dev",
                        "ecosystem": "rust",
                        "license": None,
                        "vulnerabilities": []
                    })

        except Exception as e:
            logger.error(f"Failed to parse Rust dependencies from {cargo_file}: {e}")

    return dependencies