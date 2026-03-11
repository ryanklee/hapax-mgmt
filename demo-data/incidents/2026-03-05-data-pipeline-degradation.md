---
type: incident
title: Data pipeline processing delays
severity: sev2
status: mitigated
detected: "2026-03-05T09:15:00"
mitigated: "2026-03-05T11:30:00"
duration-minutes: 135
impact: Data processing delayed by 2+ hours, affecting downstream dashboards
root-cause: Memory pressure from concurrent batch jobs
owner: Lisa Chen
teams-affected:
  - Data
---
Mitigated by killing low-priority batch jobs. Still needs postmortem.
