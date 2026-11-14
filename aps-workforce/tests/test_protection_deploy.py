"""Tina protection by repository identity, sandboxed test runs, and deployment plans."""
from __future__ import annotations

import subprocess
import tempfile
import unittest
from pathlib import Path

import yaml

from test_acceptance import ROOT, TINA, Base

from agent_runner import WorkspaceGuard, WorkspaceViolation
from deployment import Deployment, DeploymentError
from orchestrator import ConfigError, Orchestrator
from repo_sandbox import repo_slugs_at


def git(cwd, *args) -> str:
    return subprocess.run(["git", "-c", "user.name=t", "-c", "user.email=t@t", *args], cwd=cwd,
                          check=True, capture_output=True, text=True).stdout.strip()


def make_repo(path: Path, remote: str, files: dict[str, str]) -> Path:
    path.mkdir(parents=True)
    git(path, "init", "-q")
    git(path, "remote", "add", "origin", remote)
    for name, text in files.items():
        (path / name).write_text(text)
    git(path, "add", "-A")
    git(path, "commit", "-qm", "init")
    return path


class TestTinaProtectionByIdentity(Base):
    def test_shipped_config_finds_the_real_tina_checkout(self):
        if not (TINA / ".git").exists():
            self.skipTest("aps-tina not present on this machine")
        o = Orchestrator(root=ROOT, db_path=self.tmp / "x.db")
        try:
            self.assertIn(TINA, o.policy.existing_protected_paths())
            self.assertIn("peopleweb203/aps-tina", repo_slugs_at(TINA))
            self.assertIsNotNone(o.policy.is_protected(TINA / "src" / "App.tsx"))
        finally:
            o.store.close()

    def test_any_clone_of_tina_is_protected_wherever_it_lives(self):
        for i, url in enumerate(["https://github.com/peopleweb203/aps-tina.git",
                                 "git@github.com:peopleweb203/aps-tina.git",
                                 "https://github.com/PeopleWeb203/APS-Tina"]):
            clone = make_repo(self.tmp / f"elsewhere{i}" / "renamed-folder", url, {"a.txt": "x"})
            self.assertIsNotNone(self.o.policy.is_protected(clone / "src" / "new.ts"), url)
        other = make_repo(self.tmp / "other", "https://github.com/acme/not-tina.git", {"a.txt": "x"})
        self.assertIsNone(self.o.policy.is_protected(other / "a.txt"))

    def test_workspace_inside_a_tina_clone_is_refused(self):
        clone = make_repo(self.tmp / "moved" / "tina-copy", "https://github.com/peopleweb203/aps-tina", {"a": "x"})
        with self.assertRaises(WorkspaceViolation):
            WorkspaceGuard(clone / "workspaces", "software_factory", self.tmp / "ref", self.o.policy)

    def test_orchestrator_refuses_to_start_inside_tina(self):
        clone = make_repo(self.tmp / "t2", "https://github.com/peopleweb203/aps-tina", {"a": "x"})
        cp = self.tmp / "cfg2.yaml"
        cp.write_text(yaml.safe_dump(self.cfg))
        with self.assertRaises(ConfigError):
            Orchestrator(root=clone / "aps-workforce-inside", config_path=cp,
                         agents_path=ROOT / "agents.yaml")
        self.assertEqual(git(clone, "status", "--porcelain"), "")

    def test_tasks_targeting_tina_or_unlisted_repos_are_refused(self):
        for repo in ("peopleweb203/aps-tina", "PeopleWeb203/APS-TINA", "someone/unlisted"):
            with self.assertRaises(ConfigError, msg=repo):
                self.task(cap="testing", payload={"repo": repo, "provider": "local_test"})

    def test_new_sensitive_actions_need_approval(self):
        for action in ("production_merge", "security_change", "destructive_action", "push_branch"):
            tid = self.task(action=action)
            self.o.run()
            self.assertEqual(self.state(tid), "WAITING_APPROVAL", action)
        self.assertEqual(self.o.adapters["mock"].calls, 0)


class TestSandboxedTestRuns(Base):
    def setUp(self):
        super().setUp()
        self.src = make_repo(self.tmp / "src" / "demo", "https://github.com/acme/demo.git",
                             {"ok.py": "print('fine')\n", "bad.py": "raise SystemExit(3)\n"})
        self.cfg["repos"] = {"acme/demo": {"test_command": "python3 ok.py", "local_paths": [str(self.src)]},
                             "acme/broken": {"test_command": "python3 bad.py", "local_paths": [str(self.src)]}}
        self.o.store.close()
        self.o = self.make()

    def qa(self, repo="acme/demo", **payload):
        return self.task(cap="testing", action="test",
                         payload=dict(repo=repo, provider="local_test", requires_test_evidence=True, **payload))

    def test_real_test_run_produces_non_simulated_evidence_and_leaves_source_untouched(self):
        head, refs = git(self.src, "rev-parse", "HEAD"), git(self.src, "for-each-ref")
        tid = self.qa()
        self.o.run()
        t = self.o.store.task(tid)
        self.assertEqual(t["status"], "COMPLETED")
        self.assertEqual(t["simulated"], 0)
        ev = t["result"]["evidence"]
        self.assertEqual((ev["type"], ev["exit_code"], ev["commit"]), ("test_run", 0, head))
        self.assertIn("fine", ev["output_tail"])
        self.assertEqual(self.o.budget.spent_today(), 0.0)
        sandbox = self.o.workspaces / "software_factory" / "repos" / tid / "demo"
        self.assertEqual(git(sandbox, "branch", "--show-current"), f"workforce/{tid}")
        self.assertIn("PUSH_DISABLED", git(sandbox, "remote", "get-url", "--push", "origin"))
        self.assertEqual((git(self.src, "rev-parse", "HEAD"), git(self.src, "for-each-ref"),
                          git(self.src, "status", "--porcelain")), (head, refs, ""))

    def test_failing_tests_cannot_be_reported_as_working(self):
        # acme/broken has no checkout with that remote -> not found -> fatal, never "works"
        tid = self.qa("acme/broken")
        self.o.run()
        self.assertEqual(self.state(tid), "FAILED")

    def test_failing_suite_claim_vs_qa_report(self):
        self.cfg["repos"]["acme/demo"]["test_command"] = "python3 bad.py"
        self.o.store.close()
        self.o = self.make()
        claim = self.qa()                       # "it works" claim with a failing suite
        report = self.qa(qa_report=True)        # an honest QA report of the failure
        self.o.run()
        self.assertEqual(self.state(claim), "FAILED")
        self.assertIn("tests failed", self.o.store.task(claim)["error"])
        r = self.o.store.task(report)
        self.assertEqual(r["status"], "COMPLETED")
        self.assertEqual(r["result"]["evidence"]["exit_code"], 3)
        self.assertIn("FAILED", Path(r["result"]["artifact"]).read_text())

    def test_secrets_are_not_passed_to_test_commands(self):
        import os
        os.environ["FAKE_API_KEY"] = "should-not-leak"
        try:
            self.cfg["repos"]["acme/demo"]["test_command"] = \
                "python3 -c \"import os; print('LEAK' if 'FAKE_API_KEY' in os.environ else 'CLEAN')\""
            self.o.store.close()
            self.o = self.make()
            tid = self.qa()
            self.o.run()
            self.assertIn("CLEAN", self.o.store.task(tid)["result"]["evidence"]["output_tail"])
        finally:
            del os.environ["FAKE_API_KEY"]


class TestDeployment(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="apsdep-"))
        self.o = Orchestrator(root=ROOT, db_path=self.tmp / "d.db")

    def tearDown(self):
        self.o.store.close()

    def dep(self, mutate=None) -> Deployment:
        doc = yaml.safe_load((ROOT / "deployment.yaml").read_text())
        if mutate:
            mutate(doc)
        p = self.tmp / "deployment.yaml"
        p.write_text(yaml.safe_dump(doc))
        return Deployment(self.o, p)

    def test_shipped_deployment_is_valid_and_covers_six_areas(self):
        d = self.dep()
        self.assertEqual(d.validate(), [])
        self.assertEqual({a["id"] for a in d.assignments},
                         {"software_completion", "qa_testing", "code_recovery", "crm_integration",
                          "resource_optimization", "documentation"})

    def test_model_backed_assignments_wait_in_simulation_mode(self):
        plan = self.dep().plan()
        waiting = {a["id"] for a in plan["assignments"] if not a["ready"]}
        self.assertEqual(waiting, {"software_completion", "code_recovery", "crm_integration",
                                   "resource_optimization", "documentation"})

    def test_apply_queues_only_ready_work_and_is_idempotent(self):
        d = self.dep()
        first = d.apply()
        again = d.apply()
        self.assertEqual([q["task"] for q in first["queued"]], [q["task"] for q in again["queued"]])
        self.assertTrue(all(q["assignment"] == "qa_testing" for q in first["queued"])
                        or not first["queued"])
        self.assertEqual(len(self.o.store.tasks()), len(first["queued"]))

    def test_deployment_cannot_assign_tina(self):
        d = self.dep(lambda doc: doc["assignments"][0]["repos"].append("peopleweb203/aps-tina"))
        self.assertTrue(any("protected" in e for e in d.validate()))
        with self.assertRaises(DeploymentError):
            d.apply()

    def test_deployment_cannot_make_sensitive_actions_autonomous(self):
        d = self.dep(lambda doc: doc["deployment"]["autonomous_actions"].append("production_merge"))
        self.assertTrue(d.validate())
        d = self.dep(lambda doc: doc["assignments"][0]["first_tasks"][0].update(action="production_deploy"))
        self.assertTrue(any("not autonomous" in e for e in d.validate()))

    def test_role_must_have_the_capability_and_team(self):
        d = self.dep(lambda doc: doc["assignments"][0].update(roles=["lead_scout"]))
        self.assertTrue(d.validate())


if __name__ == "__main__":
    unittest.main(verbosity=2)
