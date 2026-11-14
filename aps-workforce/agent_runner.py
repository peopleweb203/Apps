"""Agent execution: provider adapters, workspace isolation, and output validation.

Adapters
  MockAdapter       - deterministic, offline, free. Used in simulation mode and tests.
  AnthropicAdapter  - Claude Messages API through the official `anthropic` SDK.
                      Disabled until `verified: true` in config, mode == live,
                      the SDK is installed, and credentials are present. It has
                      NOT been exercised against the live API in this prototype.
"""
from __future__ import annotations

import hashlib
import json
import os
import time
from dataclasses import dataclass, field
from pathlib import Path


class RecoverableError(Exception):
    """Transient failure (timeout, rate limit, flaky tool). Safe to retry."""


class FatalError(Exception):
    """Non-retryable failure (bad input, refusal, policy). Escalate to a human."""


class WorkspaceViolation(PermissionError):
    """An agent tried to write outside its team workspace or into a protected path."""


# ---------------------------------------------------------------- workspace isolation
class WorkspaceGuard:
    def __init__(self, workspaces_root: Path, team: str, shared_reference: Path,
                 protected: list[Path]):
        self.root = (workspaces_root / team).resolve()
        self.root.mkdir(parents=True, exist_ok=True)
        self.shared = shared_reference.resolve()
        self.protected = [p.resolve() for p in protected]

    def _resolve_write(self, rel: str) -> Path:
        p = (self.root / rel).resolve()
        for prot in self.protected:
            if p == prot or prot in p.parents:
                raise WorkspaceViolation(f"write to protected path refused: {p}")
        if self.root not in p.parents:
            raise WorkspaceViolation(f"write outside team workspace refused: {p}")
        return p

    def write(self, rel: str, content: str) -> tuple[str, str, bool]:
        """Write atomically, then read back and verify the hash."""
        p = self._resolve_write(rel)
        p.parent.mkdir(parents=True, exist_ok=True)
        data = content.encode()
        sha = hashlib.sha256(data).hexdigest()
        tmp = p.with_suffix(p.suffix + ".tmp")
        tmp.write_bytes(data)
        os.replace(tmp, p)
        verified = hashlib.sha256(p.read_bytes()).hexdigest() == sha
        return str(p), sha, verified

    def read_reference(self, rel: str) -> str:
        p = (self.shared / rel).resolve()
        if self.shared not in p.parents:
            raise WorkspaceViolation("reference reads are limited to shared_reference/")
        return p.read_text()


# ---------------------------------------------------------------- adapters
@dataclass
class AdapterResult:
    text: str
    model: str
    actual_cost: float | None = None
    evidence: dict | None = None
    sources: list[dict] = field(default_factory=list)
    simulated: bool = False


class MockAdapter:
    """Offline adapter. Behaviour can be steered through task payload keys:
    mock_fail_times (int)      - raise RecoverableError on the first N attempts
    mock_fatal (bool)          - raise FatalError
    mock_review_reject_times   - reviewer rejects the first N attempts
    mock_empty (bool)          - return empty output (fails validation)
    mock_sleep (float)         - seconds to sleep (concurrency tests)
    """
    kind = "mock"

    def __init__(self, name: str, cfg: dict):
        self.name = name
        self.chargeable = bool(cfg.get("chargeable", False))
        self.verified = bool(cfg.get("verified", True))
        self.cost = float(cfg.get("est_cost_usd", 0.0))
        self.calls = 0

    def available(self, mode: str) -> tuple[bool, str]:
        return True, "mock adapter is always available"

    def estimate(self, task: dict, agent: dict) -> tuple[str, float]:
        return f"mock-{agent['model_tier']}", self.cost

    def run(self, task: dict, agent: dict, prompt: str) -> AdapterResult:
        self.calls += 1
        p = task["payload"]
        if p.get("mock_sleep"):
            time.sleep(float(p["mock_sleep"]))
        if p.get("mock_fatal"):
            raise FatalError("mock fatal error requested by payload")
        if task["attempts"] <= int(p.get("mock_fail_times", 0)):
            raise RecoverableError(f"mock transient failure on attempt {task['attempts']}")
        if p.get("mock_empty"):
            return AdapterResult("", f"mock-{agent['model_tier']}", 0.0, simulated=True)
        text = (f"# {task['title']}\n\n_SIMULATED OUTPUT - produced by MockAdapter, not by a model. "
                f"Not evidence of real work._\n\nRole: {agent['title']}\nCapability: {task['capability']}\n"
                f"Instructions received:\n\n{p.get('instructions', '(none)')}\n")
        if p.get("feedback"):
            text += f"\nAddressed reviewer feedback: {p['feedback']}\n"
        evidence = ({"type": "simulated", "note": "no tests were executed"}
                    if p.get("requires_test_evidence") else None)
        sources = ([{"url": "simulation://no-real-source", "date": "n/a", "confidence": "none",
                     "qualification_reason": "SIMULATED - replace with verified public source"}]
                   if p.get("requires_sources") else [])
        return AdapterResult(text, f"mock-{agent['model_tier']}", self.cost if self.chargeable else 0.0,
                             evidence, sources, simulated=True)

    def review(self, task: dict, output: str, reviewer: dict) -> tuple[bool, str]:
        self.calls += 1
        if task["attempts"] <= int(task["payload"].get("mock_review_reject_times", 0)):
            return False, f"{reviewer['title']}: FIX - mock rejection on attempt {task['attempts']}"
        return True, f"{reviewer['title']}: PASS (simulated review)"


class AnthropicAdapter:
    """Claude via the official Python SDK. UNVERIFIED in this prototype."""
    kind = "anthropic"
    PRICES = {  # USD per 1M tokens (input, output)
        "claude-opus-5-5": (4.00, 20.00),
        "claude-haiku-5-5": (0.10, 0.50),
    }

    def __init__(self, name: str, cfg: dict):
        self.name = name
        self.cfg = cfg
        self.chargeable = True
        self.verified = bool(cfg.get("verified", False))
        self.calls = 0

    def available(self, mode: str) -> tuple[bool, str]:
        if mode != "live":
            return False, "workforce is in simulation mode"
        if not self.verified:
            return False, "anthropic adapter not verified (set verified: true after a supervised smoke test)"
        try:
            import anthropic  # noqa: F401
        except ImportError:
            return False, "anthropic SDK not installed (pip install anthropic)"
        if not (os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")):
            return False, "no Anthropic credentials in environment"
        return True, "ok"

    def estimate(self, task: dict, agent: dict) -> tuple[str, float]:
        tier = agent["model_tier"]
        return self.cfg["models"][tier], float(self.cfg["est_cost_usd"][tier])

    def _call(self, model: str, system: str, user: str, effort: str):
        import anthropic
        client = anthropic.Anthropic()
        kwargs = dict(model=model, max_tokens=16000, system=system,
                      messages=[{"role": "user", "content": user}],
                      output_config={"effort": effort})
        if model == "claude-opus-5-5":
            # Server-side refusal fallback (routes by refusal category).
            resp = client.beta.messages.create(betas=["server-side-fallback-2026-07-01"],
                                               fallbacks="default", **kwargs)
        else:
            resp = client.messages.create(**kwargs)
        if resp.stop_reason == "refusal":
            raise FatalError("model declined the request")
        text = "".join(b.text for b in resp.content if b.type == "text")
        pin, pout = self.PRICES.get(resp.model, self.PRICES.get(model, (0, 0)))
        cost = (resp.usage.input_tokens * pin + resp.usage.output_tokens * pout) / 1_000_000
        return text, resp.model, cost

    def run(self, task: dict, agent: dict, prompt: str) -> AdapterResult:
        import anthropic
        self.calls += 1
        model, _ = self.estimate(task, agent)
        effort = "low" if agent["model_tier"] == "routine" else "medium"
        try:
            text, served, cost = self._call(model, prompt, json.dumps(task["payload"]), effort)
        except (anthropic.RateLimitError, anthropic.APIConnectionError, anthropic.InternalServerError) as e:
            raise RecoverableError(str(e)) from e
        except anthropic.APIStatusError as e:
            raise FatalError(str(e)) from e
        return AdapterResult(text, served, cost)

    def review(self, task: dict, output: str, reviewer: dict) -> tuple[bool, str]:
        model, _ = self.estimate(task, reviewer)
        text, _, _ = self._call(model, "You are a strict reviewer. Reply 'PASS' or 'FIX: <reasons>'.",
                                f"Task: {task['title']}\n\nOutput:\n{output}", "low")
        return text.strip().upper().startswith("PASS"), text.strip()[:2000]


ADAPTERS = {"mock": MockAdapter, "anthropic": AnthropicAdapter}


def build_adapters(providers_cfg: dict) -> dict:
    out = {}
    for name, cfg in providers_cfg.items():
        if name == "default":
            continue
        out[name] = ADAPTERS[cfg["kind"]](name, cfg)
    return out


# ---------------------------------------------------------------- runner
def build_prompt(task: dict, agent: dict, role_def: dict) -> str:
    return (f"You are the {agent['title']} on the APS {task['team']} team.\n"
            f"Purpose: {role_def.get('purpose', '')}\n"
            f"Task {task['id']}: {task['title']}\n"
            "Rules: produce drafts and analysis only; never send, publish, purchase, deploy, delete, "
            "or change credentials. Cite a source URL and date for every external fact; label "
            "unverified claims UNCONFIRMED. Escalate when: "
            + ", ".join(role_def.get("escalate_when", [])))


def validate(task: dict, res: AdapterResult, mode: str) -> list[str]:
    """Return a list of problems; empty means the output passed validation."""
    problems = []
    if not res.text.strip():
        problems.append("empty output")
    p = task["payload"]
    if p.get("requires_test_evidence"):
        ev = res.evidence or {}
        if mode == "live" and not (ev.get("type") == "test_run" and ev.get("exit_code") == 0):
            problems.append("software claim without passing test-run evidence")
        if mode != "live" and not ev:
            problems.append("missing test evidence")
    if p.get("requires_sources"):
        if not res.sources:
            problems.append("lead/research output without sources")
        for s in res.sources:
            missing = [k for k in ("url", "date", "confidence", "qualification_reason") if k not in s]
            if missing:
                problems.append(f"source missing {missing}")
    return problems


def render_artifact(task: dict, agent: dict, res: AdapterResult) -> str:
    header = {"task_id": task["id"], "team": task["team"], "agent": agent["id"],
              "attempt": task["attempts"], "model": res.model, "simulated": res.simulated,
              "evidence": res.evidence, "sources": res.sources}
    return f"<!-- aps-workforce {json.dumps(header)} -->\n{res.text}"
