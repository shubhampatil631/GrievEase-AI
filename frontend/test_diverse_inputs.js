/**
 * GrievEase AI — Comprehensive Frontend Diverse Inputs & Bill Scenarios Monitor
 * Tests frontend entity extraction, noisy user language, missing evidence placeholders, and real image scans.
 */

import { extractFieldsFromGrievance, detectCategoryFromText } from './src/utils/extractors.js';
import Tesseract from 'tesseract.js';
import path from 'path';

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const MAGENTA = "\x1b[35m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

let passCount = 0;
let totalCount = 0;

function logTest(conditionId, title, resultPassed, details) {
  totalCount++;
  if (resultPassed) {
    passCount++;
    console.log(`  ${GREEN}[PASS]${RESET} ${BOLD}${conditionId}:${RESET} ${title}`);
  } else {
    console.log(`  ${RED}[FAIL]${RESET} ${BOLD}${conditionId}:${RESET} ${title}`);
  }
  if (details) {
    console.log(`         ${MAGENTA}Reaction:${RESET} ${details}`);
  }
}

async function runAllFrontendInputTests() {
  console.log(`\n${BOLD}${CYAN}======================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}  FRONTEND INPUT & BILL REACTION MONITOR (NODE.JS + TESSERACT OCR)  ${RESET}`);
  console.log(`${BOLD}${CYAN}======================================================================${RESET}\n`);

  console.log(`${BOLD}[1] Real World Problem Input Tests:${RESET}\n`);

  // 1. E-Commerce damaged gadget
  const ecomInput = "Ordered Sony headphones on 15-Aug-2026 for ₹8,999 from Amazon. Order #AZ-482019. Left ear cup not working, return request rejected.";
  const ecomRes = extractFieldsFromGrievance(ecomInput);
  logTest("FE-01", "E-Commerce Return Refusal", 
    ecomRes.amount === "₹8,999" && ecomRes.referenceId.includes("AZ-482019"),
    `Amount=${ecomRes.amount}, Ref=${ecomRes.referenceId}, Category=${ecomRes.category}`
  );

  // 2. Banking UPI / ATM failed cash
  const bankInput = "ATM debit of ₹10,000 on 22 July 2026 without cash dispensed at SBI ATM. Ref #TXN-881920. Bank closed ticket without refund.";
  const bankRes = extractFieldsFromGrievance(bankInput);
  logTest("FE-02", "Banking ATM Cash Failure",
    bankRes.amount === "₹10,000" && bankRes.merchant.includes("State Bank of India"),
    `Amount=${bankRes.amount}, Party=${bankRes.merchant}, Category=${bankRes.category}`
  );

  // 3. Telecom broadband outage
  const traiInput = "Airtel Xstream fiber internet connection down for 2 weeks. Disputed bill Rs. 2,499. Docket #TEL-99482.";
  const traiRes = extractFieldsFromGrievance(traiInput);
  logTest("FE-03", "Telecom 14-Day Broadband Outage",
    traiRes.amount === "₹2,499" && traiRes.referenceId.includes("TEL-99482"),
    `Amount=${traiRes.amount}, Ref=${traiRes.referenceId}, Party=${traiRes.merchant}`
  );

  // 3b. New Jio Fiber Tax Invoice with Disputed Amount vs Total Due
  const jioFiberBillOcr = `
JIO FIBER MONTHLY TAX INVOICE
Account No: 8872049132
Docket ID: TEL-88510
Billing Cycle: 01-Aug-2026 to 31-Aug-2026
Due Date: 15-Sep-2026
Disputed Amount: INR 1,299.00
Service Status: 18-Day Continuous Outage Logged
Total Amount Due: INR 1,199.00
RELIANCE JIO INFOCOMM LIMITED
  `;
  const jioRes = extractFieldsFromGrievance(jioFiberBillOcr);
  logTest("FE-03B", "New Jio Fiber Monthly Invoice OCR Scan",
    jioRes.disputedAmount === "₹1,299.00" && 
    jioRes.totalAmountDue === "₹1,199.00" && 
    jioRes.referenceId.includes("TEL-88510") && 
    jioRes.merchant === "Reliance Jio Infocomm Ltd" && 
    jioRes.incidentDate === "01-Aug-2026",
    `Disputed=${jioRes.disputedAmount}, TotalDue=${jioRes.totalAmountDue}, Docket=${jioRes.referenceId}, Merchant=${jioRes.merchant}, BillingDate=${jioRes.incidentDate}`
  );

  // 4. Incomplete user entry (No amount, no date, no reference)
  const incompleteInput = "I purchased clothes from shop and it tore on first wash, they are refusing to replace.";
  const incompleteRes = extractFieldsFromGrievance(incompleteInput);
  logTest("FE-04", "Vague User Input (Zero Numbers)",
    incompleteRes.amount.includes("NOT SPECIFIED") && incompleteRes.incidentDate.includes("NOT SPECIFIED"),
    `Truthful Placeholders Applied -> Amount: "${incompleteRes.amount}", Date: "${incompleteRes.incidentDate}"`
  );

  // 5. Mixed Hinglish text with amounts
  const hinglishInput = "Flipkart pe 25th August 2026 ko mixer grinder mangwaya tha Rs 3,450 ka. Order #FLIP-10293 kharab item bheja.";
  const hinglishRes = extractFieldsFromGrievance(hinglishInput);
  logTest("FE-05", "Colloquial Hinglish Input",
    hinglishRes.amount === "₹3,450" && hinglishRes.referenceId.includes("FLIP-10293"),
    `Extracted from Hinglish -> Amount=${hinglishRes.amount}, Ref=${hinglishRes.referenceId}`
  );

  // 6. Real Bills Image Pixel OCR Extraction
  console.log(`\n${BOLD}[2] Real Invoice Image Pixel Extraction Tests (OCR):${RESET}\n`);

  const apexImagePath = path.resolve('../sample_bills/sample_apex_invoice.jpg');
  const apexScan = await Tesseract.recognize(apexImagePath, 'eng');
  const apexFields = extractFieldsFromGrievance(apexScan.data.text);
  logTest("OCR-01", "Apex Retail Tax Invoice JPG (941 KB)",
    apexFields.merchant.includes("Apex Retail") && (apexFields.amount.includes("28,499") || apexFields.amount.includes("24,151")),
    `Scanned Real JPG -> Merchant: "${apexFields.merchant}", Invoice Amount: "${apexFields.amount}", Ref: "${apexFields.referenceId}"`
  );

  const telImagePath = path.resolve('../sample_bills/sample_telecom_invoice.jpg');
  const telScan = await Tesseract.recognize(telImagePath, 'eng');
  const telFields = extractFieldsFromGrievance(telScan.data.text);
  logTest("OCR-02", "Telecom Broadband Bill JPG (818 KB)",
    telFields.referenceId.includes("TEL-88192") || telFields.amount.includes("1,499") || telFields.amount.includes("328"),
    `Scanned Real JPG -> Docket: "${telFields.referenceId}", Billed Outage: "${telFields.amount}"`
  );

  const bankImagePath = path.resolve('../sample_bills/sample_banking_statement.jpg');
  const bankScan = await Tesseract.recognize(bankImagePath, 'eng');
  const bankFields = extractFieldsFromGrievance(bankScan.data.text);
  logTest("OCR-03", "HDFC Banking Statement & Dispute JPG",
    bankFields.merchant.includes("HDFC Bank") && (bankFields.amount.includes("14,500") || bankFields.referenceId.includes("99382109") || bankFields.referenceId.includes("BNK")),
    `Scanned Real JPG -> Bank: "${bankFields.merchant}", Amount: "${bankFields.amount}", Ref: "${bankFields.referenceId}", Date: "${bankFields.incidentDate}"`
  );

  console.log(`\n${BOLD}${CYAN}======================================================================${RESET}`);
  if (passCount === totalCount) {
    console.log(`${BOLD}${GREEN}  ALL ${totalCount}/${totalCount} FRONTEND CONDITIONS PASSED PERFECTLY (100% SUCCESS)${RESET}`);
  } else {
    console.log(`${BOLD}${RED}  ${passCount}/${totalCount} CONDITIONS PASSED${RESET}`);
  }
  console.log(`${BOLD}${CYAN}======================================================================${RESET}\n`);
}

runAllFrontendInputTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
