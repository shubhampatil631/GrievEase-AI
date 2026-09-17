import os
import json
import boto3

ses_client = boto3.client("ses")

def handler(event, context):
    """
    Triggered by EventBridge rule when a case reaches READY.
    Sends or logs a statutory deadline reminder notification.
    """
    print(f"[ReminderHandler] Received EventBridge Event: {json.dumps(event)}")
    detail = event.get("detail", {})
    case_id = detail.get("caseId", "unknown")
    forum = detail.get("forum", "Consumer Commission")
    deadline = detail.get("deadline", "within statutory period")
    user_email = detail.get("email", os.environ.get("SENDER_EMAIL", "demo@grievease.ai"))

    sender_email = os.environ.get("SENDER_EMAIL", "notifications@grievease.ai")

    subject = f"GrievEase AI: Statutory Filing Notice for Case {case_id}"
    body_text = (
        f"Hello,\n\n"
        f"Your grievance escalation case {case_id} has been processed.\n"
        f"Designated Regulatory Forum: {forum}\n"
        f"Statutory Filing Deadline: {deadline}\n\n"
        f"Your formal legal escalation notice has been drafted and validated. "
        f"Please review and submit your notice before the deadline to protect your statutory rights.\n\n"
        f"Access your dashboard: https://grievease.ai/cases/{case_id}\n\n"
        f"Best regards,\nGrievEase AI Autonomous Agent Engine"
    )

    try:
        if sender_email and user_email:
            ses_client.send_email(
                Source=sender_email,
                Destination={"ToAddresses": [user_email]},
                Message={
                    "Subject": {"Data": subject},
                    "Body": {"Text": {"Data": body_text}}
                }
            )
            print(f"[ReminderHandler] Sent SES reminder email to {user_email}")
    except Exception as e:
        print(f"[ReminderHandler] SES notification simulated/warning: {str(e)}")

    return {"status": "SUCCESS", "caseId": case_id}
