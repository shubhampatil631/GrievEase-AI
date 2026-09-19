# GrievEase AI — Hackathon Demo Video Script & Walkthrough Guide

**Hackathon:** First Commit — Bharat Builds Tour (WeMakeDevs × AWS)  
**Track Focus:** *Ship It (1st Place) • Best UI (3rd Place) • Amazon Fast-Track Interview*  
**Strict Video Constraint:** ≤ 3 minutes (Target Duration: **2 minutes 45 seconds**)  
**Demo Document Used:** Real **Jio Fiber Monthly Tax Invoice** (`Docket ID: TEL-94302`, `Disputed: ₹2,499.00`)  
**Live Deployed URL:** `https://main.d1pngouj0au9lg.amplifyapp.com/`  
**GitHub Repository:** `https://github.com/shubhampatil631/GrievEase-AI`

---

## 📋 Hackathon Rule & Rubric Compliance Matrix

| Official Judging Criteria | Hackathon Requirement | Where It Appears in Video Script | Compliance Status |
|---|---|---|:---:|
| **1. Idea & Impact** | Solves a real-world problem affecting people | **Scene 1 (0:00–0:25)**: Tackling 4.8M unresolved Indian consumer grievances across Telecom, E-Commerce, and Banking. | ✅ **100% Compliant** |
| **2. Built on AWS** | Mandatory usage & visible on-screen AWS services | **Scene 3 & 5 (0:55–1:35 & 2:08–2:32)**: Step Functions, Bedrock Knowledge Bases + Claude 3, DynamoDB, API Gateway, S3, EventBridge, SES, Amplify. | ✅ **100% Compliant** |
| **3. Learning & Innovation** | What you learned during the build | **Scene 3 & 5 (1:20–1:35 & 2:08–2:32)**: Dual-agent architecture balancing generative drafting with deterministic legal guardrails to eliminate hallucinations. | ✅ **100% Compliant** |
| **4. Execution & Robustness** | Working software with live execution | **Scene 2 & 3 (0:25–1:35)**: Live OCR invoice scan of Jio Fiber bill, speech input visualizer, live Step Functions execution, 4-in-1 Notice Studio. | ✅ **100% Compliant** |
| **5. Demo Video Time Limit** | Must be ≤ 3:00 minutes (180 seconds) | **Total Duration: 2 minutes 45 seconds** (includes 15-second safety buffer). | ✅ **100% Compliant** |

---

## ⏱ Scene Timing Breakdown (Total: 2m 45s)

| Scene | Timestamp | Duration | Section Name | Key Visual / Action |
|:---:|:---:|:---:|:---|:---|
| **1** | 0:00 – 0:25 | 25s | **Hook & Problem** | Dark Bento Dashboard with live KPIs, 4.8M unresolved consumer complaints. |
| **2** | 0:25 – 0:55 | 30s | **Live Multimodal Intake & OCR** | Upload real **Jio Fiber Invoice**, laser scan animation, auto tag extraction (`TEL-94302`, `₹2,499.00`), voice input. |
| **3** | 0:55 – 1:35 | 40s | **Step Functions Multi-Agent Engine** | Live pipeline stepper with 4 Lambda agents, Amazon Bedrock RAG, Claude 3 drafting. |
| **4** | 1:35 – 2:08 | 33s | **4-in-1 Notice Studio & Guardrails** | Formal Letterhead mode, Before/After diff, Scenario 4 Section 69 limitation block. |
| **5** | 2:08 – 2:32 | 24s | **AWS Cloud Architecture & Learnings** | Cloud Architecture modal (`Ctrl+K`), DynamoDB Single-Table JSON telemetry & architectural takeaways. |
| **6** | 2:32 – 2:45 | 13s | **Impact & Closing** | Summary of Bharat impact, AWS Serverless stack, thank you splash screen. |

---

## 🎬 Complete Scene-by-Scene Recording Script

### Scene 1: The Problem & The Solution (0:00 – 0:25)

> 🖥️ **Screen Action:**
> - Start full-screen on the GrievEase AI Dashboard (`https://main.d1pngouj0au9lg.amplifyapp.com/`).
> - Hover over top KPI cards: *Active Escalations: 12*, *Avg SLA: 42s*, *Statutory Grounding: 100%*.
> - Ensure high-contrast dark theme and clean browser window (F11 or full screen).

**🎙️ Voiceover:**
> *"Every year in India, over 4.8 million consumer grievances remain unresolved. When telecom providers charge for weeks of internet downtime, e-commerce platforms refuse refunds, or banks ignore unauthorized debits, citizens face complex jurisdiction rules, missed limitation deadlines, and weak informal emails that corporate nodal desks simply ignore.*
>
> *Meet **GrievEase AI** — an autonomous multi-agent grievance escalation engine built entirely on AWS Serverless and Amazon Bedrock that converts raw consumer complaints and bill images into legally enforceable statutory notices in under 45 seconds."*

---

### Scene 2: Real Document OCR & Multimodal Intake (0:25 – 0:55)

> 🖥️ **Screen Action:**
> - Click the **"New Case Intake"** button in the header.
> - Drag & drop or upload your **Jio Fiber Monthly Tax Invoice** (`Account No: 9120485610`, `Docket: TEL-94302`).
> - Point cursor at the **laser sweep animation** and live OCR progress bar.
> - Highlight dynamic pill tags appearing automatically: `Reliance Jio Infocomm Limited`, `Docket: TEL-94302`, `Amount: ₹2,499.00`, `Cycle: 01-Nov-2026 to 30-Nov-2026`.
> - Click the **Microphone Icon** for 2 seconds to show the real-time audio waveform visualizer.

**🎙️ Voiceover:**
> *"Let's test with a real bill: A Jio Fiber monthly tax invoice with a disputed charge of ₹2,499 following a 12-day continuous broadband outage.*
> 
> *When we upload the invoice, our multimodal intake runs real-time document OCR — extracting the corporate entity Reliance Jio Infocomm Limited, Docket ID TEL-94302, and disputed amount of ₹2,499 directly from bill pixels without any manual entry. Users can also dictate their grievance in Hinglish or regional languages using real-time voice recognition."*

---

### Scene 3: AWS Step Functions & Bedrock Multi-Agent Engine (0:55 – 1:35)

> 🖥️ **Screen Action:**
> - Click the glowing **"⚡ Launch Autonomous Pipeline"** button.
> - Watch the **Live Pipeline Stepper** advance across all 4 stages with pulse glow and millisecond timers:
>   1. `Intake Agent` (Textract & Evidence Validation in S3) $\rightarrow$ **Completed in 840ms**
>   2. `Classification Agent` (Amazon Bedrock Knowledge Base RAG) $\rightarrow$ **Completed in 1,420ms**
>   3. `Drafting Agent` (Bedrock Claude 3 Haiku) $\rightarrow$ **Completed in 2,100ms**
>   4. `Compliance Guard` (Pure Python Deterministic Policy Engine) $\rightarrow$ **Completed in 310ms**

**🎙️ Voiceover:**
> *"Under the hood, an **AWS Step Functions state machine** coordinates four specialized serverless agents:
> 
> 1. The **Intake Agent** validates and normalizes evidence stored securely in Amazon S3.
> 2. The **Classification Agent** queries an **Amazon Bedrock Knowledge Base** backed by **OpenSearch Serverless**, automatically mapping this broadband dispute to TRAI Quality of Service and Consumer Protection Regulations.
> 3. The **Drafting Agent** prompts **Claude 3 on Amazon Bedrock** to compose a formal statutory escalation with strict 15-day cure notices and mandated rebate calculations.
> 4. Finally, our **Compliance Guard** runs deterministic Python policy checks to verify that every statutory citation is legally grounded with zero hallucinations."*

---

### Scene 4: 4-in-1 Notice Studio & Deterministic Guardrails (1:35 – 2:08)

> 🖥️ **Screen Action:**
> - Automatically transitions to **Notice Studio**.
> - Click tab **"Formal Letterhead Mode"**: Show the crisp white typography, statutory header, and official watermark.
> - Click tab **"Before / After Diff"**: Show raw informal text on the left vs. pristine legal notice on the right.
> - Click **"New Case"** $\rightarrow$ select **"Demo Scenario 4: Expired 3.5-Year Claim"** $\rightarrow$ Click Run.
> - Show the red **Guardrail Interception Banner** (*"REJECTED: Exceeds Section 69 730-day statutory limitation period"*).

**🎙️ Voiceover:**
> *"The output is rendered in our **4-in-1 Notice Studio**.
> 
> In **Letterhead Mode**, users get a formal legal document formatted for India's TSP Appellate Authority and e-Daakhil filing. The **Before-After Diff** demonstrates how raw frustration is transformed into statutory precision.
> 
> Notice what happens if a user submits an expired claim from 3.5 years ago in Scenario 4: our deterministic guardrail immediately intercepts and blocks it under Section 69 limitation rules, protecting users from filing legally flawed claims."*

---

### Scene 5: AWS Cloud Architecture & Key Learnings (2:08 – 2:32)

> 🖥️ **Screen Action:**
> - Press `Ctrl+K` (or click Command Bar) $\rightarrow$ click **"View Cloud Architecture"**.
> - Show the interactive AWS architecture modal displaying API Gateway, Step Functions, DynamoDB, Bedrock, and SES.
> - Switch to the **AWS JSON Telemetry** tab in Notice Studio to show the live DynamoDB single-table payload.

**🎙️ Voiceover:**
> *"GrievEase AI is deployed cloud-native on AWS:
> - **HTTP API Gateway v2** with sub-50ms latency.
> - **DynamoDB Single-Table Design** handling cases, audit logs, and compliance rules.
> - **Amazon EventBridge & SES** for automated limitation countdown alerts on **AWS Amplify**.
> 
> Our biggest technical learning was orchestrating Step Functions with Bedrock RAG — proving that pairing generative LLMs with deterministic policy guardrails produces production-ready legal reliability."*

---

### Scene 6: Impact & Closing (2:32 – 2:45)

> 🖥️ **Screen Action:**
> - Return to main Dashboard view showing the live Amplify URL in address bar.
> - Display closing end card: *GrievEase AI — Democratizing Statutory Justice for 1.4 Billion Citizens on AWS*.

**🎙️ Voiceover:**
> *"By uniting AWS Step Functions, Amazon Bedrock Knowledge Bases, and deterministic guardrails, GrievEase AI turns a grueling legal process into a 45-second autonomous resolution.
> 
> Built for Bharat, powered by AWS. Thank you!"*

---

## 🛠️ Recording Setup & High-Score Checklist

1. **Resolution**: Record at **1080p (1920×1080) at 60 FPS**.
2. **Audio Quality**: Ensure clear audio with zero background noise.
3. **Browser**: Chrome/Edge in Full Screen (`F11`), zoom level at 100% or 110%.
4. **Live Deployed URL**: `https://main.d1pngouj0au9lg.amplifyapp.com/`
5. **Bill Image to Drop**: Use your **Jio Fiber Monthly Tax Invoice** (`TEL-94302`, `INR 2,499.00`).
