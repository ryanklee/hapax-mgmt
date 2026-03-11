---
type: okr
scope: team
team: Platform
quarter: 2026-Q1
status: active
objective: Improve platform reliability to 99.95% uptime
key-results:
  - id: kr1
    description: Reduce P99 latency below 200ms
    target: 200
    current: 310
    unit: ms
    direction: decrease
    confidence: 0.4
    last-updated: 2026-02-28
  - id: kr2
    description: Achieve 99.95% uptime SLA
    target: 99.95
    current: 99.91
    unit: percent
    direction: increase
    confidence: 0.6
    last-updated: 2026-03-05
  - id: kr3
    description: Zero SEV1 incidents in Q1
    target: 0
    current: 1
    unit: count
    direction: decrease
    confidence: 0.3
    last-updated: 2026-03-01
---
Platform team Q1 reliability OKR. KR1 at risk due to legacy service migration delays. KR3 missed after February API gateway outage.
