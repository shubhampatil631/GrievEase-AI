# GrievEase AI — AWS-Native Autonomous Grievance Escalation Platform
### First Commit Hackathon (Bharat Builds Tour) — Execution-Ready Build Document

---

## 1. Project Overview & Pitch

**Title:** GrievEase — Autonomous Multi-Agent Grievance Escalation Engine

**Elevator Pitch:** GrievEase turns a photo of a bill or a two-line complaint into a legally structured, forum-correct escalation notice in under 60 seconds — routing it automatically to the right consumer forum, RBI Ombudsman, or TRAI channel. It replaces the hours an ordinary Indian citizen spends figuring out "who do I even complain to" with a single autonomous agent pipeline running entirely on AWS.

**The Problem:** Every year, millions of Indians face unresolved grievances — a defective e-commerce order, a wrongful bank charge, a telecom billing dispute — and give up simply because they don't know which authority handles it, what format the complaint must follow, or what deadlines apply. Consumer forums, RBI's Integrated Ombudsman Scheme, and TRAI each have different formats, jurisdictions, and escalation windows. This is a structural information-access problem, not a legal-complexity problem — and it is entirely solvable with an agentic pipeline plus a small compliance knowledge base.

**Target Persona:** Priya, 27, works in Sangli. Her e-commerce refund has been pending 45 days. She has WhatsApped the seller twice. She has no idea that after 30 days it becomes eligible for escalation to the National Consumer Helpline / e-Daakhil portal, and she doesn't know how to draft a formal notice. GrievEase asks her three questions, reads her uploaded screenshot, and hands her a ready-to-file notice plus the exact portal link and deadline.

**Practical Impact:** Reduces grievance-filing time from "hours of research + drafting" to under 2 minutes, and increases the odds a complaint is filed correctly the first time (right forum, right format, right deadline) — which is the single biggest reason genuine grievances get rejected on technicalities.

---

## 2. Cloud Architecture & AWS Ecosystem Integration

### 2.1 Design Principle
Every AWS service below is load-bearing — nothing is decorative. The judging rubric explicitly requires genuine, demonstrable AWS usage, so the architecture is built AWS-first rather than "AWS bolted on afterward." Per your note, the RAG/knowledge layer is built on **Amazon Bedrock Knowledge Bases** (native AWS RAG) instead of a self-hosted vector DB — this is both a stronger AWS-integration story for judges and less infra to babysit during the hackathon.

### 2.2 System Components

**Frontend**
- **React SPA** hosted on **AWS Amplify Hosting** — CI/CD straight from your GitHub repo, so every push auto-deploys. Gives you a live URL immediately (needed for Ship It).
- Upload widget (bill/screenshot) → uploads directly to S3 via a pre-signed URL (keeps your Lambda thin, avoids routing large files through API Gateway payload limits).

**API Layer**
- **Amazon API Gateway (HTTP API)** — single entry point, handles auth (Cognito authorizer), throttling, and routes to Lambda functions per agent.

**Agentic / AI Layer** (this is your differentiator — map your CrewAI/LangGraph experience onto native AWS orchestration)
- **AWS Step Functions (Standard Workflow)** — orchestrates the 4-agent pipeline as a state machine. This is your LangGraph experience translated into an AWS-native, judge-visible service (Step Functions has a visual execution graph — screenshots directly into your demo video and writeup).
- **AWS Lambda** — one function per agent:
  1. **Intake Agent** — parses OCR text from uploaded bill (via **Amazon Textract**) and normalizes the complaint text.
  2. **Classification Agent** — calls **Amazon Bedrock** (Claude or Titan model) with a retrieval step against **Bedrock Knowledge Bases** (which has ingested consumer-forum rules, RBI Ombudsman scope docs, TRAI grievance rules) to determine the correct forum and applicable deadline.
  3. **Drafting Agent** — calls **Amazon Bedrock** again with a forum-specific prompt template to generate the formal escalation notice text.
  4. **Compliance Guard Agent** — a deterministic Lambda (no LLM) that validates the draft against a rules table in DynamoDB (required fields present, deadline not expired, tone check) — mirrors your "MCP compliance guard" pattern, just implemented as a pure-Lambda validator so it's fast and demoable as "zero out-of-policy submissions."
- **Amazon Bedrock Knowledge Bases** — ingests a small curated corpus (PDFs/text of consumer forum jurisdiction rules, RBI Ombudsman scheme scope, TRAI complaint categories) stored in S3, auto-chunked and embedded by Bedrock, retrieved at query time. This *is* your RAG layer — fully AWS-native, no external vector DB needed.

**Data Layer**
- **Amazon DynamoDB** — case records (complaint ID, status, forum, deadline, draft text, audit trail). Single-table design: `PK = CASE#<id>`, `SK = STATUS#<timestamp>` for a natural audit history.
- **Amazon S3** — stores uploaded evidence (bills/screenshots) and the ingested knowledge-base corpus (two separate buckets/prefixes).

**Notifications / Tracking**
- **Amazon EventBridge** — on case-status-change events, triggers a reminder scheduler (e.g., "file before day 30").
- **Amazon SNS or SES** — sends the user their draft notice and deadline reminder by email.

**Auth**
- **Amazon Cognito** — user sign-up/login, issues JWTs consumed by API Gateway.

### 2.3 Data Flow (Narrative)
1. User uploads a bill/screenshot in the React app → gets a pre-signed S3 URL → uploads directly to S3.
2. Frontend calls API Gateway → triggers Step Functions execution.
3. Step Functions: Intake Lambda (Textract OCR) → Classification Lambda (Bedrock + Knowledge Base retrieval) → Drafting Lambda (Bedrock generation) → Compliance Guard Lambda (DynamoDB rules check).
4. Final case record written to DynamoDB; draft notice + forum + deadline returned to frontend.
5. EventBridge schedules a deadline reminder; SES emails the user the draft and next steps.

### 2.4 ASCII Architecture Diagram

```
                        ┌─────────────────────────┐
                        │   React SPA (Amplify)    │
                        │  upload / dashboard UI   │
                        └────────────┬─────────────┘
                                     │  (Cognito JWT)
                                     ▼
                        ┌─────────────────────────┐
                        │     API Gateway (HTTP)    │
                        └────────────┬─────────────┘
                                     │
                     ┌───────────────┴────────────────┐
                     │                                 │
                     ▼                                 ▼
         ┌───────────────────┐              ┌────────────────────┐
         │  Pre-signed S3 URL │              │  Start Step         │
         │  (evidence upload) │              │  Functions Execution │
         └─────────┬──────────┘              └──────────┬──────────┘
                   │                                     │
                   ▼                                     ▼
        ┌─────────────────────┐            ┌──────────────────────────────┐
        │   S3: evidence/      │            │   AWS STEP FUNCTIONS         │
        │   uploaded bills     │            │   (agent state machine)      │
        └─────────┬────────────┘            │                              │
                  │                          │  ┌────────────────────┐    │
                  │ Textract OCR             │  │ 1. Intake Agent     │    │
                  └─────────────────────────►│  │   (Lambda+Textract) │    │
                                             │  └─────────┬──────────┘    │
                                             │            ▼               │
                                             │  ┌────────────────────┐    │
                              ┌──────────────┼──┤ 2. Classification   │    │
                              │              │  │  Agent (Lambda +    │    │
                              │              │  │  Bedrock + KB)      │    │
                              │              │  └─────────┬──────────┘    │
                              │              │            ▼               │
        ┌─────────────────────▼─┐           │  ┌────────────────────┐    │
        │  Amazon Bedrock         │◄─────────┼──┤ 3. Drafting Agent   │    │
        │  Knowledge Bases        │           │  │  (Lambda + Bedrock) │    │
        │  (S3 corpus: forum      │           │  └─────────┬──────────┘    │
        │   rules, RBI/TRAI docs) │           │            ▼               │
        └─────────────────────────┘           │  ┌────────────────────┐    │
                                             │  │ 4. Compliance Guard  │    │
                                             │  │  (Lambda, rule check │    │
                                             │  │  vs DynamoDB rules)  │    │
                                             │  └─────────┬──────────┘    │
                                             └────────────┼───────────────┘
                                                          ▼
                                              ┌─────────────────────┐
                                              │  Amazon DynamoDB      │
                                              │  case records + audit │
                                              └──────────┬────────────┘
                                                          │
                                       ┌──────────────────┴──────────────────┐
                                       ▼                                     ▼
                          ┌─────────────────────┐              ┌─────────────────────┐
                          │  Amazon EventBridge   │              │  Amazon SES / SNS    │
                          │  (deadline scheduler)  │──────────► │  (email draft+alert)  │
                          └─────────────────────┘              └─────────────────────┘
```

### 2.5 Why Each Service is Strictly Necessary

| Service | Why it's non-negotiable |
|---|---|
| Amplify Hosting | Gives a live URL from a Git push — required for Ship It, zero manual deploy steps to demo |
| API Gateway | Single controlled entry point; enforces auth before any Lambda runs |
| Step Functions | Makes your multi-agent pipeline *visible* — the execution graph is a judge-legible proof of "genuine AWS orchestration," not just "we called an API" |
| Lambda | Serverless compute per agent — no servers to manage during a 4-day sprint |
| Amazon Textract | Turns a photo of a bill into usable text — without this, users must type everything manually, killing the core UX promise |
| Amazon Bedrock | The reasoning engine for classification + drafting — a managed foundation model call, not a self-hosted model, which is exactly what "Built on AWS" wants to see |
| Bedrock Knowledge Bases | Native AWS RAG — replaces a self-hosted vector DB with an AWS-managed retrieval layer, directly satisfying your instruction to prefer AWS services over external RAG |
| DynamoDB | Single-digit-ms case lookups, natural fit for the audit-trail access pattern | 
| S3 | Durable object storage for evidence and the KB corpus — required input for both Textract and Bedrock KB |
| Cognito | Auth without building your own user system |
| EventBridge + SES/SNS | Demonstrates a second AWS-native pipeline (event-driven reminders) beyond the core agent chain — extra "AWS depth" for judges |

---

## 3. Core Feature Set

### MVP (must work live by Sunday)
1. **Upload → OCR → Classify → Draft, end-to-end, one working case.** A user uploads a real bill/screenshot, the pipeline determines the correct forum (Consumer Forum / RBI Ombudsman / TRAI) and produces a properly formatted escalation notice.
2. **Step Functions execution visible in the AWS Console** with the agent pipeline clearly stepping through Intake → Classify → Draft → Compliance Guard — this becomes your money-shot screen recording.
3. **Case dashboard** (React + DynamoDB): shows case status, forum assigned, deadline, and the generated draft — this is also your Best UI angle.
4. **Compliance Guard rejection path** — deliberately show one case where the guard *catches* a problem (e.g., deadline expired, missing required field) and blocks submission. This single feature does more for "Idea and Impact" credibility than anything else — it proves the system isn't just an LLM wrapper.

### Stretch Goals (only after MVP is rock-solid)
1. **EventBridge-driven deadline reminder email** via SES — shows a second, independent AWS-native pipeline.
2. **Multi-language intake** (Bedrock can translate a Hindi/Marathi complaint before classification) — high impact for Bharat-wide relevance and genuinely differentiates the "Idea and Impact" score.

---

## 4. 72-Hour Rapid Build Roadmap

### Phase 1 — Day 1 (Thu, Sept 17): Foundations
- Create AWS account resources: S3 buckets (evidence, kb-corpus), DynamoDB table (single-table design), Cognito user pool.
- Provision API Gateway HTTP API + skeleton Lambda functions (stubbed responses) for all 4 agents.
- Wire a bare Step Functions state machine that chains the 4 stub Lambdas — get the *shape* working before the logic.
- Curate the knowledge-base corpus: 5–8 short documents covering (a) consumer forum jurisdiction thresholds, (b) RBI Ombudsman scope/timelines, (c) TRAI grievance categories. Upload to S3, create Bedrock Knowledge Base, sync.
- Set up the GitHub repo (public, from hour zero — repo history timing matters for the anti-plagiarism rule), connect to Amplify Hosting for auto-deploy.
- **End of Day 1 checkpoint:** empty React shell live on an Amplify URL; Step Functions runs end-to-end with dummy data.

### Phase 2 — Day 2 (Fri, Sept 18): Core Logic
- Implement Intake Agent: S3 event or direct call → Textract OCR → normalize text.
- Implement Classification Agent: Bedrock model call with Knowledge Base retrieval, prompt-engineered to output structured JSON (forum, deadline, confidence).
- Implement Drafting Agent: Bedrock call with a forum-specific prompt template producing the notice text.
- Implement Compliance Guard: DynamoDB-backed rules table + deterministic Lambda validator.
- Frontend: upload flow (pre-signed URL), trigger pipeline, poll/display result.
- **End of Day 2 checkpoint:** one real complaint goes from upload to a generated draft notice, end-to-end, even if the UI is rough.

### Phase 3 — Day 3 (Sat, Sept 19): Integration & Polish
- Build the case dashboard UI (status, forum, deadline, draft, audit trail) — this is your Best UI investment.
- Add the deliberate "guard rejection" demo case (craft a test complaint with an expired deadline or missing field).
- Handle edge cases: blurry image OCR failure, Bedrock timeout/retry, empty complaint text.
- If time allows: wire EventBridge + SES reminder as the first stretch goal.
- Run 4–5 full test cases end-to-end across different complaint types (e-commerce, banking, telecom) to build a demo-ready result set.
- **End of Day 3 checkpoint:** polished dashboard, 4–5 clean recorded test cases, guard-rejection case working.

### Phase 4 — Day 4 (Sun, Sept 20): Submission
- Repo cleanup: README (problem, architecture diagram, setup instructions, AWS services list, AI tools used per rules), MIT/Apache license, `.env.example`, no committed secrets.
- Record the 3-minute demo video (see storyboard below).
- Write the submission writeup: problem statement, what was built, exactly where AWS fits (be explicit and itemized — judges score this directly).
- Submit early in the day, then use remaining time only for safe polish — no last-minute risky changes since edits are allowed but a broken late edit is worse than an early clean submission.

---

## 5. Winning Demo & Submission Strategy

### 5.1 Demo Video Storyboard (3:00 total)

| Time | Scene | What to show | AWS visibility |
|---|---|---|---|
| 0:00–0:20 | Hook | State the problem in one line: "Priya's refund complaint has been ignored for 45 days and she doesn't know who to escalate to." | — |
| 0:20–0:50 | Live upload | Screen-record uploading a real bill screenshot in the deployed Amplify URL | Show the URL bar (Amplify domain) |
| 0:50–1:20 | Pipeline in action | Cut to AWS Console: Step Functions execution graph lighting up through Intake → Classify → Draft → Guard, in near real time | **Direct, unmistakable AWS proof** — this is the single most important shot for judges |
| 1:20–1:45 | Bedrock + Knowledge Base | Quick console shot of the Bedrock Knowledge Base sync + a snippet of the retrieved context used for classification | Shows genuine RAG, not a hardcoded if/else |
| 1:45–2:10 | Result | Back to the app: the generated notice, correct forum, deadline shown on the dashboard | — |
| 2:10–2:30 | Guard rejection case | Show the second test case where Compliance Guard blocks a bad draft — narrate "zero out-of-policy notices get through" | DynamoDB rules table quick glance |
| 2:30–2:50 | Architecture recap | 5-second cut to the architecture diagram, verbally list the AWS services used | Reinforces "Built on AWS" score |
| 2:50–3:00 | Close | One sentence on real-world impact + repo link on screen | — |

### 5.2 Writeup — Key Points to Hit
- **Problem framing**: lead with the specific persona and the specific failure mode (wrong forum / missed deadline), not a generic "grievances are hard" statement.
- **AWS itemization**: list every service used and its exact role in one line each (judges score "Built on AWS" directly, so make it impossible to miss).
- **Metrics to quote**: 
  - End-to-end processing time (upload → draft ready), e.g. "under 45 seconds."
  - Number of test cases run across categories (e-commerce / banking / telecom).
  - "Zero out-of-policy drafts released" from the Compliance Guard test.
- **AI tools disclosure**: list any AI coding assistants used during the build, per the rules' explicit requirement.
- **Learning callout**: name one concrete thing learned about Bedrock Knowledge Bases or Step Functions during the event — judging criterion 3 scores this directly, and it reads as authentic only if specific ("learned to tune the KB chunking strategy for short regulatory documents," not "learned a lot about AWS").
- **What changes for the user**: end the writeup with the concrete "before vs after" — hours of research and a likely rejected complaint vs. a 45-second, forum-correct draft.

### 5.3 Fast-Track Interview Angle
Since the Amazon fast-track shortlist draws from **top projects**, not necessarily prize winners, prioritize: a working end-to-end demo (Execution), an unmistakably real AWS pipeline (Built on AWS), and a problem judges immediately understand (Idea and Impact) over feature breadth. A single, bulletproof core loop with visible AWS orchestration outperforms a broader but shakier build for both track prizes and the interview shortlist.
