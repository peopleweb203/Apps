"""Exercises the real `anthropic` SDK code path against a LOCAL fake Messages API.

No network, no key, no cost. This proves the adapter's request/response/error
handling and the orchestrator's live-mode gates; it does NOT prove the real API
accepts the request - only the supervised smoke test (smoke_test.py) does that.
Skipped when the SDK isn't installed.
"""
from __future__ import annotations

import json
import os
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer

from test_acceptance import Base

try:
    import anthropic  # noqa: F401
    HAVE_SDK = True
except ImportError:
    HAVE_SDK = False


class FakeAPI(BaseHTTPRequestHandler):
    mode = "ok"
    requests: list = []

    def log_message(self, *a):
        pass

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        FakeAPI.requests.append({"path": self.path, "body": body,
                                 "beta": self.headers.get("anthropic-beta")})
        if FakeAPI.mode == "ratelimit":
            self.send_response(429)
            self.send_header("content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"type": "error", "error": {
                "type": "rate_limit_error", "message": "slow down"}}).encode())
            return
        msg = {"id": "msg_fake", "type": "message", "role": "assistant", "model": body["model"],
               "content": [{"type": "text", "text": "PASS - fake model output"}],
               "stop_reason": "refusal" if FakeAPI.mode == "refusal" else "end_turn",
               "stop_sequence": None, "usage": {"input_tokens": 1000, "output_tokens": 500}}
        self.send_response(200)
        self.send_header("content-type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(msg).encode())


@unittest.skipUnless(HAVE_SDK, "anthropic SDK not installed")
class TestAnthropicAdapterOffline(Base):
    @classmethod
    def setUpClass(cls):
        cls.srv = HTTPServer(("127.0.0.1", 0), FakeAPI)
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        cls.saved = {k: os.environ.get(k) for k in ("ANTHROPIC_BASE_URL", "ANTHROPIC_API_KEY")}
        os.environ["ANTHROPIC_BASE_URL"] = f"http://127.0.0.1:{cls.srv.server_port}"
        os.environ["ANTHROPIC_API_KEY"] = "test-dummy-not-a-real-key"

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()
        for k, v in cls.saved.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v

    def setUp(self):
        super().setUp()
        FakeAPI.mode, FakeAPI.requests = "ok", []
        self.cfg["providers"]["anthropic"]["verified"] = True
        self.cfg["providers"]["anthropic"]["max_retries"] = 0
        self.o.store.close()
        self.o = self.make()
        self.o.mode = "live"

    def live_task(self, cap="resource_research", risk="low"):
        return self.o.submit("infrastructure_intelligence", "live test", cap, risk=risk,
                             action="research", payload={"provider": "anthropic", "instructions": "x"})

    def approve_all(self):
        for a in self.o.approvals.pending():
            self.o.approve(a["id"], "test-human")

    def test_live_call_requires_approval_then_records_real_cost(self):
        tid = self.live_task()
        self.o.run()
        self.assertEqual(self.state(tid), "WAITING_APPROVAL")
        self.assertEqual(FakeAPI.requests, [])                    # nothing sent before approval
        self.approve_all()
        self.o.run()
        t = self.o.store.task(tid)
        self.assertEqual(t["status"], "COMPLETED")
        self.assertEqual(t["simulated"], 0)
        req = FakeAPI.requests[0]
        self.assertEqual(req["body"]["model"], "claude-haiku-5-5")   # routine tier
        self.assertEqual(req["body"]["output_config"], {"effort": "low"})
        actual = self.o.store.conn().execute("SELECT actual_cost FROM usage WHERE task_id=?",
                                             (tid,)).fetchone()[0]
        self.assertAlmostEqual(actual, (1000 * 0.10 + 500 * 0.50) / 1e6)

    def test_standard_tier_uses_opus_with_server_side_fallback(self):
        tid = self.live_task(cap="automation")                    # automation_engineer = standard
        self.o.run(); self.approve_all(); self.o.run()
        self.assertEqual(self.state(tid), "COMPLETED")
        req = FakeAPI.requests[0]
        self.assertEqual(req["body"]["model"], "claude-opus-5-5")
        self.assertEqual(req["body"]["fallbacks"], "default")
        self.assertIn("server-side-fallback-2026-07-01", req["beta"])

    def test_refusal_is_fatal_and_escalates(self):
        FakeAPI.mode = "refusal"
        tid = self.live_task()
        self.o.run(); self.approve_all(); self.o.run()
        t = self.o.store.task(tid)
        self.assertEqual((t["status"], t["attempts"]), ("FAILED", 1))
        self.assertIn("declined", t["error"])

    def test_rate_limit_is_recoverable(self):
        FakeAPI.mode = "ratelimit"
        tid = self.live_task()
        self.o.run(); self.approve_all(); self.o.run()
        t = self.o.store.task(tid)
        self.assertEqual(t["status"], "FAILED")                    # 3 bounded retries, then escalate
        self.assertEqual(t["attempts"], 3)
        self.assertIn("recoverable", t["error"])

    def test_simulation_mode_still_refuses_live_provider(self):
        self.o.mode = "simulation"
        tid = self.live_task()
        self.o.run()
        self.assertEqual(self.state(tid), "BLOCKED")
        self.assertEqual(FakeAPI.requests, [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
