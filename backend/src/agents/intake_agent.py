import os
import json
import boto3
import re
from src.utils.db import update_case_meta, write_audit_entry

textract_client = boto3.client("textract")
s3_client = boto3.client("s3")

def clean_and_normalize_text(ocr_text: str, complaint_text: str) -> str:
    """Combines OCR text and user complaint, strips excess whitespace and control characters."""
    combined = f"{complaint_text}\n\n[Extracted Evidence Document Text]:\n{ocr_text}".strip()
    # Normalize multiple whitespaces and newlines
    normalized = re.sub(r'\n{3,}', '\n\n', combined)
    normalized = re.sub(r'[ \t]{2,}', ' ', normalized)
    return normalized

def extract_text_from_s3_image(bucket: str, s3_key: str) -> str:
    """Calls Textract DetectDocumentText on the uploaded image in S3."""
    try:
        response = textract_client.detect_document_text(
            Document={
                'S3Object': {
                    'Bucket': bucket,
                    'Name': s3_key
                }
            }
        )
        extracted_lines = []
        for block in response.get("Blocks", []):
            if block.get("BlockType") == "LINE":
                extracted_lines.append(block.get("Text", ""))
        return "\n".join(extracted_lines)
    except Exception as e:
        print(f"[IntakeAgent] Textract extraction failed or skipped: {str(e)}")
        return ""

def handler(event, context):
    print(f"[IntakeAgent] Received event: {json.dumps(event)}")
    case_id = event.get("caseId")
    s3_key = event.get("s3Key", "")
    complaint_text = event.get("complaintText", "")
    category = event.get("category", "OTHER")
    evidence_bucket = os.environ.get("EVIDENCE_BUCKET", "")

    ocr_text = ""
    if s3_key and evidence_bucket:
        ocr_text = extract_text_from_s3_image(evidence_bucket, s3_key)

    normalized_text = clean_and_normalize_text(ocr_text, complaint_text)

    # Update DynamoDB with OCR extraction results and progress
    try:
        update_case_meta(
            case_id=case_id,
            status="CLASSIFYING",
            updates={
                "ocrText": ocr_text,
                "normalizedText": normalized_text,
                "category": category
            },
            stage_completed="INTAKE"
        )
        write_audit_entry(
            case_id=case_id,
            stage="INTAKE",
            result_summary=f"OCR extracted {len(ocr_text.splitlines())} lines. Combined text normalized ({len(normalized_text)} chars)."
        )
    except Exception as db_err:
        print(f"[IntakeAgent] DB update error: {str(db_err)}")

    return {
        "caseId": case_id,
        "ocrText": ocr_text,
        "normalizedText": normalized_text,
        "category": category
    }
