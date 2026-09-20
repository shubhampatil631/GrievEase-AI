# GrievEase AI — Architecture & Multi-Agent Design Specification

This document details the serverless multi-agent architecture, data flows, Step Functions state machine orchestration, Bedrock RAG vector retrieval, and DynamoDB single-table schema for **GrievEase AI**.

---

## 1. High-Level Multi-Agent Architecture

```mermaid
flowchart TD
    subgraph ClientLayer [Client & Edge Layer]
        Browser[👤 Complainant Web Browser]
        Amplify[AWS Amplify Global CDN Edge]
        Browser --> Amplify
    end

    subgraph IngestionLayer [API & Storage Layer]
        APIGW[Amazon API Gateway HTTP API v2]
        S3Evidence[(Amazon S3 Evidence Bucket)]
        Cognito[Amazon Cognito Auth User Pool]
        
        Browser -->|1. Pre-Signed PUT Bill Image| S3Evidence
        Browser -->|2. Ingest Case Payload| APIGW
        Browser -.->|JWT Auth| Cognito
    end

    subgraph StateMachineLayer [AWS Step Functions Orchestration]
        SFN{GrievEasePipeline State Machine}
        APIGW -->|3. StartExecution| SFN
        
        subgraph Agent1 [Agent 1: Intake Lambda]
            A1_Textract[Amazon Textract OCR]
            A1_Clean[Regex & Schema Normalization]
            A1_Textract --> A1_Clean
        end
        
        subgraph Agent2 [Agent 2: Classification Lambda]
            A2_KB[(Amazon Bedrock Knowledge Base: I9ZVRIM4C2)]
            A2_OS[(OpenSearch Serverless Vector Store)]
            A2_LLM[Claude 3 Haiku Forum Router]
            A2_KB --> A2_OS --> A2_LLM
        end

        subgraph Agent3 [Agent 3: Drafting Lambda]
            A3_Draft[Amazon Bedrock Claude 3 Haiku]
            A3_Notice[Statutory 15-Day Notice Synthesis]
            A3_Draft --> A3_Notice
        end

        subgraph Agent4 [Agent 4: Compliance Guard Lambda]
            A4_Rules[(DynamoDB: ComplianceRulesTable-dev)]
            A4_Guard[Pure Python Deterministic Guard]
            A4_Rules --> A4_Guard
        end

        SFN --> Agent1
        Agent1 --> Agent2
        Agent2 --> Agent3
        Agent3 --> Agent4
    end

    subgraph DataPersistenceLayer [Database & Event Notifications]
        Choice{Compliance Decision}
        Agent4 --> Choice

        DDB[(Amazon DynamoDB Single-Table: GrievEaseTable-dev)]
        EventBridge[Amazon EventBridge Scheduler]
        SES[Amazon SES Email Dispatch]

        Choice -->|✅ PASSED| MarkReady[Status = READY]
        Choice -->|❌ FAILED| MarkRejected[Status = REJECTED]

        MarkReady --> DDB
        MarkReady --> EventBridge
        EventBridge -->|3-Day Expiry Alert| SES
        MarkRejected --> DDB
    end

    DDB -.->|Telemetry & State Sync| Browser
```

---

## 2. AWS Step Functions State Machine (`pipeline.asl.json`)

The multi-agent pipeline is orchestrated via AWS Step Functions Standard Workflow. Each agent is isolated into its own execution state with exponential backoff and error catching:

```json
{
  "Comment": "GrievEase AI Multi-Agent Statutory Grievance Resolution Pipeline",
  "StartAt": "IntakeAgent",
  "States": {
    "IntakeAgent": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": {
        "FunctionName": "${IntakeAgentFunctionArn}",
        "Payload.$": "$"
      },
      "ResultSelector": { "intake.$": "$.Payload" },
      "ResultPath": "$.agentResults",
      "Next": "ClassificationAgent"
    },
    "ClassificationAgent": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": {
        "FunctionName": "${ClassificationAgentFunctionArn}",
        "Payload": {
          "caseId.$": "$.caseId",
          "category.$": "$.category",
          "normalizedText.$": "$.agentResults.intake.normalizedText"
        }
      },
      "ResultSelector": { "classification.$": "$.Payload" },
      "ResultPath": "$.agentResults.classification",
      "Next": "DraftingAgent"
    },
    "DraftingAgent": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": {
        "FunctionName": "${DraftingAgentFunctionArn}",
        "Payload": {
          "caseId.$": "$.caseId",
          "category.$": "$.category",
          "forum.$": "$.agentResults.classification.classification.forum",
          "normalizedText.$": "$.agentResults.intake.normalizedText"
        }
      },
      "ResultSelector": { "drafting.$": "$.Payload" },
      "ResultPath": "$.agentResults.drafting",
      "Next": "ComplianceGuardAgent"
    },
    "ComplianceGuardAgent": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": {
        "FunctionName": "${ComplianceGuardAgentFunctionArn}",
        "Payload": {
          "caseId.$": "$.caseId",
          "forum.$": "$.agentResults.classification.classification.forum",
          "deadline.$": "$.agentResults.classification.classification.deadline",
          "noticeText.$": "$.agentResults.drafting.drafting.noticeText"
        }
      },
      "ResultSelector": { "compliance.$": "$.Payload" },
      "ResultPath": "$.agentResults.compliance",
      "Next": "CheckCompliance"
    },
    "CheckCompliance": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.agentResults.compliance.compliance.status",
          "StringEquals": "PASSED",
          "Next": "UpdateStatusReady"
        }
      ],
      "Default": "UpdateStatusRejected"
    },
    "UpdateStatusReady": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": {
        "FunctionName": "${UpdateCaseStatusFunctionArn}",
        "Payload": {
          "caseId.$": "$.caseId",
          "status": "READY"
        }
      },
      "End": true
    },
    "UpdateStatusRejected": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": {
        "FunctionName": "${UpdateCaseStatusFunctionArn}",
        "Payload": {
          "caseId.$": "$.caseId",
          "status": "REJECTED"
        }
      },
      "End": true
    }
  }
}
```

---

## 3. Amazon Bedrock Knowledge Bases & Curated Corpus

Statutory grounding is backed by **Amazon Bedrock Knowledge Bases** (`I9ZVRIM4C2`) using **Amazon OpenSearch Serverless** vector search.

Curated regulatory corpus files stored in `corpus/` include:
1. `corpus/consumer-forum/filing-procedure.txt`: Consumer Protection Act 2019 e-Daakhil filing procedure & Sec 69 limitation provisions.
2. `corpus/consumer-forum/jurisdiction-thresholds.txt`: District, State, and National Consumer Commission pecuniary jurisdiction tiers.
3. `corpus/rbi-ombudsman/scheme-scope.txt`: Reserve Bank of India Integrated Ombudsman Scheme 2021 powers and covered banking entities.
4. `corpus/rbi-ombudsman/timelines.txt`: Mandatory 30-day turnaround time and zero liability unauthorized transaction rules.
5. `corpus/trai/escalation-process.txt`: Telecom Regulatory Authority of India 2-tier grievance escalation protocol.
6. `corpus/trai/grievance-categories.txt`: Tariff overbilling, billing dispute rebates, and broadband outage SLA compensation.

---

## 4. DynamoDB Single-Table Schema

All records and audit trails are consolidated into `GrievEaseTable-dev`:

| Entity | `PK` | `SK` | Key Attributes | `GSI1PK` / `GSI1SK` |
|---|---|---|---|---|
| **Case Record** | `CASE#<caseId>` | `META` | `userId`, `category`, `status`, `targetForum`, `deadline`, `legalDraft`, `extractedFields` | `USER#<userId>` / `<createdAt>` |
| **Stage Audit Log** | `CASE#<caseId>` | `STATUS#<isoTimestamp>` | `stage`, `resultSummary`, `timestamp`, `executionArn` | — |
| **Compliance Rule** | `RULE#<ruleId>` | `RULE_CONFIG` | `ruleName`, `maxLimitationDays`, `requiredFields`, `forbiddenKeywords` | — |

---

## 5. Security & Least Privilege Posture

- **IAM Isolation**:
  - `IntakeAgentFunction`: Limited to `textract:DetectDocumentText`, `s3:GetObject` on `EvidenceBucket`, and `dynamodb:PutItem`.
  - `ClassificationAgentFunction`: Limited to `bedrock:Retrieve`, `bedrock:InvokeModel`.
  - `DraftingAgentFunction`: Limited to `bedrock:InvokeModel`.
  - `ComplianceGuardAgentFunction`: **Zero Bedrock permissions**. Pure `dynamodb:GetItem` access to `ComplianceRulesTable`.
- **Zero Exposed Secrets**: All configuration passed via CloudFormation template environment parameters.
- **S3 Presigned Direct Uploads**: Upload URLs are scoped to 15-minute expiration with strict Content-Type constraints.
