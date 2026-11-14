#!/usr/bin/env python3
"""Supervised live smoke test: ONE low-cost Claude call through the full workforce path.

Run on your own machine:
    pip install anthropic pyyaml
    cp .env.example .env        # put your key in ANTHROPIC_API_KEY
    python3 smoke_test.py

What it does:
  - uses a separate database (state/smoke.db), so your real queue is untouched
  - turns on live mode and the anthropic provider FOR THIS RUN ONLY (config file unchanged)
  - submits one low-risk routine task (Resource Researcher -> claude-haiku-5-5, est. $0.01)
  - stops at the cost guard and asks YOU to approve the charge by typing your name
  - runs the task, then prints the model used, the measured cost, and the output
If you're satisfied, set providers.anthropic.verified: true in workforce_config.yaml yourself.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

from orchestrator import ROOT, Orchestrator


def load_dotenv(path: Path):
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            if v.strip() and k.strip() not in os.environ:
                os.environ[k.strip()] = v.strip().strip('"').strip("'")


def main() -> int:
    load_dotenv(ROOT / ".env")
    if not (os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")):
        print("No ANTHROPIC_API_KEY found (environment or .env). Nothing was sent.")
        return 2
    try:
        import anthropic  # noqa: F401
    except ImportError:
        print("anthropic SDK missing: pip install anthropic")
        return 2

    o = Orchestrator(db_path=ROOT / "state" / "smoke.db", mode="live")
    o.adapters["anthropic"].verified = True        # this process only
    o.adapters["anthropic"].cfg["max_retries"] = 1
    tid = o.submit("infrastructure_intelligence",
                   "Smoke test: three ways a solo operator can cut AI API costs",
                   "resource_research", action="research", risk="low",
                   payload={"provider": "anthropic",
                            "instructions": "List three practical ways a solo operator can reduce "
                                            "AI API costs. Under 120 words. No external links."})
    print(f"Submitted {tid}. Running gates...")
    o.run()
    pending = [a for a in o.approvals.pending() if a["task_id"] == tid]
    if not pending:
        print("Expected a cost-approval request but none was raised:", o.store.task(tid)["error"])
        return 1
    print(f"\nCOST APPROVAL NEEDED: {pending[0]['reason']}")
    name = input("Type your name to approve this one charge (blank = cancel): ").strip()
    if not name:
        o.reject(pending[0]["id"], "smoke-test-operator", "cancelled at prompt")
        print("Cancelled. Nothing was sent.")
        return 1
    o.approve(pending[0]["id"], name, "supervised smoke test")
    o.run()

    t = o.store.task(tid)
    usage = o.store.conn().execute("SELECT model, est_cost, actual_cost FROM usage WHERE task_id=?",
                                   (tid,)).fetchall()
    print(f"\nStatus: {t['status']}  attempts: {t['attempts']}")
    for u in usage:
        print(f"Model served: {u['model']}  estimated ${u['est_cost']:.4f}  measured ${u['actual_cost'] or 0:.6f}")
    if t["status"] != "COMPLETED":
        print("Error:", t["error"])
        return 1
    art = Path(t["result"]["artifact"])
    print(f"Artifact: {art}  (sha256 {t['result']['sha256'][:12]}..., read-back verified)\n")
    print(art.read_text())
    print("\nSMOKE TEST PASSED. If the output looks right, set providers.anthropic.verified: true "
          "in workforce_config.yaml.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
