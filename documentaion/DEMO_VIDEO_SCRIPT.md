# GrievEase AI — 3-Minute Demo Video Script & Walkthrough

**First Commit — Bharat Builds Tour (WeMakeDevs × AWS)**  
**Track Focus:** *Ship It (1st Place) • Best UI/UX Standard • Amazon Fast-Track Interview*  
**Target Video Duration:** 2 minutes 50 seconds (under the mandatory 3-minute limit)

---

## 🎬 Video Overview & Timing Structure

| Section | Timestamp | Duration | Key Focus / Visual |
|---|---|---|---|
| **1. Hook & Problem** | 0:00 – 0:25 | 25s | 4.8M unresolved consumer complaints, jurisdiction chaos, Section 69 limitation bar. |
| **2. Solution & Live OCR Intake** | 0:25 – 0:55 | 30s | Live bill upload (`sample_apex_invoice.jpg`), real-time laser OCR scan, dynamic tag extraction, voice input. |
| **3. Step Functions Multi-Agent Engine** | 0:55 – 1:35 | 40s | Live visual state machine stepper, 4 Lambda agents, Bedrock Knowledge Base RAG, Claude 3 drafting. |
| **4. 4-in-1 Notice Studio & Guardrails** | 1:35 – 2:10 | 35s | Letterhead mode, Before/After diff, Scenario 4 deterministic guardrail block (Section 69 zero hallucination). |
| **5. AWS Cloud Architecture & Scale** | 2:10 – 2:35 | 25s | Cloud architecture modal, DynamoDB single-table telemetry, live API Gateway & Amplify deployment. |
| **6. Impact & Closing** | 2:35 – 2:50 | 15s | Democratizing statutory justice for 1.4B citizens on AWS Serverless. |

---

## 🎙 Scene-by-Scene Script & Recording Guide

### **Scene 1: The Hook & The Broken Reality (0:00 – 0:25)**

> **Visual on Screen:**
> - Start full-screen on the GrievEase AI Dashboard (`http://localhost:5173` or Live Amplify URL).
> - Show the obsidian dark Bento dashboard with live KPIs: *"Active Escalations: 12", "Statutory SLA Adherence: 98.4%", "Avg Turnaround: 42s"*.

**Voiceover Narration:**
> *"Every year in India, over 4.8 million consumer grievances go unaddressed. When an e-commerce platform refuses a refund, a bank ignores an unauthorized UPI debit, or a telecom provider suffers a multi-week outage, everyday citizens face jurisdiction confusion, missed limitation deadlines, and weak informal emails that corporate nodal desks simply ignore.*  
> *Meet **GrievEase AI** — an autonomous multi-agent grievance escalation engine built entirely on AWS Serverless and Amazon Bedrock that turns raw consumer complaints into legally enforceable statutory notices in under 45 seconds."*

---

### **Scene 2: Real Document OCR & Multimodal Intake (0:25 – 0:55)**

> **Visual on Screen:**
> - Click on **"New Case Intake"**.
> - Click on **"Demo Scenario 1: E-Commerce Refund (>45d)"** or drag & drop `sample_bills/sample_apex_invoice.jpg`.
> - Show the **real-time laser sweep scanning animation** and live Tesseract / Textract progress bar.
> - Point out the dynamic entity pill tags appearing automatically: `Merchant: Apex Retail`, `Order: #AZ-884920`, `Amount: ₹28,499.00`.
> - Tap the **Speech Input button** to show the real-time Web Speech audio wave visualizer.

**Voiceover Narration:**
> *"Let's test Scenario 1: An unfulfilled Samsung smartphone return pending for 45 days.  
> We upload our tax invoice. Notice the real-time document OCR scanner in action — extracting the exact invoice number, merchant name, and disputed amount of ₹28,499 directly from bill pixels with zero hardcoded values. Users can also speak their complaint in any language with live audio waveform visualization."*

---

### **Scene 3: AWS Step Functions & Multi-Agent Execution (0:55 – 1:35)**

> **Visual on Screen:**
> - Click **"⚡ Execute Multi-Agent Pipeline"**.
> - Show the **Live Pipeline Stepper** activating step by step with pulse animations and live logs:
>   1. `Intake Agent` (Textract & Whitespace Normalization) $\rightarrow$ **Completed in 840ms**
>   2. `Classification Agent` (Amazon Bedrock Knowledge Base RAG) $\rightarrow$ **Completed in 1,420ms**
>   3. `Drafting Agent` (Bedrock Claude 3 Haiku) $\rightarrow$ **Completed in 2,100ms**
>   4. `Compliance Guard` (Pure Python Deterministic Policy Engine) $\rightarrow$ **Completed in 310ms**

**Voiceover Narration:**
> *"Under the hood, an **AWS Step Functions state machine** coordinates four specialized serverless agents:  
> 1. The **Intake Agent** normalizes facts and validates evidence in S3.  
> 2. The **Classification Agent** queries an **Amazon Bedrock Knowledge Base** backed by **OpenSearch Serverless**, grounding the case in the Consumer Protection Act 2019 and calculating statutory limitation windows.  
> 3. The **Drafting Agent** invokes **Claude 3 on Amazon Bedrock** to draft a formal legal demand with statutory citations and a strict 15-day cure window.  
> 4. Finally, our **Compliance Guard** executes pure Python deterministic policy checks to ensure zero hallucinations and absolute legal grounding."*

---

### **Scene 4: The 4-in-1 Notice Studio & Deterministic Guardrails (1:35 – 2:10)**

> **Visual on Screen:**
> - The screen transitions smoothly to the **Notice Studio**.
> - Switch to **"Formal Letterhead Mode"**: Show the official stamp, citation badges (`CPA 2019 Sec 2(47)`, `e-Daakhil Ready`), and print button.
> - Switch to **"Before / After Diff"**: Highlight raw unstructured input on the left vs. pristine statutory draft on the right.
> - Quick trigger **"Scenario 4: Expired 3.5-Year Claim"** from presets $\rightarrow$ Click Run $\rightarrow$ Show the **Compliance Guardrail Block** banner (*"REJECTED: Exceeds Section 69 730-day statutory limitation"*).

**Voiceover Narration:**
> *"Here is the synthesized legal dossier in our **4-in-1 Notice Studio**.  
> In **Letterhead Mode**, complainants get a print-ready legal document formatted for e-Daakhil filing. The **Before-After Diff** showcases how raw frustration is transformed into statutory precision.  
> Crucially, if a user submits an expired claim — like our Scenario 4 test from 3.5 years ago — our deterministic Compliance Guard immediately intercepts it, preventing illegal filings without relying on unpredictable LLM decisions."*

---

### **Scene 5: Production AWS Architecture & Live Cloud Scale (2:10 – 2:35)**

> **Visual on Screen:**
> - Press `Cmd+K` / `Ctrl+K` to open the **Command Palette**, then select **"View Cloud Architecture"**.
> - Briefly showcase the interactive architecture modal and highlight the live deployed endpoints table.
> - Switch to the terminal for 3 seconds and show `py -3 run_all_terminal_tests.py` passing **37/37 tests (100%)**.

**Voiceover Narration:**
> *"GrievEase AI is 100% deployed and live on AWS:  
> - **HTTP API Gateway v2** with sub-50ms latency  
> - **Cognito User Pools** for JWT auth  
> - **DynamoDB Single-Table Design** storing cases, audit history, and guardrail rules  
> - **Amazon EventBridge & SES** for automatic 3-day limitation countdown alerts  
> - And our entire test suite of **37 automated backend and frontend tests passes with 100% success**."*

---

### **Scene 6: Impact & Closing (2:35 – 2:50)**

> **Visual on Screen:**
> - Return to the main Dashboard view with the live Amplify URL visible in the browser address bar.
> - Display closing splash: *GrievEase AI — Empowering 1.4 Billion Consumers on AWS*.

**Voiceover Narration:**
> *"By uniting AWS Step Functions, Bedrock Knowledge Bases, and deterministic guardrails, GrievEase AI transforms consumer grievance escalation from a months-long legal ordeal into a 45-second autonomous workflow.  
> Built for Bharat, powered by AWS. Thank you!"*

---

## 💡 Practical Recording Tips for 1st Place Execution

1. **Resolution & Scaling**: Record in **1080p (1920x1080) at 60 FPS**. Set browser zoom to 100% or 110% so fonts are crystal clear.
2. **Audio Quality**: Use a clear microphone with background noise reduction. Maintain a confident, steady, energetic pace.
3. **Pacing**: Follow the script timings closely. If any section runs long, trim pauses between clicks.
4. **Live Artifacts to Have Ready**:
   - Web browser open to `http://localhost:5173` or `https://main.d1pngouj0au9lg.amplifyapp.com/`.
   - Sample bills folder open (`sample_bills/sample_apex_invoice.jpg`).
   - Terminal window ready to show `py -3 run_all_terminal_tests.py`.
