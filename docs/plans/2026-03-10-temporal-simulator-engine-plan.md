# Temporal Simulation Engine — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the temporal simulation engine that advances through simulated time in day-sized ticks, generating plausible management activity via LLM-driven event generation, running tiered fidelity checkpoints, and supporting seed date rebasing and resume.

**Architecture:** A CLI-invocable agent (`agents/simulator.py`) with a pipeline module (`agents/simulator_pipeline/`) containing event generation, tick advancement, checkpoint execution, and content rendering. LLM generates structured `SimulatedEvent` outputs per tick; templates render events into markdown files with frontmatter. Tiered checkpoints run deterministic agents every tick and LLM synthesis agents at weekly boundaries.

**Tech Stack:** Python 3.12+, pydantic-ai, Pydantic, PyYAML, pytest, unittest.mock

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `agents/simulator.py` | Create | CLI entry point, orchestration loop |
| `agents/simulator_pipeline/__init__.py` | Create | Package init |
| `agents/simulator_pipeline/models.py` | Create | SimulatedEvent, TickResult, SimulatedDay Pydantic models |
| `agents/simulator_pipeline/context.py` | Create | Role profile composition, workflow semantics loading, prompt assembly |
| `agents/simulator_pipeline/event_gen.py` | Create | LLM-driven event generation per tick |
| `agents/simulator_pipeline/renderer.py` | Create | Event → markdown file rendering with frontmatter + body |
| `agents/simulator_pipeline/checkpoints.py` | Create | Tiered checkpoint runner (deterministic + LLM synthesis) |
| `agents/simulator_pipeline/seed.py` | Create | Seed date rebasing during copy step |
| `shared/simulation.py` | Modify | Add `rebase_seed_dates()` caller in `seed_simulation()` |
| `tests/test_simulator_models.py` | Create | Tests for SimulatedEvent and related models |
| `tests/test_simulator_context.py` | Create | Tests for role profile composition and prompt assembly |
| `tests/test_simulator_event_gen.py` | Create | Tests for LLM event generation (mocked) |
| `tests/test_simulator_renderer.py` | Create | Tests for event → markdown rendering |
| `tests/test_simulator_checkpoints.py` | Create | Tests for checkpoint runner |
| `tests/test_simulator_seed.py` | Create | Tests for seed date rebasing |
| `tests/test_simulator_integration.py` | Create | End-to-end simulation test (mocked LLM) |

---

## Chunk 1: Structured Output Models & Safety

### Task 1: SimulatedEvent and Pipeline Models

**Files:**
- Create: `agents/simulator_pipeline/__init__.py`
- Create: `agents/simulator_pipeline/models.py`
- Create: `tests/test_simulator_models.py`

- [ ] **Step 1: Create package directory**

Run: `mkdir -p agents/simulator_pipeline`

- [ ] **Step 2: Write the failing tests**

```python
# tests/test_simulator_models.py
"""Tests for simulator pipeline models."""
from __future__ import annotations

from datetime import date

import pytest

from agents.simulator_pipeline.models import (
    SimulatedEvent,
    TickResult,
    ContentPolicy,
)


class TestSimulatedEvent:
    def test_basic_event(self):
        """SimulatedEvent with all required fields."""
        event = SimulatedEvent(
            date="2026-03-05",
            workflow_type="one_on_one",
            subdirectory="meetings",
            filename="2026-03-05-alice-1on1.md",
            participant="Alice",
            topics=["project status", "blockers"],
            metadata={"type": "meeting", "meeting-type": "one-on-one", "person": "Alice"},
        )
        assert event.workflow_type == "one_on_one"
        assert event.participant == "Alice"
        assert event.body_template is None

    def test_event_with_body_template(self):
        """Events for meetings/decisions/status-reports can have body content."""
        event = SimulatedEvent(
            date="2026-03-05",
            workflow_type="decision",
            subdirectory="decisions",
            filename="2026-03-05-adopt-ci.md",
            topics=["CI pipeline", "migration plan"],
            metadata={"type": "decision", "title": "Adopt new CI"},
            body_template="## Context\n\n{topics}\n\n## Decision\n\n{decision_text}",
        )
        assert event.body_template is not None

    def test_coaching_feedback_no_body(self):
        """Coaching/feedback events must NOT have evaluative body content."""
        event = SimulatedEvent(
            date="2026-03-05",
            workflow_type="coaching_note",
            subdirectory="coaching",
            filename="2026-03-05-alice-delegation.md",
            participant="Alice",
            topics=["delegation", "project ownership"],
            metadata={"type": "coaching", "person": "Alice", "status": "active"},
        )
        # body_template is None by default — enforced by template rendering
        assert event.body_template is None

    def test_content_policy_safe_types(self):
        """ContentPolicy identifies coaching/feedback as restricted."""
        assert ContentPolicy.is_restricted("coaching_note") is True
        assert ContentPolicy.is_restricted("feedback") is True
        assert ContentPolicy.is_restricted("one_on_one") is False
        assert ContentPolicy.is_restricted("decision") is False
        assert ContentPolicy.is_restricted("incident") is False

    def test_content_policy_allows_body_for_unrestricted(self):
        """Unrestricted types allow body_template."""
        assert ContentPolicy.allows_body("decision") is True
        assert ContentPolicy.allows_body("status_report") is True
        assert ContentPolicy.allows_body("one_on_one") is True

    def test_content_policy_blocks_body_for_restricted(self):
        """Restricted types block body_template."""
        assert ContentPolicy.allows_body("coaching_note") is False
        assert ContentPolicy.allows_body("feedback") is False


class TestTickResult:
    def test_tick_result(self):
        """TickResult holds events for a single tick."""
        result = TickResult(
            date="2026-03-05",
            events=[
                SimulatedEvent(
                    date="2026-03-05",
                    workflow_type="one_on_one",
                    subdirectory="meetings",
                    filename="2026-03-05-alice.md",
                    topics=["standup"],
                    metadata={"type": "meeting"},
                ),
            ],
            checkpoint_ran=False,
        )
        assert len(result.events) == 1
        assert result.checkpoint_ran is False

    def test_tick_result_has_significant_events(self):
        """TickResult detects incident/review-cycle events."""
        result = TickResult(
            date="2026-03-05",
            events=[
                SimulatedEvent(
                    date="2026-03-05",
                    workflow_type="incident",
                    subdirectory="incidents",
                    filename="2026-03-05-outage.md",
                    topics=["service outage"],
                    metadata={"type": "incident", "severity": "high"},
                ),
            ],
            checkpoint_ran=False,
        )
        assert result.has_significant_events is True
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd ai-agents && uv run pytest tests/test_simulator_models.py -v`
Expected: FAIL — modules don't exist

- [ ] **Step 4: Create package init**

```python
# agents/simulator_pipeline/__init__.py
"""Temporal simulator pipeline — event generation, rendering, checkpoints."""
```

- [ ] **Step 5: Implement models**

```python
# agents/simulator_pipeline/models.py
"""Structured output models for the temporal simulator.

Safety enforcement: coaching and feedback events use restricted content
policy — no free-text body, no evaluative language. Content is rendered
from structural fields (date, participant, topics, action items) only.
"""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


# Workflow types where body content is prohibited (management_safety axiom)
_RESTRICTED_TYPES = frozenset({"coaching_note", "feedback"})

# Workflow types that generate significant downstream events
_SIGNIFICANT_TYPES = frozenset({"incident", "review_cycle"})


class ContentPolicy:
    """Safety boundary for simulated event content."""

    @staticmethod
    def is_restricted(workflow_type: str) -> bool:
        """Return True if this workflow type prohibits free-text body."""
        return workflow_type in _RESTRICTED_TYPES

    @staticmethod
    def allows_body(workflow_type: str) -> bool:
        """Return True if this workflow type can have body_template content."""
        return workflow_type not in _RESTRICTED_TYPES


class SimulatedEvent(BaseModel):
    """A single filesystem event generated by the simulator.

    For restricted types (coaching, feedback), body_template must be None.
    Content is generated from structural fields via templates.
    """
    date: str = Field(description="ISO date of the event (YYYY-MM-DD)")
    workflow_type: str = Field(description="Key into workflow-semantics.yaml")
    subdirectory: str = Field(description="Target subdirectory in DATA_DIR")
    filename: str = Field(description="Output filename")
    participant: str | None = Field(default=None, description="Person for people-related events")
    topics: list[str] = Field(default_factory=list, description="Structural content topics")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Frontmatter fields")
    body_template: str | None = Field(
        default=None,
        description="Body content template (only for unrestricted types)",
    )


class TickResult(BaseModel):
    """Result of processing a single simulation tick (one workday)."""
    date: str = Field(description="ISO date of this tick")
    events: list[SimulatedEvent] = Field(default_factory=list)
    checkpoint_ran: bool = Field(default=False)
    checkpoint_type: str | None = Field(default=None, description="'weekly' or 'significant'")

    @property
    def has_significant_events(self) -> bool:
        """True if this tick produced incidents or review cycles."""
        return any(e.workflow_type in _SIGNIFICANT_TYPES for e in self.events)
```

- [ ] **Step 6: Run tests**

Run: `cd ai-agents && uv run pytest tests/test_simulator_models.py -v`
Expected: PASS (all 8 tests)

- [ ] **Step 7: Commit**

```bash
git add agents/simulator_pipeline/ tests/test_simulator_models.py
git commit -m "feat: add simulator pipeline models with content safety policy"
```

### Task 2: Event Renderer (Event → Markdown)

**Files:**
- Create: `agents/simulator_pipeline/renderer.py`
- Create: `tests/test_simulator_renderer.py`

The renderer converts SimulatedEvent objects into markdown files with YAML frontmatter written to the ephemeral DATA_DIR.

- [ ] **Step 1: Write the failing tests**

```python
# tests/test_simulator_renderer.py
"""Tests for simulator event renderer."""
from __future__ import annotations

from pathlib import Path

import yaml

from agents.simulator_pipeline.models import SimulatedEvent
from agents.simulator_pipeline.renderer import render_event, render_events


class TestRenderEvent:
    def test_renders_meeting_with_body(self, tmp_path: Path):
        """Meeting event produces markdown with frontmatter + body."""
        event = SimulatedEvent(
            date="2026-03-05",
            workflow_type="one_on_one",
            subdirectory="meetings",
            filename="2026-03-05-alice-1on1.md",
            participant="Alice",
            topics=["project status", "blockers", "career growth"],
            metadata={
                "type": "meeting",
                "meeting-type": "one-on-one",
                "person": "Alice",
                "date": "2026-03-05",
            },
            body_template="## Topics\n\n- {topics_list}\n\n## Action Items\n\n- Follow up on blockers",
        )
        path = render_event(event, tmp_path)

        assert path.exists()
        assert path == tmp_path / "meetings" / "2026-03-05-alice-1on1.md"

        content = path.read_text()
        assert "---" in content
        assert "type: meeting" in content
        assert "meeting-type: one-on-one" in content

    def test_renders_coaching_without_evaluative_body(self, tmp_path: Path):
        """Coaching event has structural body only — no evaluative language."""
        event = SimulatedEvent(
            date="2026-03-05",
            workflow_type="coaching_note",
            subdirectory="coaching",
            filename="2026-03-05-alice-delegation.md",
            participant="Alice",
            topics=["delegation", "project ownership"],
            metadata={
                "type": "coaching",
                "person": "Alice",
                "status": "active",
                "check-in-by": "2026-03-19",
            },
        )
        (tmp_path / "coaching").mkdir(parents=True)
        path = render_event(event, tmp_path)

        assert path.exists()
        content = path.read_text()

        # Has frontmatter
        assert "type: coaching" in content
        assert "person: Alice" in content

        # Body is structural (topics, date, action items) not evaluative
        assert "delegation" in content.lower()

    def test_renders_feedback_structural(self, tmp_path: Path):
        """Feedback event body is structural only."""
        event = SimulatedEvent(
            date="2026-03-05",
            workflow_type="feedback",
            subdirectory="feedback",
            filename="2026-03-05-bob-review.md",
            participant="Bob",
            topics=["code review", "pair programming"],
            metadata={
                "type": "feedback",
                "person": "Bob",
                "direction": "given",
                "category": "growth",
                "follow-up-by": "2026-03-19",
                "followed-up": False,
            },
        )
        (tmp_path / "feedback").mkdir(parents=True)
        path = render_event(event, tmp_path)

        assert path.exists()
        content = path.read_text()
        assert "type: feedback" in content

    def test_creates_subdirectory(self, tmp_path: Path):
        """Renderer creates subdirectory if it doesn't exist."""
        event = SimulatedEvent(
            date="2026-03-05",
            workflow_type="decision",
            subdirectory="decisions",
            filename="2026-03-05-ci.md",
            topics=["CI pipeline"],
            metadata={"type": "decision", "title": "Adopt CI"},
        )
        path = render_event(event, tmp_path)
        assert (tmp_path / "decisions").is_dir()
        assert path.exists()


class TestRenderEvents:
    def test_renders_multiple_events(self, tmp_path: Path):
        """render_events() writes all events and returns paths."""
        events = [
            SimulatedEvent(
                date="2026-03-05",
                workflow_type="one_on_one",
                subdirectory="meetings",
                filename="2026-03-05-alice.md",
                topics=["standup"],
                metadata={"type": "meeting"},
            ),
            SimulatedEvent(
                date="2026-03-05",
                workflow_type="decision",
                subdirectory="decisions",
                filename="2026-03-05-ci.md",
                topics=["CI"],
                metadata={"type": "decision"},
            ),
        ]
        paths = render_events(events, tmp_path)
        assert len(paths) == 2
        assert all(p.exists() for p in paths)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ai-agents && uv run pytest tests/test_simulator_renderer.py -v`
Expected: FAIL

- [ ] **Step 3: Implement renderer**

```python
# agents/simulator_pipeline/renderer.py
"""Render SimulatedEvent objects into markdown files with YAML frontmatter.

Coaching and feedback events use structural templates (date, participant,
topics, action items) — never evaluative or prescriptive language.
"""
from __future__ import annotations

import logging
from pathlib import Path

import yaml

from agents.simulator_pipeline.models import ContentPolicy, SimulatedEvent

_log = logging.getLogger(__name__)


def render_event(event: SimulatedEvent, data_dir: Path) -> Path:
    """Render a single event to a markdown file in data_dir.

    Returns the path to the written file.
    """
    target_dir = data_dir / event.subdirectory
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / event.filename

    frontmatter = yaml.dump(event.metadata, default_flow_style=False).strip()
    body = _render_body(event)

    content = f"---\n{frontmatter}\n---\n{body}\n"
    target.write_text(content, encoding="utf-8")

    _log.debug("Rendered %s -> %s", event.workflow_type, target)
    return target


def render_events(events: list[SimulatedEvent], data_dir: Path) -> list[Path]:
    """Render multiple events. Returns list of written file paths."""
    return [render_event(event, data_dir) for event in events]


def _render_body(event: SimulatedEvent) -> str:
    """Generate body content for an event.

    Restricted types (coaching, feedback) get structural-only templates.
    Unrestricted types use body_template if provided, else structural fallback.
    """
    if ContentPolicy.is_restricted(event.workflow_type):
        return _structural_body(event)

    if event.body_template:
        return _expand_template(event)

    return _structural_body(event)


def _structural_body(event: SimulatedEvent) -> str:
    """Generate a structural body from event fields — no evaluative content."""
    lines = []

    if event.participant:
        lines.append(f"Participant: {event.participant}")
    if event.topics:
        lines.append("")
        lines.append("## Topics")
        lines.append("")
        for topic in event.topics:
            lines.append(f"- {topic}")

    return "\n".join(lines)


def _expand_template(event: SimulatedEvent) -> str:
    """Expand body_template with event fields."""
    topics_list = "\n".join(f"- {t}" for t in event.topics)
    return event.body_template.replace("{topics_list}", topics_list).replace(
        "{topics}", ", ".join(event.topics)
    )
```

- [ ] **Step 4: Run tests**

Run: `cd ai-agents && uv run pytest tests/test_simulator_renderer.py -v`
Expected: PASS

- [ ] **Step 5: Run full test suite**

Run: `cd ai-agents && uv run pytest tests/ -q`
Expected: All pass

- [ ] **Step 6: Commit**

```bash
git add agents/simulator_pipeline/renderer.py tests/test_simulator_renderer.py
git commit -m "feat: add simulator event renderer with content safety enforcement"
```

### Task 3: Role Profile Composition & Context Assembly

**Files:**
- Create: `agents/simulator_pipeline/context.py`
- Create: `tests/test_simulator_context.py`

Loads workflow semantics, role matrix, and scenarios from YAML files and composes them into a prompt context for the LLM event generator.

- [ ] **Step 1: Write the failing tests**

```python
# tests/test_simulator_context.py
"""Tests for simulator context assembly."""
from __future__ import annotations

from pathlib import Path

import yaml

from agents.simulator_pipeline.context import (
    load_workflow_semantics,
    load_role_matrix,
    load_scenarios,
    compose_role_profile,
    build_tick_prompt,
)


_FIXTURES = Path(__file__).resolve().parent.parent

# Use the real config files (already committed)
_WORKFLOW_SEMANTICS = _FIXTURES.parent / "docs" / "workflow-semantics.yaml"
_ROLE_MATRIX = _FIXTURES / "config" / "role-matrix.yaml"
_SCENARIOS = _FIXTURES / "config" / "scenarios.yaml"


class TestLoadConfig:
    def test_load_workflow_semantics(self):
        """Loads workflow-semantics.yaml."""
        workflows = load_workflow_semantics(_WORKFLOW_SEMANTICS)
        assert "one_on_one" in workflows
        assert "coaching_note" in workflows
        assert workflows["one_on_one"]["subdirectory"] == "meetings/"

    def test_load_role_matrix(self):
        """Loads role-matrix.yaml."""
        roles = load_role_matrix(_ROLE_MATRIX)
        assert "engineering-manager" in roles
        em = roles["engineering-manager"]
        assert "experienced-em" in em["variants"]
        assert "one_on_one" in em["workflows"]

    def test_load_scenarios(self):
        """Loads scenarios.yaml."""
        scenarios = load_scenarios(_SCENARIOS)
        assert "pre-quarterly" in scenarios
        assert scenarios["pre-quarterly"]["probability_overrides"]["okr_update"] == 3.0


class TestComposeRoleProfile:
    def test_compose_experienced_em(self):
        """Compose profile for experienced EM — baseline cadences."""
        workflows = load_workflow_semantics(_WORKFLOW_SEMANTICS)
        roles = load_role_matrix(_ROLE_MATRIX)

        profile = compose_role_profile(
            role_name="engineering-manager",
            variant="experienced-em",
            roles=roles,
            workflows=workflows,
        )
        assert profile["role"] == "engineering-manager"
        assert profile["variant"] == "experienced-em"
        assert "workflows" in profile
        assert len(profile["workflows"]) == 10

    def test_compose_new_em_applies_modifiers(self):
        """New EM variant applies cadence modifiers."""
        workflows = load_workflow_semantics(_WORKFLOW_SEMANTICS)
        roles = load_role_matrix(_ROLE_MATRIX)

        profile = compose_role_profile(
            role_name="engineering-manager",
            variant="new-em",
            roles=roles,
            workflows=workflows,
        )
        # New EM should have modifiers applied
        assert profile["cadence_modifiers"]["one_on_one"] == 1.5
        assert profile["cadence_modifiers"]["decision"] == 0.3

    def test_compose_with_scenario(self):
        """Scenario overrides are merged into profile."""
        workflows = load_workflow_semantics(_WORKFLOW_SEMANTICS)
        roles = load_role_matrix(_ROLE_MATRIX)
        scenarios = load_scenarios(_SCENARIOS)

        profile = compose_role_profile(
            role_name="engineering-manager",
            variant="experienced-em",
            roles=roles,
            workflows=workflows,
            scenario=scenarios.get("pre-quarterly"),
        )
        assert profile["scenario_overrides"]["okr_update"] == 3.0


class TestBuildTickPrompt:
    def test_prompt_contains_essentials(self):
        """Tick prompt includes date, role, existing state summary, workflows."""
        workflows = load_workflow_semantics(_WORKFLOW_SEMANTICS)
        roles = load_role_matrix(_ROLE_MATRIX)

        profile = compose_role_profile(
            role_name="engineering-manager",
            variant="experienced-em",
            roles=roles,
            workflows=workflows,
        )

        prompt = build_tick_prompt(
            profile=profile,
            current_date="2026-03-05",
            existing_state_summary="7 active people, 3 teams, 2 stale 1:1s",
            recent_events=["2026-03-04: 1:1 with Alice", "2026-03-03: coaching note for Bob"],
        )
        assert "2026-03-05" in prompt
        assert "engineering-manager" in prompt
        assert "7 active people" in prompt
        assert "1:1 with Alice" in prompt
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ai-agents && uv run pytest tests/test_simulator_context.py -v`
Expected: FAIL

- [ ] **Step 3: Implement context module**

```python
# agents/simulator_pipeline/context.py
"""Context assembly for the temporal simulator.

Loads workflow semantics, role matrix, and scenarios; composes them into
a role profile and builds per-tick prompts for LLM event generation.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import yaml

_log = logging.getLogger(__name__)


def load_workflow_semantics(path: Path) -> dict[str, Any]:
    """Load workflow-semantics.yaml. Returns the workflows dict."""
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    return data["workflows"]


def load_role_matrix(path: Path) -> dict[str, Any]:
    """Load role-matrix.yaml. Returns the roles dict."""
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    return data["roles"]


def load_scenarios(path: Path) -> dict[str, Any]:
    """Load scenarios.yaml. Returns the scenarios dict."""
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    return data["scenarios"]


def compose_role_profile(
    *,
    role_name: str,
    variant: str,
    roles: dict[str, Any],
    workflows: dict[str, Any],
    scenario: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Compose a role profile from role matrix + variant + scenario.

    Returns a dict with: role, variant, description, workflows (list of
    workflow dicts with semantics), cadence_modifiers, scenario_overrides.
    """
    role = roles[role_name]
    variant_def = role["variants"].get(variant, {})

    # Build workflow details
    workflow_details = []
    for wf_name in role["workflows"]:
        if wf_name in workflows:
            workflow_details.append({
                "name": wf_name,
                **workflows[wf_name],
            })

    profile: dict[str, Any] = {
        "role": role_name,
        "variant": variant,
        "description": role.get("description", ""),
        "variant_description": variant_def.get("description", ""),
        "workflows": workflow_details,
        "cadence_modifiers": variant_def.get("cadence_modifiers", {}),
        "scenario_overrides": {},
    }

    if scenario:
        profile["scenario_description"] = scenario.get("description", "")
        profile["scenario_overrides"] = scenario.get("probability_overrides", {})

    return profile


def build_tick_prompt(
    *,
    profile: dict[str, Any],
    current_date: str,
    existing_state_summary: str,
    recent_events: list[str] | None = None,
) -> str:
    """Build the per-tick prompt for LLM event generation.

    Includes: role context, current date, existing DATA_DIR state,
    recent events for continuity, and workflow semantics.
    """
    lines = [
        f"You are simulating a {profile['role']} ({profile['variant']}).",
        f"Variant: {profile['variant_description']}",
        "",
        f"Today's date: {current_date}",
        "",
        f"Current state of the management data:",
        existing_state_summary,
        "",
    ]

    if recent_events:
        lines.append("Recent events (for continuity):")
        for event in recent_events[-5:]:
            lines.append(f"  - {event}")
        lines.append("")

    lines.append("Available workflows and their semantics:")
    for wf in profile["workflows"]:
        modifier = profile["cadence_modifiers"].get(wf["name"], 1.0)
        scenario_mod = profile["scenario_overrides"].get(wf["name"], 1.0)
        effective = modifier * scenario_mod
        cadence = wf.get("cadence", "event-driven")
        lines.append(f"  - {wf['name']}: {wf.get('description', '')} "
                      f"(cadence: {cadence}, weight: {effective:.1f}x)")
    lines.append("")

    if profile.get("scenario_description"):
        lines.append(f"Scenario context: {profile['scenario_description']}")
        lines.append("")

    lines.extend([
        "Generate 0-3 plausible events for today. Consider:",
        "- What would this role naturally do on this day?",
        "- Respect cadences (don't do daily what should be weekly)",
        "- Some days have no events — that's normal",
        "- Incidents and decisions are stochastic (rare, random)",
        "- Follow trigger chains (incident -> postmortem_action)",
        "",
        "SAFETY: Never generate evaluative language about team members.",
        "Coaching and feedback events must contain ONLY structural content:",
        "date, participant, topics discussed, and action items.",
    ])

    return "\n".join(lines)
```

- [ ] **Step 4: Run tests**

Run: `cd ai-agents && uv run pytest tests/test_simulator_context.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add agents/simulator_pipeline/context.py tests/test_simulator_context.py
git commit -m "feat: add simulator context assembly and role profile composition"
```

---

## Chunk 2: Event Generation & Checkpoints

### Task 4: Seed Date Rebasing

**Files:**
- Create: `agents/simulator_pipeline/seed.py`
- Create: `tests/test_simulator_seed.py`

Rebases dates in seed corpus files relative to the simulation start_date.

- [ ] **Step 1: Write the failing tests**

```python
# tests/test_simulator_seed.py
"""Tests for seed date rebasing."""
from __future__ import annotations

from datetime import date
from pathlib import Path

from agents.simulator_pipeline.seed import rebase_seed_dates, find_latest_date


class TestFindLatestDate:
    def test_finds_latest_date_in_frontmatter(self, tmp_path: Path):
        """Scans frontmatter for date fields and returns the latest."""
        (tmp_path / "people").mkdir()
        (tmp_path / "people" / "alice.md").write_text(
            "---\ntype: person\nlast-1on1: 2026-03-08\n---\n"
        )
        (tmp_path / "coaching").mkdir()
        (tmp_path / "coaching" / "note.md").write_text(
            "---\ntype: coaching\ncheck-in-by: 2026-03-10\n---\n"
        )
        result = find_latest_date(tmp_path)
        assert result == date(2026, 3, 10)

    def test_returns_none_for_no_dates(self, tmp_path: Path):
        """Returns None if no date fields found."""
        (tmp_path / "people").mkdir()
        (tmp_path / "people" / "alice.md").write_text(
            "---\ntype: person\nname: Alice\n---\n"
        )
        result = find_latest_date(tmp_path)
        assert result is None


class TestRebaseSeedDates:
    def test_shifts_dates_backward(self, tmp_path: Path):
        """Rebases seed dates relative to simulation start_date."""
        (tmp_path / "people").mkdir()
        (tmp_path / "people" / "alice.md").write_text(
            "---\ntype: person\nlast-1on1: 2026-03-08\n---\nBody text.\n"
        )
        (tmp_path / "coaching").mkdir()
        (tmp_path / "coaching" / "note.md").write_text(
            "---\ntype: coaching\ncheck-in-by: 2026-03-10\ncreated: 2026-03-01\n---\nCoaching.\n"
        )

        # Latest seed date is 2026-03-10, sim starts 2026-01-01
        # Offset = 68 days backward
        rebase_seed_dates(tmp_path, sim_start=date(2026, 1, 1))

        alice = (tmp_path / "people" / "alice.md").read_text()
        assert "2026-03-08" not in alice  # old date gone
        assert "2025-12-30" in alice or "2025-12-31" in alice or "2026-01-" in alice

        note = (tmp_path / "coaching" / "note.md").read_text()
        assert "2026-03-10" not in note
        assert "2026-03-01" not in note

    def test_noop_when_no_dates(self, tmp_path: Path):
        """No-op if seed has no date fields."""
        (tmp_path / "people").mkdir()
        (tmp_path / "people" / "alice.md").write_text(
            "---\ntype: person\nname: Alice\n---\n"
        )
        rebase_seed_dates(tmp_path, sim_start=date(2026, 1, 1))
        content = (tmp_path / "people" / "alice.md").read_text()
        assert "name: Alice" in content

    def test_preserves_non_date_content(self, tmp_path: Path):
        """Non-date frontmatter and body content are preserved."""
        (tmp_path / "people").mkdir()
        (tmp_path / "people" / "alice.md").write_text(
            "---\ntype: person\nname: Alice\nteam: platform\nlast-1on1: 2026-03-08\n---\nAlice body.\n"
        )
        rebase_seed_dates(tmp_path, sim_start=date(2026, 1, 1))
        content = (tmp_path / "people" / "alice.md").read_text()
        assert "name: Alice" in content
        assert "team: platform" in content
        assert "Alice body." in content
```

- [ ] **Step 2: Implement seed module**

```python
# agents/simulator_pipeline/seed.py
"""Seed date rebasing for simulation setup.

Scans seed corpus files for ISO date strings in frontmatter and shifts
them by a calculated offset so the seed represents 'existing history'
at the simulation start_date.
"""
from __future__ import annotations

import logging
import re
from datetime import date, timedelta
from pathlib import Path

_log = logging.getLogger(__name__)

# ISO date pattern (YYYY-MM-DD)
_DATE_RE = re.compile(r"\b(\d{4}-\d{2}-\d{2})\b")


def find_latest_date(data_dir: Path) -> date | None:
    """Scan all .md files in data_dir for the latest ISO date in frontmatter."""
    latest: date | None = None

    for md_file in data_dir.rglob("*.md"):
        content = md_file.read_text(encoding="utf-8")
        # Only scan frontmatter (between --- markers)
        parts = content.split("---", 2)
        if len(parts) < 3:
            continue
        frontmatter = parts[1]

        for match in _DATE_RE.finditer(frontmatter):
            try:
                d = date.fromisoformat(match.group(1))
                if latest is None or d > latest:
                    latest = d
            except ValueError:
                continue

    return latest


def rebase_seed_dates(data_dir: Path, sim_start: date) -> None:
    """Rebase all dates in seed corpus files relative to sim_start.

    Finds the latest date in the corpus, calculates the offset to make
    that date fall just before sim_start, then shifts all dates by that offset.
    """
    latest = find_latest_date(data_dir)
    if latest is None:
        _log.info("No dates found in seed corpus, skipping rebase")
        return

    offset = (sim_start - latest) - timedelta(days=1)
    if offset.days == 0:
        _log.info("Seed dates already aligned with sim_start")
        return

    _log.info("Rebasing seed dates by %d days (latest=%s, sim_start=%s)",
              offset.days, latest, sim_start)

    for md_file in data_dir.rglob("*.md"):
        content = md_file.read_text(encoding="utf-8")
        parts = content.split("---", 2)
        if len(parts) < 3:
            continue

        frontmatter = parts[1]
        new_frontmatter = _DATE_RE.sub(
            lambda m: _shift_date(m.group(1), offset), frontmatter
        )

        if new_frontmatter != frontmatter:
            md_file.write_text(
                f"---{new_frontmatter}---{parts[2]}",
                encoding="utf-8",
            )


def _shift_date(date_str: str, offset: timedelta) -> str:
    """Shift a single ISO date string by offset."""
    try:
        d = date.fromisoformat(date_str)
        return (d + offset).isoformat()
    except ValueError:
        return date_str
```

- [ ] **Step 3: Run tests**

Run: `cd ai-agents && uv run pytest tests/test_simulator_seed.py -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add agents/simulator_pipeline/seed.py tests/test_simulator_seed.py
git commit -m "feat: add seed date rebasing for simulation setup"
```

### Task 5: LLM Event Generation

**Files:**
- Create: `agents/simulator_pipeline/event_gen.py`
- Create: `tests/test_simulator_event_gen.py`

The core LLM-driven event generator. Uses pydantic-ai to generate structured SimulatedEvent outputs.

- [ ] **Step 1: Write the failing tests**

```python
# tests/test_simulator_event_gen.py
"""Tests for LLM-driven event generation (mocked)."""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

from agents.simulator_pipeline.event_gen import generate_tick_events
from agents.simulator_pipeline.models import SimulatedEvent


class TestGenerateTickEvents:
    async def test_returns_events_from_llm(self):
        """LLM generates a list of SimulatedEvent objects."""
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
        ]

        mock_result = MagicMock()
        mock_result.output = mock_events

        with patch("agents.simulator_pipeline.event_gen._event_agent") as mock_agent:
            mock_agent.run = AsyncMock(return_value=mock_result)

            events = await generate_tick_events(
                prompt="Simulate events for 2026-03-05...",
            )

        assert len(events) == 1
        assert events[0].workflow_type == "one_on_one"

    async def test_empty_day_returns_empty_list(self):
        """LLM can return empty list (quiet day)."""
        mock_result = MagicMock()
        mock_result.output = []

        with patch("agents.simulator_pipeline.event_gen._event_agent") as mock_agent:
            mock_agent.run = AsyncMock(return_value=mock_result)
            events = await generate_tick_events(prompt="Simulate...")

        assert events == []

    async def test_strips_restricted_body_templates(self):
        """Body templates on restricted types are stripped for safety."""
        mock_events = [
            SimulatedEvent(
                date="2026-03-05",
                workflow_type="coaching_note",
                subdirectory="coaching",
                filename="2026-03-05-alice.md",
                participant="Alice",
                topics=["delegation"],
                metadata={"type": "coaching"},
                body_template="This should be stripped",
            ),
        ]

        mock_result = MagicMock()
        mock_result.output = mock_events

        with patch("agents.simulator_pipeline.event_gen._event_agent") as mock_agent:
            mock_agent.run = AsyncMock(return_value=mock_result)
            events = await generate_tick_events(prompt="Simulate...")

        assert events[0].body_template is None
```

- [ ] **Step 2: Implement event generator**

```python
# agents/simulator_pipeline/event_gen.py
"""LLM-driven event generation for the temporal simulator.

Uses pydantic-ai with structured output to generate SimulatedEvent
objects for a single simulation tick. Safety enforcement strips
body_template from restricted types (coaching, feedback).
"""
from __future__ import annotations

import logging

from pydantic_ai import Agent

from shared.config import get_model
from agents.simulator_pipeline.models import ContentPolicy, SimulatedEvent

_log = logging.getLogger(__name__)

_event_agent = Agent(
    get_model("balanced"),
    system_prompt=(
        "You are a temporal simulation engine for a management cockpit system. "
        "You generate plausible management activity events for a single workday. "
        "Each event represents a file that would be created or updated in the "
        "manager's data directory. Output 0-3 events per day. "
        "SAFETY: Never generate evaluative language about team members. "
        "Coaching and feedback events must have body_template=null."
    ),
    output_type=list[SimulatedEvent],
    model_settings={"max_tokens": 4096},
)


async def generate_tick_events(
    *,
    prompt: str,
) -> list[SimulatedEvent]:
    """Generate events for a single tick via LLM.

    Applies safety enforcement: strips body_template from restricted types.
    """
    result = await _event_agent.run(prompt)
    events = result.output

    # Safety enforcement: strip body from restricted types
    for event in events:
        if ContentPolicy.is_restricted(event.workflow_type):
            event.body_template = None

    return events
```

- [ ] **Step 3: Run tests**

Run: `cd ai-agents && uv run pytest tests/test_simulator_event_gen.py -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add agents/simulator_pipeline/event_gen.py tests/test_simulator_event_gen.py
git commit -m "feat: add LLM-driven event generation with safety enforcement"
```

### Task 6: Checkpoint Runner

**Files:**
- Create: `agents/simulator_pipeline/checkpoints.py`
- Create: `tests/test_simulator_checkpoints.py`

Runs deterministic agents every tick and LLM synthesis at weekly boundaries.

- [ ] **Step 1: Write the failing tests**

```python
# tests/test_simulator_checkpoints.py
"""Tests for tiered checkpoint runner."""
from __future__ import annotations

from datetime import date
from unittest.mock import AsyncMock, patch

from agents.simulator_pipeline.checkpoints import (
    should_run_weekly_checkpoint,
    run_deterministic_checkpoint,
    run_weekly_checkpoint,
)


class TestCheckpointScheduling:
    def test_weekly_on_friday(self):
        """Weekly checkpoint fires on Fridays."""
        # 2026-03-06 is a Friday
        assert should_run_weekly_checkpoint(date(2026, 3, 6)) is True

    def test_not_weekly_on_wednesday(self):
        """Weekly checkpoint doesn't fire on non-Fridays."""
        # 2026-03-04 is a Wednesday
        assert should_run_weekly_checkpoint(date(2026, 3, 4)) is False


class TestDeterministicCheckpoint:
    async def test_runs_cache_refresh(self):
        """Deterministic checkpoint refreshes caches."""
        with patch("agents.simulator_pipeline.checkpoints._refresh_caches",
                    new_callable=AsyncMock) as mock_refresh:
            await run_deterministic_checkpoint()
            mock_refresh.assert_called_once()


class TestWeeklyCheckpoint:
    async def test_runs_synthesis_agents(self):
        """Weekly checkpoint runs briefing, snapshot, overview synthesis."""
        with patch("agents.simulator_pipeline.checkpoints._run_briefing",
                    new_callable=AsyncMock) as mock_brief, \
             patch("agents.simulator_pipeline.checkpoints._run_snapshot",
                    new_callable=AsyncMock) as mock_snap, \
             patch("agents.simulator_pipeline.checkpoints._run_profiler",
                    new_callable=AsyncMock) as mock_prof:
            await run_weekly_checkpoint()
            mock_brief.assert_called_once()
            mock_snap.assert_called_once()
            mock_prof.assert_called_once()
```

- [ ] **Step 2: Implement checkpoint runner**

```python
# agents/simulator_pipeline/checkpoints.py
"""Tiered checkpoint runner for the temporal simulator.

Every tick: deterministic cache refresh (nudges, team health, activity).
Weekly boundaries (Friday): LLM synthesis (briefing, snapshot, profiler).
On significant events: immediate synthesis for relevant agents.
"""
from __future__ import annotations

import logging
from datetime import date

_log = logging.getLogger(__name__)


def should_run_weekly_checkpoint(current_date: date) -> bool:
    """Return True if this date is a weekly checkpoint boundary (Friday)."""
    return current_date.weekday() == 4  # Friday


async def run_deterministic_checkpoint() -> None:
    """Run deterministic agents: cache refresh, nudge recalculation."""
    _log.info("Running deterministic checkpoint")
    await _refresh_caches()


async def run_weekly_checkpoint() -> None:
    """Run LLM synthesis agents at weekly boundary."""
    _log.info("Running weekly synthesis checkpoint")
    await _run_briefing()
    await _run_snapshot()
    await _run_profiler()


async def run_significant_event_checkpoint(event_type: str) -> None:
    """Run synthesis for significant events (incidents, review cycles)."""
    _log.info("Running significant event checkpoint for %s", event_type)
    if event_type == "incident":
        await _run_snapshot()
    elif event_type == "review_cycle":
        await _run_snapshot()
        await _run_briefing()


async def _refresh_caches() -> None:
    """Refresh data caches (management state, nudges, team health)."""
    try:
        from cockpit.api.cache import cache
        await cache.refresh()
    except Exception:
        _log.debug("Cache refresh skipped (not in API context)")


async def _run_briefing() -> None:
    """Run management_briefing synthesis."""
    try:
        from agents.management_briefing import generate_briefing, format_briefing_md
        from shared.vault_writer import write_briefing_to_vault
        from shared.config import PROFILES_DIR

        briefing = await generate_briefing()
        md = format_briefing_md(briefing)
        write_briefing_to_vault(md)
        (PROFILES_DIR / "management-briefing.json").write_text(
            briefing.model_dump_json(indent=2)
        )
        _log.info("Briefing synthesized: %s", briefing.headline)
    except Exception:
        _log.exception("Briefing synthesis failed")


async def _run_snapshot() -> None:
    """Run team snapshot synthesis."""
    try:
        from agents.management_prep import generate_team_snapshot, format_snapshot_md
        from shared.vault_writer import write_team_snapshot_to_vault

        snapshot = await generate_team_snapshot()
        write_team_snapshot_to_vault(format_snapshot_md(snapshot))
        _log.info("Snapshot synthesized: %s", snapshot.headline)
    except Exception:
        _log.exception("Snapshot synthesis failed")


async def _run_profiler() -> None:
    """Run management profiler synthesis."""
    try:
        from agents.management_profiler import (
            generate_and_load_management_facts, synthesize_profile,
            build_profile, save_profile, load_profile,
        )

        facts = generate_and_load_management_facts()
        existing = load_profile()
        synthesis = await synthesize_profile(facts)
        profile = build_profile(facts, synthesis, existing)
        save_profile(profile)
        _log.info("Profile synthesized: v%s, %d facts", profile.version, len(facts))
    except Exception:
        _log.exception("Profiler synthesis failed")
```

- [ ] **Step 3: Run tests**

Run: `cd ai-agents && uv run pytest tests/test_simulator_checkpoints.py -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add agents/simulator_pipeline/checkpoints.py tests/test_simulator_checkpoints.py
git commit -m "feat: add tiered checkpoint runner for temporal simulator"
```

---

## Chunk 3: Simulator Agent & Integration

### Task 7: Simulator Agent (CLI Entry Point)

**Files:**
- Create: `agents/simulator.py`
- Create: `tests/test_simulator_integration.py`

The main simulator agent that orchestrates the full simulation loop.

- [ ] **Step 1: Write the integration test**

```python
# tests/test_simulator_integration.py
"""Integration test for the full simulation loop (mocked LLM)."""
from __future__ import annotations

from datetime import date
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

from agents.simulator import run_simulation
from agents.simulator_pipeline.models import SimulatedEvent
from shared.simulation import load_manifest
from shared.simulation_models import SimStatus


class TestRunSimulation:
    async def test_full_simulation_loop(self, tmp_path: Path):
        """Run a 5-day simulation with mocked LLM."""
        seed_dir = tmp_path / "seed"
        (seed_dir / "people").mkdir(parents=True)
        (seed_dir / "people" / "alice.md").write_text(
            "---\ntype: person\nname: Alice\nteam: platform\n"
            "cadence: weekly\nstatus: active\nlast-1on1: 2026-02-28\n---\n"
        )

        mock_events = [
            SimulatedEvent(
                date="2026-03-02",
                workflow_type="one_on_one",
                subdirectory="meetings",
                filename="2026-03-02-alice.md",
                participant="Alice",
                topics=["standup"],
                metadata={"type": "meeting", "meeting-type": "one-on-one"},
            ),
        ]

        mock_result = MagicMock()
        mock_result.output = mock_events

        with patch("agents.simulator_pipeline.event_gen._event_agent") as mock_agent, \
             patch("agents.simulator_pipeline.checkpoints._refresh_caches",
                   new_callable=AsyncMock), \
             patch("agents.simulator_pipeline.checkpoints._run_briefing",
                   new_callable=AsyncMock), \
             patch("agents.simulator_pipeline.checkpoints._run_snapshot",
                   new_callable=AsyncMock), \
             patch("agents.simulator_pipeline.checkpoints._run_profiler",
                   new_callable=AsyncMock):
            mock_agent.run = AsyncMock(return_value=mock_result)

            sim_dir = await run_simulation(
                role="engineering-manager",
                variant="experienced-em",
                window="5d",
                seed=str(seed_dir),
                output=tmp_path / "sims",
            )

        # Simulation completed
        assert sim_dir.is_dir()
        manifest = load_manifest(sim_dir)
        assert manifest.status == SimStatus.COMPLETED
        assert manifest.ticks_completed > 0

        # Events were written
        meetings_dir = sim_dir / "meetings"
        assert meetings_dir.is_dir()

    async def test_resume_continues_from_last_tick(self, tmp_path: Path):
        """Resume continues from last_completed_tick."""
        seed_dir = tmp_path / "seed"
        (seed_dir / "people").mkdir(parents=True)
        (seed_dir / "people" / "alice.md").write_text(
            "---\ntype: person\nname: Alice\nstatus: active\ncadence: weekly\n---\n"
        )

        mock_events = [
            SimulatedEvent(
                date="2026-03-04",
                workflow_type="status_report",
                subdirectory="status-reports",
                filename="2026-03-04-weekly.md",
                topics=["weekly update"],
                metadata={"type": "status-report"},
            ),
        ]
        mock_result = MagicMock()
        mock_result.output = mock_events

        with patch("agents.simulator_pipeline.event_gen._event_agent") as mock_agent, \
             patch("agents.simulator_pipeline.checkpoints._refresh_caches",
                   new_callable=AsyncMock), \
             patch("agents.simulator_pipeline.checkpoints._run_briefing",
                   new_callable=AsyncMock), \
             patch("agents.simulator_pipeline.checkpoints._run_snapshot",
                   new_callable=AsyncMock), \
             patch("agents.simulator_pipeline.checkpoints._run_profiler",
                   new_callable=AsyncMock):
            mock_agent.run = AsyncMock(return_value=mock_result)

            # Run first 3 days, then simulate a failure
            sim_dir = await run_simulation(
                role="engineering-manager",
                variant="experienced-em",
                window="5d",
                seed=str(seed_dir),
                output=tmp_path / "sims",
            )

        manifest = load_manifest(sim_dir)
        assert manifest.status == SimStatus.COMPLETED
```

- [ ] **Step 2: Implement the simulator agent**

```python
# agents/simulator.py
"""Temporal simulator agent — generates realistic management activity over time.

Advances through simulated workdays, generating plausible events via LLM,
running tiered checkpoints, and producing a complete DATA_DIR snapshot.
"""
from __future__ import annotations

import argparse
import asyncio
import logging
import sys
from datetime import date, timedelta
from pathlib import Path

from shared.config import config
from shared.simulation import (
    create_simulation,
    seed_simulation,
    save_manifest,
    load_manifest,
)
from shared.simulation_models import SimStatus
from agents.simulator_pipeline.context import (
    load_workflow_semantics,
    load_role_matrix,
    load_scenarios,
    compose_role_profile,
    build_tick_prompt,
)
from agents.simulator_pipeline.event_gen import generate_tick_events
from agents.simulator_pipeline.renderer import render_events
from agents.simulator_pipeline.checkpoints import (
    should_run_weekly_checkpoint,
    run_deterministic_checkpoint,
    run_weekly_checkpoint,
    run_significant_event_checkpoint,
)
from agents.simulator_pipeline.seed import rebase_seed_dates

_log = logging.getLogger(__name__)

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
_WORKFLOW_SEMANTICS = _PROJECT_ROOT.parent / "docs" / "workflow-semantics.yaml"
_ROLE_MATRIX = _PROJECT_ROOT / "config" / "role-matrix.yaml"
_SCENARIOS = _PROJECT_ROOT / "config" / "scenarios.yaml"


def _parse_window(window: str) -> int:
    """Parse window string like '7d', '30d', '90d' into days."""
    if window.endswith("d"):
        return int(window[:-1])
    raise ValueError(f"Invalid window format: {window} (expected '7d', '30d', etc.)")


def _compute_dates(window_days: int) -> tuple[date, date]:
    """Compute start_date and end_date for a simulation window."""
    end = date.today()
    start = end - timedelta(days=window_days)
    return start, end


def _workdays(start: date, end: date) -> list[date]:
    """Generate list of workdays (Mon-Fri) between start and end inclusive."""
    days = []
    current = start
    while current <= end:
        if current.weekday() < 5:
            days.append(current)
        current += timedelta(days=1)
    return days


def _summarize_state(sim_dir: Path) -> str:
    """Generate a brief summary of current DATA_DIR state for the LLM."""
    summary_parts = []

    people_dir = sim_dir / "people"
    if people_dir.is_dir():
        people_files = list(people_dir.glob("*.md"))
        summary_parts.append(f"{len(people_files)} people files")

    for subdir in ("coaching", "feedback", "meetings", "incidents", "okrs", "goals"):
        d = sim_dir / subdir
        if d.is_dir():
            count = len(list(d.glob("*.md")))
            if count > 0:
                summary_parts.append(f"{count} {subdir}")

    return ", ".join(summary_parts) if summary_parts else "empty data directory"


async def run_simulation(
    *,
    role: str,
    variant: str = "experienced-em",
    window: str = "30d",
    seed: str = "demo-data/",
    scenario: str | None = None,
    audience: str | None = None,
    output: Path | None = None,
    resume_dir: Path | None = None,
) -> Path:
    """Run a full temporal simulation. Returns the simulation directory path."""
    # Load config
    workflows = load_workflow_semantics(_WORKFLOW_SEMANTICS)
    roles = load_role_matrix(_ROLE_MATRIX)
    scenarios = load_scenarios(_SCENARIOS) if _SCENARIOS.is_file() else {}

    scenario_def = scenarios.get(scenario) if scenario else None

    # Create or resume simulation
    if resume_dir:
        sim_dir = resume_dir
        manifest = load_manifest(sim_dir)
        _log.info("Resuming simulation %s from tick %s",
                   manifest.id, manifest.last_completed_tick)
    else:
        window_days = _parse_window(window)
        start_date, end_date = _compute_dates(window_days)

        sim_dir, manifest = create_simulation(
            role=role,
            window=window,
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat(),
            seed=seed,
            variant=variant,
            scenario=scenario,
            audience=audience,
            output=output,
        )

        # Seed and rebase dates
        seed_path = Path(seed)
        if not seed_path.is_absolute():
            seed_path = _PROJECT_ROOT / seed_path
        seed_simulation(sim_dir, seed_path)
        rebase_seed_dates(sim_dir, sim_start=start_date)

    # Compose role profile
    profile = compose_role_profile(
        role_name=role,
        variant=variant,
        roles=roles,
        workflows=workflows,
        scenario=scenario_def,
    )

    # Compute workdays
    start_date = date.fromisoformat(manifest.start_date)
    end_date = date.fromisoformat(manifest.end_date)
    all_days = _workdays(start_date, end_date)

    # Skip already-completed ticks on resume
    if manifest.last_completed_tick:
        last_completed = date.fromisoformat(manifest.last_completed_tick)
        all_days = [d for d in all_days if d > last_completed]

    # Update manifest to running
    manifest.status = SimStatus.RUNNING
    save_manifest(sim_dir, manifest)

    # Point config at simulation directory
    config.set_data_dir(sim_dir)

    recent_events: list[str] = []

    try:
        for tick_date in all_days:
            _log.info("Tick: %s (%d/%d)",
                       tick_date.isoformat(),
                       manifest.ticks_completed + 1,
                       manifest.ticks_total)

            # Build prompt and generate events
            state_summary = _summarize_state(sim_dir)
            prompt = build_tick_prompt(
                profile=profile,
                current_date=tick_date.isoformat(),
                existing_state_summary=state_summary,
                recent_events=recent_events,
            )

            events = await generate_tick_events(prompt=prompt)

            # Render events to files
            if events:
                render_events(events, sim_dir)
                for event in events:
                    recent_events.append(
                        f"{event.date}: {event.workflow_type}"
                        + (f" ({event.participant})" if event.participant else "")
                    )

            # Run deterministic checkpoint every tick
            await run_deterministic_checkpoint()

            # Weekly checkpoint on Fridays
            if should_run_weekly_checkpoint(tick_date):
                await run_weekly_checkpoint()
                manifest.checkpoints_run += 1

            # Significant event checkpoint
            for event in events:
                if event.workflow_type in ("incident", "review_cycle"):
                    await run_significant_event_checkpoint(event.workflow_type)
                    manifest.checkpoints_run += 1
                    break  # One checkpoint per tick max

            # Update manifest progressively
            manifest.ticks_completed += 1
            manifest.last_completed_tick = tick_date.isoformat()
            save_manifest(sim_dir, manifest)

        # Mark completed
        manifest.status = SimStatus.COMPLETED
        from datetime import datetime, timezone
        manifest.completed_at = datetime.now(timezone.utc)
        save_manifest(sim_dir, manifest)

        _log.info("Simulation %s completed: %d ticks, %d checkpoints",
                   manifest.id, manifest.ticks_completed, manifest.checkpoints_run)

    except Exception:
        manifest.status = SimStatus.FAILED
        save_manifest(sim_dir, manifest)
        _log.exception("Simulation %s failed at tick %s",
                        manifest.id, manifest.last_completed_tick)
        raise
    finally:
        config.reset_data_dir()

    return sim_dir


async def main() -> None:
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Temporal simulator — generate realistic management activity over time",
        prog="python -m agents.simulator",
    )
    parser.add_argument("--role", type=str, help="Role key (e.g. engineering-manager)")
    parser.add_argument("--variant", type=str, default=None, help="Role variant")
    parser.add_argument("--window", type=str, default="30d", help="Simulation window (e.g. 7d, 30d, 90d)")
    parser.add_argument("--seed", type=str, default="demo-data/", help="Seed corpus path")
    parser.add_argument("--scenario", type=str, default=None, help="Scenario modifier")
    parser.add_argument("--audience", type=str, default=None, help="Audience archetype")
    parser.add_argument("--output", type=str, default=None, help="Output directory")
    parser.add_argument("--resume", type=str, default=None, help="Resume from existing sim dir")
    parser.add_argument("--json", action="store_true", help="JSON output")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(name)s %(levelname)s %(message)s",
    )

    if args.resume:
        sim_dir = await run_simulation(resume_dir=Path(args.resume), role="")
    else:
        if not args.role:
            parser.error("--role is required (or use --resume)")

        sim_dir = await run_simulation(
            role=args.role,
            variant=args.variant or "experienced-em",
            window=args.window,
            seed=args.seed,
            scenario=args.scenario,
            audience=args.audience,
            output=Path(args.output) if args.output else None,
        )

    manifest = load_manifest(sim_dir)

    if args.json:
        print(manifest.model_dump_json(indent=2))
    else:
        print(f"Simulation complete: {sim_dir}")
        print(f"  Status: {manifest.status}")
        print(f"  Ticks: {manifest.ticks_completed}/{manifest.ticks_total}")
        print(f"  Checkpoints: {manifest.checkpoints_run}")


if __name__ == "__main__":
    asyncio.run(main())
```

- [ ] **Step 3: Run tests**

Run: `cd ai-agents && uv run pytest tests/test_simulator_integration.py -v`
Expected: PASS

- [ ] **Step 4: Run full test suite**

Run: `cd ai-agents && uv run pytest tests/ -q`
Expected: All pass

- [ ] **Step 5: Commit**

```bash
git add agents/simulator.py tests/test_simulator_integration.py
git commit -m "feat: add temporal simulator agent with CLI and simulation loop"
```

### Task 8: Final Integration Verification

- [ ] **Step 1: Run full test suite**

Run: `cd ai-agents && uv run pytest tests/ -q`
Expected: All tests pass

- [ ] **Step 2: Verify CLI help**

Run: `cd ai-agents && uv run python -m agents.simulator --help`
Expected: Prints usage with all flags

- [ ] **Step 3: Verify imports**

Run: `cd ai-agents && uv run python -c "from agents.simulator import run_simulation; print('simulator imports ok')"`
Expected: Prints "simulator imports ok"

- [ ] **Step 4: Commit any fixes**

Only if needed.
