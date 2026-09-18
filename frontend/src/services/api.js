/**
 * API Service for GrievEase AI Frontend
 * Connects to AWS API Gateway HTTP API or falls back to high-fidelity live simulation
 */

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : "") || "";

// Pre-defined rich demo scenarios for instant judge walkthroughs
export const DEMO_PRESETS = [
  {
    id: "ecommerce_refund",
    title: "E-Commerce: Pending Refund (>45 Days)",
    category: "ECOMMERCE",
    badge: "Consumer Protection Act",
    complaintText: "Ordered a Samsung Smartphone (Order #AZ-884920) on 4th August 2026 for ₹28,499. The item was delivered defective and returned on 8th August 2026. The seller 'Apex Retail India' acknowledged receipt of return but has failed to initiate the refund despite 4 WhatsApp follow-ups and 2 email tickets over 45 days. Requesting full refund with statutory interest.",
    extractedOcr: "TAX INVOICE - APEX RETAIL INDIA PVT LTD\nInvoice No: INV-2026-99384\nOrder ID: AZ-884920\nDate: 04-08-2026\nItem: Samsung Galaxy M35 5G\nAmount Paid: INR 28,499.00 (Via UPI: 492039102931)\nStatus: Return Received - Refund In Process",
    targetForum: "CONSUMER_FORUM",
    portalName: "e-Daakhil / District Consumer Commission",
    portalUrl: "https://edaakhil.nic.in",
    statutoryActs: ["Consumer Protection Act 2019, Sec 2(47)", "Consumer Protection (E-Commerce) Rules 2020"],
    deadlineDays: 730,
    confidence: 0.96
  },
  {
    id: "rbi_banking",
    title: "Banking: Unauthorized UPI Debit (>30 Days No Reply)",
    category: "BANKING",
    badge: "RBI Ombudsman Scheme",
    complaintText: "On 12th July 2026, an unauthorized debit of ₹14,500 occurred from my Savings Account (A/c #XXXX4910) with HDFC Bank via UPI reference UTR-99382109. I immediately lodged a dispute with the bank's Branch Manager and Nodal Officer on 13th July 2026 (Ticket #BNK-44910). More than 30 days have elapsed without any resolution or provisional credit as mandated by RBI Harmonization TAT.",
    extractedOcr: "HDFC BANK DISPUTE ACKNOWLEDGEMENT\nComplaint Ref: BNK-44910\nDate of Lodgement: 13-07-2026\nA/c No: 501004910291\nTxn Date: 12-07-2026 | Amount: INR 14,500.00\nStatus: Pending Investigation with Fraud Desk",
    targetForum: "RBI_OMBUDSMAN",
    portalName: "RBI Complaint Management System (CMS)",
    portalUrl: "https://cms.rbi.org.in",
    statutoryActs: ["RBI Integrated Ombudsman Scheme 2021, Clause 10", "RBI Circular on Limiting Customer Liability in Unauthorized Electronic Banking"],
    deadlineDays: 365,
    confidence: 0.98
  },
  {
    id: "trai_telecom",
    title: "Telecom: Wrongful Fiber Bill & SLA Blackout",
    category: "TELECOM",
    badge: "TRAI Regulations",
    complaintText: "Broadband connection (Fiber ID: JIO-FBR-88392) suffered continuous downtime for 18 days in August 2026. Despite lodging Docket #TEL-88192 with customer care on 2nd August, no field engineer visited. Furthermore, the operator billed the full monthly rental of ₹1,499 plus wrongful late fees. 30 days have passed with Tier 1 customer care failing to provide statutory rebate.",
    extractedOcr: "JIO FIBER MONTHLY TAX INVOICE\nAccount Number: 8839201948\nDocket ID: TEL-88192 (Registered: 02-08-2026)\nBilling Period: 01-Aug-2026 to 31-Aug-2026\nDisputed Amount: INR 1,499.00\nService Status: Outage logged",
    targetForum: "TRAI",
    portalName: "TSP Appellate Authority / Sanchar Saathi",
    portalUrl: "https://sancharsaathi.gov.in",
    statutoryActs: ["TRAI Telecom Consumers Protection Regulations 2012", "TRAI Quality of Service (Broadband Service) Regulations"],
    deadlineDays: 30,
    confidence: 0.94
  },
  {
    id: "guard_reject_expired",
    title: "Deliberate Guard Test: Expired Statutory Limitation",
    category: "ECOMMERCE",
    badge: "Limitation Guard Test",
    isGuardRejectionDemo: true,
    complaintText: "Purchased laptop on 10th January 2023. Refund has been pending since February 2023 (over 3.5 years ago). Attempting to lodge a consumer dispute now.",
    extractedOcr: "TAX INVOICE - 10-01-2023\nOrder #LAP-9921\nAmount: INR 45,000\nDate: 10-01-2023",
    targetForum: "CONSUMER_FORUM",
    rejectionReason: "STATUTORY_DEADLINE_EXPIRED: The cause of action arose in February 2023 (>3.5 years ago). Section 69 of Consumer Protection Act 2019 strictly mandates a 2-year limitation period. Complaint is barred by limitation."
  }
];

export async function uploadEvidencePresigned(file) {
  if (!API_BASE_URL) {
    return {
      s3Key: `evidence/demo_user/${Date.now()}-${file.name}`,
      uploadUrl: "simulated_s3_url"
    };
  }
  
  const presignRes = await fetch(`${API_BASE_URL}/uploads/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName: file.name, contentType: file.type || "image/jpeg" })
  });
  const presignData = await presignRes.json();
  
  if (presignData.uploadUrl) {
    await fetch(presignData.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "image/jpeg" },
      body: file
    });
  }
  return presignData;
}

export async function createCase({ s3Key, complaintText, category, priority, userNotes, isGuardRejectionDemo }) {
  if (!API_BASE_URL) {
    const caseId = `c_${Math.random().toString(16).substring(2, 10)}`;
    return {
      caseId,
      status: "PROCESSING",
      executionArn: `arn:aws:states:ap-south-1:123456789012:execution:GrievEasePipeline:${caseId}`,
      createdAt: new Date().toISOString(),
      isGuardRejectionDemo
    };
  }

  const response = await fetch(`${API_BASE_URL}/cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ s3Key, complaintText, category, priority, userNotes })
  });
  return response.json();
}

export async function getCaseDetails(caseId) {
  if (!API_BASE_URL) return null;
  const response = await fetch(`${API_BASE_URL}/cases/${caseId}`);
  return response.json();
}

export async function updateCaseDetails(caseId, updates) {
  if (!API_BASE_URL) {
    return { message: "Case updated in local state", case: updates };
  }
  const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates)
  });
  return response.json();
}

export async function deleteCaseRecord(caseId) {
  if (!API_BASE_URL) {
    return { message: `Case ${caseId} archived successfully`, caseId, status: "ARCHIVED" };
  }
  const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
    method: "DELETE"
  });
  return response.json();
}

export async function getDashboardStats() {
  if (!API_BASE_URL) {
    return {
      userId: "demo_user_bharat",
      totalCases: 4,
      readyCount: 3,
      processingCount: 0,
      rejectedCount: 1,
      archivedCount: 0,
      forumDistribution: {
        CONSUMER_FORUM: 2,
        RBI_OMBUDSMAN: 1,
        TRAI: 1
      },
      successRate: 75.0,
      generatedAt: new Date().toISOString()
    };
  }
  const response = await fetch(`${API_BASE_URL}/cases/stats`);
  return response.json();
}

export async function listUserCases(filterParams = {}) {
  if (!API_BASE_URL) {
    // Return rich sample seeded case list for offline demo
    return [
      {
        caseId: "c_8f3a1b2c",
        status: "READY",
        forum: "CONSUMER_FORUM",
        category: "ECOMMERCE",
        complaintText: "Refund pending 45 days for order #AZ-884920 from Apex Retail. Defective Samsung M35 returned.",
        createdAt: "2026-09-18T09:15:00Z",
        deadline: "2028-08-04",
        claimAmount: "₹28,499.00",
        confidence: 0.96,
        auditTrail: [
          { stage: "INTAKE", result: "Textract extracted invoice INV-2026-99384", timestamp: "2026-09-18T09:15:02Z" },
          { stage: "CLASSIFICATION", result: "Bedrock RAG matched Consumer Protection Act 2019 Sec 2(47)", timestamp: "2026-09-18T09:15:05Z" },
          { stage: "DRAFTING", result: "Synthesized statutory demand notice for e-Daakhil", timestamp: "2026-09-18T09:15:08Z" },
          { stage: "COMPLIANCE_GUARD", result: "PASSED: Within 2-year limitation period. Mandatory fields verified.", timestamp: "2026-09-18T09:15:10Z" }
        ]
      },
      {
        caseId: "c_99e2a10b",
        status: "READY",
        forum: "RBI_OMBUDSMAN",
        category: "BANKING",
        complaintText: "Unauthorized UPI debit of ₹14,500. 30 days bank wait period elapsed without resolution.",
        createdAt: "2026-09-18T08:30:00Z",
        deadline: "2027-07-13",
        claimAmount: "₹14,500.00",
        confidence: 0.98,
        auditTrail: [
          { stage: "INTAKE", result: "HDFC Bank dispute acknowledgment logged", timestamp: "2026-09-18T08:30:02Z" },
          { stage: "CLASSIFICATION", result: "Routed to RBI Ombudsman Scheme 2021 (Clause 10)", timestamp: "2026-09-18T08:30:04Z" },
          { stage: "DRAFTING", result: "Formal grievance legal notice generated for Banking Ombudsman", timestamp: "2026-09-18T08:30:07Z" },
          { stage: "COMPLIANCE_GUARD", result: "PASSED: Statutory 30-day escalation requirement satisfied.", timestamp: "2026-09-18T08:30:09Z" }
        ]
      },
      {
        caseId: "c_4d7e9f1a",
        status: "READY",
        forum: "TRAI",
        category: "TELECOM",
        complaintText: "18-day continuous broadband outage with billing dispute and unaddressed Docket #TEL-88192.",
        createdAt: "2026-09-17T14:20:00Z",
        deadline: "2026-10-17",
        claimAmount: "₹1,499.00",
        confidence: 0.94,
        auditTrail: [
          { stage: "INTAKE", result: "Processed Telecom Tax Invoice and outage report", timestamp: "2026-09-17T14:20:02Z" },
          { stage: "CLASSIFICATION", result: "Routed to TSP Appellate Authority / Sanchar Saathi", timestamp: "2026-09-17T14:20:05Z" },
          { stage: "DRAFTING", result: "Structured SLA breach notice with statutory rebate demand", timestamp: "2026-09-17T14:20:08Z" },
          { stage: "COMPLIANCE_GUARD", result: "PASSED: Tier 1 escalation timeline verified.", timestamp: "2026-09-17T14:20:10Z" }
        ]
      },
      {
        caseId: "c_1a2b3c4d",
        status: "REJECTED",
        forum: "CONSUMER_FORUM",
        category: "ECOMMERCE",
        complaintText: "Old laptop dispute from February 2023 (>3.5 years old). Barred by limitation.",
        createdAt: "2026-09-17T07:45:00Z",
        rejectionReason: "STATUTORY_DEADLINE_EXPIRED: The cause of action arose in February 2023 (>3.5 years ago). Section 69 of Consumer Protection Act 2019 strictly mandates a 2-year limitation period. Complaint is barred by limitation.",
        guardResult: "FAILED",
        auditTrail: [
          { stage: "INTAKE", result: "Invoice parsed: purchase date 10-01-2023", timestamp: "2026-09-17T07:45:02Z" },
          { stage: "CLASSIFICATION", result: "Identified Consumer Protection Act jurisdiction", timestamp: "2026-09-17T07:45:04Z" },
          { stage: "COMPLIANCE_GUARD", result: "REJECTED: Statutory 2-year limitation exceeded by 18 months. Guard blocked drafting.", timestamp: "2026-09-17T07:45:06Z" }
        ]
      }
    ];
  }

  const query = new URLSearchParams(filterParams).toString();
  const url = `${API_BASE_URL}/cases${query ? `?${query}` : ''}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.cases || [];
}
