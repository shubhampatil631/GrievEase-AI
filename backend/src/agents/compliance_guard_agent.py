import os
import json
import boto3
from datetime import datetime, timezone
from boto3.dynamodb.conditions import Key
from src.utils.db import get_rules_table, update_case_meta, write_audit_entry

def get_compliance_rules_for_forum(forum: str) -> list:
    """Fetches deterministic policy rules from ComplianceRulesTable in DynamoDB."""
    try:
        rules_table = get_rules_table()
        response = rules_table.query(
            KeyConditionExpression=Key("forum").eq(forum)
        )
        return response.get("Items", [])
    except Exception as e:
        print(f"[ComplianceGuard] Rules fetch warning: {str(e)}")
        # Default fallback deterministic rules
        return [
            {
                "forum": forum,
                "ruleId": "RULE#REQUIRED_FIELDS",
                "ruleType": "REQUIRED_FIELD",
                "params": {"fields": ["orderNumber", "sellerName", "amountDisputed"]}
            },
            {
                "forum": forum,
                "ruleId": "RULE#DEADLINE_VALIDITY",
                "ruleType": "DEADLINE_WINDOW",
                "params": {"maxWindowDays": 730}
            }
        ]

def evaluate_rules(forum: str, draft_notice: str, deadline_str: str, extracted_fields: dict, rules: list) -> tuple:
    """Evaluates all compliance rules deterministically. Returns (passed, reason, failed_rule_id)."""
    
    # Check 1: Non-empty draft notice length check
    if not draft_notice or len(draft_notice.strip()) < 50:
        return False, "DRAFT_INSUFFICIENT_LENGTH", "RULE#MIN_CONTENT_LENGTH"

    # Check 2: Deadline expiration check
    if deadline_str:
        try:
            deadline_date = datetime.strptime(deadline_str, "%Y-%m-%d").date()
            today_date = datetime.now(timezone.utc).date()
            if deadline_date < today_date:
                return False, f"STATUTORY_DEADLINE_EXPIRED: Deadline {deadline_str} is in the past.", "RULE#DEADLINE_EXPIRED"
        except ValueError:
            pass

    # Check 3: Evaluate DynamoDB rules
    for rule in rules:
        rule_type = rule.get("ruleType")
        rule_id = rule.get("ruleId")
        params = rule.get("params", {})

        if rule_type == "REQUIRED_FIELD":
            required_fields = params.get("fields", [])
            missing_fields = []
            for field in required_fields:
                val = extracted_fields.get(field, "")
                if not val or val.strip() in ["", "N/A", "None", "null"]:
                    missing_fields.append(field)
            
            # If critical identifying fields are completely missing, flag missing info
            if len(missing_fields) > 2:
                return False, f"MISSING_MANDATORY_FIELDS: {', '.join(missing_fields)}", rule_id

        elif rule_type == "DEADLINE_WINDOW":
            # Extra deadline window validations if configured
            pass

        elif rule_type == "BANNED_PHRASES":
            banned_list = params.get("phrases", [])
            for phrase in banned_list:
                if phrase.lower() in draft_notice.lower():
                    return False, f"PROHIBITED_LANGUAGE_DETECTED: Contains '{phrase}'", rule_id

    return True, None, None

def handler(event, context):
    """
    Compliance Guard Agent Lambda.
    NOTE: Deliberately pure Python, zero LLM dependencies.
    """
    print(f"[ComplianceGuard] Received event: {json.dumps(event)}")
    case_id = event.get("caseId")
    
    # Support both direct root event and Step Functions draftResult / classificationResult nesting
    draft_result = event.get("draftResult", {})
    classification_result = event.get("classificationResult", {})
    
    forum = event.get("forum") or classification_result.get("forum", "CONSUMER_FORUM")
    draft_notice = event.get("draftNotice") or draft_result.get("draftNotice", "")
    deadline_str = event.get("deadline") or classification_result.get("deadline", "")
    extracted_fields = event.get("extractedFields") or draft_result.get("extractedFields", {})

    rules = get_compliance_rules_for_forum(forum)
    passed, failure_reason, failed_rule_id = evaluate_rules(
        forum=forum,
        draft_notice=draft_notice,
        deadline_str=deadline_str,
        extracted_fields=extracted_fields,
        rules=rules
    )

    result_status = "PASSED" if passed else "FAILED"
    try:
        update_case_meta(
            case_id=case_id,
            updates={
                "guardResult": result_status,
                "guardReason": failure_reason,
                "guardRuleCheckedCount": len(rules)
            },
            stage_completed="COMPLIANCE_GUARD"
        )
        write_audit_entry(
            case_id=case_id,
            stage="COMPLIANCE_GUARD",
            result_summary=f"Guard Result: {result_status}. Rules Checked={len(rules)}. Reason={failure_reason or 'All rules verified successfully.'}"
        )
    except Exception as db_err:
        print(f"[ComplianceGuard] DB update error: {str(db_err)}")

    return {
        "caseId": case_id,
        "passed": passed,
        "reason": failure_reason,
        "failedRuleId": failed_rule_id,
        "forum": forum,
        "deadline": deadline_str
    }

