import os
import json
import re
from datetime import datetime, timezone
import boto3
from src.utils.db import update_case_meta, write_audit_entry

bedrock_client = boto3.client("bedrock-runtime")

DRAFTING_PROMPT_TEMPLATE = """You are a senior legal drafting counsel specializing in Indian statutory notices and consumer disputes.
You need to draft a formal, high-impact Legal Escalation Notice for the following dispute.

Current Date: {current_date}
Dispute Forum: {forum}
Grievance Details & Evidence:
{normalized_text}

CRITICAL FACTUAL GROUNDING & ANTI-HALLUCINATION RULES:
1. STRICT GROUNDING: You must ONLY use facts, amounts, dates, and names explicitly mentioned in the "Grievance Details & Evidence" above.
2. NEVER FABRICATE OR INVENT missing information. Do NOT make up fake order numbers, account numbers, UTR transaction reference numbers, dates, or amounts.
3. EXPLICIT PLACEHOLDERS: If any specific identifying detail is NOT provided in the input text, you MUST use an explicit uppercase placeholder, such as:
   - Account / UPI Reference: "[ACCOUNT / UPI REFERENCE NOT PROVIDED]"
   - Order / Docket ID: "[ORDER / TICKET NUMBER NOT PROVIDED]"
   - Disputed Amount: "[AMOUNT AS STATED IN COMPLAINT]" or the exact extracted amount
   - Incident Date: "[TRANSACTION DATE NOT SPECIFIED]" or the exact extracted date
   - Merchant / Bank: "[OPPOSITE PARTY / BANK NAME]" or the exact extracted name
4. INTERNAL CONSISTENCY: The Factual Matrix, Deficiency of Service, Statutory Grounds, and Prayer sections MUST strictly agree with each other and never contradict the extracted fields.

Guidelines for Notice Structure:
1. Include formal header placeholders: [SENDER NAME], [SENDER ADDRESS], Date: {current_date}, [OPPOSITE PARTY NAME & ADDRESS].
2. Create a sharp, legally clear Subject Line referencing the transaction/account reference and deficiency of service.
3. Present the chronological factual matrix clearly using ONLY the real facts or explicit placeholders.
4. Detail the specific statutory violation under applicable Indian laws (Consumer Protection Act 2019 / RBI Ombudsman Scheme 2021 / TRAI Regulations).
5. Specify unambiguous prayers/relief: Full refund amount of the principal disputed consideration, statutory interest, and compensation for harassment and litigation costs.
6. Provide a mandatory 15-day cure notice deadline before formal institution of proceedings.

Extract all relevant factual fields from the grievance text. If a field cannot be determined, provide a placeholder.

Respond with ONLY a valid JSON object matching this schema exactly, with no markdown fences or outside commentary:
{{
  "draftNotice": "Full text of the legal notice with clean paragraphs...",
  "extractedFields": {{
    "orderNumber": "Extracted order/ticket/transaction/UPI ID or [NOT PROVIDED]",
    "sellerName": "Extracted seller/bank/service provider name or [NOT PROVIDED]",
    "amountDisputed": "Extracted amount in INR (e.g. ₹4,500) or [NOT PROVIDED]",
    "purchaseDate": "YYYY-MM-DD or date mentioned or [NOT PROVIDED]"
  }}
}}
"""

def extract_fallback_fields_from_text(text: str) -> dict:
    """Deterministic regex extraction to populate fallback fields without hallucinating."""
    # Extract amount (e.g., ₹4,500, Rs. 4500, INR 4,500, 5000 inr, 5000/-)
    amt_match = re.search(r'(?:₹|Rs\.?|INR)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?|\d+)|\b([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?|\d+)\s*(?:₹|Rs\.?|INR|/-\b)', text, re.IGNORECASE)
    if amt_match:
        val = amt_match.group(1) or amt_match.group(2)
        amount = f"₹{val}"
    else:
        amount = "[NOT PROVIDED]"

    # Extract date patterns (e.g. 15 Aug 2026, 04-Aug-2026, 12-Jul-2026, 15/08/2026, 2026-08-15)
    date_match = re.search(r'(\d{1,2}(?:st|nd|rd|th)?[\s\-]+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-]+\d{4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})', text, re.IGNORECASE)
    date_str = date_match.group(1) if date_match else "[NOT PROVIDED]"

    # Extract order / UTR / Docket / Invoice / A/c / PNR / Policy / Consumer No refs if present
    order_match = re.search(r'(?:Order\s*#?|Ticket\s*#?|Docket\s*#?|UTR[-:\s]*|A/c\s*#?|Ref\s*#?|Invoice\s*#?|PNR\s*#?|Policy\s*#?|Consumer\s*No\s*#?|Txn\s*(?:id|#)?)\s*[:\-]?\s*([A-Za-z0-9\-_]+)', text, re.IGNORECASE)
    order_num = order_match.group(0) if order_match else "[NOT PROVIDED]"

    # Dynamic seller / entity recognition across consumer sectors (100% dynamic, zero hardcoded brands)
    seller = "[OPPOSITE PARTY NAME NOT PROVIDED]"
    
    # Strategy A: Match registered corporate suffix in text lines
    corp_match = re.search(r'\b([A-Z0-9\s&.\-']{3,50}(?:PVT\s*LTD|PRIVATE\s*LIMITED|LIMITED|LTD|BANK|COMMUNICATIONS|ENTERPRISES|TECHNOLOGIES|RETAIL|SERVICES|CORPORATION|AIRLINES|HOSPITAL|INSURANCE|DISCOM))\b', text, re.IGNORECASE)
    if corp_match:
        seller = re.sub(r'\s{2,}', ' ', corp_match.group(1).strip())
    else:
        # Strategy B: Match labelled Vendor / Merchant / Seller / Bank fields
        label_match = re.search(r'(?:Seller|Vendor|Merchant|Issued\s*By|Billed\s*By|Bank\s*Name|Company\s*Name)\s*[:\-]\s*([A-Za-z0-9\s&.\-']{3,40})', text, re.IGNORECASE)
        if label_match:
            seller = label_match.group(1).strip()

    return {
        "orderNumber": order_num,
        "sellerName": seller,
        "amountDisputed": amount,
        "purchaseDate": date_str
    }


def invoke_groq_drafting_fallback(prompt: str) -> dict:
    """Invokes Groq LLM (qwen/qwen3.8-27b) for legal notice drafting fallback."""
    groq_key = os.environ.get("GROQ_API_KEY", "")
    if not groq_key:
        raise ValueError("GROQ_API_KEY is not set")
    import urllib.request
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_key}",
        "Content-Type": "application/json",
        "User-Agent": "GrievEase-AI/1.0"
    }
    data = {
        "model": "qwen/qwen3.8-27b",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
        "max_tokens": 2048
    }
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers)
    with urllib.request.urlopen(req, timeout=15) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        raw_text = res["choices"][0]["message"]["content"].strip()
        cleaned_json = re.sub(r"```(?:json)?", "", raw_text).strip()
        return json.loads(cleaned_json)

def invoke_bedrock_drafting(model_id: str, prompt: str, normalized_text: str = "", forum: str = "CONSUMER_FORUM") -> dict:
    """Invokes Bedrock to generate structured legal notice and metadata, falling back to Groq."""
    try:
        if "anthropic.claude" in model_id.lower():
            payload = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 2048,
                "temperature": 0.1,
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
                    "temperature": 0.1
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
        # Try Tier 2 Live Groq Fallback
        try:
            print("[DraftingAgent] Attempting live Groq legal drafting fallback (qwen/qwen3.8-27b)...")
            return invoke_groq_drafting_fallback(prompt)
        except Exception as groq_err:
            print(f"[DraftingAgent] Groq drafting fallback failed: {str(groq_err)}. Using deterministic template.")
            extracted = extract_fallback_fields_from_text(normalized_text)
            current_date = datetime.now(timezone.utc).strftime("%d %B %Y")
            
            statutory_act = (
                "Reserve Bank - Integrated Ombudsman Scheme, 2021" if forum == "RBI_OMBUDSMAN"
                else "TRAI Telecom Consumers Complaint Redressal Regulations" if forum == "TRAI"
                else "Consumer Protection Act, 2019"
            )

            recipient_title = (
                f"The Principal Nodal Officer,\n{extracted['sellerName']}" if forum == "BANKING" or forum == "RBI_OMBUDSMAN"
                else f"The Appellate Authority,\n{extracted['sellerName']}" if forum == "TRAI"
                else f"{extracted['sellerName']}\n[Grievance Redressal Cell / Nodal Officer]"
            )

            return {
                "draftNotice": (
                    f"LEGAL GRIEVANCE & STATUTORY ESCALATION NOTICE\n"
                    f"Under the Provisions of {statutory_act}\n\n"
                    f"Date: {current_date}\n\n"
                    f"To,\n{recipient_title}\n[REGISTERED OFFICE ADDRESS]\n\n"
                    f"SUBJECT: FORMAL STATUTORY NOTICE DEMANDING IMMEDIATE REFUND AND RESOLUTION FOR DEFICIENCY OF SERVICE\n\n"
                    f"Sir/Madam,\n\n"
                    f"Under instructions from my client, I hereby issue this statutory notice setting forth the following material facts:\n\n"
                    f"1. FACTUAL MATRIX & TRANSACTION DETAILS:\n"
                    f"   - Reference ID: {extracted['orderNumber']}\n"
                    f"   - Disputed Amount: {extracted['amountDisputed']}\n"
                    f"   - Transaction Date: {extracted['purchaseDate']}\n\n"
                    f"2. DEFICIENCY OF SERVICE:\n"
                    f"   {normalized_text}\n\n"
                    f"3. STATUTORY GROUNDS & RELIEF SOUGHT:\n"
                    f"   The failure to resolve the dispute or process the refund constitutes an actionable deficiency of service under applicable law.\n"
                    f"   (a) Immediate refund/reversal of the disputed amount {extracted['amountDisputed']}.\n"
                    f"   (b) Statutory interest along with compensation for harassment.\n\n"
                    f"Take notice that you are granted FIFTEEN (15) DAYS from receipt of this notice to resolve the issue, failing which legal proceedings shall be initiated.\n\n"
                    f"Yours sincerely,\n[COMPLAINANT / ADVOCATE FOR COMPLAINANT]"
                ),
                "extractedFields": extracted
            }

def handler(event, context):
    print(f"[DraftingAgent] Received event: {json.dumps(event)}")
    case_id = event.get("caseId")
    
    # Support both direct root event and Step Functions intakeResult / classificationResult nesting
    intake_result = event.get("intakeResult", {})
    classification_result = event.get("classificationResult", {})
    
    normalized_text = event.get("normalizedText") or intake_result.get("normalizedText") or event.get("complaintText", "")
    forum = event.get("forum") or classification_result.get("forum", "CONSUMER_FORUM")
    deadline = event.get("deadline") or classification_result.get("deadline", "")
    model_id = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")
    current_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    prompt = DRAFTING_PROMPT_TEMPLATE.format(
        current_date=current_date,
        forum=forum,
        normalized_text=normalized_text
    )

    draft_result = invoke_bedrock_drafting(model_id, prompt, normalized_text, forum)
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

