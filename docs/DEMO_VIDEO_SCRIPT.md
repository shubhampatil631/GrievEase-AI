# GrievEase AI — Hackathon Demo Video Script & Walkthrough Guide

**Hackathon:** First Commit — Bharat Builds Tour (WeMakeDevs × AWS)  
**Track Focus:** *Ship It (1st Place) • Best UI (3rd Place) • Amazon Fast-Track Interview*  
**Strict Video Constraint:** ≤ 3 minutes (Target Duration: **2 minutes 52 seconds**)  
**Live Deployed URL:** `https://main.d1pngouj0au9lg.amplifyapp.com/`  
**GitHub Repository:** `https://github.com/shubhampatil631/GrievEase-AI`

---

## 📋 Hackathon Rule & Rubric Compliance Matrix

| Official Judging Criteria | Hackathon Requirement | Where It Appears in Video Script | Compliance Status |
|---|---|---|:---:|
| **1. Idea & Impact** | Solves a real-world problem affecting people | **Scene 1 (0:00–0:25)**: Tackling 4.8M unresolved Indian consumer grievances across E-Commerce, Banking, and Telecom. | ✅ **100% Compliant** |
| **2. Built on AWS** | Mandatory usage & visible on-screen AWS services | **Scene 3, 5 & 6 (0:50–2:42)**: Step Functions, Bedrock Knowledge Bases + Claude 3, DynamoDB Single-Table, API Gateway, S3, EventBridge, SES, Amplify. | ✅ **100% Compliant** |
| **3. Learning & Innovation** | What you learned during the build | **Scene 5 (2:05–2:25)**: Orchestrating serverless multi-agent pipelines with deterministic guardrails to prevent hallucinations. | ✅ **100% Compliant** |
| **4. Execution & Robustness** | Working software with live execution | **Scene 2, 3, 4 & 6 (0:25–2:42)**: Live OCR invoice scan, speech visualizer, 4-in-1 Notice Studio, and live DynamoDB stored records hub. | ✅ **100% Compliant** |
| **5. Demo Video Time Limit** | Must be ≤ 3:00 minutes (180 seconds) | **Total Duration: 2 minutes 52 seconds** (includes 8-second safety buffer). | ✅ **100% Compliant** |

---

## ⏱ Scene Timing Breakdown (Total: 2m 52s)

| Scene | Timestamp | Duration | Section Name | Key Visual / Action |
|:---:|:---:|:---:|:---|:---|
| **1** | 0:00 – 0:25 | 25s | **Hook & Problem** | Dark Bento Dashboard with live KPIs, 4.8M unresolved consumer complaints. |
| **2** | 0:25 – 0:50 | 25s | **Live Multimodal Intake & OCR** | Upload `sample_apex_invoice.jpg`, laser scan animation, auto tag extraction, voice input. |
| **3** | 0:50 – 1:30 | 40s | **Step Functions Multi-Agent Engine** | Live pipeline stepper with 4 Lambda agents, Amazon Bedrock RAG, Claude 3 drafting. |
| **4** | 1:30 – 2:05 | 35s | **4-in-1 Notice Studio & Guardrails** | Formal Letterhead mode, Before/After diff, Scenario 4 Section 69 limitation block. |
| **5** | 2:05 – 2:25 | 20s | **AWS Cloud Architecture & Scale** | Cloud Architecture modal (`Ctrl+K`), interactive AWS architecture blueprint & live telemetry. |
| **6** | 2:25 – 2:42 | 17s | **DynamoDB Stored Case Records Hub** | Return to Dashboard, showcase stored case history, category filters, and expand live audit trail. |
| **7** | 2:42 – 2:52 | 10s | **Impact & Closing** | Democratizing statutory justice for 1.4B citizens on AWS Serverless. |

---

## 🎬 Complete Scene-by-Scene Recording Script

### Scene 1: The Problem & The Solution (0:00 – 0:25)

> 🖥️ **Screen Action:**
> - Start full-screen on the GrievEase AI Dashboard (`https://main.d1pngouj0au9lg.amplifyapp.com/`).
> - Hover over top KPI cards: *Active Escalations: 12*, *Avg SLA: 42s*, *Statutory Grounding: 100%*.
> - Ensure high-contrast dark theme and clean browser window (F11 or full screen).

**🎙️ Voiceover:**
> *"Over 4.8 million consumer grievances in India go unresolved annually because citizens struggle with complex legal jurisdictions and weak informal emails.*
>
> *Meet **GrievEase AI** — an autonomous multi-agent engine on AWS that turns raw complaints and invoice photos into legally enforceable statutory notices in under 45 seconds."*

---

### Scene 2: Real Document OCR & Multimodal Intake (0:25 – 0:50)

> 🖥️ **Screen Action:**
> - Click the **"New Case Intake"** button in the header.
> - Click preset button **"Demo Scenario 1: E-Commerce Refund (>45d)"** (or drag & drop `sample_apex_invoice.jpg`).
> - Point cursor at the **laser sweep animation** and live OCR progress bar.
> - Highlight dynamic pill tags appearing automatically: `Apex Retail India Pvt Ltd`, `Order: #AZ-884920`, `Amount: ₹28,499.00`, `Date: 04-Aug-2026`.
> - Click the **Microphone Icon** for 2 seconds to show the real-time audio waveform visualizer.

**🎙️ Voiceover:**
> *"Let's demonstrate Scenario 1: A consumer whose refund for a ₹28,499 smartphone has been stonewalled for 45 days.
> 
> When we upload the invoice, our multimodal intake runs real document OCR — extracting the merchant entity, invoice number, and exact disputed amount directly from bill pixels. Users can also dictate their grievance in Hinglish or regional languages with real-time speech transcription."*

---

### Scene 3: AWS Step Functions & Bedrock Multi-Agent Engine (0:50 – 1:30)

> 🖥️ **Screen Action:**
> - Click the glowing **"⚡ Execute Multi-Agent Pipeline"** button.
> - Watch the **Live Pipeline Stepper** advance across all 4 stages with pulse glow and millisecond timers:
>   1. `Intake Agent` (Textract & Evidence Validation in S3) $\rightarrow$ **Completed in 840ms**
>   2. `Classification Agent` (Amazon Bedrock Knowledge Base RAG) $\rightarrow$ **Completed in 1,420ms**
>   3. `Drafting Agent` (Bedrock Claude 3 Haiku) $\rightarrow$ **Completed in 2,100ms**
>   4. `Compliance Guard` (Pure Python Deterministic Policy Engine) $\rightarrow$ **Completed in 310ms**

**🎙️ Voiceover:**
> *"Under the hood, an **AWS Step Functions state machine** coordinates four specialized serverless agents:
> 
> 1. The **Intake Agent** validates and normalizes evidence stored securely in Amazon S3.
> 2. The **Classification Agent** queries an **Amazon Bedrock Knowledge Base** backed by **OpenSearch Serverless**, grounding the grievance in the Consumer Protection Act 2019 and TRAI regulations.
> 3. The **Drafting Agent** prompts **Claude 3 on Amazon Bedrock** to compose a formal statutory notice with precise penal citations, interest claims, and a 15-day cure notice.
> 4. Finally, our **Compliance Guard** runs deterministic Python policy checks to verify that every statutory citation is legally grounded with zero hallucinations."*

---

### Scene 4: 4-in-1 Notice Studio & Deterministic Guardrails (1:30 – 2:05)

> 🖥️ **Screen Action:**
> - Automatically transitions to **Notice Studio**.
> - Click tab **"Formal Letterhead Mode"**: Show the crisp white typography, statutory header, and official watermark.
> - Click tab **"Before / After Diff"**: Show raw informal text on the left vs. pristine legal notice on the right.
> - Click **"New Case"** $\rightarrow$ select **"Demo Scenario 4: Expired 3.5-Year Claim"** $\rightarrow$ Click Run.
> - Show the red **Guardrail Interception Banner** (*"REJECTED: Exceeds Section 69 730-day statutory limitation period"*).

**🎙️ Voiceover:**
> *"The output is rendered in our **4-in-1 Notice Studio**.
> 
> In **Letterhead Mode**, users get a formal legal document formatted for India's e-Daakhil consumer court filing. The **Before-After Diff** demonstrates how raw emotion is transformed into legal precision.
> 
> Notice what happens if a user submits an expired claim from 3.5 years ago in Scenario 4: our deterministic guardrail immediately intercepts and blocks it under Section 69 limitation rules, protecting users from filing legally flawed claims."*

---

### Scene 5: AWS Cloud Architecture & Key Learnings (2:05 – 2:25)

> 🖥️ **Screen Action:**
> - Press `Ctrl+K` (or click Command Bar) $\rightarrow$ click **"View Cloud Architecture"**.
> - Show the interactive AWS architecture modal displaying API Gateway, Step Functions, DynamoDB, Bedrock, and SES.

**🎙️ Voiceover:**
> *"GrievEase AI is deployed cloud-native on AWS:
> - **HTTP API Gateway v2** with sub-50ms latency.
> - **DynamoDB Single-Table Design** handling cases, audit logs, and compliance rules.
> - **Amazon EventBridge & SES** for automated limitation countdown alerts on **AWS Amplify**.
> 
> Our key learning was orchestrating Step Functions with Bedrock RAG — proving that pairing generative LLMs with deterministic policy guardrails produces production-ready legal reliability."*

---

### Scene 6: DynamoDB Stored Case Records Hub & Audit Trail (2:25 – 2:42)

> 🖥️ **Screen Action:**
> - Close the modal and navigate to the **Dashboard / Dossier Hub**.
> - Scroll down to show the **live list of stored case records**:
>   - Highlight case cards with badges: `Case ID (c_7bb19b36)`, `STATUS: READY`, `Category: ECOMMERCE`, `Claim: ₹28,499.00`, `Forum: CONSUMER_FORUM`.
> - Click the **"Audit Trail"** button on one case to expand the chronological Step Functions execution timestamps and compliance verification history.
> - Click on a stored case card to show that it instantly reloads the complete generated dossier!

**🎙️ Voiceover:**
> *"All processed escalations are stored persistently in our **DynamoDB Single-Table Dossier Hub**.
> 
> Users and legal officers can filter cases by sector, search by transaction ID, and expand the complete chronological **Audit Trail** showing every timestamped Step Functions state transition and compliance check. Any past dossier can be re-opened, downloaded, or dispatched with a single click."*

---

### Scene 7: Impact & Closing (2:42 – 2:52)

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
5. **Quick Verification**: Pre-load tabs so there are zero network hiccups during the recording.
