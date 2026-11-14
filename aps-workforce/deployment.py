"""Deployment plans: validate role/repo/permission assignments and queue first tasks.

`plan` checks the deployment file against the live configuration and reports,
per assignment, whether it can run now (READY) or what it is waiting for.
`apply` queues each assignment's first tasks (idempotent via task keys).
Nothing here grants permissions; it only refuses plans the config doesn't back.
"""
from __future__ import annotations

from pathlib import Path

import yaml

from repo_sandbox import RepoPolicyError


LIMITS = {"coding_agent_adapter": "no tool-using coding adapter yet: these roles can analyse and "
                                  "draft, but cannot edit code or run commands on their own"}


class DeploymentError(ValueError):
    pass


class Deployment:
    def __init__(self, orch, path: Path):
        self.o = orch
        doc = yaml.safe_load(Path(path).read_text())
        self.meta = doc["deployment"]
        self.assignments = doc["assignments"]

    # ------------------------------------------------------------ validation
    def validate(self) -> list[str]:
        o, errs = self.o, []
        required, pre = o.approvals.required, o.approvals.preauthorized
        for a in self.meta["owner_approval_required_for"]:
            if a not in required:
                errs.append(f"'{a}' must be in approval_required_actions")
        for a in self.meta["autonomous_actions"]:
            if a not in pre or a in required:
                errs.append(f"autonomous action '{a}' is not preauthorized in config")
        keys = set()
        for asg in self.assignments:
            tag = asg["id"]
            if asg["team"] not in o.teams:
                errs.append(f"{tag}: unknown team {asg['team']}")
                continue
            for r in asg["roles"]:
                role = o.roles.get(r)
                if not role or role["team"] != asg["team"]:
                    errs.append(f"{tag}: role {r} is not on team {asg['team']}")
            for slug in asg.get("repos", []):
                try:
                    o.policy.check_repo_allowed(slug)
                except RepoPolicyError as e:
                    errs.append(f"{tag}: {e}")
            prov = asg.get("provider")
            if prov and prov not in o.adapters:
                errs.append(f"{tag}: unknown provider {prov}")
            caps = {c for r in asg["roles"] for c in o.roles.get(r, {}).get("capabilities", [])}
            for t in asg.get("first_tasks", []):
                if t["key"] in keys:
                    errs.append(f"{tag}: duplicate task key {t['key']}")
                keys.add(t["key"])
                if t["capability"] not in caps:
                    errs.append(f"{tag}: task {t['key']} needs '{t['capability']}', "
                                f"which none of {asg['roles']} has")
                if t["action"] not in self.meta["autonomous_actions"]:
                    errs.append(f"{tag}: first task {t['key']} action '{t['action']}' is not autonomous")
                repo = (t.get("payload") or {}).get("repo")
                if repo and repo not in asg.get("repos", []):
                    errs.append(f"{tag}: task {t['key']} targets {repo}, outside the assignment's repos")
        return errs

    # ------------------------------------------------------------ readiness
    def readiness(self, asg: dict) -> tuple[bool, list[str]]:
        o, waiting = self.o, []
        prov = asg.get("provider")
        if prov:
            ok, why = o.adapters[prov].available(o.mode)
            if not ok:
                waiting.append(f"provider {prov}: {why}")
        for need in asg.get("needs", []):
            if need == "model_provider":
                ok, why = o.adapters["anthropic"].available(o.mode)
                if not ok:
                    waiting.append(f"model provider not live: {why}")
            else:
                waiting.append(need.replace("_", " "))
        for slug in asg.get("repos", []):
            try:
                o.policy.find_source(slug)
            except RepoPolicyError:
                waiting.append(f"no local checkout of {slug}")
        return (not waiting), waiting

    def plan(self) -> dict:
        errs = self.validate()
        rows = []
        for asg in self.assignments:
            ready, waiting = self.readiness(asg) if not errs else (False, ["fix validation errors"])
            rows.append({"id": asg["id"], "team": asg["team"], "roles": asg["roles"],
                         "repos": asg.get("repos", []), "provider": asg.get("provider") or ("anthropic" if "model_provider" in asg.get("needs", [])
                                                             else o_default(self.o)),
                         "ready": ready, "waiting_on": waiting,
                         "limits": [LIMITS.get(x, x) for x in asg.get("limits", [])],
                         "first_tasks": [t["key"] for t in asg.get("first_tasks", [])]})
        return {"deployment": self.meta["name"], "mode": self.o.mode, "valid": not errs, "errors": errs,
                "protected": {"repos": sorted(self.o.policy.protected_repos),
                              "paths_found": [str(p) for p in self.o.policy.existing_protected_paths()]},
                "assignments": rows}

    # ------------------------------------------------------------ apply
    def apply(self, only_ready: bool = True) -> dict:
        errs = self.validate()
        if errs:
            raise DeploymentError("; ".join(errs))
        ids: dict[str, str] = {}
        queued, skipped = [], []
        for asg in self.assignments:
            ready, waiting = self.readiness(asg)
            if only_ready and not ready:
                skipped.append({"assignment": asg["id"], "waiting_on": waiting})
                continue
            for t in asg.get("first_tasks", []):
                t = dict(t)
                deps = [d for d in (ids.get(k) or self._task_by_key(k)
                                    for k in t.pop("depends_on_keys", [])) if d]
                payload = dict(t.pop("payload", {}) or {})
                if asg.get("provider"):
                    payload.setdefault("provider", asg["provider"])
                elif "model_provider" in asg.get("needs", []):
                    payload.setdefault("provider", "anthropic")
                payload["assignment"] = asg["id"]
                key = t.pop("key")
                ids[key] = self.o.submit(asg["team"], t.pop("title"), t.pop("capability"),
                                         idempotency_key=key, depends_on=deps, payload=payload,
                                         actor=f"deployment:{self.meta['name']}", **t)
                queued.append({"task": ids[key], "key": key, "assignment": asg["id"]})
        return {"queued": queued, "skipped_not_ready": skipped}


    def _task_by_key(self, key: str) -> str | None:
        r = self.o.store.conn().execute("SELECT id FROM tasks WHERE idempotency_key=?", (key,)).fetchone()
        return r["id"] if r else None


def o_default(orch) -> str:
    return orch.default_provider
