import os
import json
import uuid
import boto3
from decimal import Decimal
from boto3.dynamodb.conditions import Key, Attr
from src.utils.db import (
    get_cases_table,
    build_api_response,
    get_current_iso_time,
    get_user_id_from_event,
    write_audit_entry,
    update_case_meta,
    DecimalEncoder
)

sfn_client = boto3.client("stepfunctions")

def handle_cors_options(event):
    """Handle CORS preflight requests."""
    return build_api_response(200, {"message": "CORS OK"})

def handle_create_case(event):
    """
    POST /cases — Initializes case in DynamoDB and triggers AWS Step Functions pipeline.
    Accepts: complaintText, s3Key, category, priority, userNotes, etc.
    """
    try:
        raw_body = event.get("body", "{}")
        if event.get("isBase64Encoded", False):
            import base64
            raw_body = base64.b64decode(raw_body).decode("utf-8")
        body = json.loads(raw_body) if isinstance(raw_body, str) else raw_body
    except Exception as e:
        return build_api_response(400, {
            "error": "INVALID_JSON",
            "message": f"Request body must be valid JSON: {str(e)}"
        })

    s3_key = body.get("s3Key", "").strip()
    complaint_text = body.get("complaintText", "").strip()
    category = body.get("category", "ECOMMERCE").upper()
    priority = body.get("priority", "NORMAL").upper()
    custom_notes = body.get("userNotes", "")

    if not s3_key and not complaint_text:
        return build_api_response(422, {
            "error": "MISSING_EVIDENCE_OR_TEXT",
            "message": "Please provide either an uploaded evidence s3Key or written complaintText"
        })

    user_id = get_user_id_from_event(event)
    case_id = f"c_{uuid.uuid4().hex[:8]}"
    now_iso = get_current_iso_time()

    table = get_cases_table()
    meta_item = {
        "PK": f"CASE#{case_id}",
        "SK": "META",
        "GSI1PK": f"USER#{user_id}",
        "GSI1SK": f"CASE#{now_iso}#{case_id}",
        "GSI2PK": "STATUS#PROCESSING",
        "GSI2SK": f"CASE#{now_iso}",
        "caseId": case_id,
        "userId": user_id,
        "status": "PROCESSING",
        "category": category,
        "priority": priority,
        "s3Key": s3_key,
        "complaintText": complaint_text,
        "userNotes": custom_notes,
        "stagesCompleted": [],
        "createdAt": now_iso,
        "updatedAt": now_iso
    }

    try:
        table.put_item(Item=meta_item)
        write_audit_entry(
            case_id=case_id,
            stage="CASE_CREATED",
            result_summary=f"Case initialized by user {user_id}. Category: {category} | Priority: {priority}"
        )
    except Exception as e:
        print(f"[CasesHandler] DynamoDB put error: {str(e)}")
        return build_api_response(500, {"error": "DB_ERROR", "message": f"Failed to persist case: {str(e)}"})

    # Kick off Step Functions execution
    state_machine_arn = os.environ.get("STATE_MACHINE_ARN", "")
    execution_arn = ""
    if state_machine_arn:
        try:
            sfn_input = {
                "caseId": case_id,
                "userId": user_id,
                "s3Key": s3_key,
                "complaintText": complaint_text,
                "category": category,
                "priority": priority
            }
            sfn_response = sfn_client.start_execution(
                stateMachineArn=state_machine_arn,
                name=f"exec-{case_id}-{uuid.uuid4().hex[:4]}",
                input=json.dumps(sfn_input)
            )
            execution_arn = sfn_response.get("executionArn", "")
        except Exception as e:
            print(f"[CasesHandler] Step Functions start error: {str(e)}")
            write_audit_entry(
                case_id=case_id,
                stage="PIPELINE_START_FAILED",
                result_summary=f"Step Functions launch failed: {str(e)}"
            )

    return build_api_response(202, {
        "caseId": case_id,
        "status": "PROCESSING",
        "executionArn": execution_arn,
        "createdAt": now_iso,
        "message": "Grievance pipeline successfully triggered and running"
    })

def handle_get_case_by_id(event, case_id: str):
    """
    GET /cases/{caseId} — Returns case status, progress, classification, draft, and audit trail.
    """
    table = get_cases_table()
    try:
        # Fetch META item
        response = table.get_item(Key={"PK": f"CASE#{case_id}", "SK": "META"})
        item = response.get("Item")
        if not item:
            return build_api_response(404, {
                "error": "CASE_NOT_FOUND",
                "message": f"No case found with ID {case_id}"
            })

        # Fetch audit history items under the same PK
        history_response = table.query(
            KeyConditionExpression=Key("PK").eq(f"CASE#{case_id}") & Key("SK").begins_with("STATUS#"),
            ScanIndexForward=True  # Chronological order
        )
        audit_trail = history_response.get("Items", [])
        item["auditTrail"] = audit_trail

        return build_api_response(200, item)
    except Exception as e:
        print(f"[CasesHandler] Get case error: {str(e)}")
        return build_api_response(500, {"error": "DB_ERROR", "message": str(e)})

def handle_list_cases(event):
    """
    GET /cases — Lists cases for the authenticated user with optional filtering by status and category.
    Supports query parameters: status, category, limit.
    """
    user_id = get_user_id_from_event(event)
    query_params = event.get("queryStringParameters") or {}
    status_filter = query_params.get("status")
    category_filter = query_params.get("category")
    limit = int(query_params.get("limit", 50))

    table = get_cases_table()
    try:
        query_kwargs = {
            "IndexName": "UserCasesIndex",
            "KeyConditionExpression": Key("GSI1PK").eq(f"USER#{user_id}"),
            "ScanIndexForward": False,  # Newest cases first
            "Limit": limit
        }

        # Apply filter expression if status or category provided
        filter_exprs = []
        if status_filter:
            filter_exprs.append(Attr("status").eq(status_filter.upper()))
        if category_filter:
            filter_exprs.append(Attr("category").eq(category_filter.upper()))

        if filter_exprs:
            combined_filter = filter_exprs[0]
            for expr in filter_exprs[1:]:
                combined_filter = combined_filter & expr
            query_kwargs["FilterExpression"] = combined_filter

        response = table.query(**query_kwargs)
        cases = response.get("Items", [])

        return build_api_response(200, {
            "cases": cases,
            "count": len(cases),
            "userId": user_id,
            "filters": {
                "status": status_filter,
                "category": category_filter
            }
        })
    except Exception as e:
        print(f"[CasesHandler] List cases error: {str(e)}")
        return build_api_response(500, {"error": "DB_ERROR", "message": str(e)})

def handle_update_case(event, case_id: str):
    """
    PATCH/PUT /cases/{caseId} — Updates metadata, edits generated draft, notes, or flags.
    """
    try:
        raw_body = event.get("body", "{}")
        if event.get("isBase64Encoded", False):
            import base64
            raw_body = base64.b64decode(raw_body).decode("utf-8")
        body = json.loads(raw_body) if isinstance(raw_body, str) else raw_body
    except Exception as e:
        return build_api_response(400, {"error": "INVALID_JSON", "message": str(e)})

    table = get_cases_table()
    try:
        # Check if case exists
        existing = table.get_item(Key={"PK": f"CASE#{case_id}", "SK": "META"}).get("Item")
        if not existing:
            return build_api_response(404, {
                "error": "CASE_NOT_FOUND",
                "message": f"Cannot update non-existent case {case_id}"
            })

        allowed_fields = [
            "complaintText", "category", "priority", "userNotes",
            "legalDraft", "targetForum", "status", "claimAmount",
            "statutoryDeadline", "customTags"
        ]
        updates = {k: v for k, v in body.items() if k in allowed_fields}

        new_status = updates.pop("status", None)
        update_case_meta(case_id=case_id, status=new_status, updates=updates)

        write_audit_entry(
            case_id=case_id,
            stage="CASE_UPDATED",
            result_summary=f"User updated fields: {', '.join(body.keys())}"
        )

        # Re-fetch updated item
        updated_item = table.get_item(Key={"PK": f"CASE#{case_id}", "SK": "META"}).get("Item")
        return build_api_response(200, {
            "message": "Case updated successfully",
            "case": updated_item
        })
    except Exception as e:
        print(f"[CasesHandler] Update case error: {str(e)}")
        return build_api_response(500, {"error": "DB_ERROR", "message": str(e)})

def handle_delete_case(event, case_id: str):
    """
    DELETE /cases/{caseId} — Archives or marks case as DELETED.
    """
    table = get_cases_table()
    try:
        existing = table.get_item(Key={"PK": f"CASE#{case_id}", "SK": "META"}).get("Item")
        if not existing:
            return build_api_response(404, {
                "error": "CASE_NOT_FOUND",
                "message": f"Case {case_id} not found"
            })

        update_case_meta(case_id=case_id, status="ARCHIVED", updates={"archivedAt": get_current_iso_time()})
        write_audit_entry(
            case_id=case_id,
            stage="CASE_ARCHIVED",
            result_summary="Case marked as ARCHIVED by user"
        )

        return build_api_response(200, {
            "message": f"Case {case_id} archived successfully",
            "caseId": case_id,
            "status": "ARCHIVED"
        })
    except Exception as e:
        print(f"[CasesHandler] Delete case error: {str(e)}")
        return build_api_response(500, {"error": "DB_ERROR", "message": str(e)})

def handle_get_stats(event):
    """
    GET /cases/stats or /cases/summary — Aggregates case metrics for the user dashboard.
    """
    user_id = get_user_id_from_event(event)
    table = get_cases_table()
    try:
        response = table.query(
            IndexName="UserCasesIndex",
            KeyConditionExpression=Key("GSI1PK").eq(f"USER#{user_id}")
        )
        cases = response.get("Items", [])

        total = len(cases)
        ready_count = sum(1 for c in cases if c.get("status") == "READY")
        processing_count = sum(1 for c in cases if c.get("status") == "PROCESSING")
        rejected_count = sum(1 for c in cases if c.get("status") == "REJECTED")
        archived_count = sum(1 for c in cases if c.get("status") == "ARCHIVED")

        forums_distribution = {}
        for c in cases:
            forum = c.get("targetForum") or c.get("classification", {}).get("targetForum") or "UNASSIGNED"
            forums_distribution[forum] = forums_distribution.get(forum, 0) + 1

        stats = {
            "userId": user_id,
            "totalCases": total,
            "readyCount": ready_count,
            "processingCount": processing_count,
            "rejectedCount": rejected_count,
            "archivedCount": archived_count,
            "forumDistribution": forums_distribution,
            "successRate": round((ready_count / total * 100), 1) if total > 0 else 100.0,
            "generatedAt": get_current_iso_time()
        }
        return build_api_response(200, stats)
    except Exception as e:
        print(f"[CasesHandler] Stats error: {str(e)}")
        return build_api_response(500, {"error": "DB_ERROR", "message": str(e)})

def handler(event, context):
    """
    Main Lambda entrypoint with multi-format routing (API Gateway v1 & v2).
    """
    print(f"[CasesHandler] Incoming Event: {json.dumps(event)}")
    
    # Extract HTTP Method
    http_method = (
        event.get("requestContext", {}).get("http", {}).get("method") or
        event.get("httpMethod") or
        "GET"
    ).upper()

    # Extract Path & Parameters
    path_parameters = event.get("pathParameters") or {}
    case_id = path_parameters.get("caseId")
    raw_path = event.get("rawPath") or event.get("path") or ""

    # Check for preflight CORS
    if http_method == "OPTIONS":
        return handle_cors_options(event)

    # Route stats endpoint
    if case_id in ("stats", "summary") or raw_path.endswith("/stats") or raw_path.endswith("/summary"):
        return handle_get_stats(event)

    # Route based on HTTP Method
    if http_method == "POST":
        return handle_create_case(event)
    elif http_method == "GET":
        if case_id:
            return handle_get_case_by_id(event, case_id)
        return handle_list_cases(event)
    elif http_method in ("PATCH", "PUT"):
        if not case_id:
            return build_api_response(400, {"error": "MISSING_CASE_ID", "message": "caseId is required for update"})
        return handle_update_case(event, case_id)
    elif http_method == "DELETE":
        if not case_id:
            return build_api_response(400, {"error": "MISSING_CASE_ID", "message": "caseId is required for delete"})
        return handle_delete_case(event, case_id)
    else:
        return build_api_response(405, {
            "error": "METHOD_NOT_ALLOWED",
            "message": f"Method {http_method} is not supported on this endpoint"
        })
