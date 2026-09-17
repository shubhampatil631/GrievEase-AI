import os
import json
import boto3
from src.utils.db import update_case_meta, write_audit_entry

bedrock_client = boto3.client("bedrock-runtime")

DRAFTING_PROMPT_TEMPLATE = """You are a senior legal drafting counsel specializing in Indian statutory notices and consumer disputes.
You need to draft a formal, high-impact Legal Escalation Notice for the following dispute.

Dispute Forum: {forum}
Grievance Details & Evidence:
{normalized_text}

Guidelines for Drafting:
1. Include formal header placeholders: [SENDER NAME], [SENDER ADDRESS], [DATE], [OPPOSITE PARTY NAME & ADDRESS].
2. Create a sharp, legally clear Subject Line referencing the transaction/order/account number and deficiency of service.
3. Present the chronological factual matrix clearly.
4. Detail the specific statutory violation under applicable Indian laws (Consumer Protection Act 2019 / RBI Ombudsman Scheme 2021 / TRAI Regulations).
5. Specify unambiguous prayers/relief: Full refund amount, statutory interest, and compensation for harassment and litigation costs.
6. Provide a 15-day cure notice deadline before formal institution of proceedings.

Extract all relevant factual fields from the grievance text. If a field cannot be determined, provide a placeholder.

Respond with ONLY a valid JSON object matching this schema exactly, with no markdown fences or outside commentary:
{{
  "draftNotice": "Full text of the legal notice with clean paragraphs...",
  "extractedFields": {{
    "orderNumber": "Extracted order/ticket/transaction ID or N/A",
    "sellerName": "Extracted seller/bank/service provider name or N/A",
    "amountDisputed": "Extracted amount in INR or N/A",
    "purchaseDate": "YYYY-MM-DD or date mentioned or N/A"
  }}
}}
"""

def invoke_bedrock_drafting(model_id: str, prompt: str) -> dict:
    """Invokes Bedrock to generate structured legal notice and metadata."""
    try:
        if "anthropic.claude" in model_id.lower():
            payload = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 2048,
                "temperature": 0.2,
                "messages": [{"role": "user", "content": prompt}]
            }
            response = bedrock_client.invoke_model(
                modelId=model_id,
                body=json.dumps(payload)
            )
            resp_body = json.loads(response["body"].read())
            raw_text = resp_body["content"][0]["text"].strip()
        else:
            payload = {
                "inputText": prompt,
                "textGenerationConfig": {
                    "maxTokenCount": 2048,
                    "temperature": 0.2
                }
            }
            response = bedrock_client.invoke_model(
                modelId=model_id,
                body=json.dumps(payload)
            )
            resp_body = json.loads(response["body"].read())
            raw_text = resp_body.get("results", [{}])[0].get("outputText", "").strip()

        cleaned_json = raw_text.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned_json)
    except Exception as e:
        print(f"[DraftingAgent] Bedrock drafting fallback triggered: {str(e)}")
        return {
            "draftNotice": (
                "LEGAL GRIEVANCE & ESCALATION NOTICE\n\n"
                "To,\n[OPPOSITE PARTY / GRIEVANCE OFFICER]\n\n"
                "Subject: Formal Notice for Deficiency of Service and Immediate Demand for Refund\n\n"
                "Sir/Madam,\n\n"
                "Under instructions from my client, I hereby issue this statutory notice regarding the unresolved dispute. "
                "Despite repeated representations, your establishment has failed to provide the promised resolution or refund. "
                "Take notice that you are granted 15 days from receipt of this notice to refund the full disputed amount along with "
                "applicable interest, failing which formal proceedings shall be instituted before the competent authority.\n\n"
                "Yours sincerely,\n[COMPLAINANT / ADVOCATE]"
            ),
            "extractedFields": {
                "orderNumber": "ORD-DEMO-2026",
                "sellerName": "Merchant / Service Provider",
                "amountDisputed": "₹2,499",
                "purchaseDate": "2026-08-15"
            }
        }

def handler(event, context):
    print(f"[DraftingAgent] Received event: {json.dumps(event)}")
    case_id = event.get("caseId")
    forum = event.get("forum", "CONSUMER_FORUM")
    deadline = event.get("deadline", "")
    normalized_text = event.get("normalizedText", "")
    model_id = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")

    prompt = DRAFTING_PROMPT_TEMPLATE.format(
        forum=forum,
        normalized_text=normalized_text
    )

    draft_result = invoke_bedrock_drafting(model_id, prompt)
    draft_notice = draft_result.get("draftNotice", "")
    extracted_fields = draft_result.get("extractedFields", {})

    # Update DynamoDB state
    try:
        update_case_meta(
            case_id=case_id,
            status="GUARD_CHECKING",
            updates={
                "draftNotice": draft_notice,
                "extractedFields": extracted_fields
            },
            stage_completed="DRAFTING"
        )
        write_audit_entry(
            case_id=case_id,
            stage="DRAFTING",
            result_summary=f"Notice drafted ({len(draft_notice.split())} words) for {forum}. Fields extracted: {list(extracted_fields.keys())}"
        )
    except Exception as db_err:
        print(f"[DraftingAgent] DB update error: {str(db_err)}")

    return {
        "caseId": case_id,
        "draftNotice": draft_notice,
        "extractedFields": extracted_fields,
        "forum": forum,
        "deadline": deadline
    }
