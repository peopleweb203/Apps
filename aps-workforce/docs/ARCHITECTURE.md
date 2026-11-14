# APS AI Workforce: architecture and operations

## 1. Architecture

```
            human (CLI today, dashboard later)
              │ submit / approve / reject / report
              ▼
┌──────────────────────── orchestrator.py ────────────────────────┐
│ registry validation · intake · claim loop (≤5 threads)          │
│ gates: approval → provider availability → cost guard            │
│ execute → validate → artifact (hash + read-back) → risk routing │
│ review phase (independent agent) → complete / rework / sign-off │
└───────┬───────────────┬────────────────┬───────────────┬────────┘
        ▼               ▼                ▼               ▼
  task_queue.py   approval_manager   resource_budget   agent_runner.py
  (SQLite, WAL)   (task+action       ($1/task,         adapters: Mock | Anthropic
  tasks, agents,   bound, human-     $5/day, usage     WorkspaceGuard (per-team dir,
  slots, audit,    only decisions)   ledger)           protected paths, read-only
  artifacts)                                           shared_reference)
```

**One central queue, five team queues.** All tasks are in one `tasks` table, partitioned by
`team`, so every team has its own queue view while dependencies can cross teams. A claim
selects the highest-priority ready task whose team has (a) an at-rest agent with the required
capability and (b) a free slot.

**Roles are not processes.** The 25 rows in `agents` are definitions with lifecycle state.
Only a claim (slot + lease) makes a role "execute", and the worker thread that holds the
claim does the work.

### Agent lifecycle (enforced state machine)
```
STANDBY → ACTIVATED → ASSIGNED → EXECUTING → REVIEW → COMPLETED → STANDBY
                       │            │          │
                       └────────────┴──────────┴→ BLOCKED | FAILED | WAITING_APPROVAL | RETRYING → rest
```
A leader rests in `ACTIVATED` and a specialist rests in `STANDBY`. Any illegal transition raises
`StateError`. Lease recovery is the only forced transition, and it is audited.

### Task lifecycle
`QUEUED → ASSIGNED → EXECUTING → (REVIEW) → COMPLETED`, with the side states `RETRYING`,
`WAITING_APPROVAL`, `BLOCKED` and `FAILED`. The review is a separate claim with its own
slot and agent, and it resumes from the `checkpoint` (artifact path + hash). If the
artifact changed after execution, the review fails the task back to execution.

### Persistence and recovery
| Requirement | Implementation |
|---|---|
| Durable state | SQLite WAL file `state/workforce.db` |
| Atomic claiming | `BEGIN IMMEDIATE` plus conditional `UPDATE ... WHERE holder_agent IS NULL` |
| Lease expiry and recovery | `lease_expires` on tasks and slots; `recover_expired()` runs before every claim |
| Stale-worker protection | Every write checks `lease_owner == worker`; a recovered worker gets `lease_lost` |
| Idempotency | `idempotency_key` UNIQUE on submit; artifacts saved only on success, versioned per attempt |
| Retry limits | `max_attempts` (3), then `FAILED` plus an `escalation_review` approval |
| Resume from checkpoint | The review phase resumes from the stored artifact and hash |
| Versioned artifacts | `tasks/<id>/attempt-<n>/output.md` plus an `artifacts.version` row |
| Read-back verification | SHA-256 recomputed from disk after an atomic `os.replace` |

## 2. Task-routing configuration

A task names a `team`, a `capability`, an `action` and a `risk`. Routing:
1. The team's leader is chosen first if it has the capability (planning, triage and
   strategy work).
2. Otherwise the at-rest specialist with that capability is chosen. That **activates** the
   specialist (audited as `specialist_activated`).
3. Review goes to the team's configured reviewer (`qa_engineer`, `compliance_reviewer`,
   `contract_reviewer`, `continuity_reviewer`, `security_reviewer`). If the reviewer is
   busy or did the work, another at-rest agent with the `review` capability or the leader
   takes it.

| Team | Leader capabilities | Specialist capabilities |
|---|---|---|
| software_factory | triage, planning, code_audit, release_readiness | frontend · backend, database · testing, review · integration |
| customer_acquisition | triage, planning, icp_strategy | lead_discovery · prospect_research · outreach_drafting · compliance_review, review |
| business_partnerships | triage, planning, partner_strategy | supplier_research · commercial_analysis · integration_planning · contract_review, review |
| media_production | triage, planning, canon_management | scriptwriting · visual_design, character_sheets · video_pipeline · continuity_review, review |
| infrastructure_intelligence | triage, planning, ops_reporting | resource_research · automation · security_review, review · documentation_audit, source_recovery |

The Customer Acquisition flow (Strategist → Scout → Researcher → Writer → Reviewer) is a
chain of `depends_on` tasks: `icp_strategy` → `lead_discovery` → `prospect_research` →
`outreach_drafting` (risk medium, so it is reviewed by `compliance_reviewer`) →
`external_communication` (always needs human approval).

## 3. Operational dashboard specification (v2; the CLI covers it today)

Data source: `orchestrator.status()` and the SQLite tables; read-only except the approval buttons.

| Panel | Content | Source |
|---|---|---|
| Slots | 5 tiles: home team, holder agent, task, lease countdown; red if expired | `slots` |
| Roster | 25 roles grouped by team; state chip (ACTIVATED/STANDBY/EXECUTING/…) | `agents` |
| Queues | Per-team counts by status; oldest waiting task age | `tasks` |
| **Waiting on you** | Pending approvals with task title, action, reason, Approve/Reject (requires name) | `approvals` |
| Failures | FAILED/BLOCKED tasks with last error and escalation link | `tasks`, `approvals` |
| Spend | Today vs $5 ceiling, per provider, per task; chargeable calls list | `usage` |
| Outputs | Latest artifacts with task link, SIMULATED badge, verified hash ✓ | `artifacts` |
| Task detail | Payload, attempts, review notes, full audit timeline | `audit` |
| Daily report | The rendered `reports/daily_*.md` | file |

Cheapest build: a single static page reading a JSON export (`orchestrator.py status`) or a
tiny Flask/FastAPI read-only server bound to localhost. Approve/Reject should call the same
`Orchestrator.approve()` and record the human's name.

## 4. Resource requirements

| Item | Requirement | Cost |
|---|---|---|
| Runtime | Any machine with Python 3.10+ and PyYAML (laptop, a $0 always-free VM, or a Codespace) | $0 |
| Storage | SQLite + artifacts; MBs per week in simulation | $0 |
| Scheduling | cron/systemd timer/Task Scheduler running `orchestrator.py run` every 5 min | $0 |
| Model calls (live) | Routine tier → `claude-haiku-5-5` (~$0.01/call est.), standard → `claude-opus-5-5` (~$0.20/call est.) | Bounded by $1/task, $5/day ceilings and per-task approval |
| Backups | Copy `state/` + `workspaces/` nightly to Drive/GitHub with hash check | $0 |

The least expensive viable persistent runtime is the **local machine plus a cron/Task
Scheduler entry**. Claude Projects alone cannot schedule work, and this session's container
is temporary.

## 5. Integration gaps (status as of 2026-11-14; nothing below is claimed working until tested)

| Integration | Status | What's needed |
|---|---|---|
| Mock providers | **Tested** (31 tests) | - |
| Anthropic Claude API | Adapter checked against `anthropic` SDK 2.8.0 and **tested offline** against a local stand-in API (request shape, haiku/opus routing, server-side fallback, refusal → fatal, 429 → bounded retry, measured cost). **No real API call yet**: Claude Code cloud sessions can't hold a user key for api.anthropic.com | Run `smoke_test.py` on your machine, then set `verified: true`, `mode: live` |
| GitHub | This Claude Code session has GitHub access scoped to 6 peopleweb203 repos; **not wired into the workforce** | Fine-grained token (read-only first) + a `github` adapter for Team 1 |
| Google Drive | Not connected in this session; **untested** | Service account or OAuth; adapter for shared archive/backups |
| Gemini / Google AI Studio | No adapter; **untested** | `GEMINI_API_KEY` + adapter implementing `available/estimate/run/review` |
| Lovable, Hercules | No API access confirmed; **untested** | Confirm whether they have APIs/exports; otherwise manual export into `shared_reference/` |
| LocalVerse, APS Marketplace, Community One, Kingdom of Shadows source | **Not present** in this workspace (found: Apps/CineForge, aps-bitrix24-integration, aps-tina, citizens-wealth-platform{,2}, paranormal-spooky-graveyard) | Point Team 1 at the repos/exports (seed task `seed-sw-001`) |
| External sending (email/LinkedIn) | Deliberately **none**; approved sends are manual | Add only after compliance review, with per-message approval |

## 6. Safe deployment plan

1. **Day 1 (done here):** simulation mode, mock agents, 31/31 acceptance tests, isolated directory, Tina untouched.
2. **Move to a durable home:** commit `aps-workforce/` to its own repo or branch (not Tina's),
   run it on your machine, and schedule `run` every 5 minutes. This cloud session's
   container is temporary.
3. **Load real context:** put the LocalVerse offer, ICP and canon materials in
   `shared_reference/`, then re-seed.
4. **Supervised live smoke test:** on your machine, run `python3 smoke_test.py`. It makes one
   approved, low-cost call and prints the model, the measured cost and the output. Then set
   `mode: live` and `providers.anthropic.verified: true`.
5. **Go live per team, one at a time:** start with Customer Acquisition drafts (all sends stay
   manual), then Infrastructure. Keep `authorized_chargeable_providers` empty until a week of
   spend data shows stable costs.
6. **Add adapters only after testing each one** (GitHub read-only → Drive backup → Gemini),
   each with its own test and a `verified` flag.
7. **Never:** grant production deploy, purchase, publish or send permissions to automation;
   give the workforce write access to Tina; store keys anywhere except `.env` or a secrets manager.
