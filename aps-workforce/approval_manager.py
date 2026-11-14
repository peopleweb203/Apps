"""Human approval queue.

An approval is bound to one (task_id, action) pair. Approving a request for
task A never authorizes the same action on task B. Actions that appear in
neither `approval_required_actions` nor `preauthorized_actions` are treated
as approval-required (default deny).
"""
from __future__ import annotations

import uuid

from task_queue import TaskQueue, _row

# Approval kinds the orchestrator raises on its own, in addition to task actions.
CHARGEABLE = "chargeable_operation"
ACCEPT_RESULT = "accept_result"        # final human sign-off on high-risk work
ESCALATION = "escalation_review"       # retries exhausted / fatal error


class ApprovalManager:
    def __init__(self, store: TaskQueue, cfg: dict):
        self.store = store
        self.required = set(cfg["approval_required_actions"])
        self.preauthorized = set(cfg["preauthorized_actions"])

    def requires_approval(self, action: str) -> bool:
        return action in self.required or action not in self.preauthorized

    def is_approved(self, c, task_id: str, action: str) -> bool:
        return c.execute("SELECT 1 FROM approvals WHERE task_id=? AND action=? AND status='approved'",
                         (task_id, action)).fetchone() is not None

    def request(self, c, task_id: str, action: str, reason: str, requested_by: str) -> str:
        r = c.execute("SELECT id FROM approvals WHERE task_id=? AND action=? AND status='pending'",
                      (task_id, action)).fetchone()
        if r:
            return r["id"]
        aid = "A-" + uuid.uuid4().hex[:8]
        c.execute("""INSERT INTO approvals (id, task_id, action, reason, status, requested_by, requested_at)
                     VALUES (?,?,?,?,?,?,?)""",
                  (aid, task_id, action, reason, "pending", requested_by, self.store.now()))
        self.store.audit(c, requested_by, "approval_requested", task_id=task_id,
                         approval_id=aid, action=action, reason=reason)
        return aid

    def decide(self, c, approval_id: str, approved: bool, decided_by: str, note: str = "") -> dict:
        a = _row(c.execute("SELECT * FROM approvals WHERE id=?", (approval_id,)).fetchone())
        if a is None:
            raise KeyError(f"no approval {approval_id}")
        if a["status"] != "pending":
            raise ValueError(f"approval {approval_id} already {a['status']}")
        if not decided_by or decided_by in ("orchestrator", "system") or decided_by.startswith("agent:"):
            raise PermissionError("approvals must be decided by a named human")
        status = "approved" if approved else "rejected"
        c.execute("UPDATE approvals SET status=?, decided_by=?, decided_at=?, note=? WHERE id=?",
                  (status, decided_by, self.store.now(), note, approval_id))
        self.store.audit(c, decided_by, f"approval_{status}", task_id=a["task_id"],
                         approval_id=approval_id, action=a["action"], note=note)
        a["status"] = status
        return a

    def pending(self) -> list[dict]:
        return [_row(r) for r in self.store.conn().execute(
            "SELECT * FROM approvals WHERE status='pending' ORDER BY requested_at")]

    def all(self, task_id: str | None = None) -> list[dict]:
        q, args = "SELECT * FROM approvals", ()
        if task_id:
            q, args = q + " WHERE task_id=?", (task_id,)
        return [_row(r) for r in self.store.conn().execute(q + " ORDER BY requested_at", args)]
