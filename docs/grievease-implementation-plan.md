# GrievEase AI — Execution-Ready Implementation Plan

---

## 0. How to Read This Document (Core Concepts First)

Before the specs, here's the mental model tying everything together — read this once, then each section below will make more sense as "the detail behind a piece of this picture" rather than a wall of JSON.

**The big idea:** a user submits a complaint → that triggers a *pipeline* of small, single-purpose programs (agents) that each do one job and pass their output to the next → the final result is saved and shown back to the user. Nothing runs on a server you manage; AWS runs each piece only when it's needed and you pay per execution.

**Key concepts you'll be working with, in plain terms:**

- **Lambda function** = a small piece of code that runs on-demand, does one job, and stops. Think of it as a function call that AWS hosts for you — no server to set up or keep running. Each of your 4 "agents" is just one Lambda function.
- **API Gateway** = the "front door." It's the URL your React app calls. It checks the user is logged in (via Cognito), then hands the request to the right Lambda.
- **Step Functions** = a flowchart-as-a-service. Instead of one Lambda calling the next Lambda directly in code (fragile, hard to see what's happening), you describe the flow ("do Intake, then Classification, then Drafting, then Guard, and if Guard fails go here instead") in a JSON format called **Amazon States Language (ASL)**, and AWS executes and visualizes that flowchart for you. This visual execution graph is also your best demo footage.
- **DynamoDB** = a fast key-value database. You don't design it like a spreadsheet with multiple tables joined together (that's traditional SQL). Instead you use "single-table design" — cram related things into one table and use clever keys to fetch what you need. Section 2 explains this properly.
- **Amazon Bedrock** = AWS's managed way to call a large language model (like Claude) without hosting the model yourself. You send a prompt, get a response.
- **Bedrock Knowledge Base** = Bedrock's built-in RAG (Retrieval-Augmented Generation) system. You upload your documents, Bedrock automatically chunks and embeds them, and at query time it retrieves the most relevant chunks so the model can answer using *your* facts instead of guessing. This is why your Classification Agent gives forum-specific, rule-grounded answers instead of hallucinating.
- **IAM roles/policies** = permission slips. Each Lambda gets its own narrow permission slip listing exactly what AWS services it's allowed to touch — nothing more. This is "least privilege," and it's also something judges and interviewers respect because it shows security awareness.
- **Cognito** = AWS's login system. It issues a token (JWT) when a user logs in; API Gateway checks that token on every request so you don't have to build your own authentication.
- **EventBridge** = a scheduler/event bus. "When X happens, do Y later" — you'll use it to schedule a deadline-reminder email.

**The order you should actually think in, step by step:**
1. Understand *what data* you're storing and *how it's shaped* (Section 2) — this is the foundation everything else reads/writes to.
2. Understand *the flow* the data moves through (Section 3) — this is the skeleton.
3. Understand *what each step in the flow actually does* (Section 4) — this is the muscle.
4. Understand *how the model gets grounded facts instead of guessing* (Section 5).
5. Understand *who's allowed to do what* (Section 6) — this is what keeps the system safe.
6. Understand *how the user actually talks to all of this* (Sections 1 and 7).
7. Understand *how it deploys as one unit* (Section 9).
8. Then Section 10 tells you literally what to type/build on which day.

Read the sections in that order once for understanding, even though they're numbered for reference afterward.

---

## 1. API Contract

**Theory — what an "API contract" is and why you write it first:** An API is just an agreed set of URLs your frontend can call, each with a fixed input shape and output shape. Writing this *before* writing backend code means your teammate can build the React frontend against these exact JSON shapes while you build the Lambdas — neither of you waits on the other. Every endpoint below has three things: the HTTP method+path (the "address"), what you must send, and what you get back, including what an error looks like so the frontend can handle failure gracefully instead of crashing.

Base URL: `https://{api-id}.execute-api.{region}.amazonaws.com`
All endpoints except `/health` require `Authorization: Bearer <Cognito JWT>` validated by an API Gateway Cognito authorizer.

### 1.1 `POST /uploads/presign`
**Auth:** required
**Purpose:** Issue a pre-signed S3 PUT URL so the browser uploads evidence directly to S3 (bypasses API Gateway's payload size limit).

Request:
```json
{
  "fileName": "bill_screenshot.jpg",
  "contentType": "image/jpeg"
}
```

Response `200`:
```json
{
  "uploadUrl": "https://evidence-bucket.s3.amazonaws.com/...&X-Amz-Signature=...",
  "s3Key": "evidence/{userId}/{uuid}-bill_screenshot.jpg",
  "expiresInSeconds": 300
}
```

Error `400`:
```json
{ "error": "UNSUPPORTED_FILE_TYPE", "message": "Only jpg, png, pdf accepted" }
```

### 1.2 `POST /cases`
**Auth:** required
**Purpose:** Create a new grievance case and kick off the Step Functions execution. Called after the S3 upload completes.

Request:
```json
{
  "s3Key": "evidence/{userId}/{uuid}-bill_screenshot.jpg",
  "complaintText": "Refund pending 45 days for order #4521, no response from seller.",
  "category": "ECOMMERCE"
}
```
`category` enum: `ECOMMERCE | BANKING | TELECOM | OTHER`

Response `202`:
```json
{
  "caseId": "c_8f3a1b2c",
  "status": "PROCESSING",
  "executionArn": "arn:aws:states:...:execution:GrievEasePipeline:c_8f3a1b2c",
  "createdAt": "2026-09-18T10:15:00Z"
}
```

Error `422`:
```json
{ "error": "MISSING_EVIDENCE_OR_TEXT", "message": "Provide s3Key and/or complaintText" }
```

### 1.3 `GET /cases/{caseId}`
**Auth:** required (must own case)
**Purpose:** Poll for pipeline status and results — this is what the dashboard polls.

Response `200` (mid-pipeline):
```json
{
  "caseId": "c_8f3a1b2c",
  "status": "CLASSIFYING",
  "stagesCompleted": ["INTAKE"],
  "updatedAt": "2026-09-18T10:15:22Z"
}
```

Response `200` (complete):
```json
{
  "caseId": "c_8f3a1b2c",
  "status": "READY",
  "forum": "CONSUMER_FORUM",
  "deadline": "2026-10-15",
  "confidence": 0.91,
  "draftNotice": "To, The Manager, ...",
  "guardResult": "PASSED",
  "stagesCompleted": ["INTAKE", "CLASSIFICATION", "DRAFTING", "COMPLIANCE_GUARD"],
  "updatedAt": "2026-09-18T10:15:41Z"
}
```

Response `200` (guard rejected):
```json
{
  "caseId": "c_8f3a1b2c",
  "status": "REJECTED",
  "guardResult": "FAILED",
  "rejectionReason": "DEADLINE_EXPIRED",
  "stagesCompleted": ["INTAKE", "CLASSIFICATION", "DRAFTING", "COMPLIANCE_GUARD"],
  "updatedAt": "2026-09-18T10:15:41Z"
}
```

Error `404`:
```json
{ "error": "CASE_NOT_FOUND", "message": "No case with this id for this user" }
```

### 1.4 `GET /cases`
**Auth:** required
**Purpose:** List the current user's cases for the dashboard (uses GSI1 — see §2).

Response `200`:
```json
{
  "cases": [
    { "caseId": "c_8f3a1b2c", "status": "READY", "forum": "CONSUMER_FORUM", "createdAt": "2026-09-18T10:15:00Z" },
    { "caseId": "c_1a2b3c4d", "status": "REJECTED", "createdAt": "2026-09-17T09:00:00Z" }
  ],
  "nextCursor": null
}
```

### 1.5 `GET /health`
**Auth:** none
**Purpose:** Amplify/uptime check.
Response `200`: `{ "status": "ok" }`

### Standard error envelope (all endpoints)
```json
{ "error": "ERROR_CODE", "message": "human readable", "requestId": "abc-123" }
```
Status codes used: `200, 202, 400, 401, 403, 404, 422, 500`

---

## 2. Data Schemas

**Theory — single-table design, explained without jargon:** In a traditional (SQL) database you'd make a `cases` table, a `users` table, a `status_history` table, and join them with queries. DynamoDB doesn't do joins — it's fast *because* it doesn't. Instead, the trick is: put everything in **one table**, and give each item a `PK` (Partition Key) and `SK` (Sort Key) that encode what it is and how it relates to other items. You design these keys around the *questions you'll actually ask* (called "access patterns") — e.g. "give me this one case" or "give me all cases for this user, newest first." That's why we picked `PK = CASE#<caseId>`, `SK = META` for the current state of a case: it means "give me one case" is a single, instant lookup.

**Why there's also a `STATUS#<timestamp>` sort key:** every time the pipeline moves to a new stage, we don't overwrite history — we add a *new* item under the same `PK` with a different `SK`. This gives you a free audit trail: querying `PK = CASE#<id>` with no filter returns the current state *and* every stage it passed through, ordered by time. This is also a great thing to show a judge — "here's the full audit trail of what our compliance guard checked."

**What a GSI (Global Secondary Index) is and why you need one here:** Your main key design answers "get me one case by ID" great, but it *cannot* answer "get me all cases belonging to user X" — DynamoDB can only query efficiently by the keys you've indexed. A GSI is a second set of keys layered on top of the same data, letting you query it a different way. `GSI1` reshapes the same items so `GSI1PK = USER#<userId>` becomes queryable — that's what powers your case-list dashboard. Think of a GSI as "the same data, filed a second way, for a second question you need to ask."

### 2.1 DynamoDB Main Table — `GrievEaseTable`

Single-table design, on-demand billing.

| Entity | PK | SK | Notes |
|---|---|---|---|
| Case | `CASE#<caseId>` | `META` | current-state item, overwritten each stage |
| Case status history (audit) | `CASE#<caseId>` | `STATUS#<isoTimestamp>` | one item per stage transition, never overwritten |
| User→Case index item | (via GSI1 only, no separate item needed) | — | see GSI1 below |

**GSI1 — `UserCasesIndex`**
- GSI1PK = `USER#<userId>`
- GSI1SK = `CASE#<createdAt>#<caseId>`
- Access pattern served: "list all cases for a user, newest first" → powers `GET /cases`.

**GSI2 — `StatusIndex`** (operational/debugging, optional but cheap to add)
- GSI2PK = `STATUS#<status>`
- GSI2SK = `CASE#<updatedAt>`
- Access pattern served: "find all cases currently stuck in CLASSIFYING for >5 min" (ops dashboard / demo debugging).

#### Example item — `META` item, mid-pipeline (after Intake, before Classification)
```json
{
  "PK": "CASE#c_8f3a1b2c",
  "SK": "META",
  "GSI1PK": "USER#u_priya01",
  "GSI1SK": "CASE#2026-09-18T10:15:00Z#c_8f3a1b2c",
  "GSI2PK": "STATUS#CLASSIFYING",
  "GSI2SK": "CASE#2026-09-18T10:15:22Z",
  "caseId": "c_8f3a1b2c",
  "userId": "u_priya01",
  "status": "CLASSIFYING",
  "category": "ECOMMERCE",
  "s3Key": "evidence/u_priya01/uuid-bill.jpg",
  "ocrText": "Order #4521 ... Refund status: Pending ... Date: 2026-08-04",
  "complaintText": "Refund pending 45 days for order #4521",
  "stagesCompleted": ["INTAKE"],
  "createdAt": "2026-09-18T10:15:00Z",
  "updatedAt": "2026-09-18T10:15:22Z"
}
```

#### Example item — `META` item, final `READY` state
```json
{
  "PK": "CASE#c_8f3a1b2c",
  "SK": "META",
  "GSI1PK": "USER#u_priya01",
  "GSI1SK": "CASE#2026-09-18T10:15:00Z#c_8f3a1b2c",
  "GSI2PK": "STATUS#READY",
  "GSI2SK": "CASE#2026-09-18T10:15:41Z",
  "caseId": "c_8f3a1b2c",
  "userId": "u_priya01",
  "status": "READY",
  "forum": "CONSUMER_FORUM",
  "deadline": "2026-10-15",
  "confidence": 0.91,
  "draftNotice": "To, The Manager, ...",
  "guardResult": "PASSED",
  "stagesCompleted": ["INTAKE", "CLASSIFICATION", "DRAFTING", "COMPLIANCE_GUARD"],
  "createdAt": "2026-09-18T10:15:00Z",
  "updatedAt": "2026-09-18T10:15:41Z"
}
```

#### Example item — audit history item (one written per stage)
```json
{
  "PK": "CASE#c_8f3a1b2c",
  "SK": "STATUS#2026-09-18T10:15:22Z",
  "stage": "CLASSIFICATION",
  "result": "forum=CONSUMER_FORUM confidence=0.91",
  "timestamp": "2026-09-18T10:15:22Z"
}
```

### 2.2 DynamoDB — `ComplianceRulesTable` (used by Guard agent)

| Field | Type | Notes |
|---|---|---|
| PK: `forum` | String | `CONSUMER_FORUM \| RBI_OMBUDSMAN \| TRAI` |
| SK: `ruleId` | String | e.g. `RULE#REQUIRED_FIELDS`, `RULE#MAX_DEADLINE_DAYS` |
| ruleType | String | `REQUIRED_FIELD \| DEADLINE_WINDOW \| TONE_CHECK` |
| params | Map | rule-specific config |

Example item:
```json
{
  "forum": "CONSUMER_FORUM",
  "ruleId": "RULE#MAX_DEADLINE_DAYS",
  "ruleType": "DEADLINE_WINDOW",
  "params": { "windowDays": 730, "warnIfPastDays": 700 }
}
```
```json
{
  "forum": "CONSUMER_FORUM",
  "ruleId": "RULE#REQUIRED_FIELDS",
  "ruleType": "REQUIRED_FIELD",
  "params": { "fields": ["orderNumber", "sellerName", "amountDisputed", "purchaseDate"] }
}
```

### 2.3 S3 Bucket Layout

**`grievease-evidence-{env}`**
```
evidence/{userId}/{uuid}-{originalFileName}
```
Lifecycle rule: transition to Glacier after 90 days (cost hygiene, mention in writeup as a "production-mindedness" detail).

**`grievease-kb-corpus-{env}`**
```
kb-corpus/consumer-forum/jurisdiction-thresholds.txt
kb-corpus/consumer-forum/filing-procedure.txt
kb-corpus/rbi-ombudsman/scheme-scope.txt
kb-corpus/rbi-ombudsman/timelines.txt
kb-corpus/trai/grievance-categories.txt
kb-corpus/trai/escalation-process.txt
```

---

## 3. Step Functions State Machine (ASL)

**Theory — what ASL actually is:** Amazon States Language is just JSON that describes a flowchart: each "State" is one box in the flowchart (usually "run this Lambda"), and each state says what to do next. You're not writing orchestration *code* (no `if/else` gluing Lambdas together in Python) — you're *declaring* the flow, and Step Functions executes it, retries failures, and — critically for your demo — draws you a live visual diagram of exactly which box is currently running. This is why Step Functions is worth more to your submission than calling Lambdas from each other directly: it's the same result, but AWS-native and visually provable to judges.

**Reading the pieces below:**
- `"Resource"` — which Lambda this box calls.
- `"Retry"` — "if this specific error happens, wait and try again N times before giving up." You want this on the Bedrock calls because LLM APIs occasionally throttle you — a transient error shouldn't kill the whole pipeline.
- `"Catch"` — "if it fails even after retries, don't crash — jump to this other box instead" (here, a `MarkFailed` box that records the failure cleanly instead of leaving a case stuck forever).
- `"Choice"` — a fork in the flowchart based on a condition. This is literally your compliance guard's "approve vs. reject" branch — the pipeline visibly goes one of two ways depending on `guardResult.passed`.
- `"ResultPath"` — where to *attach* a state's output onto the data passed along, without deleting what came before it (so by the end of the pipeline, the full history of every stage's output is still available).

State machine name: `GrievEasePipeline`. Standard workflow (need full execution history for the demo video's visual proof).

```json
{
  "Comment": "GrievEase 4-agent grievance escalation pipeline",
  "StartAt": "IntakeAgent",
  "States": {
    "IntakeAgent": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:grievease-intake-agent",
      "TimeoutSeconds": 30,
      "Retry": [
        {
          "ErrorEquals": ["Lambda.ServiceException", "Lambda.TooManyRequestsException"],
          "IntervalSeconds": 2,
          "MaxAttempts": 3,
          "BackoffRate": 2.0
        }
      ],
      "Catch": [
        {
          "ErrorEquals": ["States.ALL"],
          "ResultPath": "$.error",
          "Next": "MarkFailed"
        }
      ],
      "ResultPath": "$.intakeResult",
      "Next": "ClassificationAgent"
    },
    "ClassificationAgent": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:grievease-classification-agent",
      "TimeoutSeconds": 25,
      "Retry": [
        {
          "ErrorEquals": ["Bedrock.ThrottlingException"],
          "IntervalSeconds": 3,
          "MaxAttempts": 4,
          "BackoffRate": 2.0
        },
        {
          "ErrorEquals": ["States.ALL"],
          "IntervalSeconds": 2,
          "MaxAttempts": 2,
          "BackoffRate": 2.0
        }
      ],
      "Catch": [
        {
          "ErrorEquals": ["States.ALL"],
          "ResultPath": "$.error",
          "Next": "MarkFailed"
        }
      ],
      "ResultPath": "$.classificationResult",
      "Next": "DraftingAgent"
    },
    "DraftingAgent": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:grievease-drafting-agent",
      "TimeoutSeconds": 25,
      "Retry": [
        {
          "ErrorEquals": ["Bedrock.ThrottlingException"],
          "IntervalSeconds": 3,
          "MaxAttempts": 4,
          "BackoffRate": 2.0
        }
      ],
      "Catch": [
        {
          "ErrorEquals": ["States.ALL"],
          "ResultPath": "$.error",
          "Next": "MarkFailed"
        }
      ],
      "ResultPath": "$.draftResult",
      "Next": "ComplianceGuardAgent"
    },
    "ComplianceGuardAgent": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:grievease-compliance-guard-agent",
      "TimeoutSeconds": 10,
      "Catch": [
        {
          "ErrorEquals": ["States.ALL"],
          "ResultPath": "$.error",
          "Next": "MarkFailed"
        }
      ],
      "ResultPath": "$.guardResult",
      "Next": "GuardDecision"
    },
    "GuardDecision": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.guardResult.passed",
          "BooleanEquals": true,
          "Next": "MarkReady"
        }
      ],
      "Default": "MarkRejected"
    },
    "MarkReady": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:grievease-update-case-status",
      "Parameters": {
        "caseId.$": "$.caseId",
        "status": "READY"
      },
      "End": true
    },
    "MarkRejected": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:grievease-update-case-status",
      "Parameters": {
        "caseId.$": "$.caseId",
        "status": "REJECTED",
        "rejectionReason.$": "$.guardResult.reason"
      },
      "End": true
    },
    "MarkFailed": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:grievease-update-case-status",
      "Parameters": {
        "caseId.$": "$.caseId",
        "status": "FAILED",
        "error.$": "$.error"
      },
      "End": true
    }
  }
}
```

Note: each agent Lambda writes its own `STATUS#<timestamp>` audit item and updates `META.status` directly (e.g., `INTAKE_DONE`, `CLASSIFYING`, `DRAFTING`, `GUARD_CHECKING`) so `GET /cases/{id}` reflects live progress without waiting for the state machine to finish — this is what makes the dashboard's polling feel real-time.

---

## 4. Lambda Function Specs

**Theory — what makes a good Lambda vs. a messy one:** each Lambda should do exactly one job, take a small, predictable input, and return a small, predictable output — that's what lets Step Functions chain them cleanly. Every spec below follows the same shape on purpose: **input → what it does → output**, plus **env vars** (config values injected at deploy time, like which DynamoDB table to write to — never hardcode these) and **IAM** (the exact permissions this one function needs, tied back to the theory in Section 6). Read each spec as "here's the one job this box in the flowchart does," not as a whole application.

**Why Compliance Guard has no Bedrock permission at all:** this is the most important design decision in the whole system, worth understanding deeply. The first three agents call an LLM, which means their output *could* occasionally be wrong or inconsistent — that's the nature of generative AI. The Guard agent is deliberately written as plain, boring, deterministic Python — no model call, just "check field X exists, check date Y hasn't passed." Because it can't call Bedrock (the IAM policy physically won't allow it), you can *prove*, not just claim, that every notice either passed a fixed rule-check or got rejected. This is what separates "an LLM wrapper" from "an agentic system with guardrails," and it's a genuinely strong technical story for judges.

All Lambdas: **Python 3.12**, deployed via the chosen IaC tool (§9), 512MB memory baseline (bump Classification/Drafting to 1024MB — Bedrock SDK + JSON parsing).

### 4.1 Intake Agent (`grievease-intake-agent`)

**Input event:**
```json
{ "caseId": "c_8f3a1b2c", "s3Key": "evidence/u_priya01/uuid-bill.jpg", "complaintText": "..." }
```
**Output:**
```json
{ "caseId": "c_8f3a1b2c", "ocrText": "extracted text...", "normalizedText": "combined + cleaned text" }
```
**Env vars:** `EVIDENCE_BUCKET`, `TABLE_NAME`
**IAM:** `textract:DetectDocumentText`, `s3:GetObject` (evidence bucket only), `dynamodb:UpdateItem` (main table only)

**Logic:**
1. If `s3Key` present → call Textract `DetectDocumentText` on the S3 object.
2. Concatenate OCR text + `complaintText`, strip boilerplate/noise.
3. Update DynamoDB `META` item: `status=CLASSIFYING`, `ocrText`, `stagesCompleted += INTAKE`. Write audit `STATUS#` item.
4. Return normalized text for the next state.

### 4.2 Classification Agent (`grievease-classification-agent`)

**Input:** `{ "caseId": "...", "normalizedText": "...", "category": "ECOMMERCE" }`
**Output:**
```json
{ "caseId": "c_8f3a1b2c", "forum": "CONSUMER_FORUM", "deadline": "2026-10-15", "confidence": 0.91, "retrievedContext": ["chunk1...", "chunk2..."] }
```
**Env vars:** `BEDROCK_MODEL_ID`, `KB_ID`, `TABLE_NAME`
**IAM:** `bedrock:InvokeModel`, `bedrock:Retrieve` (or `RetrieveAndGenerate`) on the specific Knowledge Base ARN, `dynamodb:UpdateItem`

**Logic:**
1. Call Bedrock Knowledge Base `Retrieve` with query = normalized complaint text.
2. Build the classification prompt (template §4.5) with retrieved chunks injected as context.
3. Call Bedrock `InvokeModel`, parse forced-JSON response.
4. Update DynamoDB: `status=DRAFTING`, `forum`, `deadline`, `confidence`, `stagesCompleted += CLASSIFICATION`. Audit item.

### 4.3 Drafting Agent (`grievease-drafting-agent`)

**Input:** `{ "caseId": "...", "forum": "CONSUMER_FORUM", "normalizedText": "...", "category": "..." }`
**Output:**
```json
{ "caseId": "c_8f3a1b2c", "draftNotice": "To, The Manager, ..." }
```
**Env vars:** `BEDROCK_MODEL_ID`, `TABLE_NAME`
**IAM:** `bedrock:InvokeModel`, `dynamodb:UpdateItem`

**Logic:**
1. Select forum-specific prompt template (§4.5).
2. Call Bedrock, extract notice text field from forced-JSON response.
3. Update DynamoDB: `status=GUARD_CHECKING`, `draftNotice`, `stagesCompleted += DRAFTING`. Audit item.

### 4.4 Compliance Guard Agent (`grievease-compliance-guard-agent`)

**Input:** `{ "caseId": "...", "forum": "CONSUMER_FORUM", "draftNotice": "...", "deadline": "2026-10-15", "extractedFields": {...} }`
**Output:**
```json
{ "caseId": "c_8f3a1b2c", "passed": true, "reason": null }
```
or
```json
{ "caseId": "c_8f3a1b2c", "passed": false, "reason": "DEADLINE_EXPIRED" }
```
**Env vars:** `RULES_TABLE_NAME`, `TABLE_NAME`
**IAM:** `dynamodb:Query` (rules table), `dynamodb:UpdateItem` (main table) — **no Bedrock permission at all**, which is the point: this agent is deliberately non-LLM, deterministic, and cheap to prove ("zero out-of-policy" claim in the writeup).

**Logic (pure Python, no model call):**
1. `Query` `ComplianceRulesTable` where `forum = <forum>`.
2. For each `REQUIRED_FIELD` rule → check all listed fields are non-empty in extracted data.
3. For each `DEADLINE_WINDOW` rule → compare `deadline` against today + `windowDays`.
4. If any rule fails → return `passed=false` with the first failing `reason`.
5. Else → `passed=true`.

### 4.5 Bedrock Prompt Templates (forced-JSON output)

**Classification prompt:**
```
You are a legal-routing assistant for Indian consumer grievances. Using ONLY the context provided, determine the correct escalation forum.

Context (retrieved rules):
{{retrieved_context}}

Complaint:
{{normalized_text}}

Category hint: {{category}}

Respond with ONLY valid JSON, no other text, in exactly this shape:
{
  "forum": "CONSUMER_FORUM" | "RBI_OMBUDSMAN" | "TRAI",
  "deadline": "YYYY-MM-DD",
  "confidence": 0.0-1.0,
  "reasoning": "one sentence"
}
```

**Drafting prompt:**
```
You are drafting a formal escalation notice for the {{forum}} in India.

Complaint details:
{{normalized_text}}

Required structure: sender/recipient placeholders, subject line, factual summary, specific relief sought, reference to applicable timeline, signature block.

Respond with ONLY valid JSON in exactly this shape:
{
  "draftNotice": "full notice text with placeholders like [YOUR NAME]",
  "extractedFields": {
    "orderNumber": "...",
    "sellerName": "...",
    "amountDisputed": "...",
    "purchaseDate": "..."
  }
}
```

Both Lambdas should validate the response is parseable JSON and retry once with a stricter "Return JSON only" reminder if parsing fails — this is cheap insurance against a stray preamble from the model.

---

## 5. Bedrock Knowledge Base Setup

**Theory — RAG in one paragraph:** an LLM only knows what it was trained on, and it wasn't trained on your specific consumer-forum rules. RAG (Retrieval-Augmented Generation) fixes this by fetching relevant real text *before* asking the model to answer, and pasting that text into the prompt as context — so the model answers from your facts instead of its memory. "Retrieval" is the search step (find the 3 most relevant paragraphs out of your documents); "Generation" is the model then writing an answer using those paragraphs. Bedrock Knowledge Bases automates the annoying part of RAG (splitting documents into chunks, converting each chunk into a numeric "embedding" so similarity search works, and storing/searching those embeddings) so you're not building a vector database by hand during a hackathon.

**Why chunking size matters:** if you feed the model a whole 5-page document per query, you waste tokens and dilute relevance. If chunks are too small, you lose context. ~300 tokens with overlap is a reasonable default for short regulatory paragraphs like yours — small enough to be precise, with overlap so a sentence split across a chunk boundary isn't cut in a way that loses meaning.

**Corpus (6 short documents, ~1–2 pages each, plain text or PDF):**
1. `consumer-forum/jurisdiction-thresholds.txt` — District/State/National Commission monetary thresholds, filing windows.
2. `consumer-forum/filing-procedure.txt` — e-Daakhil process summary, required documents.
3. `rbi-ombudsman/scheme-scope.txt` — Which banking/NBFC/digital-payment complaints fall under RBI Integrated Ombudsman Scheme.
4. `rbi-ombudsman/timelines.txt` — 30-day bank-response rule before escalation, ombudsman filing windows.
5. `trai/grievance-categories.txt` — Telecom complaint categories TRAI handles vs. what stays with the operator's appellate authority.
6. `trai/escalation-process.txt` — CGRO/appellate process and timelines.

**Ingestion steps:**
1. Upload the 6 docs to `s3://grievease-kb-corpus-{env}/kb-corpus/...`.
2. In Bedrock console/CLI: create a Knowledge Base pointing at that S3 prefix, default chunking strategy (fixed-size, ~300 tokens, 20% overlap — these are short regulatory docs, small chunks keep retrieval precise).
3. Choose the default OpenSearch Serverless vector store that Bedrock provisions automatically (fastest path for a hackathon — no separate vector DB to manage).
4. Run "Sync" after upload; re-sync any time the corpus docs change.

**Retrieval query pattern used by Classification Agent:**
```python
response = bedrock_agent_runtime.retrieve(
    knowledgeBaseId=KB_ID,
    retrievalQuery={"text": normalized_complaint_text},
    retrievalConfiguration={
        "vectorSearchConfiguration": {"numberOfResults": 3}
    }
)
chunks = [r["content"]["text"] for r in response["retrievalResults"]]
```
Top-3 chunks are concatenated into `{{retrieved_context}}` in the classification prompt — enough grounding without bloating the prompt.

---

## 6. IAM & Security

**Theory — "least privilege" explained:** by default, a Lambda can't touch any AWS service — you have to explicitly grant it permission via an IAM policy (a JSON document listing allowed actions on specific resources). "Least privilege" means granting *only* the exact actions on the *exact* resources a function needs, nothing broader. The lazy alternative — giving every Lambda full admin access — would technically work, but it means one bug or one leaked credential could touch your entire AWS account. Notice how each policy below names a specific action (`s3:GetObject`, not `s3:*`) and a specific resource ARN (one bucket, not `*`) — that specificity *is* the security control. This also reads well in a writeup/interview: it signals you understand production AWS hygiene, not just "make it work."

**Theory — what Cognito is actually doing for you:** without Cognito, you'd have to build your own signup/login forms, password hashing and storage, token generation, and session handling — all security-sensitive code that's easy to get wrong. Cognito hands you a hosted, audited implementation of all of that. Your API Gateway just checks "does this request have a valid, unexpired Cognito token?" before letting it through — you never see or handle a password yourself.

### 6.1 Per-Lambda IAM (least privilege sketch)

**intake-agent role:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": "textract:DetectDocumentText", "Resource": "*" },
    { "Effect": "Allow", "Action": "s3:GetObject", "Resource": "arn:aws:s3:::grievease-evidence-*/*" },
    { "Effect": "Allow", "Action": ["dynamodb:UpdateItem", "dynamodb:PutItem"], "Resource": "arn:aws:dynamodb:*:*:table/GrievEaseTable" }
  ]
}
```

**classification-agent role:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": "bedrock:InvokeModel", "Resource": "arn:aws:bedrock:*::foundation-model/*" },
    { "Effect": "Allow", "Action": "bedrock:Retrieve", "Resource": "arn:aws:bedrock:*:*:knowledge-base/*" },
    { "Effect": "Allow", "Action": ["dynamodb:UpdateItem", "dynamodb:PutItem"], "Resource": "arn:aws:dynamodb:*:*:table/GrievEaseTable" }
  ]
}
```

**drafting-agent role:** same shape as classification but drop the `bedrock:Retrieve` line (drafting doesn't query the KB directly).

**compliance-guard-agent role:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": "dynamodb:Query", "Resource": "arn:aws:dynamodb:*:*:table/ComplianceRulesTable" },
    { "Effect": "Allow", "Action": ["dynamodb:UpdateItem", "dynamodb:PutItem"], "Resource": "arn:aws:dynamodb:*:*:table/GrievEaseTable" }
  ]
}
```
Note the intentional absence of any `bedrock:*` permission here — worth calling out explicitly in the writeup as evidence of a deliberately deterministic guardrail layer.

**presign-lambda role (behind `POST /uploads/presign`):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": "s3:PutObject", "Resource": "arn:aws:s3:::grievease-evidence-*/*" }
  ]
}
```

**step-functions-execution-role:** `lambda:InvokeFunction` scoped to the 6 named Lambda ARNs used in the state machine, nothing else.

### 6.2 Cognito User Pool Config
- Standard attributes: `email` (required, verified), `name`.
- Auth flow: `ALLOW_USER_SRP_AUTH` + `ALLOW_REFRESH_TOKEN_AUTH` (no plaintext password flow).
- App client: no client secret (public SPA client), token expiry — access 1hr / refresh 30 days.
- Post-confirmation Lambda trigger (optional stretch): pre-populate a `USER#<id>` profile marker — not required for MVP since GSI1 needs no separate user item.

---

## 7. Frontend Integration

**Theory — why polling instead of something "real-time":** the pipeline takes maybe 15-30 seconds end to end. You could build a WebSocket connection or use AWS AppSync for true real-time push updates, but that's extra infrastructure and extra failure modes for very little visible benefit at this timescale. Polling means the browser just asks "are you done yet?" every couple of seconds — simple, reliable, and to a judge watching the demo it looks exactly as "live" as a push update would, because the progress bar still visibly advances. Save the real complexity budget for the parts that actually differentiate your project (the agent pipeline itself).

### 7.1 Pages/Components
| Component | Maps to API call |
|---|---|
| `LoginPage` | Cognito Hosted UI / Amplify Auth SDK (no custom endpoint) |
| `UploadCasePage` (photo/text input) | `POST /uploads/presign` → direct S3 PUT → `POST /cases` |
| `CaseDetailPage` (progress + result) | `GET /cases/{caseId}` polled |
| `DashboardPage` (case list) | `GET /cases` |
| `PipelineProgressBar` (sub-component of CaseDetailPage) | reads `stagesCompleted` array from the same `GET /cases/{caseId}` payload — no separate call |

### 7.2 Progress Strategy: Polling (not WebSockets)
For a 4-day build, polling is the correct choice — a WebSocket/AppSync subscription layer is not worth the setup risk for a ~15–30 second pipeline.
- `CaseDetailPage` polls `GET /cases/{caseId}` every **2 seconds** while `status` is not in `["READY", "REJECTED", "FAILED"]`.
- Cap polling at 60 seconds total (30 polls) → show a timeout/error state past that, so a stuck demo case never hangs the UI.
- `stagesCompleted` array drives a 4-step progress bar (Intake → Classify → Draft → Guard) so the judge visually watches it advance — cheap, high perceived-polish payoff.

---

## 8. EventBridge + SES/SNS Reminder Flow

**Theory — event-driven architecture in one paragraph:** instead of one Lambda directly calling another ("when case is ready, call the reminder function"), you *publish an event* ("case is ready — here are the facts") and let something else decide what to do with it. EventBridge is the "bulletin board" that events get posted to, and a "rule" is a filter that says "when an event matching this pattern shows up, trigger this target." The benefit for you: your core pipeline (Section 3) doesn't need to know or care that reminders exist — you can add, remove, or change the reminder logic without touching the pipeline at all. This decoupling is also a legitimate AWS-depth talking point: it shows a second, independent AWS-native mechanism beyond your main agent chain.

**Event schema** (published by `MarkReady` Lambda after a case reaches `READY`):
```json
{
  "Source": "grievease.cases",
  "DetailType": "CaseReadyForReminder",
  "Detail": {
    "caseId": "c_8f3a1b2c",
    "userId": "u_priya01",
    "email": "priya@example.com",
    "forum": "CONSUMER_FORUM",
    "deadline": "2026-10-15"
  }
}
```

**EventBridge rule:**
- Pattern matches `source: ["grievease.cases"], detail-type: ["CaseReadyForReminder"]`.
- Target: an EventBridge Scheduler one-time schedule created for `deadline - 3 days`, which itself targets the `grievease-send-reminder` Lambda (simplest reliable pattern — avoids building a custom polling cron).

**Reminder Lambda → SES email template:**
```
Subject: Reminder — your {{forum}} filing deadline is in 3 days

Hi, this is a reminder that your escalation notice for case {{caseId}} 
should be filed with {{forum}} by {{deadline}}.

Your draft notice is attached/available at: {{dashboardLink}}

— GrievEase AI
```
IAM for this Lambda: `ses:SendEmail` scoped to the verified sending identity only.

---

## 9. Deployment / IaC

**Theory — what "Infrastructure as Code" (IaC) means and why you need it:** instead of clicking through the AWS Console to manually create every table, bucket, Lambda, and permission (slow, error-prone, and impossible for a teammate to reproduce), you write one file describing your entire infrastructure, and a tool reads that file and creates/updates everything for you with one command. This also means your GitHub repo *is* your infrastructure documentation — a judge or interviewer can see exactly what you built just by reading `template.yaml`, and you can tear everything down and rebuild it identically if something breaks on Day 3 at 1am.

**Recommendation: AWS SAM.**

Justification: for a 2-person, 4-day build, SAM gives the fastest Lambda+Step-Functions+API-Gateway iteration loop (`sam build && sam deploy --guided`, `sam sync` for near-live updates during Day 2–3 development), native first-class support for Step Functions ASL as a resource type, and far less boilerplate than CDK for a stack this size. CDK's programmatic flexibility isn't needed here since the architecture is already fully decided — SAM's declarative YAML is faster to write and faster for a teammate to read at 2am on Day 3.

**Stack structure (`template.yaml`, single stack):**
```
Resources:
  GrievEaseTable            (AWS::DynamoDB::Table, incl. GSI1 + GSI2)
  ComplianceRulesTable      (AWS::DynamoDB::Table)
  EvidenceBucket            (AWS::S3::Bucket)
  KbCorpusBucket            (AWS::S3::Bucket)
  UserPool / UserPoolClient (AWS::Cognito::UserPool[Client])
  HttpApi                   (AWS::Serverless::HttpApi, Cognito authorizer)
  IntakeAgentFunction
  ClassificationAgentFunction
  DraftingAgentFunction
  ComplianceGuardAgentFunction
  UpdateCaseStatusFunction
  PresignUploadFunction
  SendReminderFunction
  GrievEasePipelineStateMachine (AWS::Serverless::StateMachine, DefinitionUri to the ASL JSON in §3)
  CaseReadyEventRule        (AWS::Events::Rule)
Outputs:
  ApiUrl, UserPoolId, UserPoolClientId, EvidenceBucketName
```
Bedrock Knowledge Base is created once, manually or via a small setup script (§5) — not worth templating in SAM given it's a one-time Day 1 setup step, not something redeployed repeatedly.

---

## 10. Sequencing Onto the 4-Day Roadmap

### Day 1 (Thu) — Foundations
- Write `template.yaml` skeleton: table definitions (§2), buckets, Cognito pool, HTTP API shell.
- `sam deploy` the skeleton with **stub Lambdas** (return hardcoded JSON matching §4 output shapes) wired into the Step Functions ASL (§3) — validates the full state machine shape end-to-end before any real logic exists.
- Manually set up the Bedrock Knowledge Base (§5): upload corpus, create KB, sync.
- Seed `ComplianceRulesTable` with the rule items from §2.2.
- Implement `POST /uploads/presign` and `PresignUploadFunction` for real (it's simple and unblocks frontend work immediately).

### Day 2 (Fri) — Core Logic
- Implement Intake, Classification, Drafting agents for real, per §4.1–4.3, using the prompt templates in §4.5.
- Implement Compliance Guard agent per §4.4 against the seeded rules table.
- Wire `POST /cases` and `GET /cases/{caseId}` for real against DynamoDB.
- Frontend: `UploadCasePage` end-to-end (presign → S3 PUT → create case) and basic polling on `CaseDetailPage`.

### Day 3 (Sat) — Integration & Polish
- `PipelineProgressBar` + full `DashboardPage` (`GET /cases`, GSI1).
- Craft and run the deliberate guard-rejection test case (expired deadline) end-to-end.
- Implement EventBridge + SES reminder flow (§8) — first stretch goal.
- Run and record 4–5 clean end-to-end test cases across categories for demo footage.
- Tighten IAM policies down from any Day-1/2 broad permissions to the least-privilege sketches in §6.1.

### Day 4 (Sun) — Submission
- README: architecture diagram, setup instructions (`sam build && sam deploy --guided`, KB setup script, seed script), AWS services list, AI tools used.
- Record demo video per the storyboard in the earlier planning document, using the Step Functions console execution graph as the centerpiece shot.
- Write submission writeup, submit early, reserve remaining hours for safe polish only.
