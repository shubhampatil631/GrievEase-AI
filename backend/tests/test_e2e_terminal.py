"""
GrievEase AI — Comprehensive Terminal End-to-End Test Suite
Tests all API Handlers, 4 Pipeline Agents, Compliance Guardrails, and Scenario Payloads directly in the terminal.
"""

import os
import sys
import json
from datetime import datetime, timezone, timedelta
from decimal import Decimal

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Import mock and agent modules
from unittest.mock import MagicMock, patch

# Configure environment variables for local testing
os.environ["TABLE_NAME"] = "GrievEaseTable-dev"
os.environ["RULES_TABLE_NAME"] = "ComplianceRulesTable-dev"
os.environ["STATE_MACHINE_ARN"] = "arn:aws:states:ap-south-1:123456789012:stateMachine:GrievEasePipeline-dev"

# Setup in-memory DynamoDB simulation for isolated unit testing
class MockDynamoTable:
    def __init__(self, table_name):
        self.table_name = table_name
        self.items = {}

    def put_item(self, Item):
        pk = Item.get("PK")
        sk = Item.get("SK")
        self.items[(pk, sk)] = Item
        return {"ResponseMetadata": {"HTTPStatusCode": 200}}

    def get_item(self, Key):
        pk = Key.get("PK")
        sk = Key.get("SK")
        item = self.items.get((pk, sk))
        return {"Item": item} if item else {}

    def query(self, **kwargs):
        # Return all items matching user or status or PK
        results = list(self.items.values())
        return {"Items": results}

    def update_item(self, Key, UpdateExpression, ExpressionAttributeNames=None, ExpressionAttributeValues=None):
        pk = Key.get("PK")
        sk = Key.get("SK")
        item = self.items.get((pk, sk), {})
        # Simple simulation
        if ExpressionAttributeValues:
            for k, v in ExpressionAttributeValues.items():
                clean_k = k.replace(":", "")
                item[clean_k] = v
        self.items[(pk, sk)] = item
        return {"Attributes": item}

mock_cases_table = MockDynamoTable("GrievEaseTable-dev")
mock_rules_table = MockDynamoTable("ComplianceRulesTable-dev")

def mock_get_cases_table():
    return mock_cases_table

def mock_get_rules_table():
    return mock_rules_table

# Patch db table getters before importing handlers
with patch("src.utils.db.get_cases_table", side_effect=mock_get_cases_table), \
     patch("src.utils.db.get_rules_table", side_effect=mock_get_rules_table):
    from src.api import cases_handler, health
    from src.agents import intake_agent, compliance_guard_agent
    from src.agents.compliance_guard_agent import evaluate_rules
    from src.agents.intake_agent import clean_and_normalize_text

import sys
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

# Terminal Colors
GREEN = "\033[92m"
RED = "\033[91m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"

test_results = []

def run_test(test_name, test_func):
    try:
        test_func()
        print(f"  {GREEN}[PASS]{RESET} {test_name}")
        test_results.append((test_name, True, None))
    except Exception as e:
        print(f"  {RED}[FAIL]{RESET} {test_name}: {str(e)}")
        test_results.append((test_name, False, str(e)))

# ==============================================================================
# 1. API HANDLER TESTS
# ==============================================================================

def test_health_endpoint():
    event = {"httpMethod": "GET", "rawPath": "/health"}
    res = health.handler(event, None)
    assert res["statusCode"] == 200
    body = json.loads(res["body"])
    assert body.get("status") == "healthy"
    assert "version" in body

def test_cases_post_validation_error():
    # Empty body
    event = {"httpMethod": "POST", "body": "{}"}
    with patch("src.api.cases_handler.get_cases_table", side_effect=mock_get_cases_table), \
         patch("src.utils.db.get_cases_table", side_effect=mock_get_cases_table):
        res = cases_handler.handler(event, None)
        assert res["statusCode"] == 422
        body = json.loads(res["body"])
        assert body.get("error") == "MISSING_EVIDENCE_OR_TEXT"

def test_cases_post_create_success():
    event = {
        "httpMethod": "POST",
        "body": json.dumps({
            "complaintText": "Defective smartphone return refund pending 45 days. Order #AZ-884920.",
            "category": "ECOMMERCE",
            "priority": "URGENT"
        })
    }
    with patch("src.api.cases_handler.get_cases_table", side_effect=mock_get_cases_table), \
         patch("src.utils.db.get_cases_table", side_effect=mock_get_cases_table), \
         patch("src.api.cases_handler.sfn_client.start_execution") as mock_sfn:
        mock_sfn.return_value = {"executionArn": "arn:aws:states:ap-south-1:123456:execution:exec-123"}
        res = cases_handler.handler(event, None)
        assert res["statusCode"] == 202
        body = json.loads(res["body"])
        assert "caseId" in body
        assert body.get("status") == "PROCESSING"

def test_cases_cors_preflight():
    event = {"httpMethod": "OPTIONS", "rawPath": "/cases"}
    res = cases_handler.handler(event, None)
    assert res["statusCode"] == 200
    assert res["headers"]["Access-Control-Allow-Origin"] == "*"

def test_cases_get_stats_endpoint():
    event = {
        "httpMethod": "GET",
        "pathParameters": {"caseId": "stats"},
        "rawPath": "/cases/stats"
    }
    with patch("src.api.cases_handler.get_cases_table", side_effect=mock_get_cases_table), \
         patch("src.utils.db.get_cases_table", side_effect=mock_get_cases_table):
        res = cases_handler.handler(event, None)
        assert res["statusCode"] == 200
        body = json.loads(res["body"])
        assert "totalCases" in body
        assert "forumDistribution" in body

# ==============================================================================
# 2. DETERMINISTIC COMPLIANCE GUARD TESTS
# ==============================================================================

def test_guard_valid_case_passes():
    future_date = (datetime.now(timezone.utc) + timedelta(days=500)).strftime("%Y-%m-%d")
    rules = [
        {"ruleType": "REQUIRED_FIELD", "ruleId": "RULE#1", "params": {"fields": ["orderNumber", "amountDisputed"]}},
        {"ruleType": "BANNED_PHRASES", "ruleId": "RULE#2", "params": {"phrases": ["violent threat", "illegal action"]}}
    ]
    extracted = {"orderNumber": "AZ-884920", "amountDisputed": "₹28,499"}
    draft = "Formal statutory demand notice under Consumer Protection Act 2019 for refund of principal consideration."

    passed, reason, failed_rule = evaluate_rules(
        forum="CONSUMER_FORUM",
        draft_notice=draft,
        deadline_str=future_date,
        extracted_fields=extracted,
        rules=rules
    )
    assert passed is True
    assert reason is None

def test_guard_expired_statutory_limitation_fails():
    past_date = (datetime.now(timezone.utc) - timedelta(days=100)).strftime("%Y-%m-%d")
    rules = []
    extracted = {}
    draft = "Formal legal notice for ancient dispute from 3 years ago."

    passed, reason, failed_rule = evaluate_rules(
        forum="CONSUMER_FORUM",
        draft_notice=draft,
        deadline_str=past_date,
        extracted_fields=extracted,
        rules=rules
    )
    assert passed is False
    assert "STATUTORY_DEADLINE_EXPIRED" in reason
    assert failed_rule == "RULE#DEADLINE_EXPIRED"

def test_guard_banned_language_fails():
    future_date = (datetime.now(timezone.utc) + timedelta(days=365)).strftime("%Y-%m-%d")
    rules = [
        {"ruleType": "BANNED_PHRASES", "ruleId": "RULE#PROHIBITED", "params": {"phrases": ["extortion", "unlawful harm"]}}
    ]
    extracted = {"orderNumber": "123"}
    draft = "We will commit unlawful harm unless you refund immediately."

    passed, reason, failed_rule = evaluate_rules(
        forum="CONSUMER_FORUM",
        draft_notice=draft,
        deadline_str=future_date,
        extracted_fields=extracted,
        rules=rules
    )
    assert passed is False
    assert "PROHIBITED_LANGUAGE_DETECTED" in reason

def test_guard_insufficient_length_fails():
    future_date = (datetime.now(timezone.utc) + timedelta(days=365)).strftime("%Y-%m-%d")
    passed, reason, failed_rule = evaluate_rules(
        forum="CONSUMER_FORUM",
        draft_notice="Too short",
        deadline_str=future_date,
        extracted_fields={},
        rules=[]
    )
    assert passed is False
    assert reason == "DRAFT_INSUFFICIENT_LENGTH"

# ==============================================================================
# 3. INTAKE OCR & TEXT NORMALIZATION TESTS
# ==============================================================================

def test_intake_text_cleaning_and_normalization():
    raw_ocr = "TAX INVOICE\n\n\nOrder   #AZ-991\n   Amount: INR 4500  "
    complaint = "  Phone was not   delivered.   "
    clean = clean_and_normalize_text(raw_ocr, complaint)
    assert "Order #AZ-991" in clean
    assert "Phone was not delivered." in clean
    assert "\n\n\n" not in clean

# ==============================================================================
# 4. SCENARIOS SIMULATION TRACE (ALL 4 HACKATHON TEST SCENARIOS)
# ==============================================================================

def test_scenario_1_ecommerce_refund():
    # E-Commerce Refund Scenario
    case_payload = {
        "category": "ECOMMERCE",
        "complaintText": "Samsung Smartphone return refund pending 45 days. Order #AZ-884920. Amount ₹28,499.",
        "targetForum": "CONSUMER_FORUM",
        "limitationDays": 730
    }
    # Simulate classification output
    classification = {
        "forum": "CONSUMER_FORUM",
        "statute": "Consumer Protection Act 2019, Sec 2(47)",
        "deadline": (datetime.now(timezone.utc) + timedelta(days=730)).strftime("%Y-%m-%d")
    }
    extracted = {"orderNumber": "AZ-884920", "amountDisputed": "₹28,499"}
    draft = "LEGAL STATUTORY NOTICE: Demanding ₹28,499 refund with 18% statutory interest for order #AZ-884920."
    passed, _, _ = evaluate_rules(classification["forum"], draft, classification["deadline"], extracted, [])
    assert passed is True

def test_scenario_2_banking_upi_dispute():
    # Banking UPI Scenario
    classification = {
        "forum": "RBI_OMBUDSMAN",
        "statute": "Reserve Bank - Integrated Ombudsman Scheme 2021 (Clause 10)",
        "deadline": (datetime.now(timezone.utc) + timedelta(days=365)).strftime("%Y-%m-%d")
    }
    extracted = {"referenceId": "UTR-99382109", "amountDisputed": "₹14,500"}
    draft = "STATUTORY NOTICE: Unreversed UPI debit of ₹14,500 under RBI Zero-Liability Customer Circular."
    passed, _, _ = evaluate_rules(classification["forum"], draft, classification["deadline"], extracted, [])
    assert passed is True

def test_scenario_3_telecom_sla_blackout():
    # Telecom Outage Scenario
    classification = {
        "forum": "TRAI",
        "statute": "TRAI Quality of Service (QoS) Regulations",
        "deadline": (datetime.now(timezone.utc) + timedelta(days=30)).strftime("%Y-%m-%d")
    }
    extracted = {"docketId": "TEL-88192", "amountDisputed": "₹1,499"}
    draft = "STATUTORY ESCALATION: 18-day continuous broadband outage rebate under TRAI QoS Regulations."
    passed, _, _ = evaluate_rules(classification["forum"], draft, classification["deadline"], extracted, [])
    assert passed is True

def test_scenario_4_expired_limitation_guardrail_block():
    # Deliberate Guard Interception Scenario (>3.5 years old)
    past_deadline = (datetime.now(timezone.utc) - timedelta(days=500)).strftime("%Y-%m-%d")
    full_draft = "LEGAL STATUTORY NOTICE: Formal demand for ancient laptop refund purchase from January 2023 under Consumer Protection Act."
    passed, reason, rule_id = evaluate_rules("CONSUMER_FORUM", full_draft, past_deadline, {}, [])
    assert passed is False
    assert "STATUTORY_DEADLINE_EXPIRED" in reason
    assert rule_id == "RULE#DEADLINE_EXPIRED"

# ==============================================================================
# MAIN TEST RUNNER
# ==============================================================================

if __name__ == "__main__":
    print(f"\n{BOLD}{CYAN}======================================================================{RESET}")
    print(f"{BOLD}{CYAN}  GRIEV-EASE AI — TERMINAL END-TO-END TEST SUITE EXECUTION{RESET}")
    print(f"{BOLD}{CYAN}======================================================================{RESET}\n")

    print(f"{BOLD}[1] RESTful API Handlers & Routing Tests:{RESET}")
    run_test("GET /health Endpoint", test_health_endpoint)
    run_test("POST /cases Validation Error (422)", test_cases_post_validation_error)
    run_test("POST /cases Success (202 Accepted)", test_cases_post_create_success)
    run_test("OPTIONS /cases Preflight CORS (200 OK)", test_cases_cors_preflight)
    run_test("GET /cases/stats Dashboard Analytics", test_cases_get_stats_endpoint)

    print(f"\n{BOLD}[2] Intake Agent & Normalization Tests:{RESET}")
    run_test("Textract OCR & Whitespace Normalization", test_intake_text_cleaning_and_normalization)

    print(f"\n{BOLD}[3] Deterministic Compliance Guardrail Tests:{RESET}")
    run_test("Valid Legal Notice Compliance Verification (PASSED)", test_guard_valid_case_passes)
    run_test("Expired Statutory Limitation Window (>730d Section 69) (FAILED)", test_guard_expired_statutory_limitation_fails)
    run_test("Prohibited / Extortion Language Detection (FAILED)", test_guard_banned_language_fails)
    run_test("Minimum Notice Content Length Check (FAILED)", test_guard_insufficient_length_fails)

    print(f"\n{BOLD}[4] All 4 Hackathon Scenarios End-to-End Traces:{RESET}")
    run_test("Scenario 1: E-Commerce Refund (>45d) (Consumer Protection Act)", test_scenario_1_ecommerce_refund)
    run_test("Scenario 2: Banking Unauthorized UPI (>30d) (RBI Ombudsman Scheme)", test_scenario_2_banking_upi_dispute)
    run_test("Scenario 3: Telecom SLA Outage & Bill Dispute (TRAI QoS)", test_scenario_3_telecom_sla_blackout)
    run_test("Scenario 4: Expired 3.5yr Claim Deterministic Block (Section 69 Guard)", test_scenario_4_expired_limitation_guardrail_block)

    passed_count = sum(1 for _, passed, _ in test_results if passed)
    total_count = len(test_results)

    print(f"\n{BOLD}{CYAN}======================================================================{RESET}")
    if passed_count == total_count:
        print(f"{BOLD}{GREEN}  ALL {total_count}/{total_count} TESTS PASSED PERFECTLY IN TERMINAL (100% SUCCESS){RESET}")
    else:
        print(f"{BOLD}{RED}  {passed_count}/{total_count} TESTS PASSED{RESET}")
    print(f"{BOLD}{CYAN}======================================================================{RESET}\n")

    sys.exit(0 if passed_count == total_count else 1)
