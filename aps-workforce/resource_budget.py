"""Cost guard and usage ledger.

The $5/day and $1/task numbers are planning ceilings, never permission to
spend. A chargeable call runs only if ALL of these hold:
  1. the estimate is within the per-task ceiling,
  2. today's recorded spend plus the estimate is within the daily ceiling,
  3. the provider is pre-authorized in config, or a human approved a
     `chargeable_operation` for this specific task.
Non-chargeable providers (the mock adapters) always pass.
"""
from __future__ import annotations

import datetime as dt
from dataclasses import dataclass

from approval_manager import CHARGEABLE, ApprovalManager
from task_queue import TaskQueue


@dataclass
class BudgetDecision:
    allowed: bool
    reason: str
    needs_approval: bool = False   # True -> ask a human; False + not allowed -> hard block


class ResourceBudget:
    def __init__(self, store: TaskQueue, approvals: ApprovalManager, cfg: dict):
        self.store = store
        self.approvals = approvals
        self.daily = float(cfg["daily_usd"])
        self.per_task = float(cfg["per_task_usd"])
        self.authorized = set(cfg.get("authorized_chargeable_providers") or [])

    def _day_start(self) -> float:
        d = dt.datetime.fromtimestamp(self.store.now(), dt.timezone.utc).date()
        return dt.datetime(d.year, d.month, d.day, tzinfo=dt.timezone.utc).timestamp()

    def spent_today(self, c=None) -> float:
        c = c or self.store.conn()
        r = c.execute("""SELECT COALESCE(SUM(COALESCE(actual_cost, est_cost)), 0) FROM usage
                         WHERE chargeable=1 AND ts >= ?""", (self._day_start(),)).fetchone()
        return float(r[0])

    def check(self, c, task_id: str, provider: str, chargeable: bool, est_cost: float) -> BudgetDecision:
        if not chargeable:
            return BudgetDecision(True, "non-chargeable provider")
        if est_cost > self.per_task:
            return BudgetDecision(False, f"estimate ${est_cost:.2f} exceeds per-task ceiling ${self.per_task:.2f}")
        spent = self.spent_today(c)
        if spent + est_cost > self.daily:
            return BudgetDecision(False, f"daily ceiling ${self.daily:.2f} would be exceeded "
                                         f"(spent ${spent:.2f} + est ${est_cost:.2f})")
        if provider in self.authorized:
            return BudgetDecision(True, f"provider {provider} pre-authorized")
        if self.approvals.is_approved(c, task_id, CHARGEABLE):
            return BudgetDecision(True, "chargeable operation approved by human for this task")
        return BudgetDecision(False, f"chargeable call to {provider} (est ${est_cost:.2f}) "
                                     "is not authorized", needs_approval=True)

    def record(self, c, task_id, agent_id, provider, model, chargeable, est_cost, actual_cost=None):
        c.execute("""INSERT INTO usage (task_id, agent_id, provider, model, chargeable, est_cost,
                     actual_cost, ts) VALUES (?,?,?,?,?,?,?,?)""",
                  (task_id, agent_id, provider, model, int(chargeable), est_cost, actual_cost,
                   self.store.now()))

    def summary(self) -> dict:
        c = self.store.conn()
        rows = c.execute("""SELECT provider, COUNT(*) n, SUM(est_cost) est, SUM(actual_cost) actual
                            FROM usage WHERE ts >= ? GROUP BY provider""", (self._day_start(),)).fetchall()
        return {"daily_ceiling": self.daily, "per_task_ceiling": self.per_task,
                "spent_today": round(self.spent_today(), 4),
                "by_provider": [dict(r) for r in rows]}
