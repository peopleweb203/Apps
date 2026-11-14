# APS AI Workforce (prototype v1.0)

A local, Python 3 + SQLite orchestrator for a 25-role AI workforce at AI Powered Systems LLC:
**5 teams × (1 leader + 4 specialists)**, a hard limit of **5 concurrent execution slots**,
human approval gates, a cost guard, and durable, crash-recoverable task state.

It runs **separately from Tina**. `../aps-tina` is a protected path that no agent can write to,
and the test suite checks that its contents are byte-identical before and after.

> **Status:** working prototype in **simulation mode** (mock agents). 36 tests: 31 acceptance
> tests plus 5 that run the Claude adapter through the real `anthropic` SDK against a local
> stand-in API (no network, no cost). Mock agents make no model calls, so every output they
> produce is labeled `SIMULATED`. The Claude adapter has **not yet made a real API call**:
> run `smoke_test.py` on your machine to verify it (see *Going live*).

## Quick start

```bash
cd aps-workforce
python3 -m pip install pyyaml          # only dependency (already present here)
python3 orchestrator.py init           # 25 roles, 5 slots -> state/workforce.db
python3 orchestrator.py seed           # first-day task per team (idempotent)
python3 orchestrator.py run            # process ready work, max 5 agents at once
python3 orchestrator.py status         # slots, agent states, queues, budget
python3 orchestrator.py approvals      # what is waiting on a human
python3 orchestrator.py approve A-xxxx --by "Your Name" --note "ok"
python3 orchestrator.py run            # resumes; approved work continues
python3 orchestrator.py report         # reports/daily_YYYY-MM-DD.md
python3 orchestrator.py show T-xxxx    # one task + artifacts + approvals + audit trail
python3 -m unittest discover -s tests -v
```

Submit ad-hoc work:

```bash
python3 orchestrator.py submit --team software_factory --capability frontend \
  --title "Fix LocalVerse checkout button" --risk medium --instructions "..."
```

`run` exits when no claimable work remains, so schedule it (cron, a systemd timer, or Windows
Task Scheduler) to run every few minutes. State is in SQLite, so each run resumes where the last
one stopped.

## Files

| File | Purpose |
|---|---|
| `workforce_config.yaml` | Mode, slots, leases, retries, budget ceilings, risk policy, approval lists, paths, providers, teams |
| `agents.yaml` | The 25 role definitions: team, kind, capabilities (routing keys), model tier, purpose, escalation triggers |
| `orchestrator.py` | Registry validation, intake, claim → execute → validate → review → complete, approvals, run loop, reports, CLI |
| `task_queue.py` | SQLite schema, atomic claiming, slots, leases + recovery, agent lifecycle state machine, artifacts, audit |
| `approval_manager.py` | Human approval queue bound to (task, action); default-deny for unknown actions |
| `resource_budget.py` | Cost guard ($1/task, $5/day ceilings; chargeable calls need pre-authorization or per-task approval) + usage ledger |
| `agent_runner.py` | Provider adapters (Mock, Anthropic), workspace isolation guard, output validation, artifact rendering |
| `seed_tasks.yaml` | First-day tasks per team |
| `tests/test_acceptance.py` | 31 acceptance tests |
| `tests/test_anthropic_adapter.py` | 5 offline tests of the Claude adapter via the real SDK and a local stand-in API |
| `smoke_test.py` | Supervised live test: one approved, low-cost real Claude call |
| `docs/ARCHITECTURE.md` | Architecture, dashboard spec, resource requirements, integration gaps, deployment plan |

## Rules that the code enforces (not just documents)

- **At most 5 agents execute at once.** The `slots` table has exactly `max_slots` rows, and a
  slot can only be taken by an atomic `UPDATE ... WHERE holder_agent IS NULL`.
- **One slot per team by default.** A specialist takes its team's slot only while the leader
  is not using it (the leader yields). Using another team's free slot requires the task to
  be submitted with `allow_borrow` (explicit authorization).
- **Approval gates.** Tasks whose action is `purchase`, `production_deploy`,
  `external_communication`, `contract_commitment`, `delete_original_data`, `credential_change`,
  `publish_content` or `irreversible`, or any unknown action, stop in `WAITING_APPROVAL`
  *before* any agent runs. Each approval covers one task only, and it must be decided by a
  named human; `orchestrator` and `agent:*` are refused.
- **Cost guard.** A chargeable call runs only if it fits within the per-task and daily
  ceilings **and** its provider is pre-authorized or a human approved that specific task.
  `authorized_chargeable_providers` is empty by default.
- **Never claims access it doesn't have.** A provider must report `available()` (verified flag,
  live mode, SDK installed, credentials present), or the task is `BLOCKED` with the reason.
- **Risk-based checking.** Low risk: automated validation. Medium: validation plus an
  independent reviewer (never the agent that did the work). High: both of those plus human sign-off.
- **Generated is not done.** Output that fails validation (empty, software claims without
  test evidence in live mode, lead rows without url/date/confidence/qualification) is retried,
  never marked complete.
- **Traceability.** Every artifact lives in `workspaces/<team>/tasks/<task_id>/attempt-<n>/`.
  Each file opens with a header holding its task ID, and is recorded with its SHA-256 and a
  read-back check. Every usage row and audit event carries a task ID.

## Going live (supervised smoke test)

On your own machine:

```bash
pip install anthropic pyyaml
cp .env.example .env            # set ANTHROPIC_API_KEY=... (never commit .env)
python3 smoke_test.py
```

The script uses a separate database (`state/smoke.db`) and switches on live mode for its own
run only. It submits one low-risk task (Resource Researcher → `claude-haiku-5-5`, estimated
$0.01) and stops at the cost guard until you type your name to approve the charge. Then it
prints the model that served the call, the measured cost and the output. If the output looks
right, set `providers.anthropic.verified: true` and `workforce.mode: live` in
`workforce_config.yaml`.

The Tina-isolation test is skipped inside this repo because `../aps-tina` is not next to
`aps-workforce/` here. On your machine, set `paths.protected_paths` to Tina's real location.
