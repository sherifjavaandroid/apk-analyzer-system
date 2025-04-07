# backend/report-service/app/services/dashboard_data.py
from typing import Dict, List, Any, Optional

def generate_dashboard_data(report_type: str, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate dashboard data based on report type and analysis data.

    Args:
        report_type: Type of report (security, performance, technology, etc.)
        analysis_data: Dictionary of analysis results

    Returns:
        Dictionary containing dashboard data
    """
    if report_type == "security":
        return generate_security_dashboard(analysis_data)
    elif report_type == "performance":
        return generate_performance_dashboard(analysis_data)
    elif report_type == "technology":
        return generate_technology_dashboard(analysis_data)
    elif report_type == "comprehensive":
        return generate_comprehensive_dashboard(analysis_data)
    elif report_type == "executive":
        return generate_executive_dashboard(analysis_data)
    else:
        return {"summary": {"message": "No dashboard data available for this report type"}}

def generate_security_dashboard(analysis_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate security dashboard data"""
    # Initialize counters
    total_issues = 0
    severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    issue_types = {}
    affected_files = set()

    # Process each analysis
    for analysis_id, analysis in analysis_data.items():
        if "results" in analysis and analysis["results"] and "security" in analysis["results"]:
            security = analysis["results"]["security"]

            # Count issues
            if "issues_count" in security:
                total_issues += security["issues_count"]

            # Count by severity
            if "severity_counts" in security:
                for severity, count in security["severity_counts"].items():
                    severity_counts[severity] += count

            # Process issues
            if "issues" in security:
                for issue in security["issues"]:
                    # Count issue types
                    issue_type = issue.get("issue_type", "unknown")
                    if issue_type not in issue_types:
                        issue_types[issue_type] = 0
                    issue_types[issue_type] += 1

                    # Count affected files
                    if "file_path" in issue and issue["file_path"]:
                        affected_files.add(issue["file_path"])

    # Calculate risk score (weighted average)
    total_weighted = (
            severity_counts["critical"] * 10 +
            severity_counts["high"] * 5 +
            severity_counts["medium"] * 3 +
            severity_counts["low"] * 1
    )
    total_issues_for_score = sum(severity_counts.values())
    risk_score = round(total_weighted / max(total_issues_for_score, 1))

    # Prepare dashboard data
    dashboard = {
        "summary": {
            "total_analyses": len(analysis_data),
            "total_issues": total_issues,
            "risk_score": risk_score,
            "affected_files": len(affected_files)
        },
        "severity_distribution": severity_counts,
        "top_issue_types": dict(sorted(issue_types.items(), key=lambda x: x[1], reverse=True)[:5])
    }

    return dashboard

def generate_performance_dashboard(analysis_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate performance dashboard data"""
    # Initialize counters
    total_size_bytes = 0
    total_analyses = 0
    startup_scores = []
    memory_scores = []
    battery_scores = []
    ui_scores = []

    # Process each analysis
    for analysis_id, analysis in analysis_data.items():
        if "results" in analysis and analysis["results"] and "performance" in analysis["results"]:
            performance = analysis["results"]["performance"]
            total_analyses += 1

            # Sum up app sizes
            if "apk_size" in performance and "total_size_bytes" in performance["apk_size"]:
                total_size_bytes += performance["apk_size"]["total_size_bytes"]

            # Collect scores
            if "startup_estimate" in performance and "score" in performance["startup_estimate"]:
                startup_scores.append(performance["startup_estimate"]["score"])

            if "memory_usage" in performance and "score" in performance["memory_usage"]:
                memory_scores.append(performance["memory_usage"]["score"])

            if "battery_impact" in performance and "score" in performance["battery_impact"]:
                battery_scores.append(performance["battery_impact"]["score"])

            if "ui_performance" in performance and "score" in performance["ui_performance"]:
                ui_scores.append(performance["ui_performance"]["score"])

    # Calculate averages
    avg_size_bytes = total_size_bytes / max(total_analyses, 1)
    avg_startup_score = sum(startup_scores) / max(len(startup_scores), 1)
    avg_memory_score = sum(memory_scores) / max(len(memory_scores), 1)
    avg_battery_score = sum(battery_scores) / max(len(battery_scores), 1)
    avg_ui_score = sum(ui_scores) / max(len(ui_scores), 1)

    # Calculate overall performance score (lower is better)
    overall_score = (avg_startup_score + avg_memory_score + avg_battery_score + avg_ui_score) / 4

    # Format file size
    def format_size(size_bytes):
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.2f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.2f} TB"

    # Prepare dashboard data
    dashboard = {
        "summary": {
            "total_analyses": total_analyses,
            "average_size": format_size(avg_size_bytes),
            "overall_performance_score": round(overall_score, 1)
        },
        "scores": {
            "startup": round(avg_startup_score, 1),
            "memory": round(avg_memory_score, 1),
            "battery": round(avg_battery_score, 1),
            "ui": round(avg_ui_score, 1)
        }
    }

    return dashboard

def generate_technology_dashboard(analysis_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate technology dashboard data"""
    # Initialize counters
    frameworks = {}
    languages = {}
    libraries = {}

    # Process each analysis
    for analysis_id, analysis in analysis_data.items():
        if "results" in analysis and analysis["results"] and "technology" in analysis["results"]:
            tech = analysis["results"]["technology"]

            # Count frameworks
            if "frameworks" in tech and "detected" in tech["frameworks"]:
                for framework in tech["frameworks"]["detected"]:
                    if framework not in frameworks:
                        frameworks[framework] = 0
                    frameworks[framework] += 1

            # Count languages
            if "programming_languages" in tech and "detected" in tech["programming_languages"]:
                for language in tech["programming_languages"]["detected"]:
                    if language not in languages:
                        languages[language] = 0
                    languages[language] += 1

            # Count libraries
            if "libraries" in tech and "detected" in tech["libraries"]:
                for library in tech["libraries"]["detected"]:
                    if library not in libraries:
                        libraries[library] = 0
                    libraries[library] += 1

    # Prepare dashboard data
    dashboard = {
        "summary": {
            "total_analyses": len(analysis_data),
            "unique_frameworks": len(frameworks),
            "unique_languages": len(languages),
            "unique_libraries": len(libraries)
        },
        "top_frameworks": dict(sorted(frameworks.items(), key=lambda x: x[1], reverse=True)[:5]),
        "top_languages": dict(sorted(languages.items(), key=lambda x: x[1], reverse=True)[:5]),
        "top_libraries": dict(sorted(libraries.items(), key=lambda x: x[1], reverse=True)[:5])
    }

    return dashboard

def generate_comprehensive_dashboard(analysis_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate comprehensive dashboard data combining all report types"""
    # Get data from individual dashboard generators
    security_data = generate_security_dashboard(analysis_data)
    performance_data = generate_performance_dashboard(analysis_data)
    technology_data = generate_technology_dashboard(analysis_data)

    # Prepare combined dashboard
    dashboard = {
        "summary": {
            "total_analyses": len(analysis_data),
            "security_risk_score": security_data["summary"].get("risk_score", 0),
            "performance_score": performance_data["summary"].get("overall_performance_score", 0),
            "total_issues": security_data["summary"].get("total_issues", 0)
        },
        "security": security_data,
        "performance": performance_data,
        "technology": technology_data
    }

    return dashboard

def generate_executive_dashboard(analysis_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate executive summary dashboard"""
    # Get data from comprehensive dashboard
    comprehensive = generate_comprehensive_dashboard(analysis_data)

    # Extract key metrics for executive view
    dashboard = {
        "summary": {
            "total_analyses": len(analysis_data),
            "security_risk_score": comprehensive["summary"].get("security_risk_score", 0),
            "performance_score": comprehensive["summary"].get("performance_score", 0),
            "critical_issues": comprehensive["security"]["severity_distribution"].get("critical", 0),
            "high_issues": comprehensive["security"]["severity_distribution"].get("high", 0)
        },
        "key_findings": generate_key_findings(analysis_data),
        "recommendations": generate_recommendations(analysis_data)
    }

    return dashboard

def generate_key_findings(analysis_data: Dict[str, Any]) -> List[str]:
    """Generate key findings for executive summary"""
    findings = []

    # Security findings
    security_dashboard = generate_security_dashboard(analysis_data)

    if security_dashboard["summary"].get("risk_score", 0) > 7:
        findings.append("High security risk score detected")

    critical_issues = security_dashboard["severity_distribution"].get("critical", 0)
    if critical_issues > 0:
        findings.append(f"Found {critical_issues} critical security issues that need immediate attention")

    # Performance findings
    performance_dashboard = generate_performance_dashboard(analysis_data)

    if performance_dashboard["summary"].get("overall_performance_score", 0) > 70:
        findings.append("Performance issues detected that may impact user experience")

    # Technology findings
    technology_dashboard = generate_technology_dashboard(analysis_data)

    if len(technology_dashboard["top_frameworks"]) > 2:
        findings.append("Multiple frameworks detected, which may increase complexity")

    return findings

def generate_recommendations(analysis_data: Dict[str, Any]) -> List[str]:
    """Generate recommendations for executive summary"""
    recommendations = []

    # Security recommendations
    security_dashboard = generate_security_dashboard(analysis_data)

    if security_dashboard["severity_distribution"].get("critical", 0) > 0:
        recommendations.append("Address critical security vulnerabilities immediately")

    if security_dashboard["severity_distribution"].get("high", 0) > 0:
        recommendations.append("Create a plan to fix high-severity security issues")

    # Performance recommendations
    performance_dashboard = generate_performance_dashboard(analysis_data)

    if performance_dashboard["scores"].get("startup", 0) > 60:
        recommendations.append("Optimize app startup time to improve user experience")

    if performance_dashboard["scores"].get("memory", 0) > 60:
        recommendations.append("Reduce memory usage to improve app stability")

    if performance_dashboard["scores"].get("battery", 0) > 60:
        recommendations.append("Optimize battery usage to extend app runtime")

    return recommendations