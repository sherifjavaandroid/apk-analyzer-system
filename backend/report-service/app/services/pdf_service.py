# backend/report-service/app/services/pdf_service.py
import os
import logging
import asyncio
from typing import Optional

# Get logger
logger = logging.getLogger(__name__)

async def generate_pdf(html_content: str, output_path: str) -> str:
    """
    Generate a PDF from HTML content.

    Args:
        html_content: HTML content to convert to PDF
        output_path: Path to save the PDF file

    Returns:
        Path to the generated PDF file
    """
    logger.info(f"Generating PDF at {output_path}")

    try:
        # Attempt to use WeasyPrint first (better rendering quality)
        return await generate_pdf_with_weasyprint(html_content, output_path)
    except Exception as e:
        logger.warning(f"WeasyPrint failed: {str(e)}. Falling back to pdfkit.")
        # Fall back to pdfkit if WeasyPrint fails
        return await generate_pdf_with_pdfkit(html_content, output_path)

async def generate_pdf_with_weasyprint(html_content: str, output_path: str) -> str:
    """
    Generate a PDF using WeasyPrint.

    Args:
        html_content: HTML content to convert to PDF
        output_path: Path to save the PDF file

    Returns:
        Path to the generated PDF file
    """
    # Import here to avoid loading all dependencies at module level
    from weasyprint import HTML

    # Run in a separate thread to avoid blocking the event loop
    def _generate():
        HTML(string=html_content).write_pdf(output_path)
        return output_path

    # Run synchronous code in a thread pool
    return await asyncio.to_thread(_generate)

async def generate_pdf_with_pdfkit(html_content: str, output_path: str) -> str:
    """
    Generate a PDF using pdfkit (wkhtmltopdf).

    Args:
        html_content: HTML content to convert to PDF
        output_path: Path to save the PDF file

    Returns:
        Path to the generated PDF file
    """
    # Import here to avoid loading all dependencies at module level
    import pdfkit

    # Configuration for wkhtmltopdf
    options = {
        'page-size': 'A4',
        'margin-top': '20mm',
        'margin-right': '20mm',
        'margin-bottom': '20mm',
        'margin-left': '20mm',
        'encoding': 'UTF-8',
        'no-outline': None,
        'quiet': None
    }

    # Run in a separate thread to avoid blocking the event loop
    def _generate():
        pdfkit.from_string(html_content, output_path, options=options)
        return output_path

    # Run synchronous code in a thread pool
    return await asyncio.to_thread(_generate)

async def generate_pdf_from_markdown(markdown_content: str, output_path: str) -> str:
    """
    Generate a PDF from Markdown content.

    Args:
        markdown_content: Markdown content to convert to PDF
        output_path: Path to save the PDF file

    Returns:
        Path to the generated PDF file
    """
    logger.info(f"Generating PDF from Markdown at {output_path}")

    # Import here to avoid loading all dependencies at module level
    import markdown

    # Convert markdown to HTML
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 20mm;
                color: #333;
            }}
            h1, h2, h3, h4, h5, h6 {{
                margin-top: 1.2em;
                margin-bottom: 0.6em;
                color: #2c3e50;
            }}
            code, pre {{
                font-family: 'Courier New', Courier, monospace;
                background-color: #f5f5f5;
                border-radius: 3px;
                padding: 0.2em 0.4em;
            }}
            pre {{
                padding: 1em;
                overflow-x: auto;
            }}
            table {{
                border-collapse: collapse;
                width: 100%;
                margin: 1em 0;
            }}
            th, td {{
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }}
            th {{
                background-color: #f2f2f2;
            }}
            img {{
                max-width: 100%;
                height: auto;
            }}
            .severity-critical {{
                color: #d32f2f;
            }}
            .severity-high {{
                color: #f44336;
            }}
            .severity-medium {{
                color: #ff9800;
            }}
            .severity-low {{
                color: #ffc107;
            }}
            .severity-info {{
                color: #2196f3;
            }}
            @page {{
                size: A4;
                margin: 20mm;
            }}
        </style>
    </head>
    <body>
        {markdown.markdown(markdown_content, extensions=['tables', 'fenced_code', 'nl2br'])}
    </body>
    </html>
    """

    # Generate PDF from HTML
    return await generate_pdf(html_content, output_path)