# GrievEase AI — Hackathon Evaluation & Judge's Guide

**First Commit — Bharat Builds Tour (WeMakeDevs × AWS)**  
*Target Tracks: Ship It (1st Place) • Best UI/UX Standard (1st Place) • Amazon Fast-Track Interview Shortlist*

---

## 🎯 Quick Links for Judges
- **Live Deployed Web Application**: [https://main.d1pngouj0au9lg.amplifyapp.com/](https://main.d1pngouj0au9lg.amplifyapp.com/)
- **Official AWS Builder Community Post**: [GrievEase AI: Turning Consumer Complaints into Legally Structured Notices](https://builder.aws.com/post/3JVqFaFVraQ1iRiwLs1OXxFq0Qt_p/grievease-ai-turning-consumer-complaints-into-legally-structured-escalation-notices)
- **Live HTTP API Gateway (v2)**: `https://6b6npw3fcb.execute-api.us-east-1.amazonaws.com`
- **Live API Health Check**: `https://6b6npw3fcb.execute-api.us-east-1.amazonaws.com/health` (Returns JSON `{"status": "ok", "service": "GrievEase AI HTTP API"}`)
- **AWS Step Functions Pipeline**: `arn:aws:states:us-east-1:717139594049:stateMachine:GrievEasePipeline-dev`
- **Amazon Bedrock Knowledge Base**: `I9ZVRIM4C2` (Vector Store: Amazon OpenSearch Serverless)
- **Cognito User Pool ID**: `us-east-1_clcyHvXKA` (Client: `1vaog4jtaiqcda9b2nuc0fo28d`)

---

## 📋 Evaluation Rubric Alignment

| Judging Criterion | How GrievEase AI Excels | Evidence in Repository / Live URL |
|---|---|---|
| **1. Idea & Impact** | Tackles 4.8M unresolved consumer grievances in India across E-Commerce, Banking, and Telecom by generating legally enforceable 15-day statutory notices in <45s. | `README.md` Sec 1, `corpus/` statutory references |
| **2. Built on AWS** | Deep orchestration with 8+ AWS services: Step Functions, Bedrock (Claude 3 & Knowledge Bases RAG with OpenSearch Serverless), Textract, DynamoDB single-table, EventBridge, SES, S3 presigned, and Cognito. | `backend/template.yaml`, `backend/statemachine/pipeline.asl.json`, Live AWS Console |
| **3. Execution & Robustness** | Zero hallucination with pure Python deterministic Compliance Guard, client-side & server-side OCR fact extraction, and 100% automated test coverage (37/37 tests pass). | `run_all_terminal_tests.py`, `backend/src/agents/compliance_guard_agent.py` |
| **4. UI/UX Excellence** | Obsidian Bento design system, live OCR laser sweep scanner, Web Speech audio wave visualizer, Command Palette (`Cmd+K`), 4-in-1 Notice Studio, and Web Audio SFX. | `frontend/src/`, Live Amplify URL |

---

## 🧪 How to Evaluate the 4 Core Scenarios

### Method A: Web UI (1-Click Evaluation)
1. Open the [Live Web App](https://main.d1pngouj0au9lg.amplifyapp.com/) or local dev server (`http://localhost:5173`).
2. In the **Case Intake** tab, click any of the **4 Hackathon Scenario Presets**:
   - **Preset 1: E-Commerce Refund (>45d)**: Routes to District Consumer Forum under Consumer Protection Act 2019 Sec 2(47) & 2(11).
   - **Preset 2: Banking UPI Dispute (>30d)**: Routes to RBI Integrated Ombudsman Scheme 2021 Clause 10.
   - **Preset 3: Telecom Fiber Outage (18-Day)**: Routes to TRAI QoS & Consumer Regulations 2012.
   - **Preset 4: Expired 3.5-Yr Claim (Deterministic Guardrail Test)**: Intercepts and flags Section 69 limitation expiry (>730 days) with deterministic rejection.
3. Click **"Execute Multi-Agent Pipeline"**.
4. Observe the **Live Pipeline Stepper** visualizing all 4 Step Functions Lambdas executing with live logs and duration metrics.
5. In the **Notice Studio**, toggle between:
   - **Dossier Studio**: Live editable statutory draft with instant field sync.
   - **Before / After Diff**: Direct comparison between messy raw input and formal legal draft.
   - **Letterhead Mode**: High-resolution print-ready legal document with stamp formatting.
   - **AWS JSON Telemetry**: Live inspection of DynamoDB single-table payload.

---

### Method B: Terminal CLI (Zero Setup Reproduction)
Run the automated test suite directly in terminal to verify backend endpoints, agent logic, and pixel OCR extraction:

```bash
# Run master 37-test suite
py -3 run_all_terminal_tests.py
```

### Method C: Live AWS API Gateway cURL Test
```bash
# 1. Check API Health
curl -X GET https://6b6npw3fcb.execute-api.us-east-1.amazonaws.com/health

# 2. Get Live Dashboard Statistics
curl -X GET https://6b6npw3fcb.execute-api.us-east-1.amazonaws.com/cases/stats

# 3. Create Case Payload (Triggers Step Functions pipeline)
curl -X POST https://6b6npw3fcb.execute-api.us-east-1.amazonaws.com/cases \
  -H "Content-Type: application/json" \
  -d '{"title": "Non-delivery of Smart TV", "category": "E-Commerce", "description": "Ordered TV on 01-Aug-2026, not delivered after 45 days. Disputed amount: INR 28,499.", "amount": 28499}'
```

---

## 🏗 Architecture & Cloud Invariants
- **Multi-Agent State Machine**: Visual Step Functions graph managing state transitions, error catchers, and retry policies.
- **RAG Vector Grounding**: Bedrock Knowledge Base queries vector embeddings stored in OpenSearch Serverless to extract statutory citations from actual Gazette notifications.
- **Deterministic Guardrails**: Strict policy engine validates that limitation windows (Section 69 of CPA 2019) are not exceeded and illegal/extortionate phrasing is blocked prior to notice dispatch.
