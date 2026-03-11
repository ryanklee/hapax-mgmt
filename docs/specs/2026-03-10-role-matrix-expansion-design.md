# Role Matrix Expansion — Design Spec

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the temporal simulator's role matrix with tech-lead and vp-engineering roles, add org-level dossier for organizational context, and implement three-layer cadence composition with guardrails.

**Architecture:** New roles use existing 10 workflow types with different cadence modifiers. An org-level dossier provides company stage, strategic context, and stage-specific modifier layer. Three-layer composition (role variant × scenario × org stage) is clamped to [0.1, 5.0] and validated post-simulation against reference distributions.

**Tech Stack:** Python, YAML config, pydantic-ai, existing simulator pipeline

---

## Section 1: Org-Level Dossier

New file: `config/org-dossier.yaml`

```yaml
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
      one_on_one: 1.3       # everyone talks to everyone
      status_report: 0.5    # less formal reporting
      decision: 1.5          # fast, frequent decisions
      okr_update: 0.7        # lighter process
      incident: 1.3          # more fires, less insulation
    growth:
      {}                     # baseline — no adjustment
    enterprise:
      status_report: 1.8    # more formal reporting
      decision: 0.7          # slower, more process
      one_on_one: 0.8        # delegation through layers
      review_cycle: 1.3      # more structured reviews
```

**Composition with guardrails:**

- `compose_role_profile()` gains an `org` parameter
- Effective weight = `role_variant_modifier × scenario_modifier × org_stage_modifier`
- Hard clamp: every effective weight clamped to `[0.1, 5.0]` with logged warning when clamping fires
- Values computed once at profile composition time, not per-tick

**Prompt integration:**

- `build_tick_prompt()` includes `company_stage`, `headcount_band`, and `strategic_context` as natural language context
- Gives the LLM thematic guidance (event content) while modifiers control event frequency

**Post-simulation validation (reference distributions):**

Each role defines expected event counts per 30-day window. After simulation completes, a validation pass compares actual counts against ranges and logs warnings for outliers. Not a hard gate — just visibility.

## Section 2: Role Definitions

Two new roles in `config/role-matrix.yaml`:

```yaml
roles:
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

Both roles use all 10 existing workflow types. Single variant each (`baseline`). Reference distributions provide post-simulation validation bounds.

The existing `engineering-manager` role gets its own `reference_distribution_30d` added for parity.

## Section 3: Role Inference

New constant in `agents/simulator_pipeline/context.py`:

```python
ROLE_HINTS: dict[str, str] = {
    # tech-lead signals
    "tech lead": "tech-lead",
    "technical lead": "tech-lead",
    "tl": "tech-lead",
    "architect": "tech-lead",
    "principal": "tech-lead",
    "staff engineer": "tech-lead",
    # vp signals
    "vp": "vp-engineering",
    "vice president": "vp-engineering",
    "director": "vp-engineering",
    "head of engineering": "vp-engineering",
    "engineering director": "vp-engineering",
    # engineering-manager (default)
    "em": "engineering-manager",
    "engineering manager": "engineering-manager",
    "manager": "engineering-manager",
}
```

**Resolution logic** — new function `infer_role()`:

```python
def infer_role(request: str, explicit_role: str | None = None) -> str:
    if explicit_role:
        return explicit_role
    request_lower = request.lower()
    # Longest match first to prefer "engineering director" over "director"
    for hint in sorted(ROLE_HINTS, key=len, reverse=True):
        if hint in request_lower:
            return ROLE_HINTS[hint]
    return "engineering-manager"  # default
```

**CLI integration:**

- `--role` flag on `demo --simulate` overrides inference entirely
- Without `--role`, the demo request string is scanned against `ROLE_HINTS`
- Inference result is logged so the operator can see what was chosen

**Ambiguity handling:** Longest-match-first prevents "director" from stealing "engineering director". If multiple hints match, longest wins. If nothing matches, defaults to `engineering-manager`.

## Section 4: Composition & Guardrails

Changes to `compose_role_profile()` in `context.py`:

```python
MODIFIER_FLOOR = 0.1
MODIFIER_CEILING = 5.0
```

New `org` parameter added. Three-layer modifier composition:

```python
for wf in profile["workflows"]:
    role_mod = profile["cadence_modifiers"].get(wf["name"], 1.0)
    scenario_mod = profile["scenario_overrides"].get(wf["name"], 1.0)
    org_mod = org_stage_modifiers.get(wf["name"], 1.0) if org_stage_modifiers else 1.0

    raw = role_mod * scenario_mod * org_mod
    effective = max(MODIFIER_FLOOR, min(MODIFIER_CEILING, raw))

    if effective != raw:
        _log.warning(
            "Clamped %s modifier: %.2f -> %.2f (role=%.1f, scenario=%.1f, org=%.1f)",
            wf["name"], raw, effective, role_mod, scenario_mod, org_mod,
        )

    wf["effective_weight"] = effective
```

**Key properties:**

- Clamping happens once at composition time, not per-tick
- Warning log includes all three input values so you can see which layer caused the extreme
- `effective_weight` stored on each workflow dict, used by `build_tick_prompt()`
- `build_tick_prompt()` switches from computing weight inline to reading `effective_weight`

**Org context in prompt:**

```python
if profile.get("org_context"):
    org = profile["org_context"]
    lines.append(f"Organization: {org.get('company_stage', 'growth')} stage, "
                 f"{org.get('headcount_band', 'unknown')} employees, "
                 f"{org.get('industry', 'technology')}")
    for priority in org.get("strategic_context", []):
        lines.append(f"  Strategic priority: {priority}")
    lines.append("")
```

**Post-simulation distribution validation:**

```python
def validate_distribution(
    events: list[SimulatedEvent],
    reference: dict[str, list[int]],
    window_days: int,
) -> list[str]:
    """Compare actual event counts against reference ranges. Returns warnings."""
    scale = window_days / 30.0
    counts: dict[str, int] = {}
    for e in events:
        counts[e.workflow_type] = counts.get(e.workflow_type, 0) + 1

    warnings = []
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

Called after simulation completes, logged as warnings. Not a hard gate.

## Section 5: Config Loading & Defaults

New loader in `context.py`:

```python
def load_org_dossier(path: Path) -> dict[str, Any]:
    """Load org-dossier.yaml. Returns the org dict."""
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    return data["org"]
```

**Default behavior when no dossier exists:**

- If `config/org-dossier.yaml` doesn't exist, returns `None`
- `compose_role_profile(org=None)` treats missing org same as `growth` stage (no adjustment)
- Existing behavior completely unchanged unless a dossier is provided

**CLI integration:**

- `--org-dossier PATH` flag on `demo --simulate` and simulator itself
- Defaults to `config/org-dossier.yaml` if it exists
- Demo-data corpus ships with a default dossier matching its fictional org

**Changes to `simulator.py`:**

```python
org_dossier_path = config_dir / "org-dossier.yaml"
org = load_org_dossier(org_dossier_path) if org_dossier_path.is_file() else None

profile = compose_role_profile(
    role_name=role, variant=variant,
    roles=roles, workflows=workflows,
    scenario=scenario_def, org=org,
)
```

**Post-simulation validation call site:**

```python
reference = role_def.get("reference_distribution_30d")
if reference:
    warnings = validate_distribution(all_events, reference, window_days)
    for w in warnings:
        _log.warning("Distribution outlier: %s", w)
```

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Workflow types | Existing 10 only | Avoids downstream changes to collectors, nudges, bridge |
| Variants per new role | Single baseline | Can expand later; avoids combinatorial testing burden now |
| Org coupling | Tightly coupled (modifiers) | Accuracy over simplicity; guardrails mitigate risk |
| Clamp bounds | [0.1, 5.0] | Prevents zero-probability workflows and runaway amplification |
| Distribution validation | Post-simulation warnings | Catches subtle imbalance without blocking simulation |
| Role inference | Keyword map + longest-match | Predictable, testable, no LLM call needed |
| Default role | engineering-manager | System's core use case; safe fallback |
| Missing dossier | Treated as growth (no-op) | Backwards compatible with existing simulations |
