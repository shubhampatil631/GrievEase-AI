import json
from src.utils.db import build_api_response

def handler(event, context):
    return build_api_response(200, {
        "status": "healthy",
        "service": "GrievEase AI API",
        "version": "1.0.0",
        "timestamp": "2026-09-17"
    })
