/**
 * GrievEase AI — Frontend Terminal Test Suite
 * Validates dynamic grievance extractors, DEMO_PRESETS integrity, and mock service state transitions.
 */

import { DEMO_PRESETS } from './src/services/api.js';
import { extractFieldsFromGrievance } from './src/utils/extractors.js';

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

let passCount = 0;
let totalCount = 0;

function assert(condition, testName) {
  totalCount++;
  if (condition) {
    console.log(`  ${GREEN}[PASS]${RESET} ${testName}`);
    passCount++;
  } else {
    console.log(`  ${RED}[FAIL]${RESET} ${testName}`);
  }
}

console.log(`\n${BOLD}${CYAN}======================================================================${RESET}`);
console.log(`${BOLD}${CYAN}  GRIEV-EASE AI — FRONTEND TERMINAL TEST SUITE (NODE.JS)${RESET}`);
console.log(`${BOLD}${CYAN}======================================================================${RESET}\n`);

console.log(`${BOLD}[1] Dynamic Entity Extraction Engine Tests:${RESET}`);

// Test 1: E-Commerce amount and order extraction
const ecomText = "Ordered Samsung M35 on 4th August 2026 for ₹28,499. Order #AZ-884920.";
const ecomFields = extractFieldsFromGrievance(ecomText);
assert(ecomFields.amount === "₹28,499", "Extract currency amount correctly (₹28,499)");
assert(ecomFields.referenceId.includes("Order #AZ-884920"), "Extract Order ID reference (Order #AZ-884920)");

// Test 2: Banking UPI & UTR reference extraction
const bankText = "Unauthorized debit of INR 14,500 on 12th July 2026 via UTR-99382109 from A/c #XXXX4910.";
const bankFields = extractFieldsFromGrievance(bankText);
assert(bankFields.amount === "₹14,500", "Extract INR currency format correctly (₹14,500)");
assert(bankFields.referenceId.includes("UTR-99382109"), "Extract UPI UTR reference (UTR-99382109)");

// Test 3: Telecom Docket reference extraction
const telText = "Fiber outage billed ₹1,499 with unaddressed Docket #TEL-88192 on 02-08-2026.";
const telFields = extractFieldsFromGrievance(telText, "TELECOM");
assert(telFields.amount === "₹1,499", "Extract telecom invoice amount (₹1,499)");
assert(telFields.referenceId.includes("Docket #TEL-88192"), "Extract Telecom Docket reference (Docket #TEL-88192)");

// Test 4: Dynamic honest placeholders when fields are missing (no hardcoded fake values)
const blankText = "Defective merchandise received from online seller without receipt.";
const blankFields = extractFieldsFromGrievance(blankText);
assert(blankFields.amount.includes("DISPUTED AMOUNT NOT SPECIFIED"), "Honest placeholder when amount is missing from bill (no hardcoding)");
assert(blankFields.incidentDate.includes("TRANSACTION DATE NOT SPECIFIED"), "Honest placeholder when date is missing (no hardcoding)");
assert(blankFields.referenceId.includes("DISPUTED REFERENCE"), "Honest placeholder when reference is missing (no hardcoding)");

// Test 5: Dynamic extraction from raw OCR text with complex headers and tables
const rawOcrTaxInvoice = `
APEX RETAIL INDIA PVT LTD
TAX INVOICE
INV-2026-99384
04-Aug-2026
Order ID: AZ-884920
Customer: Rajesh Kumar
Samsung Galaxy M35 5G
Total GST (18%): INR 4,347.31
Amount in Words: Twenty Eight Thousand Four Hundred Ninety-Nine Only
Total Amount Due: INR 28,499.00
`;
const ocrFields = extractFieldsFromGrievance(rawOcrTaxInvoice);
assert(ocrFields.amount === "₹28,499.00", "Extract amount from raw OCR text (₹28,499.00)");
assert(ocrFields.referenceId.includes("INV-2026") || ocrFields.referenceId.includes("AZ-884920"), "Extract reference ID from raw OCR text");
assert(ocrFields.merchant === "Apex Retail India Pvt Ltd", "Extract company name from raw OCR header (Apex Retail India Pvt Ltd)");
assert(ocrFields.incidentDate === "04-Aug-2026", "Extract date from raw OCR text (04-Aug-2026)");

console.log(`\n${BOLD}[2] Demo Presets & Regulatory Mapping Integrity:${RESET}`);
assert(DEMO_PRESETS.length === 4, "4 Evaluation Scenarios Configured");

const ecomPreset = DEMO_PRESETS.find(p => p.id === "ecommerce_refund");
assert(ecomPreset && ecomPreset.targetForum === "CONSUMER_FORUM", "Scenario 1 mapped to Consumer Forum");

const rbiPreset = DEMO_PRESETS.find(p => p.id === "rbi_banking");
assert(rbiPreset && rbiPreset.targetForum === "RBI_OMBUDSMAN", "Scenario 2 mapped to RBI Ombudsman");

const traiPreset = DEMO_PRESETS.find(p => p.id === "trai_telecom");
assert(traiPreset && traiPreset.targetForum === "TRAI", "Scenario 3 mapped to TRAI");

const guardPreset = DEMO_PRESETS.find(p => p.id === "guard_reject_expired");
assert(guardPreset && guardPreset.isGuardRejectionDemo === true, "Scenario 4 flagged for Guardrail Interception");

console.log(`\n${BOLD}[3] Real Image OCR Scanning Verification (Tesseract.js Engine):${RESET}`);

import Tesseract from 'tesseract.js';
import path from 'path';

async function runRealImageOcrTests() {
  const apexPath = path.resolve('../sample_bills/sample_apex_invoice.jpg');
  const apexScan = await Tesseract.recognize(apexPath, 'eng');
  const apexEntities = extractFieldsFromGrievance(apexScan.data.text);
  assert(apexEntities.referenceId.includes("INV-2026") || apexEntities.referenceId.includes("AZ-884920"), "Real Image OCR: Extracted Invoice/Order ID from image pixels");
  assert(apexEntities.amount.includes("28,499") || apexEntities.amount.includes("24,151"), "Real Image OCR: Extracted Amount from image pixels");
  assert(apexEntities.merchant.includes("Apex Retail"), "Real Image OCR: Extracted Merchant Apex Retail from image pixels");

  const telPath = path.resolve('../sample_bills/sample_telecom_invoice.jpg');
  const telScan = await Tesseract.recognize(telPath, 'eng');
  const telEntities = extractFieldsFromGrievance(telScan.data.text);
  assert(telEntities.referenceId.includes("TEL-88192"), "Real Image OCR: Extracted Docket #TEL-88192 from telecom bill pixels");
  assert(telEntities.amount.includes("1,499") || telEntities.amount.includes("328"), "Real Image OCR: Extracted Amount from telecom bill pixels");

  console.log(`\n${BOLD}${CYAN}======================================================================${RESET}`);
  if (passCount === totalCount) {
    console.log(`${BOLD}${GREEN}  ALL ${totalCount}/${totalCount} FRONTEND TESTS PASSED PERFECTLY (100% SUCCESS)${RESET}`);
  } else {
    console.log(`${BOLD}${RED}  ${passCount}/${totalCount} TESTS PASSED${RESET}`);
  }
  console.log(`${BOLD}${CYAN}======================================================================${RESET}\n`);

  process.exit(passCount === totalCount ? 0 : 1);
}

runRealImageOcrTests().catch((err) => {
  console.error("OCR Test error:", err);
  process.exit(1);
});

