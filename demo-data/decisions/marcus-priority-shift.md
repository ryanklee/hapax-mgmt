---
type: decision
date: "2026-03-03"
title: Prioritize connection pool fix
meeting_ref: 2026-03-03-platform-standup
---

Decision: Marcus to focus on API gateway connection pool leak this sprint,
deferring the new rate limiting feature to next sprint.

Rationale: Connection pool leak causes intermittent 503s under load.
Production stability takes priority over new features.

Owner: Marcus Johnson
