import os
import json
import uuid
import boto3
from boto3.dynamodb.conditions import Key
from src.utils.db import (
    get_cases_table,
    build_api_response,
    get_current_iso_time,
    get_user_id_from_event,
    write_audit_entry
)

sfn_client = boto3.client("stepfunctions")

def handle_create_case(event):
    """POST /cases — Initializes case in DynamoDB and triggers Step Functions."""
    try:
        body = json.loads(event.get("body", "{}"))
    except Exception:
        return build_api_response(400, {"error": "INVALID_JSON", "message": "Request body must be valid JSON"})

    s3_key = body.get("s3Key", "")
    complaint_text = body.get("complaintText", "")
    category = body.get("category", "ECOMMERCE")

    if not s3_key and not complaint_text:
        return build_api_response(422, {
            "error": "MISSING_EVIDENCE_OR_TEXT",
            "message": "Please provide an uploaded s3Key or complaintText"
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
        "s3Key": s3_key,
        "complaintText": complaint_text,
        "stagesCompleted": [],
        "createdAt": now_iso,
        "updatedAt": now_iso
    }

    try:
        table.put_item(Item=meta_item)
        write_audit_entry(
            case_id=case_id,
            stage="CASE_CREATED",
            result_summary=f"Case initialized by user {user_id}. Category: {category}"
        )
    except Exception as e:
        print(f"[CasesHandler] DynamoDB put error: {str(e)}")
        return build_api_response(500, {"error": "DB_ERROR", "message": str(e)})

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
                "category": category
            }
            sfn_response = sfn_client.start_execution(
                stateMachineArn=state_machine_arn,
                name=f"exec-{case_id}-{uuid.uuid4().hex[:4]}",
                input=json.dumps(sfn_input)
            )
            execution_arn = sfn_response.get("executionArn", "")
        except Exception as e:
            print(f"[CasesHandler] Step Functions start error: {str(e)}")

    return build_api_response(202, {
        "caseId": case_id,
        "status": "PROCESSING",
        "executionArn": execution_arn,
        "createdAt": now_iso
    })

def handle_get_case_by_id(event, case_id: str):
    """GET /cases/{caseId} — Returns case status, progress, draft, and audit trail."""
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
            KeyConditionExpression=Key("PK").eq(f"CASE#{case_id}") & Key("SK").begins_with("STATUS#")
        )
        audit_trail = history_response.get("Items", [])

        item["auditTrail"] = audit_trail
        return build_api_response(200, item)
    except Exception as e:
        print(f"[CasesHandler] Get case error: {str(e)}")
        return build_api_response(500, {"error": "DB_ERROR", "message": str(e)})

def handle_list_cases(event):
    """GET /cases — Lists all cases for the authenticated user via GSI1."""
    user_id = get_user_id_from_event(event)
    table = get_cases_table()
    try:
        response = table.query(
            IndexName="UserCasesIndex",
            KeyConditionExpression=Key("GSI1PK").eq(f"USER#{user_id}"),
            ScanIndexForward=False  # Newest cases first
        )
        cases = response.get("Items", [])
        return build_api_response(200, {
            "cases": cases,
            "count": len(cases),
            "userId": user_id
        })
    except Exception as e:
        print(f"[CasesHandler] List cases error: {str(e)}")
        return build_api_response(500, {"error": "DB_ERROR", "message": str(e)})

def handler(event, context):
    print(f"[CasesHandler] Event: {json.dumps(event)}")
    http_method = event.get("requestContext", {}).get("http", {}).get("method") or event.get("httpMethod", "GET")
    path_parameters = event.get("pathParameters") or {}
    case_id = path_parameters.get("caseId")

    if http_method == "POST":
        return handle_create_case(event)
    elif http_method == "GET":
        if case_id:
            return handle_get_case_by_id(event, case_id)
        return handle_list_cases(event)
    else:
        return build_api_response(405, {"error": "METHOD_NOT_ALLOWED"})
