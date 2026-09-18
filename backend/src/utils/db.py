import os
import json
import boto3
from datetime import datetime, timezone
from decimal import Decimal

# Decimal encoder helper for DynamoDB JSON serialization
class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            if o % 1 == 0:
                return int(o)
            return float(o)
        return super(DecimalEncoder, self).default(o)

def get_current_iso_time() -> str:
    return datetime.now(timezone.utc).isoformat()

def get_dynamo_resource():
    return boto3.resource("dynamodb")

def get_cases_table():
    table_name = os.environ.get("TABLE_NAME", "GrievEaseTable")
    dynamo = get_dynamo_resource()
    return dynamo.Table(table_name)

def get_rules_table():
    rules_table_name = os.environ.get("RULES_TABLE_NAME", "ComplianceRulesTable")
    dynamo = get_dynamo_resource()
    return dynamo.Table(rules_table_name)

def write_audit_entry(case_id: str, stage: str, result_summary: str):
    """Writes an immutable chronological audit trail item for a stage execution."""
    table = get_cases_table()
    now_iso = get_current_iso_time()
    item = {
        "PK": f"CASE#{case_id}",
        "SK": f"STATUS#{now_iso}",
        "stage": stage,
        "result": result_summary,
        "timestamp": now_iso
    }
    table.put_item(Item=item)
    return item

def update_case_meta(case_id: str, status: str = None, updates: dict = None, stage_completed: str = None):
    """Updates the main META item of a case."""
    table = get_cases_table()
    now_iso = get_current_iso_time()
    
    update_expr = ["#updatedAt = :updatedAt"]
    expr_names = {"#updatedAt": "updatedAt"}
    expr_values = {":updatedAt": now_iso}

    if status:
        update_expr.append("#status = :status")
        update_expr.append("#gsi2pk = :gsi2pk")
        update_expr.append("#gsi2sk = :gsi2sk")
        expr_names["#status"] = "status"
        expr_names["#gsi2pk"] = "GSI2PK"
        expr_names["#gsi2sk"] = "GSI2SK"
        expr_values[":status"] = status
        expr_values[":gsi2pk"] = f"STATUS#{status}"
        expr_values[":gsi2sk"] = f"CASE#{now_iso}"

    if updates:
        for idx, (k, v) in enumerate(updates.items()):
            field_alias = f"#field_{idx}"
            val_alias = f":val_{idx}"
            expr_names[field_alias] = k
            # DynamoDB requires Decimal instead of float
            if isinstance(v, float):
                v = Decimal(str(v))
            expr_values[val_alias] = v
            update_expr.append(f"{field_alias} = {val_alias}")

    if stage_completed:
        update_expr.append("#stagesCompleted = list_append(if_not_exists(#stagesCompleted, :empty_list), :new_stage)")
        expr_names["#stagesCompleted"] = "stagesCompleted"
        expr_values[":empty_list"] = []
        expr_values[":new_stage"] = [stage_completed]

    full_update_expr = "SET " + ", ".join(update_expr)

    table.update_item(
        Key={"PK": f"CASE#{case_id}", "SK": "META"},
        UpdateExpression=full_update_expr,
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values
    )

def build_api_response(status_code: int, body: dict, headers: dict = None) -> dict:
    default_headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
    }
    if headers:
        default_headers.update(headers)
        
    return {
        "statusCode": status_code,
        "headers": default_headers,
        "body": json.dumps(body, cls=DecimalEncoder)
    }

def get_user_id_from_event(event: dict) -> str:
    """Extracts Cognito User ID (sub or username) from requestContext or falls back to demo user."""
    try:
        claims = event.get("requestContext", {}).get("authorizer", {}).get("jwt", {}).get("claims", {})
        if not claims:
            claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        user_id = claims.get("sub") or claims.get("username")
        if user_id:
            return user_id
    except Exception:
        pass
    return "demo_user_bharat"
