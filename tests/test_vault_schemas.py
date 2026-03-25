"""Tests for shared/vault_schemas.py — Pydantic models for vault document types."""

from __future__ import annotations

from datetime import date

import pytest
from pydantic import ValidationError

from shared.vault_schemas import (
    CoachingDoc,
    FeedbackDoc,
    IncidentDoc,
    KeyResult,
    OkrDoc,
    PersonDoc,
    PrepDoc,
    resolve_schema,
)


class TestPersonDoc:
    def test_person_doc_valid(self):
        doc = PersonDoc(type="person", name="Alice", team="eng", role="senior")
        assert doc.name == "Alice"
        assert doc.team == "eng"
        assert doc.status == "active"
        assert doc.domains == []

    def test_person_doc_rejects_bad_cadence(self):
        with pytest.raises(ValidationError):
            PersonDoc(type="person", name="Bob", cadence="daily")

    def test_person_doc_ignores_extra_fields(self):
        doc = PersonDoc.model_validate({"type": "person", "name": "Carol", "surprise": "ignored"})
        assert doc.name == "Carol"
        assert not hasattr(doc, "surprise")


class TestCoachingDoc:
    def test_coaching_doc_valid(self):
        doc = CoachingDoc(type="coaching", person="Alice", date=date(2026, 3, 1))
        assert doc.person == "Alice"
        assert doc.date == date(2026, 3, 1)
        assert doc.status == "active"


class TestFeedbackDoc:
    def test_feedback_doc_defaults(self):
        doc = FeedbackDoc(type="feedback", person="Alice")
        assert doc.direction == "given"
        assert doc.category == "growth"
        assert doc.followed_up is False


class TestIncidentDoc:
    def test_incident_doc_valid(self):
        doc = IncidentDoc(type="incident", title="DNS outage")
        assert doc.severity == "sev3"
        assert doc.status == "detected"
        assert doc.teams_affected == []


class TestOkrDoc:
    def test_okr_doc_with_key_results(self):
        kr = KeyResult(id="kr1", description="Ship v2", target=1.0, current=0.5, confidence=0.8)
        doc = OkrDoc(type="okr", objective="Launch product", key_results=[kr])
        assert len(doc.key_results) == 1
        assert doc.key_results[0].confidence == 0.8
        assert doc.score is None


class TestResolveSchema:
    def test_resolve_schema_by_type(self):
        assert resolve_schema("person") is PersonDoc
        assert resolve_schema("coaching") is CoachingDoc
        assert resolve_schema("prep") is PrepDoc

    def test_resolve_schema_unknown(self):
        assert resolve_schema("nonexistent") is None
