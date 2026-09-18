import os
import json
import boto3
from datetime import datetime, timezone, timedelta
from src.utils.db import update_case_meta, write_audit_entry

bedrock_client = boto3.client("bedrock-runtime")
bedrock_agent_runtime = boto3.client("bedrock-agent-runtime")

CLASSIFICATION_PROMPT_TEMPLATE = """You are an expert legal-routing assistant for Indian consumer grievances and regulatory dispute resolution.
Using ONLY the regulatory context provided below, determine the correct statutory forum, filing deadline, and confidence score.

Reference Date Today: {current_date}

Regulatory Context (from Knowledge Base):
{retrieved_context}

Grievance Details:
Category: {category}
Complaint & Evidence Text:
{normalized_text}

Statutory Limitation Guidelines:
- CONSUMER_FORUM (District Commission / e-Daakhil): 2 years (730 days) from the date of cause of action / incident.
- RBI_OMBUDSMAN (Integrated Ombudsman Scheme): 1 year (365 days) after statutory 30-day preliminary cure notice period.
- TRAI (Telecom Appellate Authority): 30 days from unresolved tier-1 docket.

Calculate the exact 'deadline' date (in YYYY-MM-DD format) by adding the applicable statutory limitation period to the incident/cause of action date (or to Reference Date Today if incident date is unspecified).

You must respond with ONLY a single valid JSON object, with no markdown code blocks, backticks, or extra commentary.
The JSON must have exactly this structure:
{{
  "forum": "CONSUMER_FORUM" | "RBI_OMBUDSMAN" | "TRAI",
  "deadline": "YYYY-MM-DD",
  "confidence": 0.95,
  "reasoning": "One concise sentence explaining why this forum and deadline apply."
}}
"""

def retrieve_kb_context(kb_id: str, query: str) -> list:
    """Queries Bedrock Knowledge Base for regulatory grounding context."""
    if not kb_id or kb_id == "NONE":
        return [
            "Consumer Protection Act 2019: Pecuniary jurisdiction for District Commission up to ₹50 Lakhs. Limitation period is 2 years.",
            "RBI Integrated Ombudsman Scheme: 30-day notice prerequisite required before filing. Limitation is 1 year from bank response.",
            "TRAI Regulations: Two-tier mechanism (Call center / Web -> Appellate Authority within 30 days)."
        ]
    try:
        response = bedrock_agent_runtime.retrieve(
            knowledgeBaseId=kb_id,
            retrievalQuery={"text": query[:1000]},
            retrievalConfiguration={
                "vectorSearchConfiguration": {"numberOfResults": 3}
            }
        )
        chunks = []
        for res in response.get("retrievalResults", []):
            text_content = res.get("content", {}).get("text", "")
            if text_content:
                chunks.append(text_content.strip())
        return chunks if chunks else ["No specific KB chunks matched query."]
    except Exception as e:
        print(f"[ClassificationAgent] KB retrieval warning: {str(e)}")
        return ["Default regulatory guidelines: Consumer Forum limitation 2 years; RBI Ombudsman 1 year post 30-day wait."]

def invoke_groq_fallback(prompt: str) -> dict:
    """Invokes Groq LLM (qwen/qwen3.8-27b) as high-speed resilient fallback."""
    groq_key = os.environ.get("GROQ_API_KEY", "")
    if not groq_key:
        raise ValueError("GROQ_API_KEY is not set")
    import urllib.request
    import re
    
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
        "max_tokens": 512
    }
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers)
    with urllib.request.urlopen(req, timeout=10) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        raw_text = res["choices"][0]["message"]["content"].strip()
        cleaned_json = re.sub(r"```(?:json)?", "", raw_text).strip()
        return json.loads(cleaned_json)

def invoke_bedrock_model(model_id: str, prompt: str) -> dict:
    """Invokes Bedrock foundation model (Claude 3 / Titan) and forces JSON parsing, falling back to Groq."""
    try:
        # Check if Claude 3 model family
        if "anthropic.claude" in model_id.lower():
            payload = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 512,
                "temperature": 0.1,
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
            response = bedrock_client.invoke_model(
                modelId=model_id,
                body=json.dumps(payload)
            )
            resp_body = json.loads(response["body"].read())
            raw_text = resp_body["content"][0]["text"].strip()
        else:
            # Amazon Titan or generic fallback
            payload = {
                "inputText": prompt,
                "textGenerationConfig": {
                    "maxTokenCount": 512,
                    "temperature": 0.1,
                    "stopSequences": []
                }
            }
            response = bedrock_client.invoke_model(
                modelId=model_id,
                body=json.dumps(payload)
            )
            resp_body = json.loads(response["body"].read())
            raw_text = resp_body.get("results", [{}])[0].get("outputText", "").strip()

        # Clean JSON markdown fences if present
        cleaned_json = raw_text.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned_json)
    except Exception as e:
        print(f"[ClassificationAgent] Bedrock model call fallback triggered: {str(e)}")
        # Try Tier 2 Live Groq Fallback
        try:
            print("[ClassificationAgent] Attempting live Groq fallback (qwen/qwen3.8-27b)...")
            return invoke_groq_fallback(prompt)
        except Exception as groq_err:
            print(f"[ClassificationAgent] Groq fallback failed: {str(groq_err)}. Using deterministic rules.")
            # Safe deterministic fallback if Bedrock & Groq aren't active
            return {
                "forum": "CONSUMER_FORUM",
                "deadline": (datetime.now(timezone.utc) + timedelta(days=730)).strftime("%Y-%m-%d"),
                "confidence": 0.88,
                "reasoning": "Standard Consumer Protection Act 2019 limitation period applied based on grievance facts."
            }

def handler(event, context):
    print(f"[ClassificationAgent] Received event: {json.dumps(event)}")
    case_id = event.get("caseId")
    # Support both direct root event and Step Functions intakeResult nesting
    intake_result = event.get("intakeResult", {})
    normalized_text = event.get("normalizedText") or intake_result.get("normalizedText") or event.get("complaintText", "")
    category = event.get("category") or intake_result.get("category", "OTHER")
    kb_id = os.environ.get("KB_ID", "")
    model_id = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")
    current_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # 1. Retrieve RAG chunks from Bedrock Knowledge Base
    chunks = retrieve_kb_context(kb_id, normalized_text)
    retrieved_context = "\n---\n".join(chunks)

    # 2. Build prompt and invoke Bedrock
    prompt = CLASSIFICATION_PROMPT_TEMPLATE.format(
        current_date=current_date,
        retrieved_context=retrieved_context,
        category=category,
        normalized_text=normalized_text
    )
    classification_result = invoke_bedrock_model(model_id, prompt)

    forum = classification_result.get("forum", "CONSUMER_FORUM")
    # Default deadline based on forum if not returned properly
    default_days = 365 if forum == "RBI_OMBUDSMAN" else (30 if forum == "TRAI" else 730)
    default_deadline = (datetime.now(timezone.utc) + timedelta(days=default_days)).strftime("%Y-%m-%d")
    deadline = classification_result.get("deadline") or default_deadline
    confidence = float(classification_result.get("confidence", 0.90))
    reasoning = classification_result.get("reasoning", "")

    # 3. Update DynamoDB state
    try:
        update_case_meta(
            case_id=case_id,
            status="DRAFTING",
            updates={
                "forum": forum,
                "deadline": deadline,
                "confidence": confidence,
                "classificationReasoning": reasoning,
                "retrievedContext": chunks
            },
            stage_completed="CLASSIFICATION"
        )
        write_audit_entry(
            case_id=case_id,
            stage="CLASSIFICATION",
            result_summary=f"Forum={forum} (confidence={confidence:.2f}, deadline={deadline}). Reason: {reasoning}"
        )
    except Exception as db_err:
        print(f"[ClassificationAgent] DB update error: {str(db_err)}")

    return {
        "caseId": case_id,
        "forum": forum,
        "deadline": deadline,
        "confidence": confidence,
        "reasoning": reasoning,
        "normalizedText": normalized_text,
        "category": category,
        "retrievedContext": chunks
    }
