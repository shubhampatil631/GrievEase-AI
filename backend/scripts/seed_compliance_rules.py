#!/usr/bin/env python3
"""
Seed script to populate ComplianceRulesTable in DynamoDB.
Can be executed against AWS directly or LocalStack.
"""
import os
import sys
import boto3

RULES_DATA = [
    # --- CONSUMER FORUM RULES ---
    {
        "forum": "CONSUMER_FORUM",
        "ruleId": "RULE#REQUIRED_FIELDS",
        "ruleType": "REQUIRED_FIELD",
        "params": {
            "fields": ["orderNumber", "sellerName", "amountDisputed", "purchaseDate"]
        }
    },
    {
        "forum": "CONSUMER_FORUM",
        "ruleId": "RULE#LIMITATION_PERIOD",
        "ruleType": "DEADLINE_WINDOW",
        "params": {
            "windowDays": 730,
            "warnIfPastDays": 700
        }
    },
    {
        "forum": "CONSUMER_FORUM",
        "ruleId": "RULE#BANNED_LANGUAGE",
        "ruleType": "BANNED_PHRASES",
        "params": {
            "phrases": ["threaten violence", "blackmail", "extort"]
        }
    },

    # --- RBI OMBUDSMAN RULES ---
    {
        "forum": "RBI_OMBUDSMAN",
        "ruleId": "RULE#REQUIRED_FIELDS",
        "ruleType": "REQUIRED_FIELD",
        "params": {
            "fields": ["orderNumber", "sellerName", "amountDisputed"]
        }
    },
    {
        "forum": "RBI_OMBUDSMAN",
        "ruleId": "RULE#30_DAY_PRE_REQUISITE",
        "ruleType": "DEADLINE_WINDOW",
        "params": {
            "windowDays": 365,
            "mustHavePriorNotice": True
        }
    },

    # --- TRAI / TELECOM APPELLATE RULES ---
    {
        "forum": "TRAI",
        "ruleId": "RULE#REQUIRED_FIELDS",
        "ruleType": "REQUIRED_FIELD",
        "params": {
            "fields": ["orderNumber", "sellerName"]
        }
    },
    {
        "forum": "TRAI",
        "ruleId": "RULE#APPELLATE_WINDOW",
        "ruleType": "DEADLINE_WINDOW",
        "params": {
            "windowDays": 30
        }
    }
]

def seed_rules(table_name: str = None):
    table_name = table_name or os.environ.get("RULES_TABLE_NAME", "ComplianceRulesTable-dev")
    region_name = os.environ.get("AWS_REGION", os.environ.get("AWS_DEFAULT_REGION", "us-east-1"))
    dynamo = boto3.resource("dynamodb", region_name=region_name)
    table = dynamo.Table(table_name)
    
    print(f"[Seeder] Seeding rules into DynamoDB table: {table_name} ...")
    count = 0
    for rule in RULES_DATA:
        table.put_item(Item=rule)
        print(f"  + Added [{rule['forum']}] {rule['ruleId']}")
        count += 1
    print(f"[Seeder] Successfully seeded {count} compliance rules.")

if __name__ == "__main__":
    target_table = sys.argv[1] if len(sys.argv) > 1 else None
    seed_rules(target_table)
