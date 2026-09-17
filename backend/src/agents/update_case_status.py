import os
import json
import boto3
from src.utils.db import update_case_meta, write_audit_entry, get_cases_table

eventbridge_client = boto3.client("events")

def publish_eventbridge_reminder_event(case_id: str, forum: str, deadline: str, user_id: str = "demo_user"):
    """Publishes a CaseReadyForReminder event to Amazon EventBridge."""
    event_bus_name = os.environ.get("EVENT_BUS_NAME", "default")
    try:
        detail_payload = {
            "caseId": case_id,
            "userId": user_id,
            "forum": forum,
            "deadline": deadline
        }
        eventbridge_client.put_events(
            Entries=[
                {
                    "Source": "grievease.cases",
                    "DetailType": "CaseReadyForReminder",
                    "Detail": json.dumps(detail_payload),
                    "EventBusName": event_bus_name
                }
            ]
        )
        print(f"[UpdateCaseStatus] EventBridge reminder event dispatched for case {case_id}")
    except Exception as e:
        print(f"[UpdateCaseStatus] EventBridge publish warning: {str(e)}")

def handler(event, context):
    print(f"[UpdateCaseStatus] Received event: {json.dumps(event)}")
    case_id = event.get("caseId")
    status = event.get("status", "READY")
    rejection_reason = event.get("rejectionReason")
    error_info = event.get("error")
    forum = event.get("forum", "")
    deadline = event.get("deadline", "")
    draft_notice = event.get("draftNotice", "")

    updates = {}
    if rejection_reason:
        updates["rejectionReason"] = rejection_reason
    if error_info:
        updates["pipelineError"] = str(error_info)
    if forum:
        updates["forum"] = forum
    if deadline:
        updates["deadline"] = deadline
    if draft_notice:
        updates["draftNotice"] = draft_notice

    try:
        update_case_meta(
            case_id=case_id,
            status=status,
            updates=updates
        )
        write_audit_entry(
            case_id=case_id,
            stage=f"PIPELINE_COMPLETE_{status}",
            result_summary=f"Case finalized with status={status}. Reason={rejection_reason or error_info or 'Pipeline completed successfully.'}"
        )

        if status == "READY":
            publish_eventbridge_reminder_event(
                case_id=case_id,
                forum=forum,
                deadline=deadline
            )
    except Exception as e:
        print(f"[UpdateCaseStatus] Failed to update final state in DB: {str(e)}")

    return {
        "caseId": case_id,
        "status": status,
        "updated": True
    }
