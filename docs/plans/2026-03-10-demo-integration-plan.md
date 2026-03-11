# Demo Integration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the temporal simulator into the demo agent so `--simulate` produces time-travel demos from ephemeral DATA_DIR instances.

**Architecture:** Demo agent gains `--simulate` flag. When set, it calls `run_simulation()` as a library function, runs a final warm-up to guarantee fresh data, then generates the demo against the ephemeral sim_dir. A new validation module filters LLM-generated events against workflow-semantics.yaml before rendering.

**Tech Stack:** Python 3.12, pydantic-ai, pydantic, PyYAML, unittest.mock, pytest (asyncio_mode=auto)

**Spec:** `docs/plans/2026-03-10-demo-integration-design.md`

---

## Chunk 1: Event Validation & Simulator Integration

### Task 1: Event Validation Module

**Files:**
- Create: `agents/simulator_pipeline/validation.py`
- Create: `tests/test_simulator_validation.py`

Validates SimulatedEvent objects against workflow-semantics.yaml. Rejects events with unknown workflow_type, wrong subdirectory, or empty filename.

- [ ] **Step 1: Write the failing tests**

```python
# tests/test_simulator_validation.py
"""Tests for event validation against workflow-semantics.yaml."""
from __future__ import annotations

from agents.simulator_pipeline.models import SimulatedEvent
from agents.simulator_pipeline.validation import validate_events


# Minimal valid workflows dict matching workflow-semantics.yaml structure
_VALID_WORKFLOWS = {
    "one_on_one": {"subdirectory": "meetings/"},
    "coaching_note": {"subdirectory": "coaching/"},
    "feedback": {"subdirectory": "feedback/"},
    "decision": {"subdirectory": "decisions/"},
    "status_report": {"subdirectory": "status-reports/"},
    "incident": {"subdirectory": "incidents/"},
}


def _event(
    workflow_type: str = "one_on_one",
    subdirectory: str = "meetings",
    filename: str = "2026-03-05-alice.md",
    **kwargs,
) -> SimulatedEvent:
    return SimulatedEvent(
        date="2026-03-05",
        workflow_type=workflow_type,
        subdirectory=subdirectory,
        filename=filename,
        metadata={"type": "meeting"},
        **kwargs,
    )


class TestValidateEvents:
    def test_valid_event_passes(self):
        """Events with known workflow_type and matching subdirectory pass."""
        events = [_event()]
        result = validate_events(events, _VALID_WORKFLOWS)
        assert len(result) == 1

    def test_unknown_workflow_type_rejected(self):
        """Events with unknown workflow_type are filtered out."""
        events = [_event(workflow_type="unknown_type", subdirectory="unknown")]
        result = validate_events(events, _VALID_WORKFLOWS)
        assert len(result) == 0

    def test_wrong_subdirectory_rejected(self):
        """Events with wrong subdirectory for their workflow_type are rejected."""
        events = [_event(workflow_type="one_on_one", subdirectory="wrong-dir")]
        result = validate_events(events, _VALID_WORKFLOWS)
        assert len(result) == 0

    def test_empty_filename_rejected(self):
        """Events with empty filename are rejected."""
        events = [_event(filename="")]
        result = validate_events(events, _VALID_WORKFLOWS)
        assert len(result) == 0

    def test_mixed_valid_and_invalid(self):
        """Only valid events survive filtering."""
        events = [
            _event(),  # valid
            _event(workflow_type="bogus", subdirectory="nope"),  # invalid
            _event(workflow_type="decision", subdirectory="decisions",
                   filename="2026-03-05-ci.md"),  # valid
        ]
        result = validate_events(events, _VALID_WORKFLOWS)
        assert len(result) == 2
        assert result[0].workflow_type == "one_on_one"
        assert result[1].workflow_type == "decision"

    def test_subdirectory_trailing_slash_normalized(self):
        """Subdirectory matching handles trailing slash in workflow spec."""
        # workflow-semantics.yaml has "meetings/" with trailing slash
        events = [_event(subdirectory="meetings")]
        result = validate_events(events, _VALID_WORKFLOWS)
        assert len(result) == 1
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ai-agents && uv run pytest tests/test_simulator_validation.py -v`
Expected: FAIL (cannot import validate_events)

- [ ] **Step 3: Implement validation module**

```python
# agents/simulator_pipeline/validation.py
"""Validate SimulatedEvent objects against workflow-semantics.yaml.

Rejects events with unknown workflow types, mismatched subdirectories,
or empty filenames. Logs warnings for each rejected event.
"""
from __future__ import annotations

import logging
from typing import Any

from agents.simulator_pipeline.models import SimulatedEvent

_log = logging.getLogger(__name__)


def validate_events(
    events: list[SimulatedEvent],
    valid_workflows: dict[str, Any],
) -> list[SimulatedEvent]:
    """Filter events, keeping only those matching workflow-semantics.yaml.

    Returns a new list containing only valid events. Logs warnings for
    each rejected event.
    """
    validated = []
    for event in events:
        if not event.filename:
            _log.warning("Rejected event: empty filename (type=%s)", event.workflow_type)
            continue

        if event.workflow_type not in valid_workflows:
            _log.warning("Rejected event: unknown workflow_type=%s", event.workflow_type)
            continue

        spec = valid_workflows[event.workflow_type]
        expected_subdir = spec.get("subdirectory", "").rstrip("/")
        actual_subdir = event.subdirectory.rstrip("/")

        if actual_subdir != expected_subdir:
            _log.warning(
                "Rejected event: subdirectory mismatch for %s (got=%s, expected=%s)",
                event.workflow_type, event.subdirectory, expected_subdir,
            )
            continue

        validated.append(event)

    if len(validated) < len(events):
        _log.info("Validation: %d/%d events passed", len(validated), len(events))

    return validated
```

- [ ] **Step 4: Run tests**

Run: `cd ai-agents && uv run pytest tests/test_simulator_validation.py -v`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add agents/simulator_pipeline/validation.py tests/test_simulator_validation.py
git commit -m "feat: add event validation against workflow-semantics.yaml"
```

---

### Task 2: Integrate Validation into Event Generation

**Files:**
- Modify: `agents/simulator_pipeline/event_gen.py`
- Modify: `tests/test_simulator_event_gen.py`
- Modify: `agents/simulator.py`

Wire validation into `generate_tick_events()` and pass workflow specs from the simulator.

- [ ] **Step 1: Add validation test to existing test file**

Append to `tests/test_simulator_event_gen.py`:

```python
    async def test_validates_events_when_workflows_provided(self):
        """Events are validated against valid_workflows when provided."""
        mock_events = [
            SimulatedEvent(
                date="2026-03-05",
                workflow_type="one_on_one",
                subdirectory="meetings",
                filename="2026-03-05-alice-1on1.md",
                participant="Alice",
                topics=["project status"],
                metadata={"type": "meeting", "meeting-type": "one-on-one"},
            ),
            SimulatedEvent(
                date="2026-03-05",
                workflow_type="bogus_type",
                subdirectory="bogus",
                filename="2026-03-05-bogus.md",
                topics=["nothing"],
                metadata={"type": "bogus"},
            ),
        ]

        mock_result = MagicMock()
        mock_result.output = mock_events

        valid_workflows = {
            "one_on_one": {"subdirectory": "meetings/"},
        }

        with patch("agents.simulator_pipeline.event_gen._event_agent") as mock_agent:
            mock_agent.run = AsyncMock(return_value=mock_result)
            events = await generate_tick_events(
                prompt="Simulate...",
                valid_workflows=valid_workflows,
            )

        assert len(events) == 1
        assert events[0].workflow_type == "one_on_one"

    async def test_skips_validation_when_no_workflows(self):
        """Events are not validated when valid_workflows is None."""
        mock_events = [
            SimulatedEvent(
                date="2026-03-05",
                workflow_type="totally_unknown",
                subdirectory="whatever",
                filename="2026-03-05-thing.md",
                topics=["stuff"],
                metadata={"type": "thing"},
            ),
        ]

        mock_result = MagicMock()
        mock_result.output = mock_events

        with patch("agents.simulator_pipeline.event_gen._event_agent") as mock_agent:
            mock_agent.run = AsyncMock(return_value=mock_result)
            events = await generate_tick_events(prompt="Simulate...")

        assert len(events) == 1  # no validation, passes through
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ai-agents && uv run pytest tests/test_simulator_event_gen.py -v`
Expected: FAIL (generate_tick_events doesn't accept valid_workflows)

- [ ] **Step 3: Update event_gen.py**

Replace `generate_tick_events` in `agents/simulator_pipeline/event_gen.py`:

```python
async def generate_tick_events(
    *,
    prompt: str,
    valid_workflows: dict[str, Any] | None = None,
) -> list[SimulatedEvent]:
    """Generate events for a single tick via LLM.

    Applies safety enforcement: strips body_template from restricted types.
    If valid_workflows is provided, validates events against workflow-semantics.
    """
    result = await _event_agent.run(prompt)
    events = result.output

    # Safety enforcement: strip body from restricted types
    for event in events:
        if ContentPolicy.is_restricted(event.workflow_type):
            event.body_template = None

    # Validate against workflow-semantics if provided
    if valid_workflows is not None:
        from agents.simulator_pipeline.validation import validate_events
        events = validate_events(events, valid_workflows)

    return events
```

Add `from typing import Any` to the imports at the top of the file.

- [ ] **Step 4: Update simulator.py to pass workflows**

In `agents/simulator.py`, change line 184 from:

```python
            events = await generate_tick_events(prompt=prompt)
```

to:

```python
            events = await generate_tick_events(prompt=prompt, valid_workflows=workflows)
```

- [ ] **Step 5: Run tests**

Run: `cd ai-agents && uv run pytest tests/test_simulator_event_gen.py tests/test_simulator_validation.py -v`
Expected: PASS (all tests)

- [ ] **Step 6: Commit**

```bash
git add agents/simulator_pipeline/event_gen.py agents/simulator.py tests/test_simulator_event_gen.py
git commit -m "feat: integrate event validation into simulator pipeline"
```

---

## Chunk 2: Warm-Up & Demo Integration

### Task 3: Final Warm-Up Function

**Files:**
- Create: `agents/simulator_pipeline/warmup.py`
- Create: `tests/test_simulator_warmup.py`

Runs the bootstrap Phase 4 agent pipeline against a sim_dir.

- [ ] **Step 1: Write the failing tests**

```python
# tests/test_simulator_warmup.py
"""Tests for post-simulation warm-up."""
from __future__ import annotations

from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch, call

from agents.simulator_pipeline.warmup import run_warmup
from shared.config import config


class TestRunWarmup:
    async def test_calls_all_agents_in_order(self, tmp_path: Path):
        """Warm-up calls all 5 agents sequentially."""
        with patch("agents.simulator_pipeline.warmup._run_activity") as mock_act, \
             patch("agents.simulator_pipeline.warmup._run_profiler",
                   new_callable=AsyncMock) as mock_prof, \
             patch("agents.simulator_pipeline.warmup._run_briefing",
                   new_callable=AsyncMock) as mock_brief, \
             patch("agents.simulator_pipeline.warmup._run_digest",
                   new_callable=AsyncMock) as mock_digest, \
             patch("agents.simulator_pipeline.warmup._run_snapshot",
                   new_callable=AsyncMock) as mock_snap:
            await run_warmup(tmp_path)
            mock_act.assert_called_once()
            mock_prof.assert_called_once()
            mock_brief.assert_called_once()
            mock_digest.assert_called_once()
            mock_snap.assert_called_once()

    async def test_sets_and_resets_data_dir(self, tmp_path: Path):
        """Warm-up sets config.data_dir to sim_dir and resets after."""
        original = config.data_dir
        captured_dir = None

        async def capture_dir():
            nonlocal captured_dir
            captured_dir = config.data_dir

        with patch("agents.simulator_pipeline.warmup._run_activity"), \
             patch("agents.simulator_pipeline.warmup._run_profiler",
                   new_callable=AsyncMock, side_effect=capture_dir), \
             patch("agents.simulator_pipeline.warmup._run_briefing",
                   new_callable=AsyncMock), \
             patch("agents.simulator_pipeline.warmup._run_digest",
                   new_callable=AsyncMock), \
             patch("agents.simulator_pipeline.warmup._run_snapshot",
                   new_callable=AsyncMock):
            await run_warmup(tmp_path)

        assert captured_dir == tmp_path
        assert config.data_dir == original

    async def test_individual_failure_does_not_abort(self, tmp_path: Path):
        """If one agent fails, the rest still run."""
        with patch("agents.simulator_pipeline.warmup._run_activity",
                   side_effect=RuntimeError("activity failed")), \
             patch("agents.simulator_pipeline.warmup._run_profiler",
                   new_callable=AsyncMock) as mock_prof, \
             patch("agents.simulator_pipeline.warmup._run_briefing",
                   new_callable=AsyncMock) as mock_brief, \
             patch("agents.simulator_pipeline.warmup._run_digest",
                   new_callable=AsyncMock) as mock_digest, \
             patch("agents.simulator_pipeline.warmup._run_snapshot",
                   new_callable=AsyncMock) as mock_snap:
            await run_warmup(tmp_path)
            # All subsequent agents still called despite activity failure
            mock_prof.assert_called_once()
            mock_brief.assert_called_once()
            mock_digest.assert_called_once()
            mock_snap.assert_called_once()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ai-agents && uv run pytest tests/test_simulator_warmup.py -v`
Expected: FAIL (cannot import run_warmup)

- [ ] **Step 3: Implement warm-up module**

```python
# agents/simulator_pipeline/warmup.py
"""Post-simulation warm-up — runs agent pipeline to guarantee fresh data.

Executes the same agent sequence as bootstrap Phase 4:
activity metrics, profiler, briefing, digest, team snapshot.
Each agent is called with try/except so individual failures
don't abort the warm-up.
"""
from __future__ import annotations

import logging
from pathlib import Path

from shared.config import config

_log = logging.getLogger(__name__)


async def run_warmup(sim_dir: Path) -> None:
    """Run full agent warm-up against a simulation directory.

    Sets config.data_dir to sim_dir, runs agents, resets on completion.
    """
    config.set_data_dir(sim_dir)
    _log.info("Running post-simulation warm-up against %s", sim_dir)

    try:
        # 1. Deterministic: management activity metrics
        try:
            _run_activity()
            _log.info("Warm-up: activity metrics complete")
        except Exception:
            _log.exception("Warm-up: activity metrics failed")

        # 2. LLM: management profiler
        try:
            await _run_profiler()
            _log.info("Warm-up: profiler complete")
        except Exception:
            _log.exception("Warm-up: profiler failed")

        # 3. LLM: management briefing
        try:
            await _run_briefing()
            _log.info("Warm-up: briefing complete")
        except Exception:
            _log.exception("Warm-up: briefing failed")

        # 4. LLM: digest
        try:
            await _run_digest()
            _log.info("Warm-up: digest complete")
        except Exception:
            _log.exception("Warm-up: digest failed")

        # 5. LLM: team snapshot
        try:
            await _run_snapshot()
            _log.info("Warm-up: team snapshot complete")
        except Exception:
            _log.exception("Warm-up: team snapshot failed")

    finally:
        config.reset_data_dir()

    _log.info("Post-simulation warm-up complete")


def _run_activity() -> None:
    """Run management_activity to compute metrics."""
    from agents.management_activity import generate_management_report
    from shared.config import PROFILES_DIR

    report = generate_management_report()
    (PROFILES_DIR / "management-activity.json").write_text(
        report.model_dump_json(indent=2)
    )


async def _run_profiler() -> None:
    """Run management_profiler synthesis."""
    from agents.management_profiler import (
        generate_and_load_management_facts, synthesize_profile,
        build_profile, save_profile, load_existing_profile,
    )

    facts = generate_and_load_management_facts()
    existing = load_existing_profile()
    synthesis = await synthesize_profile(facts)
    profile = build_profile(facts, synthesis, existing)
    save_profile(profile)


async def _run_briefing() -> None:
    """Run management_briefing synthesis."""
    from agents.management_briefing import generate_briefing, format_briefing_md
    from shared.vault_writer import write_briefing_to_vault
    from shared.config import PROFILES_DIR

    briefing = await generate_briefing()
    md = format_briefing_md(briefing)
    write_briefing_to_vault(md)
    (PROFILES_DIR / "management-briefing.json").write_text(
        briefing.model_dump_json(indent=2)
    )


async def _run_digest() -> None:
    """Run digest synthesis."""
    from agents.digest import generate_digest, format_digest_md
    from shared.config import PROFILES_DIR

    digest = await generate_digest()
    (PROFILES_DIR / "digest.json").write_text(
        digest.model_dump_json(indent=2)
    )


async def _run_snapshot() -> None:
    """Run team snapshot synthesis."""
    from agents.management_prep import generate_team_snapshot, format_snapshot_md
    from shared.vault_writer import write_team_snapshot_to_vault

    snapshot = await generate_team_snapshot()
    write_team_snapshot_to_vault(format_snapshot_md(snapshot))
```

- [ ] **Step 4: Run tests**

Run: `cd ai-agents && uv run pytest tests/test_simulator_warmup.py -v`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add agents/simulator_pipeline/warmup.py tests/test_simulator_warmup.py
git commit -m "feat: add post-simulation warm-up agent pipeline"
```

---

### Task 4: Demo Agent --simulate Integration

**Files:**
- Modify: `agents/demo.py`
- Create: `tests/test_demo_simulate.py`

Add `--simulate` flag and orchestration to the demo agent.

- [ ] **Step 1: Write the failing tests**

```python
# tests/test_demo_simulate.py
"""Tests for demo agent --simulate integration."""
from __future__ import annotations

from pathlib import Path
from unittest.mock import AsyncMock, patch, MagicMock

from shared.config import config


class TestDemoSimulateOrchestration:
    async def test_simulate_calls_simulation_then_warmup_then_demo(self, tmp_path: Path):
        """--simulate runs simulation, warm-up, then demo generation."""
        sim_dir = tmp_path / "sim"
        sim_dir.mkdir()

        call_order = []

        async def mock_run_sim(**kwargs):
            call_order.append("simulate")
            return sim_dir

        async def mock_warmup(path):
            call_order.append("warmup")

        async def mock_generate_demo(request, **kwargs):
            call_order.append("demo")
            demo_dir = tmp_path / "demo-output"
            demo_dir.mkdir(exist_ok=True)
            return demo_dir

        with patch("agents.demo.run_simulation", side_effect=mock_run_sim), \
             patch("agents.demo.run_warmup", side_effect=mock_warmup), \
             patch("agents.demo.generate_demo", side_effect=mock_generate_demo), \
             patch("agents.demo.config") as mock_config:

            from agents.demo import _run_simulated_demo

            await _run_simulated_demo(
                request="the management cockpit for a technical peer",
                window="5d",
                variant="experienced-em",
                scenario=None,
                audience="technical-peer",
                format="slides",
                duration=None,
                persona_file=None,
                voice=False,
            )

        assert call_order == ["simulate", "warmup", "demo"]

    async def test_simulate_resets_data_dir_on_error(self, tmp_path: Path):
        """config.data_dir is reset even if demo generation fails."""
        sim_dir = tmp_path / "sim"
        sim_dir.mkdir()

        original_dir = config.data_dir

        async def mock_run_sim(**kwargs):
            return sim_dir

        async def mock_warmup(path):
            pass

        async def mock_generate_demo(request, **kwargs):
            raise RuntimeError("demo failed")

        with patch("agents.demo.run_simulation", side_effect=mock_run_sim), \
             patch("agents.demo.run_warmup", side_effect=mock_warmup), \
             patch("agents.demo.generate_demo", side_effect=mock_generate_demo):

            from agents.demo import _run_simulated_demo

            try:
                await _run_simulated_demo(
                    request="test",
                    window="5d",
                    variant="experienced-em",
                    scenario=None,
                    audience=None,
                    format="slides",
                    duration=None,
                    persona_file=None,
                    voice=False,
                )
            except RuntimeError:
                pass

        assert config.data_dir == original_dir
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ai-agents && uv run pytest tests/test_demo_simulate.py -v`
Expected: FAIL (cannot import _run_simulated_demo)

- [ ] **Step 3: Add simulation imports and helper to demo.py**

Add these imports near the top of `agents/demo.py` (after existing imports):

```python
from agents.simulator import run_simulation
from agents.simulator_pipeline.warmup import run_warmup
```

Add this function before `main()` in `agents/demo.py`:

```python
async def _run_simulated_demo(
    *,
    request: str,
    window: str = "30d",
    variant: str = "experienced-em",
    scenario: str | None = None,
    audience: str | None = None,
    format: str = "slides",
    duration: str | None = None,
    persona_file: Path | None = None,
    voice: bool = False,
) -> Path:
    """Run a temporal simulation, warm up the data, then generate a demo."""
    log.info("Running temporal simulation (window=%s, variant=%s)", window, variant)

    sim_dir = await run_simulation(
        role="engineering-manager",
        variant=variant,
        window=window,
        seed="demo-data/",
        scenario=scenario,
        audience=audience,
    )

    log.info("Simulation complete at %s, running warm-up", sim_dir)
    await run_warmup(sim_dir)

    log.info("Warm-up complete, generating demo")
    config.set_data_dir(sim_dir)
    try:
        demo_dir = await generate_demo(
            request,
            format=format,
            duration=duration,
            on_progress=lambda msg: log.info(msg),
            persona_file=persona_file,
            enable_voice=voice,
        )
    finally:
        config.reset_data_dir()

    return demo_dir
```

- [ ] **Step 4: Add CLI flags and wire into main()**

In the `main()` function in `agents/demo.py`, add these arguments after the existing `parser.add_argument` calls (before `args = parser.parse_args()`):

```python
    parser.add_argument("--simulate", action="store_true",
                        help="Run temporal simulation before demo generation")
    parser.add_argument("--window", type=str, default="30d",
                        help="Simulation window (e.g. 7d, 30d, 90d)")
    parser.add_argument("--variant", type=str, default="experienced-em",
                        help="Role variant (new-em, experienced-em, senior-em)")
    parser.add_argument("--scenario", type=str, default=None,
                        help="Scenario modifier (pre-quarterly, post-incident, etc.)")
```

Then, in `main()`, add a branch for `--simulate` before the existing `if args.json:` block. Replace the section starting at `if args.json:` through to the end of the `else` block:

```python
    if args.simulate:
        if not args.request:
            parser.error("request is required with --simulate")
        demo_dir = await _run_simulated_demo(
            request=args.request if not args.audience else f"{parse_request(args.request)[0]} for {args.audience}",
            window=args.window,
            variant=args.variant,
            scenario=args.scenario,
            audience=args.audience,
            format=args.format,
            duration=args.duration,
            persona_file=args.persona_file,
            voice=args.voice,
        )
        print(f"\nSimulated demo generated: {demo_dir}")
        for f in sorted(demo_dir.rglob("*")):
            if f.is_file():
                print(f"  {f.relative_to(demo_dir)}")
    elif args.json:
```

(The rest of the `elif args.json:` and `else:` blocks remain unchanged.)

- [ ] **Step 5: Run tests**

Run: `cd ai-agents && uv run pytest tests/test_demo_simulate.py -v`
Expected: PASS (2 tests)

- [ ] **Step 6: Run full test suite**

Run: `cd ai-agents && uv run pytest tests/ -q`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add agents/demo.py tests/test_demo_simulate.py
git commit -m "feat: add --simulate flag to demo agent for time-travel demos"
```

---

### Task 5: Final Integration Verification

- [ ] **Step 1: Run full test suite**

Run: `cd ai-agents && uv run pytest tests/ -q`
Expected: All tests pass

- [ ] **Step 2: Verify CLI help shows new flags**

Run: `cd ai-agents && uv run python -m agents.demo --help`
Expected: Shows `--simulate`, `--window`, `--variant`, `--scenario` flags

- [ ] **Step 3: Verify simulator CLI help unchanged**

Run: `cd ai-agents && uv run python -m agents.simulator --help`
Expected: Shows all existing flags

- [ ] **Step 4: Verify imports**

Run: `cd ai-agents && uv run python -c "from agents.demo import _run_simulated_demo; print('demo simulate imports ok')"`
Expected: Prints "demo simulate imports ok"

Run: `cd ai-agents && uv run python -c "from agents.simulator_pipeline.validation import validate_events; print('validation imports ok')"`
Expected: Prints "validation imports ok"

Run: `cd ai-agents && uv run python -c "from agents.simulator_pipeline.warmup import run_warmup; print('warmup imports ok')"`
Expected: Prints "warmup imports ok"

- [ ] **Step 5: Commit any fixes**

Only if needed.
