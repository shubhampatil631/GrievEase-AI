# GrievEase AI — AWS-Native Autonomous Grievance Escalation Engine

> **Event:** First Commit — Bharat Builds Tour (WeMakeDevs × AWS)  
> **Tracks:** Ship It (1st Place) • Best UI (3rd Place) • Amazon Fast-Track Interview Shortlist  
> **Date:** September 17–20, 2026  

---

## 📌 Executive Summary
**GrievEase AI** is an autonomous multi-agent grievance escalation engine built entirely on AWS. It transforms unresolved Indian consumer complaints (e-commerce refund delays, wrongful banking debits, telecom billing disputes) into legally structured, forum-correct escalation notices in **under 60 seconds**.

It automates forum discovery (**District Consumer Commission / e-Daakhil**, **RBI Integrated Ombudsman**, **TRAI Telecom Appellate Hierarchy**), computes statutory limitation deadlines, extracts evidence from invoices using **Amazon Textract**, performs regulatory grounding using **Amazon Bedrock Knowledge Bases (RAG)**, drafts notice text via **Claude 3**, and deterministically verifies policy compliance via a **zero-LLM DynamoDB Guard**.

---

## 🏗 Cloud Architecture Overview

```
[React SPA on AWS Amplify] ────(Pre-signed S3 PUT)────► [S3: Evidence Bucket]
            │ (Cognito JWT)
            ▼
[API Gateway HTTP API] ──────► [AWS Step Functions: GrievEasePipeline]
                                          │
      ┌───────────────────────────────────┼───────────────────────────────────┐
      ▼                                   ▼                                   ▼
[1. Intake Agent]               [2. Classification Agent]           [3. Drafting Agent]
  - Amazon Textract OCR           - Bedrock Knowledge Bases (RAG)     - Amazon Bedrock (Claude 3)
  - Text Normalization            - Regulatory Routing JSON           - Legal Structure & Fields
      │                                   │                                   │
      └───────────────────────────────────┴───────────────────────────────────┘
                                          │
                                          ▼
                             [4. Compliance Guard Agent]
                               - Deterministic Pure Python (NO LLM IAM)
                               - DynamoDB ComplianceRulesTable Validation
                                          │
                              [Guard Decision Branch]
                              ├── PASSED ──► [MarkReady] ──► [EventBridge ──► SES Reminder]
                              └── FAILED ──► [MarkRejected] ──► [Audit State Recorded]
```

---

## 🛠 Load-Bearing AWS Services

| AWS Service | Architecture Role | Non-Negotiable Justification |
|---|---|---|
| **AWS Step Functions** | Multi-Agent Orchestrator | Visual state machine graph (Intake → Classify → Draft → Guard), automatic retries & branching. |
| **Amazon Bedrock Knowledge Bases** | Regulatory RAG | Fully managed RAG over curated statutory text stored in S3 and OpenSearch Serverless. |
| **Amazon Bedrock Foundation Models** | Reasoning & Drafting | Claude 3 / Titan foundation models invoked with forced-JSON prompts for routing and notice synthesis. |
| **Amazon Textract** | Document OCR | Extracts raw text, line items, and invoice metadata from uploaded bill screenshots. |
| **Amazon DynamoDB** | Single-Table Database | `PK=CASE#<id>`, `SK=META` (live state) + `SK=STATUS#<iso>` (audit trail), `GSI1` (user dashboard). |
| **Amazon S3** | Object Storage | Secure storage for user evidence and regulatory knowledge base corpus. |
| **Amazon EventBridge + SES** | Event Notifications | Schedules automatic deadline reminder emails 3 days before statutory expiration. |
| **Amazon Cognito & API Gateway** | Auth & API Security | User authentication tokens validated at API Gateway HTTP API. |
| **AWS Amplify Hosting** | Frontend CI/CD | Auto-deploys React SPA with global CDN distribution. |

---

## 📂 Repository Structure

```text
GrievEase-AI/
├── .gitignore                         # Git exclusion rules
├── README.md                          # Project documentation and guide
├── DECISION_LOG.md                    # Architecture Decision Records & activity log
├── corpus/                            # 6 Curated Regulatory Knowledge Documents
│   ├── consumer-forum/
│   │   ├── jurisdiction-thresholds.txt
│   │   └── filing-procedure.txt
│   ├── rbi-ombudsman/
│   │   ├── scheme-scope.txt
│   │   └── timelines.txt
│   └── trai/
│       ├── grievance-categories.txt
│       └── escalation-process.txt
├── backend/
│   ├── template.yaml                  # AWS SAM infrastructure definition
│   ├── requirements.txt               # Backend Python dependencies
│   ├── statemachine/
│   │   └── pipeline.asl.json          # Step Functions ASL flowchart definition
│   ├── src/
│   │   ├── agents/                    # 4 Agent Lambdas + Status updater
│   │   │   ├── intake_agent.py
│   │   │   ├── classification_agent.py
│   │   │   ├── drafting_agent.py
│   │   │   ├── compliance_guard_agent.py
│   │   │   └── update_case_status.py
│   │   ├── api/                       # API Handlers (presign, cases, health, reminders)
│   │   │   ├── presign_upload.py
│   │   │   ├── cases_handler.py
│   │   │   ├── health.py
│   │   │   └── reminder_handler.py
│   │   └── utils/                     # DynamoDB single-table helpers
│   │       └── db.py
│   └── scripts/                       # Setup & Seeder scripts
│       ├── seed_compliance_rules.py
│       └── setup_knowledge_base.py
└── frontend/                          # React + Vite + Tailwind SPA (Best UI Track)
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── components/
        │   ├── Header.jsx
        │   ├── CaseIntake.jsx
        │   ├── PipelineStepper.jsx
        │   ├── CaseResultView.jsx
        │   ├── Dashboard.jsx
        │   └── ArchitectureModal.jsx
        └── services/
            └── api.js
```

---

## 🚀 Quickstart & Local Development

### 1. Frontend SPA (Local Preview)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to interact with the UI, test 1-click demo presets, watch the Step Functions pipeline runner, and view generated legal notices.

### 2. Backend Infrastructure Deployment (AWS SAM)
```bash
cd backend
sam build
sam deploy --guided
```

### 3. Seed Compliance Rules & Knowledge Base
```bash
# Seed DynamoDB ComplianceRulesTable
python backend/scripts/seed_compliance_rules.py <ComplianceRulesTableName>

# Upload regulatory corpus to S3 for Bedrock Knowledge Base
python backend/scripts/setup_knowledge_base.py <KbCorpusBucketName> corpus/
```
