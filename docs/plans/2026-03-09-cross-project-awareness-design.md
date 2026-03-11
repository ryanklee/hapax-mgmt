# Cross-Project Awareness Design

## Goal

Establish bidirectional documentation-level awareness between the wider hapax system (`hapaxromana` + `ai-agents`) and the containerized management cockpit (`hapax-containerization`), so that Claude Code sessions and agent context flows in either system understand the relationship.

## Architecture

### Shared Boundary Document

A single file — `docs/cross-project-boundary.md` — exists as a byte-identical copy in two repos:

- `~/projects/hapaxromana/docs/cross-project-boundary.md`
- `~/projects/hapax-containerization/docs/cross-project-boundary.md`

The document contains:

1. **Project identities** — one paragraph each describing what each project is and its purpose.

2. **Shared lineage** — both started as the same codebase. The containerization project was extracted in March 2026 and repurposed as a management-only decision support system. The wider system remains the full personal executive function platform.

3. **Axiom correspondence** — explicit mapping table showing the fork-with-rename relationship:

   | Wider System (hapaxromana) | Containerization | Weight | Notes |
   |---------------------------|------------------|--------|-------|
   | `single_user` | `single_operator` | 100 | Same semantics, role-generic language |
   | `executive_function` | `decision_support` | 95 | Regrounded from neurodivergent-friendly design to decision-support theory |
   | `management_governance` | `management_safety` | 95 | Elevated from domain axiom to constitutional scope |
   | `corporate_boundary` | `corporate_boundary` | 90 | Unchanged, dormant in both |

   Containerization's axioms are derived from the wider system's axioms. The constitutional principles are the same; the grounding language differs because the system's purpose differs.

4. **Agent roster divergence** — what agents exist where, which were removed, renamed, or added during the extraction:

   | Agent | Wider System | Containerization | Notes |
   |-------|-------------|------------------|-------|
   | management_prep | `agents.management_prep` | `agents.management_prep` | Identical |
   | meeting_lifecycle | `agents.meeting_lifecycle` | `agents.meeting_lifecycle` | Identical |
   | briefing → management_briefing | `agents.briefing` | `agents.management_briefing` | Renamed, management-focused |
   | profiler → management_profiler | `agents.profiler` | `agents.management_profiler` | Renamed, reduced to 6 dimensions |
   | — → management_activity | — | `agents.management_activity` | New, vault-based management metrics |
   | health_monitor → system_check | `agents.health_monitor` | `agents.system_check` | Rewritten, 4 checks only, no auto-fix |
   | demo, demo_eval | `agents.demo` | `agents.demo` | Ported with adaptation |
   | 18 others (sync, audio, RAG, etc.) | Present | Removed | Not in management scope |

5. **Shared module status** — 18 modules in `shared/` exist in both repos. Containerization is a subset; it has no unique shared modules. Key modules: `config.py`, `operator.py`, `profile_store.py`, `management_bridge.py`, `notify.py`, `vault_writer.py`, `axiom_*.py`.

6. **Shared infrastructure (current state)** — both systems currently share:
   - Qdrant (localhost:6333) — same collections (`profile-facts`, `documents`, `axiom-precedents`)
   - LiteLLM proxy (localhost:4000)
   - Langfuse (localhost:3000) — traces from both systems merged
   - PostgreSQL (localhost:5432)
   - Obsidian vault (data/)

7. **Isolation trajectory** — the containerization project is moving toward full resource isolation. It will eventually run its own infrastructure stack with no shared services. The mechanism is not yet designed. Until isolation is complete, both systems read/write the same Qdrant collections and Langfuse traces.

8. **Boundary rules** — changes in one repo that may affect the other:
   - Shared module API changes (function signatures, class interfaces in `shared/`)
   - Axiom semantic changes (redefining what a constitutional axiom means)
   - Qdrant collection schema changes (field names, vector dimensions)
   - Obsidian vault structure changes (paths that `management_bridge.py` reads)
   - Profile dimension changes (the 6 management dimensions in `profile_store.py`)

### CLAUDE.md Updates

**hapaxromana/CLAUDE.md** gets a new section:

```markdown
## Related Project: hapax-containerization

A management-focused extraction of this system exists at `~/projects/hapax-containerization/`. It is a standalone management decision support cockpit — the same constitutional axioms with management-only scope. See `docs/cross-project-boundary.md` for the full boundary specification. That document must be byte-identical to the copy in hapax-containerization.
```

**hapax-containerization/CLAUDE.md** gets a new section:

```markdown
## Relationship to Wider Hapax System

This project was extracted from the wider hapax system (`~/projects/hapaxromana/` + `~/projects/ai-agents/ `) in March 2026. It shares constitutional axioms (renamed for management context) and several shared modules. The systems currently share infrastructure (Qdrant, LiteLLM, Langfuse) but are moving toward full isolation. See `docs/cross-project-boundary.md` for the full boundary specification. That document must be byte-identical to the copy in hapaxromana.
```

### Drift Detection

The wider system's drift-detector agent adds a new check:

- **What:** Compare `~/projects/hapaxromana/docs/cross-project-boundary.md` against `~/projects/hapax-containerization/docs/cross-project-boundary.md`
- **How:** Byte-for-byte comparison (file hash or diff)
- **Severity:** High — any mismatch means the boundary contract is broken
- **Cadence:** Weekly (same as existing drift-detector schedule)

This check runs in the wider system's drift-detector because that agent already performs cross-repo documentation checks. The containerization project does not run its own drift-detector.

## What This Design Does NOT Cover

- **Runtime isolation** (separate Qdrant, LiteLLM, etc.) — documented as trajectory, mechanism TBD
- **Automated sync** of the boundary document — updates are manual, drift-detector catches staleness
- **Shared module version pinning** — both repos evolve independently; breaking changes are caught by tests, not by this document
