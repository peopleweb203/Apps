"""First-day acceptance tests for the APS AI Workforce (mock agents only).

Run:  python3 -m unittest discover -s tests -v
"""
from __future__ import annotations

import hashlib
import shutil
import subprocess
import sys
import tempfile
import threading
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from agent_runner import WorkspaceViolation  # noqa: E402
from approval_manager import ACCEPT_RESULT, CHARGEABLE, ESCALATION  # noqa: E402
from orchestrator import Orchestrator  # noqa: E402

import os  # noqa: E402

_CANDS = [ROOT.parent / "aps-tina", ROOT.parent.parent / "aps-tina"] + \
         [Path(p) for p in os.environ.get("APS_PROTECTED_PATHS", "").split(os.pathsep) if p]
TINA = next((p.resolve() for p in _CANDS if (p / ".git").exists()), (ROOT.parent / "aps-tina").resolve())


def tina_fingerprint() -> str | None:
    """HEAD + status + every branch/ref + stashes + hash of every tracked/untracked file."""
    if not (TINA / ".git").exists():
        return None
    git = lambda *a: subprocess.run(["git", "-C", str(TINA), *a], capture_output=True,  # noqa: E731
                                    text=True, check=True).stdout
    h = hashlib.sha256((git("rev-parse", "HEAD") + git("status", "--porcelain")
                        + git("for-each-ref") + git("stash", "list")).encode())
    for f in sorted(git("ls-files", "-co", "--exclude-standard").splitlines()):
        p = TINA / f
        if p.is_file():
            h.update(f.encode() + p.read_bytes())
    return h.hexdigest()


TINA_BEFORE = None


def setUpModule():
    global TINA_BEFORE
    TINA_BEFORE = tina_fingerprint()


class Clock:
    def __init__(self, t=1_800_000_000.0):
        self.t = t

    def __call__(self):
        return self.t


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="apswf-"))
        self.clock = Clock()
        self.cfg = yaml.safe_load((ROOT / "workforce_config.yaml").read_text())
        self.cfg["paths"]["protected_paths"] = [str(TINA)]
        self.o = self.make()

    def tearDown(self):
        self.o.store.close()
        shutil.rmtree(self.tmp, ignore_errors=True)

    def make(self, **cfg_changes) -> Orchestrator:
        for dotted, v in cfg_changes.items():
            node = self.cfg
            *parents, leaf = dotted.split("__")
            for k in parents:
                node = node[k]
            node[leaf] = v
        cp = self.tmp / "workforce_config.yaml"
        cp.write_text(yaml.safe_dump(self.cfg))
        return Orchestrator(root=self.tmp, config_path=cp, agents_path=ROOT / "agents.yaml",
                            now=self.clock)

    def task(self, team="software_factory", cap="code_audit", **kw):
        kw.setdefault("payload", {"instructions": "test"})
        return self.o.submit(team, f"test {cap}", cap, **kw)

    def state(self, tid):
        return self.o.store.task(tid)["status"]


# 1-2 ---------------------------------------------------------------------------
class TestRegistry(Base):
    def test_exactly_five_active_leaders_and_twenty_standby_specialists(self):
        agents = self.o.store.agents()
        self.assertEqual(len(agents), 25)
        leaders = [a for a in agents if a["kind"] == "leader"]
        specs = [a for a in agents if a["kind"] == "specialist"]
        self.assertEqual(len(leaders), 5)
        self.assertTrue(all(a["state"] == "ACTIVATED" for a in leaders))
        self.assertEqual(len(specs), 20)
        self.assertTrue(all(a["state"] == "STANDBY" for a in specs))
        for team in self.o.teams:
            self.assertEqual(sum(a["team"] == team and a["kind"] == "specialist" for a in agents), 4)

    def test_registration_is_idempotent_across_restarts(self):
        self.o.store.close()
        o2 = self.make()
        self.assertEqual(len(o2.store.agents()), 25)
        self.assertEqual(len(o2.store.slots()), 5)


# 3 + 5 -------------------------------------------------------------------------
class TestConcurrency(Base):
    def test_no_more_than_five_slots_can_be_claimed(self):
        self.assertEqual(len(self.o.store.slots()), 5)
        teams = list(self.o.teams)
        caps = {"software_factory": "code_audit", "customer_acquisition": "icp_strategy",
                "business_partnerships": "partner_strategy", "media_production": "canon_management",
                "infrastructure_intelligence": "ops_reporting"}
        for i in range(8):
            t = teams[i % 5]
            self.task(t, caps[t], allow_borrow=True)
        claims = []
        while (cl := self.o.claim(f"w{len(claims)}")) is not None:
            claims.append(cl)
        self.assertEqual(len(claims), 5)
        self.assertTrue(all(s["holder_agent"] for s in self.o.store.slots()))

    def test_parallel_run_never_exceeds_limit(self):
        active, peak, lock = [0], [0], threading.Lock()
        adapter = self.o.adapters["mock"]
        real = adapter.run

        def tracked(*a, **k):
            with lock:
                active[0] += 1
                peak[0] = max(peak[0], active[0])
            try:
                return real(*a, **k)
            finally:
                with lock:
                    active[0] -= 1
        adapter.run = tracked
        ids = [self.task(allow_borrow=True, payload={"mock_sleep": 0.15}) for _ in range(6)]
        ids += [self.task("media_production", "scriptwriting", allow_borrow=True,
                          payload={"mock_sleep": 0.15}) for _ in range(6)]
        self.o.run()
        self.assertLessEqual(peak[0], 5)
        self.assertGreaterEqual(peak[0], 2, "expected real parallelism")
        self.assertTrue(all(self.state(t) == "COMPLETED" for t in ids))

    def test_team_cannot_take_second_slot_without_authorization(self):
        a = self.task()
        b = self.task()
        c1 = self.o.claim("w1")
        self.assertEqual(c1.task["id"], a)
        self.assertIsNone(self.o.claim("w2"), "team home slot busy; borrowing not authorized")
        # Lead Engineer is busy, so use a capability a free specialist holds.
        borrowed = self.task(cap="frontend", allow_borrow=True)
        c2 = self.o.claim("w3")
        self.assertEqual(c2.task["id"], borrowed)
        self.assertNotEqual(c2.slot_id, c1.slot_id)
        self.assertEqual(self.state(b), "QUEUED")


# 4 ----------------------------------------------------------------------------
class TestSpecialistActivation(Base):
    def test_specialist_activates_for_task_and_returns_to_standby(self):
        tid = self.task(cap="frontend")
        cl = self.o.claim("w1")
        self.assertEqual(cl.agent["id"], "frontend_developer")
        self.assertEqual(self.o.store.agent("frontend_developer")["state"], "ASSIGNED")
        slot = [s for s in self.o.store.slots() if s["id"] == cl.slot_id][0]
        self.assertEqual(slot["home_team"], "software_factory")
        self.assertEqual(slot["holder_agent"], "frontend_developer")  # leader yielded the team slot
        self.assertEqual(self.o.process(cl), "COMPLETED")
        self.assertEqual(self.o.store.agent("frontend_developer")["state"], "STANDBY")
        events = [e["event"] for e in self.o.store.audit_log(tid)]
        self.assertIn("specialist_activated", events)
        path = [e["detail"]["to"] for e in self.o.store.audit_log(tid)
                if e["event"] == "agent_state" and e["agent_id"] == "frontend_developer"]
        self.assertEqual(path, ["ACTIVATED", "ASSIGNED", "EXECUTING", "COMPLETED", "STANDBY"])

    def test_medium_risk_gets_independent_review(self):
        tid = self.task(cap="frontend", risk="medium")
        self.o.run()
        t = self.o.store.task(tid)
        self.assertEqual(t["status"], "COMPLETED")
        self.assertEqual(t["result"]["review"]["by"], "qa_engineer")
        self.assertNotEqual(t["result"]["review"]["by"], t["result"]["executed_by"])

    def test_review_rejection_triggers_bounded_rework(self):
        tid = self.task(cap="frontend", risk="medium", payload={"mock_review_reject_times": 1})
        self.o.run()
        t = self.o.store.task(tid)
        self.assertEqual(t["status"], "COMPLETED")
        self.assertEqual(t["attempts"], 2)
        self.assertIn("feedback", t["payload"])


# 6 ----------------------------------------------------------------------------
class TestPersistence(Base):
    def test_results_survive_restart(self):
        tid = self.task()
        self.o.run()
        art = self.o.store.artifacts(tid)[0]
        self.o.store.close()
        o2 = self.make()
        t = o2.store.task(tid)
        self.assertEqual(t["status"], "COMPLETED")
        self.assertEqual(hashlib.sha256(Path(art["path"]).read_bytes()).hexdigest(), art["sha256"])
        self.assertTrue(o2.store.audit_log(tid))

    def test_crashed_worker_lease_is_recovered_and_task_resumes(self):
        tid = self.task(cap="frontend")
        cl = self.o.claim("dying-worker")   # claimed, then the worker "crashes"
        self.assertIsNotNone(cl)
        self.clock.t += self.o.lease + 1
        self.o.store.close()
        o2 = self.make()                    # restart
        self.assertEqual(o2.store.recover_expired(), [tid])
        self.assertEqual(o2.store.task(tid)["status"], "RETRYING")
        self.assertTrue(all(s["holder_agent"] is None for s in o2.store.slots()))
        self.assertEqual(o2.store.agent("frontend_developer")["state"], "STANDBY")
        o2.run()
        self.assertEqual(o2.store.task(tid)["status"], "COMPLETED")
        self.assertEqual(len(o2.store.artifacts(tid)), 1)
        self.o = o2

    def test_stale_worker_cannot_overwrite_recovered_task(self):
        tid = self.task()
        cl = self.o.claim("slow")
        self.clock.t += self.o.lease + 1
        self.o.store.recover_expired()
        self.assertEqual(self.o.process(cl), "lease_lost")
        self.assertEqual(self.state(tid), "RETRYING")

    def test_idempotent_submission(self):
        a = self.task(idempotency_key="k1")
        b = self.task(idempotency_key="k1")
        self.assertEqual(a, b)
        self.assertEqual(len(self.o.store.tasks()), 1)


# 7 ----------------------------------------------------------------------------
class TestRetry(Base):
    def test_transient_failures_retry_then_succeed(self):
        tid = self.task(payload={"mock_fail_times": 2})
        self.o.run()
        t = self.o.store.task(tid)
        self.assertEqual(t["status"], "COMPLETED")
        self.assertEqual(t["attempts"], 3)
        self.assertEqual(len(self.o.store.artifacts(tid)), 1)  # only the good attempt saved

    def test_retries_are_bounded_and_escalate(self):
        tid = self.task(payload={"mock_fail_times": 99})
        self.o.run()
        self.assertEqual(self.state(tid), "FAILED")
        self.assertEqual(self.o.store.task(tid)["attempts"], 3)
        esc = [a for a in self.o.approvals.pending() if a["task_id"] == tid]
        self.assertEqual([a["action"] for a in esc], [ESCALATION])
        self.o.approve(esc[0]["id"], "test-human")       # human says "try again"
        self.assertEqual(self.state(tid), "QUEUED")
        self.assertEqual(self.o.store.task(tid)["attempts"], 0)

    def test_fatal_error_does_not_retry(self):
        tid = self.task(payload={"mock_fatal": True})
        self.o.run()
        t = self.o.store.task(tid)
        self.assertEqual((t["status"], t["attempts"]), ("FAILED", 1))

    def test_invalid_output_is_not_reported_complete(self):
        tid = self.task(payload={"mock_empty": True})
        self.o.run()
        self.assertEqual(self.state(tid), "FAILED")
        self.assertIn("validation", self.o.store.task(tid)["error"])

    def test_failed_dependency_blocks_dependent(self):
        bad = self.task(payload={"mock_fatal": True})
        dep = self.task(depends_on=[bad])
        self.o.run()
        self.assertEqual(self.state(dep), "BLOCKED")

    def test_dependent_waits_for_predecessor(self):
        first = self.task()
        second = self.task("software_factory", "frontend", depends_on=[first], allow_borrow=True)
        cl = self.o.claim("w1")
        self.assertEqual(cl.task["id"], first)
        self.assertIsNone(self.o.claim("w2"))
        self.o.process(cl)
        self.o.run()
        self.assertEqual(self.state(second), "COMPLETED")


# 8 ----------------------------------------------------------------------------
class TestApprovals(Base):
    def test_external_communication_cannot_execute_without_approval(self):
        adapter = self.o.adapters["mock"]
        tid = self.o.submit("customer_acquisition", "send outreach", "outreach_drafting",
                            action="external_communication", payload={})
        self.o.run()
        self.assertEqual(self.state(tid), "WAITING_APPROVAL")
        self.assertEqual(adapter.calls, 0)
        self.assertEqual(self.o.store.artifacts(tid), [])
        pend = self.o.approvals.pending()
        self.assertEqual(pend[0]["action"], "external_communication")
        with self.assertRaises(PermissionError):
            self.o.approve(pend[0]["id"], "agent:outreach_writer")   # agents can't self-approve
        with self.assertRaises(PermissionError):
            self.o.approve(pend[0]["id"], "orchestrator")
        self.o.run()
        self.assertEqual(adapter.calls, 0)
        self.o.approve(pend[0]["id"], "test-human", "ok to send")
        self.o.run()
        self.assertEqual(self.state(tid), "COMPLETED")

    def test_rejected_action_is_blocked(self):
        tid = self.o.submit("software_factory", "deploy", "release_readiness", action="production_deploy")
        self.o.run()
        aid = self.o.approvals.pending()[0]["id"]
        self.o.reject(aid, "test-human", "not yet")
        self.o.run()
        self.assertEqual(self.state(tid), "BLOCKED")

    def test_approval_is_bound_to_one_task(self):
        a = self.o.submit("media_production", "publish A", "canon_management", action="publish_content")
        b = self.o.submit("media_production", "publish B", "canon_management", action="publish_content")
        self.o.run()
        aid_a = [x for x in self.o.approvals.pending() if x["task_id"] == a][0]["id"]
        self.o.approve(aid_a, "test-human")
        self.o.run()
        self.assertEqual(self.state(a), "COMPLETED")
        self.assertEqual(self.state(b), "WAITING_APPROVAL")

    def test_unknown_action_defaults_to_approval_required(self):
        tid = self.task(action="wire_money")
        self.o.run()
        self.assertEqual(self.state(tid), "WAITING_APPROVAL")

    def test_high_risk_requires_validation_review_and_human_signoff(self):
        tid = self.task(cap="backend", risk="high")
        self.o.run()
        t = self.o.store.task(tid)
        self.assertEqual(t["status"], "WAITING_APPROVAL")
        self.assertTrue(t["result"]["review"]["passed"])
        aid = [x for x in self.o.approvals.pending() if x["action"] == ACCEPT_RESULT][0]["id"]
        self.o.approve(aid, "test-human")
        self.assertEqual(self.state(tid), "COMPLETED")


# 9 ----------------------------------------------------------------------------
class TestCostGuard(Base):
    def test_unauthorized_chargeable_call_is_blocked_until_approved(self):
        paid = self.o.adapters["mock_paid"]
        tid = self.task(payload={"provider": "mock_paid"})
        self.o.run()
        self.assertEqual(self.state(tid), "WAITING_APPROVAL")
        self.assertEqual(paid.calls, 0)
        pend = self.o.approvals.pending()
        self.assertEqual(pend[0]["action"], CHARGEABLE)
        self.o.approve(pend[0]["id"], "test-human")
        self.o.run()
        self.assertEqual(self.state(tid), "COMPLETED")
        self.assertEqual(paid.calls, 1)
        self.assertAlmostEqual(self.o.budget.spent_today(), 0.25)

    def test_per_task_ceiling_blocks_even_with_approval(self):
        self.cfg["providers"]["mock_paid"]["est_cost_usd"] = 1.50
        self.o.store.close()
        self.o = self.make()
        tid = self.task(payload={"provider": "mock_paid"})
        self.o.run()
        self.assertEqual(self.state(tid), "BLOCKED")
        self.assertIn("per-task ceiling", self.o.store.task(tid)["error"])
        self.assertEqual(self.o.adapters["mock_paid"].calls, 0)

    def test_daily_ceiling_blocks(self):
        seed = self.task()
        with self.o.store.tx() as c:
            self.o.budget.record(c, seed, None, "mock_paid", "x", True, 4.90, 4.90)
        tid = self.task(payload={"provider": "mock_paid"})
        self.o.run()
        self.assertEqual(self.state(tid), "BLOCKED")
        self.assertIn("daily ceiling", self.o.store.task(tid)["error"])

    def test_unverified_live_provider_is_never_called(self):
        tid = self.task(payload={"provider": "anthropic"})
        self.o.run()
        self.assertEqual(self.state(tid), "BLOCKED")
        self.assertIn("unavailable", self.o.store.task(tid)["error"])
        self.assertEqual(self.o.adapters["anthropic"].calls, 0)


# 10 ---------------------------------------------------------------------------
class TestTraceability(Base):
    def test_every_output_traces_to_a_task(self):
        ids = [self.task(), self.task("customer_acquisition", "lead_discovery", risk="medium",
                                      payload={"requires_sources": True}),
               self.task("media_production", "scriptwriting")]
        self.o.run()
        arts = self.o.store.artifacts()
        self.assertEqual({a["task_id"] for a in arts}, set(ids))
        for a in arts:
            t = self.o.store.task(a["task_id"])
            p = Path(a["path"])
            self.assertIn(a["task_id"], p.parts)
            self.assertIn(self.o.workspaces / t["team"], p.parents)
            self.assertIn(f'"task_id": "{a["task_id"]}"', p.read_text().splitlines()[0])
            self.assertTrue(a["verified"])
        usage = self.o.store.conn().execute("SELECT task_id FROM usage").fetchall()
        self.assertTrue(usage and all(self.o.store.task(r[0]) for r in usage))
        lead = self.o.store.task(ids[1])
        self.assertTrue(lead["simulated"])
        for s in lead["result"]["sources"]:
            self.assertTrue({"url", "date", "confidence", "qualification_reason"} <= set(s))


# 11 ---------------------------------------------------------------------------
class TestTinaIsolation(Base):
    def test_agents_cannot_write_to_tina_or_outside_workspace(self):
        g = self.o.guard("software_factory")
        for bad in ["../../../aps-tina/src/hack.ts", str(TINA / "README.md"), "../customer_acquisition/x",
                    "../../escape.txt"]:
            with self.assertRaises(WorkspaceViolation, msg=bad):
                g.write(bad, "x")
        g.write("ok/inside.txt", "fine")

    def test_shared_reference_is_read_only_for_agents(self):
        g = self.o.guard("media_production")
        with self.assertRaises(WorkspaceViolation):
            g.write("../../shared_reference/canon.md", "x")


def tearDownModule():
    after = tina_fingerprint()
    if TINA_BEFORE is not None and after != TINA_BEFORE:
        raise AssertionError("aps-tina changed during the test run!")


class TestZZTinaUntouched(unittest.TestCase):
    """Runs last (alphabetical): compares aps-tina before vs after the whole suite."""

    def test_tina_fingerprint_unchanged(self):
        if TINA_BEFORE is None:
            self.skipTest("aps-tina not present in this workspace")
        self.assertEqual(tina_fingerprint(), TINA_BEFORE)


if __name__ == "__main__":
    unittest.main(verbosity=2)
