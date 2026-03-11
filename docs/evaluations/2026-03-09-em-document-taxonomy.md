# Engineering Manager Document Taxonomy — Fortune 500 SAFe/Scrumban

**Date:** 2026-03-09
**Purpose:** Exhaustive inventory of document types and activities an engineering manager performs in a Fortune 500 scaled agile environment, mapped against the current system's data model to identify coverage gaps and expansion opportunities.

## Methodology

Research covered SAFe 6.0 official framework (including the 5.0→6.0 terminology changes), scrumban practices, and Fortune 500 operational patterns across 20 management domains. Each document type was evaluated for: ownership, consumers, cadence, creation mode, and EM activities performed on/with it.

---

## Part 1: Complete Document Inventory

### 1. Sprint/Iteration Artifacts (11 types)

| Document | Creator | Consumers | Cadence | EM Activity |
|----------|---------|-----------|---------|-------------|
| Sprint/iteration backlog | PO + team | Team, SM, EM, stakeholders | Per sprint | Reviews feasibility, negotiates scope |
| Sprint goal | PO + team | Team, stakeholders | Per sprint | Co-creates, validates PI alignment |
| Sprint planning notes | SM or EM | Team, PO | Per sprint | Facilitates, captures capacity decisions |
| Team sync notes (daily standup) | SM or self-managed | Team, EM | Daily | Identifies blockers for escalation |
| Sprint review/demo notes | SM/EM/team lead | Stakeholders, PO | Per sprint | Presents or coaches presenters |
| Sprint retrospective notes | SM or EM | Team, EM chain (summarized) | Per sprint | Facilitates or reviews action items |
| Burndown/burnup charts | Auto-generated | EM, SM, PO | Per sprint | Reviews velocity trends |
| Velocity tracking | Auto-generated | EM, SM, PO | Per sprint, trended quarterly | Capacity planning and forecasting |
| Definition of Done (DoD) | Team | Team, QA, PO | Created once, updated per PI | Ensures existence and adequacy |
| Kanban board / WIP limits | Team + EM | Team, EM, PO | Continuous | Monitors flow, adjusts limits |
| Cumulative flow diagram | Auto-generated | EM, SM | Continuous | Analyzes bottlenecks |

### 2. PI Planning Artifacts (11 types)

| Document | Creator | Consumers | Cadence | EM Activity |
|----------|---------|-----------|---------|-------------|
| Team PI objectives | Team (EM facilitates) | Business Owners, RTE, PM | Per PI (8-12 wk) | Drafts, negotiates, tracks |
| ART PI objectives | RTE + PM (EM contributes) | Business Owners, portfolio | Per PI | Contributes team's portion |
| ART planning board (program board) | All teams at PI planning | RTE, all teams, PM | Per PI, updated weekly | Places features, declares dependencies |
| ROAM risk board | All teams at PI planning | RTE, management | Per PI, reviewed weekly | Identifies/owns/mitigates risks |
| Confidence vote record | RTE captures from teams | Business Owners | Per PI (end of planning) | Votes, explains, negotiates scope |
| Feature breakdown / feature specs | PM (EM provides tech input) | Teams, architects, QA | Per PI, refined per sprint | Reviews feasibility, estimates, negotiates |
| Enabler stories / enabler features | EM + architects | Team, PM, architects | Per PI and sprint | Creates, advocates for 20-30% allocation |
| Architectural runway assessment | System Architect + EM | RTE, PM, portfolio | Per PI | Assesses gaps, proposes enablers |
| Iteration plans (per team, per PI) | Team during PI breakout | RTE, PM | Per PI | Facilitates breakout, validates capacity |
| PI planning prep materials | EM + PM | Team | Per PI (1-2 wk before) | Prepares capacity data, velocity history |
| IP sprint plan | EM + team | Team, management | Per PI (final iteration) | Plans innovation, protects from feature creep |

### 3. SAFe Ceremony Artifacts (5 types)

| Document | Creator | Consumers | Cadence | EM Activity |
|----------|---------|-----------|---------|-------------|
| System demo notes/agenda | RTE (EM contributes) | Business Owners, all teams | Per sprint | Prepares team's segment |
| Inspect and Adapt output | RTE facilitates | All teams, management | Per PI | Presents metrics, root-cause analysis |
| ART sync / coach sync notes | RTE or rotating | SMs and EMs | Weekly | Reports status, escalates blockers |
| PO sync notes | PM | POs, EMs | Weekly | Provides technical context |
| Management problem-solving notes | RTE or facilitator | EMs, directors, BOs | PI planning (day 1 evening) | Raises impediments, resolves trade-offs |

### 4. People Management (13 types)

| Document | Creator | Consumers | Cadence | EM Activity |
|----------|---------|-----------|---------|-------------|
| **1:1 meeting notes** | EM (shared with report) | EM + report | Weekly/biweekly | Prepares, captures, tracks action items |
| Skip-level meeting notes | EM or EM's manager | EM, participants | Monthly/quarterly | Conducts, synthesizes themes upward |
| **Performance review document** | EM (with self-assessment input) | EM, report, HR, calibration | Semi-annual/annual | Gathers evidence, writes, delivers |
| Self-assessment | Direct report | EM | Semi-annual/annual | Reviews for perception gaps |
| Peer/360 feedback collection | Peers (solicited) | EM | Semi-annual/annual | Selects providers, synthesizes |
| Calibration notes | EM | Peer EMs, director, HR | Semi-annual/annual | Advocates, adjusts ratings |
| **Individual development plan (IDP)** | Report (EM guides) | EM, report, HR | Annual, reviewed quarterly | Coaches on SMART goals, identifies stretch |
| **Career development notes** | EM | EM, report | Quarterly | Discusses aspirations, maps growth |
| **Promotion packet** | EM | Director, VP, promo committee, HR | Semi-annual/annual | Compiles evidence, writes narrative |
| Performance improvement plan (PIP) | EM + HR | EM, report, HR, legal | As needed (30-60-90d) | Drafts with HR, defines criteria, tracks |
| Compensation recommendation | EM | Director, VP, HR, comp team | Annual | Proposes adjustments, advocates |
| **Coaching hypotheses / notes** | EM | EM (private) | Ongoing | Formulates, experiments, tracks outcomes |
| **Feedback log / records** | EM | EM | Continuous | Records given/received, tracks follow-up |

### 5. Team Health (5 types)

| Document | Creator | Consumers | Cadence | EM Activity |
|----------|---------|-----------|---------|-------------|
| **Team health assessment** | EM or SM | EM, team, director | Quarterly/per PI | Facilitates, tracks trends |
| Retro action item tracker | SM or EM | Team | Per sprint (accumulated) | Ensures items tracked, spots recurring themes |
| Team working agreement/charter | Team | Team, new hires | Created once, updated at changes | Facilitates creation, references in conflicts |
| Team morale/engagement survey | HR or EM (pulse) | EM, director, HR | Quarterly/semi-annual | Reviews, creates action plan |
| Psychological safety assessment | EM or facilitator | EM, team | Semi-annual/annual | Administers, discusses, intervenes |

### 6. Technical Planning (7 types)

| Document | Creator | Consumers | Cadence | EM Activity |
|----------|---------|-----------|---------|-------------|
| Technical design document | Senior engineers | Team, architects, peers | Per feature/epic | Reviews, ensures cross-cutting concerns |
| Architecture decision record (ADR) | Senior engineers/architect | Team, future engineers | Per significant decision | Ensures written, reviews, signs off |
| Tech debt register | EM + senior engineers | Team, PO, PM | Continuous, reviewed per PI | Maintains, prioritizes, advocates capacity |
| Technology radar / evaluation | EM + senior engineers | Team, architecture board | Quarterly/per PI | Evaluates, makes adopt/trial/assess/hold |
| Spike / POC summary | Engineer (EM reviews) | Team, PO, architect | Event-driven | Commissions, timeboxes, reviews findings |
| Runbook / operational playbook | Engineers | On-call, SRE, ops | Per service, updated as needed | Ensures existence, reviews post-incident |
| System architecture diagram | Architect/senior engineer | All engineers, ops, security | Updated per PI | Reviews accuracy, uses in onboarding |

### 7. Status Reporting (6 types)

| Document | Creator | Consumers | Cadence | EM Activity |
|----------|---------|-----------|---------|-------------|
| **Weekly status report (upward)** | EM | Director, VP | Weekly | Synthesizes, highlights risks/wins |
| Monthly executive summary | EM or director | VP, SVP, C-suite | Monthly | Contributes metrics, accomplishments |
| PI status report | RTE (EM contributes) | Business Owners, portfolio | Per PI + mid-PI | Reports PI objective status |
| QBR materials | Director/VP (EM contributes) | SVP, C-suite, finance | Quarterly | Contributes delivery/quality metrics |
| Team newsletter (downward/lateral) | EM | Team, peer teams | Bi-weekly/monthly | Communicates wins, changes, recognition |
| Stakeholder update (lateral) | EM | PM, Design, QA, peer EMs | Weekly/bi-weekly | Communicates status, flags dependencies |

### 8. Risk & Dependency Management (3 types)

| Document | Creator | Consumers | Cadence | EM Activity |
|----------|---------|-----------|---------|-------------|
| Risk register | EM + SM | RTE, PM, director | Per PI, reviewed per sprint | Identifies, assigns owners, escalates |
| Dependency map/tracker | EM + RTE | All ART teams, PM | Per PI, updated per sprint | Declares/tracks dependencies |
| Impediment log | SM or EM | EM, RTE, director | Continuous | Captures, escalates, tracks resolution |

### 9. Capacity & Resource Planning (5 types)

| Document | Creator | Consumers | Cadence | EM Activity |
|----------|---------|-----------|---------|-------------|
| Capacity planning model | EM | PM, RTE, director | Per PI, adjusted per sprint | Calculates capacity (PTO, on-call, enablers) |
| Headcount plan / staffing model | EM + director + HR | Finance, HR, VP | Annual, revised quarterly | Projects needs, justifies, plans attrition |
| Skills matrix / competency map | EM | EM, HR, director | Annual | Maps competencies, identifies bus factor |
| On-call rotation schedule | EM or team lead | Team, ops, SRE | Monthly/per sprint | Creates, ensures fairness |
| PTO / leave tracker | EM or HR system | EM, team | Continuous | Approves, factors into capacity |

### 10. Hiring (6 types)

| Document | Creator | Consumers | Cadence | EM Activity |
|----------|---------|-----------|---------|-------------|
| Job description / requisition | EM + recruiter | Recruiter, candidates | Per open role | Writes technical requirements |
| Interview plan / loop design | EM | Interview panel | Per role type | Designs stages, assigns competency areas |
| Interview scorecard / rubric | EM + panel | Panel, recruiter, committee | Per interview | Designs dimensions, reviews scorecards |
| Debrief notes | EM | Committee, recruiter, HR | Per candidate | Facilitates, documents rationale |
| Offer approval / comp justification | EM + recruiter | Director, HR, comp team | Per hire | Proposes package, justifies level |
| Hiring pipeline tracker | Recruiter (EM monitors) | EM, recruiter, director | Continuous | Reviews health, adjusts strategy |

### 11. Onboarding / Offboarding (6 types)

| Document | Creator | Consumers | Cadence | EM Activity |
|----------|---------|-----------|---------|-------------|
| 30-60-90 day plan | EM | New hire, EM, buddy | Per new hire | Creates milestones, reviews at checkpoints |
| Onboarding checklist | EM + HR + IT | New hire, EM, IT | Per new hire | Ensures access provisioned |
| Role expectations document | EM | New hire | Per role | Defines success criteria |
| Offboarding checklist | EM + HR + IT | Departing, EM, IT | Per departure | Ensures knowledge transfer, access revoked |
| Knowledge transfer document | Departing (EM ensures) | Team, successor | Per departure | Identifies critical areas, reviews |
| Exit interview notes | HR or EM | EM, director, HR | Per departure | Identifies themes for retention |

### 12. Vendor & Contractor (4 types)

| Document | Creator | Consumers | Cadence | EM Activity |
|----------|---------|-----------|---------|-------------|
| Statement of work (SOW) | Vendor/procurement + EM | EM, procurement, legal | Per engagement | Defines requirements, reviews deliverables |
| Vendor performance scorecard | EM | Procurement, director, vendor | Quarterly | Evaluates quality, timeliness, cost |
| Contractor onboarding/offboarding | EM + IT + procurement | Contractor, EM, IT | Per contractor | Manages access, monitors performance |
| Vendor risk assessment | Security + EM | Security, compliance | Per vendor, annual review | Technical risk assessment |

### 13. Budget & Cost (4 types)

| Document | Creator | Consumers | Cadence | EM Activity |
|----------|---------|-----------|---------|-------------|
| Team/department budget | Director + EM + finance | Finance, VP, EM | Annual, monthly tracking | Proposes, tracks actuals vs. budget |
| Cloud/infrastructure cost report | FinOps or auto-generated | EM, director, finance | Monthly | Reviews anomalies, optimizes |
| Tool/license inventory | EM + IT | EM, finance, procurement | Annual audit | Tracks, consolidates, manages renewals |
| Training/conference budget | EM | EM, reports, finance | Annual | Allocates, approves, tracks |

### 14. Compliance & Audit (5 types)

| Document | Creator | Consumers | Cadence | EM Activity |
|----------|---------|-----------|---------|-------------|
| SOX / regulatory evidence | Engineers (EM ensures) | Auditors, compliance | Continuous collection | Maintains approval records |
| Access review / entitlement review | EM + IT security | Security, compliance | Quarterly | Reviews, revokes stale access |
| Security training compliance | Security/HR (auto) | EM, security, HR | Annual/quarterly tracking | Ensures completion, follows up |
| Data classification inventory | EM + data governance | Security, compliance, legal | Annual | Classifies data, ensures controls |
| Audit finding remediation | Internal audit (EM remediates) | EM, director, audit | Post-audit, tracked to closure | Owns remediation, reports status |

### 15. Knowledge Management (5 types)

| Document | Creator | Consumers | Cadence | EM Activity |
|----------|---------|-----------|---------|-------------|
| Team wiki / Confluence space | Team (EM curates) | Team, peers, new hires | Continuous | Ensures structure, archives stale content |
| Engineering standards / best practices | EM + senior engineers | Team, peers | Created once, updated quarterly | Defines and maintains |
| **Decision log** | EM | Team, future EM, leadership | Event-driven | Records context, alternatives, rationale |
| Lessons learned | EM or team lead | Team, peers, management | Per project/PI | Facilitates, ensures items enter backlog |
| FAQ / tribal knowledge capture | Team (EM encourages) | Team, new hires, support | Continuous | Identifies gaps, assigns capture |

### 16. Cross-Team Coordination (4 types)

| Document | Creator | Consumers | Cadence | EM Activity |
|----------|---------|-----------|---------|-------------|
| Cross-team dependency agreement | EMs of dependent teams | Both teams, RTE, PM | Per PI/dependency | Negotiates scope, documents contracts |
| Integration plan / integration test plan | EM + peer EMs + QA | Teams, QA, release mgmt | Per PI/major feature | Defines integration points |
| Shared service / platform SLA | Platform team EM | Consuming teams, management | Created once, reviewed quarterly | Defines or consumes SLAs |
| Community of practice (CoP) notes | CoP facilitator | CoP members | Bi-weekly/monthly | Participates, shares learnings |

### 17. OKRs / Goals / Metrics (4 types)

| Document | Creator | Consumers | Cadence | EM Activity |
|----------|---------|-----------|---------|-------------|
| **Team OKRs** | EM + team | Team, director, PM | Quarterly set, weekly tracked | Drafts objectives, defines key results |
| Engineering metrics dashboard | EM or platform team | EM, director, VP | Continuous | Monitors DORA, cycle time, throughput |
| Quality metrics report | QA or auto-generated | EM, QA lead, director | Per sprint/monthly | Reviews defect rates, coverage trends |
| OKR mid-cycle review | EM | Director, team | Mid-quarter | Assesses progress, proposes corrections |

### 18. Incident Management (5 types)

| Document | Creator | Consumers | Cadence | EM Activity |
|----------|---------|-----------|---------|-------------|
| Incident report / ticket | On-call or incident commander | EM, SRE, affected teams | Event-driven | Reviews severity, escalates Sev1/2 |
| **Postmortem / incident review** | EM or senior engineer | Team, peers, management, SRE | Per significant incident | Facilitates blameless review, writes/reviews |
| Incident action item tracker | EM (from postmortem) | Team, SRE, management | Tracked weekly to closure | Assigns, tracks, reports status |
| On-call handoff summary | On-call engineer | Incoming on-call, EM | Per rotation | Reviews for patterns, adjusts alerts |
| Runbook updates (post-incident) | Engineer (EM assigns) | On-call, SRE | Post-incident | Ensures updates as action items |

### 19. Release Management (5 types)

| Document | Creator | Consumers | Cadence | EM Activity |
|----------|---------|-----------|---------|-------------|
| Release plan / calendar | Release manager or EM | Teams, QA, ops | Per release cycle | Coordinates timing, manages go/no-go |
| Release notes / changelog | Engineers or PM | Stakeholders, customers | Per release | Reviews accuracy |
| Go/no-go checklist | EM + QA + release manager | Stakeholders, ops | Per release | Reviews test results, validates rollback |
| Rollback plan | Engineers (EM reviews) | On-call, ops, EM | Per release | Ensures plan exists and is tested |
| Feature flag / toggle register | Engineers (EM monitors) | Team, PO, QA | Continuous | Reviews for stale flags |

### 20. Portfolio & Strategic (4 types)

| Document | Creator | Consumers | Cadence | EM Activity |
|----------|---------|-----------|---------|-------------|
| Lean business case | Epic Owner/PM (EM estimates) | Portfolio management | Per epic | Provides effort estimates, technical risk |
| Portfolio backlog / epic kanban | Portfolio management | PM, EMs, architects | Continuous, reviewed quarterly | Reviews for upcoming impact |
| Roadmap (product/technology) | PM + EM (tech roadmap) | Stakeholders, teams | Quarterly | Contributes tech items |
| Value stream mapping | RTE + EMs + process improvement | ART, portfolio | Annual/semi-annual | Maps team's contribution, identifies waste |

---

## Part 2: Goal Framework Support — SMART and OKR

The system must support both goal frameworks because Fortune 500 orgs use them for different purposes and at different organizational altitudes.

### When each framework applies

| Framework | Scope | Cadence | Typical Use |
|-----------|-------|---------|-------------|
| **OKR** | Team or organizational | Quarterly | Directional outcomes, team alignment, measurable impact |
| **SMART** | Individual | Annual (IDP) or per-project | Personal development, stretch assignments, specific deliverables |

In practice, they coexist: a team has OKRs, each person has SMART goals in their IDP, and SMART goals often map to key results within an OKR. The EM needs to track both and surface connections.

### OKR data model

```yaml
# data/okrs/2026-q1-platform-reliability.md
---
type: okr
scope: team               # team | individual | org
team: Platform
quarter: 2026-Q1
status: active             # active | scored | archived
objective: Improve platform reliability to support 10x traffic growth
key-results:
  - id: kr1
    description: Reduce P99 latency from 450ms to under 200ms
    target: 200
    current: 310
    unit: ms
    direction: decrease     # increase | decrease
    confidence: 0.6         # 0.0-1.0, weekly update
    last-updated: "2026-02-28"
  - id: kr2
    description: Achieve 99.95% uptime (from 99.8%)
    target: 99.95
    current: 99.91
    unit: percent
    direction: increase
    confidence: 0.7
    last-updated: "2026-02-28"
  - id: kr3
    description: Zero Sev1 incidents caused by capacity exhaustion
    target: 0
    current: 1
    unit: count
    direction: decrease
    confidence: 0.8
    last-updated: "2026-03-01"
scored-at: ""              # ISO date when final scoring happened
score: null                # 0.0-1.0 final score (null until scored)
---

Platform team Q1 reliability OKR. Aligned to engineering org objective
"Build infrastructure that scales with business growth."
```

### SMART goal data model

```yaml
# data/goals/sarah-chen-principal-readiness.md
---
type: goal
framework: smart           # smart | okr-kr-link
person: Sarah Chen
status: active             # active | completed | deferred | abandoned
category: career-development  # career-development | skill-building | project | stretch
created: "2026-01-15"
target-date: "2026-06-30"
last-reviewed: "2026-02-10"
review-cadence: quarterly   # monthly | quarterly
linked-okr: ""             # optional: filename of related OKR
specific: Lead a cross-team architecture review for the database migration
measurable: Present architecture proposal approved by 3+ team leads
achievable: Has led single-team reviews; cross-team is the stretch
relevant: Aligns with principal engineer promotion criteria (cross-team influence)
time-bound: Complete by end of Q2 2026
progress-notes:
  - date: "2026-02-10"
    note: Identified 3 candidate reviews. Scheduled first for March.
  - date: "2026-01-20"
    note: Discussed with director, confirmed this maps to promo criteria.
---

Sarah's SMART goal for principal engineer readiness. Tracks cross-team
architecture leadership as a stretch assignment.
```

### Goal nudge logic

| Condition | Nudge | Priority | Category |
|-----------|-------|----------|----------|
| OKR key result confidence < 0.5 at mid-quarter | "At-risk KR: {description}" | high (65) | goals |
| OKR key result `last-updated` > 14 days stale | "Stale KR update: {objective}" | medium (50) | goals |
| OKR quarter ended, `scored-at` is empty | "Unscored OKR: {objective}" | high (70) | goals |
| SMART goal `target-date` within 30 days, status active | "Goal deadline approaching: {specific}" | medium (55) | goals |
| SMART goal `target-date` passed, status active | "Goal overdue: {specific}" | high (65) | goals |
| SMART goal `last-reviewed` exceeds `review-cadence` | "Goal review overdue: {person}" | medium (45) | goals |
| No active SMART goals for a person with > 90 days tenure | "No active goals: {person}" | low (35) | goals |

---

## Part 3: Current System Coverage

### What the system models today (7 types)

| DATA_DIR Type | Domain | Doc Types Covered |
|---------------|--------|-------------------|
| `person` | People management | Person notes, some career/IDP fields |
| `coaching` | People management | Coaching hypotheses |
| `feedback` | People management | Feedback records |
| `meeting` | Sprint artifacts / people | Meeting notes |
| `decision` | Knowledge management | Decision log |
| `1on1-prep` (generated) | People management | 1:1 prep docs |
| `references` (generated) | Status reporting | Briefings, digests, snapshots |

### Current frontmatter fields on `person` type

Already tracked: `name`, `team`, `role`, `cadence`, `status`, `last-1on1`, `cognitive-load`, `growth-vector`, `feedback-style`, `coaching-active`, `career-goal-3y`, `current-gaps`, `current-focus`, `last-career-convo`, `team-type`, `interaction-mode`, `skill-level`, `will-signal`, `domains`, `relationship`.

### Current nudge collectors (3)

1. **Management nudges**: stale 1:1s (70), high cognitive load (60), overdue coaching (55), overdue feedback (65)
2. **Team health nudges**: falling-behind teams (75), treading-water with no coaching (55)
3. **Career staleness nudges**: career convo > 180d (50), no growth vector (40)

---

## Part 4: Expansion Priorities

Ranked by cognitive load reduction potential and implementation feasibility within the filesystem-as-bus architecture.

### Tier 1 — High value, low complexity (new `type:` values + nudge collectors)

| Priority | New Type | Directory | Nudge Opportunities | Complexity |
|----------|----------|-----------|---------------------|------------|
| 1 | `okr` | `data/okrs/` | Stale KR update, at-risk KR, unscored OKR | Low — new collector, simple date/confidence math |
| 2 | `goal` | `data/goals/` | Overdue goal, stale review, missing goals | Low — mirrors coaching/feedback pattern |
| 3 | `incident` | `data/incidents/` | Unresolved postmortem actions, overdue remediation | Low — date + status tracking |
| 4 | `review-cycle` | `data/review-cycles/` | Upcoming review deadline, missing self-assessment, pending calibration | Medium — multi-stage lifecycle |
| 5 | `status-report` | `data/status-reports/` | Enables briefing agent to synthesize from structured data | Low — output type, no nudges needed |

### Tier 2 — High value, moderate complexity

| Priority | New Type | Directory | Nudge Opportunities | Complexity |
|----------|----------|-----------|---------------------|------------|
| 6 | `pi-objective` | `data/pi-objectives/` | At-risk objectives, dependency blockers | Medium — cross-references teams |
| 7 | `hiring` | `data/hiring/` | Stale requisition, unscheduled debrief | Medium — multi-stage pipeline |
| 8 | `capacity` | `data/capacity/` | PI capacity calculation, PTO impact | Medium — computational |

### Tier 3 — Lower priority or org-specific

| Priority | New Type | Notes |
|----------|----------|-------|
| 9 | `risk` | ROAM board entries — only valuable if EM actively maintains |
| 10 | `retro-action` | Retrospective action items — often tracked in sprint tooling |
| 11 | `onboarding` | 30-60-90 plans — event-driven, low frequency |
| 12 | `adr` | Architecture decision records — often in code repos |
| 13 | `vendor` | SOW tracking — rare for most EMs |

### Not modeled (and shouldn't be)

These are better served by existing tooling (Jira, HR systems, finance tools):

- Sprint backlogs, burndown charts, velocity (Jira/Azure DevOps)
- Budget and cost tracking (finance systems)
- Compliance and audit evidence (GRC tools)
- Access reviews (IAM tools)
- Interview scorecards and pipeline (ATS)
- Feature flags (LaunchDarkly, etc.)
- Release plans and changelogs (CI/CD tooling)

The management cockpit's value is in the *interstitial* documents — the ones that live in the EM's head, notebook, or scattered Google Docs. The formal tooling-managed artifacts are already well-served.

---

## Part 5: Cadence Summary

| Cadence | Total Doc Types (Full Inventory) | Currently Modeled | Gap |
|---------|----------------------------------|-------------------|-----|
| Daily | 2 | 0 | Served by sprint tooling |
| Per sprint | 12 | 1 (meeting) | Mostly served by sprint tooling |
| Bi-weekly/monthly | 8 | 1 (1:1 notes) | Status reports, skip-levels |
| Per PI (8-12 wk) | 15 | 0 | PI objectives, capacity — Tier 2 |
| Quarterly | 10 | 0 | **OKRs, SMART reviews — Tier 1** |
| Semi-annual | 5 | 0 | **Review cycles — Tier 1** |
| Annual | 10 | 0 | IDP, budget — mixed priority |
| Event-driven | 25+ | 3 (coaching, feedback, decision) | **Incidents, goals — Tier 1** |
| Continuous | 10 | 2 (person, coaching) | Mostly covered or low-value |

### Key insight

The biggest gap is in the **quarterly-to-annual cadence range** — OKRs, SMART goals, performance review cycles, and PI objectives. These are high-stakes, deadline-driven documents where an EM most needs proactive nudging. The system currently excels at the continuous/event-driven layer (1:1s, coaching, feedback) but has no coverage of the structured lifecycle documents that have hard organizational deadlines.

---

## Part 6: Architectural Fit

All proposed expansions fit the existing architecture without modification:

1. **Filesystem-as-bus**: New `type:` values in new DATA_DIR subdirectories
2. **Frontmatter parsing**: `shared/frontmatter.py` handles all new types identically
3. **Management bridge**: New `_*_facts()` functions for each type
4. **Nudge collectors**: New `_collect_*_nudges()` functions following existing pattern
5. **Reactive engine**: Watcher already monitors all of DATA_DIR; new subdirectories are auto-detected
6. **ManagementSnapshot**: Add new state dataclasses (e.g., `OKRState`, `GoalState`, `IncidentState`)
7. **Demo data**: New seed files in `demo-data/` for each new type

No new infrastructure, no schema migrations, no API changes beyond adding new fields to existing endpoints.
