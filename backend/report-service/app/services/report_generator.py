# backend/report-service/app/services/report_generator.py
import os
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

from app.services.markdown_service import generate_markdown
from app.services.pdf_service import generate_pdf, generate_pdf_from_markdown
from app.services.dashboard_data import generate_dashboard_data

logger = logging.getLogger(__name__)

async def generate_report(
        report_id: str,
        report_type: str,
        format: str,
        title: str,
        analysis_data: Dict[str, Any],
        output_dir: str,
        description: Optional[str] = None,
        template_id: Optional[str] = None
) -> str:
    """
    Generate a report in the specified format.

    Args:
        report_id: Unique identifier for the report
        report_type: Type of report (security, performance, technology, etc.)
        format: Output format (pdf, markdown, html, json, sarif)
        title: Report title
        analysis_data: Dictionary of analysis results
        output_dir: Directory to save the report
        description: Optional report description
        template_id: Optional template ID to use

    Returns:
        Path to the generated report file
    """
    logger.info(f"Generating {format} report for report ID: {report_id}")

    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    # Set output file path
    output_path = os.path.join(output_dir, f"{report_id}.{format}")

    try:
        # Generate report based on format
        if format == "pdf":
            await generate_pdf_report(
                report_id,
                report_type,
                title,
                analysis_data,
                output_path,
                description,
                template_id
            )
        elif format == "markdown":
            await generate_markdown_report(
                report_id,
                report_type,
                title,
                analysis_data,
                output_path,
                description
            )
        elif format == "html":
            await generate_html_report(
                report_id,
                report_type,
                title,
                analysis_data,
                output_path,
                description,
                template_id
            )
        elif format in ["json", "sarif"]:
            await generate_json_report(
                report_id,
                report_type,
                title,
                analysis_data,
                output_path,
                description,
                format == "sarif"
            )
        else:
            raise ValueError(f"Unsupported format: {format}")

        logger.info(f"Report generated successfully at {output_path}")
        return output_path
    except Exception as e:
        logger.error(f"Error generating report: {str(e)}")
        raise

async def generate_pdf_report(
        report_id: str,
        report_type: str,
        title: str,
        analysis_data: Dict[str, Any],
        output_path: str,
        description: Optional[str] = None,
        template_id: Optional[str] = None
) -> str:
    """Generate a PDF report"""
    # First generate HTML content
    html_content = await generate_html_content(
        report_id,
        report_type,
        title,
        analysis_data,
        description,
        template_id
    )

    # Convert HTML to PDF
    return await generate_pdf(html_content, output_path)

async def generate_markdown_report(
        report_id: str,
        report_type: str,
        title: str,
        analysis_data: Dict[str, Any],
        output_path: str,
        description: Optional[str] = None
) -> str:
    """Generate a Markdown report"""
    # Generate markdown content
    markdown_content = await generate_markdown(
        report_type,
        analysis_data,
        title
    )

    # Add description if provided
    if description:
        markdown_content = f"{title}\n\n{description}\n\n{markdown_content}"

    # Write to file
    with open(output_path, "w") as f:
        f.write(markdown_content)

    return output_path

async def generate_html_report(
        report_id: str,
        report_type: str,
        title: str,
        analysis_data: Dict[str, Any],
        output_path: str,
        description: Optional[str] = None,
        template_id: Optional[str] = None
) -> str:
    """Generate an HTML report"""
    # Generate HTML content
    html_content = await generate_html_content(
        report_id,
        report_type,
        title,
        analysis_data,
        description,
        template_id
    )

    # Write to file
    with open(output_path, "w") as f:
        f.write(html_content)

    return output_path

async def generate_json_report(
        report_id: str,
        report_type: str,
        title: str,
        analysis_data: Dict[str, Any],
        output_path: str,
        description: Optional[str] = None,
        sarif_format: bool = False
) -> str:
    """Generate a JSON report"""
    # Generate dashboard data
    dashboard_data = generate_dashboard_data(report_type, analysis_data)

    # Create JSON structure
    json_data = {
        "report_id": report_id,
        "title": title,
        "description": description or "",
        "report_type": report_type,
        "created_at": datetime.now().isoformat(),
        "dashboard": dashboard_data,
        "analyses": analysis_data
    }

    # Convert to SARIF format if requested
    if sarif_format:
        json_data = convert_to_sarif_format(json_data)

    # Write to file
    with open(output_path, "w") as f:
        json.dump(json_data, f, indent=2)

    return output_path

async def generate_html_content(
        report_id: str,
        report_type: str,
        title: str,
        analysis_data: Dict[str, Any],
        description: Optional[str] = None,
        template_id: Optional[str] = None
) -> str:
    """Generate HTML content for the report"""
    from jinja2 import Environment, FileSystemLoader, select_autoescape
    import os

    # Initialize Jinja2 environment
    templates_dir = os.path.join(os.getcwd(), "templates")
    env = Environment(
        loader=FileSystemLoader(templates_dir),
        autoescape=select_autoescape(['html', 'xml'])
    )

    # Select template based on report type and template ID
    template_name = f"{report_type}_report.html"

    if template_id:
        # Load template from database (simplified)
        custom_template_path = os.path.join(templates_dir, f"custom_{template_id}.html")
        if os.path.exists(custom_template_path):
            template_name = f"custom_{template_id}.html"

    # Check if template exists, use default if not
    if not os.path.exists(os.path.join(templates_dir, template_name)):
        template_name = "default_report.html"

        # Create default template if it doesn't exist
        if not os.path.exists(os.path.join(templates_dir, template_name)):
            with open(os.path.join(templates_dir, template_name), "w") as f:
                f.write(get_default_html_template())

    # Load template
    template = env.get_template(template_name)

    # Generate dashboard data
    dashboard_data = generate_dashboard_data(report_type, analysis_data)

    # Render template
    html_content = template.render(
        title=title,
        description=description or "",
        report_id=report_id,
        report_type=report_type,
        generated_at=datetime.now().isoformat(),
        analyses=analysis_data,
        dashboard=dashboard_data
    )

    return html_content

def convert_to_sarif_format(data: Dict[str, Any]) -> Dict[str, Any]:
    """Convert analysis data to SARIF format"""
    sarif = {
        "$schema": "https://schemastore.azurewebsites.net/schemas/json/sarif-2.1.0-rtm.5.json",
        "version": "2.1.0",
        "runs": []
    }

    for analysis_id, analysis in data["analyses"].items():
        if "results" not in analysis or not analysis["results"]:
            continue

        # Handle security issues
        if "security" in analysis["results"]:
            security_data = analysis["results"]["security"]

            run = {
                "tool": {
                    "driver": {
                        "name": "Security Analysis Platform",
                        "informationUri": "https://example.com",
                        "rules": []
                    }
                },
                "results": []
            }

            # Add rules and results
            if "issues" in security_data:
                rule_ids = set()

                for issue in security_data["issues"]:
                    # Add rule (only once per rule ID)
                    rule_id = issue["issue_id"]
                    if rule_id not in rule_ids:
                        rule_ids.add(rule_id)
                        run["tool"]["driver"]["rules"].append({
                            "id": rule_id,
                            "shortDescription": {
                                "text": issue["title"]
                            },
                            "fullDescription": {
                                "text": issue["description"]
                            },
                            "help": {
                                "text": issue.get("recommendation", "")
                            },
                            "properties": {
                                "security-severity": map_severity_to_sarif(issue["severity"])
                            }
                        })

                    # Add result
                    sarif_result = {
                        "ruleId": rule_id,
                        "level": map_severity_to_sarif_level(issue["severity"]),
                        "message": {
                            "text": issue["description"]
                        }
                    }

                    # Add location if available
                    if "location" in issue and issue["location"]:
                        sarif_result["locations"] = [{
                            "physicalLocation": {
                                "artifactLocation": {
                                    "uri": issue["location"]
                                }
                            }
                        }]

                        # Add line number if available
                        if "line_number" in issue and issue["line_number"]:
                            sarif_result["locations"][0]["physicalLocation"]["region"] = {
                                "startLine": issue["line_number"]
                            }

                    run["results"].append(sarif_result)

            sarif["runs"].append(run)

        # Add similar processing for code quality, etc. if needed

    return sarif

def map_severity_to_sarif(severity: str) -> str:
    """Map severity to SARIF security severity"""
    mapping = {
        "critical": "9.5",
        "high": "8.0",
        "medium": "5.0",
        "low": "3.0",
        "info": "1.0"
    }
    return mapping.get(severity.lower(), "5.0")

def map_severity_to_sarif_level(severity: str) -> str:
    """Map severity to SARIF level"""
    mapping = {
        "critical": "error",
        "high": "error",
        "medium": "warning",
        "low": "note",
        "info": "note"
    }
    return mapping.get(severity.lower(), "warning")

def get_default_html_template() -> str:
    """Get default HTML template for reports"""
    return """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ title }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        header {
            background-color: #3F51B5;
            color: white;
            padding: 20px;
            margin-bottom: 20px;
        }
        h1 {
            margin: 0;
        }
        .summary {
            background-color: #f5f5f5;
            border-radius: 5px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .card {
            background-color: white;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            padding: 20px;
            margin-bottom: 20px;
        }
        .severity-critical {
            color: #d32f2f;
        }
        .severity-high {
            color: #f44336;
        }
        .severity-medium {
            color: #ff9800;
        }
        .severity-low {
            color: #ffc107;
        }
        .severity-info {
            color: #2196f3;
        }
        footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            border-top: 1px solid #eee;
            color: #777;
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <h1>{{ title }}</h1>
            <p>{{ description }}</p>
            <p>Generated: {{ generated_at }}</p>
        </div>
    </header>
    
    <div class="container">
        <div class="summary">
            <h2>Summary</h2>
            <p>Report Type: {{ report_type|capitalize }}</p>
            <p>Number of Analyses: {{ analyses|length }}</p>
            <!-- Dashboard data will be shown here -->
            {% if dashboard %}
                {% for section, data in dashboard.items() %}
                <div class="dashboard-section">
                    <h3>{{ section|capitalize }}</h3>
                    <div class="dashboard-content">
                        {% for key, value in data.items() %}
                        <p><strong>{{ key|capitalize }}:</strong> {{ value }}</p>
                        {% endfor %}
                    </div>
                </div>
                {% endfor %}
            {% endif %}
        </div>
        
        {% for analysis_id, analysis in analyses.items() %}
        <div class="card">
            <h2>Analysis: {{ analysis.id }}</h2>
            {% if analysis.filename %}
            <p>Filename: {{ analysis.filename }}</p>
            {% elif analysis.repository_url %}
            <p>Repository: {{ analysis.repository_url }}</p>
            {% endif %}
            <p>Status: {{ analysis.status }}</p>
            <p>Created: {{ analysis.created_at }}</p>
            
            {% if analysis.status == "completed" and analysis.results %}
                <div class="analysis-results">
                    {% if report_type == "security" and analysis.results.security %}
                        <h3>Security Analysis</h3>
                        <p>Risk Score: {{ analysis.results.security.risk_score }}</p>
                        <p>Issues Count: {{ analysis.results.security.issues_count }}</p>
                        
                        <h4>Issues by Severity</h4>
                        <ul>
                            {% for severity, count in analysis.results.security.severity_counts.items() %}
                            <li class="severity-{{ severity }}">{{ severity|capitalize }}: {{ count }}</li>
                            {% endfor %}
                        </ul>
                        
                        {% if analysis.results.security.issues %}
                            <h4>Top Issues</h4>
                            <ul>
                                {% for issue in analysis.results.security.issues[:5] %}
                                <li>
                                    <span class="severity-{{ issue.severity }}">{{ issue.severity|capitalize }}:</span>
                                    <strong>{{ issue.title }}</strong> - 
                                    {{ issue.description }}
                                </li>
                                {% endfor %}
                            </ul>
                        {% endif %}
                    {% endif %}
                    
                    {% if report_type == "performance" and analysis.results.performance %}
                        <h3>Performance Analysis</h3>
                        <div class="performance-data">
                            <h4>APK Size</h4>
                            <p>Total Size: {{ analysis.results.performance.apk_size.total_size_formatted }}</p>
                            
                            <h4>Startup Estimate</h4>
                            <p>Score: {{ analysis.results.performance.startup_estimate.score }}</p>
                            
                            <h4>Memory Usage</h4>
                            <p>Score: {{ analysis.results.performance.memory_usage.score }}</p>
                            
                            <h4>Battery Impact</h4>
                            <p>Score: {{ analysis.results.performance.battery_impact.score }}</p>
                        </div>
                    {% endif %}
                    
                    {% if report_type == "technology" and analysis.results.technology %}
                        <h3>Technology Detection</h3>
                        <div class="technology-data">
                            <h4>Frameworks</h4>
                            <ul>
                                {% for framework in analysis.results.technology.frameworks.detected %}
                                <li>{{ framework }}</li>
                                {% endfor %}
                            </ul>
                            
                            <h4>Programming Languages</h4>
                            <ul>
                                {% for language in analysis.results.technology.programming_languages.detected %}
                                <li>{{ language }}</li>
                                {% endfor %}
                            </ul>
                        </div>
                    {% endif %}
                </div>
            {% endif %}
        </div>
        {% endfor %}
    </div>
    
    <footer>
        <div class="container">
            <p>Report generated by the Security Analysis Platform</p>
        </div>
    </footer>
</body>
</html>"""