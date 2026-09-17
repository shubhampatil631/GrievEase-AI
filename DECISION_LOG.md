# GrievEase AI — Build Log & Architecture Decision Record (ADR) Catalog

This document is the single source of truth for all architectural decisions, design choices, data schemas, API contracts, implementation records, and hackathon build logs for **GrievEase AI**.

---

## 1. Project Overview & Hackathon Metadata
* **Project Name:** GrievEase AI
* **Event:** First Commit — Bharat Builds Tour (WeMakeDevs × AWS)
* **Date Window:** September 17–20, 2026
* **Target Tracks:** Ship It (1st Place), Best UI (3rd Place), Amazon Fast-Track Interview Shortlist
* **Core Value Proposition:** AWS-native autonomous multi-agent grievance escalation engine transforming consumer disputes into legally grounded, forum-correct notices in <60 seconds.

---

## 2. Architecture Decision Records (ADR)

### ADR-001: Native Bedrock Knowledge Bases over External Vector DB
* **Date:** 2026-09-17
* **Status:** Accepted
* **Context:** RAG is required to ground the classification and drafting agents in Indian consumer law, RBI Ombudsman rules, and TRAI grievance guidelines.
* **Decision:** Use **Amazon Bedrock Knowledge Bases** backed by managed OpenSearch Serverless instead of self-hosted Pinecone/Chroma/Milvus or custom vector clusters.
* **Rationale:**
  * Native AWS RAG satisfies the "Built on AWS" scoring criterion directly.
  * Zero infrastructure management required during the 4-day sprint.
  * Native IAM integration and built-in chunking/embedding pipelines.

---

### ADR-002: AWS Step Functions as Visual Multi-Agent Orchestrator
* **Date:** 2026-09-17
* **Status:** Accepted
* **Context:** Need to orchestrate a 4-agent pipeline (Intake → Classification → Drafting → Compliance Guard) with state transitions, retry mechanisms, and branching logic.
* **Decision:** Use **AWS Step Functions Standard Workflow** modeled in Amazon States Language (ASL).
* **Rationale:**
  * Translates agentic workflows (like CrewAI/LangGraph) into a native cloud state machine.
  * Provides a visual execution graph in the AWS Console, which serves as the centerpiece proof for the 3-minute judging demo video.
  * Decouples error handling, backoff retries, and conditional branching (`Choice` state for Guard) from agent application logic.

---

### ADR-003: Deterministic Non-LLM Compliance Guard Agent
* **Date:** 2026-09-17
* **Status:** Accepted
* **Context:** Generative models can produce inaccurate dates or miss mandatory statutory fields. We need a verifiable guarantee that no out-of-policy notices reach users.
* **Decision:** Implement the Compliance Guard Agent as a pure Python Lambda function with **zero `bedrock:*` IAM permissions**, querying rules from a DynamoDB `ComplianceRulesTable`.
* **Rationale:**
  * Enforces deterministic verification (required fields, limitation period / deadline windows, tone).
  * The physical absence of LLM permissions in IAM provides mathematical proof to judges that the guard is a genuine safeguard, not an LLM self-evaluator.
  * Enables a clear "Guard Rejection" demo test case in Step Functions.

---

### ADR-004: Direct-to-S3 Uploads via Pre-signed URLs
* **Date:** 2026-09-17
* **Status:** Accepted
* **Context:** Users upload high-resolution bill photos, screenshots, and PDF invoices.
* **Decision:** Issue pre-signed S3 PUT URLs via `POST /uploads/presign` so the frontend uploads directly to S3.
* **Rationale:**
  * Eliminates API Gateway payload size limitations (10MB HTTP API ceiling).
  * Keeps Lambda memory and execution time minimal (no multipart forwarding through compute).

---

### ADR-005: DynamoDB Single-Table Design for Live State + Immutable Audit Trail
* **Date:** 2026-09-17
* **Status:** Accepted
* **Context:** Need to store active case state, fast user-case queries, and a granular chronological audit trail of agent executions.
* **Decision:**
  * `PK = CASE#<caseId>`, `SK = META` for active case data.
  * `PK = CASE#<caseId>`, `SK = STATUS#<timestamp>` for stage-by-stage audit events.
  * `GSI1 (GSI1PK = USER#<userId>, GSI1SK = CASE#<createdAt>#<caseId>)` for user dashboard queries.
  * `GSI2 (GSI2PK = STATUS#<status>, GSI2SK = CASE#<updatedAt>)` for operations/debugging.
* **Rationale:**
  * Sub-10ms single-key lookups for API responses.
  * Querying `PK = CASE#<caseId>` yields the current state + full stage transition history in a single request.

---

### ADR-006: Infrastructure as Code (IaC) using AWS SAM
* **Date:** 2026-09-17
* **Status:** Accepted
* **Context:** Fast deployment, local testing, and clean reproducibility during the hackathon.
* **Decision:** Use **AWS Serverless Application Model (SAM)** (`template.yaml`).
* **Rationale:**
  * First-class native support for Step Functions definitions (`DefinitionUri`).
  * Fast `sam build && sam deploy` iterations.
  * Low YAML boilerplate compared to CloudFormation/CDK for serverless architectures.

### ADR-007: Cyber-Legal Design System & Live Visual Pipeline Stepper for Best UI Track
* **Date:** 2026-09-17
* **Status:** Accepted
* **Context:** Competing for the **Best UI (3rd Track - ₹1,00,000)** prize requires a visually distinctive, responsive, and intuitive interface with live visual telemetry and zero friction for judges.
* **Decision:**
  * Build a React SPA (Vite + Tailwind CSS) with a dark cyber-legal theme (`#080C14`), glassmorphism cards, glowing teal/AWS orange accents, and typography using Google Fonts (Outfit, Plus Jakarta Sans, JetBrains Mono).
  * Build an interactive 4-stage visual pipeline runner mirroring the AWS Step Functions execution graph with real-time CloudWatch telemetry simulation.
  * Implement split-screen Notice Studio with 1-click legal copy, print/PDF layout, limitation countdown clock, and official regulatory portal deep links.
  * Provide 1-click demo presets (E-Commerce, Banking UPI, Telecom SLA, and a deliberate Guard Rejection test) so judges can test every feature instantly.
* **Rationale:**
  * Eliminates judge friction and delivers immediate visual impact.
  * Provides visual proof of Step Functions state transitions directly in the UI.

---

## 3. Implementation & Build Activity Log

### [2026-09-17] — Day 1: Foundation & Frontend UI Phase
* **Corpus Creation:** Created 6 curated regulatory knowledge base files in `corpus/` covering Consumer Protection Act 2019, RBI Integrated Ombudsman Scheme 2021, and TRAI Telecom Consumer Protection Regulations.
* **IaC & State Machine:** Defined `backend/template.yaml` (SAM) with DynamoDB tables (`GrievEaseTable`, `ComplianceRulesTable`), S3 buckets, Cognito User Pool, API Gateway HTTP API, 4 Agent Lambdas, and Step Functions ASL (`pipeline.asl.json`).
* **Lambdas & Handlers:** Created structured Python 3.12 handlers for Intake, Classification, Drafting, Compliance Guard, Case Status, Presign Upload, and Case CRUD.
* **Helper Scripts:** Added rule seeder (`seed_compliance_rules.py`) and knowledge base upload helper (`setup_knowledge_base.py`).
* **Frontend UI Build (Best UI Track):**
  * Built complete React SPA in `frontend/` (Vite, Tailwind, Lucide).
  * Implemented [`CaseIntake.jsx`](file:///d:/agents/AWS/GrievEase%20AI/frontend/src/components/CaseIntake.jsx) with 1-click judge presets, drag-and-drop evidence upload, and Guard test toggle.
  * Implemented [`PipelineStepper.jsx`](file:///d:/agents/AWS/GrievEase%20AI/frontend/src/components/PipelineStepper.jsx) with 4-agent visual state nodes and live CloudWatch telemetry streaming.
  * Implemented [`CaseResultView.jsx`](file:///d:/agents/AWS/GrievEase%20AI/frontend/src/components/CaseResultView.jsx) with split-screen legal notice studio, limitation countdown clock, and compliance audit score.
  * Implemented [`Dashboard.jsx`](file:///d:/agents/AWS/GrievEase%20AI/frontend/src/components/Dashboard.jsx) with KPI cards, category filters, and expandable DynamoDB audit records.
* **Day 1 Foundations Audit & Verification:**
  * Verified 100% of Day 1 items in [`documentaion/grievease-implementation-plan.md`](file:///d:/agents/AWS/GrievEase%20AI/documentaion/grievease-implementation-plan.md).
  * Added root [`.gitignore`](file:///d:/agents/AWS/GrievEase%20AI/.gitignore) and authoritative [`README.md`](file:///d:/agents/AWS/GrievEase%20AI/README.md).
  * Production bundle compiled with zero errors/warnings in 11.01s.
  * Ahead of schedule: Implemented full agent logic & prompt templates planned for Day 2 alongside Day 1 foundations.

### [2026-09-17] — Day 2: Cloud Stack Provisioning & Live Deployment

#### A. End-to-End Deployment Procedure
1. **IAM Identity & Credential Generation**:
   * Created a dedicated IAM User (`grievease-admin`) attached with `AdministratorAccess` policy in the AWS Management Console (`us-east-1`).
   * Generated CLI access keys (`AKIA...` / secret key) to enable SAM and Boto3 programmatic provisioning without risking root account credentials.
2. **Environment & Toolchain Setup**:
   * Installed AWS SAM CLI system-wide using `winget install -e --id Amazon.SAM-CLI` (`v1.166.2`).
   * Injected session credentials into the active PowerShell execution environment:
     ```powershell
     $env:AWS_ACCESS_KEY_ID = "AKIA..."
     $env:AWS_SECRET_ACCESS_KEY = "..."
     $env:AWS_DEFAULT_REGION = "us-east-1"
     ```
3. **SAM Build & Packaging**:
   * Configured runtime compatibility in [`backend/template.yaml`](file:///d:/agents/AWS/GrievEase%20AI/backend/template.yaml) and bundled agent source code with `backend/src/requirements.txt`.
   * Executed `sam build` to compile the CloudFormation deployment package in `.aws-sam/build/`.
4. **CloudFormation Stack Provisioning (`sam deploy --guided`)**:
   * Executed guided deployment with stack name `grievease-ai-stack` in region `us-east-1`.
   * Configured unauthenticated HTTP API route permissions for public hackathon demo endpoints (`/health`, `/uploads/presign`, `/cases`).
   * Provisioned 100% of cloud resources: 2 S3 buckets, 2 DynamoDB tables, 9 Lambda functions, 1 Step Functions Standard Workflow state machine, 1 HTTP API Gateway, and 1 Cognito User Pool.

#### B. Issues Encountered & Resolutions
* **Issue 1: SAM CLI & AWS CLI Missing on Initial Path**
  * *Symptom:* `sam` and `aws` commands threw `CommandNotFoundException`.
  * *Resolution:* Installed SAM CLI globally via Windows `winget` package manager, and injected AWS credentials directly into PowerShell environment variables (`$env:AWS_ACCESS_KEY_ID`, `$env:AWS_SECRET_ACCESS_KEY`, `$env:AWS_DEFAULT_REGION`) bypassing the need for a separate AWS CLI binary.
* **Issue 2: Python Runtime Validation Failure during `sam build`**
  * *Symptom:* `Error: PythonPipBuilder:Validation - Binary validation failed for python... did not satisfy constraints for runtime: python3.12`.
  * *Resolution:* Detected that the local system environment had Python 3.11 installed at `C:\Users\HP\AppData\Local\Programs\Python\Python311`. Updated `template.yaml` Globals runtime from `python3.12` to `python3.11` (natively supported by AWS Lambda) and added Python 3.11 to PATH. Re-ran `sam build` resulting in clean 0-error build artifacts.
* **Issue 3: Missing `boto3` in Local Python Environment for Helper Scripts**
  * *Symptom:* `ModuleNotFoundError: No module named 'boto3'` when executing local seeder scripts.
  * *Resolution:* Executed `python -m pip install boto3` in Python 3.11 to support administrative helper tasks outside the Lambda runtime.
* **Issue 4: Missing Explicit AWS Region in Boto3 Client Initialization**
  * *Symptom:* `botocore.exceptions.NoRegionError: You must specify a region.`
  * *Resolution:* Updated [`backend/scripts/seed_compliance_rules.py`](file:///d:/agents/AWS/GrievEase%20AI/backend/scripts/seed_compliance_rules.py) and [`backend/scripts/setup_knowledge_base.py`](file:///d:/agents/AWS/GrievEase%20AI/backend/scripts/setup_knowledge_base.py) to explicitly fall back to `os.environ.get("AWS_REGION", "us-east-1")`.

#### C. Live Provisioned Stack Outputs
* **API Gateway HTTP API:** `https://6b6npw3fcb.execute-api.us-east-1.amazonaws.com`
* **Step Functions ARN:** `arn:aws:states:us-east-1:717139594049:stateMachine:GrievEasePipeline-dev`
* **DynamoDB Main Table:** `GrievEaseTable-dev`
* **DynamoDB Compliance Rules Table:** `ComplianceRulesTable-dev`
* **S3 Evidence Upload Bucket:** `grievease-evidence-717139594049-dev`
* **S3 Knowledge Base Corpus Bucket:** `grievease-kb-corpus-717139594049-dev`
* **Cognito User Pool:** `us-east-1_clcyHvXKA` (Client: `1vaog4jtaiqcda9b2nuc0fo28d`)

#### D. Live Verification & Frontend Binding
* **Health Check Probe:** Verified live endpoint `GET https://6b6npw3fcb.execute-api.us-east-1.amazonaws.com/health` returning HTTP 200:
  ```json
  {"status": "healthy", "service": "GrievEase AI API", "version": "1.0.0", "timestamp": "2026-09-17"}
  ```
* **Frontend Binding:** Automatically populated [`frontend/.env`](file:///d:/agents/AWS/GrievEase%20AI/frontend/.env) with live CloudFormation outputs for zero-friction judge testing.
* **Bedrock Knowledge Base Linked:** Created and synchronized Amazon Bedrock Knowledge Base (`I9ZVRIM4C2`) with OpenSearch Serverless vector store and bound to Classification Agent environment.
* **End-to-End Test Case Executed:** Verified live dispute execution (`c_7bb19b36`) routing to RBI Integrated Ombudsman Scheme (98% confidence) with 100% Compliance Guard verification.
* **Deep UI Overhaul for Best UI Track (3rd Place - ₹1,00,000):**
  * **Synthesized Web Audio Engine (`audio.js`):** Cyber clicks, harmonic success chords, and alert buzzers with zero external asset dependencies.
  * **Voice Dictation (Speech-to-Text):** Web Speech API microphone dictation for Bharat-wide accessibility (Hindi/English).
  * **Laser-Scanning OCR Visualizer:** Interactive invoice preview with animated laser scan lines.
  * **Step Functions State Machine Graph:** 4-node visual flow with live token streaming counters (`~420 tok/sec`) and CloudWatch auto-scrolling terminal logs.
  * **Split-Screen Notice Studio & Court Letterhead:** Real-time formal notice studio with Print/PDF export, 1-click email modal (Amazon SES simulation), limitation progress countdown clock, and Bedrock RAG statutory citation cards.
  * **Interactive AWS Blueprint Inspector:** Clickable architecture topology modal with metrics, ARNs, and judge evaluation rubrics.
  * **Production Compilation:** Clean Vite production build in 9.60s with 0 warnings/errors.
