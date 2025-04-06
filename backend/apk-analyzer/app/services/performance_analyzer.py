# backend/apk-analyzer/app/services/performance_analyzer.py
import os
import re
import zipfile
import tempfile
import subprocess
import logging
import math
import json
from typing import Dict, List, Any, Optional
import shutil

logger = logging.getLogger(__name__)

def analyze_performance(apk_path: str) -> Dict[str, Any]:
    """
    Analyze the performance characteristics of an APK file.

    Args:
        apk_path: Path to the APK file

    Returns:
        Dictionary containing performance analysis results
    """
    # Create a dictionary to store results
    results = {
        "apk_size": {
            "total_size_bytes": os.path.getsize(apk_path),
            "total_size_formatted": format_size(os.path.getsize(apk_path)),
            "estimated_download_time": estimate_download_time(os.path.getsize(apk_path)),
            "components": []
        },
        "startup_estimate": {
            "score": None,
            "factors": [],
            "recommendations": []
        },
        "resource_usage": {
            "resources_count": {
                "layouts": 0,
                "drawables": 0,
                "animations": 0
            },
            "oversize_resources": [],
            "duplicate_resources": [],
            "unused_resources_estimate": None
        },
        "memory_usage": {
            "score": None,
            "factors": []
        },
        "battery_impact": {
            "score": None,
            "factors": []
        },
        "ui_performance": {
            "score": None,
            "factors": []
        }
    }

    # Create a temporary directory for extraction
    temp_dir = tempfile.mkdtemp()

    try:
        # Extract the APK
        with zipfile.ZipFile(apk_path, 'r') as apk_zip:
            # Get file list
            file_list = apk_zip.namelist()

            # Extract all files
            apk_zip.extractall(temp_dir)

            # Analyze components size
            component_sizes = analyze_apk_components(apk_zip, file_list)
            results["apk_size"]["components"] = component_sizes

            # Analyze resources
            analyze_resources(temp_dir, file_list, results)

            # Analyze code to estimate startup time
            analyze_startup_factors(temp_dir, file_list, results)

            # Analyze memory usage factors
            analyze_memory_factors(temp_dir, file_list, results)

            # Analyze battery impact factors
            analyze_battery_factors(temp_dir, file_list, results)

            # Analyze UI performance factors
            analyze_ui_performance(temp_dir, file_list, results)

    except Exception as e:
        logger.error(f"Error in performance analysis: {e}")
    finally:
        # Clean up
        try:
            shutil.rmtree(temp_dir)
        except Exception as e:
            logger.warning(f"Failed to clean up temporary directory: {e}")

    return results

def analyze_apk_components(apk_zip: zipfile.ZipFile, file_list: List[str]) -> List[Dict[str, Any]]:
    """Analyze the size of different components in the APK."""
    # Define categories and their patterns
    categories = {
        "Code (DEX)": lambda f: f.endswith(".dex"),
        "Resources": lambda f: f.startswith("res/"),
        "Assets": lambda f: f.startswith("assets/"),
        "Native Libraries": lambda f: f.startswith("lib/") and f.endswith(".so"),
        "Images": lambda f: any(f.endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.gif', '.webp']),
        "XML": lambda f: f.endswith(".xml"),
        "META-INF": lambda f: f.startswith("META-INF/"),
        "Other": lambda f: True  # Catch-all for other files
    }

    # Calculate size of each category
    category_sizes = {category: 0 for category in categories.keys()}

    for file_info in apk_zip.infolist():
        file_path = file_info.filename
        file_size = file_info.file_size

        # Find the first matching category
        categorized = False
        for category, matcher in categories.items():
            if category != "Other" and matcher(file_path):
                category_sizes[category] += file_size
                categorized = True
                break

        # If no specific category matched, count as "Other"
        if not categorized:
            category_sizes["Other"] += file_size

    # Format results
    component_sizes = []
    total_size = sum(category_sizes.values())

    for category, size in category_sizes.items():
        if size > 0:
            percentage = (size / total_size) * 100 if total_size > 0 else 0
            component_sizes.append({
                "name": category,
                "size_bytes": size,
                "size_formatted": format_size(size),
                "percentage": round(percentage, 2)
            })

    # Sort by size (descending)
    component_sizes.sort(key=lambda x: x["size_bytes"], reverse=True)

    return component_sizes

def analyze_resources(temp_dir: str, file_list: List[str], results: Dict[str, Any]):
    """Analyze resource usage and identify potential issues."""
    # Count resources by type
    layouts = [f for f in file_list if f.startswith("res/layout")]
    drawables = [f for f in file_list if f.startswith("res/drawable") or f.startswith("res/mipmap")]
    animations = [f for f in file_list if f.startswith("res/anim") or f.startswith("res/animator")]

    results["resource_usage"]["resources_count"]["layouts"] = len(layouts)
    results["resource_usage"]["resources_count"]["drawables"] = len(drawables)
    results["resource_usage"]["resources_count"]["animations"] = len(animations)

    # Check for large resource files (images > 200KB)
    large_resources = []
    for file_path in file_list:
        if any(file_path.endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.webp']):
            full_path = os.path.join(temp_dir, file_path)
            if os.path.isfile(full_path) and os.path.getsize(full_path) > 200 * 1024:  # 200KB
                large_resources.append({
                    "path": file_path,
                    "size_bytes": os.path.getsize(full_path),
                    "size_formatted": format_size(os.path.getsize(full_path))
                })

    # Sort and limit to top 10 largest resources
    large_resources.sort(key=lambda x: x["size_bytes"], reverse=True)
    results["resource_usage"]["oversize_resources"] = large_resources[:10]

    # Estimate unused resources
    # In a real implementation, this would require more sophisticated analysis
    # using tools like Android Lint or custom resource reference scanners
    if len(drawables) > 100:
        results["resource_usage"]["unused_resources_estimate"] = {
            "message": f"Large number of drawable resources detected ({len(drawables)}). Consider running a resource shrinking tool.",
            "recommendation": "Enable R8/ProGuard with resource shrinking to remove unused resources."
        }

def analyze_startup_factors(temp_dir: str, file_list: List[str], results: Dict[str, Any]):
    """Analyze code to estimate startup performance."""
    factors = []
    recommendations = []

    # Check for multiple DEX files (multidex)
    dex_files = [f for f in file_list if f.endswith(".dex")]
    if len(dex_files) > 1:
        factors.append({
            "name": "Multiple DEX files",
            "impact": "high",
            "description": f"The app contains {len(dex_files)} DEX files, which can significantly slow down app startup on older Android versions."
        })
        recommendations.append("Consider optimizing the app to reduce method count and avoid multidex.")

    # Check for large assets that might be loaded at startup
    assets = [f for f in file_list if f.startswith("assets/")]
    large_startup_assets = False
    for asset in assets:
        if any(keyword in asset.lower() for keyword in ["startup", "splash", "initial", "preload"]):
            asset_path = os.path.join(temp_dir, asset)
            if os.path.isfile(asset_path) and os.path.getsize(asset_path) > 1024 * 1024:  # 1MB
                large_startup_assets = True
                factors.append({
                    "name": "Large startup assets",
                    "impact": "medium",
                    "description": f"Large assets like '{asset}' ({format_size(os.path.getsize(asset_path))}) may be loaded at startup."
                })

    if large_startup_assets:
        recommendations.append("Optimize large startup assets or load them asynchronously after app launch.")

    # Check for excessive layouts
    if len([f for f in file_list if f.startswith("res/layout")]) > 50:
        factors.append({
            "name": "Large number of layouts",
            "impact": "medium",
            "description": "The app contains many layout files, which may increase resource loading time."
        })
        recommendations.append("Consider using fewer layouts through reuse or programmatic UI creation.")

    # Calculate a startup score (0-100, lower is better)
    score = 50  # Default middle score

    # Adjust score based on factors
    for factor in factors:
        if factor["impact"] == "high":
            score += 15
        elif factor["impact"] == "medium":
            score += 10
        else:  # low
            score += 5

    # Cap at 100
    score = min(100, score)

    results["startup_estimate"]["score"] = score
    results["startup_estimate"]["factors"] = factors
    results["startup_estimate"]["recommendations"] = recommendations

def analyze_memory_factors(temp_dir: str, file_list: List[str], results: Dict[str, Any]):
    """Analyze factors that impact memory usage."""
    factors = []

    # Check for large bitmap resources
    large_image_count = len([f for f in file_list if
                             (f.startswith("res/drawable") or f.startswith("res/mipmap")) and
                             any(f.endswith(ext) for ext in ['.png', '.jpg', '.jpeg']) and
                             os.path.getsize(os.path.join(temp_dir, f)) > 100 * 1024])  # 100KB

    if large_image_count > 10:
        factors.append({
            "name": "Many large image resources",
            "impact": "high",
            "description": f"The app contains {large_image_count} large image resources that may consume significant memory when loaded."
        })

    # Check for native libraries that may consume memory
    native_libs = [f for f in file_list if f.startswith("lib/") and f.endswith(".so")]
    if len(native_libs) > 5:
        factors.append({
            "name": "Multiple native libraries",
            "impact": "medium",
            "description": f"The app uses {len(native_libs)} native libraries, which can increase memory footprint."
        })

    # Calculate a memory usage score (0-100, lower is better)
    score = 50  # Default middle score

    # Adjust score based on factors
    for factor in factors:
        if factor["impact"] == "high":
            score += 15
        elif factor["impact"] == "medium":
            score += 10
        else:  # low
            score += 5

    # Cap at 100
    score = min(100, score)

    results["memory_usage"]["score"] = score
    results["memory_usage"]["factors"] = factors

def analyze_battery_factors(temp_dir: str, file_list: List[str], results: Dict[str, Any]):
    """Analyze factors that impact battery life."""
    factors = []

    # Look for indicators of background services
    service_indicators = False
    manifest_path = os.path.join(temp_dir, "AndroidManifest.xml")

    if os.path.exists(manifest_path):
        try:
            # Use aapt to dump the manifest
            aapt_process = subprocess.run(
                ['aapt', 'dump', 'xmltree', manifest_path],
                capture_output=True,
                text=True
            )
            manifest_content = aapt_process.stdout

            # Check for services and receivers that might run in background
            service_count = manifest_content.count("E: service ")
            receiver_count = manifest_content.count("E: receiver ")

            if service_count > 3:
                factors.append({
                    "name": "Multiple services",
                    "impact": "medium",
                    "description": f"The app declares {service_count} services, which may run in the background and consume battery."
                })
                service_indicators = True

            if receiver_count > 5:
                factors.append({
                    "name": "Many broadcast receivers",
                    "impact": "medium",
                    "description": f"The app declares {receiver_count} broadcast receivers, which may wake up the app frequently."
                })
                service_indicators = True

            # Check for location or bluetooth permissions which can drain battery
            battery_heavy_permissions = [
                "android.permission.ACCESS_FINE_LOCATION",
                "android.permission.ACCESS_COARSE_LOCATION",
                "android.permission.ACCESS_BACKGROUND_LOCATION",
                "android.permission.BLUETOOTH_SCAN",
                "android.permission.BLUETOOTH_ADVERTISE"
            ]

            battery_permissions_found = []
            for perm in battery_heavy_permissions:
                if perm in manifest_content:
                    battery_permissions_found.append(perm)

            if battery_permissions_found:
                factors.append({
                    "name": "Battery-intensive permissions",
                    "impact": "high",
                    "description": f"The app uses permissions that can significantly impact battery: {', '.join(battery_permissions_found)}"
                })

        except Exception as e:
            logger.warning(f"Error analyzing manifest for battery factors: {e}")

    # Check if WebView is used (can be battery intensive)
    webview_indicators = []
    for file_path in file_list:
        if file_path.endswith(".dex"):
            dex_path = os.path.join(temp_dir, file_path)
            try:
                # Extract strings from dex
                strings_process = subprocess.run(
                    ['strings', dex_path],
                    capture_output=True,
                    text=True
                )
                dex_content = strings_process.stdout

                if "WebView" in dex_content and "loadUrl" in dex_content:
                    webview_indicators.append(file_path)
            except Exception as e:
                logger.warning(f"Error checking DEX for WebView: {e}")

    if webview_indicators:
        factors.append({
            "name": "WebView usage",
            "impact": "medium",
            "description": "The app appears to use WebView components, which can consume more battery than native UI."
        })

    # Calculate a battery impact score (0-100, lower is better)
    score = 50  # Default middle score

    # Adjust score based on factors
    for factor in factors:
        if factor["impact"] == "high":
            score += 15
        elif factor["impact"] == "medium":
            score += 10
        else:  # low
            score += 5

    # Cap at 100
    score = min(100, score)

    results["battery_impact"]["score"] = score
    results["battery_impact"]["factors"] = factors

def analyze_ui_performance(temp_dir: str, file_list: List[str], results: Dict[str, Any]):
    """Analyze factors that impact UI performance and smoothness."""
    factors = []

    # Check for deep view hierarchies in layouts
    layout_files = [f for f in file_list if f.startswith("res/layout") and f.endswith(".xml")]
    deep_layouts = []

    for layout_file in layout_files:
        layout_path = os.path.join(temp_dir, layout_file)
        try:
            with open(layout_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

                # Count nesting levels
                max_nesting = 0
                current_nesting = 0
                for char in content:
                    if char == '<' and not content.startswith('</'):
                        current_nesting += 1
                        max_nesting = max(max_nesting, current_nesting)
                    elif char == '>' and content.startswith('</'):
                        current_nesting -= 1

                if max_nesting > 10:  # A somewhat arbitrary threshold for "deep"
                    deep_layouts.append({
                        "file": layout_file,
                        "nesting_level": max_nesting
                    })
        except Exception as e:
            logger.warning(f"Error analyzing layout file {layout_file}: {e}")

    if deep_layouts:
        factors.append({
            "name": "Deep view hierarchies",
            "impact": "high",
            "description": f"Found {len(deep_layouts)} layouts with deep nesting (>10 levels), which can slow down UI rendering."
        })

    # Check for potentially inefficient layouts
    inefficient_layouts = []
    for layout_file in layout_files:
        layout_path = os.path.join(temp_dir, layout_file)
        try:
            with open(layout_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                # Check for nested LinearLayouts or RelativeLayouts which could be inefficient
                if content.count("<LinearLayout") > 3 or content.count("<RelativeLayout") > 3:
                    inefficient_layouts.append(layout_file)
        except Exception as e:
            pass

    if inefficient_layouts:
        factors.append({
            "name": "Potentially inefficient layouts",
            "impact": "medium",
            "description": f"Found {len(inefficient_layouts)} layouts with nested LinearLayouts or RelativeLayouts, which can be inefficient."
        })

    # Calculate a UI performance score (0-100, lower is better)
    score = 50  # Default middle score

    # Adjust score based on factors
    for factor in factors:
        if factor["impact"] == "high":
            score += 15
        elif factor["impact"] == "medium":
            score += 10
        else:  # low
            score += 5

    # Cap at 100
    score = min(100, score)

    results["ui_performance"]["score"] = score
    results["ui_performance"]["factors"] = factors

def format_size(size_bytes: int) -> str:
    """Format size in bytes to a human-readable format."""
    if size_bytes == 0:
        return "0B"

    size_names = ("B", "KB", "MB", "GB", "TB")
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)

    return f"{s} {size_names[i]}"

def estimate_download_time(size_bytes: int) -> Dict[str, str]:
    """Estimate download time for the APK on different connection types."""
    # Average speeds in bytes per second
    speeds = {
        "2G": 50 * 1024,  # 50 KB/s
        "3G": 500 * 1024,  # 500 KB/s
        "4G": 3 * 1024 * 1024,  # 3 MB/s
        "5G": 20 * 1024 * 1024,  # 20 MB/s
        "WiFi": 10 * 1024 * 1024  # 10 MB/s (conservative estimate)
    }

    result = {}
    for connection_type, speed in speeds.items():
        seconds = size_bytes / speed
        if seconds < 1:
            result[connection_type] = "less than a second"
        elif seconds < 60:
            result[connection_type] = f"{round(seconds)} seconds"
        elif seconds < 3600:
            minutes = seconds / 60
            result[connection_type] = f"{round(minutes)} minutes"
        else:
            hours = seconds / 3600
            result[connection_type] = f"{round(hours, 1)} hours"

    return result