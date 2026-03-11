# Demo Integration Design — Sub-project 3

> Wires the temporal simulator into the demo agent so `--simulate` produces
> time-travel demos from ephemeral DATA_DIR instances.

## Scope

Demo integration only. Role matrix expansion (additional roles beyond EM)
deferred to a separate effort.

## Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| How does demo invoke simulator? | Inline — `run_simulation()` as library call | Single command, no handoff friction |
| Event validation? | Strict — reject unknown workflow types, skip them | Clean sim_dir for downstream agents |
| Simulation window? | Passthrough `--window` flag, default 30d | User composes; no baked-in audience assumptions |
| Post-simulation warm-up? | Always run final warm-up | Guarantees fresh briefings/snapshots regardless of end day |
| Scenario selection? | Optional passthrough `--scenario` | Audience and scenario are independent axes |

## Architecture

### Event Validation Module

**New file:** `agents/simulator_pipeline/validation.py`

Validates `SimulatedEvent` objects against `workflow-semantics.yaml` before
rendering. Rejects events with unknown `workflow_type`, mismatched
`subdirectory`, or empty `filename`.

Interface:
- `load_valid_workflows(path) -> dict[str, WorkflowSpec]` — loads
  workflow-semantics.yaml, returns workflow_type -> spec mapping
- `validate_events(events, valid_workflows) -> list[SimulatedEvent]` — filters
  invalid events, logs warnings, returns valid subset

Integration: `generate_tick_events()` in `event_gen.py` gains optional
`valid_workflows` parameter. The simulator passes its already-loaded workflow
semantics through. Tests and other callers can omit it.

### Final Warm-Up Function

**New file:** `agents/simulator_pipeline/warmup.py`

Runs the bootstrap Phase 4 agent pipeline against a sim_dir to guarantee warm
data for demo generation. Called after `run_simulation()` completes.

Interface:
- `async run_warmup(sim_dir: Path) -> None`

Agent sequence (matching bootstrap):
1. `management_activity` (deterministic)
2. `management_profiler` (LLM)
3. `management_briefing` (LLM)
4. `digest` (LLM)
5. `management_prep --team-snapshot` (LLM)

Sequential execution. Each agent called as library function with try/except —
failures logged but don't abort. Demo proceeds with partial data.

### Demo Agent Changes

**Modified file:** `agents/demo.py`

New CLI flags:
- `--simulate` — run temporal simulation before demo generation
- `--window 30d` — simulation window (default 30d)
- `--variant experienced-em` — role variant (default experienced-em)
- `--scenario` — optional scenario modifier

Orchestration when `--simulate` is set:
1. `run_simulation(role="engineering-manager", variant=..., window=..., seed="demo-data/", scenario=..., audience=...)`
2. `run_warmup(sim_dir)`
3. `config.set_data_dir(sim_dir)`
4. Existing demo generation (unchanged)
5. `config.reset_data_dir()` in finally block

Without `--simulate`: identical to current behavior.

Role hardcoded to `engineering-manager` (only role in matrix). `--role` flag
added when role scaling lands.

Cleanup: sim_dir preserved in `/tmp/` after completion. OS tmpdir expiry
handles cleanup. User can inspect or re-run against it.

### Simulator Validation Integration

**Modified files:** `agents/simulator.py`, `agents/simulator_pipeline/event_gen.py`

The simulator passes loaded workflow specs to `generate_tick_events()`. Events
are validated after LLM output and safety enforcement. Invalid events are
dropped with logged warnings.

## Testing

**New test files:**

`tests/test_simulator_validation.py`:
- Valid events pass through
- Unknown workflow_type rejected
- Wrong subdirectory rejected
- Empty filename rejected
- Warnings logged for rejections

`tests/test_simulator_warmup.py`:
- All 5 agents called in order (mocked)
- Individual agent failure doesn't abort
- config.data_dir set/reset correctly

`tests/test_demo_simulate.py`:
- `--simulate` triggers simulation -> warmup -> demo sequence (mocked)
- Without `--simulate`, no simulation runs
- config.data_dir reset on error

**Modified test:** `tests/test_simulator_event_gen.py`:
- Events validated when `valid_workflows` provided
- Events unvalidated when omitted

No end-to-end LLM tests — the validated 5-day run confirms the pipeline works.
All new tests mocked.

## File Summary

| Action | File |
|--------|------|
| Create | `agents/simulator_pipeline/validation.py` |
| Create | `agents/simulator_pipeline/warmup.py` |
| Create | `tests/test_simulator_validation.py` |
| Create | `tests/test_simulator_warmup.py` |
| Create | `tests/test_demo_simulate.py` |
| Modify | `agents/simulator_pipeline/event_gen.py` |
| Modify | `agents/simulator.py` |
| Modify | `agents/demo.py` |
| Modify | `tests/test_simulator_event_gen.py` |
