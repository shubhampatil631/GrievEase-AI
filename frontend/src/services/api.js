/**
 * API Service for GrievEase AI Frontend
 * Connects to AWS API Gateway HTTP API or falls back to high-fidelity live simulation
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

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
    deadlineDays: 365,
    confidence: 0.98
  },
  {
    id: "trai_telecom",
    title: "Telecom: Wrongful Fiber Bill & SLA Blackout",
    category: "TELECOM",
    badge: "TRAI Appellate Hierarchy",
    complaintText: "Broadband connection (Fiber ID: JIO-FBR-88392) suffered continuous downtime for 18 days in August 2026. Despite lodging Docket #TEL-88192 with customer care on 2nd August, no field engineer visited. Furthermore, the operator billed the full monthly rental of ₹1,499 plus wrongful late fees. 30 days have passed with Tier 1 customer care failing to provide statutory rebate.",
    extractedOcr: "JIO FIBER MONTHLY TAX INVOICE\nAccount Number: 8839201948\nDocket ID: TEL-88192 (Registered: 02-08-2026)\nBilling Period: 01-Aug-2026 to 31-Aug-2026\nDisputed Amount: INR 1,499.00\nService Status: Outage logged",
    targetForum: "TRAI",
    portalName: "TSP Appellate Authority / Sanchar Saathi",
    portalUrl: "https://sancharsaathi.gov.in",
    deadlineDays: 30,
    confidence: 0.94
  },
  {
    id: "guard_reject_expired",
    title: "Deliberate Guard Test: Expired Statutory Limitation",
    category: "ECOMMERCE",
    badge: "Compliance Guard Demo",
    isGuardRejectionDemo: true,
    complaintText: "Purchased laptop on 10th January 2023. Refund has been pending since February 2023 (over 3.5 years ago). Attempting to lodge a consumer dispute now.",
    extractedOcr: "TAX INVOICE - 10-01-2023\nOrder #LAP-9921\nAmount: INR 45,000\nDate: 10-01-2023",
    targetForum: "CONSUMER_FORUM",
    rejectionReason: "STATUTORY_DEADLINE_EXPIRED: The cause of action arose in February 2023 (>3.5 years ago). Section 69 of Consumer Protection Act 2019 strictly mandates a 2-year limitation period. Complaint is barred by limitation."
  }
];

export async function uploadEvidencePresigned(file) {
  if (!API_BASE_URL) {
    // Simulated upload for instant interactive demo
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

export async function createCase({ s3Key, complaintText, category, isGuardRejectionDemo }) {
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
    body: JSON.stringify({ s3Key, complaintText, category })
  });
  return response.json();
}

export async function getCaseDetails(caseId) {
  if (!API_BASE_URL) return null;
  const response = await fetch(`${API_BASE_URL}/cases/${caseId}`);
  return response.json();
}

export async function listUserCases() {
  if (!API_BASE_URL) {
    // Return sample seeded case list for offline demo
    return [
      {
        caseId: "c_8f3a1b2c",
        status: "READY",
        forum: "CONSUMER_FORUM",
        category: "ECOMMERCE",
        complaintText: "Refund pending 45 days for order #AZ-884920 from Apex Retail.",
        createdAt: "2026-09-17T09:15:00Z",
        deadline: "2028-08-04",
        confidence: 0.96
      },
      {
        caseId: "c_99e2a10b",
        status: "READY",
        forum: "RBI_OMBUDSMAN",
        category: "BANKING",
        complaintText: "Unauthorized UPI debit of ₹14,500. 30 days bank wait period elapsed.",
        createdAt: "2026-09-17T08:30:00Z",
        deadline: "2027-07-13",
        confidence: 0.98
      },
      {
        caseId: "c_1a2b3c4d",
        status: "REJECTED",
        forum: "CONSUMER_FORUM",
        category: "ECOMMERCE",
        complaintText: "Old laptop dispute from 2023 (>3.5 years old).",
        createdAt: "2026-09-17T07:45:00Z",
        rejectionReason: "STATUTORY_DEADLINE_EXPIRED",
        guardResult: "FAILED"
      }
    ];
  }
  const response = await fetch(`${API_BASE_URL}/cases`);
  const data = await response.json();
  return data.cases || [];
}
