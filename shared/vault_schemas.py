"""Pydantic models for vault document types (filesystem-as-bus schemas).

Each model corresponds to a ``type`` value in YAML frontmatter.  Field aliases
use hyphenated names matching the YAML conventions (e.g. ``last-1on1``).

``extra="ignore"`` allows organic field growth — agents can add frontmatter keys
that aren't yet modeled without breaking validation.
"""

import datetime as _dt
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# Type aliases to avoid field-name shadowing (a field called ``date`` would
# shadow the ``date`` type inside the class body).
Date = _dt.date
DateTime = _dt.datetime


class VaultDocBase(BaseModel):
    """Base model for all vault document types."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    type: str
    date: Date | None = None


# ---------------------------------------------------------------------------
# Person
# ---------------------------------------------------------------------------


class PersonDoc(VaultDocBase):
    type: Literal["person"]
    name: str
    team: str | None = None
    role: str | None = None
    cadence: Literal["weekly", "biweekly", "monthly"] | None = None
    status: Literal["active", "inactive"] = "active"
    last_1on1: Date | None = Field(default=None, alias="last-1on1")
    cognitive_load: str | None = Field(default=None, alias="cognitive-load")
    growth_vector: str | None = Field(default=None, alias="growth-vector")
    feedback_style: str | None = Field(default=None, alias="feedback-style")
    coaching_active: bool | None = Field(default=None, alias="coaching-active")
    career_goal_3y: str | None = Field(default=None, alias="career-goal-3y")
    current_gaps: str | None = Field(default=None, alias="current-gaps")
    current_focus: str | None = Field(default=None, alias="current-focus")
    last_career_convo: Date | None = Field(default=None, alias="last-career-convo")
    team_type: str | None = Field(default=None, alias="team-type")
    interaction_mode: str | None = Field(default=None, alias="interaction-mode")
    skill_level: str | None = Field(default=None, alias="skill-level")
    will_signal: str | None = Field(default=None, alias="will-signal")
    domains: list[str] = Field(default_factory=list)
    relationship: str | None = None


# ---------------------------------------------------------------------------
# Coaching / Feedback
# ---------------------------------------------------------------------------


class CoachingDoc(VaultDocBase):
    type: Literal["coaching"]
    person: str
    date: Date | None = None
    title: str | None = None
    status: str = "active"
    check_in_by: Date | None = Field(default=None, alias="check-in-by")


class FeedbackDoc(VaultDocBase):
    type: Literal["feedback"]
    person: str
    date: Date | None = None
    direction: Literal["given", "received"] = "given"
    category: str = "growth"
    follow_up_by: Date | None = Field(default=None, alias="follow-up-by")
    followed_up: bool = Field(default=False, alias="followed-up")
    title: str | None = None


# ---------------------------------------------------------------------------
# Meetings / Decisions
# ---------------------------------------------------------------------------


class MeetingDoc(VaultDocBase):
    type: Literal["meeting"]
    title: str | None = None
    date: Date | None = None
    attendees: list[str] = Field(default_factory=list)


class DecisionDoc(VaultDocBase):
    type: Literal["decision"]
    date: Date | None = None
    meeting_ref: str | None = Field(default=None, alias="meeting-ref")
    title: str | None = None


# ---------------------------------------------------------------------------
# Goals / OKRs
# ---------------------------------------------------------------------------


class GoalDoc(VaultDocBase):
    type: Literal["goal"]
    person: str | None = None
    framework: str = "smart"
    status: str = "active"
    category: str | None = None
    created: Date | None = None
    target_date: Date | None = Field(default=None, alias="target-date")
    last_reviewed: Date | None = Field(default=None, alias="last-reviewed")
    review_cadence: str = Field(default="quarterly", alias="review-cadence")
    specific: str | None = None
    measurable: str | None = None
    achievable: str | None = None
    relevant: str | None = None
    time_bound: str | None = Field(default=None, alias="time-bound")
    linked_okr: str | None = Field(default=None, alias="linked-okr")


class KeyResult(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: str | None = None
    description: str | None = None
    target: float | None = None
    current: float | None = None
    unit: str | None = None
    direction: str | None = None
    confidence: float | None = Field(default=None, ge=0, le=1)
    last_updated: Date | None = Field(default=None, alias="last-updated")


class OkrDoc(VaultDocBase):
    type: Literal["okr"]
    objective: str | None = None
    scope: str = "team"
    team: str | None = None
    person: str | None = None
    quarter: str | None = None
    status: str = "active"
    score: float | None = Field(default=None, ge=0, le=1)
    scored_at: Date | None = Field(default=None, alias="scored-at")
    key_results: list[KeyResult] = Field(default_factory=list, alias="key-results")


# ---------------------------------------------------------------------------
# Incidents / Postmortems
# ---------------------------------------------------------------------------


class IncidentDoc(VaultDocBase):
    type: Literal["incident"]
    title: str | None = None
    severity: str = "sev3"
    status: str = "detected"
    detected: DateTime | None = None
    mitigated: DateTime | None = None
    duration_minutes: int | None = Field(default=None, alias="duration-minutes")
    impact: str | None = None
    root_cause: str | None = Field(default=None, alias="root-cause")
    owner: str | None = None
    teams_affected: list[str] = Field(default_factory=list, alias="teams-affected")


class PostmortemActionDoc(VaultDocBase):
    type: Literal["postmortem-action"]
    title: str | None = None
    incident_ref: str | None = Field(default=None, alias="incident-ref")
    owner: str | None = None
    status: str = "open"
    priority: str = "medium"
    due_date: Date | None = Field(default=None, alias="due-date")
    completed_date: Date | None = Field(default=None, alias="completed-date")


# ---------------------------------------------------------------------------
# Review Cycles
# ---------------------------------------------------------------------------


class ReviewCycleDoc(VaultDocBase):
    type: Literal["review-cycle"]
    person: str | None = None
    cycle: str | None = None
    status: str = Field(default="not-started")
    self_assessment_due: Date | None = Field(default=None, alias="self-assessment-due")
    self_assessment_received: bool = Field(default=False, alias="self-assessment-received")
    peer_feedback_requested: str | None = Field(default=None, alias="peer-feedback-requested")
    peer_feedback_received: str | None = Field(default=None, alias="peer-feedback-received")
    review_due: Date | None = Field(default=None, alias="review-due")
    calibration_date: Date | None = Field(default=None, alias="calibration-date")
    delivered: bool = False


# ---------------------------------------------------------------------------
# Status Reports / Prep / Reference
# ---------------------------------------------------------------------------


class StatusReportDoc(VaultDocBase):
    type: Literal["status-report"]
    date: Date | None = None
    cadence: str | None = None
    direction: str = "upward"
    generated: bool = False
    edited: bool = False


class PrepDoc(VaultDocBase):
    type: Literal["prep"]
    person: str | None = None
    date: Date | None = None


class ReferenceDoc(VaultDocBase):
    # Reference uses a plain str type (not Literal) since subtypes vary.
    type: str  # type: ignore[assignment]
    name: str | None = None


# ---------------------------------------------------------------------------
# Schema registry
# ---------------------------------------------------------------------------

_SCHEMA_MAP: dict[str, type[VaultDocBase]] = {
    "person": PersonDoc,
    "coaching": CoachingDoc,
    "feedback": FeedbackDoc,
    "meeting": MeetingDoc,
    "decision": DecisionDoc,
    "goal": GoalDoc,
    "okr": OkrDoc,
    "incident": IncidentDoc,
    "postmortem-action": PostmortemActionDoc,
    "review-cycle": ReviewCycleDoc,
    "status-report": StatusReportDoc,
    "prep": PrepDoc,
    "reference": ReferenceDoc,
}


def resolve_schema(doc_type: str) -> type[VaultDocBase] | None:
    """Return the schema class for a given document type, or None if unknown."""
    return _SCHEMA_MAP.get(doc_type)
