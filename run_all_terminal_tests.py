"""
Master Terminal Test Runner for GrievEase AI
Runs all Backend Python E2E Tests and Frontend Node.js E2E Tests with full terminal telemetry.
"""

import subprocess
import sys
import os

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

BOLD = "\033[1m"
CYAN = "\033[96m"
GREEN = "\033[92m"
RED = "\033[91m"
RESET = "\033[0m"

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__)))
    backend_test_script = os.path.join(root_dir, "backend", "tests", "test_e2e_terminal.py")
    frontend_test_script = os.path.join(root_dir, "frontend", "test_frontend_terminal.js")

    print(f"\n{BOLD}{CYAN}======================================================================{RESET}")
    print(f"{BOLD}{CYAN}   🚀 RUNNING ALL END-TO-END TESTS DIRECTLY IN TERMINAL (CLI)        {RESET}")
    print(f"{BOLD}{CYAN}======================================================================{RESET}\n")

    # 1. Run Python Backend Tests
    print(f"{BOLD}[PHASE 1] Executing Backend API & Multi-Agent Tests...{RESET}\n")
    py_cmd = [sys.executable, backend_test_script]
    py_res = subprocess.run(py_cmd, cwd=root_dir)

    # 2. Run Frontend Node Tests
    print(f"\n{BOLD}[PHASE 2] Executing Frontend Entity & Preset Verification Tests...{RESET}\n")
    node_cmd = ["node", "test_frontend_terminal.js"]
    node_res = subprocess.run(node_cmd, cwd=os.path.join(root_dir, "frontend"), shell=True)

    # Summary
    print(f"\n{BOLD}{CYAN}======================================================================{RESET}")
    if py_res.returncode == 0 and node_res.returncode == 0:
        print(f"{BOLD}{GREEN}  🎉 ALL BACKEND & FRONTEND TESTS PASSED (100% SUITE SUCCESS){RESET}")
    else:
        print(f"{BOLD}{RED}  ❌ SOME TESTS FAILED. PLEASE CHECK TERMINAL LOGS ABOVE.{RESET}")
    print(f"{BOLD}{CYAN}======================================================================{RESET}\n")

    sys.exit(0 if (py_res.returncode == 0 and node_res.returncode == 0) else 1)

if __name__ == "__main__":
    main()
