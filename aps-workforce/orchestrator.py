#!/usr/bin/env python3
"""APS AI Workforce orchestrator.

One shared orchestrator, five isolated team workspaces, 25 role definitions,
max 5 concurrent execution slots. State lives in SQLite, so any run can be
interrupted and resumed: `python orchestrator.py run` picks up where the last
one stopped (expired leases are recovered first).
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import sys
import time
from concurrent.futures import FIRST_COMPLETED, ThreadPoolExecutor, wait
from pathlib import Path

import yaml

from agent_runner import (FatalError, RecoverableError, WorkspaceGuard, build_adapters,
                          build_prompt, render_artifact, validate)
from approval_manager import ACCEPT_RESULT, CHARGEABLE, ESCALATION, ApprovalManager
from repo_sandbox import RepoPolicy, RepoPolicyError
from resource_budget import ResourceBudget
from task_queue import AGENT_REST, Claim, TaskQueue

ROOT = Path(__file__).resolve().parent


class ConfigError(ValueError):
    pass


class Orchestrator:
    def __init__(self, root: Path = ROOT, config_path: Path | None = None,
                 agents_path: Path | None = None, db_path: Path | None = None,
                 now=time.time, mode: str | None = None):
        self.root = Path(root).resolve()
        self.cfg = yaml.safe_load(Path(config_path or self.root / "workforce_config.yaml").read_text())
        self.roles = {a["id"]: a for a in
                      yaml.safe_load(Path(agents_path or self.root / "agents.yaml").read_text())["agents"]}
        self.mode = mode or self.cfg["workforce"]["mode"]
        paths = self.cfg["paths"]
        self.workspaces = self.root / paths["workspaces"]
        self.shared_ref = self.root / paths["shared_reference"]
        self.reports_dir = self.root / paths["reports"]
        self.policy = RepoPolicy(self.root, self.cfg)
        for p in (self.root, self.workspaces):
            why = self.policy.is_protected(p)
            if why:
                raise ConfigError(f"refusing to start: {p} is {why}")
        db = Path(db_path or self.root / paths["state_db"])
        db.parent.mkdir(parents=True, exist_ok=True)
        self.teams = self.cfg["teams"]
        self.validate_registry()

        self.store = TaskQueue(str(db), now=now)
        self.approvals = ApprovalManager(self.store, self.cfg)
        self.budget = ResourceBudget(self.store, self.approvals, self.cfg["budget"])
        self.adapters = build_adapters(self.cfg["providers"])
        for ad in self.adapters.values():
            if hasattr(ad, "ctx"):
                ad.ctx = {"policy": self.policy, "workspaces": self.workspaces}
        self.default_provider = self.cfg["providers"]["default"]
        self.max_slots = int(self.cfg["concurrency"]["max_slots"])
        self.lease = float(self.cfg["leases"]["duration_seconds"])
        self.reviewers = {t: v["reviewer"] for t, v in self.teams.items()}
        self.store.register_agents(self.roles.values())
        self.store.init_slots(self.max_slots, list(self.teams))
        for team in self.teams:
            (self.workspaces / team).mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------ config checks
    def validate_registry(self):
        if len(self.roles) != 25:
            raise ConfigError(f"expected 25 roles, found {len(self.roles)}")
        for team, tcfg in self.teams.items():
            members = [r for r in self.roles.values() if r["team"] == team]
            leaders = [r for r in members if r["kind"] == "leader"]
            if len(leaders) != 1 or leaders[0]["id"] != tcfg["leader"]:
                raise ConfigError(f"{team}: must have exactly one leader = {tcfg['leader']}")
            if len(members) != 5:
                raise ConfigError(f"{team}: expected 5 roles, found {len(members)}")
            rv = self.roles.get(tcfg["reviewer"])
            if not rv or rv["team"] != team or "review" not in rv["capabilities"]:
                raise ConfigError(f"{team}: reviewer {tcfg['reviewer']} invalid")
        unknown = {r["team"] for r in self.roles.values()} - set(self.teams)
        if unknown:
            raise ConfigError(f"roles reference unknown teams {unknown}")
        if int(self.cfg["concurrency"]["max_slots"]) < 1:
            raise ConfigError("max_slots must be >= 1")

    # ------------------------------------------------------------ intake
    def submit(self, team: str, title: str, capability: str, **kw) -> str:
        if team not in self.teams:
            raise ConfigError(f"unknown team {team}")
        caps = {c for r in self.roles.values() if r["team"] == team for c in r["capabilities"]}
        if capability not in caps:
            raise ConfigError(f"no role on {team} has capability '{capability}'")
        prov = (kw.get("payload") or {}).get("provider")
        if prov and prov not in self.adapters:
            raise ConfigError(f"unknown provider {prov}")
        repo = (kw.get("payload") or {}).get("repo")
        if repo:
            try:
                self.policy.check_repo_allowed(repo)
            except RepoPolicyError as e:
                raise ConfigError(str(e)) from e
        kw.setdefault("max_attempts", int(self.cfg["retries"]["max_attempts"]))
        return self.store.submit(team=team, title=title, capability=capability, **kw)

    def guard(self, team: str) -> WorkspaceGuard:
        return WorkspaceGuard(self.workspaces, team, self.shared_ref, self.policy)

    # ------------------------------------------------------------ claiming
    def claim(self, worker: str) -> Claim | None:
        self.store.recover_expired()
        return self.store.claim(worker, self.lease, self.reviewers)

    # ------------------------------------------------------------ helpers
    def _rest(self, agent: dict) -> str:
        return AGENT_REST[agent["kind"]]

    def _park(self, c, cl: Claim, task_status: str, agent_state: str, error: str):
        """Stop work on a claimed task without executing it (approval/budget gates)."""
        s = self.store
        s.update_task(c, cl.task["id"], status=task_status, error=error,
                      lease_owner=None, lease_expires=None, slot_id=None)
        s.walk_agent(c, cl.agent["id"], [agent_state, self._rest(cl.agent)], cl.task["id"])
        s.release_slot(c, cl)

    def _fail(self, cl: Claim, err: str, recoverable: bool) -> str:
        s = self.store
        with s.tx() as c:
            if not s.still_owns(c, cl):
                return "lease_lost"
            t = s.task_in(c, cl.task["id"])
            retry = recoverable and t["attempts"] < t["max_attempts"]
            new = "RETRYING" if retry else "FAILED"
            s.update_task(c, t["id"], status=new, error=err, lease_owner=None, lease_expires=None,
                          slot_id=None, checkpoint=None,
                          next_attempt_at=s.now() + float(self.cfg["retries"]["backoff_seconds"]))
            s.walk_agent(c, cl.agent["id"], [new, self._rest(cl.agent)], t["id"])
            s.release_slot(c, cl)
            if not retry:
                self.approvals.request(c, t["id"], ESCALATION,
                                       f"{'retries exhausted' if recoverable else 'fatal'}: {err}",
                                       "orchestrator")
            return new

    # ------------------------------------------------------------ execution
    def process(self, cl: Claim) -> str:
        try:
            return self._review(cl) if cl.phase == "review" else self._execute(cl)
        except Exception as e:  # never leave a slot held by an unexpected error
            return self._fail(cl, f"unexpected {type(e).__name__}: {e}", recoverable=True)

    def _execute(self, cl: Claim) -> str:
        s, t, a = self.store, cl.task, cl.agent
        adapter = self.adapters[t["payload"].get("provider", self.default_provider)]
        with s.tx() as c:
            if not s.still_owns(c, cl):
                return "lease_lost"
            # 1. approval gate (before any work or spend)
            if self.approvals.requires_approval(t["action"]) and \
                    not self.approvals.is_approved(c, t["id"], t["action"]):
                aid = self.approvals.request(c, t["id"], t["action"],
                                             f"task action '{t['action']}' requires human approval",
                                             f"agent:{a['id']}")
                self._park(c, cl, "WAITING_APPROVAL", "WAITING_APPROVAL", f"awaiting approval {aid}")
                return "WAITING_APPROVAL"
            # 2. provider availability (never claim access that wasn't verified)
            ok, why = adapter.available(self.mode)
            if not ok:
                self._park(c, cl, "BLOCKED", "BLOCKED", f"provider {adapter.name} unavailable: {why}")
                return "BLOCKED"
            # 3. cost guard
            model, est = adapter.estimate(t, a)
            d = self.budget.check(c, t["id"], adapter.name, adapter.chargeable, est)
            if not d.allowed:
                if d.needs_approval:
                    aid = self.approvals.request(c, t["id"], CHARGEABLE, d.reason, "orchestrator")
                    self._park(c, cl, "WAITING_APPROVAL", "WAITING_APPROVAL",
                               f"awaiting approval {aid}: {d.reason}")
                    return "WAITING_APPROVAL"
                self._park(c, cl, "BLOCKED", "BLOCKED", f"cost guard: {d.reason}")
                return "BLOCKED"
            s.update_task(c, t["id"], status="EXECUTING", attempts=t["attempts"] + 1)
            s.set_agent_state(c, a["id"], "EXECUTING", t["id"])
            t = s.task_in(c, t["id"])

        # 4. run the agent (outside the DB transaction)
        try:
            res = adapter.run(t, a, build_prompt(t, a, self.roles[a["id"]]))
        except RecoverableError as e:
            return self._fail(cl, f"recoverable: {e}", recoverable=True)
        except FatalError as e:
            return self._fail(cl, f"fatal: {e}", recoverable=False)
        with s.tx() as c:
            self.budget.record(c, t["id"], a["id"], adapter.name, res.model, adapter.chargeable,
                               est, res.actual_cost)

        # 5. validate, then save a versioned artifact with read-back verification
        problems = validate(t, res, self.mode)
        if problems:
            return self._fail(cl, "validation: " + "; ".join(problems), recoverable=True)
        rel = f"tasks/{t['id']}/attempt-{t['attempts']}/output.md"
        path, sha, verified = self.guard(t["team"]).write(rel, render_artifact(t, a, res))
        if not verified:
            return self._fail(cl, "artifact read-back verification failed", recoverable=True)

        # 6. route by risk policy
        policy = self.cfg["risk_policy"][t["risk"]]
        result = {"artifact": path, "sha256": sha, "model": res.model, "simulated": res.simulated,
                  "evidence": res.evidence, "sources": res.sources, "executed_by": a["id"]}
        with s.tx() as c:
            if not s.still_owns(c, cl):
                return "lease_lost"
            s.add_artifact(c, t["id"], a["id"], path, sha, verified)
            common = dict(result=result, simulated=int(res.simulated), error=None,
                          lease_owner=None, lease_expires=None, slot_id=None)
            if policy["review"]:
                s.update_task(c, t["id"], status="REVIEW",
                              checkpoint={"phase": "review", "artifact": path, "sha256": sha}, **common)
                s.walk_agent(c, a["id"], ["REVIEW", "COMPLETED", self._rest(a)], t["id"])
                out = "REVIEW"
            elif policy["human_approval"]:
                self.approvals.request(c, t["id"], ACCEPT_RESULT, "high-risk result needs sign-off",
                                       "orchestrator")
                s.update_task(c, t["id"], status="WAITING_APPROVAL", **common)
                s.walk_agent(c, a["id"], ["COMPLETED", self._rest(a)], t["id"])
                out = "WAITING_APPROVAL"
            else:
                s.update_task(c, t["id"], status="COMPLETED", event="task_completed", **common)
                s.walk_agent(c, a["id"], ["COMPLETED", self._rest(a)], t["id"])
                out = "COMPLETED"
            s.release_slot(c, cl)
            return out

    def _review(self, cl: Claim) -> str:
        s, t, rv = self.store, cl.task, cl.agent
        adapter = self.adapters[t["payload"].get("provider", self.default_provider)]
        with s.tx() as c:
            if not s.still_owns(c, cl):
                return "lease_lost"
            s.set_agent_state(c, rv["id"], "EXECUTING", t["id"])
        ck = t["checkpoint"] or {}
        data = Path(ck["artifact"]).read_bytes()
        if hashlib.sha256(data).hexdigest() != ck["sha256"]:
            return self._fail(cl, "artifact changed since execution (hash mismatch)", recoverable=True)
        try:
            ok, notes = adapter.review(t, data.decode(), rv)
        except RecoverableError as e:
            return self._fail(cl, f"review recoverable: {e}", recoverable=True)
        policy = self.cfg["risk_policy"][t["risk"]]
        with s.tx() as c:
            if not s.still_owns(c, cl):
                return "lease_lost"
            result = dict(t["result"] or {}, review={"by": rv["id"], "passed": ok, "notes": notes})
            s.walk_agent(c, rv["id"], ["COMPLETED", self._rest(rv)], t["id"])
            s.release_slot(c, cl)
            base = dict(result=result, lease_owner=None, lease_expires=None, slot_id=None)
            if ok and policy["human_approval"]:
                self.approvals.request(c, t["id"], ACCEPT_RESULT, "high-risk result passed review; "
                                       "needs human sign-off", "orchestrator")
                s.update_task(c, t["id"], status="WAITING_APPROVAL", **base)
                return "WAITING_APPROVAL"
            if ok:
                s.update_task(c, t["id"], status="COMPLETED", event="task_completed", **base)
                return "COMPLETED"
            payload = dict(t["payload"], feedback=notes)
            if t["attempts"] < t["max_attempts"]:
                s.update_task(c, t["id"], status="RETRYING", payload=payload, checkpoint=None,
                              error=f"review rejected: {notes}", **base)
                return "RETRYING"
            s.update_task(c, t["id"], status="FAILED", payload=payload, checkpoint=None,
                          error=f"review rejected, retries exhausted: {notes}", **base)
            self.approvals.request(c, t["id"], ESCALATION, f"review rejected {t['attempts']}x", "orchestrator")
            return "FAILED"

    # ------------------------------------------------------------ run loop
    def _process_in_worker(self, cl: Claim) -> str:
        try:
            return self.process(cl)
        finally:
            self.store.close()  # per-thread SQLite connection
    def run(self, max_tasks: int | None = None) -> dict:
        """Process ready work with at most `max_slots` concurrent agents, then return."""
        counts: dict[str, int] = {}
        done_n = 0
        with ThreadPoolExecutor(max_workers=self.max_slots) as pool:
            running = set()
            n = 0
            while True:
                while len(running) < self.max_slots and (max_tasks is None or done_n + len(running) < max_tasks):
                    n += 1
                    cl = self.claim(f"worker-{n}")
                    if not cl:
                        break
                    running.add(pool.submit(self._process_in_worker, cl))
                if not running:
                    break
                finished, running = wait(running, return_when=FIRST_COMPLETED)
                for f in finished:
                    r = f.result()
                    counts[r] = counts.get(r, 0) + 1
                    done_n += 1
        return counts

    # ------------------------------------------------------------ human decisions
    def approve(self, approval_id: str, decided_by: str, note: str = "") -> dict:
        s = self.store
        with s.tx() as c:
            a = self.approvals.decide(c, approval_id, True, decided_by, note)
            t = s.task_in(c, a["task_id"])
            if a["action"] == ACCEPT_RESULT:
                s.update_task(c, t["id"], actor=decided_by, event="task_completed", status="COMPLETED")
            elif a["action"] == ESCALATION:
                s.update_task(c, t["id"], actor=decided_by, status="QUEUED", attempts=0, error=None)
            elif t["status"] == "WAITING_APPROVAL":
                s.update_task(c, t["id"], actor=decided_by, status="QUEUED", error=None)
            return a

    def reject(self, approval_id: str, decided_by: str, note: str = "") -> dict:
        s = self.store
        with s.tx() as c:
            a = self.approvals.decide(c, approval_id, False, decided_by, note)
            if a["action"] != ESCALATION:
                s.update_task(c, a["task_id"], actor=decided_by, status="BLOCKED",
                              error=f"rejected by {decided_by}: {note}")
            return a

    # ------------------------------------------------------------ reporting
    def status(self) -> dict:
        s = self.store
        tasks = s.tasks()
        by_team: dict = {t: {} for t in self.teams}
        for t in tasks:
            by_team[t["team"]][t["status"]] = by_team[t["team"]].get(t["status"], 0) + 1
        agents = s.agents()
        return {
            "mode": self.mode,
            "slots": [{k: v for k, v in sl.items()} for sl in s.slots()],
            "agents": {"leaders_active": sum(a["kind"] == "leader" and a["state"] == "ACTIVATED" for a in agents),
                       "specialists_standby": sum(a["kind"] == "specialist" and a["state"] == "STANDBY" for a in agents),
                       "busy": [(a["id"], a["state"], a["current_task"]) for a in agents
                                if a["state"] not in ("ACTIVATED", "STANDBY")]},
            "tasks_by_team": by_team,
            "pending_approvals": [{k: a[k] for k in ("id", "task_id", "action", "reason")}
                                  for a in self.approvals.pending()],
            "budget": self.budget.summary(),
            "protection": {"protected_repos": sorted(self.policy.protected_repos),
                           "protected_paths_found": [str(p) for p in self.policy.existing_protected_paths()]},
        }

    def daily_report(self) -> Path:
        st = self.status()
        today = dt.datetime.fromtimestamp(self.store.now(), dt.timezone.utc).date().isoformat()
        lines = [f"# APS Workforce daily report - {today}", "",
                 f"Mode: **{self.mode}**. Outputs marked simulated are not evidence of real work.", "",
                 "## Tasks by team", "", "| Team | " + " | ".join(sorted(
                     {"QUEUED", "RETRYING", "REVIEW", "WAITING_APPROVAL", "BLOCKED", "FAILED", "COMPLETED"})) + " |",
                 "|---" * 8 + "|"]
        cols = sorted({"QUEUED", "RETRYING", "REVIEW", "WAITING_APPROVAL", "BLOCKED", "FAILED", "COMPLETED"})
        for team, counts in st["tasks_by_team"].items():
            lines.append(f"| {self.teams[team]['name']} | " + " | ".join(str(counts.get(c, 0)) for c in cols) + " |")
        lines += ["", "## Completed today", ""]
        for t in self.store.tasks(status="COMPLETED"):
            tag = " (SIMULATED)" if t["simulated"] else ""
            lines.append(f"- `{t['id']}` {t['title']}{tag} -> {(t['result'] or {}).get('artifact', '-')}")
        lines += ["", "## Waiting on you", ""]
        lines += [f"- `{a['id']}` task `{a['task_id']}`: **{a['action']}** - {a['reason']}"
                  for a in st["pending_approvals"]] or ["- nothing pending"]
        lines += ["", "## Blocked / failed", ""]
        bad = self.store.tasks(status="BLOCKED") + self.store.tasks(status="FAILED")
        lines += [f"- `{t['id']}` [{t['status']}] {t['title']}: {t['error']}" for t in bad] or ["- none"]
        b = st["budget"]
        lines += ["", "## Spend", "", f"- Spent today: ${b['spent_today']:.2f} of ${b['daily_ceiling']:.2f} "
                  f"(per-task ceiling ${b['per_task_ceiling']:.2f})", ""]
        self.reports_dir.mkdir(parents=True, exist_ok=True)
        p = self.reports_dir / f"daily_{today}.md"
        p.write_text("\n".join(lines))
        return p


# ---------------------------------------------------------------- CLI
def _cli(argv=None):
    ap = argparse.ArgumentParser(description="APS AI Workforce orchestrator")
    ap.add_argument("--db", help="override state database path")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("init", help="create state DB, register 25 roles and 5 slots")
    sp = sub.add_parser("seed", help="load seed_tasks.yaml (idempotent)")
    sp.add_argument("--file", default=str(ROOT / "seed_tasks.yaml"))
    sp = sub.add_parser("submit")
    for f in ("team", "title", "capability"):
        sp.add_argument(f"--{f}", required=True)
    sp.add_argument("--action", default="draft")
    sp.add_argument("--risk", default="low", choices=["low", "medium", "high"])
    sp.add_argument("--instructions", default="")
    sp.add_argument("--allow-borrow", action="store_true")
    sp = sub.add_parser("run", help="process ready tasks, then exit")
    sp.add_argument("--max-tasks", type=int)
    sub.add_parser("status")
    sub.add_parser("approvals", help="list pending approvals")
    for name in ("approve", "reject"):
        sp = sub.add_parser(name)
        sp.add_argument("approval_id")
        sp.add_argument("--by", required=True, help="your name (humans only)")
        sp.add_argument("--note", default="")
    sub.add_parser("report", help="write today's markdown report")
    sp = sub.add_parser("deploy", help="validate (plan) or activate (apply) deployment.yaml")
    sp.add_argument("mode", choices=["plan", "apply"])
    sp.add_argument("--file", default=str(ROOT / "deployment.yaml"))
    sp = sub.add_parser("show", help="show one task with its audit trail")
    sp.add_argument("task_id")
    args = ap.parse_args(argv)

    o = Orchestrator(db_path=args.db)
    if args.cmd == "init":
        print(json.dumps(o.status()["agents"], indent=2))
    elif args.cmd == "seed":
        seeds = yaml.safe_load(Path(args.file).read_text())["tasks"]
        ids: dict[str, str] = {}
        for t in seeds:
            deps = [ids[k] for k in t.pop("depends_on_keys", [])]
            key = t.pop("key")
            ids[key] = o.submit(t.pop("team"), t.pop("title"), t.pop("capability"),
                                idempotency_key=key, depends_on=deps, actor="seed", **t)
            print(ids[key], key)
    elif args.cmd == "submit":
        print(o.submit(args.team, args.title, args.capability, action=args.action, risk=args.risk,
                       payload={"instructions": args.instructions}, allow_borrow=args.allow_borrow))
    elif args.cmd == "run":
        print(json.dumps(o.run(max_tasks=args.max_tasks)))
    elif args.cmd == "status":
        print(json.dumps(o.status(), indent=2, default=str))
    elif args.cmd == "approvals":
        print(json.dumps(o.approvals.pending(), indent=2, default=str))
    elif args.cmd in ("approve", "reject"):
        fn = o.approve if args.cmd == "approve" else o.reject
        print(json.dumps(fn(args.approval_id, args.by, args.note), indent=2, default=str))
    elif args.cmd == "report":
        print(o.daily_report())
    elif args.cmd == "deploy":
        from deployment import Deployment
        d = Deployment(o, Path(args.file))
        print(json.dumps(d.plan() if args.mode == "plan" else d.apply(), indent=2))
    elif args.cmd == "show":
        print(json.dumps({"task": o.store.task(args.task_id),
                          "artifacts": o.store.artifacts(args.task_id),
                          "approvals": o.approvals.all(args.task_id),
                          "audit": o.store.audit_log(args.task_id)}, indent=2, default=str))


if __name__ == "__main__":
    sys.exit(_cli())
