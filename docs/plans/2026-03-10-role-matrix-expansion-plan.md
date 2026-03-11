# Role Matrix Expansion Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add tech-lead and vp-engineering roles to the temporal simulator with org-level dossier support, three-layer cadence composition with guardrails, role inference from natural language, and post-simulation distribution validation.

**Architecture:** New YAML config files define roles and org context. `context.py` gains org loading, role inference, and three-layer modifier composition with clamping. `simulator.py` wires org dossier loading and distribution validation. `demo.py` wires role inference into `--simulate`.

**Tech Stack:** Python 3.12+, YAML config, pydantic-ai, pytest with unittest.mock

**Spec:** `docs/specs/2026-03-10-role-matrix-expansion-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `config/role-matrix.yaml` | Modify | Add tech-lead, vp-engineering roles with reference distributions; add reference distribution to engineering-manager |
| `config/org-dossier.yaml` | Create | Org-level context: company stage, headcount, strategic priorities, stage modifiers |
| `agents/simulator_pipeline/context.py` | Modify | Add `load_org_dossier()`, `infer_role()`, `ROLE_HINTS`, `validate_distribution()`, three-layer composition with clamping in `compose_role_profile()`, org context in `build_tick_prompt()` |
| `agents/simulator.py` | Modify | Add `org_dossier` parameter, load org dossier, pass to `compose_role_profile()`, track `all_events`, call `validate_distribution()` post-simulation, add `--org-dossier` CLI flag |
| `agents/demo.py` | Modify | Wire `infer_role()` into `_run_simulated_demo()`, add `--role` and `--org-dossier` CLI flags |
| `tests/test_simulator_context.py` | Modify | Tests for org loading, role inference, three-layer composition, clamping, distribution validation, org context in prompt |
| `tests/test_simulator_integration.py` | Modify | Tests for simulator wiring (org loading, distribution validation) |
| `tests/test_demo_simulate.py` | Modify | Tests for role inference in simulate flow |

---

## Chunk 1: Config and Context

### Task 1: Add New Roles and Reference Distributions to role-matrix.yaml

**Files:**
- Modify: `config/role-matrix.yaml`

- [ ] **Step 1: Add tech-lead role definition**

Add after the `engineering-manager` block in `config/role-matrix.yaml`:

```yaml
  tech-lead:
    description: "Technical leader — architecture decisions, incident response, technical mentorship"
    variants:
      baseline:
        description: "Steady-state tech lead — balances technical and people work"
        cadence_modifiers:
          decision: 2.0
          incident: 1.5
          postmortem_action: 1.5
          coaching_note: 1.5
          status_report: 0.5
          okr_update: 0.5
          review_cycle: 0.5
    workflows:
      - one_on_one
      - coaching_note
      - feedback
      - okr_update
      - goal
      - incident
      - postmortem_action
      - review_cycle
      - status_report
      - decision
    reference_distribution_30d:
      decision: [3, 8]
      incident: [0, 3]
      postmortem_action: [0, 4]
      coaching_note: [1, 5]
      one_on_one: [3, 8]
      feedback: [0, 3]
      okr_update: [0, 2]
      goal: [0, 2]
      review_cycle: [0, 1]
      status_report: [0, 2]
```

- [ ] **Step 2: Add vp-engineering role definition**

Add after the `tech-lead` block:

```yaml
  vp-engineering:
    description: "VP/Director — strategic oversight, upward reporting, org-level decisions"
    variants:
      baseline:
        description: "Steady-state VP — operates through EMs, focuses on strategy and reporting"
        cadence_modifiers:
          status_report: 2.5
          okr_update: 2.0
          decision: 2.0
          one_on_one: 0.5
          coaching_note: 0.3
          feedback: 0.3
          incident: 0.7
    workflows:
      - one_on_one
      - coaching_note
      - feedback
      - okr_update
      - goal
      - incident
      - postmortem_action
      - review_cycle
      - status_report
      - decision
    reference_distribution_30d:
      status_report: [4, 10]
      okr_update: [3, 7]
      decision: [3, 8]
      one_on_one: [2, 6]
      coaching_note: [0, 2]
      feedback: [0, 2]
      incident: [0, 2]
      postmortem_action: [0, 2]
      review_cycle: [0, 2]
      goal: [0, 3]
```

- [ ] **Step 3: Add reference distribution to existing engineering-manager role**

Add under the `engineering-manager` block, after the `workflows:` list (after line 38):

```yaml
    reference_distribution_30d:
      one_on_one: [6, 16]
      coaching_note: [2, 6]
      feedback: [1, 5]
      okr_update: [1, 4]
      goal: [0, 3]
      incident: [0, 2]
      postmortem_action: [0, 3]
      review_cycle: [0, 2]
      status_report: [1, 4]
      decision: [1, 4]
```

- [ ] **Step 4: Verify YAML is valid**

Run: `cd ai-agents && uv run python -c "import yaml; r = yaml.safe_load(open('config/role-matrix.yaml'))['roles']; print(list(r.keys())); print('ref_dists:', all('reference_distribution_30d' in r[k] for k in r))"`
Expected: `['engineering-manager', 'tech-lead', 'vp-engineering']` and `ref_dists: True`

- [ ] **Step 5: Commit**

```bash
git add config/role-matrix.yaml
git commit -m "feat: add tech-lead and vp-engineering roles to role matrix"
```

---

### Task 2: Create org-dossier.yaml

**Files:**
- Create: `config/org-dossier.yaml`

- [ ] **Step 1: Create the org-dossier.yaml file**

Create `config/org-dossier.yaml`:

```yaml
# config/org-dossier.yaml
# Org-level context for the temporal simulator.
# Provides company stage, strategic priorities, and stage-specific cadence modifiers.
# The simulator uses this to:
#   1. Adjust event frequency via stage_modifiers (third multiplier layer)
#   2. Inject strategic context into LLM prompts (event content/themes)

org:
  company_stage: growth        # startup | growth | enterprise
  headcount_band: 50-200
  team_count: 3
  industry: technology

  strategic_context:
    - "Scaling platform reliability after rapid growth"
    - "Preparing for SOC2 certification"

  # Org-stage cadence modifiers — applied as a third multiplier layer
  # effective = role_variant × scenario × org_stage
  stage_modifiers:
    startup:
      one_on_one: 1.3
      status_report: 0.5
      decision: 1.5
      okr_update: 0.7
      incident: 1.3
    growth: {}
    enterprise:
      status_report: 1.8
      decision: 0.7
      one_on_one: 0.8
      review_cycle: 1.3
```

- [ ] **Step 2: Verify YAML is valid**

Run: `cd ai-agents && uv run python -c "import yaml; d = yaml.safe_load(open('config/org-dossier.yaml')); print(d['org']['company_stage'], len(d['org']['stage_modifiers']))"`
Expected: `growth 3`

- [ ] **Step 3: Commit**

```bash
git add config/org-dossier.yaml
git commit -m "feat: add org-level dossier config for temporal simulator"
```

---

### Task 3: Add org dossier loading, role inference, distribution validation, and three-layer composition to context.py

This is the core logic task. Adds four capabilities to `agents/simulator_pipeline/context.py`:
1. `load_org_dossier()` — loads `org-dossier.yaml`
2. `ROLE_HINTS` + `infer_role()` — keyword-based role inference from natural language
3. Three-layer modifier composition with clamping in `compose_role_profile()`
4. `validate_distribution()` — post-simulation event count validation

Also updates `build_tick_prompt()` to use `effective_weight` and include org context.

**Prerequisite:** Tasks 1 and 2 must be completed first (config files needed by tests).

**Files:**
- Modify: `agents/simulator_pipeline/context.py`
- Test: `tests/test_simulator_context.py`

- [ ] **Step 1: Write tests for `load_org_dossier()`**

Add to `tests/test_simulator_context.py`. Add `load_org_dossier` to the existing import from `agents.simulator_pipeline.context` (line 7-13). Add a fixture path constant after `_SCENARIOS` (line 19):

```python
_ORG_DOSSIER = _FIXTURES / "config" / "org-dossier.yaml"
```

Add this test class after `TestLoadConfig`:

```python
class TestLoadOrgDossier:
    def test_load_org_dossier(self):
        """Loads org-dossier.yaml and returns org dict."""
        org = load_org_dossier(_ORG_DOSSIER)
        assert org["company_stage"] == "growth"
        assert "startup" in org["stage_modifiers"]
        assert "enterprise" in org["stage_modifiers"]

    def test_org_dossier_has_strategic_context(self):
        """Org dossier includes strategic context list."""
        org = load_org_dossier(_ORG_DOSSIER)
        assert isinstance(org["strategic_context"], list)
        assert len(org["strategic_context"]) > 0
```

- [ ] **Step 2: Write tests for `infer_role()`**

Add `infer_role` to the import from `agents.simulator_pipeline.context`. Add this test class:

```python
class TestInferRole:
    def test_explicit_role_overrides_hints(self):
        """Explicit --role always wins."""
        assert infer_role("show me a VP demo", explicit_role="tech-lead") == "tech-lead"

    def test_infers_tech_lead(self):
        """Recognizes tech lead keywords."""
        assert infer_role("demo for a tech lead") == "tech-lead"
        assert infer_role("show me the architect view") == "tech-lead"
        assert infer_role("staff engineer perspective") == "tech-lead"

    def test_infers_vp(self):
        """Recognizes VP/director keywords."""
        assert infer_role("demo for the VP of engineering") == "vp-engineering"
        assert infer_role("show my director") == "vp-engineering"
        assert infer_role("head of engineering review") == "vp-engineering"

    def test_infers_em(self):
        """Recognizes engineering manager keywords."""
        assert infer_role("engineering manager cockpit") == "engineering-manager"

    def test_defaults_to_em(self):
        """Falls back to engineering-manager when no hints match."""
        assert infer_role("show me the system") == "engineering-manager"

    def test_longest_match_wins(self):
        """'engineering director' matches vp-engineering, not engineering-manager."""
        assert infer_role("engineering director overview") == "vp-engineering"

    def test_case_insensitive(self):
        """Matching is case-insensitive."""
        assert infer_role("TECH LEAD demo") == "tech-lead"
        assert infer_role("VP of Engineering") == "vp-engineering"
```

Note: Short hints like "em" are excluded from ROLE_HINTS to avoid false positives on common words ("system", "them", "demo"). The default fallback to "engineering-manager" handles this case.

- [ ] **Step 3: Write tests for three-layer composition with clamping**

Add this test class:

```python
class TestThreeLayerComposition:
    def test_org_stage_modifiers_applied(self):
        """Org stage modifiers are multiplied into effective weight."""
        workflows = load_workflow_semantics(_WORKFLOW_SEMANTICS)
        roles = load_role_matrix(_ROLE_MATRIX)
        org = load_org_dossier(_ORG_DOSSIER)
        org["company_stage"] = "startup"

        profile = compose_role_profile(
            role_name="engineering-manager",
            variant="experienced-em",
            roles=roles,
            workflows=workflows,
            org=org,
        )
        # experienced-em has no role modifiers (all 1.0)
        # startup has decision: 1.5
        decision_wf = next(w for w in profile["workflows"] if w["name"] == "decision")
        assert decision_wf["effective_weight"] == 1.5

    def test_three_layer_multiplication(self):
        """role x scenario x org all multiply together."""
        workflows = load_workflow_semantics(_WORKFLOW_SEMANTICS)
        roles = load_role_matrix(_ROLE_MATRIX)
        scenarios = load_scenarios(_SCENARIOS)
        org = load_org_dossier(_ORG_DOSSIER)
        org["company_stage"] = "startup"

        # senior-em has decision: 1.5, startup has decision: 1.5
        # pre-quarterly does NOT override decision (only okr_update, status_report, goal)
        profile = compose_role_profile(
            role_name="engineering-manager",
            variant="senior-em",
            roles=roles,
            workflows=workflows,
            scenario=scenarios["pre-quarterly"],
            org=org,
        )
        decision_wf = next(w for w in profile["workflows"] if w["name"] == "decision")
        # 1.5 (role) x 1.0 (scenario) x 1.5 (org) = 2.25
        assert abs(decision_wf["effective_weight"] - 2.25) < 0.01

    def test_clamping_at_ceiling(self):
        """Effective weight is clamped at 5.0."""
        workflows = load_workflow_semantics(_WORKFLOW_SEMANTICS)
        roles = load_role_matrix(_ROLE_MATRIX)
        org = load_org_dossier(_ORG_DOSSIER)
        org["company_stage"] = "startup"
        # Fabricate extreme modifier to trigger ceiling
        org["stage_modifiers"]["startup"]["status_report"] = 10.0

        profile = compose_role_profile(
            role_name="vp-engineering",
            variant="baseline",
            roles=roles,
            workflows=workflows,
            org=org,
        )
        status_wf = next(w for w in profile["workflows"] if w["name"] == "status_report")
        # 2.5 x 1.0 x 10.0 = 25.0 -> clamped to 5.0
        assert status_wf["effective_weight"] == 5.0

    def test_clamping_at_floor(self):
        """Effective weight is clamped at 0.1."""
        workflows = load_workflow_semantics(_WORKFLOW_SEMANTICS)
        roles = load_role_matrix(_ROLE_MATRIX)
        org = load_org_dossier(_ORG_DOSSIER)
        org["company_stage"] = "startup"
        org["stage_modifiers"]["startup"]["coaching_note"] = 0.01

        profile = compose_role_profile(
            role_name="vp-engineering",
            variant="baseline",
            roles=roles,
            workflows=workflows,
            org=org,
        )
        coaching_wf = next(w for w in profile["workflows"] if w["name"] == "coaching_note")
        # 0.3 x 1.0 x 0.01 = 0.003 -> clamped to 0.1
        assert coaching_wf["effective_weight"] == 0.1

    def test_no_org_uses_baseline(self):
        """When org is None, effective_weight equals role modifier only."""
        workflows = load_workflow_semantics(_WORKFLOW_SEMANTICS)
        roles = load_role_matrix(_ROLE_MATRIX)

        profile = compose_role_profile(
            role_name="engineering-manager",
            variant="new-em",
            roles=roles,
            workflows=workflows,
        )
        one_on_one_wf = next(w for w in profile["workflows"] if w["name"] == "one_on_one")
        assert one_on_one_wf["effective_weight"] == 1.5

    def test_org_context_in_profile(self):
        """Org context (stage, headcount, strategic_context) is stored in profile."""
        workflows = load_workflow_semantics(_WORKFLOW_SEMANTICS)
        roles = load_role_matrix(_ROLE_MATRIX)
        org = load_org_dossier(_ORG_DOSSIER)

        profile = compose_role_profile(
            role_name="engineering-manager",
            variant="experienced-em",
            roles=roles,
            workflows=workflows,
            org=org,
        )
        assert profile["org_context"]["company_stage"] == "growth"
        assert "strategic_context" in profile["org_context"]
```

- [ ] **Step 4: Write tests for `validate_distribution()`**

Add `validate_distribution` to the import from `agents.simulator_pipeline.context`. Add this import and test class:

```python
from agents.simulator_pipeline.models import SimulatedEvent


class TestValidateDistribution:
    def _make_event(self, workflow_type: str) -> SimulatedEvent:
        return SimulatedEvent(
            date="2026-03-01",
            workflow_type=workflow_type,
            subdirectory="test/",
            filename="test.md",
        )

    def test_within_range_no_warnings(self):
        """Events within reference range produce no warnings."""
        events = [self._make_event("decision")] * 5
        reference = {"decision": [3, 8]}
        warnings = validate_distribution(events, reference, window_days=30)
        assert warnings == []

    def test_below_range_produces_warning(self):
        """Too few events of a type produces a warning."""
        events = [self._make_event("decision")] * 1
        reference = {"decision": [3, 8]}
        warnings = validate_distribution(events, reference, window_days=30)
        assert len(warnings) == 1
        assert "decision" in warnings[0]

    def test_above_range_produces_warning(self):
        """Too many events of a type produces a warning."""
        events = [self._make_event("decision")] * 15
        reference = {"decision": [3, 8]}
        warnings = validate_distribution(events, reference, window_days=30)
        assert len(warnings) == 1
        assert "decision" in warnings[0]

    def test_scales_with_window(self):
        """Reference ranges scale proportionally with simulation window."""
        # 60-day window doubles the expected range [3,8] -> [6,16]
        events = [self._make_event("decision")] * 10
        reference = {"decision": [3, 8]}
        warnings = validate_distribution(events, reference, window_days=60)
        assert warnings == []

    def test_missing_type_below_minimum(self):
        """A type with 0 events but minimum > 0 produces a warning."""
        events: list[SimulatedEvent] = []
        reference = {"one_on_one": [6, 16]}
        warnings = validate_distribution(events, reference, window_days=30)
        assert len(warnings) == 1
        assert "one_on_one" in warnings[0]

    def test_missing_type_with_zero_minimum(self):
        """A type with 0 events and minimum 0 produces no warning."""
        events: list[SimulatedEvent] = []
        reference = {"incident": [0, 2]}
        warnings = validate_distribution(events, reference, window_days=30)
        assert warnings == []
```

- [ ] **Step 5: Write tests for org context and effective_weight in tick prompt**

Add to the existing `TestBuildTickPrompt` class:

```python
    def test_prompt_includes_org_context(self):
        """Tick prompt includes org context when present in profile."""
        workflows = load_workflow_semantics(_WORKFLOW_SEMANTICS)
        roles = load_role_matrix(_ROLE_MATRIX)
        org = load_org_dossier(_ORG_DOSSIER)

        profile = compose_role_profile(
            role_name="engineering-manager",
            variant="experienced-em",
            roles=roles,
            workflows=workflows,
            org=org,
        )

        prompt = build_tick_prompt(
            profile=profile,
            current_date="2026-03-05",
            existing_state_summary="state",
        )
        assert "growth" in prompt.lower()
        assert "SOC2" in prompt

    def test_prompt_uses_effective_weight(self):
        """Tick prompt shows effective_weight, not raw modifiers."""
        workflows = load_workflow_semantics(_WORKFLOW_SEMANTICS)
        roles = load_role_matrix(_ROLE_MATRIX)
        org = load_org_dossier(_ORG_DOSSIER)
        org["company_stage"] = "startup"

        profile = compose_role_profile(
            role_name="engineering-manager",
            variant="senior-em",
            roles=roles,
            workflows=workflows,
            org=org,
        )

        prompt = build_tick_prompt(
            profile=profile,
            current_date="2026-03-05",
            existing_state_summary="state",
        )
        # senior-em decision: 1.5, startup decision: 1.5 -> effective 2.25
        # Formatted as f"{effective:.1f}x" -> "2.2x" (banker's rounding)
        # Verify the decision line contains the three-layer result, not 1.5
        decision_line = [l for l in prompt.split("\n") if "decision:" in l.lower()][0]
        assert "1.5x" not in decision_line  # NOT the raw role modifier
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `cd ai-agents && uv run pytest tests/test_simulator_context.py -v --tb=short 2>&1 | tail -30`
Expected: Failures for `load_org_dossier`, `infer_role`, `validate_distribution`, `effective_weight`, and `org_context` — all the new functions and fields that don't exist yet.

- [ ] **Step 7: Implement `load_org_dossier()` in context.py**

Add after `load_scenarios()` (after line 33 of `agents/simulator_pipeline/context.py`):

```python
def load_org_dossier(path: Path) -> dict[str, Any]:
    """Load org-dossier.yaml. Returns the org dict."""
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    return data["org"]
```

- [ ] **Step 8: Implement `ROLE_HINTS` and `infer_role()` in context.py**

Add after `load_org_dossier()`. Note: short hints like "em", "tl" are excluded to avoid false positives on common substrings ("system", "them", "bottle"). The default fallback to "engineering-manager" handles the EM case.

```python
ROLE_HINTS: dict[str, str] = {
    # tech-lead signals (multi-word to avoid false positives)
    "tech lead": "tech-lead",
    "technical lead": "tech-lead",
    "architect": "tech-lead",
    "principal": "tech-lead",
    "staff engineer": "tech-lead",
    # vp signals
    "vice president": "vp-engineering",
    "head of engineering": "vp-engineering",
    "engineering director": "vp-engineering",
    "director": "vp-engineering",
    "vp": "vp-engineering",
    # engineering-manager signals
    "engineering manager": "engineering-manager",
    "manager": "engineering-manager",
}


def infer_role(request: str, explicit_role: str | None = None) -> str:
    """Infer role from natural language request, or use explicit override.

    Uses longest-match-first to prevent partial matches
    (e.g. 'engineering director' matches before 'director').
    Defaults to 'engineering-manager' if no hints match.
    """
    if explicit_role:
        return explicit_role
    request_lower = request.lower()
    for hint in sorted(ROLE_HINTS, key=len, reverse=True):
        if hint in request_lower:
            return ROLE_HINTS[hint]
    return "engineering-manager"
```

- [ ] **Step 9: Replace `compose_role_profile()` for three-layer composition**

Replace the existing `compose_role_profile()` function (lines 35-73 of `agents/simulator_pipeline/context.py`) and add the clamp constants before it. The old function starts with `def compose_role_profile(` and ends with `return profile`.

```python
# Hard clamp bounds for effective cadence modifiers
MODIFIER_FLOOR = 0.1
MODIFIER_CEILING = 5.0


def compose_role_profile(
    *,
    role_name: str,
    variant: str,
    roles: dict[str, Any],
    workflows: dict[str, Any],
    scenario: dict[str, Any] | None = None,
    org: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Compose a role profile from role matrix + variant + scenario + org dossier.

    Returns a dict with: role, variant, description, workflows (list of
    workflow dicts with semantics and effective_weight), cadence_modifiers,
    scenario_overrides, org_context.

    effective_weight = role_variant_modifier x scenario_modifier x org_stage_modifier
    Clamped to [MODIFIER_FLOOR, MODIFIER_CEILING].
    """
    role = roles[role_name]
    variant_def = role["variants"].get(variant, {})
    cadence_modifiers = variant_def.get("cadence_modifiers", {})
    scenario_overrides: dict[str, float] = {}

    if scenario:
        scenario_overrides = scenario.get("probability_overrides", {})

    # Resolve org stage modifiers
    org_stage_modifiers: dict[str, float] = {}
    if org:
        stage = org.get("company_stage", "growth")
        all_stage_mods = org.get("stage_modifiers", {})
        org_stage_modifiers = all_stage_mods.get(stage, {}) or {}

    workflow_details = []
    for wf_name in role["workflows"]:
        if wf_name in workflows:
            wf_entry = {"name": wf_name, **workflows[wf_name]}

            role_mod = cadence_modifiers.get(wf_name, 1.0)
            scenario_mod = scenario_overrides.get(wf_name, 1.0)
            org_mod = org_stage_modifiers.get(wf_name, 1.0)

            raw = role_mod * scenario_mod * org_mod
            effective = max(MODIFIER_FLOOR, min(MODIFIER_CEILING, raw))

            if effective != raw:
                _log.warning(
                    "Clamped %s modifier: %.2f -> %.2f "
                    "(role=%.1f, scenario=%.1f, org=%.1f)",
                    wf_name, raw, effective, role_mod, scenario_mod, org_mod,
                )

            wf_entry["effective_weight"] = effective
            workflow_details.append(wf_entry)

    profile: dict[str, Any] = {
        "role": role_name,
        "variant": variant,
        "description": role.get("description", ""),
        "variant_description": variant_def.get("description", ""),
        "workflows": workflow_details,
        "cadence_modifiers": cadence_modifiers,
        "scenario_overrides": scenario_overrides,
    }

    if scenario:
        profile["scenario_description"] = scenario.get("description", "")

    if org:
        profile["org_context"] = {
            "company_stage": org.get("company_stage", "growth"),
            "headcount_band": org.get("headcount_band"),
            "team_count": org.get("team_count"),
            "industry": org.get("industry"),
            "strategic_context": org.get("strategic_context", []),
        }

    return profile
```

- [ ] **Step 10: Update `build_tick_prompt()` to use `effective_weight` and include org context**

In `build_tick_prompt()`, replace the three weight-computation lines (lines 107-109 of current context.py):

Old code:
```python
        modifier = profile["cadence_modifiers"].get(wf["name"], 1.0)
        scenario_mod = profile["scenario_overrides"].get(wf["name"], 1.0)
        effective = modifier * scenario_mod
```

New code:
```python
        effective = wf.get("effective_weight", 1.0)
```

Then add org context block after the scenario block (after line 117: `lines.append("")`), before the "Generate 0-3 plausible events" block (currently line 119):

```python
    if profile.get("org_context"):
        org_ctx = profile["org_context"]
        lines.append(
            f"Organization: {org_ctx.get('company_stage', 'growth')} stage, "
            f"{org_ctx.get('headcount_band', 'unknown')} employees, "
            f"{org_ctx.get('industry', 'technology')}"
        )
        for priority in org_ctx.get("strategic_context", []):
            lines.append(f"  Strategic priority: {priority}")
        lines.append("")
```

- [ ] **Step 11: Implement `validate_distribution()`**

Add at the end of `agents/simulator_pipeline/context.py`:

```python
def validate_distribution(
    events: list[Any],
    reference: dict[str, list[int]],
    window_days: int,
) -> list[str]:
    """Compare actual event counts against reference ranges.

    Returns a list of warning strings for outlier workflow types.
    Reference ranges are defined for a 30-day window and scaled
    proportionally for other window sizes.

    Events can be any object with a workflow_type attribute
    (SimulatedEvent or similar).
    """
    scale = window_days / 30.0
    counts: dict[str, int] = {}
    for e in events:
        counts[e.workflow_type] = counts.get(e.workflow_type, 0) + 1

    warnings: list[str] = []
    for wf_type, (lo, hi) in reference.items():
        actual = counts.get(wf_type, 0)
        scaled_lo = int(lo * scale)
        scaled_hi = int(hi * scale + 0.5)
        if actual < scaled_lo or actual > scaled_hi:
            warnings.append(
                f"{wf_type}: {actual} events in {window_days}d "
                f"(expected {scaled_lo}-{scaled_hi})"
            )
    return warnings
```

- [ ] **Step 12: Run all context tests**

Run: `cd ai-agents && uv run pytest tests/test_simulator_context.py -v --tb=short`
Expected: ALL PASS. This verifies: org dossier loading (2), role inference (7), three-layer composition (6), distribution validation (6), prompt org context (2), plus all pre-existing tests (7).

- [ ] **Step 13: Run full test suite to check for regressions**

Run: `cd ai-agents && uv run pytest tests/ -q --tb=short 2>&1 | tail -10`
Expected: All tests pass. The `compose_role_profile()` signature change adds an optional `org` parameter, so existing callers remain valid.

- [ ] **Step 14: Commit**

```bash
git add agents/simulator_pipeline/context.py tests/test_simulator_context.py
git commit -m "feat: add org dossier loading, role inference, three-layer composition, and distribution validation"
```

---

## Chunk 2: Integration

### Task 4: Wire org dossier, event tracking, and distribution validation into simulator.py

**Files:**
- Modify: `agents/simulator.py`
- Test: `tests/test_simulator_integration.py`

- [ ] **Step 1: Write tests for simulator wiring**

Read `tests/test_simulator_integration.py` to understand the existing test pattern. Add these tests (adapting to the existing mock style):

```python
from unittest.mock import patch, AsyncMock, MagicMock
from agents.simulator_pipeline.models import SimulatedEvent


class TestSimulatorOrgDossier:
    """Tests for org dossier and distribution validation wiring in simulator."""

    async def test_org_dossier_passed_to_compose(self, tmp_path):
        """run_simulation passes org to compose_role_profile when dossier exists."""
        captured = {}

        def mock_compose(**kwargs):
            captured.update(kwargs)
            return {
                "role": kwargs["role_name"],
                "variant": kwargs["variant"],
                "description": "",
                "variant_description": "",
                "workflows": [],
                "cadence_modifiers": {},
                "scenario_overrides": {},
            }

        with patch("agents.simulator.load_workflow_semantics", return_value={"one_on_one": {}}), \
             patch("agents.simulator.load_role_matrix", return_value={"engineering-manager": {"variants": {"experienced-em": {}}, "workflows": ["one_on_one"]}}), \
             patch("agents.simulator.load_scenarios", return_value={}), \
             patch("agents.simulator.load_org_dossier", return_value={"company_stage": "startup"}) as mock_org, \
             patch("agents.simulator._ORG_DOSSIER") as mock_path, \
             patch("agents.simulator.compose_role_profile", side_effect=mock_compose), \
             patch("agents.simulator.create_simulation") as mock_create, \
             patch("agents.simulator.seed_simulation"), \
             patch("agents.simulator.rebase_seed_dates"), \
             patch("agents.simulator.save_manifest"), \
             patch("agents.simulator.run_deterministic_checkpoint", new_callable=AsyncMock), \
             patch("agents.simulator.generate_tick_events", new_callable=AsyncMock, return_value=[]), \
             patch("agents.simulator.config"):

            mock_path.is_file.return_value = True
            mock_create.return_value = (tmp_path, MagicMock(
                status="running", start_date="2026-03-01", end_date="2026-03-02",
                last_completed_tick=None, ticks_completed=0, ticks_total=1,
                checkpoints_run=0,
            ))

            await run_simulation(role="engineering-manager", window="1d", seed="demo-data/")

        assert captured.get("org") == {"company_stage": "startup"}

    async def test_distribution_validated_post_simulation(self, tmp_path):
        """validate_distribution is called after simulation completes."""
        mock_event = SimulatedEvent(
            date="2026-03-01", workflow_type="decision",
            subdirectory="decisions/", filename="test.md",
        )
        validated = []

        def mock_validate(events, reference, window_days):
            validated.append(len(events))
            return []

        with patch("agents.simulator.load_workflow_semantics", return_value={"decision": {"subdirectory": "decisions/"}}), \
             patch("agents.simulator.load_role_matrix", return_value={
                 "engineering-manager": {
                     "variants": {"experienced-em": {"cadence_modifiers": {}}},
                     "workflows": ["decision"],
                     "reference_distribution_30d": {"decision": [1, 5]},
                 }
             }), \
             patch("agents.simulator.load_scenarios", return_value={}), \
             patch("agents.simulator._ORG_DOSSIER") as mock_path, \
             patch("agents.simulator.create_simulation") as mock_create, \
             patch("agents.simulator.seed_simulation"), \
             patch("agents.simulator.rebase_seed_dates"), \
             patch("agents.simulator.save_manifest"), \
             patch("agents.simulator.run_deterministic_checkpoint", new_callable=AsyncMock), \
             patch("agents.simulator.generate_tick_events", new_callable=AsyncMock, return_value=[mock_event]), \
             patch("agents.simulator.render_events"), \
             patch("agents.simulator.validate_distribution", side_effect=mock_validate), \
             patch("agents.simulator.config"):

            mock_path.is_file.return_value = False  # No org dossier
            mock_create.return_value = (tmp_path, MagicMock(
                status="running", start_date="2026-03-01", end_date="2026-03-02",
                last_completed_tick=None, ticks_completed=0, ticks_total=1,
                checkpoints_run=0,
            ))

            await run_simulation(role="engineering-manager", window="1d", seed="demo-data/")

        assert len(validated) == 1
        assert validated[0] == 1  # One event was tracked
```

If the mock approach is too complex for the existing test patterns, simplify to integration-level tests that verify the function signature accepts `org_dossier` and the key code paths don't raise.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ai-agents && uv run pytest tests/test_simulator_integration.py::TestSimulatorOrgDossier -v --tb=short`
Expected: FAIL — `load_org_dossier` not yet imported in simulator.py, `validate_distribution` not imported, `all_events` not defined.

- [ ] **Step 3: Add imports and path constant**

In `agents/simulator.py`, add `load_org_dossier` and `validate_distribution` to the import from `agents.simulator_pipeline.context` (lines 23-29). The import block becomes:

```python
from agents.simulator_pipeline.context import (
    load_workflow_semantics,
    load_role_matrix,
    load_scenarios,
    load_org_dossier,
    compose_role_profile,
    build_tick_prompt,
    validate_distribution,
)
```

Add a new path constant after `_SCENARIOS` (line 45):

```python
_ORG_DOSSIER = _PROJECT_ROOT / "config" / "org-dossier.yaml"
```

- [ ] **Step 4: Add `org_dossier` parameter to `run_simulation()` and wire loading**

Add `org_dossier: Path | None = None` to the `run_simulation()` signature (after `resume_dir`):

```python
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
    org_dossier: Path | None = None,
) -> Path:
```

After the scenarios loading (line 107: `scenarios = load_scenarios(...)`), add:

```python
    org_path = org_dossier or _ORG_DOSSIER
    org = load_org_dossier(org_path) if org_path.is_file() else None
```

Pass `org=org` to `compose_role_profile()` (change lines 141-147):

```python
    profile = compose_role_profile(
        role_name=role,
        variant=variant,
        roles=roles,
        workflows=workflows,
        scenario=scenario_def,
        org=org,
    )
```

- [ ] **Step 5: Add event tracking and distribution validation**

Add `all_events` list alongside `recent_events` (after line 166):

```python
    all_events: list[SimulatedEvent] = []
```

This requires importing `SimulatedEvent`. Add to the imports at the top:

```python
from agents.simulator_pipeline.models import SimulatedEvent
```

Inside the tick loop, after `render_events(events, sim_dir)` (line 188), add:

```python
                all_events.extend(events)
```

After `manifest.status = SimStatus.COMPLETED` (line 216), before the completion log, add:

```python
        # Validate event distribution against reference ranges
        role_def = roles.get(role, {})
        reference = role_def.get("reference_distribution_30d")
        if reference and all_events:
            window_days = (end_date - start_date).days
            dist_warnings = validate_distribution(all_events, reference, window_days)
            for w in dist_warnings:
                _log.warning("Distribution outlier: %s", w)
```

- [ ] **Step 6: Add `--org-dossier` CLI flag**

In the argparse block (around line 249), add after `--resume`:

```python
    parser.add_argument("--org-dossier", type=str, default=None,
                        help="Path to org-dossier.yaml (default: config/org-dossier.yaml)")
```

In `main()`, pass it to `run_simulation()`:

```python
        sim_dir = await run_simulation(
            role=args.role,
            variant=args.variant or "experienced-em",
            window=args.window,
            seed=args.seed,
            scenario=args.scenario,
            audience=args.audience,
            output=Path(args.output) if args.output else None,
            org_dossier=Path(args.org_dossier) if args.org_dossier else None,
        )
```

- [ ] **Step 7: Run tests**

Run: `cd ai-agents && uv run pytest tests/test_simulator_integration.py tests/test_simulator_context.py -v --tb=short 2>&1 | tail -20`
Expected: All pass.

- [ ] **Step 8: Run full test suite**

Run: `cd ai-agents && uv run pytest tests/ -q --tb=short 2>&1 | tail -10`
Expected: All tests pass.

- [ ] **Step 9: Commit**

```bash
git add agents/simulator.py tests/test_simulator_integration.py
git commit -m "feat: wire org dossier, event tracking, and distribution validation into simulator"
```

---

### Task 5: Wire role inference into demo.py --simulate

**Files:**
- Modify: `agents/demo.py`
- Test: `tests/test_demo_simulate.py`

- [ ] **Step 1: Write tests for role inference in simulate flow**

Add to `tests/test_demo_simulate.py`:

```python
class TestDemoSimulateRoleInference:
    async def test_infers_role_from_request(self, tmp_path: Path):
        """Role is inferred from request when --role not provided."""
        sim_dir = tmp_path / "sim"
        sim_dir.mkdir()
        captured_kwargs = {}

        async def mock_run_sim(**kwargs):
            captured_kwargs.update(kwargs)
            return sim_dir

        async def mock_warmup(path):
            pass

        async def mock_generate_demo(request, **kwargs):
            demo_dir = tmp_path / "demo-output"
            demo_dir.mkdir(exist_ok=True)
            return demo_dir

        with patch("agents.demo.run_simulation", side_effect=mock_run_sim), \
             patch("agents.demo.run_warmup", side_effect=mock_warmup), \
             patch("agents.demo.generate_demo", side_effect=mock_generate_demo), \
             patch("agents.demo.config"):

            await _run_simulated_demo(
                request="show the VP of engineering dashboard",
                window="5d",
                variant="baseline",
            )

        assert captured_kwargs["role"] == "vp-engineering"

    async def test_explicit_role_overrides_inference(self, tmp_path: Path):
        """--role overrides inference from request text."""
        sim_dir = tmp_path / "sim"
        sim_dir.mkdir()
        captured_kwargs = {}

        async def mock_run_sim(**kwargs):
            captured_kwargs.update(kwargs)
            return sim_dir

        async def mock_warmup(path):
            pass

        async def mock_generate_demo(request, **kwargs):
            demo_dir = tmp_path / "demo-output"
            demo_dir.mkdir(exist_ok=True)
            return demo_dir

        with patch("agents.demo.run_simulation", side_effect=mock_run_sim), \
             patch("agents.demo.run_warmup", side_effect=mock_warmup), \
             patch("agents.demo.generate_demo", side_effect=mock_generate_demo), \
             patch("agents.demo.config"):

            await _run_simulated_demo(
                request="show the VP of engineering dashboard",
                role="tech-lead",
                window="5d",
                variant="baseline",
            )

        assert captured_kwargs["role"] == "tech-lead"

    async def test_org_dossier_passed_through(self, tmp_path: Path):
        """--org-dossier is passed through to run_simulation."""
        sim_dir = tmp_path / "sim"
        sim_dir.mkdir()
        captured_kwargs = {}

        async def mock_run_sim(**kwargs):
            captured_kwargs.update(kwargs)
            return sim_dir

        async def mock_warmup(path):
            pass

        async def mock_generate_demo(request, **kwargs):
            demo_dir = tmp_path / "demo-output"
            demo_dir.mkdir(exist_ok=True)
            return demo_dir

        dossier_path = tmp_path / "custom-org.yaml"

        with patch("agents.demo.run_simulation", side_effect=mock_run_sim), \
             patch("agents.demo.run_warmup", side_effect=mock_warmup), \
             patch("agents.demo.generate_demo", side_effect=mock_generate_demo), \
             patch("agents.demo.config"):

            await _run_simulated_demo(
                request="show the management cockpit",
                window="5d",
                variant="experienced-em",
                org_dossier=dossier_path,
            )

        assert captured_kwargs["org_dossier"] == dossier_path

    async def test_defaults_to_em_when_no_hints(self, tmp_path: Path):
        """Falls back to engineering-manager when request has no role hints."""
        sim_dir = tmp_path / "sim"
        sim_dir.mkdir()
        captured_kwargs = {}

        async def mock_run_sim(**kwargs):
            captured_kwargs.update(kwargs)
            return sim_dir

        async def mock_warmup(path):
            pass

        async def mock_generate_demo(request, **kwargs):
            demo_dir = tmp_path / "demo-output"
            demo_dir.mkdir(exist_ok=True)
            return demo_dir

        with patch("agents.demo.run_simulation", side_effect=mock_run_sim), \
             patch("agents.demo.run_warmup", side_effect=mock_warmup), \
             patch("agents.demo.generate_demo", side_effect=mock_generate_demo), \
             patch("agents.demo.config"):

            await _run_simulated_demo(
                request="show the management cockpit",
                window="5d",
                variant="experienced-em",
            )

        assert captured_kwargs["role"] == "engineering-manager"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ai-agents && uv run pytest tests/test_demo_simulate.py::TestDemoSimulateRoleInference -v --tb=short`
Expected: FAIL — `_run_simulated_demo()` doesn't accept `role` parameter yet.

- [ ] **Step 3: Add `role` parameter to `_run_simulated_demo()` and wire inference**

Add the import near the top of `agents/demo.py` with the other simulator imports (around line 35):

```python
from agents.simulator_pipeline.context import infer_role
```

Modify `_run_simulated_demo()` signature (line 1333) to accept `role` and `org_dossier`:

```python
async def _run_simulated_demo(
    *,
    request: str,
    role: str | None = None,
    window: str = "30d",
    variant: str = "experienced-em",
    scenario: str | None = None,
    audience: str | None = None,
    format: str = "slides",
    duration: str | None = None,
    persona_file: Path | None = None,
    voice: bool = False,
    org_dossier: Path | None = None,
) -> Path:
```

Replace the hardcoded `role="engineering-manager"` in the `run_simulation()` call (line 1348-1355) with:

```python
    resolved_role = infer_role(request, explicit_role=role)
    log.info("Running temporal simulation (role=%s, window=%s, variant=%s)",
             resolved_role, window, variant)

    sim_dir = await run_simulation(
        role=resolved_role,
        variant=variant,
        window=window,
        seed="demo-data/",
        scenario=scenario,
        audience=audience,
        org_dossier=org_dossier,
    )
```

- [ ] **Step 4: Add `--role` and `--org-dossier` CLI flags to demo.py**

In the argparse block, add after the `--simulate` flag (around line 1395):

```python
    parser.add_argument("--role", type=str, default=None,
                        help="Override role for simulation (tech-lead, vp-engineering, engineering-manager)")
    parser.add_argument("--org-dossier", type=str, default=None,
                        help="Path to org-dossier.yaml for simulation")
```

In the `if args.simulate:` branch (line 1438-1451), pass `role=args.role` to `_run_simulated_demo()`. Replace the full call with all kwargs shown explicitly:

```python
        demo_dir = await _run_simulated_demo(
            request=args.request if not args.audience else f"{parse_request(args.request)[0]} for {args.audience}",
            role=args.role,
            window=args.window,
            variant=args.variant,
            scenario=args.scenario,
            audience=args.audience,
            format=args.format,
            duration=args.duration,
            persona_file=args.persona_file,
            voice=args.voice,
            org_dossier=Path(args.org_dossier) if args.org_dossier else None,
        )
```

- [ ] **Step 5: Run tests**

Run: `cd ai-agents && uv run pytest tests/test_demo_simulate.py -v --tb=short`
Expected: ALL PASS including the new role inference tests and existing tests.

- [ ] **Step 6: Run full test suite**

Run: `cd ai-agents && uv run pytest tests/ -q --tb=short 2>&1 | tail -10`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add agents/demo.py tests/test_demo_simulate.py
git commit -m "feat: wire role inference into demo --simulate with --role and --org-dossier flags"
```
