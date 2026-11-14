"""Durable state for the APS workforce: SQLite task queue, role registry,
execution slots, approvals ledger, usage ledger, artifacts and audit log.

Every state change runs inside a `BEGIN IMMEDIATE` transaction, so several
worker threads or processes can share one database and claims stay atomic.
"""
from __future__ import annotations

import json
import sqlite3
import threading
import time
import uuid
from contextlib import contextmanager
from dataclasses import dataclass
from typing import Callable, Iterable

# ---------------------------------------------------------------- states
TASK_STATES = {
    "QUEUED", "ASSIGNED", "EXECUTING", "REVIEW", "RETRYING",
    "WAITING_APPROVAL", "BLOCKED", "FAILED", "COMPLETED",
}
TERMINAL_TASK_STATES = {"COMPLETED", "FAILED", "BLOCKED"}

AGENT_REST = {"leader": "ACTIVATED", "specialist": "STANDBY"}
REST = "REST"  # sentinel: "return this agent to its resting state" (leader/specialist aware)
_INTERRUPT = {"BLOCKED", "FAILED", "WAITING_APPROVAL", "RETRYING"}
_REST = {"STANDBY", "ACTIVATED"}
AGENT_TRANSITIONS: dict[str, set[str]] = {
    "STANDBY": {"ACTIVATED"},
    "ACTIVATED": {"ASSIGNED", "STANDBY"},
    "ASSIGNED": {"EXECUTING"} | _INTERRUPT,
    "EXECUTING": {"REVIEW", "COMPLETED"} | _INTERRUPT,
    "REVIEW": {"COMPLETED"} | _INTERRUPT,
    "COMPLETED": set(_REST),
    **{s: set(_REST) for s in _INTERRUPT},
}

SCHEMA = """
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY, team TEXT NOT NULL, title TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('leader','specialist')),
    capabilities TEXT NOT NULL, model_tier TEXT NOT NULL,
    state TEXT NOT NULL, current_task TEXT, updated_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS slots (
    id INTEGER PRIMARY KEY, home_team TEXT,
    holder_agent TEXT, task_id TEXT, lease_expires REAL
);
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY, team TEXT NOT NULL, title TEXT NOT NULL,
    capability TEXT NOT NULL, action TEXT NOT NULL, risk TEXT NOT NULL,
    status TEXT NOT NULL, priority INTEGER NOT NULL DEFAULT 0,
    assigned_agent TEXT, reviewer_agent TEXT,
    depends_on TEXT NOT NULL DEFAULT '[]', payload TEXT NOT NULL DEFAULT '{}',
    attempts INTEGER NOT NULL DEFAULT 0, max_attempts INTEGER NOT NULL,
    lease_owner TEXT, lease_expires REAL, slot_id INTEGER,
    idempotency_key TEXT UNIQUE, allow_borrow INTEGER NOT NULL DEFAULT 0,
    checkpoint TEXT, result TEXT, error TEXT, simulated INTEGER NOT NULL DEFAULT 0,
    next_attempt_at REAL, created_at REAL NOT NULL, updated_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS approvals (
    id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks(id),
    action TEXT NOT NULL, reason TEXT, status TEXT NOT NULL,
    requested_by TEXT, requested_at REAL NOT NULL,
    decided_by TEXT, decided_at REAL, note TEXT
);
CREATE TABLE IF NOT EXISTS usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT, task_id TEXT NOT NULL REFERENCES tasks(id),
    agent_id TEXT, provider TEXT, model TEXT, chargeable INTEGER NOT NULL,
    est_cost REAL NOT NULL, actual_cost REAL, ts REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS artifacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, task_id TEXT NOT NULL REFERENCES tasks(id),
    agent_id TEXT NOT NULL, path TEXT NOT NULL, version INTEGER NOT NULL,
    sha256 TEXT NOT NULL, verified INTEGER NOT NULL, created_at REAL NOT NULL,
    UNIQUE (task_id, path, version)
);
CREATE TABLE IF NOT EXISTS audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT, ts REAL NOT NULL, actor TEXT NOT NULL,
    event TEXT NOT NULL, task_id TEXT, agent_id TEXT, detail TEXT
);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status, team);
CREATE INDEX IF NOT EXISTS idx_approvals_task ON approvals(task_id, action, status);
"""


class StateError(RuntimeError):
    """An illegal state transition was attempted."""


@dataclass
class Claim:
    task: dict
    agent: dict
    slot_id: int
    phase: str          # "execute" | "review"
    worker: str


def _row(r: sqlite3.Row | None) -> dict | None:
    if r is None:
        return None
    d = dict(r)
    for k in ("capabilities", "depends_on", "payload", "checkpoint", "result", "detail"):
        if k in d and isinstance(d[k], str):
            try:
                d[k] = json.loads(d[k])
            except json.JSONDecodeError:
                pass
    return d


class TaskQueue:
    def __init__(self, db_path: str, now: Callable[[], float] = time.time):
        self.db_path = db_path
        self.now = now
        self._local = threading.local()
        self.conn().executescript(SCHEMA)

    # ------------------------------------------------------------ plumbing
    def conn(self) -> sqlite3.Connection:
        c = getattr(self._local, "conn", None)
        if c is None:
            c = sqlite3.connect(self.db_path, timeout=30, isolation_level=None,
                                check_same_thread=False)
            c.row_factory = sqlite3.Row
            c.execute("PRAGMA journal_mode=WAL")
            c.execute("PRAGMA foreign_keys=ON")
            c.execute("PRAGMA busy_timeout=30000")
            self._local.conn = c
        return c

    def close(self):
        c = getattr(self._local, "conn", None)
        if c is not None:
            c.close()
            self._local.conn = None

    @contextmanager
    def tx(self):
        c = self.conn()
        c.execute("BEGIN IMMEDIATE")
        try:
            yield c
            c.execute("COMMIT")
        except BaseException:
            c.execute("ROLLBACK")
            raise

    def audit(self, c, actor: str, event: str, task_id=None, agent_id=None, **detail):
        c.execute("INSERT INTO audit (ts, actor, event, task_id, agent_id, detail) VALUES (?,?,?,?,?,?)",
                  (self.now(), actor, event, task_id, agent_id, json.dumps(detail, default=str)))

    # ------------------------------------------------------------ registry
    def register_agents(self, agents: Iterable[dict]):
        """Idempotent: registers missing roles; never resets live state."""
        with self.tx() as c:
            for a in agents:
                if c.execute("SELECT 1 FROM agents WHERE id=?", (a["id"],)).fetchone():
                    continue
                c.execute("INSERT INTO agents VALUES (?,?,?,?,?,?,?,?,?)", (
                    a["id"], a["team"], a["title"], a["kind"], json.dumps(a["capabilities"]),
                    a.get("model_tier", "routine"), AGENT_REST[a["kind"]], None, self.now()))
                self.audit(c, "system", "agent_registered", agent_id=a["id"], state=AGENT_REST[a["kind"]])

    def init_slots(self, max_slots: int, teams: list[str]):
        with self.tx() as c:
            existing = c.execute("SELECT COUNT(*) FROM slots").fetchone()[0]
            if existing == max_slots:
                return
            if c.execute("SELECT COUNT(*) FROM slots WHERE holder_agent IS NOT NULL").fetchone()[0]:
                raise StateError("cannot resize slots while work is executing")
            c.execute("DELETE FROM slots")
            for i in range(max_slots):
                home = teams[i] if i < len(teams) else None
                c.execute("INSERT INTO slots (id, home_team) VALUES (?,?)", (i + 1, home))
            self.audit(c, "system", "slots_initialized", max_slots=max_slots)

    def agents(self, team: str | None = None) -> list[dict]:
        q, args = "SELECT * FROM agents", ()
        if team:
            q, args = q + " WHERE team=?", (team,)
        return [_row(r) for r in self.conn().execute(q + " ORDER BY team, kind, id", args)]

    def agent(self, agent_id: str) -> dict | None:
        return _row(self.conn().execute("SELECT * FROM agents WHERE id=?", (agent_id,)).fetchone())

    def set_agent_state(self, c, agent_id: str, new: str, task_id=None, force=False):
        a = _row(c.execute("SELECT * FROM agents WHERE id=?", (agent_id,)).fetchone())
        if new == REST:
            new = AGENT_REST[a["kind"]]
        old = a["state"]
        if old == new:
            return
        if not force and new not in AGENT_TRANSITIONS.get(old, set()):
            raise StateError(f"agent {agent_id}: {old} -> {new} not allowed")
        cur = None if new in _REST else (task_id or a["current_task"])
        c.execute("UPDATE agents SET state=?, current_task=?, updated_at=? WHERE id=?",
                  (new, cur, self.now(), agent_id))
        self.audit(c, "orchestrator", "agent_state", task_id=task_id, agent_id=agent_id,
                   frm=old, to=new, forced=force)

    def walk_agent(self, c, agent_id: str, states: list[str], task_id=None):
        for s in states:
            self.set_agent_state(c, agent_id, s, task_id)

    # ------------------------------------------------------------ tasks
    def submit(self, *, team: str, title: str, capability: str, action: str = "draft",
               risk: str = "low", payload: dict | None = None, depends_on: list[str] | None = None,
               priority: int = 0, idempotency_key: str | None = None, allow_borrow: bool = False,
               max_attempts: int = 3, actor: str = "human") -> str:
        if risk not in ("low", "medium", "high"):
            raise ValueError("risk must be low|medium|high")
        with self.tx() as c:
            if idempotency_key:
                r = c.execute("SELECT id FROM tasks WHERE idempotency_key=?", (idempotency_key,)).fetchone()
                if r:
                    return r["id"]
            tid = "T-" + uuid.uuid4().hex[:10]
            now = self.now()
            c.execute("""INSERT INTO tasks (id, team, title, capability, action, risk, status, priority,
                         depends_on, payload, max_attempts, idempotency_key, allow_borrow,
                         created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                      (tid, team, title, capability, action, risk, "QUEUED", priority,
                       json.dumps(depends_on or []), json.dumps(payload or {}), max_attempts,
                       idempotency_key, int(allow_borrow), now, now))
            self.audit(c, actor, "task_submitted", task_id=tid, team=team, title=title,
                       capability=capability, action=action, risk=risk)
            return tid

    def task(self, task_id: str) -> dict | None:
        return _row(self.conn().execute("SELECT * FROM tasks WHERE id=?", (task_id,)).fetchone())

    def tasks(self, status: str | None = None, team: str | None = None) -> list[dict]:
        q, args = "SELECT * FROM tasks WHERE 1=1", []
        if status:
            q += " AND status=?"; args.append(status)
        if team:
            q += " AND team=?"; args.append(team)
        return [_row(r) for r in self.conn().execute(q + " ORDER BY created_at", args)]

    def update_task(self, c, task_id: str, actor="orchestrator", event="task_update", **fields):
        if "status" in fields and fields["status"] not in TASK_STATES:
            raise StateError(f"bad task status {fields['status']}")
        for k in ("payload", "checkpoint", "result", "depends_on"):
            if k in fields and not isinstance(fields[k], (str, type(None))):
                fields[k] = json.dumps(fields[k], default=str)
        fields["updated_at"] = self.now()
        sets = ", ".join(f"{k}=?" for k in fields)
        c.execute(f"UPDATE tasks SET {sets} WHERE id=?", (*fields.values(), task_id))
        if "status" in fields:
            self.audit(c, actor, event, task_id=task_id, status=fields["status"],
                       error=fields.get("error"))

    # ------------------------------------------------------------ claiming
    def _deps_state(self, c, deps: list[str]) -> str:
        if not deps:
            return "ready"
        rows = c.execute(f"SELECT status FROM tasks WHERE id IN ({','.join('?' * len(deps))})",
                         deps).fetchall()
        states = [r["status"] for r in rows]
        if len(states) < len(deps) or any(s in ("FAILED", "BLOCKED") for s in states):
            return "broken"
        return "ready" if all(s == "COMPLETED" for s in states) else "waiting"

    def _pick_agent(self, c, task: dict, phase: str, reviewer_pref: str | None) -> dict | None:
        team_agents = [_row(r) for r in c.execute("SELECT * FROM agents WHERE team=?", (task["team"],))]
        at_rest = [a for a in team_agents if a["state"] in _REST]
        if phase == "review":
            # Independent review: never the agent that produced the work.
            others = [a for a in at_rest if a["id"] != task["assigned_agent"]]
            ranked = sorted(others, key=lambda a: (a["id"] != reviewer_pref,
                                                   "review" not in a["capabilities"],
                                                   a["kind"] != "leader"))
            ok = [a for a in ranked if a["id"] == reviewer_pref or "review" in a["capabilities"]
                  or a["kind"] == "leader"]
            return ok[0] if ok else None
        capable = [a for a in at_rest if task["capability"] in a["capabilities"]]
        capable.sort(key=lambda a: 0 if a["kind"] == "leader" else 1)  # leader first if able
        return capable[0] if capable else None

    def _pick_slot(self, c, task: dict) -> int | None:
        r = c.execute("SELECT id FROM slots WHERE holder_agent IS NULL AND home_team=?",
                      (task["team"],)).fetchone()
        if r:
            return r["id"]
        r = c.execute("SELECT id FROM slots WHERE holder_agent IS NULL AND home_team IS NULL").fetchone()
        if r:
            return r["id"]
        if task["allow_borrow"]:
            r = c.execute("SELECT id FROM slots WHERE holder_agent IS NULL ORDER BY id").fetchone()
            if r:
                return r["id"]
        return None

    def claim(self, worker: str, lease_seconds: float, reviewers: dict[str, str] | None = None,
              team: str | None = None) -> Claim | None:
        """Atomically claim the next ready task, an agent able to run it, and a slot."""
        reviewers = reviewers or {}
        with self.tx() as c:
            now = self.now()
            q = """SELECT * FROM tasks WHERE lease_owner IS NULL
                   AND status IN ('QUEUED','RETRYING','REVIEW')
                   AND (next_attempt_at IS NULL OR next_attempt_at <= ?)"""
            args: list = [now]
            if team:
                q += " AND team=?"; args.append(team)
            for t in map(_row, c.execute(q + " ORDER BY priority DESC, created_at", args).fetchall()):
                deps = self._deps_state(c, t["depends_on"])
                if deps == "broken":
                    self.update_task(c, t["id"], status="BLOCKED", error="dependency failed or missing")
                    continue
                if deps == "waiting":
                    continue
                phase = "review" if t["status"] == "REVIEW" else "execute"
                agent = self._pick_agent(c, t, phase, reviewers.get(t["team"]))
                if not agent:
                    continue
                slot = self._pick_slot(c, t)
                if slot is None:
                    continue
                exp = now + lease_seconds
                n = c.execute("""UPDATE slots SET holder_agent=?, task_id=?, lease_expires=?
                                 WHERE id=? AND holder_agent IS NULL""",
                              (agent["id"], t["id"], exp, slot)).rowcount
                if n != 1:
                    continue
                fields = dict(lease_owner=worker, lease_expires=exp, slot_id=slot)
                if phase == "execute":
                    fields.update(status="ASSIGNED", assigned_agent=agent["id"])
                else:
                    fields.update(reviewer_agent=agent["id"])
                self.update_task(c, t["id"], event="task_claimed", **fields)
                if agent["state"] == "STANDBY":
                    self.set_agent_state(c, agent["id"], "ACTIVATED", t["id"])
                    self.audit(c, "orchestrator", "specialist_activated", task_id=t["id"],
                               agent_id=agent["id"], slot=slot)
                self.set_agent_state(c, agent["id"], "ASSIGNED", t["id"])
                self.audit(c, worker, "slot_acquired", task_id=t["id"], agent_id=agent["id"],
                           slot=slot, phase=phase, borrowed=self._is_borrowed(c, slot, t["team"]))
                return Claim(self.task_in(c, t["id"]), _row(c.execute(
                    "SELECT * FROM agents WHERE id=?", (agent["id"],)).fetchone()), slot, phase, worker)
            return None

    def _is_borrowed(self, c, slot: int, team: str) -> bool:
        home = c.execute("SELECT home_team FROM slots WHERE id=?", (slot,)).fetchone()["home_team"]
        return home not in (None, team)

    def task_in(self, c, task_id: str) -> dict:
        return _row(c.execute("SELECT * FROM tasks WHERE id=?", (task_id,)).fetchone())

    def heartbeat(self, claim: Claim, lease_seconds: float):
        with self.tx() as c:
            exp = self.now() + lease_seconds
            n = c.execute("UPDATE tasks SET lease_expires=? WHERE id=? AND lease_owner=?",
                          (exp, claim.task["id"], claim.worker)).rowcount
            if n != 1:
                raise StateError("lease lost")
            c.execute("UPDATE slots SET lease_expires=? WHERE id=?", (exp, claim.slot_id))

    def still_owns(self, c, claim: Claim) -> bool:
        r = c.execute("SELECT lease_owner FROM tasks WHERE id=?", (claim.task["id"],)).fetchone()
        return r is not None and r["lease_owner"] == claim.worker

    def release_slot(self, c, claim: Claim):
        c.execute("UPDATE slots SET holder_agent=NULL, task_id=NULL, lease_expires=NULL WHERE id=?",
                  (claim.slot_id,))
        self.audit(c, claim.worker, "slot_released", task_id=claim.task["id"],
                   agent_id=claim.agent["id"], slot=claim.slot_id)

    def slots(self) -> list[dict]:
        return [_row(r) for r in self.conn().execute("SELECT * FROM slots ORDER BY id")]

    # ------------------------------------------------------------ recovery
    def recover_expired(self) -> list[str]:
        """Return tasks whose lease expired (worker crashed/hung) to the queue."""
        recovered = []
        with self.tx() as c:
            now = self.now()
            rows = c.execute("""SELECT * FROM tasks WHERE lease_owner IS NOT NULL
                                AND lease_expires < ?""", (now,)).fetchall()
            for t in map(_row, rows):
                slot = t["slot_id"]
                holder = c.execute("SELECT holder_agent FROM slots WHERE id=? AND task_id=?",
                                   (slot, t["id"])).fetchone()
                c.execute("UPDATE slots SET holder_agent=NULL, task_id=NULL, lease_expires=NULL "
                          "WHERE task_id=?", (t["id"],))
                if holder and holder["holder_agent"]:
                    self.set_agent_state(c, holder["holder_agent"], REST, t["id"], force=True)
                if t["status"] == "REVIEW":
                    new = "REVIEW"
                elif t["attempts"] >= t["max_attempts"]:
                    new = "FAILED"
                else:
                    new = "RETRYING"
                self.update_task(c, t["id"], event="lease_expired", status=new, lease_owner=None,
                                 lease_expires=None, slot_id=None,
                                 error=f"lease expired (worker {t['lease_owner']})")
                recovered.append(t["id"])
            # slots whose task vanished or finished without release
            c.execute("""UPDATE slots SET holder_agent=NULL, task_id=NULL, lease_expires=NULL
                         WHERE holder_agent IS NOT NULL AND lease_expires < ?""", (now,))
        return recovered

    # ------------------------------------------------------------ ledgers
    def add_artifact(self, c, task_id, agent_id, path, sha, verified) -> int:
        v = c.execute("SELECT COALESCE(MAX(version),0)+1 FROM artifacts WHERE task_id=? AND path=?",
                      (task_id, path)).fetchone()[0]
        c.execute("""INSERT INTO artifacts (task_id, agent_id, path, version, sha256, verified, created_at)
                     VALUES (?,?,?,?,?,?,?)""", (task_id, agent_id, path, v, sha, int(verified), self.now()))
        self.audit(c, agent_id, "artifact_saved", task_id=task_id, agent_id=agent_id, path=path,
                   version=v, sha256=sha, verified=verified)
        return v

    def artifacts(self, task_id: str | None = None) -> list[dict]:
        q, args = "SELECT * FROM artifacts", ()
        if task_id:
            q, args = q + " WHERE task_id=?", (task_id,)
        return [_row(r) for r in self.conn().execute(q + " ORDER BY id", args)]

    def audit_log(self, task_id: str | None = None) -> list[dict]:
        q, args = "SELECT * FROM audit", ()
        if task_id:
            q, args = q + " WHERE task_id=?", (task_id,)
        return [_row(r) for r in self.conn().execute(q + " ORDER BY id", args)]
