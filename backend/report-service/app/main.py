# backend/report-service/app/main.py
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import uvicorn
import os
import uuid
import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
import httpx
from pydantic import BaseModel

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Report Service",
    description="Generate and manage reports based on analysis results",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory for storing reports
REPORTS_DIR = os.path.join(os.getcwd(), "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

# Directory for report templates
TEMPLATES_DIR = os.path.join(os.getcwd(), "templates")
os.makedirs(TEMPLATES_DIR, exist_ok=True)

# Service URLs (ideally these would come from environment variables)
APK_SERVICE_URL = os.getenv("APK_SERVICE_URL", "http://apk-analyzer:8001")
GITHUB_SERVICE_URL = os.getenv("GITHUB_SERVICE_URL", "http://github-analyzer:8002")
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://ai-service:8003")

# Models
class User(BaseModel):
    id: str
    username: str
    email: str
    role: str = "user"
    full_name: Optional[str] = None

class ReportRequest(BaseModel):
    title: str
    description: Optional[str] = None
    report_type: str  # 'security', 'performance', 'technology', 'comprehensive', 'executive', 'custom'
    format: str  # 'pdf', 'markdown', 'html', 'sarif', 'json'
    template_id: Optional[str] = None
    analysis_ids: List[str]
    options: Optional[Dict[str, Any]] = None

class ReportTemplate(BaseModel):
    id: str
    name: str
    description: str
    report_type: str
    format: str
    template_data: Dict[str, Any]

class Report(BaseModel):
    id: str
    title: str
    description: str
    created_at: str
    updated_at: Optional[str] = None
    report_type: str
    format: str
    status: str
    owner_id: str
    data: Dict[str, Any]
    analysis_ids: List[str]

# In-memory storage (would be replaced with a database in production)
reports = {}
templates = {}

# Mock authentication middleware
async def get_current_user():
    # In a real app, this would validate JWT tokens
    # For now, just return a mock user
    return User(
        id="user123",
        username="testuser",
        email="user@example.com",
        role="user"
    )

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.get("/api/reports")
async def get_reports(current_user: User = Depends(get_current_user)):
    """Get all reports for the current user"""
    user_reports = [report for report_id, report in reports.items()
                    if report["owner_id"] == current_user.id or current_user.role == "admin"]

    return {"reports": user_reports}

@app.get("/api/reports/{report_id}")
async def get_report(report_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific report"""
    if report_id not in reports:
        raise HTTPException(status_code=404, detail="Report not found")

    report = reports[report_id]

    # Check permissions
    if report["owner_id"] != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to access this report")

    return report

@app.post("/api/reports/generate")
async def generate_report(
        request: ReportRequest,
        background_tasks: BackgroundTasks,
        current_user: User = Depends(get_current_user)
):
    """Generate a new report based on analysis results"""
    # Create report ID
    report_id = str(uuid.uuid4())

    # Initialize report
    report = {
        "id": report_id,
        "title": request.title,
        "description": request.description or "",
        "created_at": datetime.now().isoformat(),
        "updated_at": None,
        "report_type": request.report_type,
        "format": request.format,
        "status": "processing",
        "owner_id": current_user.id,
        "data": {},
        "analysis_ids": request.analysis_ids
    }

    # Store initial report
    reports[report_id] = report

    # Process report generation in background
    background_tasks.add_task(
        process_report_generation,
        report_id=report_id,
        report_request=request,
        user_id=current_user.id
    )

    return report

@app.delete("/api/reports/{report_id}")
async def delete_report(report_id: str, current_user: User = Depends(get_current_user)):
    """Delete a report"""
    if report_id not in reports:
        raise HTTPException(status_code=404, detail="Report not found")

    report = reports[report_id]

    # Check permissions
    if report["owner_id"] != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this report")

    # Delete report file if it exists
    report_file_path = os.path.join(REPORTS_DIR, f"{report_id}.{report['format']}")
    if os.path.exists(report_file_path):
        os.remove(report_file_path)

    # Remove from storage
    del reports[report_id]

    return {"message": "Report deleted successfully"}

@app.get("/api/reports/{report_id}/download")
async def download_report(report_id: str, current_user: User = Depends(get_current_user)):
    """Download a report file"""
    if report_id not in reports:
        raise HTTPException(status_code=404, detail="Report not found")

    report = reports[report_id]

    # Check permissions
    if report["owner_id"] != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to download this report")

    # Check if report generation is complete
    if report["status"] != "completed":
        raise HTTPException(status_code=400, detail="Report generation is not complete")

    # Check if report file exists
    report_file_path = os.path.join(REPORTS_DIR, f"{report_id}.{report['format']}")
    if not os.path.exists(report_file_path):
        raise HTTPException(status_code=404, detail="Report file not found")

    # Set content type based on format
    content_type = {
        "pdf": "application/pdf",
        "markdown": "text/markdown",
        "html": "text/html",
        "sarif": "application/sarif+json",
        "json": "application/json"
    }.get(report["format"], "application/octet-stream")

    return FileResponse(
        path=report_file_path,
        filename=f"{report['title'].replace(' ', '_')}.{report['format']}",
        media_type=content_type
    )

@app.get("/api/reports/templates")
async def get_templates(current_user: User = Depends(get_current_user)):
    """Get all report templates"""
    return {"templates": list(templates.values())}

@app.post("/api/reports/templates")
async def create_template(template: ReportTemplate, current_user: User = Depends(get_current_user)):
    """Create a new report template"""
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create templates")

    # Store template
    templates[template.id] = template.dict()

    return template

async def process_report_generation(report_id: str, report_request: ReportRequest, user_id: str):
    """Process report generation in the background"""
    try:
        logger.info(f"Starting report generation for report ID: {report_id}")

        # Fetch analysis data
        analysis_data = await fetch_analysis_data(report_request.analysis_ids)

        # Generate report based on type and format
        if report_request.format == "pdf":
            await generate_pdf_report(report_id, report_request, analysis_data)
        elif report_request.format == "markdown":
            await generate_markdown_report(report_id, report_request, analysis_data)
        elif report_request.format == "html":
            await generate_html_report(report_id, report_request, analysis_data)
        elif report_request.format in ["sarif", "json"]:
            await generate_json_report(report_id, report_request, analysis_data)
        else:
            raise ValueError(f"Unsupported report format: {report_request.format}")

        # Update report status
        reports[report_id]["status"] = "completed"
        reports[report_id]["updated_at"] = datetime.now().isoformat()
        reports[report_id]["data"] = {
            "summary": generate_report_summary(report_request.report_type, analysis_data),
            "file_path": f"{report_id}.{report_request.format}"
        }

        logger.info(f"Report generation completed for report ID: {report_id}")
    except Exception as e:
        logger.error(f"Error generating report {report_id}: {str(e)}")

        # Update report status to failed
        if report_id in reports:
            reports[report_id]["status"] = "failed"
            reports[report_id]["updated_at"] = datetime.now().isoformat()
            reports[report_id]["data"] = {"error": str(e)}

async def fetch_analysis_data(analysis_ids: List[str]) -> Dict[str, Any]:
    """Fetch analysis data from the analysis services"""
    results = {}

    for analysis_id in analysis_ids:
        try:
            # Try APK service first
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{APK_SERVICE_URL}/api/analysis/{analysis_id}", timeout=10.0)

                if response.status_code == 200:
                    results[analysis_id] = response.json()
                    continue

            # Try GitHub service if APK service didn't have it
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{GITHUB_SERVICE_URL}/api/analysis/{analysis_id}", timeout=10.0)

                if response.status_code == 200:
                    results[analysis_id] = response.json()
                    continue

            # Try AI service if others didn't have it
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{AI_SERVICE_URL}/api/result/{analysis_id}", timeout=10.0)

                if response.status_code == 200:
                    results[analysis_id] = response.json()
                    continue

            logger.warning(f"Analysis {analysis_id} not found in any service")
        except Exception as e:
            logger.error(f"Error fetching analysis {analysis_id}: {str(e)}")

    return results

async def generate_pdf_report(report_id: str, report_request: ReportRequest, analysis_data: Dict[str, Any]):
    """Generate a PDF report"""
    from app.services.pdf_service import generate_pdf

    # Get or create report content in HTML
    html_content = await generate_html_content(report_request, analysis_data)

    # Generate PDF from HTML
    output_path = os.path.join(REPORTS_DIR, f"{report_id}.pdf")
    await generate_pdf(html_content, output_path)

    return output_path

async def generate_markdown_report(report_id: str, report_request: ReportRequest, analysis_data: Dict[str, Any]):
    """Generate a Markdown report"""
    from app.services.markdown_service import generate_markdown

    # Generate markdown content
    markdown_content = await generate_markdown(report_request.report_type, analysis_data, report_request.title)

    # Save to file
    output_path = os.path.join(REPORTS_DIR, f"{report_id}.markdown")
    with open(output_path, "w") as f:
        f.write(markdown_content)

    return output_path

async def generate_html_report(report_id: str, report_request: ReportRequest, analysis_data: Dict[str, Any]):
    """Generate an HTML report"""
    html_content = await generate_html_content(report_request, analysis_data)

    # Save to file
    output_path = os.path.join(REPORTS_DIR, f"{report_id}.html")
    with open(output_path, "w") as f:
        f.write(html_content)

    return output_path

async def generate_json_report(report_id: str, report_request: ReportRequest, analysis_data: Dict[str, Any]):
    """Generate a JSON or SARIF report"""
    # Prepare JSON data
    json_data = {
        "report_id": report_id,
        "title": report_request.title,
        "description": report_request.description,
        "created_at": reports[report_id]["created_at"],
        "report_type": report_request.report_type,
        "analyses": analysis_data
    }

    # Format as SARIF if requested
    if report_request.format == "sarif":
        json_data = convert_to_sarif_format(json_data)

    # Save to file
    output_path = os.path.join(REPORTS_DIR, f"{report_id}.{report_request.format}")
    with open(output_path, "w") as f:
        json.dump(json_data, f, indent=2)

    return output_path

async def generate_html_content(report_request: ReportRequest, analysis_data: Dict[str, Any]) -> str:
    """Generate HTML content for the report"""
    from jinja2 import Environment, FileSystemLoader

    # Initialize Jinja2 environment
    env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))

    # Select template based on report type
    template_name = f"{report_request.report_type}_report.html"
    if report_request.template_id and report_request.template_id in templates:
        # Use custom template if specified and exists
        custom_template = templates[report_request.template_id]
        if custom_template["format"] == "html":
            template_content = custom_template["template_data"].get("content", "")
            with open(os.path.join(TEMPLATES_DIR, f"custom_{report_request.template_id}.html"), "w") as f:
                f.write(template_content)
            template_name = f"custom_{report_request.template_id}.html"

    # Check if template exists
    if not os.path.exists(os.path.join(TEMPLATES_DIR, template_name)):
        # Use default template if specific one doesn't exist
        template_name = "default_report.html"

        # Create default template if it doesn't exist
        if not os.path.exists(os.path.join(TEMPLATES_DIR, template_name)):
            with open(os.path.join(TEMPLATES_DIR, template_name), "w") as f:
                f.write(get_default_html_template())

    # Load template
    template = env.get_template(template_name)

    # Generate dashboard data
    from app.services.dashboard_data import generate_dashboard_data
    dashboard_data = generate_dashboard_data(report_request.report_type, analysis_data)

    # Render template
    html_content = template.render(
        title=report_request.title,
        description=report_request.description,
        report_type=report_request.report_type,
        generated_at=datetime.now().isoformat(),
        analyses=analysis_data,
        dashboard=dashboard_data
    )

    return html_content

def generate_report_summary(report_type: str, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a summary of the report"""
    summary = {
        "analyses_count": len(analysis_data),
        "report_type": report_type
    }

    if report_type == "security":
        # Count security issues
        total_issues = 0
        severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}

        for analysis_id, analysis in analysis_data.items():
            if "results" in analysis and analysis["results"]:
                if "security" in analysis["results"]:
                    security_data = analysis["results"]["security"]
                    if "issues_count" in security_data:
                        total_issues += security_data["issues_count"]
                    if "severity_counts" in security_data:
                        for severity, count in security_data["severity_counts"].items():
                            severity_counts[severity] += count

        summary["security"] = {
            "total_issues": total_issues,
            "severity_counts": severity_counts
        }

    elif report_type == "performance":
        # Summarize performance scores
        performance_scores = []

        for analysis_id, analysis in analysis_data.items():
            if "results" in analysis and analysis["results"]:
                if "performance" in analysis["results"]:
                    perf_data = analysis["results"]["performance"]
                    if "apk_size" in perf_data and "total_size_bytes" in perf_data["apk_size"]:
                        performance_scores.append(perf_data["apk_size"]["total_size_bytes"])

        if performance_scores:
            summary["performance"] = {
                "avg_size_bytes": sum(performance_scores) / len(performance_scores),
                "analyses_count": len(performance_scores)
            }

    # Add more report types as needed

    return summary

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

        if "security" in analysis["results"]:
            security_data = analysis["results"]["security"]

            run = {
                "tool": {
                    "driver": {
                        "name": "APK Security Analyzer",
                        "informationUri": "https://example.com",
                        "rules": []
                    }
                },
                "results": []
            }

            # Add rules and results
            if "issues" in security_data:
                for issue in security_data["issues"]:
                    # Add rule
                    rule_id = issue["issue_id"]
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

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8004, reload=True)